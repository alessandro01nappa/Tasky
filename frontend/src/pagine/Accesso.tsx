import { LogIn, UserPlus } from "lucide-react";
import Logo from "../componenti/Logo";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../lib/api";
import CampoPassword from "../componenti/CampoPassword";
import { salvaToken } from "../lib/sessione";

export default function Accesso() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errore, setErrore] = useState("");
  const [inCorso, setInCorso] = useState(false);

  async function invia(evento: React.FormEvent) {
    evento.preventDefault();
    setErrore("");
    setInCorso(true);
    try {
      const risposta = await login({ email, password });
      salvaToken(risposta.token);
      navigate("/");
    } catch (e) {
      setErrore(e instanceof Error ? e.message : "Errore inatteso");
    } finally {
      setInCorso(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* cerchio decorativo del design, corallo al 10% */}
      <div className="absolute -top-10 -right-16 size-70 rounded-full bg-corallo/10" />

      <div className="relative mx-auto flex max-w-md flex-col gap-4 px-6 pt-12">
        <div className="flex items-center gap-3">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-corallo">
            <Logo variante="bianco" className="size-7" />
          </div>
          <div>
            <p className="text-lg font-semibold">Tasky</p>
            <p className="text-sm text-fumo">Servizi di fiducia nel tuo quartiere</p>
          </div>
        </div>

        <div>
          <h1 className="text-3xl font-bold">Bentornato</h1>
          <p className="mt-1.5 text-base text-fumo">
            Accedi con mail e password per gestire richieste, chat e prenotazioni in un unico posto.
          </p>
        </div>

        <form
          onSubmit={invia}
          className="flex flex-col gap-3 rounded-3xl border border-bordo bg-white p-4"
        >
          <div>
            <p className="text-xl font-semibold">Accedi al tuo account</p>
            <p className="mt-1 text-sm text-fumo">
              Hai già un profilo cliente o Tasker? Entra da qui.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="email" className="text-sm font-medium text-fumo">
              Email
            </label>
            <div className="flex h-13 items-center gap-2 rounded-2xl border border-bordo px-4">
              <input
                id="email"
                type="email"
                placeholder="nome@email.it"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="min-w-0 flex-1 outline-none"
              />
              <span className="text-sm font-semibold text-corallo">@</span>
            </div>
          </div>

          <CampoPassword
            id="password"
            etichetta="Password"
            valore={password}
            onCambia={setPassword}
          />

          <button
            type="submit"
            disabled={inCorso}
            className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-corallo font-semibold text-white"
          >
            <LogIn className="size-5" strokeWidth={2} />
            Accedi
          </button>

          <button
            type="button"
            onClick={() => navigate("/registrazione")}
            className="flex h-11 items-center justify-center gap-2 rounded-2xl border border-bordo font-semibold"
          >
            <UserPlus className="size-5" strokeWidth={2} />
            Crea account
          </button>

          {errore && <p className="text-sm text-red-600">{errore}</p>}
        </form>

        <div className="pb-12">
          <p className="text-sm font-medium text-fumo">Nuovo qui?</p>
          <p className="mt-1 text-sm">
            Crea un account e poi, dal profilo, diventa Tasker quando vuoi.
          </p>
        </div>
      </div>
    </div>
  );
}
