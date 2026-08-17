package it.tasky;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import java.time.LocalDateTime;
import org.springframework.dao.DataIntegrityViolationException;
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
@RequestMapping("/api/incarichi/{incaricoId}/recensione")
public class RecensioneController {

    private final RecensioneRepository recensioni;
    private final IncaricoRepository incarichi;
    private final UtenteCorrente utenteCorrente;

    public RecensioneController(
            RecensioneRepository recensioni, IncaricoRepository incarichi, UtenteCorrente utenteCorrente) {
        this.recensioni = recensioni;
        this.incarichi = incarichi;
        this.utenteCorrente = utenteCorrente;
    }

    public record RecensioneNuova(@Min(1) @Max(5) int voto, String commento) {}

    public record RispostaRecensione(Long id, int voto, String commento, LocalDateTime dataCreazione) {

        static RispostaRecensione da(Recensione recensione) {
            return new RispostaRecensione(
                    recensione.getId(),
                    recensione.getVoto(),
                    recensione.getCommento(),
                    recensione.getDataCreazione());
        }
    }

    @PostMapping
    public RispostaRecensione crea(
            @PathVariable Long incaricoId,
            @Valid @RequestBody RecensioneNuova nuova,
            @AuthenticationPrincipal Jwt token) {

        Incarico incarico = incaricoEsistente(incaricoId);
        if (!cliente(incarico, utenteCorrente.da(token).getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Solo il cliente può recensire");
        }
        if (incarico.getStato() != StatoIncarico.COMPLETATO) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Il lavoro non è ancora completato");
        }
        if (recensioni.existsByIncaricoId(incaricoId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Recensione già presente");
        }

        Recensione recensione = new Recensione();
        recensione.setIncarico(incarico);
        recensione.setVoto(nuova.voto());
        recensione.setCommento(nuova.commento());
        try {
            return RispostaRecensione.da(recensioni.save(recensione));
        } catch (DataIntegrityViolationException doppione) {
            // due richieste in parallelo: il vincolo unico sul database fa passare solo la prima
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Recensione già presente");
        }
    }

    @GetMapping
    public RispostaRecensione leggi(@PathVariable Long incaricoId, @AuthenticationPrincipal Jwt token) {
        Incarico incarico = incaricoEsistente(incaricoId);
        Long utenteId = utenteCorrente.da(token).getId();
        boolean fornitore = incarico.getProfiloFornitore().getUtente().getId().equals(utenteId);
        if (!cliente(incarico, utenteId) && !fornitore) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Incarico non tuo");
        }
        return recensioni
                .findByIncaricoId(incaricoId)
                .map(RispostaRecensione::da)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Recensione non trovata"));
    }

    private boolean cliente(Incarico incarico, Long utenteId) {
        return incarico.getRichiesta().getCliente().getId().equals(utenteId);
    }

    private Incarico incaricoEsistente(Long incaricoId) {
        return incarichi
                .findById(incaricoId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Incarico non trovato"));
    }
}
