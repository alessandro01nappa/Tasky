package it.tasky;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

/**
 * Un indirizzo gia' tradotto in coordinate. Serve da memoria: Nominatim accetta
 * una richiesta al secondo, quindi lo stesso indirizzo va chiesto una volta sola.
 */
@Entity
@Table(name = "luoghi")
public class Luogo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Il testo cercato, ripulito e minuscolo: e' la chiave della memoria. */
    @Column(nullable = false, unique = true, length = 300)
    private String cercato;

    @Column(nullable = false)
    private double latitudine;

    @Column(nullable = false)
    private double longitudine;

    /** L'indirizzo come lo scrive Nominatim, da mostrare al cliente per conferma. */
    @Column(nullable = false, length = 400)
    private String indirizzo;

    @Column(length = 120)
    private String citta;

    private LocalDateTime dataCreazione = LocalDateTime.now();

    public Long getId() {
        return id;
    }

    public String getCercato() {
        return cercato;
    }

    public void setCercato(String cercato) {
        this.cercato = cercato;
    }

    public double getLatitudine() {
        return latitudine;
    }

    public void setLatitudine(double latitudine) {
        this.latitudine = latitudine;
    }

    public double getLongitudine() {
        return longitudine;
    }

    public void setLongitudine(double longitudine) {
        this.longitudine = longitudine;
    }

    public String getIndirizzo() {
        return indirizzo;
    }

    public void setIndirizzo(String indirizzo) {
        this.indirizzo = indirizzo;
    }

    public String getCitta() {
        return citta;
    }

    public void setCitta(String citta) {
        this.citta = citta;
    }

    public LocalDateTime getDataCreazione() {
        return dataCreazione;
    }
}
