export type Fornitore = {
  nome: string;
  media: number;
  distanzaKm: number;
  tariffaOraria: number;
  verificato: boolean;
};

// nel design le tre miniature sono rettangoli colorati vuoti, non foto
const COLORI_MINIATURE = ["bg-pesca", "bg-sabbia", "bg-miele"];

export default function CardFornitore({ fornitore }: { fornitore: Fornitore }) {
  return (
    <div className="rounded-3xl border border-bordo bg-white p-5 shadow-morbida">
      <div className="flex gap-4">
        <div className="size-14 shrink-0 rounded-full border border-bordo bg-pesca" />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="text-lg font-semibold">{fornitore.nome}</p>
            {fornitore.verificato && (
              <span className="shrink-0 rounded-full bg-verde-chiaro px-3 py-1 text-xs font-semibold text-verde">
                Pro Verificato
              </span>
            )}
          </div>
          <p className="text-sm font-medium text-fumo">
            {fornitore.media.toFixed(1)} stelle • {fornitore.distanzaKm} km • {fornitore.tariffaOraria} €/h
          </p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2">
        {COLORI_MINIATURE.map((colore) => (
          <div key={colore} className={`h-17 rounded-2xl border border-bordo ${colore}`} />
        ))}
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <span className="rounded-full border border-bordo px-3 py-1 text-xs font-medium text-fumo shadow-morbida">
          P.IVA verificata
        </span>
        <span className="rounded-full border border-bordo px-3 py-1 text-xs font-medium text-fumo shadow-morbida">
          Fattura disponibile
        </span>
      </div>
    </div>
  );
}
