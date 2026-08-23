import { MapPin, TriangleAlert } from "lucide-react";
import { useState } from "react";
import { cercaLuogo, type Luogo } from "../lib/api";

type Props = {
  etichetta: string;
  aiuto: string;
  segnaposto: string;
  valore: string;
  onCambia: (valore: string) => void;
  onTrovato: (luogo: Luogo | null) => void;
  richiesto?: boolean;
};

/**
 * Un indirizzo scritto a mano non basta: "Roma sud" per una mappa è un casello
 * autostradale. Qui si scrive, si vede come è stato capito e solo allora si va avanti.
 */
export default function CampoIndirizzo({
  etichetta,
  aiuto,
  segnaposto,
  valore,
  onCambia,
  onTrovato,
  richiesto = false,
}: Props) {
  const campo = `indirizzo-${etichetta.toLowerCase().replace(/\s+/g, "-")}`;
  const [trovato, setTrovato] = useState<Luogo | null>(null);
  const [cerco, setCerco] = useState(false);
  const [mancato, setMancato] = useState(false);
  const [ultimo, setUltimo] = useState("");

  async function controlla() {
    const testo = valore.trim();
    if (testo === "" || testo === ultimo) return;
    setUltimo(testo);
    setCerco(true);
    setMancato(false);
    try {
      const luogo = await cercaLuogo(testo);
      setTrovato(luogo);
      onTrovato(luogo);
    } catch {
      setTrovato(null);
      setMancato(true);
      onTrovato(null);
    } finally {
      setCerco(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={campo} className="text-sm font-semibold text-fumo">
        {etichetta}
      </label>
      <input
        id={campo}
        required={richiesto}
        value={valore}
        onChange={(e) => {
          onCambia(e.target.value);
          setTrovato(null);
          setMancato(false);
        }}
        onBlur={controlla}
        placeholder={segnaposto}
        className="h-11 rounded-2xl border border-bordo px-4 outline-none"
      />

      {cerco && <p className="text-xs text-fumo">Cerco l'indirizzo…</p>}

      {trovato && (
        <p className="flex items-start gap-2 rounded-2xl bg-verde-chiaro px-3 py-2.5 text-xs text-verde">
          <MapPin className="mt-px size-4 shrink-0" strokeWidth={2} />
          {trovato.indirizzo}
        </p>
      )}

      {mancato && (
        <p className="flex items-start gap-2 rounded-2xl bg-pesca px-3 py-2.5 text-xs text-inchiostro">
          <TriangleAlert className="mt-px size-4 shrink-0" strokeWidth={2} />
          Non ho trovato questo indirizzo. Puoi andare avanti lo stesso, ma il lavoro non
          comparirà sulla mappa.
        </p>
      )}

      {!cerco && !trovato && !mancato && <p className="text-xs text-fumo">{aiuto}</p>}
    </div>
  );
}
