package it.tasky;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

/** Il lavoro concreto dentro una categoria: "Sostituzione rubinetti" dentro "Idraulica". */
@Entity
@Table(name = "attivita_servizio")
public class AttivitaServizio {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 120)
    private String nome;

    @ManyToOne(optional = false)
    @JoinColumn(name = "categoria_id")
    private CategoriaServizio categoria;

    public Long getId() {
        return id;
    }

    public String getNome() {
        return nome;
    }

    public void setNome(String nome) {
        this.nome = nome;
    }

    public CategoriaServizio getCategoria() {
        return categoria;
    }

    public void setCategoria(CategoriaServizio categoria) {
        this.categoria = categoria;
    }
}
