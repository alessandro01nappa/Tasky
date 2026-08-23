package it.tasky;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/fornitore")
public class FornitoreController {

    private final ProfiloFornitoreRepository profili;
    private final CategoriaServizioRepository categorie;
    private final AttivitaServizioRepository attivita;
    private final TariffaFornitoreRepository tariffe;
    private final CandidaturaRepository candidature;
    private final RecensioneRepository recensioni;
    private final UtenteCorrente utenteCorrente;

    public FornitoreController(
            ProfiloFornitoreRepository profili,
            CategoriaServizioRepository categorie,
            AttivitaServizioRepository attivita,
            TariffaFornitoreRepository tariffe,
            CandidaturaRepository candidature,
            RecensioneRepository recensioni,
            UtenteCorrente utenteCorrente) {
        this.profili = profili;
        this.categorie = categorie;
        this.attivita = attivita;
        this.tariffe = tariffe;
        this.candidature = candidature;
        this.recensioni = recensioni;
        this.utenteCorrente = utenteCorrente;
    }

    public record DatiFornitore(
            @NotBlank String descrizione,
            @NotBlank String zonaOperativa,
            List<Long> categorieIds,
            List<Long> attivitaIds,
            TipoLavoratore tipo,
            List<TariffaCategoria> tariffe,
            Boolean terminiAccettati) {}

    public record TariffaCategoria(Long categoriaId, BigDecimal tariffaOraria) {}

    public record RispostaFornitore(
            Long id,
            String descrizione,
            String zonaOperativa,
            StatoFornitore stato,
            TipoLavoratore tipo,
            List<VoceTariffa> tariffe,
            boolean terminiAccettati,
            List<String> categorie,
            List<String> attivita,
            LocalDateTime dataCreazione,
            LocalDateTime dataApprovazione) {

        static RispostaFornitore da(ProfiloFornitore profilo, List<VoceTariffa> tariffe) {
            return new RispostaFornitore(
                    profilo.getId(),
                    profilo.getDescrizione(),
                    profilo.getZonaOperativa(),
                    profilo.getStato(),
                    profilo.getTipo(),
                    tariffe,
                    profilo.isTerminiAccettati(),
                    profilo.getCategorie().stream()
                            .map(CategoriaServizio::getNome)
                            .toList(),
                    profilo.getAttivita().stream()
                            .map(AttivitaServizio::getNome)
                            .sorted()
                            .toList(),
                    profilo.getDataCreazione(),
                    profilo.getDataApprovazione());
        }
    }

    /** Una candidatura vista da chi l'ha inviata: interessa la richiesta, non il fornitore. */
    public record MiaCandidatura(
            Long id,
            Long richiestaId,
            String titoloRichiesta,
            StatoRichiesta statoRichiesta,
            String messaggio,
            BigDecimal prezzoOfferto,
            StatoCandidatura stato,
            LocalDateTime dataCreazione) {

        static MiaCandidatura da(Candidatura candidatura) {
            RichiestaServizio richiesta = candidatura.getRichiesta();
            return new MiaCandidatura(
                    candidatura.getId(),
                    richiesta.getId(),
                    richiesta.getTitolo(),
                    richiesta.getStato(),
                    candidatura.getMessaggio(),
                    candidatura.getPrezzoOfferto(),
                    candidatura.getStato(),
                    candidatura.getDataCreazione());
        }
    }

    /** Un lavoratore come lo vede chi cerca: conta il nome, non l'utente dietro. */
    public record VoceElenco(
            Long id,
            String nome,
            String descrizione,
            String zonaOperativa,
            TipoLavoratore tipo,
            BigDecimal tariffaMinima,
            List<String> categorie,
            List<String> attivita,
            double media,
            int numeroRecensioni) {}

    public record VoceTariffa(Long categoriaId, String categoria, BigDecimal tariffaOraria) {}

    /** Quanto chiedono gli altri per la stessa categoria, per farsi un'idea del prezzo. */
    public record TariffeDiMercato(int quanti, BigDecimal media, BigDecimal minima, BigDecimal massima) {}

    public record VoceRecensione(int voto, String commento, LocalDateTime dataCreazione) {}

    public record RecensioniFornitore(double media, int numero, List<VoceRecensione> recensioni) {}

