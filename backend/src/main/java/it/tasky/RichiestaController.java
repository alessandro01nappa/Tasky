package it.tasky;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.math.RoundingMode;
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
import org.springframework.web.bind.annotation.RequestParam;
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
    private final Geocodifica geocodifica;

    /** Sotto questi casi una media non dice niente e non va mostrata. */
    private static final int CASI_MINIMI = 3;

    public RichiestaController(
            RichiestaServizioRepository richieste,
            CategoriaServizioRepository categorie,
            IncaricoRepository incarichi,
            ProfiloFornitoreRepository profili,
            AttivitaServizioRepository attivita,
            UtenteCorrente utenteCorrente,
            Geocodifica geocodifica) {
        this.richieste = richieste;
        this.categorie = categorie;
        this.incarichi = incarichi;
        this.profili = profili;
        this.attivita = attivita;
        this.utenteCorrente = utenteCorrente;
        this.geocodifica = geocodifica;
    }

    public record RichiestaNuova(
            @NotNull Long categoriaId,
            Long attivitaId,
            Long fornitoreId,
            @NotBlank String titolo,
            @NotBlank String descrizione,
            @NotBlank String citta,
            String indirizzo,
            Double latitudine,
            Double longitudine,
            BigDecimal budget,
            LocalDate dataPreferita) {}

    public record RispostaRichiesta(
            Long id,
            String titolo,
            String descrizione,
            String citta,
            String indirizzo,
            Double latitudine,
            Double longitudine,
            Double distanzaKm,
            BigDecimal budget,
            LocalDate dataPreferita,
            StatoRichiesta stato,
            String categoria,
            String attivita,
            String cliente,
            String fornitoreRichiesto,
            LocalDateTime dataCreazione) {

        /** Per chi la richiesta riguarda: via, civico e punto esatto. */
        static RispostaRichiesta da(RichiestaServizio richiesta) {
            return costruisci(richiesta, true, null);
        }

        /**
         * Per chi sta solo guardando l'elenco. Un annuncio aperto lo vede ogni
         * lavoratore approvato, quindi via e civico restano fuori e il punto sulla
         * mappa e' arrotondato a circa un chilometro.
         */
        static RispostaRichiesta pubblica(RichiestaServizio richiesta, ProfiloFornitore chiGuarda) {
            return costruisci(richiesta, false, chiGuarda);
        }

        private static RispostaRichiesta costruisci(
                RichiestaServizio richiesta, boolean perIntero, ProfiloFornitore chiGuarda) {
            return new RispostaRichiesta(
                    richiesta.getId(),
                    richiesta.getTitolo(),
                    richiesta.getDescrizione(),
                    richiesta.getCitta(),
                    perIntero ? richiesta.getIndirizzo() : null,
                    perIntero ? richiesta.getLatitudine() : approssima(richiesta.getLatitudine()),
                    perIntero ? richiesta.getLongitudine() : approssima(richiesta.getLongitudine()),
                    distanza(richiesta, chiGuarda),
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

        private static Double approssima(Double grado) {
            return grado == null ? null : Math.round(grado * 100) / 100.0;
        }

        private static Double distanza(RichiestaServizio richiesta, ProfiloFornitore chiGuarda) {
            if (chiGuarda == null
                    || chiGuarda.getLatitudine() == null
                    || richiesta.getLatitudine() == null) {
                return null;
            }
            double km = Distanze.km(
                    chiGuarda.getLatitudine(),
                    chiGuarda.getLongitudine(),
                    richiesta.getLatitudine(),
                    richiesta.getLongitudine());
            return Math.round(km * 10) / 10.0;
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
        richiesta.setIndirizzo(nuova.indirizzo());
        // chi sceglie la via da un elenco ha gia' il punto esatto: non serve ricercarlo.
        // altrimenti si ripiega sulla citta', e se non si trova nemmeno quella la
        // richiesta esiste lo stesso, solo fuori dalla mappa.
        if (nuova.latitudine() != null && nuova.longitudine() != null) {
            richiesta.setLatitudine(nuova.latitudine());
            richiesta.setLongitudine(nuova.longitudine());
        } else {
            geocodifica.cerca(nuova.citta()).ifPresent(punto -> {
                richiesta.setLatitudine(punto.latitudine());
                richiesta.setLongitudine(punto.longitudine());
            });
        }
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

    /**
     * Quanto sono costati davvero lavori come questo. Serve al cliente per capire
     * se quello che sta offrendo e' in linea, prima di pubblicare.
     */
    public record PrezziDiRiferimento(
            int quanti, String base, BigDecimal media, BigDecimal minimo, BigDecimal massimo) {}

    @GetMapping("/prezzi")
    public PrezziDiRiferimento prezzi(
            @RequestParam Long categoriaId, @RequestParam(required = false) Long attivitaId) {
        // il lavoro preciso dice di piu' della categoria, ma solo se ci sono abbastanza casi
        if (attivitaId != null) {
            PrezziDiRiferimento sulLavoro = riassumi(
                    incarichi.findByStatoAndRichiestaAttivitaId(StatoIncarico.COMPLETATO, attivitaId),
                    "attivita");
            if (sulLavoro.quanti() >= CASI_MINIMI) {
                return sulLavoro;
            }
        }
        return riassumi(
                incarichi.findByStatoAndRichiestaCategoriaId(StatoIncarico.COMPLETATO, categoriaId),
                "categoria");
    }

    private static PrezziDiRiferimento riassumi(List<Incarico> conclusi, String base) {
        List<BigDecimal> prezzi = conclusi.stream()
                .map(Incarico::getPrezzoConcordato)
                .filter(p -> p != null && p.signum() > 0)
                .sorted()
                .toList();
        if (prezzi.size() < CASI_MINIMI) {
            return new PrezziDiRiferimento(prezzi.size(), base, null, null, null);
        }
        BigDecimal somma = prezzi.stream().reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal media = somma.divide(BigDecimal.valueOf(prezzi.size()), 0, RoundingMode.HALF_UP);
        return new PrezziDiRiferimento(
                prezzi.size(), base, media, prezzi.get(0), prezzi.get(prezzi.size() - 1));
    }

    @GetMapping
    public List<RispostaRichiesta> aperte(
            @RequestParam(required = false) Double entroKm, @AuthenticationPrincipal Jwt token) {
        ProfiloFornitore chiGuarda = profili
                .findByUtenteId(utenteCorrente.da(token).getId())
                .orElse(null);
        return richieste.findByStatoAndFornitoreRichiestoIsNull(StatoRichiesta.APERTA).stream()
                .map(richiesta -> RispostaRichiesta.pubblica(richiesta, chiGuarda))
                .filter(risposta -> entroKm == null
                        || (risposta.distanzaKm() != null && risposta.distanzaKm() <= entroKm))
                .toList();
    }

    /** Le prenotazioni dirette ancora da accettare, viste dal lavoratore. */
    @GetMapping("/dirette")
    public List<RispostaRichiesta> dirette(@AuthenticationPrincipal Jwt token) {
        ProfiloFornitore profilo = profiloMio(token);
        return richieste.findByFornitoreRichiestoIdAndStato(profilo.getId(), StatoRichiesta.APERTA).stream()
                .map(richiesta -> RispostaRichiesta.pubblica(richiesta, profilo))
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
        return RispostaRichiesta.pubblica(richieste.save(richiesta), null);
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

        Utente chiChiede = utenteCorrente.da(token);
        boolean suo = riguarda(richiesta, chiChiede.getId());
        // una richiesta non piu' aperta esiste solo per chi la sta portando avanti
        if (richiesta.getStato() != StatoRichiesta.APERTA && !suo) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Richiesta non trovata");
        }
        // finche' e' aperta la puo' aprire chiunque per candidarsi: l'indirizzo resta coperto
        return suo
                ? RispostaRichiesta.da(richiesta)
                : RispostaRichiesta.pubblica(
                        richiesta, profili.findByUtenteId(chiChiede.getId()).orElse(null));
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
