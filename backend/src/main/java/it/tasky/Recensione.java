package it.tasky;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import org.hibernate.annotations.Check;

@Entity
@Table(name = "recensioni")
@Check(constraints = "voto between 1 and 5")
public class Recensione {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "incarico_id", nullable = false, unique = true)
    private Incarico incarico;

    @Column(nullable = false)
    private int voto;

    @Column(columnDefinition = "text")
    private String commento;

    private LocalDateTime dataCreazione = LocalDateTime.now();

    public Long getId() {
        return id;
    }

    public Incarico getIncarico() {
        return incarico;
    }

    public void setIncarico(Incarico incarico) {
        this.incarico = incarico;
    }

    public int getVoto() {
        return voto;
    }

    public void setVoto(int voto) {
        this.voto = voto;
    }

    public String getCommento() {
        return commento;
    }

    public void setCommento(String commento) {
        this.commento = commento;
    }

    public LocalDateTime getDataCreazione() {
        return dataCreazione;
    }
}
