package it.tasky;

import java.util.List;
import java.util.Set;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import java.time.Duration;

/**
 * Le foto di una richiesta. Le vede chi puo' candidarsi, perche' servono
 * proprio a capire il lavoro prima di fare un prezzo; le carica e le toglie
 * solo il cliente che ha pubblicato.
 */
@RestController
public class FotoController {

    private static final Set<String> TIPI_AMMESSI = Set.of("image/jpeg", "image/png", "image/webp");
    private static final int MASSIMO_PER_RICHIESTA = 5;

    private final FotoRepository foto;
    private final RichiestaServizioRepository richieste;
    private final ProfiloFornitoreRepository profili;
    private final IncaricoRepository incarichi;
    private final ArchivioFoto archivio;
    private final UtenteCorrente utenteCorrente;

    public FotoController(
            FotoRepository foto,
            RichiestaServizioRepository richieste,
            ProfiloFornitoreRepository profili,
            IncaricoRepository incarichi,
            ArchivioFoto archivio,
            UtenteCorrente utenteCorrente) {
        this.foto = foto;
        this.richieste = richieste;
        this.profili = profili;
        this.incarichi = incarichi;
        this.archivio = archivio;
        this.utenteCorrente = utenteCorrente;
    }

    public record VoceFoto(Long id, String tipo, long dimensione) {}

    @PostMapping("/api/richieste/{richiestaId}/foto")
    @Transactional
    public VoceFoto carica(
            @PathVariable Long richiestaId,
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal Jwt token) {

        Utente utente = utenteCorrente.da(token);
        RichiestaServizio richiesta = richiestaEsistente(richiestaId);
        if (!richiesta.getCliente().getId().equals(utente.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Non è una tua richiesta");
        }
        if (file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Il file è vuoto");
        }
        String tipo = file.getContentType();
        if (tipo == null || !TIPI_AMMESSI.contains(tipo)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Si possono caricare solo immagini jpeg, png o webp");
        }
        if (foto.countByRichiestaId(richiestaId) >= MASSIMO_PER_RICHIESTA) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "Una richiesta può avere al massimo " + MASSIMO_PER_RICHIESTA + " foto");
        }

        byte[] contenuto;
        try {
            contenuto = file.getBytes();
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Non riesco a leggere il file");
        }

        Foto riga = new Foto();
        riga.setChiave(archivio.salva(contenuto, tipo));
        riga.setTipo(tipo);
        riga.setDimensione(contenuto.length);
        riga.setRichiesta(richiesta);
        riga.setCaricataDa(utente);
        return descrivi(foto.save(riga));
    }

    @GetMapping("/api/foto/{id}")
    public ResponseEntity<byte[]> scarica(@PathVariable Long id, @AuthenticationPrincipal Jwt token) {
        Foto riga = foto.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Foto non trovata"));
        if (!puoVedere(riga.getRichiesta(), utenteCorrente.da(token))) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Foto non trovata");
        }
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(riga.getTipo()))
                // il contenuto di una chiave non cambia mai: si puo' tenere in cache
                .cacheControl(CacheControl.maxAge(Duration.ofDays(7)).cachePrivate())
                .body(archivio.leggi(riga.getChiave()));
    }

    @DeleteMapping("/api/richieste/{richiestaId}/foto/{id}")
    @Transactional
    public void cancella(
            @PathVariable Long richiestaId, @PathVariable Long id, @AuthenticationPrincipal Jwt token) {
        Foto riga = foto.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Foto non trovata"));
        if (!riga.getRichiesta().getId().equals(richiestaId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Foto non trovata");
        }
        if (!riga.getRichiesta().getCliente().getId().equals(utenteCorrente.da(token).getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Non è una tua richiesta");
        }
        foto.delete(riga);
        archivio.cancella(riga.getChiave());
    }

    /** Le foto seguono la richiesta: chi la vede, le vede. */
    private boolean puoVedere(RichiestaServizio richiesta, Utente utente) {
        if (richiesta.getCliente().getId().equals(utente.getId())) {
            return true;
        }
        if (richiesta.getStato() == StatoRichiesta.APERTA) {
            return profili.findByUtenteId(utente.getId())
                    .filter(p -> p.getStato() == StatoFornitore.APPROVATO)
                    .isPresent();
        }
        return incarichi.findByRichiestaId(richiesta.getId())
                .map(i -> i.getProfiloFornitore().getUtente().getId().equals(utente.getId()))
                .orElse(false);
    }

    static List<VoceFoto> di(FotoRepository foto, Long richiestaId) {
        return foto.findByRichiestaIdOrderById(richiestaId).stream()
                .map(FotoController::descrivi)
                .toList();
    }

    private static VoceFoto descrivi(Foto riga) {
        return new VoceFoto(riga.getId(), riga.getTipo(), riga.getDimensione());
    }

    private RichiestaServizio richiestaEsistente(Long id) {
        return richieste.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Richiesta non trovata"));
    }
}
