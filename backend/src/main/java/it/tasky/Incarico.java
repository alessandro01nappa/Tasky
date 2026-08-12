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
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "incarichi")
public class Incarico {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "richiesta_id", nullable = false, unique = true)
    private RichiestaServizio richiesta;

    @ManyToOne
    @JoinColumn(name = "profilo_fornitore_id", nullable = false)
    private ProfiloFornitore profiloFornitore;

    @Column(precision = 10, scale = 2)
    private BigDecimal prezzoConcordato;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private StatoIncarico stato = StatoIncarico.ASSEGNATO;

    private LocalDateTime dataCreazione = LocalDateTime.now();

    private LocalDateTime dataCompletamento;

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

    public BigDecimal getPrezzoConcordato() {
        return prezzoConcordato;
    }

    public void setPrezzoConcordato(BigDecimal prezzoConcordato) {
        this.prezzoConcordato = prezzoConcordato;
    }

    public StatoIncarico getStato() {
        return stato;
    }

    public void setStato(StatoIncarico stato) {
        this.stato = stato;
    }

    public LocalDateTime getDataCreazione() {
        return dataCreazione;
    }

    public LocalDateTime getDataCompletamento() {
        return dataCompletamento;
    }

    public void setDataCompletamento(LocalDateTime dataCompletamento) {
        this.dataCompletamento = dataCompletamento;
    }
}
