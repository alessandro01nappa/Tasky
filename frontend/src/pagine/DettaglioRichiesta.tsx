import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import RiquadroInfo from "../componenti/RiquadroInfo";
import Pagina from "../componenti/Pagina";
import { useProfiloLavoratore } from "../lib/lavoratore";
import {
  candidati,
  candidatureRicevute,
  creaIncarico,
  mieRichieste,
  richiesta as leggiRichiesta,
  type Candidatura,
  type Richiesta,
} from "../lib/api";

export default function DettaglioRichiesta() {
  const { id } = useParams();
  const navigate = useNavigate();
  const idRichiesta = Number(id);

  const profiloLavoratore = useProfiloLavoratore();
  const [dati, setDati] = useState<Richiesta | null>(null);
  const [mia, setMia] = useState(false);
  const [candidature, setCandidature] = useState<Candidatura[]>([]);
  const [messaggio, setMessaggio] = useState("");
  const [prezzo, setPrezzo] = useState("");
  const [errore, setErrore] = useState("");
  const [esito, setEsito] = useState("");
  const [inCorso, setInCorso] = useState(false);

  useEffect(() => {
    Promise.all([leggiRichiesta(idRichiesta), mieRichieste()])
      .then(([richiesta, mie]) => {
        setDati(richiesta);
        const sonoIlCliente = mie.some((r) => r.id === richiesta.id);
        setMia(sonoIlCliente);
        if (sonoIlCliente) {
          return candidatureRicevute(idRichiesta).then(setCandidature);
        }
      })
      .catch((e) => setErrore(e instanceof Error ? e.message : "Errore inatteso"));
  }, [idRichiesta]);

  async function inviaCandidatura(evento: React.FormEvent) {
    evento.preventDefault();
    setErrore("");
    setInCorso(true);
    try {
      await candidati(idRichiesta, {
        messaggio,
        prezzoOfferto: prezzo ? Number(prezzo) : null,
      });
      setEsito("Candidatura inviata. La trovi nel tuo profilo.");
      setMessaggio("");
      setPrezzo("");
    } catch (e) {
      setErrore(e instanceof Error ? e.message : "Errore inatteso");
    } finally {
      setInCorso(false);
    }
  }

  async function scegli(candidaturaId: number) {
    setErrore("");
    try {
      const incarico = await creaIncarico(candidaturaId);
      navigate(`/incarichi/${incarico.id}`);
    } catch (e) {
      setErrore(e instanceof Error ? e.message : "Errore inatteso");
    }
  }

  if (!dati) {
    return (
      <div className="mx-auto min-h-screen max-w-md px-6 pt-7">
        <Link to="/" className="flex items-center gap-1.5 text-sm font-semibold text-corallo">
          <ArrowLeft className="size-4" strokeWidth={2.25} />
          Torna a Esplora
        </Link>
        {errore && <p className="mt-4 text-sm text-red-600">{errore}</p>}
      </div>
    );
  }

  return (
    <Pagina>
      <Link to="/" className="flex items-center gap-1.5 text-sm font-semibold text-corallo">
        <ArrowLeft className="size-4" strokeWidth={2.25} />
        Torna a Esplora
      </Link>

      <h1 className="mt-4 text-3xl font-bold">{dati.titolo}</h1>
      <p className="mt-1 text-sm font-medium text-fumo">
        {dati.categoria} • {dati.citta} • {dati.stato.toLowerCase()}
      </p>

      <div className="mt-5 rounded-3xl border border-bordo bg-white p-5">
        <p className="text-sm">{dati.descrizione}</p>
        <p className="mt-3 text-sm text-fumo">
          Pubblicata da {dati.cliente}
          {dati.budget != null && ` • budget ${dati.budget} €`}
          {dati.dataPreferita && ` • preferibilmente il ${dati.dataPreferita}`}
        </p>
      </div>

      {mia && (
        <>
          <h2 className="mt-8 text-lg font-semibold">
            Candidature ricevute
            <span className="ml-2 text-sm font-medium text-fumo">{candidature.length}</span>
          </h2>

          <div className="mt-3 flex flex-col gap-3">
            {candidature.map((c) => (
              <div key={c.id} className="rounded-3xl border border-bordo bg-white p-5">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-base font-semibold">{c.fornitore}</p>
                  <span className="shrink-0 rounded-full bg-sabbia px-3 py-1 text-xs font-semibold text-fumo">
                    {c.stato.toLowerCase().replace("_", " ")}
                  </span>
                </div>
                <p className="mt-1.5 text-sm text-fumo">
                  {c.zonaOperativa}
                  {c.prezzoOfferto != null && ` • ${c.prezzoOfferto} €`}
                </p>
                {c.messaggio && <p className="mt-2 text-sm">{c.messaggio}</p>}

                {dati.stato === "APERTA" && (
                  <button
                    type="button"
                    onClick={() => scegli(c.id)}
                    className="mt-4 h-12 w-full rounded-2xl bg-corallo text-sm font-semibold text-white"
                  >
                    Scegli questo lavoratore
                  </button>
                )}
              </div>
            ))}
          </div>

          {candidature.length === 0 && (
            <div className="mt-3">
              <RiquadroInfo>Nessuno si è ancora candidato a questa richiesta.</RiquadroInfo>
            </div>
          )}
        </>
      )}

      {!mia && dati.stato === "APERTA" && profiloLavoratore === null && (
        <div className="mt-5 rounded-3xl border border-bordo bg-white p-5">
          <p className="text-xl font-semibold">Vuoi candidarti?</p>
          <p className="mt-1.5 text-sm text-fumo">
            Serve un profilo lavoratore. Si crea in un minuto, poi va approvato.
          </p>
          <Link
            to="/diventa-lavoratore"
            className="mt-4 flex h-12 items-center justify-center rounded-2xl bg-corallo text-sm font-semibold text-white"
          >
            Diventa lavoratore
          </Link>
        </div>
      )}

      {!mia && dati.stato === "APERTA" && profiloLavoratore?.stato === "IN_ATTESA" && (
        <div className="mt-5">
          <RiquadroInfo>
            Il tuo profilo lavoratore è in attesa di approvazione: potrai candidarti appena viene
            approvato.
          </RiquadroInfo>
        </div>
      )}

      {!mia && dati.stato === "APERTA" && profiloLavoratore?.stato === "APPROVATO" && (
        <form
          onSubmit={inviaCandidatura}
          className="mt-5 flex flex-col gap-3 rounded-3xl border border-bordo bg-white p-4"
        >
          <p className="text-xl font-semibold">Candidati</p>
          <p className="text-sm text-fumo">
            Proponi come lavoreresti e a che prezzo. Il cliente sceglie fra le candidature ricevute.
          </p>

          <div className="flex flex-col gap-2">
            <label htmlFor="messaggio" className="text-xs font-medium text-fumo">
              Messaggio
            </label>
            <textarea
              id="messaggio"
              value={messaggio}
              onChange={(e) => setMessaggio(e.target.value)}
              required
              rows={3}
              placeholder="Come pensi di svolgere il lavoro."
              className="rounded-2xl border border-bordo p-4 text-sm outline-none"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="prezzo" className="text-xs font-medium text-fumo">
              Prezzo offerto €
            </label>
            <input
              id="prezzo"
              type="number"
              min="0"
              value={prezzo}
              onChange={(e) => setPrezzo(e.target.value)}
              placeholder="100"
              className="h-11 rounded-2xl border border-bordo px-4 text-sm outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={inCorso}
            className="h-12 rounded-2xl bg-corallo text-sm font-semibold text-white"
          >
            Invia candidatura
          </button>
        </form>
      )}

      {esito && (
        <div className="mt-4 flex gap-2.5 rounded-3xl bg-verde-chiaro p-3.5">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-verde" strokeWidth={1.75} />
          <p className="text-sm">{esito}</p>
        </div>
      )}

      {errore && <p className="mt-4 text-sm text-red-600">{errore}</p>}
    </Pagina>
  );
}
