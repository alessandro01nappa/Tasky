package it.tasky;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "tasky.foto.provider", havingValue = "supabase")
public class ArchivioFotoSupabase implements ArchivioFoto {

    private final HttpClient client = HttpClient.newHttpClient();
    private final String baseUrl;
    private final String chiave;
    private final String bucket;

    public ArchivioFotoSupabase(
            @Value("${tasky.foto.supabase.url}") String baseUrl,
            @Value("${tasky.foto.supabase.key}") String chiave,
            @Value("${tasky.foto.supabase.bucket}") String bucket) {
        this.baseUrl = baseUrl.replaceAll("/+$", "");
        this.chiave = chiave;
        this.bucket = bucket;
    }

    @Override
    public String salva(byte[] contenuto, String tipo) {
        String chiaveFile = UUID.randomUUID() + estensione(tipo);
        invia("POST", chiaveFile, contenuto, tipo);
        return chiaveFile;
    }

    @Override
    public byte[] leggi(String chiaveFile) {
        try {
            HttpResponse<byte[]> risposta = client.send(
                    richiesta("GET", chiaveFile, null, null).build(), HttpResponse.BodyHandlers.ofByteArray());
            controlla(risposta.statusCode());
            return risposta.body();
        } catch (IOException e) {
            throw new IllegalStateException("Non riesco a leggere la foto da Supabase Storage", e);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Lettura della foto interrotta", e);
        }
    }

    @Override
    public void cancella(String chiaveFile) {
        invia("DELETE", chiaveFile, null, null);
    }

    private void invia(String metodo, String chiaveFile, byte[] contenuto, String tipo) {
        try {
            HttpResponse<Void> risposta = client.send(
                    richiesta(metodo, chiaveFile, contenuto, tipo).build(), HttpResponse.BodyHandlers.discarding());
            controlla(risposta.statusCode());
        } catch (IOException e) {
            throw new IllegalStateException("Non riesco a salvare la foto su Supabase Storage", e);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Operazione foto interrotta", e);
        }
    }

    private HttpRequest.Builder richiesta(String metodo, String chiaveFile, byte[] contenuto, String tipo) {
        HttpRequest.BodyPublisher corpo = contenuto == null
                ? HttpRequest.BodyPublishers.noBody()
                : HttpRequest.BodyPublishers.ofByteArray(contenuto);
        return HttpRequest.newBuilder(URI.create(baseUrl + "/storage/v1/object/" + bucket + "/" + chiaveFile))
                .method(metodo, corpo)
                .header("Authorization", "Bearer " + chiave)
                .header("apikey", chiave)
                .header("Content-Type", tipo == null ? "application/octet-stream" : tipo);
    }

    private void controlla(int stato) {
        if (stato < 200 || stato >= 300) {
            throw new IllegalStateException("Supabase Storage ha risposto con HTTP " + stato);
        }
    }

    private static String estensione(String tipo) {
        return switch (tipo) {
            case "image/png" -> ".png";
            case "image/webp" -> ".webp";
            default -> ".jpg";
        };
    }
}
