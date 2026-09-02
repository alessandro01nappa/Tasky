package it.tasky;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

@Entity
@Table(name = "conversazioni")
public class Conversazione {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "incarico_id", nullable = false, unique = true)
    private Incarico incarico;

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

    public LocalDateTime getDataCreazione() {
        return dataCreazione;
    }
}
