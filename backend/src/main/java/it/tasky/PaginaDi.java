package it.tasky;

import java.util.List;

/**
 * Una fetta di elenco. Serve perche' restituire tutto funziona finche' le righe
 * sono poche e smette di funzionare senza avvisare quando diventano tante.
 *
 * @param quante quante ce n'erano in tutto, per sapere se vale la pena chiedere ancora
 */
public record PaginaDi<T>(List<T> voci, int pagina, int perPagina, long quante, boolean altre) {

    /** Oltre questo non si va: e' li' per fermare una richiesta con un numero assurdo. */
    private static final int MASSIMO_PER_PAGINA = 100;

    public static <T> PaginaDi<T> taglia(List<T> tutte, int pagina, int quante) {
        int perPagina = Math.clamp(quante, 1, MASSIMO_PER_PAGINA);
        int primo = Math.max(pagina, 0) * perPagina;
        if (primo >= tutte.size()) {
            return new PaginaDi<>(List.of(), Math.max(pagina, 0), perPagina, tutte.size(), false);
        }
        int ultimo = Math.min(primo + perPagina, tutte.size());
        return new PaginaDi<>(
                tutte.subList(primo, ultimo),
                Math.max(pagina, 0),
                perPagina,
                tutte.size(),
                ultimo < tutte.size());
    }
}
