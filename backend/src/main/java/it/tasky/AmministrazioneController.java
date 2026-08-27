package it.tasky;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import java.time.LocalDateTime;
import java.util.Comparator;
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

/**
 * Quello che serve per tenere in piedi il servizio quando ci sono utenti veri:
 * guardare in faccia chi vuole lavorare, sospendere chi si comporta male,
 * togliere un annuncio che non ci sta.
 */
@RestController
@RequestMapping("/api/amministrazione")
public class AmministrazioneController {

    /** Le liste non tornano tutto: senza un tetto la pagina si pianta il giorno che cresce. */
    private static final int MASSIMO = 100;

    private final Amministratori amministratori;
    private final ProfiloFornitoreRepository profili;
    private final UtenteRepository utenti;
    private final RichiestaServizioRepository richieste;
    private final TariffaFornitoreRepository tariffe;
    private final UtenteCorrente utenteCorrente;

    public AmministrazioneController(
            Amministratori amministratori,
            ProfiloFornitoreRepository profili,
            UtenteRepository utenti,
            RichiestaServizioRepository richieste,
            TariffaFornitoreRepository tariffe,
            UtenteCorrente utenteCorrente) {
        this.amministratori = amministratori;
        this.profili = profili;
        this.utenti = utenti;
        this.richieste = richieste;
        this.tariffe = tariffe;
        this.utenteCorrente = utenteCorrente;
    }

    public record Motivo(@NotBlank String motivo) {}

    /** Un profilo da esaminare, con sotto gli occhi tutto quello che serve per decidere. */
    public record VoceDaVerificare(
            Long id,
            String nome,
            String email,
            String telefono,
            String zonaOperativa,
            String descrizione,
            TipoLavoratore tipo,
            List<String> attivita,
            int quanteTariffe,
            boolean completo,
            StatoFornitore stato,
            String motivoRifiuto,
            LocalDateTime dataCreazione) {}

    public record VoceUtente(
            Long id,
            String nome,
            String email,
            String citta,
            boolean sospeso,
            String motivoSospensione,
            boolean amministratore,
            LocalDateTime dataCreazione) {}

    public record VoceRichiesta(
            Long id, String titolo, String cliente, String citta, StatoRichiesta stato, LocalDateTime dataCreazione) {}

    // ---- Tasker da verificare -------------------------------------------------

    @GetMapping("/fornitori")
    public List<VoceDaVerificare> fornitori(
            @RequestParam(defaultValue = "IN_ATTESA") StatoFornitore stato,
            @AuthenticationPrincipal Jwt token) {
        amministratori.soloAmministratori(token);
        return profili.findByStato(stato).stream()
                .sorted(Comparator.comparing(ProfiloFornitore::getDataCreazione))
                .limit(MASSIMO)
                .map(this::descrivi)
                .toList();
    }

