package it.tasky;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.TreeMap;
import java.util.Map;

final class CloudinaryFirma {

    private CloudinaryFirma() {}

    static String calcola(Map<String, String> parametri, String segreto) {
        StringBuilder contenuto = new StringBuilder();
        for (Map.Entry<String, String> parametro : new TreeMap<>(parametri).entrySet()) {
            if (parametro.getValue() == null || parametro.getValue().isEmpty()) {
                continue;
            }
            if (contenuto.length() > 0) {
                contenuto.append('&');
            }
            contenuto.append(parametro.getKey()).append('=').append(parametro.getValue());
        }
        try {
            byte[] digest = MessageDigest.getInstance("SHA-1")
                    .digest((contenuto + segreto).getBytes(StandardCharsets.UTF_8));
            StringBuilder risultato = new StringBuilder();
            for (byte valore : digest) {
                risultato.append(Character.forDigit((valore >> 4) & 0xf, 16));
                risultato.append(Character.forDigit(valore & 0xf, 16));
            }
            return risultato.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-1 non disponibile", e);
        }
    }
}
