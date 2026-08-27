package it.tasky;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

/**
 * Gli avvisi via email. Due scelte che contano: partono in un altro thread,
 * perche' nessuno deve aspettare un server di posta per vedersi accettata una
 * candidatura; e se la posta non e' configurata o non risponde, l'avviso finisce
 * nel log e basta. Un guasto della posta non deve mai far fallire un'azione
 * dell'utente.
 */
@Component
public class Notifiche {

    private static final Logger log = LoggerFactory.getLogger(Notifiche.class);

    private final ObjectProvider<JavaMailSender> postino;
    private final String mittente;
    private final String indirizzoPubblico;
    private final boolean postaConfigurata;

    public Notifiche(
            ObjectProvider<JavaMailSender> postino,
            @Value("${tasky.email.mittente}") String mittente,
            @Value("${tasky.indirizzo-pubblico}") String indirizzoPubblico,
            @Value("${spring.mail.host:}") String server) {
        this.postino = postino;
        this.mittente = mittente;
        this.indirizzoPubblico = indirizzoPubblico;
        // senza questo controllo Spring costruisce il postino lo stesso e prova
        // localhost:587, aspettando il timeout a ogni avviso
        this.postaConfigurata = server != null && !server.isBlank();
        if (!postaConfigurata) {
            log.warn("Nessun server di posta: gli avvisi finiranno nel log. Si imposta con TASKY_SMTP_HOST.");
        }
    }

    /** Al cliente: qualcuno si e' fatto avanti per il suo lavoro. */
    @Async
    public void candidaturaRicevuta(Candidatura candidatura) {
        RichiestaServizio richiesta = candidatura.getRichiesta();
        Utente cliente = richiesta.getCliente();
        String tasker = candidatura.getProfiloFornitore().getUtente().getNomeCompleto();

        String prezzo = candidatura.getPrezzoOfferto() == null
                ? "senza indicare un prezzo"
                : "per " + candidatura.getPrezzoOfferto() + " €";

        manda(
                cliente.getEmail(),
                "Una proposta per \"" + richiesta.getTitolo() + "\"",
                """
                Ciao %s,

                %s si è candidato al tuo annuncio "%s" %s.

                %s

                Puoi vedere la proposta e rispondere qui:
                %s/richieste/%d

                Tasky
                """
                        .formatted(
                                primoNome(cliente.getNomeCompleto()),
                                tasker,
                                richiesta.getTitolo(),
                                prezzo,
                                candidatura.getMessaggio() == null ? "" : "«" + candidatura.getMessaggio() + "»",
                                indirizzoPubblico,
                                richiesta.getId()));
    }

    private void manda(String destinatario, String oggetto, String testo) {
        JavaMailSender invio = postaConfigurata ? postino.getIfAvailable() : null;
        if (invio == null) {
            log.info("Posta non configurata: avrei scritto a {} — {}", destinatario, oggetto);
            return;
        }
        try {
            SimpleMailMessage messaggio = new SimpleMailMessage();
            messaggio.setFrom(mittente);
            messaggio.setTo(destinatario);
            messaggio.setSubject(oggetto);
            messaggio.setText(testo);
            invio.send(messaggio);
            log.info("Avviso mandato a {}", destinatario);
        } catch (Exception e) {
            // un guasto della posta non deve rovinare l'azione che l'ha scatenato
            log.warn("Avviso non mandato a {}: {}", destinatario, e.getMessage());
        }
    }

    private static String primoNome(String nomeCompleto) {
        return nomeCompleto == null || nomeCompleto.isBlank() ? "" : nomeCompleto.split(" ")[0];
    }
}
