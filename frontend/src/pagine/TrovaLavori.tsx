import { Briefcase } from "lucide-react";
import { lazy, Suspense, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import BarraNavigazione from "../componenti/BarraNavigazione";
import CardRichiesta from "../componenti/CardRichiesta";
import IconaCategoria from "../componenti/IconaCategoria";
import Pagina from "../componenti/Pagina";
import StatoVuoto from "../componenti/StatoVuoto";
import { categorie, richiesteAperte, type Categoria, type Richiesta } from "../lib/api";
import { useProfiloLavoratore } from "../lib/lavoratore";

// leaflet pesa quanto mezza app: lo scarica solo chi arriva qui, non ogni cliente
const MappaLavori = lazy(() => import("../componenti/MappaLavori"));

/** La home di chi lavora: solo annunci da prendere. */
export default function TrovaLavori() {
  const profilo = useProfiloLavoratore();
  const [parametri, impostaParametri] = useSearchParams();
  const filtro = parametri.get("categoria");
  const [elencoCategorie, setElencoCategorie] = useState<Categoria[]>([]);
  const [richieste, setRichieste] = useState<Richiesta[]>([]);
  const [soloMie, setSoloMie] = useState(true);
  const [entroKm, setEntroKm] = useState<number | null>(null);
  const [errore, setErrore] = useState("");
  const [caricato, setCaricato] = useState(false);

  useEffect(() => {
    categorie().then(setElencoCategorie).catch(() => setElencoCategorie([]));
  }, []);

  // il raggio lo applica il backend: e' l'unico che conosce il punto esatto dei lavori
  useEffect(() => {
    richiesteAperte({ entroKm: entroKm ?? undefined })
      .then((pagina) => setRichieste(pagina.voci))
      .catch((e) => setErrore(e instanceof Error ? e.message : "Errore inatteso"))
      .finally(() => setCaricato(true));
  }, [entroKm]);

  const mieCategorie = profilo?.categorie ?? [];
  const miaPosizione: [number, number] | null =
    profilo?.latitudine != null && profilo.longitudine != null
      ? [profilo.latitudine, profilo.longitudine]
      : null;
  const RAGGI = [10, 25, 50];
  const visibili = richieste
    .filter((r) => !filtro || r.categoria === filtro)
    .filter((r) => !soloMie || mieCategorie.length === 0 || mieCategorie.includes(r.categoria));
  const sullaMappa = visibili.filter((r) => r.latitudine !== null);
  const senzaIndirizzo = visibili.length - sullaMappa.length;

  return (
    <Pagina larga>
      <h1 className="text-3xl font-bold">Trova lavori</h1>
      <p className="mt-1 text-sm font-medium text-fumo">
        Richieste aperte a cui puoi candidarti
      </p>

      {mieCategorie.length > 0 && (
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => {
              setSoloMie(true);
              if (filtro && mieCategorie.length > 0 && !mieCategorie.includes(filtro)) {
                impostaParametri({});
              }
            }}
            className={`rounded-full px-3 py-2 text-xs font-semibold ${
              soloMie ? "bg-verde text-white" : "border border-bordo bg-white text-fumo"
            }`}
          >
            Nelle mie categorie
          </button>
          <button
            type="button"
            onClick={() => setSoloMie(false)}
            className={`rounded-full px-3 py-2 text-xs font-semibold ${
              soloMie ? "border border-bordo bg-white text-fumo" : "bg-verde text-white"
            }`}
          >
            Tutte
          </button>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {elencoCategorie
          .filter((c) => richieste.some((r) => r.categoria === c.nome))
          // fuori dalle proprie categorie non ci si può candidare: non le propongo
          .filter((c) => !soloMie || mieCategorie.length === 0 || mieCategorie.includes(c.nome))
          .map((c) => {
            const attiva = filtro === c.nome;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => impostaParametri(attiva ? {} : { categoria: c.nome })}
                className={`flex h-9 items-center gap-2 rounded-full border px-4 text-sm font-semibold ${
                  attiva ? "border-verde bg-verde text-white" : "border-bordo bg-white text-fumo"
                }`}
              >
                <IconaCategoria nome={c.nome} className="size-4" />
                {c.nome}
              </button>
            );
          })}
      </div>

      {miaPosizione && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-fumo">Da {profilo?.zonaOperativa}</span>
          {RAGGI.map((km) => (
            <button
              key={km}
              type="button"
              onClick={() => setEntroKm(entroKm === km ? null : km)}
              className={`h-9 rounded-full border px-4 text-sm font-semibold ${
                entroKm === km ? "border-verde bg-verde text-white" : "border-bordo bg-white text-fumo"
              }`}
            >
              entro {km} km
            </button>
          ))}
        </div>
      )}

      {sullaMappa.length > 0 && (
        <div className="mt-4">
          <Suspense fallback={<div className="h-72 rounded-3xl bg-sabbia md:h-96" />}>
            <MappaLavori richieste={sullaMappa} centro={miaPosizione} />
          </Suspense>
          {senzaIndirizzo > 0 && (
            <p className="mt-2 text-xs text-fumo">
              {senzaIndirizzo === 1
                ? "Un lavoro non ha un indirizzo, quindi sulla mappa non compare."
                : `${senzaIndirizzo} lavori non hanno un indirizzo, quindi sulla mappa non compaiono.`}
            </p>
          )}
        </div>
      )}

      <h2 className="mt-8 text-lg font-semibold">
        {filtro ?? "Tutte le richieste"}
        <span className="ml-2 text-sm font-medium text-fumo">{visibili.length}</span>
      </h2>

      <div className="mt-3 flex flex-col gap-3 md:grid md:grid-cols-2">
        {visibili.map((r) => (
          <CardRichiesta key={r.id} richiesta={r} />
        ))}
      </div>

      {caricato && visibili.length === 0 && (
        <div className="mt-3">
          <StatoVuoto
            Icona={Briefcase}
            titolo="Nessun lavoro disponibile"
            testo={
              soloMie && mieCategorie.length > 0
                ? "Non ci sono richieste aperte nelle tue categorie. Prova a vedere tutte, oppure aggiungi altri lavori al tuo profilo."
                : "Non ci sono richieste aperte in questo momento. Riprova più tardi."
            }
            azione={
              soloMie && mieCategorie.length > 0
                ? { etichetta: "Aggiungi altri lavori", percorso: "/diventa-lavoratore" }
                : undefined
            }
          />
        </div>
      )}

      {errore && <p className="mt-4 text-sm text-red-600">{errore}</p>}

      <BarraNavigazione />
    </Pagina>
  );
}
