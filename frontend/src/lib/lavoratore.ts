import { useEffect, useState } from "react";
import { mioProfiloFornitore, type Fornitore } from "./api";

// undefined = non ancora caricato, null = l'utente non ha un profilo lavoratore
let cache: Fornitore | null | undefined = undefined;

export function scordaProfiloLavoratore() {
  cache = undefined;
}

export function useProfiloLavoratore() {
  const [profilo, setProfilo] = useState<Fornitore | null | undefined>(cache);

  useEffect(() => {
    if (cache !== undefined) return;
    mioProfiloFornitore()
      .then((p) => {
        cache = p;
        setProfilo(p);
      })
      .catch(() => {
        cache = null;
        setProfilo(null);
      });
  }, []);

  return profilo;
}
