package it.tasky;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
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

    /** Il punto della zona operativa, per misurare quanto dista un lavoro. Non si mostra. */
    private Double latitudine;

    private Double longitudine;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private StatoFornitore stato = StatoFornitore.IN_ATTESA;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private TipoLavoratore tipo = TipoLavoratore.PROFESSIONISTA;

    @Column(columnDefinition = "boolean default false")
    private boolean terminiAccettati = false;

    private LocalDateTime dataCreazione = LocalDateTime.now();

    private LocalDateTime dataApprovazione;

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
            name = "categorie_fornitore",
            joinColumns = @JoinColumn(name = "profilo_fornitore_id"),
            inverseJoinColumns = @JoinColumn(name = "categoria_servizio_id"))
    private Set<CategoriaServizio> categorie = new LinkedHashSet<>();

    /** I lavori concreti che il lavoratore dichiara di svolgere. Le categorie si ricavano da questi. */
    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
            name = "attivita_fornitore",
            joinColumns = @JoinColumn(name = "profilo_fornitore_id"),
            inverseJoinColumns = @JoinColumn(name = "attivita_servizio_id"))
    private Set<AttivitaServizio> attivita = new LinkedHashSet<>();

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

    public Double getLatitudine() {
        return latitudine;
    }

    public void setLatitudine(Double latitudine) {
        this.latitudine = latitudine;
    }

    public Double getLongitudine() {
        return longitudine;
    }

    public void setLongitudine(Double longitudine) {
        this.longitudine = longitudine;
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

    public TipoLavoratore getTipo() {
        return tipo;
    }

    public void setTipo(TipoLavoratore tipo) {
        this.tipo = tipo;
    }

    public boolean isTerminiAccettati() {
        return terminiAccettati;
    }

    public void setTerminiAccettati(boolean terminiAccettati) {
        this.terminiAccettati = terminiAccettati;
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

    public Set<AttivitaServizio> getAttivita() {
        return attivita;
    }

    public Set<CategoriaServizio> getCategorie() {
        return categorie;
    }
}
