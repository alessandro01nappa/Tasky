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

/**
 * L'amministrazione e' la parte dove sbagliare i permessi costa di piu': qui si
 * controlla soprattutto chi NON deve poter fare le cose.
 */
@SpringBootTest(
        webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
        properties = "tasky.amministratori=amm-e2e-capo@esempio.it")
class AmministrazioneTest {

    private static final String PREFISSO = "amm-e2e-";
    private static final String CAPO = PREFISSO + "capo@esempio.it";
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
    void chiNonEAmministratoreNonSaNemmenoCheLaSezioneEsiste() {
        String chiunque = registra("passante");

        // 404 e non 403: non si conferma l'esistenza di una porta a chi non deve entrarci
        assertThat(get("/api/amministrazione/fornitori", chiunque).stato()).isEqualTo(404);
        assertThat(get("/api/amministrazione/utenti", chiunque).stato()).isEqualTo(404);
        assertThat(post("/api/amministrazione/utenti/1/riattiva", null, chiunque).stato())
                .isEqualTo(404);
        // e senza credenziali resta un 401
        assertThat(get("/api/amministrazione/fornitori", null).stato()).isEqualTo(401);
    }

    @Test
    void ilProfiloCompletoRestaInAttesaFinchePersonaNonLoGuarda() {
        String tasker = registraTaskerCompleto("aspirante");

        JsonNode profilo = get("/api/fornitore", tasker).json();
        assertThat(profilo.get("stato").asString()).isEqualTo("IN_ATTESA");

        // e finche' e' in attesa non compare fra gli esperti
        assertThat(nomiNellElenco(tasker)).doesNotContain("Utente aspirante");
    }

    @Test
    void lAmministratoreApprovaEIlTaskerCompareFraGliEsperti() {
        String tasker = registraTaskerCompleto("bravo");
        String capo = entraComeCapo();

        JsonNode inAttesa = get("/api/amministrazione/fornitori", capo).json();
        JsonNode voce = trova(inAttesa, "Utente bravo");
        assertThat(voce.get("completo").asBoolean()).isTrue();
        assertThat(voce.get("telefono").asString()).isEqualTo("3331234567");

        long id = voce.get("id").asLong();
        assertThat(post("/api/amministrazione/fornitori/" + id + "/approva", null, capo).stato())
                .isEqualTo(200);

        assertThat(get("/api/fornitore", tasker).json().get("stato").asString()).isEqualTo("APPROVATO");
        assertThat(nomiNellElenco(tasker)).contains("Utente bravo");
    }

    @Test
    void unProfiloIncompletoNonSiApprova() {
        String token = registra("incompleto");
        long categoriaId = get("/api/categorie", token).json().get(0).get("id").asLong();
        post("/api/fornitore", "{\"descrizione\":\"Poco\",\"zonaOperativa\":\"Milano\",\"categorieIds\":["
                + categoriaId + "]}", token);

        String capo = entraComeCapo();
        long id = trova(get("/api/amministrazione/fornitori", capo).json(), "Utente incompleto")
                .get("id")
                .asLong();

        assertThat(post("/api/amministrazione/fornitori/" + id + "/approva", null, capo).stato())
                .isEqualTo(409);
    }

    @Test
    void ilRifiutoSpiegaAlTaskerCosaNonVa() {
        String tasker = registraTaskerCompleto("respinto");
        String capo = entraComeCapo();
        long id = trova(get("/api/amministrazione/fornitori", capo).json(), "Utente respinto")
                .get("id")
                .asLong();

        assertThat(post(
                                "/api/amministrazione/fornitori/" + id + "/rifiuta",
                                "{\"motivo\":\"Il numero di telefono non risponde\"}",
                                capo)
                        .stato())
                .isEqualTo(200);

        JsonNode profilo = get("/api/fornitore", tasker).json();
        assertThat(profilo.get("stato").asString()).isEqualTo("RIFIUTATO");
        assertThat(profilo.get("motivoRifiuto").asString()).isEqualTo("Il numero di telefono non risponde");

        // rifiutare senza dire perche' non si puo'
        assertThat(post("/api/amministrazione/fornitori/" + id + "/rifiuta", "{\"motivo\":\"\"}", capo)
                        .stato())
                .isEqualTo(400);
    }

