package it.tasky;

import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/categorie")
public class CategoriaController {

    private final CategoriaServizioRepository categorie;
    private final AttivitaServizioRepository attivita;

    public CategoriaController(
            CategoriaServizioRepository categorie, AttivitaServizioRepository attivita) {
        this.categorie = categorie;
        this.attivita = attivita;
    }

    public record VoceAttivita(Long id, String nome, Long categoriaId) {}

    @GetMapping
    public List<CategoriaServizio> elenco() {
        return categorie.findAll();
    }

    /** I lavori concreti dentro una categoria. */
    @GetMapping("/{id}/attivita")
    public List<VoceAttivita> attivitaDella(@PathVariable Long id) {
        return attivita.findByCategoriaIdOrderByNome(id).stream()
                .map(a -> new VoceAttivita(a.getId(), a.getNome(), a.getCategoria().getId()))
                .toList();
    }
}
