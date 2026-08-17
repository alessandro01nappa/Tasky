package it.tasky;

import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

@Component
public class UtenteCorrente {

    private final UtenteRepository utenti;

    public UtenteCorrente(UtenteRepository utenti) {
        this.utenti = utenti;
    }

    public Utente da(Jwt token) {
        return utenti.findByEmail(token.getSubject())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Utente non trovato"));
    }
}
