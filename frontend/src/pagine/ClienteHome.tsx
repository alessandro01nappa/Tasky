import { useEffect, useState } from "react";
import CardFornitore, { type Fornitore } from "../componenti/CardFornitore";
import { categorie, type Categoria } from "../lib/api";

// segnaposto: nessun endpoint elenca i fornitori, i valori sono quelli del design
const FORNITORE_ESEMPIO: Fornitore = {
  nome: "Luca Ferri",
  media: 4.9,
  distanzaKm: 2,
  tariffaOraria: 32,
  verificato: true,
};

const TIPI = [
  { chiave: "professionisti", etichetta: "Professionisti" },
  { chiave: "hobbisti", etichetta: "Hobbisti" },
] as const;

export default function ClienteHome() {
  const [elenco, setElenco] = useState<Categoria[]>([]);
  const [tipo, setTipo] = useState<string>(TIPI[0].chiave);
  const [errore, setErrore] = useState("");

  useEffect(() => {
    categorie()
      .then(setElenco)
      .catch((e) => setErrore(e instanceof Error ? e.message : "Errore inatteso"));
  }, []);

  return (
    <div className="mx-auto min-h-screen max-w-md px-6 pt-7 pb-12">
      <h1 className="text-3xl font-bold">Cosa ti serve oggi?</h1>
      <p className="mt-1 text-sm font-medium text-fumo">Roma, San Giovanni</p>

      <div className="mt-5 flex gap-3">
        <input
          placeholder="Cosa ti serve?"
          className="h-13 min-w-0 flex-1 rounded-2xl border border-bordo bg-white px-5 font-medium shadow-morbida placeholder:text-fumo"
        />
        <div className="flex h-13 shrink-0 items-center rounded-2xl border border-bordo bg-white px-5 font-semibold shadow-morbida">
          2 km
        </div>
      </div>

      <button
        type="button"
        className="mt-5 block w-full rounded-3xl bg-corallo p-5 text-left shadow-corallo"
      >
        <p className="text-xl font-bold text-white">Crea un annuncio</p>
        <p className="mt-1 max-w-60 text-sm text-white">
          Trova tu un esperto oppure lascia arrivare proposte
        </p>
      </button>

      <h2 className="mt-8 text-lg font-semibold">Categorie</h2>
      <div className="mt-3 grid grid-cols-4 gap-4">
        {elenco.map((categoria, indice) => (
          <div key={categoria.id}>
            <div
              className={`size-17 rounded-full border border-bordo ${
                indice % 2 === 0 ? "bg-pesca" : "bg-white"
              }`}
            />
            <p className="mt-2 text-xs font-medium text-fumo">{categoria.nome}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 flex gap-2">
        {TIPI.map((voce) => (
          <button
            key={voce.chiave}
            type="button"
            onClick={() => setTipo(voce.chiave)}
            className={`h-10 rounded-full border border-bordo bg-white px-6 text-sm font-semibold shadow-morbida ${
              tipo === voce.chiave ? "text-inchiostro" : "text-fumo"
            }`}
          >
            {voce.etichetta}
          </button>
        ))}
      </div>

      <div className="mt-5">
        <CardFornitore fornitore={FORNITORE_ESEMPIO} />
      </div>

      <button
        type="button"
        className="mt-2 h-12 w-full rounded-3xl bg-corallo font-semibold text-white shadow-corallo"
      >
        Contatta / Prenota
      </button>

      {errore && <p className="mt-4 text-sm text-red-600">{errore}</p>}
    </div>
  );
}
