import { Check, type LucideIcon } from "lucide-react";

type Props = {
  Icona: LucideIcon;
  titolo: string;
  testo: string;
};

/** Lo stato di successo del design: conferma che qualcosa è andato a buon fine. */
export default function StatoSuccesso({ Icona, titolo, testo }: Props) {
  return (
    <div className="flex flex-col items-center gap-3.5 rounded-3xl border border-bordo bg-white p-5">
      <span className="flex size-18 items-center justify-center rounded-3xl bg-verde-chiaro text-verde">
        <Icona className="size-8" strokeWidth={1.5} />
      </span>
      <p className="max-w-60 text-center text-lg font-semibold">{titolo}</p>
      <p className="max-w-72 text-center text-sm text-fumo">{testo}</p>
      <span className="flex items-center gap-1.5 rounded-full bg-verde-chiaro px-2.5 py-1.5 text-xs font-medium text-verde">
        <Check className="size-3.5" strokeWidth={3} />
        Successo
      </span>
    </div>
  );
}
