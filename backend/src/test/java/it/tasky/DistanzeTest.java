package it.tasky;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class DistanzeTest {

    // punti veri, per poter confrontare il risultato con la realta'
    private static final double[] ROMA = {41.8933203, 12.4829321};
    private static final double[] CIAMPINO = {41.8002891, 12.6004706};
    private static final double[] MILANO = {45.4641943, 9.1896346};

    @Test
    void loStessoPuntoDistaZero() {
        assertThat(Distanze.km(ROMA[0], ROMA[1], ROMA[0], ROMA[1])).isZero();
    }

    @Test
    void romaCiampinoSonoUnaQuindicinaDiChilometri() {
        double km = Distanze.km(ROMA[0], ROMA[1], CIAMPINO[0], CIAMPINO[1]);
        assertThat(km).isBetween(14.0, 16.0);
    }

    @Test
    void romaMilanoSonoCirca480Chilometri() {
        double km = Distanze.km(ROMA[0], ROMA[1], MILANO[0], MILANO[1]);
        assertThat(km).isBetween(470.0, 490.0);
    }

    @Test
    void laDistanzaNonCambiaInvertendoIPunti() {
        double andata = Distanze.km(ROMA[0], ROMA[1], MILANO[0], MILANO[1]);
        double ritorno = Distanze.km(MILANO[0], MILANO[1], ROMA[0], ROMA[1]);
        assertThat(andata).isEqualTo(ritorno);
    }

    @Test
    void unGradoDiLatitudineValeCircaCentoDieciChilometri() {
        // vale ovunque, ed e' il controllo piu' semplice per accorgersi di una formula sbagliata
        assertThat(Distanze.km(45.0, 9.0, 46.0, 9.0)).isBetween(110.0, 112.0);
    }

    @Test
    void allEquatoreUnGradoDiLongitudineValeQuantoUnoDiLatitudine() {
        double lungoIlMeridiano = Distanze.km(0, 0, 1, 0);
        double lungoIlParallelo = Distanze.km(0, 0, 0, 1);
        assertThat(lungoIlParallelo).isCloseTo(lungoIlMeridiano, org.assertj.core.data.Offset.offset(0.01));
    }

    @Test
    void aNordUnGradoDiLongitudineValeMenoCheAllEquatore() {
        // e' il motivo per cui non si puo' misurare con Pitagora sui gradi
        double allEquatore = Distanze.km(0, 0, 0, 1);
        double aNord = Distanze.km(60, 0, 60, 1);
        assertThat(aNord).isLessThan(allEquatore / 1.9);
    }
}
