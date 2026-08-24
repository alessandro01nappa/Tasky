import { Check, Info, TrendingDown, TrendingUp } from "lucide-react";
import type { PrezziDiRiferimento } from "../lib/api";

/** Sotto e sopra queste soglie il budget si stacca troppo da quello che si paga di solito. */
const BASSO = 0.75;
const ALTO = 1.25;

type Props = {
  budget: number | null;
  prezzi: PrezziDiRiferimento | null;
};

export default function AvvisoBudget({ budget, prezzi }: Props) {
  if (!prezzi) return null;

  const suCosa = prezzi.base === "attivita" ? "questo lavoro" : "questa categoria";

  // senza abbastanza lavori conclusi una media sarebbe un numero inventato
  if (prezzi.media === null) {
    return (
      <Riquadro Icona={Info} colore="bg-sabbia text-fumo">
        Su Tasky non ci sono ancora abbastanza lavori conclusi per {suCosa}: metti la cifra che
        ritieni giusta, i lavoratori possono farti una proposta diversa.
      </Riquadro>
    );
  }

  if (budget === null) {
    return (
      <Riquadro Icona={Info} colore="bg-sabbia text-fumo">
        Lavori come questo si sono chiusi in media a {prezzi.media} €, fra {prezzi.minimo} e{" "}
        {prezzi.massimo} € su {prezzi.quanti} lavori.
      </Riquadro>
    );
  }

  if (budget < prezzi.media * BASSO) {
    return (
      <Riquadro Icona={TrendingDown} colore="bg-pesca text-corallo">
        Sei sotto la media: per {suCosa} si spendono di solito {prezzi.media} €. Con questa cifra
        rischi di ricevere poche candidature.
      </Riquadro>
    );
  }

  if (budget > prezzi.media * ALTO) {
    return (
      <Riquadro Icona={TrendingUp} colore="bg-miele text-ambra">
        Stai offrendo più della media: per {suCosa} si spendono di solito {prezzi.media} €. Puoi
        abbassare e vedere che proposte arrivano.
      </Riquadro>
    );
  }

  return (
    <Riquadro Icona={Check} colore="bg-verde-chiaro text-verde">
      In linea con quello che si paga per {suCosa}: media {prezzi.media} €, fra {prezzi.minimo} e{" "}
      {prezzi.massimo} €.
    </Riquadro>
  );
}

function Riquadro({
  Icona,
  colore,
  children,
}: {
  Icona: typeof Info;
  colore: string;
  children: React.ReactNode;
}) {
  return (
    <p className={`flex items-start gap-2 rounded-2xl px-3.5 py-3 text-xs ${colore}`}>
      <Icona className="mt-px size-4 shrink-0" strokeWidth={2} />
      <span>{children}</span>
    </p>
  );
}
