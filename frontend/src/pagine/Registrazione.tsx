import { Check, Mail, User } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registrazione } from "../lib/api";
import CampoPassword from "../componenti/CampoPassword";
import { salvaToken } from "../lib/sessione";

export default function Registrazione() {
  const navigate = useNavigate();
  const [nomeCompleto, setNomeCompleto] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [conferma, setConferma] = useState("");
  const [accettato, setAccettato] = useState(false);
  const [errore, setErrore] = useState("");
  const [inCorso, setInCorso] = useState(false);

  async function invia(evento: React.FormEvent) {
    evento.preventDefault();
    setErrore("");

    if (password !== conferma) {
      setErrore("Le due password non coincidono");
      return;
    }

    setInCorso(true);
    try {
      const risposta = await registrazione({ email, password, nomeCompleto });
      salvaToken(risposta.token);
      navigate("/permessi");
    } catch (e) {
      setErrore(e instanceof Error ? e.message : "Errore inatteso");
    } finally {
      setInCorso(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="absolute -top-14 -right-16 size-65 rounded-full bg-corallo/10" />

      <div className="relative mx-auto flex max-w-md flex-col gap-4 px-6 pt-13 pb-12">
        <div>
          <h1 className="text-3xl font-bold">Crea il tuo account</h1>
          <p className="mt-2 text-base text-fumo">
            Inizia come cliente e diventa Tasker dal profilo quando vuoi.
          </p>
        </div>

        <form onSubmit={invia} className="flex flex-col gap-3 rounded-3xl border border-bordo bg-white p-4">
          <p className="text-xl font-semibold">Dati base</p>

          <div className="flex flex-col gap-2">
            <label htmlFor="nome" className="text-xs font-medium text-fumo">
              Nome e cognome
            </label>
            <div className="flex h-11 items-center gap-2 rounded-2xl border border-bordo px-4">
              <input
                id="nome"
                placeholder="Mario Rossi"
                value={nomeCompleto}
                onChange={(e) => setNomeCompleto(e.target.value)}
                required
                className="min-w-0 flex-1 text-sm outline-none"
              />
              <User className="size-5 shrink-0 text-fumo" strokeWidth={1.75} />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="email" className="text-xs font-medium text-fumo">
              Email
            </label>
            <div className="flex h-11 items-center gap-2 rounded-2xl border border-bordo px-4">
              <input
                id="email"
                type="email"
                placeholder="nome@email.it"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="min-w-0 flex-1 text-sm outline-none"
              />
              <Mail className="size-5 shrink-0 text-fumo" strokeWidth={1.75} />
            </div>
          </div>

          <CampoPassword
            id="password"
            etichetta="Password"
            valore={password}
            onCambia={setPassword}
            minLength={8}
          />

          <CampoPassword
            id="conferma"
            etichetta="Conferma password"
            valore={conferma}
            onCambia={setConferma}
          />

          <label className="flex items-center gap-2.5 text-sm text-fumo">
            <span className="relative flex size-5 shrink-0 items-center justify-center">
              <input
                type="checkbox"
                checked={accettato}
                onChange={(e) => setAccettato(e.target.checked)}
                required
                className="size-5 appearance-none rounded-md border border-bordo bg-white checked:border-verde checked:bg-verde"
              />
              {accettato && (
                <Check className="pointer-events-none absolute size-3.5 text-white" strokeWidth={3} />
              )}
            </span>
            Accetto termini e privacy.
          </label>

          <button
            type="submit"
            disabled={inCorso}
            className="h-12 rounded-2xl bg-corallo text-sm font-semibold text-white"
          >
            Crea account
          </button>

          <button
            type="button"
            onClick={() => navigate("/accesso")}
            className="h-12 rounded-2xl border border-bordo text-sm font-semibold"
          >
            Ho già un account
          </button>

          {errore && <p className="text-sm text-red-600">{errore}</p>}
        </form>

        <p className="text-sm text-fumo">
          Potrai completare zona, preferenze e profilo subito dopo il primo accesso.
        </p>
      </div>
    </div>
  );
}
