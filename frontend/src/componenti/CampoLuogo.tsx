import { MapPin } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { suggerisciLuoghi, type Luogo } from "../lib/api";

type Props = {
  etichetta?: string;
  segnaposto: string;
  aiuto?: string;
  /** Il posto già scelto, se c'è: serve a riaprire il campo con dentro qualcosa. */
  scelto: Luogo | null;
  onScelto: (luogo: Luogo | null) => void;
  /** Da dove guarda chi cerca: senza questo "Via Nazionale" propone mezza Italia. */
  vicinoA?: { latitudine: number; longitudine: number } | null;
};

/** Sotto le tre lettere le proposte sarebbero mezza Italia: non vale la richiesta. */
const LETTERE_MINIME = 3;
const ATTESA_MS = 450;

/** Quello che si legge nel campo dopo aver scelto: "Via Nazionale, Roma", oppure "Frascati". */
function etichettaDi(luogo: Luogo) {
  const nome = luogo.nome ?? luogo.indirizzo;
  return luogo.citta && luogo.citta !== nome ? `${nome}, ${luogo.citta}` : nome;
}

/**
 * Un posto non si scrive, si sceglie. Si digita, si aspetta un attimo, e si
 * prende una delle proposte: così le coordinate sono quelle giuste e non
 * dipendono da come è stato scritto il nome.
 */
export default function CampoLuogo({
  etichetta,
  segnaposto,
  aiuto,
  scelto,
  vicinoA,
  onScelto,
}: Props) {
  const [testo, setTesto] = useState(scelto ? etichettaDi(scelto) : "");
  const [proposte, setProposte] = useState<Luogo[]>([]);
  const [aperto, setAperto] = useState(false);
  const [evidenziata, setEvidenziata] = useState(0);
  const [cerco, setCerco] = useState(false);
  const contenitore = useRef<HTMLDivElement>(null);
  const campo = `luogo-${etichetta ?? segnaposto}`.toLowerCase().replace(/\s+/g, "-");

  // il posto può arrivare da fuori, per esempio dalla città del profilo
  useEffect(() => {
    if (scelto) setTesto(etichettaDi(scelto));
  }, [scelto]);

  // si aspetta che smetta di scrivere: una richiesta per parola, non per lettera
  useEffect(() => {
    if (!aperto || testo.trim().length < LETTERE_MINIME) {
      setProposte([]);
      return;
    }
    let annullato = false;
    setCerco(true);
    const attesa = setTimeout(() => {
      suggerisciLuoghi(testo, vicinoA ?? undefined)
        .then((trovate) => {
          if (annullato) return;
          setProposte(trovate);
          setEvidenziata(0);
        })
        .catch(() => !annullato && setProposte([]))
        .finally(() => !annullato && setCerco(false));
    }, ATTESA_MS);
    return () => {
      annullato = true;
      clearTimeout(attesa);
    };
  }, [testo, aperto, vicinoA]);

  useEffect(() => {
    function fuori(evento: MouseEvent) {
      if (!contenitore.current?.contains(evento.target as Node)) setAperto(false);
    }
    document.addEventListener("mousedown", fuori);
    return () => document.removeEventListener("mousedown", fuori);
  }, []);

  function scegli(luogo: Luogo) {
    onScelto(luogo);
    setTesto(etichettaDi(luogo));
    setAperto(false);
    setProposte([]);
  }

  function daTastiera(evento: React.KeyboardEvent) {
    if (evento.key === "Escape") {
      setAperto(false);
      return;
    }
    if (proposte.length === 0) return;
    if (evento.key === "ArrowDown") {
      evento.preventDefault();
      setEvidenziata((i) => (i + 1) % proposte.length);
    } else if (evento.key === "ArrowUp") {
      evento.preventDefault();
      setEvidenziata((i) => (i - 1 + proposte.length) % proposte.length);
    } else if (evento.key === "Enter") {
      evento.preventDefault();
      scegli(proposte[evidenziata]);
    }
  }

  return (
    <div ref={contenitore} className="relative flex flex-col gap-2">
      {etichetta && (
        <label htmlFor={campo} className="text-sm font-semibold text-fumo">
          {etichetta}
        </label>
      )}

      <div className="flex h-12 items-center gap-2 rounded-3xl border border-bordo bg-white px-4">
        <MapPin className="size-5 shrink-0 text-fumo" strokeWidth={1.75} />
        <input
          id={campo}
          role="combobox"
          aria-expanded={aperto && proposte.length > 0}
          aria-controls={`${campo}-proposte`}
          aria-activedescendant={
            proposte.length > 0 ? `${campo}-proposta-${evidenziata}` : undefined
          }
          autoComplete="off"
          value={testo}
          onChange={(e) => {
            setTesto(e.target.value);
            setAperto(true);
            if (scelto) onScelto(null);
          }}
          onFocus={() => setAperto(true)}
          onKeyDown={daTastiera}
          placeholder={segnaposto}
          className="min-w-0 flex-1 text-sm outline-none"
        />
      </div>

      {aperto && proposte.length > 0 && (
        <ul
          id={`${campo}-proposte`}
          role="listbox"
          className="absolute top-full right-0 left-0 z-20 mt-1 overflow-hidden rounded-3xl border border-bordo bg-white shadow-morbida"
        >
          {proposte.map((luogo, indice) => (
            <li key={luogo.indirizzo} id={`${campo}-proposta-${indice}`} role="option" aria-selected={indice === evidenziata}>
              <button
                type="button"
                onMouseEnter={() => setEvidenziata(indice)}
                onClick={() => scegli(luogo)}
                className={`block w-full px-4 py-3 text-left ${indice === evidenziata ? "bg-pesca-tenue" : "bg-white"}`}
              >
                <span className="block text-sm font-semibold">{etichettaDi(luogo)}</span>
                <span className="block truncate text-xs text-fumo">{luogo.indirizzo}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {aperto && !cerco && proposte.length === 0 && testo.trim().length >= LETTERE_MINIME && (
        <p className="text-xs text-fumo">Nessun posto con questo nome. Prova a scriverlo per intero.</p>
      )}

      {aiuto && !aperto && <p className="text-xs text-fumo">{aiuto}</p>}
    </div>
  );
}
