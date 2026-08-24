import { Briefcase, ClipboardList, User } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import BarraNavigazione from "../componenti/BarraNavigazione";
import Pagina from "../componenti/Pagina";
import RiquadroInfo from "../componenti/RiquadroInfo";
import { io, mieiIncarichi, type Incarico, type Io } from "../lib/api";
import { scordaProfiloLavoratore, useProfiloLavoratore } from "../lib/lavoratore";
import { cancellaModalita, useModalita } from "../lib/modalita";
import { cancellaToken } from "../lib/sessione";

const STATO_LAVORATORE: Record<string, string> = {
  IN_ATTESA: "In attesa",
  APPROVATO: "Attivo",
  RIFIUTATO: "Non attivo",
};

export default function Profilo() {
  const navigate = useNavigate();
  const profilo = useProfiloLavoratore();
  const modalita = useModalita();
  const [utente, setUtente] = useState<Io | null>(null);
  const [incarichi, setIncarichi] = useState<Incarico[]>([]);
  const [errore, setErrore] = useState("");

  useEffect(() => {
    io()
      .then(setUtente)
      .catch((e) => setErrore(e instanceof Error ? e.message : "Errore inatteso"));
    mieiIncarichi()
      .then(setIncarichi)
      .catch(() => setIncarichi([]));
  }, []);

  function esci() {
    scordaProfiloLavoratore();
    cancellaModalita();
    cancellaToken();
    navigate("/accesso");
  }

  const attivo = profilo?.stato === "APPROVATO";
  const inLavoratore = modalita === "lavoratore" && attivo;
  // lo stesso incarico e' un lavoro da fare o un lavoro affidato, dipende da che lato stai
  const suoiIncarichi = incarichi.filter((i) =>
    inLavoratore ? i.ruolo === "FORNITORE" : i.ruolo === "CLIENTE",
  );
  const iniziali = (utente?.nomeCompleto ?? "?")
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();

  return (
    <Pagina>
      <h1 className="text-3xl font-bold">Profilo</h1>

      <div className="mt-5 flex items-center gap-4">
        <span
          className={`flex size-15 shrink-0 items-center justify-center rounded-full text-lg font-semibold ${
            inLavoratore ? "bg-verde-chiaro text-verde" : "bg-pesca text-corallo"
          }`}
        >
          {iniziali}
        </span>
        <div className="min-w-0">
          <p className="text-lg font-semibold">{utente?.nomeCompleto ?? "…"}</p>
          <p className="mt-1 text-sm text-fumo">
            {utente?.email}
            {utente?.citta && ` • ${utente.citta}`}
          </p>
          <span
            className={`mt-1.5 inline-block rounded-full px-2.5 py-1.5 text-xs font-medium ${
              inLavoratore ? "bg-verde-chiaro text-verde" : "bg-pesca text-corallo"
            }`}
          >
            Modalità {inLavoratore ? "Lavoratore" : "Cliente"}
          </span>
        </div>
      </div>

      {/* a lato attivo il cambio sta nella barra: qui resterebbe lo stesso comando due volte */}
      {!attivo && (
        <div className="mt-5 rounded-3xl border border-bordo bg-white p-4">
          <p className="text-lg font-semibold">Passa alla modalità Lavoratore</p>
          <p className="mt-2 text-sm text-fumo">
            Come lavoratore vedi gli annunci in zona e ti candidi.
          </p>

          <div className="mt-4 flex items-center justify-between gap-3">
            <span className="text-sm font-semibold text-fumo">
              {profilo ? STATO_LAVORATORE[profilo.stato] : "Non attiva"}
            </span>
            <Link
              to="/diventa-lavoratore"
              className="flex h-10 items-center rounded-2xl bg-corallo px-4 text-sm font-semibold text-white"
            >
              {profilo ? "Completa il profilo" : "Attiva"}
            </Link>
          </div>
        </div>
      )}

      {profilo?.stato === "IN_ATTESA" && (
        <div className="mt-3">
          <RiquadroInfo>
            Per lavorare completa il profilo: servono i lavori che svolgi, una tariffa per ogni
            categoria e l'accettazione dei termini.
          </RiquadroInfo>
        </div>
      )}

      <h2 className="mt-8 text-lg font-semibold">Le tue cose</h2>
      <div className="mt-3 flex flex-col gap-3">
        {!inLavoratore && (
          <Link
            to="/richieste"
            className="flex items-center gap-3.5 rounded-3xl border border-bordo bg-white p-4"
          >
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-pesca text-corallo">
              <ClipboardList className="size-5" strokeWidth={1.75} />
            </span>
            <span>
              <span className="block font-semibold">Le mie richieste</span>
              <span className="block text-sm text-fumo">
                Annunci pubblicati e candidature ricevute
              </span>
            </span>
          </Link>
        )}

        {profilo && inLavoratore && (
          <Link
            to="/diventa-lavoratore"
            className="flex items-center gap-3.5 rounded-3xl border border-bordo bg-white p-4"
          >
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-verde-chiaro text-verde">
              <User className="size-5" strokeWidth={1.75} />
            </span>
            <span>
              <span className="block font-semibold">Profilo lavoratore</span>
              <span className="block text-sm text-fumo">
                {profilo.attivita.length > 0
                  ? `${profilo.attivita.length} lavori • ${profilo.zonaOperativa}`
                  : profilo.zonaOperativa}
              </span>
            </span>
          </Link>
        )}

        {suoiIncarichi.length > 0 && (
          <div className="rounded-3xl border border-bordo bg-white p-4">
            <div className="flex items-center gap-3.5">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-miele text-ambra">
                <Briefcase className="size-5" strokeWidth={1.75} />
              </span>
              <p className="font-semibold">
                {inLavoratore ? "I lavori che seguo" : "I lavori che ho affidato"}
              </p>
            </div>
            <div className="mt-3 flex flex-col gap-2">
              {suoiIncarichi.map((i) => (
                <Link
                  key={i.id}
                  to={`/incarichi/${i.id}`}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-bordo px-3.5 py-3"
                >
                  <span className="min-w-0 truncate text-sm font-semibold">
                    {i.titoloRichiesta}
                  </span>
                  <span className="shrink-0 rounded-full bg-sabbia px-2.5 py-1 text-xs font-semibold text-fumo">
                    {i.stato.toLowerCase().replace("_", " ")}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {errore && <p className="mt-4 text-sm text-red-600">{errore}</p>}

      <button
        type="button"
        onClick={esci}
        className="mt-8 h-12 w-full rounded-2xl border border-bordo text-sm font-semibold"
      >
        Esci
      </button>

      <BarraNavigazione />
    </Pagina>
  );
}
