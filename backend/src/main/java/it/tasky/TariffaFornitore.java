package it.tasky;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.math.BigDecimal;

/** Quanto chiede un lavoratore per una singola categoria: 30 €/h per i montaggi, 45 per i traslochi. */
@Entity
@Table(
        name = "tariffe_fornitore",
        uniqueConstraints =
                @UniqueConstraint(columnNames = {"profilo_fornitore_id", "categoria_id"}))
public class TariffaFornitore {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "profilo_fornitore_id")
    private ProfiloFornitore profiloFornitore;

    @ManyToOne(optional = false)
    @JoinColumn(name = "categoria_id")
    private CategoriaServizio categoria;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal tariffaOraria;

    public Long getId() {
        return id;
    }

    public ProfiloFornitore getProfiloFornitore() {
        return profiloFornitore;
    }

    public void setProfiloFornitore(ProfiloFornitore profiloFornitore) {
        this.profiloFornitore = profiloFornitore;
    }

    public CategoriaServizio getCategoria() {
        return categoria;
    }

    public void setCategoria(CategoriaServizio categoria) {
        this.categoria = categoria;
    }

    public BigDecimal getTariffaOraria() {
        return tariffaOraria;
    }

    public void setTariffaOraria(BigDecimal tariffaOraria) {
        this.tariffaOraria = tariffaOraria;
    }
}
