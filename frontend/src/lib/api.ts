import { cancellaToken, leggiToken } from "./sessione";

export type Categoria = {
  id: number;
  nome: string;
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

  if (risposta.status === 401) {
    cancellaToken();
    throw new Error("Sessione scaduta, accedi di nuovo");
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

export function registrazione(dati: {
  email: string;
  password: string;
  nomeCompleto: string;
  telefono: string;
  citta: string;
}) {
  return chiama<{ token: string }>("/api/registrazione", {
    method: "POST",
    body: JSON.stringify(dati),
  });
}

export function login(dati: { email: string; password: string }) {
  return chiama<{ token: string }>("/api/login", {
    method: "POST",
    body: JSON.stringify(dati),
  });
}

// restituisce l'email dell'utente del token
export function io() {
  return chiama<string>("/api/io");
}

export function categorie() {
  return chiama<Categoria[]>("/api/categorie");
}
