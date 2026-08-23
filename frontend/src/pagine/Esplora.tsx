import { useEffect, useState } from "react";
import { LayoutGrid } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import BarraNavigazione from "../componenti/BarraNavigazione";
import Pagina from "../componenti/Pagina";
import CardRichiesta from "../componenti/CardRichiesta";
import IconaCategoria from "../componenti/IconaCategoria";
import RiquadroInfo from "../componenti/RiquadroInfo";
import ScheletroHome from "../componenti/ScheletroHome";
import CardLavoratore from "../componenti/CardLavoratore";
import {
  categorie,
  elencoLavoratori,
  richiesteAperte,
  type Categoria,
  type Lavoratore,
  type Richiesta,
} from "../lib/api";

export default function Esplora() {
  const [elencoCategorie, setElencoCategorie] = useState<Categoria[]>([]);
  const [richieste, setRichieste] = useState<Richiesta[]>([]);
  const [parametri, impostaParametri] = useSearchParams();
  const filtro = parametri.get("categoria");
  const [suggeriti, setSuggeriti] = useState<Lavoratore[]>([]);
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
    // la colonna dei suggeriti compare solo da tablet in su
    elencoLavoratori()
      .then((tutti) => setSuggeriti(tutti.slice(0, 2)))
      .catch(() => setSuggeriti([]));
  }, []);

  const visibili = filtro ? richieste.filter((r) => r.categoria === filtro) : richieste;

  return (
    <Pagina larga>
      <h1 className="text-3xl font-bold">Cosa ti serve oggi?</h1>
      <p className="mt-1 text-sm font-medium text-fumo">Richieste aperte vicino a te</p>

      {!caricato && <ScheletroHome />}

      {caricato && (
        <div className="lg:grid lg:grid-cols-[1fr_380px] lg:items-start lg:gap-10">
          <div>
            <Link
              to="/professionisti"
              className="mt-5 block rounded-3xl bg-corallo p-5 shadow-corallo"
            >
              <p className="text-xl font-bold text-white">Sfoglia gli esperti in zona</p>
              <p className="mt-1 max-w-60 text-sm text-white">
                Scegli tu la persona e prenotala direttamente
              </p>
            </Link>

            <Link
              to="/richieste/nuova"
              className="mt-3.5 flex h-12 items-center justify-center rounded-2xl border border-bordo bg-white text-sm font-semibold shadow-morbida"
            >
              Crea un annuncio
            </Link>

            <h2 className="mt-8 text-lg font-semibold">Categorie</h2>
            <div className="mt-3 grid grid-cols-4 gap-4">
              {elencoCategorie.slice(0, 8).map((categoria, indice) => {
                const attiva = filtro === categoria.nome;
                return (
                  <button
                    key={categoria.id}
                    type="button"
                    onClick={() => impostaParametri(attiva ? {} : { categoria: categoria.nome })}
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

            <Link
              to="/categorie"
              className="mt-3.5 flex h-12 items-center justify-center gap-2 rounded-2xl border border-bordo bg-white text-sm font-semibold"
            >
              <LayoutGrid className="size-5" strokeWidth={2} />
              Esplora tutte le categorie
            </Link>

            <h2 className="mt-8 text-lg font-semibold">
              {filtro ?? "Tutte le richieste"}
              <span className="ml-2 text-sm font-medium text-fumo">{visibili.length}</span>
            </h2>

            <div className="mt-3 flex flex-col gap-3 md:grid md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
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
          </div>

          {suggeriti.length > 0 && (
            <aside className="mt-8 lg:mt-0">
              <h2 className="text-lg font-semibold">Suggeriti per te</h2>
              <div className="mt-3 flex flex-col gap-3.5 md:grid md:grid-cols-2 lg:grid-cols-1">
                {suggeriti.map((l) => (
                  <CardLavoratore key={l.id} lavoratore={l} />
                ))}
              </div>
            </aside>
          )}
        </div>
      )}

      <BarraNavigazione />
    </Pagina>
  );
}
