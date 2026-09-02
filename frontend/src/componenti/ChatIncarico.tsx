import { Send } from "lucide-react";
import { useEffect, useState } from "react";
import { inviaMessaggio, messaggiIncarico, type Messaggio } from "../lib/api";

export default function ChatIncarico({ incaricoId }: { incaricoId: number }) {
  const [messaggi, setMessaggi] = useState<Messaggio[]>([]);
  const [testo, setTesto] = useState("");
  const [errore, setErrore] = useState("");
  const [inCorso, setInCorso] = useState(false);

  useEffect(() => {
    messaggiIncarico(incaricoId)
      .then(setMessaggi)
      .catch((e) => setErrore(e instanceof Error ? e.message : "Errore inatteso"));
  }, [incaricoId]);

  async function invia(evento: React.FormEvent) {
    evento.preventDefault();
    if (!testo.trim()) return;
    setInCorso(true);
    setErrore("");
    try {
      const nuovo = await inviaMessaggio(incaricoId, testo);
      setMessaggi((precedenti) => [...precedenti, nuovo]);
      setTesto("");
    } catch (e) {
      setErrore(e instanceof Error ? e.message : "Errore inatteso");
    } finally {
      setInCorso(false);
    }
  }

  return (
    <section className="mt-5 rounded-3xl border border-bordo bg-white p-5">
      <h2 className="text-lg font-semibold">Chat del lavoro</h2>
      <div className="mt-3 flex max-h-80 flex-col gap-2.5 overflow-y-auto">
        {messaggi.length === 0 && <p className="text-sm text-fumo">Ancora nessun messaggio.</p>}
        {messaggi.map((messaggio) => (
          <div
            key={messaggio.id}
            className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm ${
              messaggio.scrittoDaMe ? "self-end bg-pesca text-inchiostro" : "bg-sabbia text-inchiostro"
            }`}
          >
            {!messaggio.scrittoDaMe && <p className="mb-1 text-xs font-semibold text-fumo">{messaggio.autore}</p>}
            <p>{messaggio.testo}</p>
          </div>
        ))}
      </div>
      <form onSubmit={invia} className="mt-4 flex gap-2">
        <input
          value={testo}
          onChange={(e) => setTesto(e.target.value)}
          maxLength={2000}
          placeholder="Scrivi un messaggio…"
          className="min-w-0 flex-1 rounded-2xl border border-bordo px-4 text-sm outline-none"
        />
        <button
          type="submit"
          disabled={inCorso || !testo.trim()}
          aria-label="Invia messaggio"
          className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-corallo text-white disabled:opacity-40"
        >
          <Send className="size-5" strokeWidth={2} />
        </button>
      </form>
      {errore && <p className="mt-3 text-sm text-red-600">{errore}</p>}
    </section>
  );
}
