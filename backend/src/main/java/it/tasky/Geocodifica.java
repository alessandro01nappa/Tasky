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
import java.util.Map;
import java.util.List;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

/**
 * Traduce un indirizzo scritto a mano in coordinate, appoggiandosi a Nominatim
 * di OpenStreetMap. E' gratuito e senza chiave, ma chiede due cose: farsi
 * riconoscere e non superare una richiesta al secondo. Le risposte finiscono in
 * tabella, cosi' lo stesso indirizzo si chiede una volta sola.
 */
@Service
public class Geocodifica {

    private static final Logger log = LoggerFactory.getLogger(Geocodifica.class);

    private static final String INDIRIZZO_SERVIZIO = "https://nominatim.openstreetmap.org/search";
    private static final String AGENTE = "Tasky/0.1 (https://github.com/alessandro01nappa/Tasky)";
    private static final long PAUSA_FRA_CHIAMATE_MS = 1100;

    public record Posizione(double latitudine, double longitudine, String indirizzo, String citta) {}

    private final LuogoRepository luoghi;
    private final HttpClient client =
            HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build();
    private final ObjectMapper json = new ObjectMapper();

    private long ultimaChiamata;

    public Geocodifica(LuogoRepository luoghi) {
        this.luoghi = luoghi;
    }

    /** I primi posti che somigliano a quello che si sta scrivendo, per farlo scegliere. */
    public List<Posizione> suggerisci(String testo) {
        if (testo == null || testo.trim().length() < 3) {
            return List.of();
        }
        List<Posizione> trovati = chiedi(testo, 8);
        Map<String, Posizione> senzaDoppioni = new LinkedHashMap<>();
        trovati.forEach(p -> senzaDoppioni.putIfAbsent(p.indirizzo(), p));
        return senzaDoppioni.values().stream().limit(5).toList();
    }

    /** Vuoto se l'indirizzo non esiste o se il servizio non risponde: non e' un errore bloccante. */
    public Optional<Posizione> cerca(String testo) {
        if (testo == null || testo.isBlank()) {
            return Optional.empty();
        }
        String chiave = testo.trim().toLowerCase();
        Optional<Luogo> memoria = luoghi.findByCercato(chiave);
        if (memoria.isPresent()) {
            return memoria.map(Geocodifica::posizione);
        }
        return chiedi(testo, 1).stream().findFirst().map(trovato -> {
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

    private List<Posizione> chiedi(String testo, int quanti) {
        String url = INDIRIZZO_SERVIZIO
                + "?q=" + URLEncoder.encode(testo, StandardCharsets.UTF_8)
                + "&format=jsonv2&addressdetails=1&limit=" + quanti + "&countrycodes=it";
        try {
            aspettaIlTurno();
            HttpRequest richiesta = HttpRequest.newBuilder(URI.create(url))
                    .header("User-Agent", AGENTE)
                    .header("Accept-Language", "it")
                    .timeout(Duration.ofSeconds(8))
                    .GET()
                    .build();
            HttpResponse<String> risposta = client.send(richiesta, HttpResponse.BodyHandlers.ofString());
            if (risposta.statusCode() != 200) {
                log.warn("Nominatim ha risposto {} per \"{}\"", risposta.statusCode(), testo);
                return List.of();
            }
            JsonNode risultati = json.readTree(risposta.body());
            if (!risultati.isArray()) {
                return List.of();
            }
            List<Posizione> posti = new ArrayList<>();
            for (JsonNode voce : risultati) {
                posti.add(new Posizione(
                        voce.get("lat").asDouble(),
                        voce.get("lon").asDouble(),
                        voce.get("display_name").asString(),
                        comune(voce.get("address"))));
            }
            return posti;
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return List.of();
        } catch (Exception e) {
            log.warn("Nominatim non raggiungibile per \"{}\": {}", testo, e.getMessage());
            return List.of();
        }
    }

    /** Il comune ha nomi diversi a seconda di quanto e' grande il posto. */
    private static String comune(JsonNode indirizzo) {
        if (indirizzo == null) {
            return null;
        }
        for (String campo : new String[] {"city", "town", "village", "municipality", "county"}) {
            JsonNode valore = indirizzo.get(campo);
            if (valore != null && !valore.asString().isBlank()) {
                return valore.asString();
            }
        }
        return null;
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
                luogo.getLatitudine(), luogo.getLongitudine(), luogo.getIndirizzo(), luogo.getCitta());
    }
}
