import { useEffect, useState } from "react";
import { tariffeDiMercato, type TariffeDiMercato } from "../lib/api";

// serve un minimo di lavoratori prima di poter dire che un prezzo è alto o basso
const CAMPIONE_MINIMO = 3;

type Props = {
  categoriaId: number;
  categoria: string;
  valore: string;
  onCambia: (valore: string) => void;
};

export default function TariffaCategoria({ categoriaId, categoria, valore, onCambia }: Props) {
  const [mercato, setMercato] = useState<TariffeDiMercato | null>(null);

  useEffect(() => {
    tariffeDiMercato(categoriaId)
      .then(setMercato)
      .catch(() => setMercato(null));
  }, [categoriaId]);

  const prezzo = valore ? Number(valore) : null;
  const media = mercato?.media ?? null;
  const abbastanzaDati = (mercato?.quanti ?? 0) >= CAMPIONE_MINIMO;

  let avviso: { testo: string; colore: string } | null = null;
  if (prezzo !== null && media !== null && abbastanzaDati) {
    if (prezzo > media * 1.25) {
      avviso = {
        testo: `Sei sopra la media di ${media} €/h: rischi di ricevere meno richieste.`,
        colore: "bg-miele text-ambra",
      };
    } else if (prezzo < media * 0.75) {
      avviso = {
        testo: `Sei sotto la media di ${media} €/h: rischi di guadagnare meno del dovuto.`,
        colore: "bg-pesca text-corallo",
      };
    } else {
      avviso = {
        testo: `In linea con la media di ${media} €/h.`,
        colore: "bg-verde-chiaro text-verde",
      };
    }
  }

  return (
    <div className="rounded-2xl border border-bordo bg-white p-3.5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold">{categoria}</p>
        <div className="flex items-center gap-1.5">
          <input
            type="number"
            min="0"
            value={valore}
            onChange={(e) => onCambia(e.target.value)}
            placeholder="30"
            className="h-10 w-24 rounded-2xl border border-bordo px-3 text-right text-sm outline-none"
          />
          <span className="text-sm font-semibold text-fumo">€/h</span>
        </div>
      </div>

      {avviso && (
        <p className={`mt-2.5 rounded-xl px-3 py-2 text-xs ${avviso.colore}`}>{avviso.testo}</p>
      )}

      {!abbastanzaDati && (
        <p className="mt-2.5 text-xs text-fumo">
          {mercato && mercato.quanti > 0
            ? mercato.quanti === 1
              ? "C'è un solo altro lavoratore in questa categoria: troppo poco per un confronto."
              : `Solo ${mercato.quanti} lavoratori in questa categoria: troppo pochi per un confronto.`
            : "Nessun altro lavoratore in questa categoria: sei tu a fare il prezzo."}
        </p>
      )}

      {abbastanzaDati && mercato?.minima != null && (
        <p className="mt-1.5 text-xs text-fumo">
          Gli altri chiedono da {mercato.minima} a {mercato.massima} €/h.
        </p>
      )}
    </div>
  );
}
