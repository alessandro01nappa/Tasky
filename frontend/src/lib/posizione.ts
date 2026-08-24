import { useEffect, useState } from "react";
import { cercaLuogo, io, type Luogo } from "./api";

// undefined = non ancora cercata, null = l'utente non ha una città utilizzabile
let cache: Luogo | null | undefined = undefined;

/**
 * Da dove guarda il cliente. Si ricava dalla città del suo profilo: senza un
 * punto di partenza "vicino a te" non vuol dire niente.
 */
export function usePosizioneCliente() {
  const [posizione, setPosizione] = useState<Luogo | null | undefined>(cache);

  useEffect(() => {
    if (cache !== undefined) return;
    io()
      .then((utente) => (utente.citta ? cercaLuogo(utente.citta) : null))
      .then((luogo) => {
        cache = luogo;
        setPosizione(luogo);
      })
      .catch(() => {
        cache = null;
        setPosizione(null);
      });
  }, []);

  return posizione;
}
