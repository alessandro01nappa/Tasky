import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import BarraNavigazione from "../componenti/BarraNavigazione";
import Pagina from "../componenti/Pagina";
import RiquadroInfo from "../componenti/RiquadroInfo";
import {
  candidatureRicevute,
  mieRichieste,
  mieiIncarichi,
  type Incarico,
  type Richiesta,
} from "../lib/api";

const FILTRI = [
  { etichetta: "Aperte", stato: "APERTA" },
  { etichetta: "In corso", stato: "ASSEGNATA" },
  { etichetta: "Completate", stato: "COMPLETATA" },
] as const;

const COLORI_STATO: Record<string, string> = {
  APERTA: "bg-corallo text-white",
  ASSEGNATA: "bg-verde text-white",
  COMPLETATA: "bg-ambra text-white",
  ANNULLATA: "bg-sabbia text-fumo",
};

export default function MieRichieste() {
  const [richieste, setRichieste] = useState<Richiesta[]>([]);
  const [incarichi, setIncarichi] = useState<Incarico[]>([]);
  const [conteggi, setConteggi] = useState<Record<number, number>>({});
  const [filtro, setFiltro] = useState<string>("APERTA");
  const [errore, setErrore] = useState("");
  const [caricato, setCaricato] = useState(false);

  useEffect(() => {
    mieRichieste()
      .then(async (mie) => {
        setRichieste(mie);
        // il conteggio candidature non è nell'elenco: lo chiedo solo per quelle ancora aperte
        const aperte = mie.filter((r) => r.stato === "APERTA");
        const coppie = await Promise.all(
          aperte.map((r) =>
            candidatureRicevute(r.id)
              .then((c) => [r.id, c.length] as const)
              .catch(() => [r.id, 0] as const),
          ),
        );
        setConteggi(Object.fromEntries(coppie));
      })
      .catch((e) => setErrore(e instanceof Error ? e.message : "Errore inatteso"))
      .finally(() => setCaricato(true));
    mieiIncarichi().then(setIncarichi).catch(() => setIncarichi([]));
  }, []);

  const visibili = richieste.filter((r) => r.stato === filtro);
  const aperte = richieste.filter((r) => r.stato === "APERTA").length;
  const inCorso = richieste.filter((r) => r.stato === "ASSEGNATA").length;

  return (
    <Pagina>
      <h1 className="text-3xl font-bold">Le mie richieste</h1>
      <p className="mt-3 text-sm text-fumo">
        Segui i tuoi annunci, le candidature ricevute e i lavori già completati.
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        {FILTRI.map((f) => (
          <button
            key={f.stato}
            type="button"
            onClick={() => setFiltro(f.stato)}
            className={`rounded-full px-3 py-2 text-xs font-semibold ${
              filtro === f.stato
                ? "bg-corallo text-white"
                : "border border-bordo bg-white text-inchiostro"
            }`}
          >
            {f.etichetta}
          </button>
        ))}
      </div>

      <div className="mt-5 flex gap-2.5">
        {[
          { valore: aperte, etichetta: "Aperte", sfondo: "bg-white" },
          { valore: inCorso, etichetta: "In corso", sfondo: "bg-white" },
          { valore: richieste.length, etichetta: "Totali", sfondo: "bg-pesca-tenue" },
        ].map((dato) => (
          <div key={dato.etichetta} className={`flex-1 rounded-2xl px-3 py-3.5 ${dato.sfondo}`}>
            <p className="text-lg font-semibold">{dato.valore}</p>
            <p className="mt-1 text-xs text-fumo">{dato.etichetta}</p>
          </div>
        ))}
      </div>

      <Link
        to="/richieste/nuova"
        className="mt-5 flex h-12 items-center justify-center gap-2 rounded-2xl bg-corallo text-sm font-semibold text-white"
      >
        <Plus className="size-5" strokeWidth={2.25} />
        Crea un annuncio
      </Link>

      <div className="mt-3.5 flex flex-col gap-3.5">
        {visibili.map((r) => {
          const incarico = incarichi.find((i) => i.richiestaId === r.id);
          const pubblicata = new Date(r.dataCreazione).toLocaleDateString("it-IT", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          });
          return (
            <div key={r.id} className="rounded-3xl border border-bordo bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="text-lg font-semibold">{r.titolo}</p>
                <span
                  className={`shrink-0 rounded-full px-3 py-2 text-xs font-semibold ${COLORI_STATO[r.stato]}`}
                >
                  {r.stato === "ASSEGNATA"
                    ? "In corso"
                    : r.stato.charAt(0) + r.stato.slice(1).toLowerCase()}
                </span>
              </div>

              <p className="mt-2 text-sm text-fumo">
                Pubblicata {pubblicata} • {r.citta}
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                {r.stato === "APERTA" && (
                  <span className="rounded-full border border-bordo px-3 py-2 text-xs font-semibold">
                    {conteggi[r.id] === 1 ? "1 candidatura" : `${conteggi[r.id] ?? 0} candidature`}
                  </span>
                )}
                <span className="rounded-full border border-bordo px-3 py-2 text-xs font-semibold">
                  {r.budget != null ? `Budget ${r.budget} €` : "Preventivo da concordare"}
                </span>
                <span className="rounded-full border border-bordo px-3 py-2 text-xs font-semibold">
                  {r.categoria}
                </span>
              </div>

              <div className="mt-3 flex gap-2.5">
                <Link
                  to={`/richieste/${r.id}`}
                  className="flex h-10 w-32 items-center justify-center rounded-2xl border border-bordo text-sm font-semibold"
                >
                  Dettaglio
                </Link>
                {r.stato === "APERTA" ? (
                  <Link
                    to={`/richieste/${r.id}`}
                    className="flex h-10 flex-1 items-center justify-center rounded-2xl bg-corallo text-sm font-semibold text-white"
                  >
                    Vedi candidature
                  </Link>
                ) : (
                  incarico && (
                    <Link
                      to={`/incarichi/${incarico.id}`}
                      className={`flex h-10 flex-1 items-center justify-center rounded-2xl text-sm font-semibold text-white ${
                        r.stato === "COMPLETATA" ? "bg-ambra" : "bg-verde"
                      }`}
                    >
                      {r.stato === "COMPLETATA" ? "Riepilogo" : "Gestisci lavoro"}
                    </Link>
                  )
                )}
              </div>
            </div>
          );
        })}
      </div>

      {caricato && visibili.length === 0 && (
        <div className="mt-3.5">
          <RiquadroInfo>
            {filtro === "APERTA"
              ? "Nessuna richiesta aperta. Creane una e ricevi proposte dai lavoratori della tua zona."
              : "Nessuna richiesta in questo stato."}
          </RiquadroInfo>
        </div>
      )}

      {errore && <p className="mt-4 text-sm text-red-600">{errore}</p>}

      <BarraNavigazione />
    </Pagina>
  );
}
