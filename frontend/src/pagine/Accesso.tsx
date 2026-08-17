import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login, registrazione } from "../lib/api";
import { salvaToken } from "../lib/sessione";

export default function Accesso() {
  const navigate = useNavigate();
  const [modo, setModo] = useState<"login" | "registrazione">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nomeCompleto, setNomeCompleto] = useState("");
  const [telefono, setTelefono] = useState("");
  const [citta, setCitta] = useState("");
  const [errore, setErrore] = useState("");
  const [inCorso, setInCorso] = useState(false);

  async function invia(evento: React.FormEvent) {
    evento.preventDefault();
    setErrore("");
    setInCorso(true);
    try {
      const risposta =
        modo === "login"
          ? await login({ email, password })
          : await registrazione({ email, password, nomeCompleto, telefono, citta });
      salvaToken(risposta.token);
      navigate("/");
    } catch (e) {
      setErrore(e instanceof Error ? e.message : "Errore inatteso");
    } finally {
      setInCorso(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm p-4">
      <h1 className="mb-4 text-xl font-bold">Tasky</h1>

      <div className="mb-4 flex gap-2">
        <button type="button" onClick={() => setModo("login")} className="border px-3 py-1">
          Accedi
        </button>
        <button type="button" onClick={() => setModo("registrazione")} className="border px-3 py-1">
          Registrati
        </button>
      </div>

      <form onSubmit={invia} className="flex flex-col gap-2">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="border p-2"
        />
        <input
          type="password"
          placeholder="Password (min 8 caratteri)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="border p-2"
        />

        {modo === "registrazione" && (
          <>
            <input
              placeholder="Nome e cognome"
              value={nomeCompleto}
              onChange={(e) => setNomeCompleto(e.target.value)}
              required
              className="border p-2"
            />
            <input
              placeholder="Telefono"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              className="border p-2"
            />
            <input
              placeholder="Città"
              value={citta}
              onChange={(e) => setCitta(e.target.value)}
              className="border p-2"
            />
          </>
        )}

        <button type="submit" disabled={inCorso} className="border bg-black p-2 text-white">
          {modo === "login" ? "Accedi" : "Crea account"}
        </button>
      </form>

      {errore && <p className="mt-3 text-red-600">{errore}</p>}
    </div>
  );
}
