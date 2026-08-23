package it.tasky;

/** Distanza in linea d'aria fra due punti, formula di Haversine. */
public final class Distanze {

    private static final double RAGGIO_TERRESTRE_KM = 6371;

    private Distanze() {}

    public static double km(double latA, double lonA, double latB, double lonB) {
        double dLat = Math.toRadians(latB - latA);
        double dLon = Math.toRadians(lonB - lonA);
        double a = Math.pow(Math.sin(dLat / 2), 2)
                + Math.cos(Math.toRadians(latA)) * Math.cos(Math.toRadians(latB)) * Math.pow(Math.sin(dLon / 2), 2);
        return RAGGIO_TERRESTRE_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }
}
