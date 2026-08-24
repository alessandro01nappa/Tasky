package it.tasky;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
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
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.transaction.annotation.Transactional;
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
            @Email @NotBlank String email,
            @Size(min = 8) String password,
            @NotBlank String nomeCompleto,
            String telefono,
            String citta) {}

    public record LoginRichiesta(@NotBlank String email, @NotBlank String password) {}

    public record RispostaToken(String token) {}

    public record Io(String email, String nomeCompleto, String telefono, String citta) {}

    /** L'email non si cambia: e' con quella che si entra. */
    public record DatiMiei(@NotBlank String nomeCompleto, String telefono, String citta) {}

    @PostMapping("/registrazione")
    public RispostaToken registrazione(@Valid @RequestBody RegistrazioneRichiesta richiesta) {
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
    public RispostaToken login(@Valid @RequestBody LoginRichiesta richiesta) {
        Utente utente = utenti.findByEmail(richiesta.email())
                .filter(u -> passwordEncoder.matches(richiesta.password(), u.getHashPassword()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Credenziali non valide"));
        return new RispostaToken(creaToken(utente));
    }

    @GetMapping("/io")
    public Io io(@AuthenticationPrincipal Jwt token) {
        Utente utente = utenti
                .findByEmail(token.getSubject())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Utente non trovato"));
        return descrivi(utente);
    }

    /** Nome, telefono e citta' si sceglievano solo alla registrazione: ora si correggono. */
    @PutMapping("/io")
    @Transactional
    public Io aggiornaIo(@Valid @RequestBody DatiMiei dati, @AuthenticationPrincipal Jwt token) {
        Utente utente = utenti
                .findByEmail(token.getSubject())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Utente non trovato"));
        utente.setNomeCompleto(dati.nomeCompleto());
        utente.setTelefono(vuotoComeAssente(dati.telefono()));
        utente.setCitta(vuotoComeAssente(dati.citta()));
        return descrivi(utenti.save(utente));
    }

    private static String vuotoComeAssente(String valore) {
        return valore == null || valore.isBlank() ? null : valore.trim();
    }

    private static Io descrivi(Utente utente) {
        return new Io(
                utente.getEmail(), utente.getNomeCompleto(), utente.getTelefono(), utente.getCitta());
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
