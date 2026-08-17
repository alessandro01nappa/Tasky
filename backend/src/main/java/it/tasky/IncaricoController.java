package it.tasky;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/incarichi")
public class IncaricoController {

    private final IncaricoRepository incarichi;
    private final CandidaturaRepository candidature;
    private final RichiestaServizioRepository richieste;
    private final UtenteCorrente utenteCorrente;

    public IncaricoController(
            IncaricoRepository incarichi,
            CandidaturaRepository candidature,
            RichiestaServizioRepository richieste,
            UtenteCorrente utenteCorrente) {
        this.incarichi = incarichi;
        this.candidature = candidature;
        this.richieste = richieste;
        this.utenteCorrente = utenteCorrente;
    }

    public record IncaricoNuovo(@NotNull Long candidaturaId) {}

    public record CambioStato(@NotNull StatoIncarico stato) {}

    public record RispostaIncarico(
            Long id,
            Long richiestaId,
            String titoloRichiesta,
            String fornitore,
            BigDecimal prezzoConcordato,
            StatoIncarico stato,
            LocalDateTime dataCreazione,
            LocalDateTime dataCompletamento) {

        static RispostaIncarico da(Incarico incarico) {
            return new RispostaIncarico(
                    incarico.getId(),
                    incarico.getRichiesta().getId(),
                    incarico.getRichiesta().getTitolo(),
                    incarico.getProfiloFornitore().getUtente().getNomeCompleto(),
                    incarico.getPrezzoConcordato(),
                    incarico.getStato(),
                    incarico.getDataCreazione(),
                    incarico.getDataCompletamento());
        }
    }

    @PostMapping
    @Transactional
    public RispostaIncarico crea(@Valid @RequestBody IncaricoNuovo nuovo, @AuthenticationPrincipal Jwt token) {
        Candidatura scelta = candidature
                .findById(nuovo.candidaturaId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Candidatura non trovata"));

        RichiestaServizio richiesta = scelta.getRichiesta();
        if (!richiesta.getCliente().getId().equals(utenteCorrente.da(token).getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Non è una tua richiesta");
        }
        if (richiesta.getStato() != StatoRichiesta.APERTA) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "La richiesta non è aperta");
        }

        Incarico incarico = new Incarico();
        incarico.setRichiesta(richiesta);
        incarico.setProfiloFornitore(scelta.getProfiloFornitore());
        incarico.setPrezzoConcordato(scelta.getPrezzoOfferto());
        incarichi.save(incarico);

        richiesta.setStato(StatoRichiesta.ASSEGNATA);
        richieste.save(richiesta);

        for (Candidatura candidatura : candidature.findByRichiestaId(richiesta.getId())) {
            candidatura.setStato(
                    candidatura.getId().equals(scelta.getId())
                            ? StatoCandidatura.ACCETTATA
                            : StatoCandidatura.RIFIUTATA);
            candidature.save(candidatura);
        }

        return RispostaIncarico.da(incarico);
    }

    @GetMapping("/{id}")
    public RispostaIncarico dettaglio(@PathVariable Long id, @AuthenticationPrincipal Jwt token) {
        Incarico incarico = incaricoEsistente(id);
        Long utenteId = utenteCorrente.da(token).getId();
        boolean cliente = incarico.getRichiesta().getCliente().getId().equals(utenteId);
        if (!cliente && !fornitore(incarico, utenteId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Incarico non tuo");
        }
        return RispostaIncarico.da(incarico);
    }

    @PutMapping("/{id}/stato")
    @Transactional
    public RispostaIncarico cambiaStato(
            @PathVariable Long id, @Valid @RequestBody CambioStato cambio, @AuthenticationPrincipal Jwt token) {

        Incarico incarico = incaricoEsistente(id);
        if (!fornitore(incarico, utenteCorrente.da(token).getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Solo il fornitore può aggiornare il lavoro");
        }
        verificaTransizione(incarico.getStato(), cambio.stato());

        incarico.setStato(cambio.stato());
        if (cambio.stato() == StatoIncarico.COMPLETATO) {
            incarico.setDataCompletamento(LocalDateTime.now());
            RichiestaServizio richiesta = incarico.getRichiesta();
            richiesta.setStato(StatoRichiesta.COMPLETATA);
            richieste.save(richiesta);
        }
        return RispostaIncarico.da(incarichi.save(incarico));
    }

    private void verificaTransizione(StatoIncarico attuale, StatoIncarico nuovo) {
        boolean consentita = (attuale == StatoIncarico.ASSEGNATO && nuovo == StatoIncarico.IN_CORSO)
                || (attuale == StatoIncarico.IN_CORSO && nuovo == StatoIncarico.COMPLETATO);
        if (!consentita) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "Transizione non consentita da " + attuale + " a " + nuovo);
        }
    }

    private boolean fornitore(Incarico incarico, Long utenteId) {
        return incarico.getProfiloFornitore().getUtente().getId().equals(utenteId);
    }

    private Incarico incaricoEsistente(Long id) {
        return incarichi
                .findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Incarico non trovato"));
    }
}
