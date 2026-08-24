package it.tasky;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

/**
 * Photon manda i pezzi dell'indirizzo separati: qui si controlla che tornino a
 * essere qualcosa di leggibile. Sono risposte vere, copiate dal servizio.
 */
class GeocodificaTest {

    private final ObjectMapper json = new ObjectMapper();

    private JsonNode dati(String testo) {
        return json.readTree(testo);
    }

    private static final String COMUNE =
            """
            {"osm_key":"place","osm_value":"town","name":"Frascati","county":"Roma Capitale",
             "state":"Lazio","country":"Italia","postcode":"00044","countrycode":"IT"}""";

    private static final String CIVICO =
            """
            {"osm_key":"place","osm_value":"house","housenumber":"100","street":"Via Nazionale",
             "district":"Rivabella","city":"Malalbergo","county":"Bologna",
             "state":"Emilia-Romagna","country":"Italia","postcode":"40051","countrycode":"IT"}""";

    private static final String VIA_SENZA_CIVICO =
            """
            {"osm_key":"highway","osm_value":"residential","name":"Via Nazionale","city":"Roma",
             "county":"Roma Capitale","state":"Lazio","country":"Italia","countrycode":"IT"}""";

    @Test
    void diUnComuneTieneIlNome() {
        assertThat(Geocodifica.nomeDi(dati(COMUNE))).isEqualTo("Frascati");
        assertThat(Geocodifica.comune(dati(COMUNE))).isEqualTo("Frascati");
    }

    @Test
    void diUnIndirizzoUnisceViaECivico() {
        assertThat(Geocodifica.nomeDi(dati(CIVICO))).isEqualTo("Via Nazionale 100");
        assertThat(Geocodifica.comune(dati(CIVICO))).isEqualTo("Malalbergo");
    }

    @Test
    void diUnaViaSenzaCivicoTieneSoloLaVia() {
        assertThat(Geocodifica.nomeDi(dati(VIA_SENZA_CIVICO))).isEqualTo("Via Nazionale");
        assertThat(Geocodifica.comune(dati(VIA_SENZA_CIVICO))).isEqualTo("Roma");
    }

    @Test
    void lIndirizzoCompletoVaDalPiuPrecisoAlPiuGenerico() {
        assertThat(Geocodifica.scrivi(dati(CIVICO)))
                .isEqualTo("Via Nazionale 100, Malalbergo, Rivabella, 40051, Bologna, Emilia-Romagna, Italia");
    }

    @Test
    void nellIndirizzoNonSiRipeteLoStessoNomeDueVolte() {
        // il comune si chiama come il posto: comparirebbe due volte
        String indirizzo = Geocodifica.scrivi(dati(COMUNE));
        assertThat(indirizzo).isEqualTo("Frascati, 00044, Roma Capitale, Lazio, Italia");
        assertThat(indirizzo.split("Frascati", -1)).hasSize(2);
    }

    @Test
    void iCampiVuotiValgonoComeAssenti() {
        JsonNode vuoti = dati("{\"name\":\"Roma\",\"city\":\"   \",\"country\":\"Italia\"}");
        assertThat(Geocodifica.testo(vuoti, "city")).isNull();
        assertThat(Geocodifica.testo(vuoti, "inesistente")).isNull();
        assertThat(Geocodifica.testo(vuoti, "name")).isEqualTo("Roma");
    }
}