    @PostMapping
    public RispostaFornitore crea(@Valid @RequestBody DatiFornitore dati, @AuthenticationPrincipal Jwt token) {
        Utente utente = utenteCorrente.da(token);
        if (profili.findByUtenteId(utente.getId()).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Profilo fornitore già esistente");
        }
        ProfiloFornitore profilo = new ProfiloFornitore();
        profilo.setUtente(utente);
        applica(dati, profilo);
        profili.save(profilo);
        return concludi(dati, profilo);
    }

    @GetMapping
    public RispostaFornitore mio(@AuthenticationPrincipal Jwt token) {
        ProfiloFornitore profilo = profiloMio(token);
        return RispostaFornitore.da(profilo, vociTariffa(profilo));
    }

    @PutMapping
    public RispostaFornitore aggiorna(@Valid @RequestBody DatiFornitore dati, @AuthenticationPrincipal Jwt token) {
        ProfiloFornitore profilo = profiloMio(token);
        applica(dati, profilo);
        profili.save(profilo);
        return concludi(dati, profilo);
    }

    @GetMapping("/candidature")
    public List<MiaCandidatura> mieCandidature(@AuthenticationPrincipal Jwt token) {
        return candidature.findByProfiloFornitoreId(profiloMio(token).getId()).stream()
                .map(MiaCandidatura::da)
                .toList();
    }

    @GetMapping("/elenco")
    public List<VoceElenco> elenco() {
        return profili.findByStato(StatoFornitore.APPROVATO).stream()
                .map(profilo -> {
                    List<Recensione> ricevute =
                            recensioni.findByIncaricoProfiloFornitoreId(profilo.getId());
                    double media = ricevute.stream().mapToInt(Recensione::getVoto).average().orElse(0);
                    return new VoceElenco(
                            profilo.getId(),
                            profilo.getUtente().getNomeCompleto(),
                            profilo.getDescrizione(),
                            profilo.getZonaOperativa(),
                            profilo.getTipo(),
                            tariffe.findByProfiloFornitoreId(profilo.getId()).stream()
                                    .map(TariffaFornitore::getTariffaOraria)
                                    .min(BigDecimal::compareTo)
                                    .orElse(null),
                            profilo.getCategorie().stream()
                                    .map(CategoriaServizio::getNome)
                                    .toList(),
                            profilo.getAttivita().stream()
                                    .map(AttivitaServizio::getNome)
                                    .sorted()
                                    .toList(),
                            Math.round(media * 10) / 10.0,
                            ricevute.size());
                })
                .toList();
    }

    /** Quanto chiedono gli altri lavoratori approvati per questa categoria. */
    @GetMapping("/tariffe/{categoriaId}")
    public TariffeDiMercato tariffeDiMercato(@PathVariable Long categoriaId) {
        List<BigDecimal> prezzi = tariffe
                .findByCategoriaIdAndProfiloFornitoreStato(categoriaId, StatoFornitore.APPROVATO)
                .stream()
                .map(TariffaFornitore::getTariffaOraria)
                .sorted()
                .toList();
        if (prezzi.isEmpty()) {
            return new TariffeDiMercato(0, null, null, null);
        }
        BigDecimal somma = prezzi.stream().reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal media = somma.divide(BigDecimal.valueOf(prezzi.size()), 2, java.math.RoundingMode.HALF_UP);
        return new TariffeDiMercato(prezzi.size(), media, prezzi.get(0), prezzi.get(prezzi.size() - 1));
    }

    @GetMapping("/{id}/recensioni")
    public RecensioniFornitore recensioniRicevute(@PathVariable Long id) {
        if (!profili.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Profilo fornitore non trovato");
        }
        List<Recensione> ricevute = recensioni.findByIncaricoProfiloFornitoreId(id);
        double media = ricevute.stream().mapToInt(Recensione::getVoto).average().orElse(0);
        List<VoceRecensione> voci = ricevute.stream()
                .map(r -> new VoceRecensione(r.getVoto(), r.getCommento(), r.getDataCreazione()))
                .toList();
        return new RecensioniFornitore(Math.round(media * 10) / 10.0, ricevute.size(), voci);
    }

    /** Le tariffe si salvano dopo il profilo, perché servono l'id e le categorie già calcolate. */
    private RispostaFornitore concludi(DatiFornitore dati, ProfiloFornitore profilo) {
        salvaTariffe(dati, profilo);
        aggiornaApprovazione(profilo);
        profili.save(profilo);
        return RispostaFornitore.da(profilo, vociTariffa(profilo));
    }

