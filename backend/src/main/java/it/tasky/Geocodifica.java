package it.tasky;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

/**
 * Traduce un posto scritto a mano in coordinate, appoggiandosi a Photon di
 * Komoot. E' gratuito, senza chiave, e cerca anche per pezzi di parola: "Frasc"
 * trova Frascati. Le risposte finiscono in tabella, cosi' lo stesso testo si
 * chiede una volta sola.
 */
@Service
public class Geocodifica {

    private static final Logger log = LoggerFactory.getLogger(Geocodifica.class);

    private static final String INDIRIZZO_SERVIZIO = "https://photon.komoot.io/api/";
    private static final String AGENTE = "Tasky/0.1 (https://github.com/alessandro01nappa/Tasky)";
    /** L'Italia in un rettangolo: fuori non cerchiamo. */
    private static final String ITALIA = "6.6,35.4,18.6,47.1";
    /** Sotto l'uno il suggerimento sulla posizione conta davvero: le vie vicine vengono prima. */
    private static final String PESO_VICINANZA = "0.2";
    private static final long PAUSA_FRA_CHIAMATE_MS = 300;

    /**
     * nome e' il pezzo che identifica il posto: la via col civico, o il nome del
     * comune. Serve a mostrare cosa si e' scelto senza rileggere tutto l'indirizzo.
     */
    public record Posizione(
            double latitudine, double longitudine, String nome, String indirizzo, String citta) {}

    private final LuogoRepository luoghi;
    private final HttpClient client =
            HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build();
    private final ObjectMapper json = new ObjectMapper();

    private long ultimaChiamata;

    public Geocodifica(LuogoRepository luoghi) {
        this.luoghi = luoghi;
    }

    /**
     * I posti che somigliano a quello che si sta scrivendo. Se sappiamo da dove
     * guarda chi cerca, le vie vicine a lui vengono prima: senza quell'aiuto
     * "Via Nazionale" propone mezza Italia.
     */
    public List<Posizione> suggerisci(String testo, Double lat, Double lon) {
        if (testo == null || testo.trim().length() < 3) {
            return List.of();
        }
        Map<String, Posizione> senzaDoppioni = new LinkedHashMap<>();
        chiedi(testo, 15, lat, lon).forEach(p -> senzaDoppioni.putIfAbsent(p.indirizzo(), p));
        return senzaDoppioni.values().stream().limit(5).toList();
    }

    /** Vuoto se il posto non esiste o se il servizio non risponde: non e' un errore bloccante. */
    public Optional<Posizione> cerca(String testo) {
        if (testo == null || testo.isBlank()) {
            return Optional.empty();
        }
        String chiave = testo.trim().toLowerCase();
        Optional<Luogo> memoria = luoghi.findByCercato(chiave);
        if (memoria.isPresent()) {
            return memoria.map(Geocodifica::posizione);
        }
        return chiedi(testo, 1, null, null).stream().findFirst().map(trovato -> {
            Luogo luogo = new Luogo();
            luogo.setCercato(chiave);
            luogo.setLatitudine(trovato.latitudine());
            luogo.setLongitudine(trovato.longitudine());
            luogo.setIndirizzo(trovato.indirizzo());
            luogo.setCitta(trovato.citta());
            luoghi.save(luogo);
            return trovato;
        });
    }

    private List<Posizione> chiedi(String testo, int quanti, Double lat, Double lon) {
        StringBuilder url = new StringBuilder(INDIRIZZO_SERVIZIO)
                .append("?q=").append(URLEncoder.encode(testo, StandardCharsets.UTF_8))
                .append("&limit=").append(quanti)
                .append("&lang=default")
                .append("&bbox=").append(ITALIA);
        if (lat != null && lon != null) {
            url.append("&lat=").append(lat).append("&lon=").append(lon)
                    .append("&location_bias_scale=").append(PESO_VICINANZA);
        }
        try {
            aspettaIlTurno();
            HttpRequest richiesta = HttpRequest.newBuilder(URI.create(url.toString()))
                    .header("User-Agent", AGENTE)
                    .timeout(Duration.ofSeconds(8))
                    .GET()
                    .build();
            HttpResponse<String> risposta = client.send(richiesta, HttpResponse.BodyHandlers.ofString());
            if (risposta.statusCode() != 200) {
                log.warn("Photon ha risposto {} per \"{}\"", risposta.statusCode(), testo);
                return List.of();
            }
            JsonNode trovati = json.readTree(risposta.body()).get("features");
            if (trovati == null || !trovati.isArray()) {
                return List.of();
            }
            List<Posizione> posti = new ArrayList<>();
            for (JsonNode voce : trovati) {
                JsonNode dati = voce.get("properties");
                // il rettangolo che passiamo a Photon sposta l'ordine ma non esclude:
                // senza questo controllo escono paesi svizzeri e croati
                if (!"IT".equals(testo(dati, "countrycode"))) {
                    continue;
                }
                JsonNode punto = voce.get("geometry").get("coordinates");
                posti.add(new Posizione(
                        punto.get(1).asDouble(),
                        punto.get(0).asDouble(),
                        nomeDi(dati),
                        scrivi(dati),
                        comune(dati)));
            }
            return posti;
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return List.of();
        } catch (Exception e) {
            log.warn("Photon non raggiungibile per \"{}\": {}", testo, e.getMessage());
            return List.of();
        }
    }

    /** La via col civico, oppure il nome del posto se non e' un indirizzo. */
    private static String nomeDi(JsonNode dati) {
        String via = testo(dati, "street");
        if (via == null) {
            return testo(dati, "name");
        }
        String civico = testo(dati, "housenumber");
        return civico == null ? via : via + " " + civico;
    }

    /** Photon manda i pezzi separati: qui tornano a essere un indirizzo leggibile. */
    private static String scrivi(JsonNode dati) {
        String primo = nomeDi(dati);

        LinkedHashSet<String> pezzi = new LinkedHashSet<>();
        if (primo != null) {
            pezzi.add(primo);
        }
        for (String campo : new String[] {"city", "district", "postcode", "county", "state", "country"}) {
            String valore = testo(dati, campo);
            if (valore != null) {
                pezzi.add(valore);
            }
        }
        return String.join(", ", pezzi);
    }

    /** Il comune ha nomi diversi a seconda di quanto e' grande il posto. */
    private static String comune(JsonNode dati) {
        String citta = testo(dati, "city");
        if (citta != null) {
            return citta;
        }
        // per un comune intero Photon non riempie "city": il nome e' quello del posto
        if ("place".equals(testo(dati, "osm_key"))) {
            return testo(dati, "name");
        }
        return testo(dati, "county");
    }

    private static String testo(JsonNode dati, String campo) {
        JsonNode valore = dati == null ? null : dati.get(campo);
        return valore == null || valore.asString().isBlank() ? null : valore.asString();
    }

    private synchronized void aspettaIlTurno() throws InterruptedException {
        long attesa = ultimaChiamata + PAUSA_FRA_CHIAMATE_MS - System.currentTimeMillis();
        if (attesa > 0) {
            Thread.sleep(attesa);
        }
        ultimaChiamata = System.currentTimeMillis();
    }

    private static Posizione posizione(Luogo luogo) {
        return new Posizione(
                luogo.getLatitudine(),
                luogo.getLongitudine(),
                luogo.getCitta(),
                luogo.getIndirizzo(),
                luogo.getCitta());
    }
}
