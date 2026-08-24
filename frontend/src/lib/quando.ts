/** Il lunedì della settimana in cui cade una data. */
export function lunediDi(giorno: Date) {
  const copia = new Date(giorno);
  const spostamento = (copia.getDay() + 6) % 7;
  copia.setDate(copia.getDate() - spostamento);
  return copia;
}

export function inIso(giorno: Date) {
  return giorno.toISOString().slice(0, 10);
}

export function piuGiorni(giorno: Date, quanti: number) {
  const copia = new Date(giorno);
  copia.setDate(copia.getDate() + quanti);
  return copia;
}

const GIORNO_MESE: Intl.DateTimeFormatOptions = { day: "numeric", month: "long" };

/** "il 5 settembre", "dal 2 all'8 settembre", "quando capita". */
export function raccontaQuando(da: string | null, a: string | null) {
  if (!da) return "quando capita";
  const inizio = new Date(da);
  if (!a || a === da) {
    return `il ${inizio.toLocaleDateString("it-IT", GIORNO_MESE)}`;
  }
  const fine = new Date(a);
  const stessoMese = inizio.getMonth() === fine.getMonth();
  const testoInizio = stessoMese
    ? String(inizio.getDate())
    : inizio.toLocaleDateString("it-IT", GIORNO_MESE);
  return `dal ${testoInizio} al ${fine.toLocaleDateString("it-IT", GIORNO_MESE)}`;
}