    @Test
    void unUtenteSospesoNonEntraENonOpera() {
        String cattivo = registra("cattivo");
        String capo = entraComeCapo();
        long id = trova(get("/api/amministrazione/utenti", capo).json(), "Utente cattivo")
                .get("id")
                .asLong();

        assertThat(post(
                                "/api/amministrazione/utenti/" + id + "/sospendi",
                                "{\"motivo\":\"Annunci falsi\"}",
                                capo)
                        .stato())
                .isEqualTo(200);

        // il token che aveva gia' in mano non vale piu'
        Risposta conIlVecchioToken = get("/api/richieste/mie", cattivo);
        assertThat(conIlVecchioToken.stato()).isEqualTo(403);
        assertThat(conIlVecchioToken.corpo()).contains("Annunci falsi");

        // e non puo' rientrare
        Risposta accesso = post(
                "/api/login",
                "{\"email\":\"" + PREFISSO + "cattivo@esempio.it\",\"password\":\"segreta123\"}",
                null);
        assertThat(accesso.stato()).isEqualTo(403);

        // riattivato, torna tutto come prima
        assertThat(post("/api/amministrazione/utenti/" + id + "/riattiva", null, capo).stato())
                .isEqualTo(200);
        assertThat(get("/api/richieste/mie", cattivo).stato()).isEqualTo(200);
    }

    @Test
    void unTaskerSospesoSparisceDallElenco() {
        String tasker = registraTaskerCompleto("sparito");
        String capo = entraComeCapo();
        long profiloId = trova(get("/api/amministrazione/fornitori", capo).json(), "Utente sparito")
                .get("id")
                .asLong();
        post("/api/amministrazione/fornitori/" + profiloId + "/approva", null, capo);

        String osservatore = registra("osservatore");
        assertThat(nomiNellElenco(osservatore)).contains("Utente sparito");

        long utenteId = trova(get("/api/amministrazione/utenti", capo).json(), "Utente sparito")
                .get("id")
                .asLong();
        post("/api/amministrazione/utenti/" + utenteId + "/sospendi", "{\"motivo\":\"Segnalazioni\"}", capo);

        assertThat(nomiNellElenco(osservatore)).doesNotContain("Utente sparito");
    }

    @Test
    void unAmministratoreNonSiSospende() {
        String capo = entraComeCapo();
        long id = trova(get("/api/amministrazione/utenti", capo).json(), "Utente capo")
                .get("id")
                .asLong();

        assertThat(post("/api/amministrazione/utenti/" + id + "/sospendi", "{\"motivo\":\"Prova\"}", capo)
                        .stato())
                .isEqualTo(409);
    }

    @Test
    void lAmministratoreRitiraUnAnnuncioCheNonCiSta() {
        String cliente = registra("editore");
        long categoriaId = get("/api/categorie", cliente).json().get(0).get("id").asLong();
        long richiestaId = post(
                        "/api/richieste",
                        "{\"categoriaId\":" + categoriaId
                                + ",\"titolo\":\"Annuncio sgradevole\",\"descrizione\":\"Testo\",\"citta\":\"Milano\"}",
                        cliente)
                .json()
                .get("id")
                .asLong();

        String capo = entraComeCapo();
        assertThat(post("/api/amministrazione/richieste/" + richiestaId + "/ritira", null, capo)
                        .stato())
                .isEqualTo(200);

        // resta nella storia, ma non e' piu' in circolazione
        assertThat(get("/api/richieste/" + richiestaId, cliente).json().get("stato").asString())
                .isEqualTo("ANNULLATA");
    }

    // ---- aiuti ----------------------------------------------------------------

    private String entraComeCapo() {
        return registra("capo");
    }

    private java.util.List<String> nomiNellElenco(String token) {
        return get("/api/fornitore/elenco?quante=100", token).json().get("voci").valueStream()
                .map(voce -> voce.get("nome").asString())
                .toList();
    }

    private JsonNode trova(JsonNode elenco, String nome) {
        return elenco.valueStream()
                .filter(voce -> nome.equals(voce.get("nome").asString()))
                .findFirst()
                .orElseThrow(() -> new AssertionError("non trovato nell'elenco: " + nome));
    }

    /** Un profilo con tutto quello che serve per essere esaminato: lavori, tariffa, telefono, termini. */
    private String registraTaskerCompleto(String nome) {
        String token = registra(nome);
        put("/api/io", "{\"nomeCompleto\":\"Utente " + nome + "\",\"telefono\":\"3331234567\"}", token);

        long categoriaId = get("/api/categorie", token).json().get(0).get("id").asLong();
        long attivitaId = get("/api/categorie/" + categoriaId + "/attivita", token)
                .json()
                .get(0)
                .get("id")
                .asLong();
        post(
                "/api/fornitore",
                "{\"descrizione\":\"Esperienza vera\",\"zonaOperativa\":\"Milano\",\"terminiAccettati\":true"
                        + ",\"attivitaIds\":[" + attivitaId + "]"
                        + ",\"tariffe\":[{\"categoriaId\":" + categoriaId + ",\"tariffaOraria\":30}]}",
                token);
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
