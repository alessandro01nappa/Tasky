import { useEffect, useState } from "react";

export type Modalita = "cliente" | "lavoratore";

const CHIAVE = "tasky.modalita";

export function leggiModalita(): Modalita {
  return localStorage.getItem(CHIAVE) === "lavoratore" ? "lavoratore" : "cliente";
}

export function salvaModalita(modalita: Modalita) {
  localStorage.setItem(CHIAVE, modalita);
  // le pagine aperte devono accorgersene subito
  window.dispatchEvent(new Event("tasky-modalita"));
}

export function cancellaModalita() {
  localStorage.removeItem(CHIAVE);
}

export function useModalita(): Modalita {
  const [modalita, setModalita] = useState<Modalita>(leggiModalita);

  useEffect(() => {
    const aggiorna = () => setModalita(leggiModalita());
    window.addEventListener("tasky-modalita", aggiorna);
    return () => window.removeEventListener("tasky-modalita", aggiorna);
  }, []);

  return modalita;
}
