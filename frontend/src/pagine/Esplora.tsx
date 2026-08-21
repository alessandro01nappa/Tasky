import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import BarraNavigazione from "../componenti/BarraNavigazione";
import CardRichiesta from "../componenti/CardRichiesta";
import IconaCategoria from "../componenti/IconaCategoria";
import RiquadroInfo from "../componenti/RiquadroInfo";
import ScheletroHome from "../componenti/ScheletroHome";
import { categorie, richiesteAperte, type Categoria, type Richiesta } from "../lib/api";

export default function Esplora() {
  const [elencoCategorie, setElencoCategorie] = useState<Categoria[]>([]);
  const [richieste, setRichieste] = useState<Richiesta[]>([]);
  const [filtro, setFiltro] = useState<string | null>(null);
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

  const visibili = filtro ? richieste.filter((r) => r.categoria === filtro) : richieste;

  return (
    <div className="mx-auto min-h-screen max-w-md px-6 pt-7 pb-32">
      <h1 className="text-3xl font-bold">Cosa ti serve oggi?</h1>
      <p className="mt-1 text-sm font-medium text-fumo">Richieste aperte vicino a te</p>

      {!caricato && <ScheletroHome />}

      {caricato && (
        <>
          <Link
            to="/richieste/nuova"
            className="mt-5 block rounded-3xl bg-corallo p-5 shadow-corallo"
          >
            <p className="text-xl font-bold text-white">Crea un annuncio</p>
            <p className="mt-1 max-w-60 text-sm text-white">
              Trova tu un esperto oppure lascia arrivare proposte
            </p>
          </Link>

          <Link
            to="/professionisti"
            className="mt-3.5 flex h-12 items-center justify-center rounded-2xl border border-bordo bg-white text-sm font-semibold shadow-morbida"
          >
            Sfoglia gli esperti in zona
          </Link>

          <h2 className="mt-8 text-lg font-semibold">Categorie</h2>
          <div className="mt-3 grid grid-cols-4 gap-4">
            {elencoCategorie.map((categoria, indice) => {
              const attiva = filtro === categoria.nome;
              return (
                <button
                  key={categoria.id}
                  type="button"
                  onClick={() => setFiltro(attiva ? null : categoria.nome)}
                  className="text-left"
                >
                  <span
                    className={`flex size-17 items-center justify-center rounded-full border ${
                      attiva
                        ? "border-corallo bg-corallo text-white"
                        : `border-bordo text-corallo ${indice % 2 === 0 ? "bg-pesca" : "bg-white"}`
                    }`}
                  >
                    <IconaCategoria nome={categoria.nome} className="size-7" />
                  </span>
                  <span
                    className={`mt-2 block text-xs font-medium ${attiva ? "text-corallo" : "text-fumo"}`}
                  >
                    {categoria.nome}
                  </span>
                </button>
              );
            })}
          </div>

          <h2 className="mt-8 text-lg font-semibold">
            {filtro ?? "Tutte le richieste"}
            <span className="ml-2 text-sm font-medium text-fumo">{visibili.length}</span>
          </h2>

          <div className="mt-3 flex flex-col gap-3">
            {visibili.map((r) => (
              <CardRichiesta key={r.id} richiesta={r} />
            ))}
          </div>

          {visibili.length === 0 && (
            <div className="mt-3">
              <RiquadroInfo>
                {filtro
                  ? "Nessuna richiesta aperta in questa categoria."
                  : "Non ci sono richieste aperte. Creane una tu."}
              </RiquadroInfo>
            </div>
          )}

          {errore && <p className="mt-4 text-sm text-red-600">{errore}</p>}
        </>
      )}

      <BarraNavigazione />
    </div>
  );
}
