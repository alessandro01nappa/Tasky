import { ArrowLeft, Ban, Check, RotateCcw, ShieldCheck, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Pagina from "../componenti/Pagina";
import RiquadroInfo from "../componenti/RiquadroInfo";
import {
  approvaTasker,
  richiesteAmministrate,
  rifiutaTasker,
  riattivaUtente,
  ritiraRichiestaDaAmministratore,
  sospendiUtente,
  taskerDaVerificare,
  utentiAmministrati,
  type RichiestaAmministrata,
  type StatoFornitore,
  type TaskerDaVerificare,
  type UtenteAmministrato,
} from "../lib/api";

const SEZIONI = [
  { valore: "verifiche", etichetta: "Verifiche" },
  { valore: "utenti", etichetta: "Account" },
  { valore: "annunci", etichetta: "Annunci" },
] as const;

type Sezione = (typeof SEZIONI)[number]["valore"];

const STATI: { valore: StatoFornitore; etichetta: string }[] = [
  { valore: "IN_ATTESA", etichetta: "Da verificare" },
  { valore: "APPROVATO", etichetta: "Approvati" },
  { valore: "RIFIUTATO", etichetta: "Rifiutati" },
];

export default function Amministrazione() {
  const [sezione, setSezione] = useState<Sezione>("verifiche");
  const [stato, setStato] = useState<StatoFornitore>("IN_ATTESA");
  const [tasker, setTasker] = useState<TaskerDaVerificare[]>([]);
  const [utenti, setUtenti] = useState<UtenteAmministrato[]>([]);
  const [annunci, setAnnunci] = useState<RichiestaAmministrata[]>([]);
  const [errore, setErrore] = useState("");

  useEffect(() => {
    if (sezione !== "verifiche") return;
    taskerDaVerificare(stato).then(setTasker).catch(mostra);
  }, [sezione, stato]);

  useEffect(() => {
    if (sezione === "utenti") utentiAmministrati().then(setUtenti).catch(mostra);
    if (sezione === "annunci") richiesteAmministrate().then(setAnnunci).catch(mostra);
  }, [sezione]);

  function mostra(e: unknown) {
    setErrore(e instanceof Error ? e.message : "Errore inatteso");
  }

  async function agisci(azione: () => Promise<unknown>, poi: () => Promise<void>) {
    setErrore("");
    try {
      await azione();
      await poi();
    } catch (e) {
      mostra(e);
    }
  }

  const ricaricaTasker = async () => setTasker(await taskerDaVerificare(stato));
  const ricaricaUtenti = async () => setUtenti(await utentiAmministrati());
  const ricaricaAnnunci = async () => setAnnunci(await richiesteAmministrate());

  return (
    <Pagina larga>
      <Link to="/profilo" className="flex items-center gap-1.5 text-sm font-semibold text-corallo">
        <ArrowLeft className="size-4" strokeWidth={2.25} />
        Torna al profilo
      </Link>

      <h1 className="mt-4 flex items-center gap-2.5 text-3xl font-bold">
        <ShieldCheck className="size-7 text-corallo" strokeWidth={2} />
        Amministrazione
      </h1>
      <p className="mt-1 text-sm text-fumo">
        Chi può stare su Tasky, chi non più, e cosa non ci sta.
      </p>

      <div className="mt-5 flex flex-wrap gap-2">
        {SEZIONI.map((voce) => (
          <button
            key={voce.valore}
            type="button"
            onClick={() => setSezione(voce.valore)}
            className={`h-10 rounded-full border px-4 text-sm font-semibold ${
              sezione === voce.valore
                ? "border-corallo bg-corallo text-white"
                : "border-bordo bg-white text-fumo"
            }`}
          >
            {voce.etichetta}
          </button>
        ))}
      </div>

      {errore && <p className="mt-4 text-sm text-red-600">{errore}</p>}

      {sezione === "verifiche" && (
        <>
          <div className="mt-4 flex flex-wrap gap-2">
            {STATI.map((voce) => (
              <button
                key={voce.valore}
                type="button"
                onClick={() => setStato(voce.valore)}
                className={`h-9 rounded-full border px-3.5 text-xs font-semibold ${
                  stato === voce.valore
                    ? "border-inchiostro bg-inchiostro text-white"
                    : "border-bordo bg-white text-fumo"
                }`}
              >
                {voce.etichetta}
              </button>
            ))}
          </div>

          <div className="mt-4 flex flex-col gap-3">
            {tasker.map((t) => (
              <SchedaTasker
                key={t.id}
                tasker={t}
                onApprova={() => agisci(() => approvaTasker(t.id), ricaricaTasker)}
                onRifiuta={(motivo) => agisci(() => rifiutaTasker(t.id, motivo), ricaricaTasker)}
              />
            ))}
            {tasker.length === 0 && (
              <RiquadroInfo>Non c'è nessun profilo in questo stato.</RiquadroInfo>
            )}
          </div>
        </>
      )}

      {sezione === "utenti" && (
        <div className="mt-4 flex flex-col gap-3">
          {utenti.map((u) => (
            <SchedaUtente
              key={u.id}
              utente={u}
              onSospendi={(motivo) => agisci(() => sospendiUtente(u.id, motivo), ricaricaUtenti)}
              onRiattiva={() => agisci(() => riattivaUtente(u.id), ricaricaUtenti)}
            />
          ))}
        </div>
      )}

      {sezione === "annunci" && (
        <div className="mt-4 flex flex-col gap-3">
          {annunci.map((r) => (
            <div key={r.id} className="rounded-3xl border border-bordo bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link to={`/richieste/${r.id}`} className="font-semibold">
                    {r.titolo}
                  </Link>
                  <p className="mt-1 text-sm text-fumo">
                    {r.cliente} • {r.citta} • {r.stato.toLowerCase()}
                  </p>
                </div>
                {r.stato !== "ANNULLATA" && (
                  <button
                    type="button"
                    onClick={() => {
                      if (!confirm(`Ritiri "${r.titolo}"? Non sarà più in circolazione.`)) return;
                      agisci(() => ritiraRichiestaDaAmministratore(r.id), ricaricaAnnunci);
                    }}
                    className="h-9 shrink-0 rounded-full border border-bordo px-3.5 text-xs font-semibold text-corallo"
                  >
                    Ritira
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Pagina>
  );
}

function SchedaTasker({
  tasker,
  onApprova,
  onRifiuta,
}: {
  tasker: TaskerDaVerificare;
  onApprova: () => void;
  onRifiuta: (motivo: string) => void;
}) {
  const [motivo, setMotivo] = useState("");
  const [chiedoMotivo, setChiedoMotivo] = useState(false);

  return (
    <div className="rounded-3xl border border-bordo bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-lg font-semibold">{tasker.nome}</p>
          <p className="mt-1 text-sm text-fumo">
            {tasker.email} • {tasker.telefono ?? "nessun telefono"}
          </p>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
            tasker.completo ? "bg-verde-chiaro text-verde" : "bg-pesca text-corallo"
          }`}
        >
          {tasker.completo ? "Completo" : "Incompleto"}
        </span>
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm md:grid-cols-4">
        <div>
          <dt className="text-xs text-fumo">Zona</dt>
          <dd className="font-medium">{tasker.zonaOperativa}</dd>
        </div>
        <div>
          <dt className="text-xs text-fumo">Tipo</dt>
          <dd className="font-medium">
            {tasker.tipo === "PROFESSIONISTA" ? "Professionista" : "Hobbista"}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-fumo">Lavori</dt>
          <dd className="font-medium">{tasker.attivita.length}</dd>
        </div>
        <div>
          <dt className="text-xs text-fumo">Tariffe</dt>
          <dd className="font-medium">{tasker.quanteTariffe}</dd>
        </div>
      </dl>

      <p className="mt-3 text-sm">{tasker.descrizione}</p>

      {tasker.attivita.length > 0 && (
        <p className="mt-2 text-xs text-fumo">{tasker.attivita.join(", ")}</p>
      )}

      {tasker.motivoRifiuto && (
        <p className="mt-3 rounded-2xl bg-pesca px-3.5 py-2.5 text-xs text-inchiostro">
          Rifiutato: {tasker.motivoRifiuto}
        </p>
      )}

      {tasker.stato === "IN_ATTESA" && (
        <>
          <div className="mt-4 flex gap-2.5">
            <button
              type="button"
              onClick={onApprova}
              disabled={!tasker.completo}
              className="flex h-11 flex-1 items-center justify-center gap-2 rounded-2xl bg-verde text-sm font-semibold text-white disabled:opacity-40"
            >
              <Check className="size-4" strokeWidth={2.5} />
              Approva
            </button>
            <button
              type="button"
              onClick={() => setChiedoMotivo(!chiedoMotivo)}
              className="flex h-11 flex-1 items-center justify-center gap-2 rounded-2xl border border-bordo text-sm font-semibold"
            >
              <X className="size-4" strokeWidth={2.5} />
              Rifiuta
            </button>
          </div>

          {!tasker.completo && (
            <p className="mt-2 text-xs text-fumo">
              Mancano dei dati: si approva solo un profilo completo di lavori, tariffe, telefono e
              termini accettati.
            </p>
          )}

          {chiedoMotivo && (
            <div className="mt-3 flex flex-col gap-2">
              <label htmlFor={`motivo-${tasker.id}`} className="text-xs font-medium text-fumo">
                Perché lo rifiuti? Lo leggerà il Tasker.
              </label>
              <input
                id={`motivo-${tasker.id}`}
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Il numero di telefono non risponde"
                className="h-11 rounded-2xl border border-bordo px-4 text-sm outline-none"
              />
              <button
                type="button"
                onClick={() => onRifiuta(motivo)}
                disabled={motivo.trim() === ""}
                className="h-11 rounded-2xl bg-corallo text-sm font-semibold text-white disabled:opacity-40"
              >
                Conferma il rifiuto
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function SchedaUtente({
  utente,
  onSospendi,
  onRiattiva,
}: {
  utente: UtenteAmministrato;
  onSospendi: (motivo: string) => void;
  onRiattiva: () => void;
}) {
  const [motivo, setMotivo] = useState("");
  const [chiedoMotivo, setChiedoMotivo] = useState(false);

  return (
    <div className="rounded-3xl border border-bordo bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold">
            {utente.nome}
            {utente.amministratore && (
              <span className="ml-2 rounded-full bg-sabbia px-2 py-0.5 text-xs font-semibold text-fumo">
                amministratore
              </span>
            )}
          </p>
          <p className="mt-1 text-sm text-fumo">
            {utente.email}
            {utente.citta && ` • ${utente.citta}`}
          </p>
          {utente.sospeso && (
            <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-corallo">
              <Ban className="size-3.5" strokeWidth={2.5} />
              Sospeso: {utente.motivoSospensione}
            </p>
          )}
        </div>

        {!utente.amministratore &&
          (utente.sospeso ? (
            <button
              type="button"
              onClick={onRiattiva}
              className="flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-bordo px-3.5 text-xs font-semibold text-verde"
            >
              <RotateCcw className="size-3.5" strokeWidth={2.5} />
              Riattiva
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setChiedoMotivo(!chiedoMotivo)}
              className="h-9 shrink-0 rounded-full border border-bordo px-3.5 text-xs font-semibold text-corallo"
            >
              Sospendi
            </button>
          ))}
      </div>

      {chiedoMotivo && !utente.sospeso && (
        <div className="mt-3 flex flex-col gap-2">
          <label htmlFor={`sospensione-${utente.id}`} className="text-xs font-medium text-fumo">
            Perché lo sospendi? Lo leggerà quando prova a entrare.
          </label>
          <input
            id={`sospensione-${utente.id}`}
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Annunci falsi"
            className="h-11 rounded-2xl border border-bordo px-4 text-sm outline-none"
          />
          <button
            type="button"
            onClick={() => onSospendi(motivo)}
            disabled={motivo.trim() === ""}
            className="h-11 rounded-2xl bg-corallo text-sm font-semibold text-white disabled:opacity-40"
          >
            Conferma la sospensione
          </button>
        </div>
      )}
    </div>
  );
}
