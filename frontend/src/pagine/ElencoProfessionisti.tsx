import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import BarraNavigazione from "../componenti/BarraNavigazione";
import CardLavoratore from "../componenti/CardLavoratore";
import RiquadroInfo from "../componenti/RiquadroInfo";
import { elencoLavoratori, type Lavoratore, type TipoLavoratore } from "../lib/api";

const TIPI = [
  { valore: "PROFESSIONISTA", etichetta: "Professionisti" },
  { valore: "HOBBISTA", etichetta: "Hobbisti" },
] as const;

export default function ElencoProfessionisti() {
  const [lavoratori, setLavoratori] = useState<Lavoratore[]>([]);
  const [tipo, setTipo] = useState<TipoLavoratore>("PROFESSIONISTA");
  const [cerca, setCerca] = useState("");
  const [perRecensioni, setPerRecensioni] = useState(false);
  const [errore, setErrore] = useState("");
  const [caricato, setCaricato] = useState(false);

  useEffect(() => {
    elencoLavoratori()
      .then(setLavoratori)
      .catch((e) => setErrore(e instanceof Error ? e.message : "Errore inatteso"))
      .finally(() => setCaricato(true));
  }, []);

  const visibili = useMemo(() => {
    const testo = cerca.trim().toLowerCase();
    const filtrati = lavoratori.filter((l) => {
      if (l.tipo !== tipo) return false;
      if (!testo) return true;
      return (
        l.nome.toLowerCase().includes(testo) ||
        l.descrizione.toLowerCase().includes(testo) ||
        l.zonaOperativa.toLowerCase().includes(testo) ||
        l.categorie.some((c) => c.toLowerCase().includes(testo))
      );
    });
    return perRecensioni ? [...filtrati].sort((a, b) => b.media - a.media) : filtrati;
  }, [lavoratori, tipo, cerca, perRecensioni]);

  return (
    <div className="mx-auto min-h-screen max-w-md px-6 pt-7 pb-32">
      <h1 className="text-3xl font-bold">Esperti in zona</h1>
      <p className="mt-1 text-sm text-fumo">
        {caricato
          ? `${visibili.length} ${visibili.length === 1 ? "risultato" : "risultati"}`
          : "Caricamento…"}
      </p>

      <div className="mt-3.5 flex h-12 items-center gap-2 rounded-3xl border border-bordo bg-white px-4">
        <Search className="size-5 shrink-0 text-fumo" strokeWidth={1.75} />
        <input
          value={cerca}
          onChange={(e) => setCerca(e.target.value)}
          placeholder="Giardinaggio, potatura, siepi…"
          className="min-w-0 flex-1 text-sm outline-none"
        />
      </div>

      <div className="mt-3.5 flex gap-2 rounded-3xl border border-bordo bg-white p-1">
        {TIPI.map((voce) => (
          <button
            key={voce.valore}
            type="button"
            onClick={() => setTipo(voce.valore)}
            className={`h-11 flex-1 rounded-3xl text-sm font-semibold ${
              tipo === voce.valore ? "bg-corallo text-white" : "text-inchiostro"
            }`}
          >
            {voce.etichetta}
          </button>
        ))}
      </div>

      <div className="mt-2.5 flex gap-2.5">
        <button
          type="button"
          onClick={() => setPerRecensioni(!perRecensioni)}
          className={`rounded-full px-3 py-2 text-xs font-semibold ${
            perRecensioni ? "bg-corallo text-white" : "border border-bordo bg-white text-fumo"
          }`}
        >
          Top recensiti
        </button>
      </div>

      <div className="mt-3.5 flex flex-col gap-3.5">
        {visibili.map((l) => (
          <CardLavoratore key={l.id} lavoratore={l} />
        ))}
      </div>

      {caricato && visibili.length === 0 && (
        <div className="mt-3.5">
          <RiquadroInfo>
            {cerca
              ? "Nessun risultato per questa ricerca."
              : "Nessun lavoratore approvato in questa categoria per ora."}
          </RiquadroInfo>
        </div>
      )}

      {errore && <p className="mt-4 text-sm text-red-600">{errore}</p>}

      <BarraNavigazione />
    </div>
  );
}
