package it.tasky;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.util.Map;
import org.junit.jupiter.api.Test;

class CloudinaryFirmaTest {

    @Test
    void ordinaIParametriPrimaDiFirmare() {
        assertEquals(
                "b60eb0c4663ff7f80dee83f87add8308a18a69c7",
                CloudinaryFirma.calcola(
                        Map.of("timestamp", "1700000000", "public_id", "tasky/test"), "secret"));
    }
}
