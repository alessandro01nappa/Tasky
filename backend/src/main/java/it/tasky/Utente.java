package it.tasky;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

@Entity
@Table(name = "utenti")
public class Utente {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String hashPassword;

    @Column(nullable = false)
    private String nomeCompleto;

    private String telefono;

    private String citta;

    /** Un account sospeso non entra e non compare: lo decide un amministratore. */
    @Column(columnDefinition = "boolean default false")
    private boolean sospeso = false;

    @Column(length = 300)
    private String motivoSospensione;

    private LocalDateTime dataCreazione = LocalDateTime.now();

    public Long getId() {
        return id;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getHashPassword() {
        return hashPassword;
    }

    public void setHashPassword(String hashPassword) {
        this.hashPassword = hashPassword;
    }

    public String getNomeCompleto() {
        return nomeCompleto;
    }

    public void setNomeCompleto(String nomeCompleto) {
        this.nomeCompleto = nomeCompleto;
    }

    public String getTelefono() {
        return telefono;
    }

    public void setTelefono(String telefono) {
        this.telefono = telefono;
    }

    public String getCitta() {
        return citta;
    }

    public void setCitta(String citta) {
        this.citta = citta;
    }

    public boolean isSospeso() {
        return sospeso;
    }

    public void setSospeso(boolean sospeso) {
        this.sospeso = sospeso;
    }

    public String getMotivoSospensione() {
        return motivoSospensione;
    }

    public void setMotivoSospensione(String motivoSospensione) {
        this.motivoSospensione = motivoSospensione;
    }

    public LocalDateTime getDataCreazione() {
        return dataCreazione;
    }
}
