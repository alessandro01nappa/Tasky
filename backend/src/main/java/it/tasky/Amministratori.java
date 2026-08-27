package it.tasky;

import java.util.Arrays;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

/**
 * Chi amministra Tasky è scritto nella configurazione, non nel database: così
 * non esiste nessun modo di diventarlo scrivendo su una tabella, e non c'è da
 * chiedersi chi abbia promosso chi. Si cambia con TASKY_AMMINISTRATORI, che
 * vuole gli indirizzi separati da virgola.
 */
@Component
public class Amministratori {

    private static final Logger log = LoggerFactory.getLogger(Amministratori.class);

    private final Set<String> indirizzi;

    public Amministratori(@Value("${tasky.amministratori:}") String elenco) {
        this.indirizzi = Arrays.stream(elenco.split(","))
                .map(voce -> voce.trim().toLowerCase(Locale.ITALY))
                .filter(voce -> !voce.isEmpty())
                .collect(Collectors.toUnmodifiableSet());
        if (indirizzi.isEmpty()) {
            log.warn("Nessun amministratore configurato: le pagine di amministrazione"
                    + " non sono raggiungibili da nessuno. Si imposta con TASKY_AMMINISTRATORI.");
        }
    }

    public boolean sono(String email) {
        return email != null && indirizzi.contains(email.toLowerCase(Locale.ITALY));
    }

    /** Da usare in cima a ogni azione riservata: chi non lo è non deve nemmeno sapere che esiste. */
    public void soloAmministratori(Jwt token) {
        if (!sono(token.getSubject())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Pagina non trovata");
        }
    }
}
