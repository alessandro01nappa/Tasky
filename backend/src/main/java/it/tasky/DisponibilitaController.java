package it.tasky;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

/**
 * Quando un Tasker lavora. Per ora e' un'informazione che il cliente legge sul
 * profilo: non filtra ancora niente e non promette orari precisi.
 */
@RestController
@RequestMapping("/api/fornitore/disponibilita")
public class DisponibilitaController {

    private final DisponibilitaRepository fasce;
    private final AssenzaRepository assenze;
    private final ProfiloFornitoreRepository profili;
    private final UtenteCorrente utenteCorrente;

    public DisponibilitaController(
            DisponibilitaRepository fasce,
            AssenzaRepository assenze,
            ProfiloFornitoreRepository profili,
            UtenteCorrente utenteCorrente) {
        this.fasce = fasce;
        this.assenze = assenze;
        this.profili = profili;
        this.utenteCorrente = utenteCorrente;
    }

    public record VoceFascia(@NotNull DayOfWeek giorno, @NotNull LocalTime dalle, @NotNull LocalTime alle) {}

    public record VoceAssenza(Long id, @NotNull LocalDate dal, @NotNull LocalDate al, String motivo) {}

    public record Disponibilita(List<VoceFascia> fasce, List<VoceAssenza> assenze) {}

    @GetMapping
    public Disponibilita mia(@AuthenticationPrincipal Jwt token) {
        return leggi(profiloMio(token).getId());
    }

    /** Le fasce si riscrivono tutte insieme: e' una griglia, non un elenco a cui si aggiunge. */
    @PutMapping
    @Transactional
    public Disponibilita salva(@Valid @RequestBody List<VoceFascia> nuove, @AuthenticationPrincipal Jwt token) {
        ProfiloFornitore profilo = profiloMio(token);
        for (VoceFascia voce : nuove) {
            if (!voce.alle().isAfter(voce.dalle())) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST, "Una fascia deve finire dopo essere cominciata");
            }
        }
        fasce.deleteByProfiloFornitoreId(profilo.getId());
        // le vecchie vanno tolte davvero prima di riscrivere, o restano insieme alle nuove
        fasce.flush();
        for (VoceFascia voce : nuove) {
            FasciaDisponibilita riga = new FasciaDisponibilita();
            riga.setProfiloFornitore(profilo);
            riga.setGiorno(voce.giorno());
            riga.setDalle(voce.dalle());
            riga.setAlle(voce.alle());
            fasce.save(riga);
        }
        return leggi(profilo.getId());
    }

    @PostMapping("/assenze")
    @Transactional
    public VoceAssenza aggiungiAssenza(
            @Valid @RequestBody VoceAssenza dati, @AuthenticationPrincipal Jwt token) {
        if (dati.al().isBefore(dati.dal())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "L'assenza finisce prima di cominciare");
        }
        Assenza riga = new Assenza();
        riga.setProfiloFornitore(profiloMio(token));
        riga.setDal(dati.dal());
        riga.setAl(dati.al());
        riga.setMotivo(dati.motivo());
        return descrivi(assenze.save(riga));
    }

    @DeleteMapping("/assenze/{id}")
    @Transactional
    public void togliAssenza(@PathVariable Long id, @AuthenticationPrincipal Jwt token) {
        Assenza riga = assenze.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Assenza non trovata"));
        if (!riga.getProfiloFornitore().getId().equals(profiloMio(token).getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Non è una tua assenza");
        }
        assenze.delete(riga);
    }

    /** Quella di un Tasker qualsiasi: il cliente la legge sul suo profilo. */
    static Disponibilita di(DisponibilitaRepository fasce, AssenzaRepository assenze, Long profiloId) {
        return new Disponibilita(
                fasce.findByProfiloFornitoreIdOrderByGiornoAscDalleAsc(profiloId).stream()
                        .map(f -> new VoceFascia(f.getGiorno(), f.getDalle(), f.getAlle()))
                        .toList(),
                assenze.findByProfiloFornitoreIdOrderByDalAsc(profiloId).stream()
                        .map(DisponibilitaController::descrivi)
                        .toList());
    }

    private Disponibilita leggi(Long profiloId) {
        return di(fasce, assenze, profiloId);
    }

    private static VoceAssenza descrivi(Assenza riga) {
        return new VoceAssenza(riga.getId(), riga.getDal(), riga.getAl(), riga.getMotivo());
    }

    private ProfiloFornitore profiloMio(Jwt token) {
        return profili.findByUtenteId(utenteCorrente.da(token).getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Non hai un profilo Tasker"));
    }
}
