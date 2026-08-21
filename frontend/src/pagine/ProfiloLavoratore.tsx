import { ArrowLeft, Star } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import RiquadroInfo from "../componenti/RiquadroInfo";
import {
  elencoLavoratori,
  recensioniLavoratore,
  type Lavoratore,
  type RecensioniLavoratore,
} from "../lib/api";

export default function ProfiloLavoratore() {
  const { id } = useParams();
  const idLavoratore = Number(id);

  const [lavoratore, setLavoratore] = useState<Lavoratore | null>(null);
  const [recensioni, setRecensioni] = useState<RecensioniLavoratore | null>(null);
  const [errore, setErrore] = useState("");

  useEffect(() => {
    // non esiste un endpoint per il singolo lavoratore: lo cerco nell'elenco
    elencoLavoratori()
      .then((tutti) => {
        const trovato = tutti.find((l) => l.id === idLavoratore);
        if (!trovato) throw new Error("Lavoratore non trovato");
        setLavoratore(trovato);
      })
      .catch((e) => setErrore(e instanceof Error ? e.message : "Errore inatteso"));
    recensioniLavoratore(idLavoratore)
      .then(setRecensioni)
      .catch(() => setRecensioni(null));
  }, [idLavoratore]);

  if (!lavoratore) {
    return (
      <div className="mx-auto min-h-screen max-w-md px-6 pt-7">
        <Link
          to="/professionisti"
          className="flex items-center gap-1.5 text-sm font-semibold text-corallo"
        >
          <ArrowLeft className="size-4" strokeWidth={2.25} />
          Indietro
        </Link>
        {errore && <p className="mt-4 text-sm text-red-600">{errore}</p>}
      </div>
    );
  }

  const professionista = lavoratore.tipo === "PROFESSIONISTA";
  const iniziali = lavoratore.nome
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();

  return (
    <div className="min-h-screen">
      <div className="bg-pesca pb-6">
        <div className="mx-auto max-w-md px-6 pt-6">
          <Link
            to="/professionisti"
            className="flex h-12 w-24 items-center justify-center gap-1.5 rounded-2xl border border-bordo bg-white text-sm font-semibold"
          >
            <ArrowLeft className="size-4" strokeWidth={2.25} />
            Indietro
          </Link>

          <div className="mt-8 flex items-center gap-4">
            <span
              className={`flex size-22 shrink-0 items-center justify-center rounded-full text-xl font-bold ${
                professionista ? "bg-verde-chiaro text-verde" : "bg-white text-corallo"
              }`}
            >
              {iniziali}
            </span>
            <div className="min-w-0">
              <h1 className="text-2xl font-bold">{lavoratore.nome}</h1>
              <span
                className={`mt-1.5 inline-block rounded-full px-2.5 py-1.5 text-xs font-medium ${
                  professionista ? "bg-verde-chiaro text-verde" : "bg-white text-corallo"
                }`}
              >
                {professionista ? "Pro verificato" : "Top appassionato"}
              </span>
              <p className="mt-1.5 text-sm text-fumo">
                {lavoratore.categorie.join(", ")} • {lavoratore.zonaOperativa}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-md px-6 pt-5 pb-12">
        <div className="flex gap-2.5">
          <div className="flex flex-1 flex-col gap-1 rounded-2xl border border-bordo bg-white px-3 py-3.5">
            <p className="flex items-center gap-1.5 text-lg font-semibold">
              <Star className="size-4 text-ambra" strokeWidth={1.75} fill="currentColor" />
              {lavoratore.numeroRecensioni > 0 ? lavoratore.media : "—"}
            </p>
            <p className="text-xs text-fumo">
              {lavoratore.numeroRecensioni === 1
                ? "1 recensione"
                : `${lavoratore.numeroRecensioni} recensioni`}
            </p>
          </div>
          {lavoratore.tariffaOraria != null && (
            <div className="flex flex-1 flex-col gap-1 rounded-2xl border border-bordo bg-white px-3 py-3.5">
              <p className="text-lg font-semibold">€{lavoratore.tariffaOraria}/h</p>
              <p className="text-xs text-fumo">Tariffa oraria</p>
            </div>
          )}
        </div>

        <Link
          to={`/richieste/nuova?fornitore=${lavoratore.id}`}
          className={`mt-5 flex h-12 items-center justify-center rounded-2xl text-sm font-semibold text-white ${
            professionista ? "bg-verde" : "bg-corallo"
          }`}
        >
          Prenota {lavoratore.nome.split(" ")[0]}
        </Link>

        <h2 className="mt-5 text-lg font-semibold">Chi è {lavoratore.nome.split(" ")[0]}</h2>
        <p className="mt-3 text-sm text-fumo">{lavoratore.descrizione}</p>

        <h2 className="mt-5 text-lg font-semibold">Servizi offerti</h2>
        <div className="mt-3 flex flex-col gap-3.5 rounded-3xl border border-bordo bg-white p-4">
          {lavoratore.categorie.map((categoria) => (
            <p key={categoria} className="text-sm font-semibold">
              {categoria}
            </p>
          ))}
          {lavoratore.categorie.length === 0 && (
            <p className="text-sm text-fumo">Nessuna categoria indicata.</p>
          )}
        </div>

        <h2 className="mt-5 text-lg font-semibold">Recensioni recenti</h2>
        <div className="mt-3 flex flex-col gap-2.5">
          {recensioni?.recensioni.map((r, indice) => (
            <div key={indice} className="rounded-2xl border border-bordo bg-white p-3.5">
              <p className="flex items-center gap-1.5 text-sm font-semibold">
                <Star className="size-3.5 text-ambra" strokeWidth={1.75} fill="currentColor" />
                {r.voto}.0
              </p>
              {r.commento && <p className="mt-2 text-sm text-fumo">{r.commento}</p>}
            </div>
          ))}
          {(!recensioni || recensioni.recensioni.length === 0) && (
            <RiquadroInfo>
              Ancora nessuna recensione. Le riceve dopo aver completato un lavoro.
            </RiquadroInfo>
          )}
        </div>
      </div>
    </div>
  );
}
