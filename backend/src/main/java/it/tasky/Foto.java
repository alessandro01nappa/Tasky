package it.tasky;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

/**
 * Il file vero sta nell'archivio, qui resta solo il modo di ritrovarlo e di
 * sapere chi l'ha messo. Cosi' cambiare archivio non tocca il database.
 */
@Entity
@Table(name = "foto")
public class Foto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Il nome con cui l'archivio conosce il file. */
    @Column(nullable = false, unique = true, length = 200)
    private String chiave;

    @Column(nullable = false, length = 40)
    private String tipo;

    @Column(nullable = false)
    private long dimensione;

    @ManyToOne
    @JoinColumn(name = "richiesta_id", nullable = false)
    private RichiestaServizio richiesta;

    @ManyToOne
    @JoinColumn(name = "caricata_da_id", nullable = false)
    private Utente caricataDa;

    private LocalDateTime dataCreazione = LocalDateTime.now();

    public Long getId() {
        return id;
    }

    public String getChiave() {
        return chiave;
    }

    public void setChiave(String chiave) {
        this.chiave = chiave;
    }

    public String getTipo() {
        return tipo;
    }

    public void setTipo(String tipo) {
        this.tipo = tipo;
    }

    public long getDimensione() {
        return dimensione;
    }

    public void setDimensione(long dimensione) {
        this.dimensione = dimensione;
    }

    public RichiestaServizio getRichiesta() {
        return richiesta;
    }

    public void setRichiesta(RichiestaServizio richiesta) {
        this.richiesta = richiesta;
    }

    public Utente getCaricataDa() {
        return caricataDa;
    }

    public void setCaricataDa(Utente caricataDa) {
        this.caricataDa = caricataDa;
    }

    public LocalDateTime getDataCreazione() {
        return dataCreazione;
    }
}
