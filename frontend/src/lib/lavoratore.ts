import { useEffect, useState } from "react";
import { mioProfiloFornitore, type Fornitore } from "./api";
import { useModalita } from "./modalita";

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

/**
 * Dice se mostrare l'app come la vede chi lavora.
 * Finché il profilo sta arrivando ci si fida della modalità salvata: così la
 * navigazione non parte da cliente per poi cambiare sotto gli occhi.
 */
export function useSonoLavoratore() {
  const profilo = useProfiloLavoratore();
  const modalita = useModalita();
  return modalita === "lavoratore" && (profilo === undefined || profilo?.stato === "APPROVATO");
}
