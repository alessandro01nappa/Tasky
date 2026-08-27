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
        Utente utente = utenti.findByEmail(token.getSubject())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Utente non trovato"));
        // il token dura due ore: senza questo controllo un sospeso resterebbe operativo fino a scadenza
        if (utente.isSospeso()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, messaggioSospensione(utente));
        }
        return utente;
    }

    static String messaggioSospensione(Utente utente) {
        return utente.getMotivoSospensione() == null || utente.getMotivoSospensione().isBlank()
                ? "Il tuo account è sospeso."
                : "Il tuo account è sospeso: " + utente.getMotivoSospensione();
    }
}
