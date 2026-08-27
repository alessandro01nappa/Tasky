package it.tasky;

import static org.assertj.core.api.Assertions.assertThat;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.jdbc.core.JdbcTemplate;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class DisponibilitaTest {

    private static final String PREFISSO = "disp-e2e-";
    private static final String UTENTI_DI_TEST = "select id from utenti where email like '" + PREFISSO + "%'";

    @LocalServerPort
    private int porta;

    @Autowired
    private JdbcTemplate jdbc;

    private final HttpClient client = HttpClient.newHttpClient();
    private final ObjectMapper json = new ObjectMapper();

    @AfterEach
    void pulisci() {
        String profiliDiTest = "select id from profili_fornitore where utente_id in (" + UTENTI_DI_TEST + ")";
        jdbc.update("delete from fasce_disponibilita where profilo_fornitore_id in (" + profiliDiTest + ")");
        jdbc.update("delete from assenze where profilo_fornitore_id in (" + profiliDiTest + ")");
        jdbc.update("delete from tariffe_fornitore where profilo_fornitore_id in (" + profiliDiTest + ")");
        jdbc.update("delete from attivita_fornitore where profilo_fornitore_id in (" + profiliDiTest + ")");
        jdbc.update("delete from categorie_fornitore where profilo_fornitore_id in (" + profiliDiTest + ")");
        jdbc.update("delete from profili_fornitore where utente_id in (" + UTENTI_DI_TEST + ")");
        jdbc.update("delete from utenti where email like '" + PREFISSO + "%'");
    }

    @Test
    void ilTaskerDichiaraLeSueFasceEIlClienteLeVede() {
        String tasker = registraTaskerApprovato("orari");

        Risposta salvate = put(
                "/api/fornitore/disponibilita",
                """
                [{"giorno":"MONDAY","dalle":"08:00","alle":"13:00"},
                 {"giorno":"MONDAY","dalle":"14:00","alle":"18:00"},
                 {"giorno":"SATURDAY","dalle":"09:00","alle":"13:00"}]""",
                tasker);
        assertThat(salvate.stato()).isEqualTo(200);
        assertThat(salvate.json().get("fasce")).hasSize(3);

        // la stessa giornata puo' avere due fasce, con la pausa in mezzo
        JsonNode prima = salvate.json().get("fasce").get(0);
        assertThat(prima.get("giorno").asString()).isEqualTo("MONDAY");
        assertThat(prima.get("dalle").asString()).startsWith("08:00");

        // e chi cerca le legge nell'elenco
        String cliente = registra("cliente");
        JsonNode voce = trova(get("/api/fornitore/elenco?quante=100", cliente).json().get("voci"), "Utente orari");
        assertThat(voce.get("disponibilita")).hasSize(3);
    }

    @Test
    void riscrivereLeFasceSostituisceLeVecchie() {
        String tasker = registraTaskerApprovato("cambia");

        put("/api/fornitore/disponibilita", "[{\"giorno\":\"MONDAY\",\"dalle\":\"08:00\",\"alle\":\"18:00\"}]", tasker);
        Risposta seconda = put(
                "/api/fornitore/disponibilita",
                "[{\"giorno\":\"FRIDAY\",\"dalle\":\"09:00\",\"alle\":\"12:00\"}]",
                tasker);

        // non si accumulano: e' una griglia che si riscrive
        assertThat(seconda.json().get("fasce")).hasSize(1);
        assertThat(seconda.json().get("fasce").get(0).get("giorno").asString()).isEqualTo("FRIDAY");
    }

    @Test
    void unaFasciaCheFinisceQuandoCominciaNonSiSalva() {
        String tasker = registraTaskerApprovato("assurdo");

        Risposta rifiutata = put(
                "/api/fornitore/disponibilita",
                "[{\"giorno\":\"MONDAY\",\"dalle\":\"18:00\",\"alle\":\"09:00\"}]",
                tasker);
        assertThat(rifiutata.stato()).isEqualTo(400);
        assertThat(rifiutata.corpo()).contains("finire dopo");
    }

    @Test
    void leAssenzeSiAggiungonoESiTolgono() {
        String tasker = registraTaskerApprovato("ferie");

        Risposta aggiunta = post(
                "/api/fornitore/disponibilita/assenze",
                "{\"dal\":\"2026-09-01\",\"al\":\"2026-09-15\",\"motivo\":\"Ferie\"}",
                tasker);
        assertThat(aggiunta.stato()).isEqualTo(200);

        long id = aggiunta.json().get("id").asLong();
        assertThat(get("/api/fornitore/disponibilita", tasker).json().get("assenze")).hasSize(1);

        assertThat(invia("DELETE", "/api/fornitore/disponibilita/assenze/" + id, null, tasker)
                        .stato())
                .isEqualTo(200);
        assertThat(get("/api/fornitore/disponibilita", tasker).json().get("assenze")).isEmpty();
    }

    @Test
    void unAssenzaAlContrarioNonSiSalva() {
        String tasker = registraTaskerApprovato("confuso");

        Risposta rifiutata = post(
                "/api/fornitore/disponibilita/assenze",
                "{\"dal\":\"2026-09-15\",\"al\":\"2026-09-01\"}",
                tasker);
        assertThat(rifiutata.stato()).isEqualTo(400);
    }

    @Test
    void nonSiToccaLAssenzaDiUnAltro() {
        String primo = registraTaskerApprovato("primo");
        long id = post(
                        "/api/fornitore/disponibilita/assenze",
                        "{\"dal\":\"2026-10-01\",\"al\":\"2026-10-05\"}",
                        primo)
                .json()
                .get("id")
                .asLong();

        String secondo = registraTaskerApprovato("secondo");
        assertThat(invia("DELETE", "/api/fornitore/disponibilita/assenze/" + id, null, secondo)
                        .stato())
                .isEqualTo(403);
    }

    @Test
    void senzaProfiloTaskerNonCEDisponibilitaDaDichiarare() {
        String cliente = registra("solocliente");
        assertThat(get("/api/fornitore/disponibilita", cliente).stato()).isEqualTo(404);
    }

    // ---- aiuti ----------------------------------------------------------------

    private JsonNode trova(JsonNode elenco, String nome) {
        return elenco.valueStream()
                .filter(voce -> nome.equals(voce.get("nome").asString()))
                .findFirst()
                .orElseThrow(() -> new AssertionError("non trovato: " + nome));
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

    private Risposta get(String percorso, String token) {
        return invia("GET", percorso, null, token);
    }

    private Risposta post(String percorso, String corpo, String token) {
        return invia("POST", percorso, corpo, token);
    }

    private Risposta put(String percorso, String corpo, String token) {
        return invia("PUT", percorso, corpo, token);
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
            JsonNode albero = testo == null || testo.isBlank() ? null : json.readTree(testo);
            return new Risposta(risposta.statusCode(), testo, albero);
        } catch (Exception e) {
            throw new IllegalStateException("Chiamata fallita: " + metodo + " " + percorso, e);
        }
    }
}