    private List<VoceTariffa> vociTariffa(ProfiloFornitore profilo) {
        return tariffe.findByProfiloFornitoreId(profilo.getId()).stream()
                .map(t -> new VoceTariffa(
                        t.getCategoria().getId(), t.getCategoria().getNome(), t.getTariffaOraria()))
                .sorted(java.util.Comparator.comparing(VoceTariffa::categoria))
                .toList();
    }

    /** Serve una tariffa per ogni categoria che il lavoratore copre. */
    private boolean tariffeComplete(ProfiloFornitore profilo) {
        if (profilo.getId() == null) {
            return false;
        }
        List<Long> coperte = tariffe.findByProfiloFornitoreId(profilo.getId()).stream()
                .map(t -> t.getCategoria().getId())
                .toList();
        return profilo.getCategorie().stream().allMatch(c -> coperte.contains(c.getId()));
    }

    /** Riscrive le tariffe tenendo solo le categorie effettivamente coperte. */
    private void salvaTariffe(DatiFornitore dati, ProfiloFornitore profilo) {
        List<Long> categorieCoperte =
                profilo.getCategorie().stream().map(CategoriaServizio::getId).toList();
        tariffe.deleteAll(tariffe.findByProfiloFornitoreId(profilo.getId()));
        if (dati.tariffe() == null) {
            return;
        }
        for (TariffaCategoria voce : dati.tariffe()) {
            if (voce.tariffaOraria() == null || !categorieCoperte.contains(voce.categoriaId())) {
                continue;
            }
            CategoriaServizio categoria = categorie
                    .findById(voce.categoriaId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Categoria non trovata"));
            TariffaFornitore riga = new TariffaFornitore();
            riga.setProfiloFornitore(profilo);
            riga.setCategoria(categoria);
            riga.setTariffaOraria(voce.tariffaOraria());
            tariffe.save(riga);
        }
    }

    private void applica(DatiFornitore dati, ProfiloFornitore profilo) {
        profilo.setDescrizione(dati.descrizione());
        profilo.setZonaOperativa(dati.zonaOperativa());
        profilo.setTipo(dati.tipo() == null ? TipoLavoratore.PROFESSIONISTA : dati.tipo());
        profilo.setTerminiAccettati(Boolean.TRUE.equals(dati.terminiAccettati()));
        if (dati.attivitaIds() != null && !dati.attivitaIds().isEmpty()) {
            List<AttivitaServizio> scelte = attivitaRichieste(dati.attivitaIds());
            profilo.getAttivita().clear();
            profilo.getAttivita().addAll(scelte);
            // le categorie non si scelgono più: sono quelle dei lavori dichiarati
            profilo.getCategorie().clear();
            scelte.forEach(a -> profilo.getCategorie().add(a.getCategoria()));
        } else {
            profilo.getAttivita().clear();
            profilo.getCategorie().clear();
            profilo.getCategorie().addAll(categorieRichieste(dati.categorieIds()));
        }
    }

    /**
     * La verifica si completa da sola: il profilo è approvato quando ha tutto il necessario
     * per candidarsi. Se qualcosa viene tolto, torna in attesa.
     */
    private void aggiornaApprovazione(ProfiloFornitore profilo) {
        boolean completo = profilo.isTerminiAccettati()
                && !profilo.getCategorie().isEmpty()
                && tariffeComplete(profilo);

        if (completo && profilo.getStato() != StatoFornitore.APPROVATO) {
            profilo.setStato(StatoFornitore.APPROVATO);
            profilo.setDataApprovazione(LocalDateTime.now());
        } else if (!completo && profilo.getStato() == StatoFornitore.APPROVATO) {
            profilo.setStato(StatoFornitore.IN_ATTESA);
            profilo.setDataApprovazione(null);
        }
    }

    private List<AttivitaServizio> attivitaRichieste(List<Long> ids) {
        List<AttivitaServizio> trovate = attivita.findAllById(ids);
        if (trovate.size() != ids.stream().distinct().count()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Attività non trovata");
        }
        return trovate;
    }

    private List<CategoriaServizio> categorieRichieste(List<Long> ids) {
        if (ids == null || ids.isEmpty()) {
            return List.of();
        }
        List<CategoriaServizio> trovate = categorie.findAllById(ids);
        if (trovate.size() != ids.stream().distinct().count()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Categoria non trovata");
        }
        return trovate;
    }

    private ProfiloFornitore profiloMio(Jwt token) {
        return profili.findByUtenteId(utenteCorrente.da(token).getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Profilo fornitore non trovato"));
    }
}
