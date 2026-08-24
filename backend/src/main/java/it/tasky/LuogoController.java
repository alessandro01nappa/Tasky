package it.tasky;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

/**
 * Serve al cliente per controllare l'indirizzo prima di pubblicare: scrive quello
 * che ha in mente, vede come e' stato capito e solo allora va avanti.
 */
@RestController
@RequestMapping("/api/luoghi")
public class LuogoController {

    private final Geocodifica geocodifica;

    public LuogoController(Geocodifica geocodifica) {
        this.geocodifica = geocodifica;
    }

    /** Quello che si sta scrivendo somiglia a questi posti: si sceglie e non si sbaglia. */
    @GetMapping("/suggerimenti")
    public java.util.List<Geocodifica.Posizione> suggerimenti(
            @RequestParam String testo,
            @RequestParam(required = false) Double lat,
            @RequestParam(required = false) Double lon) {
        return geocodifica.suggerisci(testo, lat, lon);
    }

    @GetMapping
    public Geocodifica.Posizione cerca(@RequestParam String indirizzo) {
        return geocodifica
                .cerca(indirizzo)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Indirizzo non trovato"));
    }
}
