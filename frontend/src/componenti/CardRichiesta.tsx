import { MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import type { Richiesta } from "../lib/api";

const COLORI_STATO: Record<string, string> = {
  APERTA: "bg-verde-chiaro text-verde",
  ASSEGNATA: "bg-pesca text-corallo",
  COMPLETATA: "bg-sabbia text-fumo",
  ANNULLATA: "bg-sabbia text-fumo",
};

export default function CardRichiesta({ richiesta }: { richiesta: Richiesta }) {
  return (
    <Link
      to={`/richieste/${richiesta.id}`}
      className="block rounded-3xl border border-bordo bg-white p-5 shadow-morbida"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-base font-semibold">{richiesta.titolo}</p>
        <span
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${COLORI_STATO[richiesta.stato]}`}
        >
          {richiesta.stato.toLowerCase()}
        </span>
      </div>

      <p className="mt-1.5 flex items-center gap-1.5 text-sm text-fumo">
        <MapPin className="size-4 shrink-0" strokeWidth={1.75} />
        {richiesta.categoria} • {richiesta.citta}
        {richiesta.budget != null && ` • ${richiesta.budget} €`}
      </p>

      <p className="mt-2 line-clamp-2 text-sm">{richiesta.descrizione}</p>
    </Link>
  );
}
