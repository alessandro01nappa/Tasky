package it.tasky;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDate;

/** I giorni in cui il Tasker non c'e', al di la' delle sue fasce abituali. */
@Entity
@Table(name = "assenze")
public class Assenza {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "profilo_fornitore_id", nullable = false)
    private ProfiloFornitore profiloFornitore;

    @Column(nullable = false)
    private LocalDate dal;

    @Column(nullable = false)
    private LocalDate al;

    @Column(length = 200)
    private String motivo;

    public Long getId() {
        return id;
    }

    public ProfiloFornitore getProfiloFornitore() {
        return profiloFornitore;
    }

    public void setProfiloFornitore(ProfiloFornitore profiloFornitore) {
        this.profiloFornitore = profiloFornitore;
    }

    public LocalDate getDal() {
        return dal;
    }

    public void setDal(LocalDate dal) {
        this.dal = dal;
    }

    public LocalDate getAl() {
        return al;
    }

    public void setAl(LocalDate al) {
        this.al = al;
    }

    public String getMotivo() {
        return motivo;
    }

    public void setMotivo(String motivo) {
        this.motivo = motivo;
    }
}
