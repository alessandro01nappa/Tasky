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
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "richieste_servizio")
public class RichiestaServizio {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "cliente_id", nullable = false)
    private Utente cliente;

    @ManyToOne
    @JoinColumn(name = "categoria_id", nullable = false)
    private CategoriaServizio categoria;

    /** Il lavoro specifico scelto dal cliente. Le richieste vecchie non ce l'hanno. */
    @ManyToOne
    private AttivitaServizio attivita;

    @Column(nullable = false, length = 150)
    private String titolo;

    @Column(nullable = false, columnDefinition = "text")
    private String descrizione;

    @Column(nullable = false, length = 120)
    private String citta;

    @Column(precision = 10, scale = 2)
    private BigDecimal budget;

    private LocalDate dataPreferita;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private StatoRichiesta stato = StatoRichiesta.APERTA;

    /** Se valorizzato la richiesta è una prenotazione diretta: la vede solo questo lavoratore. */
    @ManyToOne
    private ProfiloFornitore fornitoreRichiesto;

    private LocalDateTime dataCreazione = LocalDateTime.now();

    public Long getId() {
        return id;
    }

    public Utente getCliente() {
        return cliente;
    }

    public void setCliente(Utente cliente) {
        this.cliente = cliente;
    }

    public CategoriaServizio getCategoria() {
        return categoria;
    }

    public void setCategoria(CategoriaServizio categoria) {
        this.categoria = categoria;
    }

    public AttivitaServizio getAttivita() {
        return attivita;
    }

    public void setAttivita(AttivitaServizio attivita) {
        this.attivita = attivita;
    }

    public String getTitolo() {
        return titolo;
    }

    public void setTitolo(String titolo) {
        this.titolo = titolo;
    }

    public String getDescrizione() {
        return descrizione;
    }

    public void setDescrizione(String descrizione) {
        this.descrizione = descrizione;
    }

    public String getCitta() {
        return citta;
    }

    public void setCitta(String citta) {
        this.citta = citta;
    }

    public BigDecimal getBudget() {
        return budget;
    }

    public void setBudget(BigDecimal budget) {
        this.budget = budget;
    }

    public LocalDate getDataPreferita() {
        return dataPreferita;
    }

    public void setDataPreferita(LocalDate dataPreferita) {
        this.dataPreferita = dataPreferita;
    }

    public StatoRichiesta getStato() {
        return stato;
    }

    public void setStato(StatoRichiesta stato) {
        this.stato = stato;
    }

    public ProfiloFornitore getFornitoreRichiesto() {
        return fornitoreRichiesto;
    }

    public void setFornitoreRichiesto(ProfiloFornitore fornitoreRichiesto) {
        this.fornitoreRichiesto = fornitoreRichiesto;
    }

    public LocalDateTime getDataCreazione() {
        return dataCreazione;
    }
}
