import { cancellaToken, leggiToken } from "./sessione";

// I testi mostrati all'utente dicono "lavoratore", come il design.
// Codice, API e database dicono "fornitore", come il backend.

export type TipoLavoratore = "PROFESSIONISTA" | "HOBBISTA";

export type Categoria = {
  id: number;
  nome: string;
};

export type Richiesta = {
  id: number;
  titolo: string;
  descrizione: string;
  citta: string;
  budget: number | null;
  dataPreferita: string | null;
  stato: "APERTA" | "ASSEGNATA" | "COMPLETATA" | "ANNULLATA";
  categoria: string;
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
  stato: "IN_ATTESA" | "APPROVATO" | "RIFIUTATO";
  tipo: TipoLavoratore;
  tariffaOraria: number | null;
  terminiAccettati: boolean;
  categorie: string[];
  dataCreazione: string;
  dataApprovazione: string | null;
};

export type Lavoratore = {
  id: number;
  nome: string;
  descrizione: string;
  zonaOperativa: string;
  tipo: TipoLavoratore;
  tariffaOraria: number | null;
  categorie: string[];
  media: number;
  numeroRecensioni: number;
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
    return corpo.message || corpo.error || `Errore ${risposta.status}`;
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

// restituisce l'email dell'utente del token
export function io() {
  return chiama<string>("/api/io");
}

export function categorie() {
  return chiama<Categoria[]>("/api/categorie");
}

export function richiesteAperte() {
  return chiama<Richiesta[]>("/api/richieste");
}

export function mieRichieste() {
  return chiama<Richiesta[]>("/api/richieste/mie");
}

export function richiesta(id: number) {
  return chiama<Richiesta>(`/api/richieste/${id}`);
}

export function creaRichiesta(dati: {
  categoriaId: number;
  fornitoreId?: number;
  titolo: string;
  descrizione: string;
  citta: string;
  budget?: number | null;
  dataPreferita?: string | null;
}) {
  return invia<Richiesta>("/api/richieste", "POST", dati);
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

export function candidatureRicevute(richiestaId: number) {
  return chiama<Candidatura[]>(`/api/richieste/${richiestaId}/candidature`);
}

export function candidati(richiestaId: number, dati: { messaggio: string; prezzoOfferto: number | null }) {
  return invia<Candidatura>(`/api/richieste/${richiestaId}/candidature`, "POST", dati);
}

export function mieCandidature() {
  return chiama<MiaCandidatura[]>("/api/fornitore/candidature");
}

export function elencoLavoratori() {
  return chiama<Lavoratore[]>("/api/fornitore/elenco");
}

export type RecensioniLavoratore = {
  media: number;
  numero: number;
  recensioni: { voto: number; commento: string | null; dataCreazione: string }[];
};

export function recensioniLavoratore(id: number) {
  return chiama<RecensioniLavoratore>(`/api/fornitore/${id}/recensioni`);
}

export function mioProfiloFornitore() {
  return chiama<Fornitore>("/api/fornitore");
}

export function creaProfiloFornitore(dati: {
  descrizione: string;
  zonaOperativa: string;
  categorieIds: number[];
  tipo: TipoLavoratore;
  tariffaOraria: number | null;
  terminiAccettati: boolean;
}) {
  return invia<Fornitore>("/api/fornitore", "POST", dati);
}

export function aggiornaProfiloFornitore(dati: {
  descrizione: string;
  zonaOperativa: string;
  categorieIds: number[];
  tipo: TipoLavoratore;
  tariffaOraria: number | null;
  terminiAccettati: boolean;
}) {
  return invia<Fornitore>("/api/fornitore", "PUT", dati);
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
