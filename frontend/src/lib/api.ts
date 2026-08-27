import { cancellaToken, leggiToken } from "./sessione";

// Chi svolge i lavori si chiama "Tasker" nei testi mostrati all'utente,
// "lavoratore" nel codice di questa app e "fornitore" nel backend e nel database.

export type TipoLavoratore = "PROFESSIONISTA" | "HOBBISTA";

export type Categoria = {
  id: number;
  nome: string;
};

export type Attivita = {
  id: number;
  nome: string;
  categoriaId: number;
};

export type FotoRichiesta = { id: number; tipo: string; dimensione: number };

export type Richiesta = {
  id: number;
  titolo: string;
  descrizione: string;
  citta: string;
  /** Via e civico: arrivano solo al cliente e a chi ha preso il lavoro. */
  indirizzo: string | null;
  latitudine: number | null;
  longitudine: number | null;
  /** Quanto dista dalla zona del lavoratore, se il backend sa dove sono entrambi. */
  distanzaKm: number | null;
  foto: FotoRichiesta[];
  budget: number | null;
  /** Estremi di quando si può fare: uguali = giorno preciso, entrambi nulli = nessun vincolo. */
  dataPreferita: string | null;
  dataEntro: string | null;
  stato: "APERTA" | "ASSEGNATA" | "COMPLETATA" | "ANNULLATA";
  categoria: string;
  attivita: string | null;
  cliente: string;
  fornitoreRichiesto: string | null;
  dataCreazione: string;
};

export type Candidatura = {
  id: number;
  fornitoreId: number;
  fornitore: string;
  tipo: TipoLavoratore;
  zonaOperativa: string;
  messaggio: string | null;
  prezzoOfferto: number | null;
  stato: "IN_ATTESA" | "ACCETTATA" | "RIFIUTATA";
  dataCreazione: string;
};

export type MiaCandidatura = {
  id: number;
  richiestaId: number;
  titoloRichiesta: string;
  statoRichiesta: Richiesta["stato"];
  messaggio: string | null;
  prezzoOfferto: number | null;
  stato: Candidatura["stato"];
  dataCreazione: string;
};

export type StatoIncarico = "ASSEGNATO" | "IN_CORSO" | "COMPLETATO" | "ANNULLATO";

export type Incarico = {
  id: number;
  richiestaId: number;
  titoloRichiesta: string;
  fornitore: string;
  ruolo: "CLIENTE" | "FORNITORE";
  prezzoConcordato: number | null;
  stato: StatoIncarico;
  dataCreazione: string;
  dataCompletamento: string | null;
};

export type Fornitore = {
  id: number;
  descrizione: string;
  zonaOperativa: string;
  latitudine: number | null;
  longitudine: number | null;
  stato: "IN_ATTESA" | "APPROVATO" | "RIFIUTATO";
  tipo: TipoLavoratore;
  tariffe: { categoriaId: number; categoria: string; tariffaOraria: number }[];
  terminiAccettati: boolean;
  /** Perché un amministratore l'ha respinto, se è successo. */
  motivoRifiuto: string | null;
  categorie: string[];
  attivita: string[];
  dataCreazione: string;
  dataApprovazione: string | null;
};

export type Lavoratore = {
  id: number;
  nome: string;
  descrizione: string;
  zonaOperativa: string;
  tipo: TipoLavoratore;
  tariffaMinima: number | null;
  categorie: string[];
  attivita: string[];
  media: number;
  numeroRecensioni: number;
  /** Quando lavora di solito: si legge, non filtra ancora niente. */
  disponibilita: { giorno: string; dalle: string; alle: string }[];
  /** Quanto dista dal punto indicato dal cliente, se ne ha indicato uno. */
  distanzaKm: number | null;
};

/** Una fetta di elenco: il backend non restituisce più tutto in una volta. */
export type PaginaDi<T> = {
  voci: T[];
  pagina: number;
  perPagina: number;
  quante: number;
  altre: boolean;
};

export type Recensione = {
  id: number;
  voto: number;
  commento: string | null;
  dataCreazione: string;
};

