const CHIAVE = "tasky.token";

export function leggiToken() {
  return localStorage.getItem(CHIAVE);
}

export function salvaToken(token: string) {
  localStorage.setItem(CHIAVE, token);
}

export function cancellaToken() {
  localStorage.removeItem(CHIAVE);
}
