import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import BarraNavigazione from "../componenti/BarraNavigazione";
import CardRichiesta from "../componenti/CardRichiesta";
import RiquadroInfo from "../componenti/RiquadroInfo";
import { mieRichieste, type Richiesta } from "../lib/api";

export default function MieRichieste() {
  const [richieste, setRichieste] = useState<Richiesta[]>([]);
  const [errore, setErrore] = useState("");
  const [caricato, setCaricato] = useState(false);

  useEffect(() => {
    mieRichieste()
      .then(setRichieste)
      .catch((e) => setErrore(e instanceof Error ? e.message : "Errore inatteso"))
      .finally(() => setCaricato(true));
  }, []);

  return (
    <div className="mx-auto min-h-screen max-w-md px-6 pt-7 pb-32">
      <h1 className="text-3xl font-bold">Le mie richieste</h1>
      <p className="mt-1 text-sm font-medium text-fumo">Quelle che hai pubblicato tu</p>

      <Link
        to="/richieste/nuova"
        className="mt-5 flex h-12 items-center justify-center gap-2 rounded-2xl bg-corallo text-sm font-semibold text-white"
      >
        <Plus className="size-5" strokeWidth={2.25} />
        Crea un annuncio
      </Link>

      <div className="mt-5 flex flex-col gap-3">
        {richieste.map((r) => (
          <CardRichiesta key={r.id} richiesta={r} />
        ))}
      </div>

      {caricato && richieste.length === 0 && (
        <div className="mt-5">
          <RiquadroInfo>
            Non hai ancora pubblicato nessuna richiesta. Creane una e ricevi proposte dai lavoratori
            della tua zona.
          </RiquadroInfo>
        </div>
      )}

      {errore && <p className="mt-4 text-sm text-red-600">{errore}</p>}

      <BarraNavigazione />
    </div>
  );
}
