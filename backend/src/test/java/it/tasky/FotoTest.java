package it.tasky;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.ByteArrayOutputStream;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.jdbc.core.JdbcTemplate;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

/**
 * Le foto di una richiesta raccontano una casa: qui si controlla soprattutto
 * chi non deve vederle e chi non deve poterle togliere.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class FotoTest {

    private static final String PREFISSO = "foto-e2e-";
    private static final String UTENTI_DI_TEST = "select id from utenti where email like '" + PREFISSO + "%'";

    @LocalServerPort
    private int porta;

    @Autowired
    private JdbcTemplate jdbc;

    private final HttpClient client = HttpClient.newHttpClient();
    private final ObjectMapper json = new ObjectMapper();

    @AfterEach
    void pulisci() {
        String richiesteDiTest = "select id from richieste_servizio where cliente_id in (" + UTENTI_DI_TEST + ")";
        jdbc.update("delete from foto where richiesta_id in (" + richiesteDiTest + ")");
        jdbc.update("delete from candidature where richiesta_id in (" + richiesteDiTest + ")");
        jdbc.update("delete from richieste_servizio where cliente_id in (" + UTENTI_DI_TEST + ")");
        String profiliDiTest = "select id from profili_fornitore where utente_id in (" + UTENTI_DI_TEST + ")";
        jdbc.update("delete from tariffe_fornitore where profilo_fornitore_id in (" + profiliDiTest + ")");
        jdbc.update("delete from attivita_fornitore where profilo_fornitore_id in (" + profiliDiTest + ")");
        jdbc.update("delete from categorie_fornitore where profilo_fornitore_id in (" + profiliDiTest + ")");
        jdbc.update("delete from profili_fornitore where utente_id in (" + UTENTI_DI_TEST + ")");
        jdbc.update("delete from utenti where email like '" + PREFISSO + "%'");
    }

    @Test
    void ilClienteCaricaLaFotoELaRivedeNellaRichiesta() {
        String cliente = registra("cliente");
        long richiestaId = creaRichiesta(cliente);

        Risposta caricata = caricaFoto(richiestaId, cliente, "image/jpeg");
        assertThat(caricata.stato()).isEqualTo(200);
        assertThat(caricata.json().get("tipo").asString()).isEqualTo("image/jpeg");

        JsonNode richiesta = get("/api/richieste/" + richiestaId, cliente).json();
        assertThat(richiesta.get("foto")).hasSize(1);

        long fotoId = richiesta.get("foto").get(0).get("id").asLong();
        Risposta contenuto = get("/api/foto/" + fotoId, cliente);
        assertThat(contenuto.stato()).isEqualTo(200);
    }

    @Test
    void unTaskerApprovatoVedeLeFotoDiUnaRichiestaAperta() {
        String cliente = registra("cliente2");
        long richiestaId = creaRichiesta(cliente);
        long fotoId = caricaFoto(richiestaId, cliente, "image/jpeg").json().get("id").asLong();

        String tasker = registraTaskerApprovato("tasker");
        assertThat(get("/api/foto/" + fotoId, tasker).stato()).isEqualTo(200);
    }

    @Test
    void chiNonEUnTaskerApprovatoNonVedeLeFoto() {
        String cliente = registra("cliente3");
        long richiestaId = creaRichiesta(cliente);
        long fotoId = caricaFoto(richiestaId, cliente, "image/jpeg").json().get("id").asLong();

        String passante = registra("passante");
        // 404 e non 403: non si conferma nemmeno che quella foto esista
        assertThat(get("/api/foto/" + fotoId, passante).stato()).isEqualTo(404);
        assertThat(get("/api/foto/" + fotoId, null).stato()).isEqualTo(401);
    }

    @Test
    void nonSiCaricaSullaRichiestaDiUnAltro() {
        String cliente = registra("cliente4");
        long richiestaId = creaRichiesta(cliente);

        String estraneo = registra("estraneo");
        assertThat(caricaFoto(richiestaId, estraneo, "image/jpeg").stato()).isEqualTo(403);
    }

    @Test
    void siCaricanoSoloImmagini() {
        String cliente = registra("cliente5");
        long richiestaId = creaRichiesta(cliente);

        Risposta rifiutata = caricaFoto(richiestaId, cliente, "application/pdf");
        assertThat(rifiutata.stato()).isEqualTo(400);
        assertThat(rifiutata.corpo()).contains("jpeg");
    }

    @Test
    void oltreCinqueFotoNonSeNeAggiungonoAltre() {
        String cliente = registra("cliente6");
        long richiestaId = creaRichiesta(cliente);

        for (int i = 0; i < 5; i++) {
            assertThat(caricaFoto(richiestaId, cliente, "image/jpeg").stato()).isEqualTo(200);
        }
        Risposta sesta = caricaFoto(richiestaId, cliente, "image/jpeg");
        assertThat(sesta.stato()).isEqualTo(409);
        assertThat(sesta.corpo()).contains("massimo");
    }

    @Test
    void soloIlClienteToglieLeSueFoto() {
        String cliente = registra("cliente7");
        long richiestaId = creaRichiesta(cliente);
        long fotoId = caricaFoto(richiestaId, cliente, "image/jpeg").json().get("id").asLong();

        String estraneo = registra("estraneo2");
        assertThat(invia("DELETE", "/api/richieste/" + richiestaId + "/foto/" + fotoId, null, estraneo)
                        .stato())
                .isEqualTo(403);

        assertThat(invia("DELETE", "/api/richieste/" + richiestaId + "/foto/" + fotoId, null, cliente)
                        .stato())
                .isEqualTo(200);
        assertThat(get("/api/richieste/" + richiestaId, cliente).json().get("foto")).isEmpty();
    }

    // ---- aiuti ----------------------------------------------------------------

    /** Un jpeg vero in miniatura: bastano i primi byte perche' sia riconoscibile. */
    private static byte[] immagineFinta() {
        return new byte[] {(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0, 0, 16, 'J', 'F', 'I', 'F', 0};
    }

    private Risposta caricaFoto(long richiestaId, String token, String tipo) {
        String confine = "----tasky" + System.nanoTime();
        byte[] corpo = corpoMultipart(confine, tipo);
        HttpRequest.Builder richiesta = HttpRequest.newBuilder()
                .uri(URI.create("http://localhost:" + porta + "/api/richieste/" + richiestaId + "/foto"))
                .header("Content-Type", "multipart/form-data; boundary=" + confine)
                .POST(HttpRequest.BodyPublishers.ofByteArray(corpo));
        if (token != null) {
            richiesta.header("Authorization", "Bearer " + token);
        }
        try {
            HttpResponse<String> risposta = client.send(richiesta.build(), HttpResponse.BodyHandlers.ofString());
            String testo = risposta.body();
            return new Risposta(
                    risposta.statusCode(), testo, testo == null || testo.isBlank() ? null : json.readTree(testo));
        } catch (Exception e) {
            throw new IllegalStateException("Caricamento fallito", e);
        }
    }

    private static byte[] corpoMultipart(String confine, String tipo) {
        String nome = tipo.equals("application/pdf") ? "documento.pdf" : "guasto.jpg";
        String testa = "--" + confine + "\r\n"
                + "Content-Disposition: form-data; name=\"file\"; filename=\"" + nome + "\"\r\n"
                + "Content-Type: " + tipo + "\r\n\r\n";
        String coda = "\r\n--" + confine + "--\r\n";
        ByteArrayOutputStream fuori = new ByteArrayOutputStream();
        try {
            fuori.write(testa.getBytes(StandardCharsets.UTF_8));
            fuori.write(immagineFinta());
            fuori.write(coda.getBytes(StandardCharsets.UTF_8));
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
        return fuori.toByteArray();
    }

    private long creaRichiesta(String token) {
        long categoriaId = get("/api/categorie", token).json().get(0).get("id").asLong();
        return post(
                        "/api/richieste",
                        "{\"categoriaId\":" + categoriaId
                                + ",\"titolo\":\"Perde il rubinetto\",\"descrizione\":\"Gocciola\",\"citta\":\"Milano\"}",
                        token)
                .json()
                .get("id")
                .asLong();
    }

    private String registraTaskerApprovato(String nome) {
        String token = registra(nome);
        long categoriaId = get("/api/categorie", token).json().get(0).get("id").asLong();
        post(
                "/api/fornitore",
                "{\"descrizione\":\"Esperienza\",\"zonaOperativa\":\"Milano\",\"categorieIds\":[" + categoriaId + "]}",
                token);
        jdbc.update("update profili_fornitore set stato = 'APPROVATO' where utente_id in (" + UTENTI_DI_TEST + ")");
        return token;
    }

    private String registra(String nome) {
        String email = PREFISSO + nome + "@esempio.it";
        post(
                "/api/registrazione",
                "{\"email\":\"" + email + "\",\"password\":\"segreta123\",\"nomeCompleto\":\"Utente " + nome + "\"}",
                null);
        return post("/api/login", "{\"email\":\"" + email + "\",\"password\":\"segreta123\"}", null)
                .json()
                .get("token")
                .asString();
    }

    private record Risposta(int stato, String corpo, JsonNode json) {}

    /** Il contenuto di una foto sono byte, non JSON: qui non e' un errore. */
    private JsonNode comeJson(String testo) {
        if (testo == null || testo.isBlank()) {
            return null;
        }
        try {
            return json.readTree(testo);
        } catch (Exception non_e_json) {
            return null;
        }
    }

    private Risposta get(String percorso, String token) {
        return invia("GET", percorso, null, token);
    }

    private Risposta post(String percorso, String corpo, String token) {
        return invia("POST", percorso, corpo, token);
    }

    private Risposta invia(String metodo, String percorso, String corpo, String token) {
        HttpRequest.Builder richiesta = HttpRequest.newBuilder()
                .uri(URI.create("http://localhost:" + porta + percorso))
                .header("Content-Type", "application/json")
                .method(
                        metodo,
                        corpo == null
                                ? HttpRequest.BodyPublishers.noBody()
                                : HttpRequest.BodyPublishers.ofString(corpo));
        if (token != null) {
            richiesta.header("Authorization", "Bearer " + token);
        }
        try {
            HttpResponse<String> risposta = client.send(richiesta.build(), HttpResponse.BodyHandlers.ofString());
            String testo = risposta.body();
            return new Risposta(risposta.statusCode(), testo, comeJson(testo));
        } catch (Exception e) {
            throw new IllegalStateException("Chiamata fallita: " + metodo + " " + percorso, e);
        }
    }
}