async function chiama<T>(percorso: string, opzioni: RequestInit = {}): Promise<T> {
  const token = leggiToken();

  const risposta = await fetch(percorso, {
    ...opzioni,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...opzioni.headers,
    },
  });

  // un 401 con token in mano significa sessione scaduta: si riparte dall'accesso.
  // senza token siamo sul login e il 401 è solo una credenziale sbagliata.
  if (risposta.status === 401) {
    if (token) {
      cancellaToken();
      window.location.assign("/accesso");
    }
    throw new Error(token ? "Sessione scaduta, accedi di nuovo" : "Credenziali non valide");
  }

  if (!risposta.ok) {
    throw new Error(await messaggioErrore(risposta));
  }

  // /api/io risponde text/plain, gli altri endpoint JSON
  const tipo = risposta.headers.get("content-type") ?? "";
  const corpo = tipo.includes("application/json") ? await risposta.json() : await risposta.text();
  return corpo as T;
}

async function messaggioErrore(risposta: Response) {
  try {
    const corpo = await risposta.json();
    // "detail" è dove il backend mette il motivo vero; gli altri sono ripieghi
    return corpo.detail || corpo.message || corpo.error || `Errore ${risposta.status}`;
  } catch {
    return `Errore ${risposta.status}`;
  }
}

function invia<T>(percorso: string, metodo: string, dati: unknown) {
  return chiama<T>(percorso, { method: metodo, body: JSON.stringify(dati) });
}

export function registrazione(dati: {
  email: string;
  password: string;
  nomeCompleto: string;
  telefono?: string;
  citta?: string;
}) {
  return invia<{ token: string }>("/api/registrazione", "POST", dati);
}

export function login(dati: { email: string; password: string }) {
  return invia<{ token: string }>("/api/login", "POST", dati);
}

export type Io = {
  email: string;
  nomeCompleto: string;
  telefono: string | null;
  citta: string | null;
  amministratore: boolean;
};

export function io() {
  return chiama<Io>("/api/io");
}

export function aggiornaIo(dati: { nomeCompleto: string; telefono: string; citta: string }) {
  return invia<Io>("/api/io", "PUT", dati);
}

export function categorie() {
  return chiama<Categoria[]>("/api/categorie");
}

export function attivitaDiCategoria(categoriaId: number) {
  return chiama<Attivita[]>(`/api/categorie/${categoriaId}/attivita`);
}

export function richiesteAperte(opzioni: { entroKm?: number; pagina?: number } = {}) {
  const parametri = new URLSearchParams();
  if (opzioni.entroKm) parametri.set("entroKm", String(opzioni.entroKm));
  if (opzioni.pagina) parametri.set("pagina", String(opzioni.pagina));
  return chiama<PaginaDi<Richiesta>>(`/api/richieste?${parametri}`);
}

export type Luogo = {
  latitudine: number;
  longitudine: number;
  /** La via col civico, o il nome del comune: è quello che si mostra dopo la scelta. */
  nome: string | null;
  /** Via e civico separati: la proposta può già contenere un numero. */
  via: string | null;
  civico: string | null;
  indirizzo: string;
  citta: string | null;
};

/** I posti che somigliano a quello che si sta scrivendo, da far scegliere. */
export function suggerisciLuoghi(testo: string, vicinoA?: { latitudine: number; longitudine: number }) {
  const parametri = new URLSearchParams({ testo });
  if (vicinoA) {
    parametri.set("lat", String(vicinoA.latitudine));
    parametri.set("lon", String(vicinoA.longitudine));
  }
  return chiama<Luogo[]>(`/api/luoghi/suggerimenti?${parametri}`);
}

/** Chiede al backend di tradurre un indirizzo scritto a mano in un punto sulla mappa. */
export function cercaLuogo(indirizzo: string) {
  return chiama<Luogo>(`/api/luoghi?indirizzo=${encodeURIComponent(indirizzo)}`);
}

export function mieRichieste() {
  return chiama<Richiesta[]>("/api/richieste/mie");
}

