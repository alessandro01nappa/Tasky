package it.tasky;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
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
    private final UtenteCorrente utenteCorrente;

    public FornitoreController(
            ProfiloFornitoreRepository profili,
            CategoriaServizioRepository categorie,
            UtenteCorrente utenteCorrente) {
        this.profili = profili;
        this.categorie = categorie;
        this.utenteCorrente = utenteCorrente;
    }

    public record DatiFornitore(
            @NotBlank String descrizione, @NotBlank String zonaOperativa, List<Long> categorieIds) {}

    public record RispostaFornitore(
            Long id,
            String descrizione,
            String zonaOperativa,
            StatoFornitore stato,
            List<String> categorie,
            LocalDateTime dataCreazione,
            LocalDateTime dataApprovazione) {

        static RispostaFornitore da(ProfiloFornitore profilo) {
            return new RispostaFornitore(
                    profilo.getId(),
                    profilo.getDescrizione(),
                    profilo.getZonaOperativa(),
                    profilo.getStato(),
                    profilo.getCategorie().stream()
                            .map(CategoriaServizio::getNome)
                            .toList(),
                    profilo.getDataCreazione(),
                    profilo.getDataApprovazione());
        }
    }

    @PostMapping
    public RispostaFornitore crea(@Valid @RequestBody DatiFornitore dati, @AuthenticationPrincipal Jwt token) {
        Utente utente = utenteCorrente.da(token);
        if (profili.findByUtenteId(utente.getId()).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Profilo fornitore già esistente");
        }
        ProfiloFornitore profilo = new ProfiloFornitore();
        profilo.setUtente(utente);
        applica(dati, profilo);
        return RispostaFornitore.da(profili.save(profilo));
    }

    @GetMapping
    public RispostaFornitore mio(@AuthenticationPrincipal Jwt token) {
        return RispostaFornitore.da(profiloMio(token));
    }

    @PutMapping
    public RispostaFornitore aggiorna(@Valid @RequestBody DatiFornitore dati, @AuthenticationPrincipal Jwt token) {
        ProfiloFornitore profilo = profiloMio(token);
        applica(dati, profilo);
        return RispostaFornitore.da(profili.save(profilo));
    }

    private void applica(DatiFornitore dati, ProfiloFornitore profilo) {
        profilo.setDescrizione(dati.descrizione());
        profilo.setZonaOperativa(dati.zonaOperativa());
        profilo.getCategorie().clear();
        profilo.getCategorie().addAll(categorieRichieste(dati.categorieIds()));
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
