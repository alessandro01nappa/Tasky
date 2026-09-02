package it.tasky;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

/**
 * I file su una cartella del disco. Va bene finche' l'applicazione gira su una
 * macchina sola: con due copie in esecuzione ognuna vedrebbe i propri file, ed
 * e' il momento in cui serve passare a un bucket.
 */
@Component
@ConditionalOnProperty(name = "tasky.foto.provider", havingValue = "disco", matchIfMissing = true)
public class ArchivioSuDisco implements ArchivioFoto {

    private static final Logger log = LoggerFactory.getLogger(ArchivioSuDisco.class);

    private final Path cartella;

    public ArchivioSuDisco(@Value("${tasky.foto.cartella}") String cartella) {
        this.cartella = Path.of(cartella).toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.cartella);
        } catch (IOException e) {
            throw new UncheckedIOException("Non riesco a preparare la cartella delle foto", e);
        }
        log.info("Le foto vanno in {}", this.cartella);
    }

    @Override
    public String salva(byte[] contenuto, String tipo) {
        String chiave = UUID.randomUUID() + estensione(tipo);
        try {
            Files.write(cartella.resolve(chiave), contenuto);
        } catch (IOException e) {
            throw new UncheckedIOException("Non riesco a salvare la foto", e);
        }
        return chiave;
    }

    @Override
    public byte[] leggi(String chiave) {
        try {
            return Files.readAllBytes(percorsoSicuro(chiave));
        } catch (IOException e) {
            throw new UncheckedIOException("Non riesco a leggere la foto", e);
        }
    }

    @Override
    public void cancella(String chiave) {
        try {
            Files.deleteIfExists(percorsoSicuro(chiave));
        } catch (IOException e) {
            log.warn("Foto non cancellata dal disco: {}", chiave, e);
        }
    }

    /** La chiave la generiamo noi, ma non si costruisce un percorso da una stringa senza guardarla. */
    private Path percorsoSicuro(String chiave) {
        Path percorso = cartella.resolve(chiave).normalize();
        if (!percorso.startsWith(cartella)) {
            throw new IllegalArgumentException("Chiave fuori dalla cartella delle foto");
        }
        return percorso;
    }

    private static String estensione(String tipo) {
        return switch (tipo) {
            case "image/png" -> ".png";
            case "image/webp" -> ".webp";
            default -> ".jpg";
        };
    }
}