export function richiesta(id: number) {
  return chiama<Richiesta>(`/api/richieste/${id}`);
}

export function creaRichiesta(dati: {
  categoriaId: number;
  attivitaId?: number;
  fornitoreId?: number;
  titolo: string;
  descrizione: string;
  citta: string;
  indirizzo?: string;
  latitudine?: number;
  longitudine?: number;
  budget?: number | null;
  dataPreferita?: string | null;
  dataEntro?: string | null;
}) {
  return invia<Richiesta>("/api/richieste", "POST", dati);
}

export type PrezziDiRiferimento = {
  quanti: number;
  /** "attivita" se il confronto è sul lavoro preciso, "categoria" se è più largo. */
  base: "attivita" | "categoria";
  media: number | null;
  minimo: number | null;
  massimo: number | null;
};

export function prezziDiRiferimento(categoriaId: number, attivitaId?: number) {
  const parametri = new URLSearchParams({ categoriaId: String(categoriaId) });
  if (attivitaId) parametri.set("attivitaId", String(attivitaId));
  return chiama<PrezziDiRiferimento>(`/api/richieste/prezzi?${parametri}`);
}

export function richiesteDirette() {
  return chiama<Richiesta[]>("/api/richieste/dirette");
}

export function accettaRichiesta(id: number) {
  return invia<Richiesta>(`/api/richieste/${id}/accetta`, "POST", {});
}

export function rifiutaRichiesta(id: number) {
  return invia<Richiesta>(`/api/richieste/${id}/rifiuta`, "POST", {});
}

/** Ritira il proprio annuncio, finché nessuno ci sta lavorando. */
export function annullaRichiesta(id: number) {
  return invia<Richiesta>(`/api/richieste/${id}/annulla`, "POST", {});
}

/** Ferma un lavoro assegnato: lo possono fare sia il cliente sia il Tasker. */
export function annullaIncarico(id: number) {
  return invia<Incarico>(`/api/incarichi/${id}/annulla`, "POST", {});
}

/** Ritira la propria candidatura, finché il cliente non ha deciso. */
export function ritiraCandidatura(richiestaId: number, candidaturaId: number) {
  return chiama<void>(`/api/richieste/${richiestaId}/candidature/${candidaturaId}`, {
    method: "DELETE",
  });
}

export function candidatureRicevute(richiestaId: number) {
  return chiama<Candidatura[]>(`/api/richieste/${richiestaId}/candidature`);
}

export function candidati(richiestaId: number, dati: { messaggio: string; prezzoOfferto: number | null }) {
  return invia<Candidatura>(`/api/richieste/${richiestaId}/candidature`, "POST", dati);
}

export function mieCandidature() {
  return chiama<MiaCandidatura[]>("/api/fornitore/candidature");
}

export function elencoLavoratori(
  vicinoA?: { latitudine: number; longitudine: number; entroKm?: number },
  pagina = 0,
) {
  const parametri = new URLSearchParams();
  if (vicinoA) {
    parametri.set("lat", String(vicinoA.latitudine));
    parametri.set("lon", String(vicinoA.longitudine));
    if (vicinoA.entroKm) parametri.set("entroKm", String(vicinoA.entroKm));
  }
  if (pagina) parametri.set("pagina", String(pagina));
  return chiama<PaginaDi<Lavoratore>>(`/api/fornitore/elenco?${parametri}`);
}

/** Un Tasker solo: prima si cercava dentro l'elenco, che con le pagine non regge. */
export function lavoratore(id: number) {
  return chiama<Lavoratore>(`/api/fornitore/${id}`);
}

export type RecensioniLavoratore = {
  media: number;
  numero: number;
  recensioni: { voto: number; commento: string | null; dataCreazione: string }[];
};

export function recensioniLavoratore(id: number) {
  return chiama<RecensioniLavoratore>(`/api/fornitore/${id}/recensioni`);
}

export type TariffeDiMercato = {
  quanti: number;
  media: number | null;
  minima: number | null;
  massima: number | null;
};

export function tariffeDiMercato(categoriaId: number) {
  return chiama<TariffeDiMercato>(`/api/fornitore/tariffe/${categoriaId}`);
}

