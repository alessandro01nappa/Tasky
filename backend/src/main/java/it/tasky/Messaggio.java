package it.tasky;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

@Entity
@Table(name = "messaggi")
public class Messaggio {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "conversazione_id", nullable = false)
    private Conversazione conversazione;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "autore_id", nullable = false)
    private Utente autore;

    @Column(nullable = false, columnDefinition = "text", length = 2000)
    private String testo;

    private LocalDateTime dataCreazione = LocalDateTime.now();

    public Long getId() {
        return id;
    }

    public Conversazione getConversazione() {
        return conversazione;
    }

    public void setConversazione(Conversazione conversazione) {
        this.conversazione = conversazione;
    }

    public Utente getAutore() {
        return autore;
    }

    public void setAutore(Utente autore) {
        this.autore = autore;
    }

    public String getTesto() {
        return testo;
    }

    public void setTesto(String testo) {
        this.testo = testo;
    }

    public LocalDateTime getDataCreazione() {
        return dataCreazione;
    }
}
