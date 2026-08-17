package it.tasky;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;
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
@RequestMapping("/api/richieste")
public class RichiestaController {

    private final RichiestaServizioRepository richieste;
    private final CategoriaServizioRepository categorie;
    private final IncaricoRepository incarichi;
    private final UtenteCorrente utenteCorrente;

    public RichiestaController(
            RichiestaServizioRepository richieste,
            CategoriaServizioRepository categorie,
            IncaricoRepository incarichi,
            UtenteCorrente utenteCorrente) {
        this.richieste = richieste;
        this.categorie = categorie;
        this.incarichi = incarichi;
        this.utenteCorrente = utenteCorrente;
    }

    public record RichiestaNuova(
            @NotNull Long categoriaId,
            @NotBlank String titolo,
            @NotBlank String descrizione,
            @NotBlank String citta,
            BigDecimal budget,
            LocalDate dataPreferita) {}

    public record RispostaRichiesta(
            Long id,
            String titolo,
            String descrizione,
            String citta,
            BigDecimal budget,
            LocalDate dataPreferita,
            StatoRichiesta stato,
            String categoria,
            String cliente,
            LocalDateTime dataCreazione) {

        static RispostaRichiesta da(RichiestaServizio richiesta) {
            return new RispostaRichiesta(
                    richiesta.getId(),
                    richiesta.getTitolo(),
                    richiesta.getDescrizione(),
                    richiesta.getCitta(),
                    richiesta.getBudget(),
                    richiesta.getDataPreferita(),
                    richiesta.getStato(),
                    richiesta.getCategoria().getNome(),
                    richiesta.getCliente().getNomeCompleto(),
                    richiesta.getDataCreazione());
        }
    }

    @PostMapping
    public RispostaRichiesta crea(@Valid @RequestBody RichiestaNuova nuova, @AuthenticationPrincipal Jwt token) {
        CategoriaServizio categoria = categorie
                .findById(nuova.categoriaId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Categoria non trovata"));

        RichiestaServizio richiesta = new RichiestaServizio();
        richiesta.setCliente(utenteCorrente.da(token));
        richiesta.setCategoria(categoria);
        richiesta.setTitolo(nuova.titolo());
        richiesta.setDescrizione(nuova.descrizione());
        richiesta.setCitta(nuova.citta());
        richiesta.setBudget(nuova.budget());
        richiesta.setDataPreferita(nuova.dataPreferita());
        return RispostaRichiesta.da(richieste.save(richiesta));
    }

    @GetMapping
    public List<RispostaRichiesta> aperte() {
        return richieste.findByStato(StatoRichiesta.APERTA).stream()
                .map(RispostaRichiesta::da)
                .toList();
    }

    @GetMapping("/{id}")
    public RispostaRichiesta dettaglio(@PathVariable Long id, @AuthenticationPrincipal Jwt token) {
        RichiestaServizio richiesta = richieste
                .findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Richiesta non trovata"));

        // una richiesta non piu' aperta esiste solo per chi la sta portando avanti
        if (richiesta.getStato() != StatoRichiesta.APERTA
                && !riguarda(richiesta, utenteCorrente.da(token).getId())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Richiesta non trovata");
        }
        return RispostaRichiesta.da(richiesta);
    }

    private boolean riguarda(RichiestaServizio richiesta, Long utenteId) {
        if (richiesta.getCliente().getId().equals(utenteId)) {
            return true;
        }
        return incarichi.findByRichiestaId(richiesta.getId())
                .map(incarico -> incarico.getProfiloFornitore()
                        .getUtente()
                        .getId()
                        .equals(utenteId))
                .orElse(false);
    }
}
