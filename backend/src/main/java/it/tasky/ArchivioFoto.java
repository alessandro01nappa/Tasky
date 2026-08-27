package it.tasky;

/**
 * Dove finiscono i file. Oggi il disco, domani un bucket: cambia solo chi
 * implementa questa interfaccia, il resto del codice non se ne accorge.
 */
public interface ArchivioFoto {

    /** Mette via il contenuto e restituisce la chiave per ritrovarlo. */
    String salva(byte[] contenuto, String tipo);

    byte[] leggi(String chiave);

    void cancella(String chiave);
}
