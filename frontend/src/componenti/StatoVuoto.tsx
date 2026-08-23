import type { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";

type Props = {
  Icona: LucideIcon;
  titolo: string;
  testo: string;
  azione?: { etichetta: string; percorso: string };
};

/** Lo stato vuoto del design: icona, spiegazione e una via d'uscita. */
export default function StatoVuoto({ Icona, titolo, testo, azione }: Props) {
  return (
    <div className="flex flex-col items-center gap-3.5 rounded-3xl border border-bordo bg-white p-5">
      <span className="flex size-18 items-center justify-center rounded-3xl bg-pesca text-corallo">
        <Icona className="size-8" strokeWidth={1.5} />
      </span>
      <p className="max-w-70 text-center text-lg font-semibold">{titolo}</p>
      <p className="max-w-75 text-center text-sm text-fumo">{testo}</p>
      {azione && (
        <Link
          to={azione.percorso}
          className="flex h-11 w-55 items-center justify-center rounded-2xl bg-corallo text-sm font-semibold text-white"
        >
          {azione.etichetta}
        </Link>
      )}
    </div>
  );
}
