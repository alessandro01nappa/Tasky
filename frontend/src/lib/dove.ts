import { useEffect, useState } from "react";
import { cercaLuogo, io, type Luogo } from "./api";

const CHIAVE = "tasky.dove";

/**
 * Il posto da cui il cliente guarda: categorie, esperti e distanze partono tutti
 * da qui. Sta in un posto solo e vale per tutte le pagine, altrimenti ognuna
 * risponderebbe a un "vicino a te" diverso.
 */
export function leggiDove(): Luogo | null {
  const salvato = localStorage.getItem(CHIAVE);
  if (!salvato) return null;
  try {
    return JSON.parse(salvato) as Luogo;
  } catch {
    return null;
  }
}

export function salvaDove(luogo: Luogo | null) {
  if (luogo) {
    localStorage.setItem(CHIAVE, JSON.stringify(luogo));
  } else {
    localStorage.removeItem(CHIAVE);
  }
  // le pagine aperte devono accorgersene subito
  window.dispatchEvent(new Event("tasky-dove"));
}

export function cancellaDove() {
  localStorage.removeItem(CHIAVE);
}

// la prima volta si ricava dalla città del profilo, poi resta quello scelto a mano
let partenzaCercata = false;

/** undefined finché non si sa, null se non c'è un posto da cui partire. */
export function useDove(): Luogo | null | undefined {
  const [dove, setDove] = useState<Luogo | null | undefined>(() => leggiDove() ?? undefined);

  useEffect(() => {
    const aggiorna = () => setDove(leggiDove() ?? undefined);
    window.addEventListener("tasky-dove", aggiorna);
    return () => window.removeEventListener("tasky-dove", aggiorna);
  }, []);

  useEffect(() => {
    if (leggiDove() || partenzaCercata) {
      if (!leggiDove() && partenzaCercata) setDove(null);
      return;
    }
    partenzaCercata = true;
    io()
      .then((utente) => (utente.citta ? cercaLuogo(utente.citta) : null))
      .then((luogo) => {
        if (luogo) salvaDove(luogo);
        setDove(luogo);
      })
      .catch(() => setDove(null));
  }, []);

  return dove;
}
