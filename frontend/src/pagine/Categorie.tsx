import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import BarraNavigazione from "../componenti/BarraNavigazione";
import IconaCategoria from "../componenti/IconaCategoria";
import Pagina from "../componenti/Pagina";
import { categorie, type Categoria } from "../lib/api";

export default function Categorie() {
  const [elenco, setElenco] = useState<Categoria[]>([]);
  const [errore, setErrore] = useState("");

  useEffect(() => {
    categorie()
      .then(setElenco)
      .catch((e) => setErrore(e instanceof Error ? e.message : "Errore inatteso"));
  }, []);

  return (
    <Pagina larga>
      <Link to="/" className="flex items-center gap-1.5 text-sm font-semibold text-corallo">
        <ArrowLeft className="size-4" strokeWidth={2.25} />
        Torna a Esplora
      </Link>

      <h1 className="mt-4 text-3xl font-bold">Tutte le categorie</h1>
      <p className="mt-1 text-sm text-fumo">
        {elenco.length} categorie di servizio. Scegline una per vedere le richieste aperte.
      </p>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {elenco.map((categoria, indice) => (
          <Link
            key={categoria.id}
            to={`/?categoria=${encodeURIComponent(categoria.nome)}`}
            className="flex items-center gap-3 rounded-3xl border border-bordo bg-white p-4 shadow-morbida"
          >
            <span
              className={`flex size-12 shrink-0 items-center justify-center rounded-full text-corallo ${
                indice % 2 === 0 ? "bg-pesca" : "bg-pesca-tenue"
              }`}
            >
              <IconaCategoria nome={categoria.nome} className="size-6" />
            </span>
            <span className="text-sm font-semibold">{categoria.nome}</span>
          </Link>
        ))}
      </div>

      {errore && <p className="mt-4 text-sm text-red-600">{errore}</p>}

      <BarraNavigazione />
    </Pagina>
  );
}
