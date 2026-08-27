import { Search, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import BarraNavigazione from "../componenti/BarraNavigazione";
import Pagina from "../componenti/Pagina";
import CampoLuogo from "../componenti/CampoLuogo";
import CardLavoratore from "../componenti/CardLavoratore";
import StatoVuoto from "../componenti/StatoVuoto";
import { elencoLavoratori, type Lavoratore, type Luogo, type TipoLavoratore } from "../lib/api";
import { salvaDove, useDove } from "../lib/dove";

const TIPI = [
  { valore: "PROFESSIONISTA", etichetta: "Professionisti" },
  { valore: "HOBBISTA", etichetta: "Hobbisti" },
] as const;

const RAGGI = [10, 25, 50, 100];

export default function ElencoProfessionisti() {
  const dove = useDove();
  const [entroKm, setEntroKm] = useState<number | null>(null);
  const [lavoratori, setLavoratori] = useState<Lavoratore[]>([]);
  const [tipo, setTipo] = useState<TipoLavoratore>("PROFESSIONISTA");
  const [cerca, setCerca] = useState("");
  const [perRecensioni, setPerRecensioni] = useState(false);
  const [errore, setErrore] = useState("");
  const [caricato, setCaricato] = useState(false);

  useEffect(() => {
    if (dove === undefined) return;
    elencoLavoratori(dove ? { ...dove, entroKm: entroKm ?? undefined } : undefined)
      .then((pagina) => setLavoratori(pagina.voci))
      .catch((e) => setErrore(e instanceof Error ? e.message : "Errore inatteso"))
      .finally(() => setCaricato(true));
  }, [dove, entroKm]);



  const visibili = useMemo(() => {
    const testo = cerca.trim().toLowerCase();
    const filtrati = lavoratori.filter((l) => {
      if (l.tipo !== tipo) return false;
      if (!testo) return true;
      return (
        l.nome.toLowerCase().includes(testo) ||
        l.descrizione.toLowerCase().includes(testo) ||
        l.zonaOperativa.toLowerCase().includes(testo) ||
        l.categorie.some((c) => c.toLowerCase().includes(testo)) ||
        l.attivita.some((a) => a.toLowerCase().includes(testo))
      );
    });
    return perRecensioni ? [...filtrati].sort((a, b) => b.media - a.media) : filtrati;
  }, [lavoratori, tipo, cerca, perRecensioni]);

  return (
    <Pagina larga>
      <h1 className="text-3xl font-bold">{dove ? "Esperti in zona" : "Tutti gli esperti"}</h1>
      <p className="mt-1 text-sm text-fumo">
        {!caricato
          ? "Caricamento…"
          : `${visibili.length} ${visibili.length === 1 ? "risultato" : "risultati"}` +
            (dove
              ? entroKm
                ? ` entro ${entroKm} km da ${dove.citta ?? dove.indirizzo}`
                : `, dal più vicino a ${dove.citta ?? dove.indirizzo}`
              : "")}
      </p>

      <div className="mt-3.5 flex flex-col gap-2.5 md:flex-row md:items-center">
        <div className="flex-1">
          <CampoLuogo
            segnaposto="Da dove cerchi? Roma, Milano…"
            scelto={dove ?? null}
            vicinoA={dove ?? null}
            onScelto={salvaDove}
          />
        </div>

        {dove && (
          <div className="flex flex-wrap gap-2">
            {RAGGI.map((km) => (
              <button
                key={km}
                type="button"
                onClick={() => setEntroKm(entroKm === km ? null : km)}
                className={`h-9 rounded-full border px-3.5 text-sm font-semibold ${
                  entroKm === km
                    ? "border-corallo bg-corallo text-white"
                    : "border-bordo bg-white text-fumo"
                }`}
              >
                {km} km
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mt-3.5 flex h-12 items-center gap-2 rounded-3xl border border-bordo bg-white px-4 md:h-14">
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

      <div className="mt-3.5 flex flex-col gap-3.5 md:grid md:grid-cols-2">
        {visibili.map((l) => (
          <CardLavoratore key={l.id} lavoratore={l} />
        ))}
      </div>

      {caricato && visibili.length === 0 && (
        <div className="mt-3.5">
          <StatoVuoto
            Icona={Users}
            titolo="Nessun risultato in questa zona"
            testo={
              cerca
                ? "Nessuno corrisponde a questa ricerca. Prova con un altro lavoro o categoria."
                : "Nessun Tasker approvato qui per ora. Pubblica una richiesta e lascia arrivare le proposte."
            }
            azione={{ etichetta: "Pubblica richiesta", percorso: "/richieste/nuova" }}
          />
        </div>
      )}

      {errore && <p className="mt-4 text-sm text-red-600">{errore}</p>}

      <BarraNavigazione />
    </Pagina>
  );
}
