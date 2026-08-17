package it.tasky;

import jakarta.validation.Valid;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/richieste/{richiestaId}/candidature")
public class CandidaturaController {

    private final CandidaturaRepository candidature;
    private final RichiestaServizioRepository richieste;
    private final ProfiloFornitoreRepository profili;
    private final UtenteCorrente utenteCorrente;

    public CandidaturaController(
            CandidaturaRepository candidature,
            RichiestaServizioRepository richieste,
            ProfiloFornitoreRepository profili,
            UtenteCorrente utenteCorrente) {
        this.candidature = candidature;
        this.richieste = richieste;
        this.profili = profili;
        this.utenteCorrente = utenteCorrente;
    }

    public record CandidaturaNuova(String messaggio, BigDecimal prezzoOfferto) {}

    public record RispostaCandidatura(
            Long id,
            String fornitore,
            String zonaOperativa,
            String messaggio,
            BigDecimal prezzoOfferto,
            StatoCandidatura stato,
            LocalDateTime dataCreazione) {

        static RispostaCandidatura da(Candidatura candidatura) {
            ProfiloFornitore profilo = candidatura.getProfiloFornitore();
            return new RispostaCandidatura(
                    candidatura.getId(),
                    profilo.getUtente().getNomeCompleto(),
                    profilo.getZonaOperativa(),
                    candidatura.getMessaggio(),
                    candidatura.getPrezzoOfferto(),
                    candidatura.getStato(),
                    candidatura.getDataCreazione());
        }
    }

    @PostMapping
    public RispostaCandidatura candidati(
            @PathVariable Long richiestaId,
            @Valid @RequestBody CandidaturaNuova nuova,
            @AuthenticationPrincipal Jwt token) {

        Utente utente = utenteCorrente.da(token);
        ProfiloFornitore profilo = profili.findByUtenteId(utente.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "Non hai un profilo fornitore"));
        if (profilo.getStato() != StatoFornitore.APPROVATO) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Profilo fornitore non approvato");
        }

        RichiestaServizio richiesta = richiestaEsistente(richiestaId);
        if (richiesta.getCliente().getId().equals(utente.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Non puoi candidarti a una tua richiesta");
        }
        if (richiesta.getStato() != StatoRichiesta.APERTA) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "La richiesta non è aperta");
        }
        if (candidature.existsByRichiestaIdAndProfiloFornitoreId(richiestaId, profilo.getId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ti sei già candidato a questa richiesta");
        }

        Candidatura candidatura = new Candidatura();
        candidatura.setRichiesta(richiesta);
        candidatura.setProfiloFornitore(profilo);
        candidatura.setMessaggio(nuova.messaggio());
        candidatura.setPrezzoOfferto(nuova.prezzoOfferto());
        return RispostaCandidatura.da(candidature.save(candidatura));
    }

    @GetMapping
    public List<RispostaCandidatura> ricevute(@PathVariable Long richiestaId, @AuthenticationPrincipal Jwt token) {
        RichiestaServizio richiesta = richiestaEsistente(richiestaId);
        if (!richiesta.getCliente().getId().equals(utenteCorrente.da(token).getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Non è una tua richiesta");
        }
        return candidature.findByRichiestaId(richiestaId).stream()
                .map(RispostaCandidatura::da)
                .toList();
    }

    private RichiestaServizio richiestaEsistente(Long richiestaId) {
        return richieste.findById(richiestaId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Richiesta non trovata"));
    }
}
