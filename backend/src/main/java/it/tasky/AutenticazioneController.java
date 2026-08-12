package it.tasky;

import java.time.Duration;
import java.time.Instant;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api")
public class AutenticazioneController {

    private final UtenteRepository utenti;
    private final PasswordEncoder passwordEncoder;
    private final JwtEncoder jwtEncoder;
    private final Duration durataToken;

    public AutenticazioneController(
            UtenteRepository utenti,
            PasswordEncoder passwordEncoder,
            JwtEncoder jwtEncoder,
            @Value("${tasky.jwt.durata-minuti}") long durataMinuti) {
        this.utenti = utenti;
        this.passwordEncoder = passwordEncoder;
        this.jwtEncoder = jwtEncoder;
        this.durataToken = Duration.ofMinutes(durataMinuti);
    }

    public record RegistrazioneRichiesta(
            String email, String password, String nomeCompleto, String telefono, String citta) {}

    public record LoginRichiesta(String email, String password) {}

    public record RispostaToken(String token) {}

    @PostMapping("/registrazione")
    public RispostaToken registrazione(@RequestBody RegistrazioneRichiesta richiesta) {
        if (utenti.findByEmail(richiesta.email()).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email già registrata");
        }
        Utente utente = new Utente();
        utente.setEmail(richiesta.email());
        utente.setHashPassword(passwordEncoder.encode(richiesta.password()));
        utente.setNomeCompleto(richiesta.nomeCompleto());
        utente.setTelefono(richiesta.telefono());
        utente.setCitta(richiesta.citta());
        utenti.save(utente);
        return new RispostaToken(creaToken(utente));
    }

    @PostMapping("/login")
    public RispostaToken login(@RequestBody LoginRichiesta richiesta) {
        Utente utente = utenti.findByEmail(richiesta.email())
                .filter(u -> passwordEncoder.matches(richiesta.password(), u.getHashPassword()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Credenziali non valide"));
        return new RispostaToken(creaToken(utente));
    }

    @GetMapping("/io")
    public String io(@AuthenticationPrincipal Jwt token) {
        return token.getSubject();
    }

    private String creaToken(Utente utente) {
        Instant adesso = Instant.now();
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .subject(utente.getEmail())
                .issuedAt(adesso)
                .expiresAt(adesso.plus(durataToken))
                .build();
        JwsHeader intestazione = JwsHeader.with(MacAlgorithm.HS256).build();
        return jwtEncoder.encode(JwtEncoderParameters.from(intestazione, claims)).getTokenValue();
    }
}
