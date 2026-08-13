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

    @Bean
    CommandLineRunner categorieIniziali(CategoriaServizioRepository categorie) {
        return args -> {
            if (categorie.count() > 0) {
                return;
            }
            List<String> nomi = List.of(
                    "Pulizie",
                    "Giardinaggio",
                    "Montaggi mobili",
                    "Traslochi e trasporti",
                    "Manutenzioni e riparazioni",
                    "Assistenza pratica");
            for (String nome : nomi) {
                CategoriaServizio categoria = new CategoriaServizio();
                categoria.setNome(nome);
                categorie.save(categoria);
            }
        };
    }
}
