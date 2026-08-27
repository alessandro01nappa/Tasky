package it.tasky;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Un tetto ai tentativi di accesso SBAGLIATI da uno stesso indirizzo. Serve
 * contro chi prova le password una dopo l'altra: senza, un attacco del genere
 * costa solo il tempo di fare le richieste.
 *
 * Si contano solo i fallimenti, non gli accessi riusciti: dietro a un solo
 * indirizzo puo' esserci un ufficio intero, e nessuno deve restare fuori perche'
 * i colleghi hanno lavorato.
 *
 * Il conteggio sta in memoria, quindi vale per questa istanza e si azzera al
 * riavvio. Va bene con una macchina sola; con piu' copie in esecuzione servira'
 * un contatore condiviso.
 */
@Component
@Order(1)
public class LimiteAccessi extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(LimiteAccessi.class);

    private static final int TENTATIVI_CONCESSI = 10;
    private static final Duration FINESTRA = Duration.ofMinutes(5);
    /** Oltre questo numero di indirizzi diversi si riparte da zero: e' una difesa, non un archivio. */
    private static final int INDIRIZZI_RICORDATI = 10_000;

    private record Conteggio(AtomicInteger tentativi, Instant inizio) {}

    private final Map<String, Conteggio> conteggi = new ConcurrentHashMap<>();

    @Override
    protected void doFilterInternal(
            HttpServletRequest richiesta, HttpServletResponse risposta, FilterChain catena)
            throws ServletException, IOException {

        String indirizzo = indirizzoDi(richiesta);
        if (giaOltreIlLimite(indirizzo)) {
            risposta.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            risposta.setContentType("application/problem+json");
            risposta.getWriter().write("""
                    {"status":429,"title":"Too Many Requests",\
                    "detail":"Troppi tentativi di accesso. Riprova fra qualche minuto."}""");
            return;
        }

        catena.doFilter(richiesta, risposta);

        // si guarda com'e' andata: solo un rifiuto consuma il credito
        if (risposta.getStatus() == HttpStatus.UNAUTHORIZED.value()) {
            segnaFallimento(indirizzo);
        }
    }

    /** Solo l'accesso: il resto delle chiamate ha gia' un token e non si indovina. */
    @Override
    protected boolean shouldNotFilter(HttpServletRequest richiesta) {
        return !("POST".equals(richiesta.getMethod()) && "/api/login".equals(richiesta.getRequestURI()));
    }

    /** Serve ai test, che altrimenti si consumano a vicenda il conteggio dello stesso indirizzo. */
    void azzera() {
        conteggi.clear();
    }

    private boolean giaOltreIlLimite(String indirizzo) {
        Conteggio conteggio = conteggi.get(indirizzo);
        if (conteggio == null || scaduto(conteggio)) {
            return false;
        }
        return conteggio.tentativi().get() >= TENTATIVI_CONCESSI;
    }

    private void segnaFallimento(String indirizzo) {
        if (conteggi.size() > INDIRIZZI_RICORDATI) {
            conteggi.clear();
        }
        Instant adesso = Instant.now();
        Conteggio conteggio = conteggi.compute(indirizzo, (chiave, attuale) ->
                attuale == null || scaduto(attuale) ? new Conteggio(new AtomicInteger(0), adesso) : attuale);
        if (conteggio.tentativi().incrementAndGet() == TENTATIVI_CONCESSI) {
            log.warn("Troppi accessi sbagliati da {}: fermato per {} minuti", indirizzo, FINESTRA.toMinutes());
        }
    }

    private static boolean scaduto(Conteggio conteggio) {
        return conteggio.inizio().plus(FINESTRA).isBefore(Instant.now());
    }

    /** Dietro un proxy l'indirizzo vero arriva nell'intestazione, non nella connessione. */
    private static String indirizzoDi(HttpServletRequest richiesta) {
        String inoltrato = richiesta.getHeader("X-Forwarded-For");
        if (inoltrato != null && !inoltrato.isBlank()) {
            return inoltrato.split(",")[0].trim();
        }
        return richiesta.getRemoteAddr();
    }
}
