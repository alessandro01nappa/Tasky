package it.tasky;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "tasky.foto.provider", havingValue = "cloudinary")
public class ArchivioFotoCloudinary implements ArchivioFoto {

    private final HttpClient client = HttpClient.newHttpClient();
    private final ObjectMapper mapper;
    private final String cloudName;
    private final String apiKey;
    private final String apiSecret;

    public ArchivioFotoCloudinary(
            ObjectMapper mapper,
            @Value("${tasky.foto.cloudinary.cloud-name}") String cloudName,
            @Value("${tasky.foto.cloudinary.api-key}") String apiKey,
            @Value("${tasky.foto.cloudinary.api-secret}") String apiSecret) {
        this.mapper = mapper;
        this.cloudName = cloudName;
        this.apiKey = apiKey;
        this.apiSecret = apiSecret;
    }

    @Override
    public String salva(byte[] contenuto, String tipo) {
        String publicId = "tasky/" + UUID.randomUUID();
        String timestamp = Long.toString(Instant.now().getEpochSecond());
        String firma = CloudinaryFirma.calcola(Map.of("public_id", publicId, "timestamp", timestamp), apiSecret);
        String boundary = "----Tasky" + UUID.randomUUID();
        byte[] corpo = multipart(boundary, contenuto, tipo, publicId, timestamp, firma);
        HttpRequest richiesta = HttpRequest.newBuilder(URI.create(endpoint("image/upload")))
                .header("Content-Type", "multipart/form-data; boundary=" + boundary)
                .POST(HttpRequest.BodyPublishers.ofByteArray(corpo))
                .build();
        try {
            HttpResponse<String> risposta = client.send(richiesta, HttpResponse.BodyHandlers.ofString());
            controlla(risposta);
            JsonNode json = mapper.readTree(risposta.body());
            return json.path("public_id").asText() + "|" + json.path("format").asText();
        } catch (IOException e) {
            throw new IllegalStateException("Non riesco a salvare la foto su Cloudinary", e);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Caricamento della foto interrotto", e);
        }
    }

    @Override
    public byte[] leggi(String chiave) {
        String[] parti = partiChiave(chiave);
        String url = "https://res.cloudinary.com/" + cloudName + "/image/upload/" + parti[0] + "." + parti[1];
        try {
            HttpResponse<byte[]> risposta = client.send(
                    HttpRequest.newBuilder(URI.create(url)).GET().build(),
                    HttpResponse.BodyHandlers.ofByteArray());
            controlla(risposta.statusCode(), "Cloudinary non ha restituito la foto");
            return risposta.body();
        } catch (IOException e) {
            throw new IllegalStateException("Non riesco a leggere la foto da Cloudinary", e);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Lettura della foto interrotta", e);
        }
    }

    @Override
    public void cancella(String chiave) {
        String publicId = partiChiave(chiave)[0];
        String timestamp = Long.toString(Instant.now().getEpochSecond());
        String firma = CloudinaryFirma.calcola(Map.of("public_id", publicId, "timestamp", timestamp), apiSecret);
        String corpo = form(Map.of(
                "public_id", publicId,
                "timestamp", timestamp,
                "api_key", apiKey,
                "signature", firma));
        HttpRequest richiesta = HttpRequest.newBuilder(URI.create(endpoint("image/destroy")))
                .header("Content-Type", "application/x-www-form-urlencoded")
                .POST(HttpRequest.BodyPublishers.ofString(corpo))
                .build();
        try {
            HttpResponse<String> risposta = client.send(richiesta, HttpResponse.BodyHandlers.ofString());
            controlla(risposta);
        } catch (IOException e) {
            throw new IllegalStateException("Non riesco a cancellare la foto da Cloudinary", e);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Cancellazione della foto interrotta", e);
        }
    }

    private byte[] multipart(
            String boundary, byte[] file, String tipo, String publicId, String timestamp, String firma) {
        try {
            ByteArrayOutputStream corpo = new ByteArrayOutputStream();
            campo(corpo, boundary, "api_key", apiKey);
            campo(corpo, boundary, "timestamp", timestamp);
            campo(corpo, boundary, "public_id", publicId);
            campo(corpo, boundary, "signature", firma);
            corpo.write(("--" + boundary + "\r\n").getBytes(StandardCharsets.UTF_8));
            corpo.write(("Content-Disposition: form-data; name=\"file\"; filename=\"foto\"\r\n")
                    .getBytes(StandardCharsets.UTF_8));
            corpo.write(("Content-Type: " + tipo + "\r\n\r\n").getBytes(StandardCharsets.UTF_8));
            corpo.write(file);
            corpo.write("\r\n".getBytes(StandardCharsets.UTF_8));
            corpo.write(("--" + boundary + "--\r\n").getBytes(StandardCharsets.UTF_8));
            return corpo.toByteArray();
        } catch (IOException e) {
            throw new IllegalStateException("Non riesco a preparare la foto", e);
        }
    }

    private static void campo(ByteArrayOutputStream corpo, String boundary, String nome, String valore)
            throws IOException {
        corpo.write(("--" + boundary + "\r\n").getBytes(StandardCharsets.UTF_8));
        corpo.write(("Content-Disposition: form-data; name=\"" + nome + "\"\r\n\r\n" + valore + "\r\n")
                .getBytes(StandardCharsets.UTF_8));
    }

    private String endpoint(String percorso) {
        return "https://api.cloudinary.com/v1_1/" + cloudName + "/" + percorso;
    }

    private static String form(Map<String, String> valori) {
        StringBuilder risultato = new StringBuilder();
        for (Map.Entry<String, String> valore : valori.entrySet()) {
            if (risultato.length() > 0) {
                risultato.append('&');
            }
            risultato.append(encode(valore.getKey())).append('=').append(encode(valore.getValue()));
        }
        return risultato.toString();
    }

    private static String encode(String valore) {
        return URLEncoder.encode(valore, StandardCharsets.UTF_8);
    }

    private static void controlla(HttpResponse<String> risposta) {
        controlla(risposta.statusCode(), "Cloudinary ha risposto con HTTP " + risposta.statusCode());
    }

    private static void controlla(int stato, String messaggio) {
        if (stato < 200 || stato >= 300) {
            throw new IllegalStateException(messaggio);
        }
    }

    private static String[] partiChiave(String chiave) {
        String[] parti = chiave.split("\\|", 2);
        if (parti.length != 2 || parti[0].isBlank() || parti[1].isBlank()) {
            throw new IllegalArgumentException("Chiave foto non valida");
        }
        return parti;
    }
}
