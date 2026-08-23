import { LayoutGrid, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import BarraNavigazione from "../componenti/BarraNavigazione";
import CardLavoratore from "../componenti/CardLavoratore";
import IconaCategoria from "../componenti/IconaCategoria";
import Pagina from "../componenti/Pagina";
import StatoVuoto from "../componenti/StatoVuoto";
import ScheletroHome from "../componenti/ScheletroHome";
import {
  categorie,
  elencoLavoratori,
  type Categoria,
  type Lavoratore,
  type TipoLavoratore,
} from "../lib/api";

const TIPI = [
  { valore: "PROFESSIONISTA", etichetta: "Professionisti" },
  { valore: "HOBBISTA", etichetta: "Hobbisti" },
] as const;

/** La home di chi cerca: categorie e persone, mai gli annunci degli altri. */
export default function Esplora() {
  const [parametri, impostaParametri] = useSearchParams();
  const filtro = parametri.get("categoria");
  const [elencoCategorie, setElencoCategorie] = useState<Categoria[]>([]);
  const [lavoratori, setLavoratori] = useState<Lavoratore[]>([]);
  const [tipo, setTipo] = useState<TipoLavoratore>("PROFESSIONISTA");
  const [errore, setErrore] = useState("");
  const [caricato, setCaricato] = useState(false);

  useEffect(() => {
    Promise.all([categorie(), elencoLavoratori()])
      .then(([c, l]) => {
        setElencoCategorie(c);
        setLavoratori(l);
      })
      .catch((e) => setErrore(e instanceof Error ? e.message : "Errore inatteso"))
      .finally(() => setCaricato(true));
  }, []);

  const migliori = useMemo(
    () =>
      lavoratori
        .filter((l) => l.tipo === tipo)
        .filter((l) => !filtro || l.categorie.includes(filtro))
        .sort((a, b) => b.media - a.media)
        .slice(0, 3),
    [lavoratori, tipo, filtro],
  );

  return (
    <Pagina larga>
      <h1 className="text-3xl font-bold">Cosa ti serve oggi?</h1>
      <p className="mt-1 text-sm font-medium text-fumo">Trova la persona giusta vicino a te</p>

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
                    onClick={() =>
                      impostaParametri(attiva ? {} : { categoria: categoria.nome })
                    }
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
                      className={`mt-2 block text-xs font-medium break-words ${attiva ? "text-corallo" : "text-fumo"}`}
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
          </div>

          <aside className="mt-8 lg:mt-0">
            <h2 className="text-lg font-semibold">
              {filtro ? `I migliori per ${filtro}` : "I migliori in zona"}
            </h2>

            <div className="mt-3 flex gap-2">
              {TIPI.map((voce) => (
                <button
                  key={voce.valore}
                  type="button"
                  onClick={() => setTipo(voce.valore)}
                  className={`h-10 rounded-full border border-bordo px-5 text-sm font-semibold shadow-morbida ${
                    tipo === voce.valore ? "bg-corallo text-white" : "bg-white text-fumo"
                  }`}
                >
                  {voce.etichetta}
                </button>
              ))}
            </div>

            <div className="mt-3.5 flex flex-col gap-3.5 md:grid md:grid-cols-2 lg:grid-cols-1">
              {migliori.map((l) => (
                <CardLavoratore key={l.id} lavoratore={l} />
              ))}
            </div>

            {migliori.length === 0 && (
              <div className="mt-3.5">
                <StatoVuoto
                  Icona={Users}
                  titolo="Nessun risultato in questa zona"
                  testo={
                    filtro
                      ? `Nessun ${tipo === "PROFESSIONISTA" ? "professionista" : "hobbista"} per ${filtro}. Pubblica una richiesta e lascia arrivare le proposte.`
                      : "Prova un'altra categoria oppure pubblica tu una richiesta per ricevere risposte."
                  }
                  azione={{ etichetta: "Pubblica richiesta", percorso: "/richieste/nuova" }}
                />
              </div>
            )}

            <Link
              to="/professionisti"
              className="mt-3.5 flex h-12 items-center justify-center rounded-2xl border border-bordo bg-white text-sm font-semibold"
            >
              Vedi tutti gli esperti
            </Link>
          </aside>
        </div>
      )}

      {errore && <p className="mt-4 text-sm text-red-600">{errore}</p>}

      <BarraNavigazione />
    </Pagina>
  );
}
