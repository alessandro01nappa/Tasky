package it.tasky;

import java.util.List;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class TaskyApplication {

    public static void main(String[] args) {
        SpringApplication.run(TaskyApplication.class, args);
    }

    /** Inserisce le categorie mancanti a ogni avvio: aggiungerne una qui basta a farla comparire. */
    @Bean
    CommandLineRunner categorieIniziali(CategoriaServizioRepository categorie) {
        return args -> {
            List<String> nomi = List.of(
                    "Pulizie",
                    "Giardinaggio",
                    "Montaggi mobili",
                    "Traslochi e trasporti",
                    "Manutenzioni e riparazioni",
                    "Assistenza pratica",
                    "Idraulica",
                    "Elettricista",
                    "Imbianchino",
                    "Falegnameria",
                    "Sgomberi e smaltimento",
                    "Informatica e tecnologia",
                    "Spesa e commissioni",
                    "Cura animali",
                    "Assistenza anziani",
                    "Baby sitting",
                    "Lezioni private");
            for (String nome : nomi) {
                if (categorie.existsByNome(nome)) {
                    continue;
                }
                CategoriaServizio categoria = new CategoriaServizio();
                categoria.setNome(nome);
                categorie.save(categoria);
            }
        };
    }
}
