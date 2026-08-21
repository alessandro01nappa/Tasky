import { Star } from "lucide-react";
import { Link } from "react-router-dom";
import type { Lavoratore } from "../lib/api";

function iniziali(nome: string) {
  return nome
    .split(" ")
    .slice(0, 2)
    .map((parola) => parola[0])
    .join("")
    .toUpperCase();
}

export default function CardLavoratore({ lavoratore }: { lavoratore: Lavoratore }) {
  const professionista = lavoratore.tipo === "PROFESSIONISTA";

  return (
    <div className="rounded-3xl border border-bordo bg-white p-3.5 shadow-morbida">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className={`flex size-12 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
              professionista ? "bg-verde-chiaro text-verde" : "bg-pesca text-corallo"
            }`}
          >
            {iniziali(lavoratore.nome)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-lg font-semibold">{lavoratore.nome}</p>
            <span
              className={`mt-1 inline-block rounded-full px-2.5 py-1 text-xs font-medium ${
                professionista ? "bg-verde-chiaro text-verde" : "bg-pesca text-corallo"
              }`}
            >
              {professionista ? "Pro verificato" : "Top appassionato"}
            </span>
          </div>
        </div>

        <p className="shrink-0 text-right text-xs font-medium text-fumo">
          {lavoratore.zonaOperativa}
        </p>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <span className="flex items-center gap-1.5 rounded-full bg-pesca-tenue px-2.5 py-1 text-xs font-medium">
          <Star className="size-3 text-ambra" strokeWidth={1.75} fill="currentColor" />
          {lavoratore.numeroRecensioni > 0
            ? `${lavoratore.media} • ${lavoratore.numeroRecensioni}`
            : "Nessuna recensione"}
        </span>
        {lavoratore.categorie.map((categoria) => (
          <span
            key={categoria}
            className="rounded-full bg-sabbia px-2.5 py-1 text-xs font-medium text-fumo"
          >
            {categoria}
          </span>
        ))}
      </div>

      <p className="mt-3 line-clamp-2 text-sm text-fumo">{lavoratore.descrizione}</p>

      <Link
        to={`/lavoratori/${lavoratore.id}`}
        className="mt-3 flex h-12 items-center justify-center rounded-2xl border border-bordo text-sm font-semibold"
      >
        Profilo
      </Link>
    </div>
  );
}
