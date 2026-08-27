package it.tasky;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.DayOfWeek;
import java.time.LocalTime;

/**
 * Quando un Tasker lavora, di solito. Piu' righe sullo stesso giorno fanno piu'
 * fasce: mattina e pomeriggio sono due, con in mezzo la pausa.
 */
@Entity
@Table(name = "fasce_disponibilita")
public class FasciaDisponibilita {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "profilo_fornitore_id", nullable = false)
    private ProfiloFornitore profiloFornitore;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 12)
    private DayOfWeek giorno;

    @Column(nullable = false)
    private LocalTime dalle;

    @Column(nullable = false)
    private LocalTime alle;

    public Long getId() {
        return id;
    }

    public ProfiloFornitore getProfiloFornitore() {
        return profiloFornitore;
    }

    public void setProfiloFornitore(ProfiloFornitore profiloFornitore) {
        this.profiloFornitore = profiloFornitore;
    }

    public DayOfWeek getGiorno() {
        return giorno;
    }

    public void setGiorno(DayOfWeek giorno) {
        this.giorno = giorno;
    }

    public LocalTime getDalle() {
        return dalle;
    }

    public void setDalle(LocalTime dalle) {
        this.dalle = dalle;
    }

    public LocalTime getAlle() {
        return alle;
    }

    public void setAlle(LocalTime alle) {
        this.alle = alle;
    }
}
