package it.tasky;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
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
@RequestMapping("/api/incarichi/{incaricoId}/chat")
public class ChatController {

    private final ConversazioneRepository conversazioni;
    private final MessaggioRepository messaggi;
    private final IncaricoRepository incarichi;
    private final UtenteCorrente utenteCorrente;

    public ChatController(
            ConversazioneRepository conversazioni,
            MessaggioRepository messaggi,
            IncaricoRepository incarichi,
            UtenteCorrente utenteCorrente) {
        this.conversazioni = conversazioni;
        this.messaggi = messaggi;
        this.incarichi = incarichi;
        this.utenteCorrente = utenteCorrente;
    }

    public record NuovoMessaggio(@NotBlank @Size(max = 2000) String testo) {}

    public record RispostaMessaggio(
            Long id, String autore, boolean scrittoDaMe, String testo, LocalDateTime dataCreazione) {}

    @GetMapping
    public List<RispostaMessaggio> leggi(
            @PathVariable Long incaricoId, @AuthenticationPrincipal Jwt token) {
        Incarico incarico = incaricoEsistente(incaricoId);
        Utente utente = partecipa(incarico, token);
        return conversazioni.findByIncaricoId(incaricoId)
                .map(conversazione -> messaggi.findByConversazioneIdOrderByDataCreazioneAscIdAsc(conversazione.getId()).stream()
                        .map(messaggio -> descrivi(messaggio, utente))
                        .toList())
                .orElse(List.of());
    }

    @PostMapping
    @Transactional
    public RispostaMessaggio scrivi(
            @PathVariable Long incaricoId,
            @Valid @RequestBody NuovoMessaggio dati,
            @AuthenticationPrincipal Jwt token) {
        Incarico incarico = incaricoEsistente(incaricoId);
        Utente utente = partecipa(incarico, token);
        Conversazione conversazione = conversazioni.findByIncaricoId(incaricoId).orElseGet(() -> {
            Conversazione nuova = new Conversazione();
            nuova.setIncarico(incarico);
            return conversazioni.save(nuova);
        });
        Messaggio messaggio = new Messaggio();
        messaggio.setConversazione(conversazione);
        messaggio.setAutore(utente);
        messaggio.setTesto(dati.testo().trim());
        return descrivi(messaggi.save(messaggio), utente);
    }

    private RispostaMessaggio descrivi(Messaggio messaggio, Utente utente) {
        return new RispostaMessaggio(
                messaggio.getId(),
                messaggio.getAutore().getNomeCompleto(),
                messaggio.getAutore().getId().equals(utente.getId()),
                messaggio.getTesto(),
                messaggio.getDataCreazione());
    }

    private Utente partecipa(Incarico incarico, Jwt token) {
        Utente utente = utenteCorrente.da(token);
        boolean cliente = incarico.getRichiesta().getCliente().getId().equals(utente.getId());
        boolean fornitore = incarico.getProfiloFornitore().getUtente().getId().equals(utente.getId());
        if (!cliente && !fornitore) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Non partecipi a questo lavoro");
        }
        return utente;
    }

    private Incarico incaricoEsistente(Long id) {
        return incarichi.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Incarico non trovato"));
    }
}
