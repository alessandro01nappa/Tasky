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
import jakarta.persistence.UniqueConstraint;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "candidature",
        uniqueConstraints = @UniqueConstraint(columnNames = {"richiesta_id", "profilo_fornitore_id"}))
public class Candidatura {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "richiesta_id", nullable = false)
    private RichiestaServizio richiesta;

    @ManyToOne
    @JoinColumn(name = "profilo_fornitore_id", nullable = false)
    private ProfiloFornitore profiloFornitore;

    @Column(columnDefinition = "text")
    private String messaggio;

    @Column(precision = 10, scale = 2)
    private BigDecimal prezzoOfferto;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private StatoCandidatura stato = StatoCandidatura.IN_ATTESA;

    private LocalDateTime dataCreazione = LocalDateTime.now();

    public Long getId() {
        return id;
    }

    public RichiestaServizio getRichiesta() {
        return richiesta;
    }

    public void setRichiesta(RichiestaServizio richiesta) {
        this.richiesta = richiesta;
    }

    public ProfiloFornitore getProfiloFornitore() {
        return profiloFornitore;
    }

    public void setProfiloFornitore(ProfiloFornitore profiloFornitore) {
        this.profiloFornitore = profiloFornitore;
    }

    public String getMessaggio() {
        return messaggio;
    }

    public void setMessaggio(String messaggio) {
        this.messaggio = messaggio;
    }

    public BigDecimal getPrezzoOfferto() {
        return prezzoOfferto;
    }

    public void setPrezzoOfferto(BigDecimal prezzoOfferto) {
        this.prezzoOfferto = prezzoOfferto;
    }

    public StatoCandidatura getStato() {
        return stato;
    }

    public void setStato(StatoCandidatura stato) {
        this.stato = stato;
    }

    public LocalDateTime getDataCreazione() {
        return dataCreazione;
    }
}
