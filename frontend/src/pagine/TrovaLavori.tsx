import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import BarraNavigazione from "../componenti/BarraNavigazione";
import CardRichiesta from "../componenti/CardRichiesta";
import IconaCategoria from "../componenti/IconaCategoria";
import Pagina from "../componenti/Pagina";
import RiquadroInfo from "../componenti/RiquadroInfo";
import { categorie, richiesteAperte, type Categoria, type Richiesta } from "../lib/api";
import { useProfiloLavoratore } from "../lib/lavoratore";

/** La home di chi lavora: solo annunci da prendere. */
export default function TrovaLavori() {
  const profilo = useProfiloLavoratore();
  const [parametri, impostaParametri] = useSearchParams();
  const filtro = parametri.get("categoria");
  const [elencoCategorie, setElencoCategorie] = useState<Categoria[]>([]);
  const [richieste, setRichieste] = useState<Richiesta[]>([]);
  const [soloMie, setSoloMie] = useState(true);
  const [errore, setErrore] = useState("");
  const [caricato, setCaricato] = useState(false);

  useEffect(() => {
    Promise.all([categorie(), richiesteAperte()])
      .then(([c, r]) => {
        setElencoCategorie(c);
        setRichieste(r);
      })
      .catch((e) => setErrore(e instanceof Error ? e.message : "Errore inatteso"))
      .finally(() => setCaricato(true));
  }, []);

  const mieCategorie = profilo?.categorie ?? [];
  const visibili = richieste
    .filter((r) => !filtro || r.categoria === filtro)
    .filter((r) => !soloMie || mieCategorie.length === 0 || mieCategorie.includes(r.categoria));

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
            onClick={() => setSoloMie(true)}
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
          <RiquadroInfo>
            {soloMie && mieCategorie.length > 0
              ? "Nessuna richiesta aperta nelle tue categorie. Prova a vedere tutte."
              : "Non ci sono richieste aperte in questo momento."}
          </RiquadroInfo>
        </div>
      )}

      {errore && <p className="mt-4 text-sm text-red-600">{errore}</p>}

      <BarraNavigazione />
    </Pagina>
  );
}
