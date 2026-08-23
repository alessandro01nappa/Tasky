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
import org.springframework.transaction.annotation.Transactional;
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
    private final ProfiloFornitoreRepository profili;
    private final AttivitaServizioRepository attivita;
    private final UtenteCorrente utenteCorrente;

    public RichiestaController(
            RichiestaServizioRepository richieste,
            CategoriaServizioRepository categorie,
            IncaricoRepository incarichi,
            ProfiloFornitoreRepository profili,
            AttivitaServizioRepository attivita,
            UtenteCorrente utenteCorrente) {
        this.richieste = richieste;
        this.categorie = categorie;
        this.incarichi = incarichi;
        this.profili = profili;
        this.attivita = attivita;
        this.utenteCorrente = utenteCorrente;
    }

    public record RichiestaNuova(
            @NotNull Long categoriaId,
            Long attivitaId,
            Long fornitoreId,
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
            String attivita,
            String cliente,
            String fornitoreRichiesto,
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
                    richiesta.getAttivita() == null ? null : richiesta.getAttivita().getNome(),
                    richiesta.getCliente().getNomeCompleto(),
                    richiesta.getFornitoreRichiesto() == null
                            ? null
                            : richiesta.getFornitoreRichiesto().getUtente().getNomeCompleto(),
                    richiesta.getDataCreazione());
        }
    }

    @PostMapping
    public RispostaRichiesta crea(@Valid @RequestBody RichiestaNuova nuova, @AuthenticationPrincipal Jwt token) {
        CategoriaServizio categoria = categorie
                .findById(nuova.categoriaId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Categoria non trovata"));

        Utente cliente = utenteCorrente.da(token);
        RichiestaServizio richiesta = new RichiestaServizio();
        richiesta.setCliente(cliente);
        if (nuova.fornitoreId() != null) {
            richiesta.setFornitoreRichiesto(lavoratorePrenotabile(nuova.fornitoreId(), cliente));
        }
        richiesta.setCategoria(categoria);
        richiesta.setTitolo(nuova.titolo());
        richiesta.setDescrizione(nuova.descrizione());
        richiesta.setCitta(nuova.citta());
        richiesta.setBudget(nuova.budget());
        richiesta.setDataPreferita(nuova.dataPreferita());
        if (nuova.attivitaId() != null) {
            AttivitaServizio scelta = attivita
                    .findById(nuova.attivitaId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Attività non trovata"));
            if (!scelta.getCategoria().getId().equals(categoria.getId())) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST, "L'attività non appartiene alla categoria scelta");
            }
            richiesta.setAttivita(scelta);
        }
        return RispostaRichiesta.da(richieste.save(richiesta));
    }

    @GetMapping
    public List<RispostaRichiesta> aperte() {
        return richieste.findByStatoAndFornitoreRichiestoIsNull(StatoRichiesta.APERTA).stream()
                .map(RispostaRichiesta::da)
                .toList();
    }

    /** Le prenotazioni dirette ancora da accettare, viste dal lavoratore. */
    @GetMapping("/dirette")
    public List<RispostaRichiesta> dirette(@AuthenticationPrincipal Jwt token) {
        ProfiloFornitore profilo = profiloMio(token);
        return richieste.findByFornitoreRichiestoIdAndStato(profilo.getId(), StatoRichiesta.APERTA).stream()
                .map(RispostaRichiesta::da)
                .toList();
    }

    @PostMapping("/{id}/accetta")
    @Transactional
    public RispostaRichiesta accetta(@PathVariable Long id, @AuthenticationPrincipal Jwt token) {
        RichiestaServizio richiesta = prenotazioneDiretta(id, token);

        Incarico incarico = new Incarico();
        incarico.setRichiesta(richiesta);
        incarico.setProfiloFornitore(richiesta.getFornitoreRichiesto());
        // non c'è un'offerta: il prezzo concordato è il budget indicato dal cliente
        incarico.setPrezzoConcordato(richiesta.getBudget());
        incarichi.save(incarico);

        richiesta.setStato(StatoRichiesta.ASSEGNATA);
        return RispostaRichiesta.da(richieste.save(richiesta));
    }

    /** Rifiutare non cancella la richiesta: la rende pubblica, così altri possono candidarsi. */
    @PostMapping("/{id}/rifiuta")
    @Transactional
    public RispostaRichiesta rifiuta(@PathVariable Long id, @AuthenticationPrincipal Jwt token) {
        RichiestaServizio richiesta = prenotazioneDiretta(id, token);
        richiesta.setFornitoreRichiesto(null);
        return RispostaRichiesta.da(richieste.save(richiesta));
    }

    private ProfiloFornitore lavoratorePrenotabile(Long fornitoreId, Utente cliente) {
        ProfiloFornitore profilo = profili
                .findById(fornitoreId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Lavoratore non trovato"));
        if (profilo.getStato() != StatoFornitore.APPROVATO) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Lavoratore non approvato");
        }
        if (profilo.getUtente().getId().equals(cliente.getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Non puoi prenotare te stesso");
        }
        return profilo;
    }

    private ProfiloFornitore profiloMio(Jwt token) {
        return profili
                .findByUtenteId(utenteCorrente.da(token).getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Non hai un profilo fornitore"));
    }

    private RichiestaServizio prenotazioneDiretta(Long id, Jwt token) {
        RichiestaServizio richiesta = richieste
                .findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Richiesta non trovata"));
        ProfiloFornitore profilo = profiloMio(token);
        if (richiesta.getFornitoreRichiesto() == null
                || !richiesta.getFornitoreRichiesto().getId().equals(profilo.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Non è una prenotazione per te");
        }
        if (richiesta.getStato() != StatoRichiesta.APERTA) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "La richiesta non è aperta");
        }
        return richiesta;
    }

    @GetMapping("/mie")
    public List<RispostaRichiesta> mie(@AuthenticationPrincipal Jwt token) {
        return richieste.findByClienteId(utenteCorrente.da(token).getId()).stream()
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
