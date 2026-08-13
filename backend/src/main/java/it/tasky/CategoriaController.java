package it.tasky;

import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/categorie")
public class CategoriaController {

    private final CategoriaServizioRepository categorie;

    public CategoriaController(CategoriaServizioRepository categorie) {
        this.categorie = categorie;
    }

    @GetMapping
    public List<CategoriaServizio> elenco() {
        return categorie.findAll();
    }
}
