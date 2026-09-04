import { ImagePlus, Loader2, X } from "lucide-react";
import { useRef, useState } from "react";
import { cancellaFoto, caricaFoto, type FotoRichiesta as Foto } from "../lib/api";
import FotoAutenticata from "./FotoAutenticata";

const MASSIMO = 5;
const LATO_MASSIMO = 1600;

type Props = {
  richiestaId: number;
  foto: Foto[];
  modificabile: boolean;
  onCambiate: (foto: Foto[]) => void;
};

export default function FotoRichiesta({ richiestaId, foto, modificabile, onCambiate }: Props) {
  const inputFile = useRef<HTMLInputElement>(null);
  const [inCorso, setInCorso] = useState(false);
  const [errore, setErrore] = useState("");
  const [aperta, setAperta] = useState<number | null>(null);

  async function aggiungi(evento: React.ChangeEvent<HTMLInputElement>) {
    const scelti = Array.from(evento.target.files ?? []);
    evento.target.value = "";
    if (scelti.length === 0) return;

    const postoLibero = MASSIMO - foto.length;
    if (postoLibero <= 0) {
      setErrore(`Puoi averne al massimo ${MASSIMO}.`);
      return;
    }

    setErrore("");
    setInCorso(true);
    try {
      let attuali = foto;
      for (const file of scelti.slice(0, postoLibero)) {
        const ridotto = await ridimensiona(file);
        const nuova = await caricaFoto(richiestaId, ridotto);
        attuali = [...attuali, nuova];
        onCambiate(attuali);
      }
      if (scelti.length > postoLibero) {
        setErrore(`Caricate ${postoLibero}: il resto avrebbe superato il massimo di ${MASSIMO}.`);
      }
    } catch (e) {
      setErrore(e instanceof Error ? e.message : "Errore inatteso");
    } finally {
      setInCorso(false);
    }
  }

  async function togli(id: number) {
    setErrore("");
    try {
      await cancellaFoto(richiestaId, id);
      onCambiate(foto.filter((f) => f.id !== id));
    } catch (e) {
      setErrore(e instanceof Error ? e.message : "Errore inatteso");
    }
  }

  if (!modificabile && foto.length === 0) return null;

  return (
    <div className="mt-5 rounded-3xl border border-bordo bg-white p-4">
      <p className="text-lg font-semibold">Foto</p>
      <p className="mt-1 text-xs text-fumo">
        {modificabile
          ? "Una foto del guasto aiuta a fare un prezzo giusto."
          : "Foto messe dal cliente per far capire il lavoro."}
      </p>

      <div className="mt-3 flex flex-wrap gap-2.5">
        {foto.map((f) => (
          <div key={f.id} className="group relative size-20 shrink-0 overflow-hidden rounded-2xl">
            <FotoAutenticata id={f.id} className="size-20" onClick={() => setAperta(f.id)} />
            {modificabile && (
              <button
                type="button"
                onClick={() => togli(f.id)}
                aria-label="Togli questa foto"
                className="absolute top-1 right-1 flex size-6 items-center justify-center rounded-full bg-inchiostro/70 text-white opacity-0 transition-opacity group-hover:opacity-100"
              >
                <X className="size-3.5" strokeWidth={2.5} />
              </button>
            )}
          </div>
        ))}

        {modificabile && foto.length < MASSIMO && (
          <button
            type="button"
            onClick={() => inputFile.current?.click()}
            disabled={inCorso}
            className="flex size-20 shrink-0 flex-col items-center justify-center gap-1 rounded-2xl border border-dashed border-bordo text-fumo disabled:opacity-50"
          >
            {inCorso ? (
              <Loader2 className="size-5 animate-spin" strokeWidth={1.75} />
            ) : (
              <>
                <ImagePlus className="size-5" strokeWidth={1.75} />
                <span className="text-xs font-medium">Aggiungi</span>
              </>
            )}
          </button>
        )}
      </div>

      <input
        ref={inputFile}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        onChange={aggiungi}
        className="hidden"
      />

      {errore && <p className="mt-2 text-xs text-red-600">{errore}</p>}

      {aperta !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-inchiostro/80 p-6"
          onClick={() => setAperta(null)}
        >
          <FotoAutenticata id={aperta} className="max-h-full max-w-full rounded-2xl" />
        </div>
      )}
    </div>
  );
}

function ridimensiona(file: File): Promise<Blob> {
  return new Promise((risolvi, rifiuta) => {
    const immagine = new Image();
    immagine.onload = () => {
      const scala = Math.min(1, LATO_MASSIMO / Math.max(immagine.width, immagine.height));
      const tela = document.createElement("canvas");
      tela.width = Math.round(immagine.width * scala);
      tela.height = Math.round(immagine.height * scala);
      const contesto = tela.getContext("2d");
      if (!contesto) {
        rifiuta(new Error("Il browser non riesce a preparare l'immagine"));
        return;
      }
      contesto.drawImage(immagine, 0, 0, tela.width, tela.height);
      tela.toBlob(
        (blob) => (blob ? risolvi(blob) : rifiuta(new Error("Immagine non valida"))),
        "image/jpeg",
        0.85,
      );
      URL.revokeObjectURL(immagine.src);
    };
    immagine.onerror = () => rifiuta(new Error("Immagine non valida"));
    immagine.src = URL.createObjectURL(file);
  });
}
