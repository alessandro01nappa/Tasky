import { Star } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import BarraNavigazione from "../componenti/BarraNavigazione";
import Pagina from "../componenti/Pagina";
import RiquadroInfo from "../componenti/RiquadroInfo";
import ScheletroDashboard from "../componenti/ScheletroDashboard";
import {
  accettaRichiesta,
  mieCandidature,
  mieiIncarichi,
  recensioniLavoratore,
  richiesteDirette,
  rifiutaRichiesta,
  type RecensioniLavoratore,
  type Incarico,
  type MiaCandidatura,
  type Richiesta,
} from "../lib/api";
import { useProfiloLavoratore } from "../lib/lavoratore";

export default function DashboardLavoratore() {
  const profilo = useProfiloLavoratore();
  const [incarichi, setIncarichi] = useState<Incarico[]>([]);
  const [candidature, setCandidature] = useState<MiaCandidatura[]>([]);
  const [dirette, setDirette] = useState<Richiesta[]>([]);
  const [errore, setErrore] = useState("");
  const [caricato, setCaricato] = useState(false);
  const [recensioni, setRecensioni] = useState<RecensioniLavoratore | null>(null);

  useEffect(() => {
    mieiIncarichi()
      .then((tutti) => setIncarichi(tutti.filter((i) => i.ruolo === "FORNITORE")))
      .catch((e) => setErrore(e instanceof Error ? e.message : "Errore inatteso"))
      .finally(() => setCaricato(true));
    mieCandidature()
      .then(setCandidature)
      .catch(() => setCandidature([]));
    richiesteDirette()
      .then(setDirette)
      .catch(() => setDirette([]));
  }, []);

  useEffect(() => {
    if (!profilo) return;
    recensioniLavoratore(profilo.id).then(setRecensioni).catch(() => setRecensioni(null));
  }, [profilo]);

  const inCorso = incarichi.filter((i) => i.stato !== "COMPLETATO");
  const concluse = incarichi.filter((i) => i.stato === "COMPLETATO");

  async function rispondi(id: number, accetta: boolean) {
    setErrore("");
    try {
      if (accetta) {
        await accettaRichiesta(id);
        setIncarichi(await mieiIncarichi().then((t) => t.filter((i) => i.ruolo === "FORNITORE")));
      } else {
        await rifiutaRichiesta(id);
      }
      setDirette(await richiesteDirette());
    } catch (e) {
      setErrore(e instanceof Error ? e.message : "Errore inatteso");
    }
  }

  return (
    <Pagina>
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <p className="mt-1 text-sm font-medium text-fumo">
        {profilo ? profilo.zonaOperativa : "Il tuo lavoro"}
      </p>

      {!caricato && <ScheletroDashboard />}

      {caricato && (
        <>
          <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              { etichetta: "In corso", valore: inCorso.length },
              { etichetta: "Completati", valore: concluse.length },
              { etichetta: "Candidature", valore: candidature.length },
              {
                etichetta:
                  recensioni && recensioni.numero > 0
                    ? `Su ${recensioni.numero} recension${recensioni.numero === 1 ? "e" : "i"}`
                    : "Recensioni",
                valore:
                  recensioni && recensioni.numero > 0 ? recensioni.media.toFixed(1) : "—",
              },
            ].map((dato) => (
              <div key={dato.etichetta} className="rounded-3xl border border-bordo bg-white p-4">
                <p className="text-2xl font-bold">{dato.valore}</p>
                <p className="mt-1 text-xs font-medium text-fumo">{dato.etichetta}</p>
              </div>
            ))}
          </div>

          {dirette.length > 0 && (
            <>
              <h2 className="mt-8 text-lg font-semibold">
                Richieste in arrivo
                <span className="ml-2 text-sm font-medium text-fumo">{dirette.length}</span>
              </h2>
              <div className="mt-3 flex flex-col gap-3">
                {dirette.map((r) => (
                  <div key={r.id} className="rounded-3xl border border-bordo bg-white p-5">
                    <p className="text-base font-semibold">{r.titolo}</p>
                    <p className="mt-1.5 text-sm text-fumo">
                      {r.categoria} • {r.citta}
                      {r.budget != null && ` • ${r.budget} €`}
                    </p>
                    <p className="mt-2 text-sm">{r.descrizione}</p>
                    <div className="mt-4 flex gap-2.5">
                      <button
                        type="button"
                        onClick={() => rispondi(r.id, false)}
                        className="h-12 w-28 rounded-2xl border border-bordo text-sm font-semibold"
                      >
                        Rifiuta
                      </button>
                      <button
                        type="button"
                        onClick={() => rispondi(r.id, true)}
                        className="h-12 flex-1 rounded-2xl bg-verde text-sm font-semibold text-white"
                      >
                        Accetta
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          <h2 className="mt-8 text-lg font-semibold">Lavori da fare</h2>
          <div className="mt-3 flex flex-col gap-3">
            {inCorso.map((i) => (
              <Link
                key={i.id}
                to={`/incarichi/${i.id}`}
                className="block rounded-3xl border border-bordo bg-white p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-base font-semibold">{i.titoloRichiesta}</p>
                  <span className="shrink-0 rounded-full bg-verde-chiaro px-3 py-1 text-xs font-semibold text-verde">
                    {i.stato.toLowerCase().replace("_", " ")}
                  </span>
                </div>
                {i.prezzoConcordato != null && (
                  <p className="mt-1.5 text-sm text-fumo">{i.prezzoConcordato} € concordati</p>
                )}
              </Link>
            ))}
            {inCorso.length === 0 && (
              <RiquadroInfo>
                Nessun lavoro assegnato. Vai su Trova lavori e candidati alle richieste aperte.
              </RiquadroInfo>
            )}
          </div>

          <h2 className="mt-8 text-lg font-semibold">
            Le mie candidature
            <span className="ml-2 text-sm font-medium text-fumo">{candidature.length}</span>
          </h2>
          <div className="mt-3 flex flex-col gap-3">
            {candidature.map((c) => (
              <Link
                key={c.id}
                to={`/richieste/${c.richiestaId}`}
                className="block rounded-3xl border border-bordo bg-white p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-base font-semibold">{c.titoloRichiesta}</p>
                  <span className="shrink-0 rounded-full bg-sabbia px-3 py-1 text-xs font-semibold text-fumo">
                    {c.stato.toLowerCase().replace("_", " ")}
                  </span>
                </div>
                {c.prezzoOfferto != null && (
                  <p className="mt-1.5 text-sm text-fumo">Hai offerto {c.prezzoOfferto} €</p>
                )}
              </Link>
            ))}
            {candidature.length === 0 && (
              <p className="text-sm text-fumo">Nessuna candidatura inviata.</p>
            )}
          </div>

          <h2 className="mt-8 text-lg font-semibold">
            Recensioni ricevute
            {recensioni && recensioni.numero > 0 && (
              <span className="ml-2 text-sm font-medium text-fumo">{recensioni.numero}</span>
            )}
          </h2>
          <div className="mt-3 flex flex-col gap-3">
            {recensioni?.recensioni.map((r, indice) => (
              <div key={indice} className="rounded-3xl border border-bordo bg-white p-5">
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((stella) => (
                    <Star
                      key={stella}
                      className={`size-4 ${stella <= r.voto ? "fill-ambra text-ambra" : "text-bordo"}`}
                      strokeWidth={1.75}
                    />
                  ))}
                  <span className="ml-1 text-xs text-fumo">
                    {new Date(r.dataCreazione).toLocaleDateString("it-IT", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </div>
                {r.commento && <p className="mt-2 text-sm">{r.commento}</p>}
              </div>
            ))}
            {(!recensioni || recensioni.numero === 0) && (
              <p className="text-sm text-fumo">
                Nessuna recensione. Arrivano dai clienti quando chiudi un lavoro.
              </p>
            )}
          </div>
        </>
      )}

      {errore && <p className="mt-4 text-sm text-red-600">{errore}</p>}

      <BarraNavigazione />
    </Pagina>
  );
}
