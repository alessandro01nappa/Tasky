package it.tasky;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import java.util.LinkedHashSet;
import java.util.Set;

@Entity
@Table(name = "profili_fornitore")
public class ProfiloFornitore {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "utente_id", nullable = false, unique = true)
    private Utente utente;

    @Column(columnDefinition = "text")
    private String descrizione;

    private String zonaOperativa;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private StatoFornitore stato = StatoFornitore.IN_ATTESA;

    private LocalDateTime dataCreazione = LocalDateTime.now();

    private LocalDateTime dataApprovazione;

    @ManyToMany
    @JoinTable(
            name = "categorie_fornitore",
            joinColumns = @JoinColumn(name = "profilo_fornitore_id"),
            inverseJoinColumns = @JoinColumn(name = "categoria_servizio_id"))
    private Set<CategoriaServizio> categorie = new LinkedHashSet<>();

    public Long getId() {
        return id;
    }

    public Utente getUtente() {
        return utente;
    }

    public void setUtente(Utente utente) {
        this.utente = utente;
    }

    public String getDescrizione() {
        return descrizione;
    }

    public void setDescrizione(String descrizione) {
        this.descrizione = descrizione;
    }

    public String getZonaOperativa() {
        return zonaOperativa;
    }

    public void setZonaOperativa(String zonaOperativa) {
        this.zonaOperativa = zonaOperativa;
    }

    public StatoFornitore getStato() {
        return stato;
    }

    public void setStato(StatoFornitore stato) {
        this.stato = stato;
    }

    public LocalDateTime getDataCreazione() {
        return dataCreazione;
    }

    public LocalDateTime getDataApprovazione() {
        return dataApprovazione;
    }

    public void setDataApprovazione(LocalDateTime dataApprovazione) {
        this.dataApprovazione = dataApprovazione;
    }

    public Set<CategoriaServizio> getCategorie() {
        return categorie;
    }
}
