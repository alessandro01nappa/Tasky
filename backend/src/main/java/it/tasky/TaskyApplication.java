package it.tasky;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
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
    CommandLineRunner categorieIniziali(
            CategoriaServizioRepository categorie, AttivitaServizioRepository attivitaRepo) {
        return args -> {
            List<String> nomi = List.of(
                    "Pulizie",
                    "Giardino ed esterni",
                    "Montaggi mobili",
                    "Traslochi e trasporti",
                    "Riparazioni e piccoli lavori",
                    "Impianti idraulici",
                    "Impianti elettrici",
                    "Imbiancatura e verniciatura",
                    "Lavori in legno",
                    "Sgomberi e smaltimento",
                    "Informatica e tecnologia",
                    "Cura animali",
                    "Baby sitting",
                    "Riparazione elettrodomestici",
                    "Piastrelle e pavimenti",
                    "Camini e canne fumarie");
            for (String nome : nomi) {
                if (categorie.existsByNome(nome)) {
                    continue;
                }
                CategoriaServizio categoria = new CategoriaServizio();
                categoria.setNome(nome);
                categorie.save(categoria);
            }

            Map<String, List<String>> attivita = new LinkedHashMap<>();
            attivita.put(
                    "Pulizie",
                    List.of(
                            "Pulizia casa",
                            "Pulizia profonda",
                            "Pulizia dopo trasloco",
                            "Pulizia uffici",
                            "Lavaggio vetri",
                            "Pulizia box e garage"));
            attivita.put(
                    "Giardino ed esterni",
                    List.of(
                            "Taglio erba",
                            "Potatura siepi",
                            "Potatura alberi",
                            "Pulizia giardino",
                            "Rimozione foglie",
                            "Impianto di irrigazione"));
            attivita.put(
                    "Montaggi mobili",
                    List.of(
                            "Montaggio armadi",
                            "Montaggio letti",
                            "Montaggio scrivanie",
                            "Montaggio librerie",
                            "Smontaggio mobili",
                            "Montaggio mobili da kit"));
            attivita.put(
                    "Traslochi e trasporti",
                    List.of(
                            "Trasloco completo",
                            "Trasporto singolo mobile",
                            "Imballaggio e disimballo",
                            "Carico e scarico",
                            "Trasporto elettrodomestici",
                            "Svuoto cantina"));
            attivita.put(
                    "Riparazioni e piccoli lavori",
                    List.of(
                            "Riparazioni varie in casa",
                            "Fissaggio mensole",
                            "Montaggio TV a parete",
                            "Appendere quadri e specchi",
                            "Sostituzione maniglie",
                            "Sigillature e silicone"));
            attivita.put(
                    "Impianti idraulici",
                    List.of(
                            "Riparazione perdite",
                            "Sostituzione rubinetti",
                            "Sturare scarichi",
                            "Installazione sanitari",
                            "Sostituzione flessibili",
                            "Riparazione cassetta wc"));
            attivita.put(
                    "Impianti elettrici",
                    List.of(
                            "Sostituzione prese e interruttori",
                            "Installazione lampadari",
                            "Installazione ventilatori a soffitto",
                            "Nuovi punti luce",
                            "Riparazione impianto",
                            "Installazione videocitofono"));
            attivita.put(
                    "Imbiancatura e verniciatura",
                    List.of(
                            "Imbiancatura interni",
                            "Verniciatura porte e infissi",
                            "Rasatura pareti",
                            "Tinteggiatura esterni",
                            "Ritocchi e riparazioni",
                            "Posa carta da parati"));
            attivita.put(
                    "Lavori in legno",
                    List.of(
                            "Riparazione mobili",
                            "Mensole su misura",
                            "Riparazione porte",
                            "Sostituzione cerniere",
                            "Piccoli lavori in legno",
                            "Restauro mobili"));
            attivita.put(
                    "Sgomberi e smaltimento",
                    List.of(
                            "Sgombero cantina",
                            "Sgombero appartamento",
                            "Ritiro ingombranti",
                            "Smaltimento mobili",
                            "Svuoto garage",
                            "Ritiro elettrodomestici"));
            attivita.put(
                    "Informatica e tecnologia",
                    List.of(
                            "Configurazione computer",
                            "Installazione stampante",
                            "Rete e wifi",
                            "Recupero dati",
                            "Installazione smart TV",
                            "Domotica"));
            attivita.put(
                    "Cura animali",
                    List.of(
                            "Passeggiata cani",
                            "Pet sitting a domicilio",
                            "Toelettatura",
                            "Accompagnamento dal veterinario",
                            "Pulizia lettiere"));
            attivita.put(
                    "Baby sitting",
                    List.of(
                            "Baby sitting a ore",
                            "Accompagnamento a scuola",
                            "Aiuto compiti",
                            "Baby sitting serale",
                            "Messa in sicurezza casa"));
            attivita.put(
                    "Riparazione elettrodomestici",
                    List.of(
                            "Lavatrice",
                            "Lavastoviglie",
                            "Forno e piano cottura",
                            "Frigorifero",
                            "Asciugatrice",
                            "Installazione elettrodomestici"));
            attivita.put(
                    "Piastrelle e pavimenti",
                    List.of(
                            "Posa piastrelle",
                            "Sostituzione piastrelle rotte",
                            "Rifacimento fughe",
                            "Posa parquet",
                            "Posa laminato",
                            "Posa battiscopa"));
            attivita.put(
                    "Camini e canne fumarie",
                    List.of(
                            "Pulizia canna fumaria",
                            "Pulizia camino",
                            "Manutenzione stufa a pellet",
                            "Controllo tiraggio",
                            "Installazione stufa"));

            for (CategoriaServizio categoria : categorie.findAll()) {
                for (String nome : attivita.getOrDefault(categoria.getNome(), List.of())) {
                    if (attivitaRepo.existsByNomeAndCategoriaId(nome, categoria.getId())) {
                        continue;
                    }
                    AttivitaServizio voce = new AttivitaServizio();
                    voce.setNome(nome);
                    voce.setCategoria(categoria);
                    attivitaRepo.save(voce);
                }
            }
        };
    }
}