    /**
     * L'approvazione e' il momento in cui "Verificato" smette di essere
     * un'etichetta e diventa una cosa che qualcuno ha guardato.
     */
    @PostMapping("/fornitori/{id}/approva")
    @Transactional
    public VoceDaVerificare approva(@PathVariable Long id, @AuthenticationPrincipal Jwt token) {
        amministratori.soloAmministratori(token);
        ProfiloFornitore profilo = profiloEsistente(id);
        if (!FornitoreController.completo(profilo) || tariffeMancanti(profilo)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "Il profilo non è completo: non c'è ancora niente da approvare");
        }
        profilo.setStato(StatoFornitore.APPROVATO);
        profilo.setDataApprovazione(LocalDateTime.now());
        profilo.setMotivoRifiuto(null);
        return descrivi(profili.save(profilo));
    }

    @PostMapping("/fornitori/{id}/rifiuta")
    @Transactional
    public VoceDaVerificare rifiuta(
            @PathVariable Long id, @Valid @RequestBody Motivo dati, @AuthenticationPrincipal Jwt token) {
        amministratori.soloAmministratori(token);
        ProfiloFornitore profilo = profiloEsistente(id);
        profilo.setStato(StatoFornitore.RIFIUTATO);
        profilo.setDataApprovazione(null);
        profilo.setMotivoRifiuto(dati.motivo());
        return descrivi(profili.save(profilo));
    }

    // ---- Account --------------------------------------------------------------

    @GetMapping("/utenti")
    public List<VoceUtente> elencoUtenti(@AuthenticationPrincipal Jwt token) {
        amministratori.soloAmministratori(token);
        return utenti.findAll().stream()
                .sorted(Comparator.comparing(Utente::getDataCreazione).reversed())
                .limit(MASSIMO)
                .map(this::descrivi)
                .toList();
    }

    @PostMapping("/utenti/{id}/sospendi")
    @Transactional
    public VoceUtente sospendi(
            @PathVariable Long id, @Valid @RequestBody Motivo dati, @AuthenticationPrincipal Jwt token) {
        amministratori.soloAmministratori(token);
        Utente utente = utenteEsistente(id);
        if (amministratori.sono(utente.getEmail())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Non si sospende un amministratore");
        }
        if (utente.getId().equals(utenteCorrente.da(token).getId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Non puoi sospendere te stesso");
        }
        utente.setSospeso(true);
        utente.setMotivoSospensione(dati.motivo());
        return descrivi(utenti.save(utente));
    }

    @PostMapping("/utenti/{id}/riattiva")
    @Transactional
    public VoceUtente riattiva(@PathVariable Long id, @AuthenticationPrincipal Jwt token) {
        amministratori.soloAmministratori(token);
        Utente utente = utenteEsistente(id);
        utente.setSospeso(false);
        utente.setMotivoSospensione(null);
        return descrivi(utenti.save(utente));
    }

    // ---- Annunci --------------------------------------------------------------

    @GetMapping("/richieste")
    public List<VoceRichiesta> elencoRichieste(@AuthenticationPrincipal Jwt token) {
        amministratori.soloAmministratori(token);
        return richieste.findAll().stream()
                .sorted(Comparator.comparing(RichiestaServizio::getDataCreazione).reversed())
                .limit(MASSIMO)
                .map(r -> new VoceRichiesta(
                        r.getId(),
                        r.getTitolo(),
                        r.getCliente().getNomeCompleto(),
                        r.getCitta(),
                        r.getStato(),
                        r.getDataCreazione()))
                .toList();
    }

    /** Non si cancella: si chiude. La storia di cosa è successo serve se qualcuno reclama. */
    @PostMapping("/richieste/{id}/ritira")
    @Transactional
    public VoceRichiesta ritiraRichiesta(@PathVariable Long id, @AuthenticationPrincipal Jwt token) {
        amministratori.soloAmministratori(token);
        RichiestaServizio richiesta = richieste
                .findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Richiesta non trovata"));
        richiesta.setStato(StatoRichiesta.ANNULLATA);
        richieste.save(richiesta);
        return new VoceRichiesta(
                richiesta.getId(),
                richiesta.getTitolo(),
                richiesta.getCliente().getNomeCompleto(),
                richiesta.getCitta(),
                richiesta.getStato(),
                richiesta.getDataCreazione());
    }

    // ---- Dettagli -------------------------------------------------------------

    private boolean tariffeMancanti(ProfiloFornitore profilo) {
        List<Long> coperte = tariffe.findByProfiloFornitoreId(profilo.getId()).stream()
                .map(t -> t.getCategoria().getId())
                .toList();
        return !profilo.getCategorie().stream().allMatch(c -> coperte.contains(c.getId()));
    }

    private VoceDaVerificare descrivi(ProfiloFornitore profilo) {
        return new VoceDaVerificare(
                profilo.getId(),
                profilo.getUtente().getNomeCompleto(),
                profilo.getUtente().getEmail(),
                profilo.getUtente().getTelefono(),
                profilo.getZonaOperativa(),
                profilo.getDescrizione(),
                profilo.getTipo(),
                profilo.getAttivita().stream().map(AttivitaServizio::getNome).sorted().toList(),
                tariffe.findByProfiloFornitoreId(profilo.getId()).size(),
                FornitoreController.completo(profilo) && !tariffeMancanti(profilo),
                profilo.getStato(),
                profilo.getMotivoRifiuto(),
                profilo.getDataCreazione());
    }

    private VoceUtente descrivi(Utente utente) {
        return new VoceUtente(
                utente.getId(),
                utente.getNomeCompleto(),
                utente.getEmail(),
                utente.getCitta(),
                utente.isSospeso(),
                utente.getMotivoSospensione(),
                amministratori.sono(utente.getEmail()),
                utente.getDataCreazione());
    }

    private ProfiloFornitore profiloEsistente(Long id) {
        return profili.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Profilo non trovato"));
    }

    private Utente utenteEsistente(Long id) {
        return utenti.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Utente non trovato"));
    }
}
