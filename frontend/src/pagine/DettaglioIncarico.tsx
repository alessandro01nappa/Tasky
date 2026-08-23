import { ArrowLeft, PartyPopper, Star } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Pagina from "../componenti/Pagina";
import StatoSuccesso from "../componenti/StatoSuccesso";
import {
  cambiaStatoIncarico,
  creaRecensione,
  incarico as leggiIncarico,
  leggiRecensione,
  type Incarico,
  type Recensione,
} from "../lib/api";

const PROSSIMO_STATO: Record<string, { stato: "IN_CORSO" | "COMPLETATO"; etichetta: string }> = {
  ASSEGNATO: { stato: "IN_CORSO", etichetta: "Inizia il lavoro" },
  IN_CORSO: { stato: "COMPLETATO", etichetta: "Segna come completato" },
};

export default function DettaglioIncarico() {
  const { id } = useParams();
  const idIncarico = Number(id);

  const [dati, setDati] = useState<Incarico | null>(null);
  const [recensione, setRecensione] = useState<Recensione | null>(null);
  const [voto, setVoto] = useState(5);
  const [commento, setCommento] = useState("");
  const [errore, setErrore] = useState("");
  const [inCorso, setInCorso] = useState(false);

  useEffect(() => {
    leggiIncarico(idIncarico)
      .then(setDati)
      .catch((e) => setErrore(e instanceof Error ? e.message : "Errore inatteso"));
    // la recensione può non esistere ancora: l'assenza non è un errore da mostrare
    leggiRecensione(idIncarico)
      .then(setRecensione)
      .catch(() => setRecensione(null));
  }, [idIncarico]);

  async function avanza() {
    if (!dati) return;
    const prossimo = PROSSIMO_STATO[dati.stato];
    if (!prossimo) return;
    setErrore("");
    try {
      setDati(await cambiaStatoIncarico(idIncarico, prossimo.stato));
    } catch (e) {
      setErrore(e instanceof Error ? e.message : "Errore inatteso");
    }
  }

  async function inviaRecensione(evento: React.FormEvent) {
    evento.preventDefault();
    setErrore("");
    setInCorso(true);
    try {
      setRecensione(await creaRecensione(idIncarico, { voto, commento }));
    } catch (e) {
      setErrore(e instanceof Error ? e.message : "Errore inatteso");
    } finally {
      setInCorso(false);
    }
  }

  if (!dati) {
    return (
      <div className="mx-auto min-h-screen max-w-md px-6 pt-7">
        <Link to="/profilo" className="flex items-center gap-1.5 text-sm font-semibold text-corallo">
          <ArrowLeft className="size-4" strokeWidth={2.25} />
          Torna al profilo
        </Link>
        {errore && <p className="mt-4 text-sm text-red-600">{errore}</p>}
      </div>
    );
  }

  const prossimo = PROSSIMO_STATO[dati.stato];
  const sonoIlLavoratore = dati.ruolo === "FORNITORE";

  return (
    <Pagina>
      <Link to="/profilo" className="flex items-center gap-1.5 text-sm font-semibold text-corallo">
        <ArrowLeft className="size-4" strokeWidth={2.25} />
        Torna al profilo
      </Link>

      <h1 className="mt-4 text-3xl font-bold">{dati.titoloRichiesta}</h1>
      <p className="mt-1 text-sm font-medium text-fumo">
        {dati.stato.toLowerCase().replace("_", " ")} • sei il{" "}
        {sonoIlLavoratore ? "lavoratore" : "cliente"}
      </p>

      <div className="mt-5 rounded-3xl border border-bordo bg-white p-5">
        <p className="text-sm">
          Lavoratore: <span className="font-semibold">{dati.fornitore}</span>
        </p>
        {dati.prezzoConcordato != null && (
          <p className="mt-2 text-sm">Prezzo concordato: {dati.prezzoConcordato} €</p>
        )}
        <Link
          to={`/richieste/${dati.richiestaId}`}
          className="mt-3 block text-sm font-semibold text-corallo"
        >
          Vedi la richiesta
        </Link>
      </div>

      {sonoIlLavoratore && prossimo && (
        <button
          type="button"
          onClick={avanza}
          className="mt-5 h-12 w-full rounded-2xl bg-corallo text-sm font-semibold text-white"
        >
          {prossimo.etichetta}
        </button>
      )}

      {recensione && dati.stato === "COMPLETATO" && !sonoIlLavoratore && (
        <div className="mt-5">
          <StatoSuccesso
            Icona={PartyPopper}
            titolo="Lavoro concluso"
            testo="Hai lasciato la tua recensione: aiuta gli altri clienti a scegliere."
          />
        </div>
      )}

      {recensione && (
        <div className="mt-5 rounded-3xl border border-bordo bg-white p-5">
          <p className="text-base font-semibold">Recensione</p>
          <p className="mt-1.5 flex items-center gap-1 text-sm text-fumo">
            <Star className="size-4 text-ambra" strokeWidth={1.75} fill="currentColor" />
            {recensione.voto} su 5
          </p>
          {recensione.commento && <p className="mt-2 text-sm">{recensione.commento}</p>}
        </div>
      )}

      {!sonoIlLavoratore && !recensione && dati.stato === "COMPLETATO" && (
        <form
          onSubmit={inviaRecensione}
          className="mt-5 flex flex-col gap-3 rounded-3xl border border-bordo bg-white p-4"
        >
          <p className="text-xl font-semibold">Lascia una recensione</p>

          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setVoto(n)}
                aria-label={`${n} su 5`}
                className="text-ambra"
              >
                <Star className="size-8" strokeWidth={1.75} fill={n <= voto ? "currentColor" : "none"} />
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="commento" className="text-xs font-medium text-fumo">
              Commento
            </label>
            <textarea
              id="commento"
              value={commento}
              onChange={(e) => setCommento(e.target.value)}
              rows={3}
              className="rounded-2xl border border-bordo p-4 text-sm outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={inCorso}
            className="h-12 rounded-2xl bg-corallo text-sm font-semibold text-white"
          >
            Invia recensione
          </button>
        </form>
      )}

      {errore && <p className="mt-4 text-sm text-red-600">{errore}</p>}
    </Pagina>
  );
}