export function mioProfiloFornitore() {
  return chiama<Fornitore>("/api/fornitore");
}

export function creaProfiloFornitore(dati: {
  descrizione: string;
  zonaOperativa: string;
  attivitaIds: number[];
  tipo: TipoLavoratore;
  tariffe: { categoriaId: number; tariffaOraria: number }[];
  terminiAccettati: boolean;
}) {
  return invia<Fornitore>("/api/fornitore", "POST", dati);
}

export function aggiornaProfiloFornitore(dati: {
  descrizione: string;
  zonaOperativa: string;
  attivitaIds: number[];
  tipo: TipoLavoratore;
  tariffe: { categoriaId: number; tariffaOraria: number }[];
  terminiAccettati: boolean;
}) {
  return invia<Fornitore>("/api/fornitore", "PUT", dati);
}

// --- Amministrazione: la vede solo chi è configurato come tale ---

export type StatoFornitore = "IN_ATTESA" | "APPROVATO" | "RIFIUTATO";

export type TaskerDaVerificare = {
  id: number;
  nome: string;
  email: string;
  telefono: string | null;
  zonaOperativa: string;
  descrizione: string;
  tipo: TipoLavoratore;
  attivita: string[];
  quanteTariffe: number;
  completo: boolean;
  stato: StatoFornitore;
  motivoRifiuto: string | null;
  dataCreazione: string;
};

export type UtenteAmministrato = {
  id: number;
  nome: string;
  email: string;
  citta: string | null;
  sospeso: boolean;
  motivoSospensione: string | null;
  amministratore: boolean;
  dataCreazione: string;
};

export type RichiestaAmministrata = {
  id: number;
  titolo: string;
  cliente: string;
  citta: string;
  stato: Richiesta["stato"];
  dataCreazione: string;
};

export function taskerDaVerificare(stato: StatoFornitore = "IN_ATTESA") {
  return chiama<TaskerDaVerificare[]>(`/api/amministrazione/fornitori?stato=${stato}`);
}

export function approvaTasker(id: number) {
  return invia<TaskerDaVerificare>(`/api/amministrazione/fornitori/${id}/approva`, "POST", {});
}

export function rifiutaTasker(id: number, motivo: string) {
  return invia<TaskerDaVerificare>(`/api/amministrazione/fornitori/${id}/rifiuta`, "POST", { motivo });
}

export function utentiAmministrati() {
  return chiama<UtenteAmministrato[]>("/api/amministrazione/utenti");
}

export function sospendiUtente(id: number, motivo: string) {
  return invia<UtenteAmministrato>(`/api/amministrazione/utenti/${id}/sospendi`, "POST", { motivo });
}

export function riattivaUtente(id: number) {
  return invia<UtenteAmministrato>(`/api/amministrazione/utenti/${id}/riattiva`, "POST", {});
}

export function richiesteAmministrate() {
  return chiama<RichiestaAmministrata[]>("/api/amministrazione/richieste");
}

export function ritiraRichiestaDaAmministratore(id: number) {
  return invia<RichiestaAmministrata>(`/api/amministrazione/richieste/${id}/ritira`, "POST", {});
}

export function mieiIncarichi() {
  return chiama<Incarico[]>("/api/incarichi/miei");
}

export function incarico(id: number) {
  return chiama<Incarico>(`/api/incarichi/${id}`);
}

export function creaIncarico(candidaturaId: number) {
  return invia<Incarico>("/api/incarichi", "POST", { candidaturaId });
}

export function cambiaStatoIncarico(id: number, stato: StatoIncarico) {
  return invia<Incarico>(`/api/incarichi/${id}/stato`, "PUT", { stato });
}

export function leggiRecensione(incaricoId: number) {
  return chiama<Recensione>(`/api/incarichi/${incaricoId}/recensione`);
}

export function creaRecensione(incaricoId: number, dati: { voto: number; commento: string }) {
  return invia<Recensione>(`/api/incarichi/${incaricoId}/recensione`, "POST", dati);
}
