import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import BarraNavigazione from "../componenti/BarraNavigazione";
import Pagina from "../componenti/Pagina";
import {
  io,
  mieCandidature,
  mieiIncarichi,
  mioProfiloFornitore,
  type Fornitore,
  type Incarico,
  type MiaCandidatura,
} from "../lib/api";
import { scordaProfiloLavoratore } from "../lib/lavoratore";
import { cancellaToken } from "../lib/sessione";

const STATO_LAVORATORE: Record<string, string> = {
  IN_ATTESA: "In attesa di approvazione",
  APPROVATO: "Approvato",
  RIFIUTATO: "Non approvato",
};

export default function Profilo() {
  const navigate = useNavigate();
  const [emailUtente, setEmailUtente] = useState("");
  const [profilo, setProfilo] = useState<Fornitore | null>(null);
  const [candidature, setCandidature] = useState<MiaCandidatura[]>([]);
  const [incarichi, setIncarichi] = useState<Incarico[]>([]);
  const [errore, setErrore] = useState("");

  useEffect(() => {
    io().then(setEmailUtente).catch(() => {});
    mieiIncarichi().then(setIncarichi).catch(() => {});
    // chi non ha un profilo lavoratore riceve un errore: qui vuol dire solo "non ce l'hai"
    mioProfiloFornitore().then(setProfilo).catch(() => setProfilo(null));
    mieCandidature().then(setCandidature).catch(() => setCandidature([]));
  }, []);

  function esci() {
    scordaProfiloLavoratore();
    cancellaToken();
    navigate("/accesso");
  }

  return (
    <Pagina>
      <h1 className="text-3xl font-bold">Profilo</h1>
      <p className="mt-1 text-sm font-medium text-fumo">{emailUtente || "…"}</p>

      {profilo ? (
        <div className="mt-5 rounded-3xl border border-bordo bg-white p-5">
          <div className="flex items-start justify-between gap-3">
            <p className="text-base font-semibold">Profilo lavoratore</p>
            <span
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                profilo.stato === "APPROVATO" ? "bg-verde-chiaro text-verde" : "bg-miele text-ambra"
              }`}
            >
              {STATO_LAVORATORE[profilo.stato]}
            </span>
          </div>
          <p className="mt-1.5 text-sm text-fumo">
            {profilo.tipo === "HOBBISTA" ? "Hobbista" : "Professionista"} • {profilo.zonaOperativa}
          </p>
          <p className="mt-2 text-sm">{profilo.descrizione}</p>
          {profilo.categorie.length > 0 && (
            <p className="mt-2 text-sm text-fumo">{profilo.categorie.join(" • ")}</p>
          )}
          {profilo.stato === "IN_ATTESA" && (
            <p className="mt-3 text-sm text-fumo">
              Potrai candidarti alle richieste quando il profilo sarà approvato.
            </p>
          )}
        </div>
      ) : (
        <Link
          to="/diventa-lavoratore"
          className="mt-5 block rounded-3xl border border-bordo bg-white p-5"
        >
          <p className="text-base font-semibold">Diventa lavoratore</p>
          <p className="mt-1.5 text-sm text-fumo">
            Crea il tuo profilo per candidarti alle richieste degli altri utenti.
          </p>
        </Link>
      )}

      <Link
        to="/richieste"
        className="mt-5 block rounded-3xl border border-bordo bg-white p-5"
      >
        <p className="text-base font-semibold">Le mie richieste</p>
        <p className="mt-1.5 text-sm text-fumo">Quelle che hai pubblicato tu.</p>
      </Link>

      <h2 className="mt-8 text-lg font-semibold">
        I miei incarichi
        <span className="ml-2 text-sm font-medium text-fumo">{incarichi.length}</span>
      </h2>
      <div className="mt-3 flex flex-col gap-3">
        {incarichi.map((i) => (
          <Link
            key={i.id}
            to={`/incarichi/${i.id}`}
            className="block rounded-3xl border border-bordo bg-white p-5"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-base font-semibold">{i.titoloRichiesta}</p>
              <span className="shrink-0 rounded-full bg-sabbia px-3 py-1 text-xs font-semibold text-fumo">
                {i.stato.toLowerCase().replace("_", " ")}
              </span>
            </div>
            <p className="mt-1.5 text-sm text-fumo">
              {i.ruolo === "CLIENTE" ? `Lavoratore: ${i.fornitore}` : "Sei tu il lavoratore"}
              {i.prezzoConcordato != null && ` • ${i.prezzoConcordato} €`}
            </p>
          </Link>
        ))}
        {incarichi.length === 0 && <p className="text-sm text-fumo">Nessun incarico attivo.</p>}
      </div>

      {candidature.length > 0 && (
        <>
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
                  <p className="mt-1.5 text-sm text-fumo">Offerti {c.prezzoOfferto} €</p>
                )}
              </Link>
            ))}
          </div>
        </>
      )}

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
