package it.tasky;

import static org.assertj.core.api.Assertions.assertThat;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.List;
import java.util.concurrent.Callable;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.jdbc.core.JdbcTemplate;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class FlussoCompletoTest {

    // tutti gli utenti creati dai test usano questo prefisso, cosi' la pulizia non tocca altri dati
    private static final String PREFISSO = "e2e-";
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
        jdbc.update("delete from recensioni where incarico_id in (select id from incarichi where richiesta_id in ("
                + richiesteDiTest + "))");
        jdbc.update("delete from incarichi where richiesta_id in (" + richiesteDiTest + ")");
        jdbc.update("delete from candidature where richiesta_id in (" + richiesteDiTest + ")");
        jdbc.update("delete from richieste_servizio where cliente_id in (" + UTENTI_DI_TEST + ")");
        jdbc.update("delete from tariffe_fornitore where profilo_fornitore_id in "
                + "(select id from profili_fornitore where utente_id in (" + UTENTI_DI_TEST + "))");
        jdbc.update("delete from attivita_fornitore where profilo_fornitore_id in "
                + "(select id from profili_fornitore where utente_id in (" + UTENTI_DI_TEST + "))");
        jdbc.update("delete from categorie_fornitore where profilo_fornitore_id in "
                + "(select id from profili_fornitore where utente_id in (" + UTENTI_DI_TEST + "))");
        jdbc.update("delete from profili_fornitore where utente_id in (" + UTENTI_DI_TEST + ")");
        jdbc.update("delete from utenti where email like ?", PREFISSO + "%");
    }

    @Test
    void ilClienteCompletaEPoiRecensisce() {
        Scenario s = scenario("caso1");
        completa(s);

        Risposta risposta = post(
                "/api/incarichi/" + s.incaricoId() + "/recensione", "{\"voto\":5,\"commento\":\"Ottimo\"}", s.cliente());

        assertThat(risposta.stato()).isEqualTo(200);
        JsonNode recensione = risposta.json();
        assertThat(recensione.get("voto").asInt()).isEqualTo(5);
        assertThat(recensione.get("commento").asString()).isEqualTo("Ottimo");
        assertThat(risposta.corpo()).doesNotContain("password", "email", "hash");
    }

    @Test
    void nonSiPuoRecensirePrimaDelCompletamento() {
        Scenario s = scenario("caso2");
        String percorso = "/api/incarichi/" + s.incaricoId() + "/recensione";

        assertThat(post(percorso, "{\"voto\":4}", s.cliente()).stato()).isEqualTo(409);

        avanza(s.incaricoId(), "IN_CORSO", s.fornitore());
        assertThat(post(percorso, "{\"voto\":4}", s.cliente()).stato()).isEqualTo(409);
    }

    @Test
    void nonSiPuoRecensireDueVolte() {
        Scenario s = scenario("caso3");
        completa(s);
        String percorso = "/api/incarichi/" + s.incaricoId() + "/recensione";

        assertThat(post(percorso, "{\"voto\":5}", s.cliente()).stato()).isEqualTo(200);
        assertThat(post(percorso, "{\"voto\":1}", s.cliente()).stato()).isEqualTo(409);
    }

    @Test
    void fornitoreEstraneoENonAutenticatoNonPossonoRecensire() {
        Scenario s = scenario("caso4");
        completa(s);
        String estraneo = registra("caso4-estraneo");
        String percorso = "/api/incarichi/" + s.incaricoId() + "/recensione";

        assertThat(post(percorso, "{\"voto\":5}", s.fornitore()).stato()).isEqualTo(403);
        assertThat(post(percorso, "{\"voto\":5}", estraneo).stato()).isEqualTo(403);
        assertThat(post(percorso, "{\"voto\":5}", null).stato()).isEqualTo(401);
    }

    @Test
    void incaricoDiUnAltroClienteEIncaricoInesistente() {
        Scenario s = scenario("caso5");
        completa(s);
        Scenario altro = scenario("caso5-altro");

        assertThat(post("/api/incarichi/" + s.incaricoId() + "/recensione", "{\"voto\":5}", altro.cliente())
                        .stato())
                .isEqualTo(403);
        assertThat(post("/api/incarichi/999999/recensione", "{\"voto\":5}", s.cliente())
                        .stato())
                .isEqualTo(404);
    }

    @Test
    void ilVotoDeveStareTraUnoECinque() {
        Scenario s = scenario("caso6");
        completa(s);
        String percorso = "/api/incarichi/" + s.incaricoId() + "/recensione";

        assertThat(post(percorso, "{\"voto\":0}", s.cliente()).stato()).isEqualTo(400);
        assertThat(post(percorso, "{\"voto\":6}", s.cliente()).stato()).isEqualTo(400);
        assertThat(post(percorso, "{\"voto\":-1}", s.cliente()).stato()).isEqualTo(400);
        assertThat(post(percorso, "{\"commento\":\"senza voto\"}", s.cliente()).stato())
                .isEqualTo(400);
    }

    @Test
    void soloClienteEFornitorePossonoLeggereLaRecensione() {
        Scenario s = scenario("caso7");
        completa(s);
        String percorso = "/api/incarichi/" + s.incaricoId() + "/recensione";
        post(percorso, "{\"voto\":4}", s.cliente());
        String estraneo = registra("caso7-estraneo");

        assertThat(get(percorso, s.cliente()).stato()).isEqualTo(200);
        assertThat(get(percorso, s.fornitore()).stato()).isEqualTo(200);
        assertThat(get(percorso, estraneo).stato()).isEqualTo(403);
        assertThat(get(percorso, null).stato()).isEqualTo(401);
    }

    @Test
    void leTransizioniDiStatoNonConsentiteVengonoRifiutate() {
        Scenario s = scenario("caso8");

        // salto di stato, stato invariato, annullamento non previsto
        assertThat(cambiaStato(s.incaricoId(), "COMPLETATO", s.fornitore()).stato()).isEqualTo(409);
        assertThat(cambiaStato(s.incaricoId(), "ASSEGNATO", s.fornitore()).stato()).isEqualTo(409);
        assertThat(cambiaStato(s.incaricoId(), "ANNULLATO", s.fornitore()).stato()).isEqualTo(409);

        avanza(s.incaricoId(), "IN_CORSO", s.fornitore());
        assertThat(cambiaStato(s.incaricoId(), "ASSEGNATO", s.fornitore()).stato()).isEqualTo(409);

        avanza(s.incaricoId(), "COMPLETATO", s.fornitore());
        assertThat(cambiaStato(s.incaricoId(), "IN_CORSO", s.fornitore()).stato()).isEqualTo(409);
        assertThat(cambiaStato(s.incaricoId(), "COMPLETATO", s.fornitore()).stato()).isEqualTo(409);
    }

    @Test
    void soloIlFornitoreDellIncaricoPuoCambiareStato() {
        Scenario s = scenario("caso9");
        String estraneo = registra("caso9-estraneo");

        assertThat(cambiaStato(s.incaricoId(), "IN_CORSO", s.cliente()).stato()).isEqualTo(403);
        assertThat(cambiaStato(s.incaricoId(), "IN_CORSO", estraneo).stato()).isEqualTo(403);
        assertThat(cambiaStato(s.incaricoId(), "IN_CORSO", null).stato()).isEqualTo(401);
        assertThat(statoIncarico(s.incaricoId())).isEqualTo("ASSEGNATO");
    }

    @Test
    void ilCompletamentoAggiornaIncaricoERichiestaInsieme() {
        Scenario s = scenario("caso10");
        assertThat(statoRichiesta(s.richiestaId())).isEqualTo("ASSEGNATA");

        completa(s);

        assertThat(statoIncarico(s.incaricoId())).isEqualTo("COMPLETATO");
        assertThat(statoRichiesta(s.richiestaId())).isEqualTo("COMPLETATA");
        assertThat(jdbc.queryForObject(
                        "select data_completamento is not null from incarichi where id = ?",
                        Boolean.class,
                        s.incaricoId()))
                .isTrue();
        assertThat(jdbc.queryForObject(
                        "select count(*) from candidature where richiesta_id = ? and stato = 'ACCETTATA'",
                        Integer.class,
                        s.richiestaId()))
                .isEqualTo(1);
    }

    @Test
    void suRichiestaCompletataNonSiPuoPiuCandidarsiNeAssegnare() {
        Scenario s = scenario("caso11");
        completa(s);

        String altroFornitore = registraFornitoreApprovato("caso11-altro");
        assertThat(post(
                                "/api/richieste/" + s.richiestaId() + "/candidature",
                                "{\"messaggio\":\"tardi\"}",
                                altroFornitore)
                        .stato())
                .isEqualTo(409);
        assertThat(post("/api/incarichi", "{\"candidaturaId\":" + s.candidaturaId() + "}", s.cliente())
                        .stato())
                .isEqualTo(409);
    }

    @Test
    void inConcorrenzaPassaUnaSolaRecensione() {
        Scenario s = scenario("caso12");
        avanza(s.incaricoId(), "IN_CORSO", s.fornitore());

        List<Integer> completamenti = inParallelo(
                () -> cambiaStato(s.incaricoId(), "COMPLETATO", s.fornitore()).stato());
        assertThat(completamenti).contains(200);
        assertThat(statoIncarico(s.incaricoId())).isEqualTo("COMPLETATO");
        assertThat(statoRichiesta(s.richiestaId())).isEqualTo("COMPLETATA");

        List<Integer> recensioni = inParallelo(() -> post(
                        "/api/incarichi/" + s.incaricoId() + "/recensione", "{\"voto\":5}", s.cliente())
                .stato());
        assertThat(recensioni).filteredOn(stato -> stato == 200).hasSize(1);
        assertThat(jdbc.queryForObject(
                        "select count(*) from recensioni where incarico_id = ?", Integer.class, s.incaricoId()))
                .isEqualTo(1);
    }

    @Test
    void laListaPubblicaMostraSoloLeRichiesteAperte() {
        Scenario s = scenario("caso13");
        String osservatore = registra("caso13-osservatore");

        // appena assegnata, la richiesta e' gia' sparita dalla lista
        assertThat(idNellaLista(osservatore)).doesNotContain(s.richiestaId());

        completa(s);
        assertThat(idNellaLista(osservatore)).doesNotContain(s.richiestaId());

        // una richiesta ancora aperta invece si vede
        long apertaId = richiestaAperta(s.cliente());
        assertThat(idNellaLista(osservatore)).contains(apertaId);
    }

    @Test
    void laRichiestaApertaEVisibileAChiunqueSiaAutenticato() {
        Scenario s = scenario("caso14");
        String osservatore = registra("caso14-osservatore");
        long apertaId = richiestaAperta(s.cliente());

        assertThat(get("/api/richieste/" + apertaId, osservatore).stato()).isEqualTo(200);
        assertThat(get("/api/richieste/" + apertaId, s.fornitore()).stato()).isEqualTo(200);
        assertThat(get("/api/richieste/" + apertaId, null).stato()).isEqualTo(401);
    }

    @Test
    void dopoLAssegnazioneIlDettaglioRestaSoloAlClienteEAlFornitoreDellIncarico() {
        Scenario s = scenario("caso15");
        String scartato = registraFornitoreApprovato("caso15-scartato");
        String estraneo = registra("caso15-estraneo");
        String percorso = "/api/richieste/" + s.richiestaId();

        // assegnata
        assertThat(get(percorso, s.cliente()).stato()).isEqualTo(200);
        assertThat(get(percorso, s.fornitore()).stato()).isEqualTo(200);
        assertThat(get(percorso, scartato).stato()).isEqualTo(404);
        assertThat(get(percorso, estraneo).stato()).isEqualTo(404);
        assertThat(get(percorso, null).stato()).isEqualTo(401);

        // e anche dopo il completamento
        completa(s);
        assertThat(get(percorso, s.cliente()).stato()).isEqualTo(200);
        assertThat(get(percorso, s.fornitore()).stato()).isEqualTo(200);
        assertThat(get(percorso, scartato).stato()).isEqualTo(404);
        assertThat(get(percorso, estraneo).stato()).isEqualTo(404);
    }

    @Test
    void ilNegatoNonSiDistingueDallInesistente() {
        Scenario s = scenario("caso16");
        String estraneo = registra("caso16-estraneo");

        Risposta negata = get("/api/richieste/" + s.richiestaId(), estraneo);
        Risposta inesistente = get("/api/richieste/999999", estraneo);

        assertThat(negata.stato()).isEqualTo(inesistente.stato());
        assertThat(negata.json().get("error").asString())
                .isEqualTo(inesistente.json().get("error").asString());
    }

    @Test
    void nonCiSiPuoCandidareAllaPropriaRichiesta() {
        Scenario s = scenario("caso17");
        // il cliente diventa anche fornitore approvato
        String cliente = s.cliente();
        long categoriaId = get("/api/categorie", cliente).json().get(0).get("id").asLong();
        post(
                "/api/fornitore",
                "{\"descrizione\":\"Faccio anche io\",\"zonaOperativa\":\"Milano\",\"categorieIds\":[" + categoriaId
                        + "]}",
                cliente);
        jdbc.update("update profili_fornitore set stato = 'APPROVATO' where utente_id in (" + UTENTI_DI_TEST + ")");

        long miaRichiesta = richiestaAperta(cliente);
        Risposta risposta = post("/api/richieste/" + miaRichiesta + "/candidature", "{\"messaggio\":\"io\"}", cliente);

        assertThat(risposta.stato()).isEqualTo(403);
        assertThat(jdbc.queryForObject(
                        "select count(*) from candidature where richiesta_id = ?", Integer.class, miaRichiesta))
                .isEqualTo(0);
    }

    @Test
    void ilClienteVedeLeProprieRichieste() {
        Scenario s = scenario("caso18");
        long apertaId = richiestaAperta(s.cliente());
        String estraneo = registra("caso18-estraneo");

        List<Long> mie = get("/api/richieste/mie", s.cliente()).json().valueStream()
                .map(r -> r.get("id").asLong())
                .toList();
        // anche quella assegnata, che nella lista pubblica non compare piu'
        assertThat(mie).contains(s.richiestaId(), apertaId);

        assertThat(get("/api/richieste/mie", estraneo).json()).isEmpty();
        assertThat(get("/api/richieste/mie", null).stato()).isEqualTo(401);
    }

    @Test
    void ilFornitoreVedeLeProprieCandidature() {
        Scenario s = scenario("caso19");
        Risposta risposta = get("/api/fornitore/candidature", s.fornitore());

        assertThat(risposta.stato()).isEqualTo(200);
        JsonNode candidatura = risposta.json().get(0);
        assertThat(candidatura.get("id").asLong()).isEqualTo(s.candidaturaId());
        assertThat(candidatura.get("richiestaId").asLong()).isEqualTo(s.richiestaId());
        assertThat(candidatura.get("titoloRichiesta").asString()).isEqualTo("Lavoro di prova");
        assertThat(candidatura.get("stato").asString()).isEqualTo("ACCETTATA");
        assertThat(candidatura.get("statoRichiesta").asString()).isEqualTo("ASSEGNATA");
        assertThat(risposta.corpo()).doesNotContain("password", "email", "hash");

        // un utente senza profilo fornitore non ha candidature da vedere
        assertThat(get("/api/fornitore/candidature", s.cliente()).stato()).isEqualTo(404);
    }

    @Test
    void entrambiVedonoIProprioIncarichiConIlProprioRuolo() {
        Scenario s = scenario("caso20");

        JsonNode delCliente = get("/api/incarichi/miei", s.cliente()).json();
        JsonNode delFornitore = get("/api/incarichi/miei", s.fornitore()).json();

        assertThat(delCliente.size()).isEqualTo(1);
        assertThat(delCliente.get(0).get("id").asLong()).isEqualTo(s.incaricoId());
        assertThat(delCliente.get(0).get("ruolo").asString()).isEqualTo("CLIENTE");

        assertThat(delFornitore.size()).isEqualTo(1);
        assertThat(delFornitore.get(0).get("ruolo").asString()).isEqualTo("FORNITORE");

        String estraneo = registra("caso20-estraneo");
        assertThat(get("/api/incarichi/miei", estraneo).json()).isEmpty();
        assertThat(get("/api/incarichi/miei", null).stato()).isEqualTo(401);
    }

    @Test
    void mediaENumeroRecensioniDelFornitore() {
        Scenario s = scenario("caso21");
        long profiloId = jdbc.queryForObject(
                "select profilo_fornitore_id from incarichi where id = ?", Long.class, s.incaricoId());
        String percorso = "/api/fornitore/" + profiloId + "/recensioni";

        // nessuna recensione: media 0, elenco vuoto
        JsonNode vuoto = get(percorso, s.cliente()).json();
        assertThat(vuoto.get("numero").asInt()).isZero();
        assertThat(vuoto.get("media").asDouble()).isZero();

        completa(s);
        post("/api/incarichi/" + s.incaricoId() + "/recensione", "{\"voto\":4,\"commento\":\"Bene\"}", s.cliente());

        // stesso fornitore, secondo lavoro con un altro cliente e voto 5
        Scenario secondo = scenarioConFornitore("caso21-bis", s.fornitore());
        completa(secondo);
        post("/api/incarichi/" + secondo.incaricoId() + "/recensione", "{\"voto\":5}", secondo.cliente());

        Risposta risposta = get(percorso, s.cliente());
        assertThat(risposta.stato()).isEqualTo(200);
        assertThat(risposta.json().get("numero").asInt()).isEqualTo(2);
        assertThat(risposta.json().get("media").asDouble()).isEqualTo(4.5);
        assertThat(risposta.json().get("recensioni").size()).isEqualTo(2);
        assertThat(risposta.corpo()).doesNotContain("password", "email", "hash");

        assertThat(get("/api/fornitore/999999/recensioni", s.cliente()).stato()).isEqualTo(404);
        assertThat(get(percorso, null).stato()).isEqualTo(401);
    }

    // ---- scenario e utilita' ----

    private record Scenario(String cliente, String fornitore, long richiestaId, long candidaturaId, long incaricoId) {}

    private record Risposta(int stato, String corpo, JsonNode json) {}

    /** Cliente con richiesta, fornitore approvato candidato e gia' selezionato: incarico ASSEGNATO. */
    @Test
    void ilLavoratorePuoAggiungereUnLavoroAlProprioProfilo() {
        String token = registra("caso22-fornitore");
        long categoriaId = get("/api/categorie", token).json().get(0).get("id").asLong();
        JsonNode voci = get("/api/categorie/" + categoriaId + "/attivita", token).json();
        long primo = voci.get(0).get("id").asLong();
        long secondo = voci.get(1).get("id").asLong();

        String corpo = "{\"descrizione\":\"Esperienza\",\"zonaOperativa\":\"Milano\""
                + ",\"terminiAccettati\":true,\"tariffe\":[{\"categoriaId\":" + categoriaId
                + ",\"tariffaOraria\":25}],\"attivitaIds\":";

        assertThat(post("/api/fornitore", corpo + "[" + primo + "]}", token).stato())
                .isEqualTo(200);

        // aggiungerne uno secondo non deve rompere: e' la modifica piu' comune del profilo
        Risposta aggiunta = put("/api/fornitore", corpo + "[" + primo + "," + secondo + "]}", token);
        assertThat(aggiunta.stato()).isEqualTo(200);
        assertThat(aggiunta.json().get("attivita")).hasSize(2);

        // e toglierlo deve riportare il profilo com'era
        Risposta tolta = put("/api/fornitore", corpo + "[" + primo + "]}", token);
        assertThat(tolta.stato()).isEqualTo(200);
        assertThat(tolta.json().get("attivita")).hasSize(1);
    }

    private Scenario scenario(String nome) {
        return scenarioConFornitore(nome, registraFornitoreApprovato(nome + "-fornitore"));
    }

    /** Come scenario(), ma riusando un fornitore gia' esistente. */
    private Scenario scenarioConFornitore(String nome, String fornitore) {
        String cliente = registra(nome + "-cliente");

        long categoriaId = get("/api/categorie", cliente).json().get(0).get("id").asLong();
        long richiestaId = idDi(post(
                "/api/richieste",
                "{\"categoriaId\":" + categoriaId
                        + ",\"titolo\":\"Lavoro di prova\",\"descrizione\":\"Descrizione\",\"citta\":\"Milano\"}",
                cliente));
        long candidaturaId = idDi(post(
                "/api/richieste/" + richiestaId + "/candidature",
                "{\"messaggio\":\"Disponibile\",\"prezzoOfferto\":100.00}",
                fornitore));
        long incaricoId = idDi(post("/api/incarichi", "{\"candidaturaId\":" + candidaturaId + "}", cliente));

        return new Scenario(cliente, fornitore, richiestaId, candidaturaId, incaricoId);
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

    private String registraFornitoreApprovato(String nome) {
        String token = registra(nome);
        long categoriaId = get("/api/categorie", token).json().get(0).get("id").asLong();
        post(
                "/api/fornitore",
                "{\"descrizione\":\"Esperienza\",\"zonaOperativa\":\"Milano\",\"categorieIds\":[" + categoriaId + "]}",
                token);
        jdbc.update("update profili_fornitore set stato = 'APPROVATO' where utente_id in (" + UTENTI_DI_TEST
                + ") and stato = 'IN_ATTESA'");
        return token;
    }

    private void completa(Scenario s) {
        avanza(s.incaricoId(), "IN_CORSO", s.fornitore());
        avanza(s.incaricoId(), "COMPLETATO", s.fornitore());
    }

    private void avanza(long incaricoId, String stato, String token) {
        assertThat(cambiaStato(incaricoId, stato, token).stato()).isEqualTo(200);
    }

    private Risposta cambiaStato(long incaricoId, String stato, String token) {
        return invia("PUT", "/api/incarichi/" + incaricoId + "/stato", "{\"stato\":\"" + stato + "\"}", token);
    }

    private long richiestaAperta(String cliente) {
        long categoriaId = get("/api/categorie", cliente).json().get(0).get("id").asLong();
        return idDi(post(
                "/api/richieste",
                "{\"categoriaId\":" + categoriaId
                        + ",\"titolo\":\"Ancora aperta\",\"descrizione\":\"Descrizione\",\"citta\":\"Milano\"}",
                cliente));
    }

    private List<Long> idNellaLista(String token) {
        return get("/api/richieste", token).json().valueStream()
                .map(richiesta -> richiesta.get("id").asLong())
                .toList();
    }

    private String statoRichiesta(long id) {
        return jdbc.queryForObject("select stato from richieste_servizio where id = ?", String.class, id);
    }

    private String statoIncarico(long id) {
        return jdbc.queryForObject("select stato from incarichi where id = ?", String.class, id);
    }

    private List<Integer> inParallelo(Callable<Integer> azione) {
        try (ExecutorService pool = Executors.newFixedThreadPool(2)) {
            List<Future<Integer>> esiti = pool.invokeAll(List.of(azione, azione));
            return List.of(esiti.get(0).get(), esiti.get(1).get());
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }

    private Risposta post(String percorso, String corpo, String token) {
        return invia("POST", percorso, corpo, token);
    }

    private Risposta get(String percorso, String token) {
        return invia("GET", percorso, null, token);
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

    private long idDi(Risposta risposta) {
        return risposta.json().get("id").asLong();
    }
}
