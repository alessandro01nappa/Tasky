package it.tasky;

import static org.assertj.core.api.Assertions.assertThat;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.jdbc.core.JdbcTemplate;

/**
 * Il limite serve contro chi prova le password una dopo l'altra. Questi test
 * girano da soli in una classe a parte perche' consumano il contatore, che e'
 * per indirizzo e non per utente.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class LimiteAccessiTest {

    private static final String PREFISSO = "limite-e2e-";
    private static final int CONCESSI = 10;

    @LocalServerPort
    private int porta;

    @Autowired
    private JdbcTemplate jdbc;

    @Autowired
    private LimiteAccessi limite;

    private final HttpClient client = HttpClient.newHttpClient();

    @BeforeEach
    void ricomincia() {
        // il conteggio e' per indirizzo: senza azzerarlo i test si consumano a vicenda
        limite.azzera();
    }

    @AfterEach
    void pulisci() {
        // il contatore e' per indirizzo e tutti i test girano da localhost:
        // senza azzerarlo qui, questi lascerebbero senza credito le altre classi
        limite.azzera();
        jdbc.update("delete from utenti where email like '" + PREFISSO + "%'");
    }

    @Test
    void dopoDieciTentativiSbagliatiSiVieneFermati() {
        String email = PREFISSO + "vittima@esempio.it";
        registra(email);

        // i primi tentativi rispondono "credenziali non valide", come deve essere
        for (int i = 0; i < CONCESSI; i++) {
            assertThat(accedi(email, "sbagliata" + i).stato())
                    .as("tentativo numero " + (i + 1))
                    .isEqualTo(401);
        }

        Risposta fermato = accedi(email, "ancora-sbagliata");
        assertThat(fermato.stato()).isEqualTo(429);
        assertThat(fermato.corpo()).contains("Troppi tentativi");
    }

    @Test
    void ilLimiteValeAnchePerLaPasswordGiusta() {
        // e' per indirizzo, non per utente: chi martella non deve poter entrare
        // indovinando all'undicesimo colpo
        String email = PREFISSO + "insistente@esempio.it";
        registra(email);

        for (int i = 0; i < CONCESSI + 1; i++) {
            accedi(email, "sbagliata");
        }
        assertThat(accedi(email, "segreta123").stato()).isEqualTo(429);
    }

    @Test
    void ilLimiteNonTocaLeAltreChiamate() {
        String email = PREFISSO + "tranquillo@esempio.it";
        String token = registra(email);

        for (int i = 0; i < CONCESSI + 5; i++) {
            accedi(email, "sbagliata");
        }
        // la registrazione e le pagine normali continuano a funzionare
        assertThat(get("/api/categorie", token).stato()).isEqualTo(200);
    }

    // ---- aiuti ----------------------------------------------------------------

    private String registra(String email) {
        Risposta creato = invia(
                "POST",
                "/api/registrazione",
                "{\"email\":\"" + email + "\",\"password\":\"segreta123\",\"nomeCompleto\":\"Utente prova\"}",
                null);
        return creato.corpo().replaceAll(".*\"token\"\\s*:\\s*\"([^\"]+)\".*", "$1");
    }

    private Risposta accedi(String email, String password) {
        return invia(
                "POST",
                "/api/login",
                "{\"email\":\"" + email + "\",\"password\":\"" + password + "\"}",
                null);
    }

    private Risposta get(String percorso, String token) {
        return invia("GET", percorso, null, token);
    }

    private record Risposta(int stato, String corpo) {}

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
            return new Risposta(risposta.statusCode(), risposta.body());
        } catch (Exception e) {
            throw new IllegalStateException("Chiamata fallita: " + metodo + " " + percorso, e);
        }
    }
}
