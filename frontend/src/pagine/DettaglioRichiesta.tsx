import { ArrowLeft, MapPin, Send } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Pagina from "../componenti/Pagina";
import RiquadroInfo from "../componenti/RiquadroInfo";
import StatoSuccesso from "../componenti/StatoSuccesso";
import {
  candidati,
  candidatureRicevute,
  creaIncarico,
  mieRichieste,
  richiesta as leggiRichiesta,
  type Candidatura,
  type Richiesta,
} from "../lib/api";
import { raccontaQuando } from "../lib/quando";
import { useProfiloLavoratore } from "../lib/lavoratore";

const COLORI_STATO: Record<string, string> = {
  APERTA: "bg-verde-chiaro text-verde",
  ASSEGNATA: "bg-pesca text-corallo",
  COMPLETATA: "bg-sabbia text-fumo",
  ANNULLATA: "bg-sabbia text-fumo",
};

function iniziali(nome: string) {
  return nome
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

export default function DettaglioRichiesta() {
  const { id } = useParams();
  const navigate = useNavigate();
  const idRichiesta = Number(id);
  const profiloLavoratore = useProfiloLavoratore();

  const [dati, setDati] = useState<Richiesta | null>(null);
  const [mia, setMia] = useState(false);
  const [candidature, setCandidature] = useState<Candidatura[]>([]);
  const [messaggio, setMessaggio] = useState("");
  const [prezzo, setPrezzo] = useState("");
  const [errore, setErrore] = useState("");
  const [esito, setEsito] = useState("");
  const [inCorso, setInCorso] = useState(false);

  useEffect(() => {
    Promise.all([leggiRichiesta(idRichiesta), mieRichieste()])
      .then(([richiesta, mie]) => {
        setDati(richiesta);
        const sonoIlCliente = mie.some((r) => r.id === richiesta.id);
        setMia(sonoIlCliente);
        if (sonoIlCliente) {
          return candidatureRicevute(idRichiesta).then(setCandidature);
        }
      })
      .catch((e) => setErrore(e instanceof Error ? e.message : "Errore inatteso"));
  }, [idRichiesta]);

  async function inviaCandidatura(evento: React.FormEvent) {
    evento.preventDefault();
    setErrore("");
    setInCorso(true);
    try {
      await candidati(idRichiesta, { messaggio, prezzoOfferto: prezzo ? Number(prezzo) : null });
      setEsito("Candidatura inviata. La trovi nella tua dashboard.");
      setMessaggio("");
      setPrezzo("");
    } catch (e) {
      setErrore(e instanceof Error ? e.message : "Errore inatteso");
    } finally {
      setInCorso(false);
    }
  }

  async function scegli(candidaturaId: number) {
    setErrore("");
    try {
      const incarico = await creaIncarico(candidaturaId);
      navigate(`/incarichi/${incarico.id}`);
    } catch (e) {
      setErrore(e instanceof Error ? e.message : "Errore inatteso");
    }
  }

  if (!dati) {
    return (
      <Pagina>
        <Link to="/" className="flex items-center gap-1.5 text-sm font-semibold text-corallo">
          <ArrowLeft className="size-4" strokeWidth={2.25} />
          Torna a Esplora
        </Link>
        {errore && <p className="mt-4 text-sm text-red-600">{errore}</p>}
      </Pagina>
    );
  }

  const dataPubblicazione = new Date(dati.dataCreazione).toLocaleDateString("it-IT", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <Pagina>
      <Link to="/" className="flex items-center gap-1.5 text-sm font-semibold text-corallo">
        <ArrowLeft className="size-4" strokeWidth={2.25} />
        Torna a Esplora
      </Link>

      <h1 className="mt-4 text-3xl font-bold">{dati.titolo}</h1>
      <p className="mt-2.5 text-sm text-fumo">
        Richiesta pubblicata il {dataPubblicazione} • {dati.citta}
        {dati.distanzaKm !== null && ` • a ${dati.distanzaKm} km da te`}
      </p>

      {/* l'indirizzo arriva dal backend solo a chi ne ha diritto: se c'è, si mostra */}
      {dati.indirizzo && (
        <p className="mt-1.5 flex items-center gap-1.5 text-sm font-medium">
          <MapPin className="size-4 shrink-0 text-corallo" strokeWidth={2} />
          {dati.indirizzo}
        </p>
      )}

      <div className="mt-2.5 flex flex-wrap gap-2">
        <span
          className={`rounded-full px-2.5 py-1.5 text-xs font-medium ${COLORI_STATO[dati.stato]}`}
        >
          {dati.stato.charAt(0) + dati.stato.slice(1).toLowerCase()}
        </span>
        {mia && (
          <span className="rounded-full bg-pesca px-2.5 py-1.5 text-xs font-medium text-corallo">
            {candidature.length === 1 ? "1 candidatura" : `${candidature.length} candidature`}
          </span>
        )}
        {dati.fornitoreRichiesto && (
          <span className="rounded-full bg-miele px-2.5 py-1.5 text-xs font-medium text-ambra">
            Prenotazione per {dati.fornitoreRichiesto}
          </span>
        )}
      </div>

      <div className="mt-5 flex gap-2">
        <div className="flex-1 rounded-2xl border border-bordo bg-white px-3 py-3.5">
          <p className="text-base font-semibold">
            {dati.budget != null ? `${dati.budget} €` : "Da concordare"}
          </p>
          <p className="mt-1 text-xs text-fumo">Budget</p>
        </div>
        <div className="flex-1 rounded-2xl border border-bordo bg-white px-3 py-3.5">
          <p className="text-base font-semibold">{dati.attivita ?? dati.categoria}</p>
          <p className="mt-1 text-xs text-fumo">{dati.attivita ? "Lavoro" : "Categoria"}</p>
        </div>
        <div className="flex-1 rounded-2xl border border-bordo bg-white px-3 py-3.5">
          <p className="text-base font-semibold">
            {raccontaQuando(dati.dataPreferita, dati.dataEntro)}
          </p>
          <p className="mt-1 text-xs text-fumo">Quando</p>
        </div>
      </div>

      <div className="mt-5 rounded-3xl border border-bordo bg-white p-4">
        <p className="text-lg font-semibold">Descrizione</p>
        <p className="mt-2.5 text-sm text-fumo">{dati.descrizione}</p>
        <p className="mt-2.5 text-sm text-fumo">Pubblicata da {dati.cliente}</p>
      </div>

      {mia && (
        <>
          <h2 className="mt-8 text-lg font-semibold">Candidature ricevute</h2>
          <div className="mt-3 flex flex-col gap-3">
            {candidature.map((c) => (
              <div key={c.id} className="rounded-3xl border border-bordo bg-white p-3.5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span
                      className={`flex size-11 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                        c.tipo === "PROFESSIONISTA"
                          ? "bg-verde-chiaro text-verde"
                          : "bg-pesca text-corallo"
                      }`}
                    >
                      {iniziali(c.fornitore)}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{c.fornitore}</p>
                      <span
                        className={`mt-1 inline-block rounded-full px-2.5 py-1.5 text-xs font-medium ${
                          c.tipo === "PROFESSIONISTA"
                            ? "bg-verde-chiaro text-verde"
                            : "bg-pesca text-corallo"
                        }`}
                      >
                        {c.tipo === "PROFESSIONISTA" ? "Pro verificato" : "Top appassionato"}
                      </span>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    {c.prezzoOfferto != null && (
                      <p className="font-semibold">€{c.prezzoOfferto}</p>
                    )}
                    <p className="text-xs text-fumo">{c.zonaOperativa}</p>
                  </div>
                </div>

                {c.messaggio && <p className="mt-3 text-sm text-fumo">{c.messaggio}</p>}

                <div className="mt-3 flex gap-2.5">
                  <Link
                    to={`/lavoratori/${c.fornitoreId}`}
                    className="flex h-10 w-28 items-center justify-center rounded-2xl border border-bordo text-sm font-semibold"
                  >
                    Profilo
                  </Link>
                  {dati.stato === "APERTA" && (
                    <button
                      type="button"
                      onClick={() => scegli(c.id)}
                      className={`h-10 flex-1 rounded-2xl text-sm font-semibold text-white ${
                        c.tipo === "PROFESSIONISTA" ? "bg-verde" : "bg-corallo"
                      }`}
                    >
                      Scegli
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {candidature.length === 0 && (
            <div className="mt-3">
              <RiquadroInfo>Nessuno si è ancora candidato a questa richiesta.</RiquadroInfo>
            </div>
          )}
        </>
      )}

      {!mia && dati.stato === "APERTA" && profiloLavoratore === null && (
        <div className="mt-5 rounded-3xl border border-bordo bg-white p-5">
          <p className="text-xl font-semibold">Vuoi candidarti?</p>
          <p className="mt-1.5 text-sm text-fumo">
            Serve un profilo Tasker. Si crea in un minuto, poi va approvato.
          </p>
          <Link
            to="/diventa-lavoratore"
            className="mt-4 flex h-12 items-center justify-center rounded-2xl bg-corallo text-sm font-semibold text-white"
          >
            Diventa Tasker
          </Link>
        </div>
      )}

      {!mia && dati.stato === "APERTA" && profiloLavoratore?.stato === "IN_ATTESA" && (
        <div className="mt-5">
          <RiquadroInfo>
            Il tuo profilo Tasker è in attesa di approvazione: potrai candidarti appena viene
            approvato.
          </RiquadroInfo>
        </div>
      )}

      {!mia && dati.stato === "APERTA" && profiloLavoratore?.stato === "APPROVATO" && (
        <form
          onSubmit={inviaCandidatura}
          className="mt-5 flex flex-col gap-3 rounded-3xl border border-bordo bg-white p-4"
        >
          <p className="text-xl font-semibold">Candidati</p>
          <p className="text-sm text-fumo">
            Proponi come lavoreresti e a che prezzo. Il cliente sceglie fra le candidature ricevute.
          </p>

          <div className="flex flex-col gap-2">
            <label htmlFor="messaggio" className="text-xs font-medium text-fumo">
              Messaggio
            </label>
            <textarea
              id="messaggio"
              value={messaggio}
              onChange={(e) => setMessaggio(e.target.value)}
              required
              rows={3}
              placeholder="Come pensi di svolgere il lavoro."
              className="rounded-2xl border border-bordo p-4 text-sm outline-none"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="prezzo" className="text-xs font-medium text-fumo">
              Prezzo offerto €
            </label>
            <input
              id="prezzo"
              type="number"
              min="0"
              value={prezzo}
              onChange={(e) => setPrezzo(e.target.value)}
              placeholder="100"
              className="h-11 rounded-2xl border border-bordo px-4 text-sm outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={inCorso}
            className="h-12 rounded-2xl bg-corallo text-sm font-semibold text-white"
          >
            Invia candidatura
          </button>
        </form>
      )}

      {esito && (
        <div className="mt-5">
          <StatoSuccesso
            Icona={Send}
            titolo="Candidatura inviata"
            testo="Il cliente la vedrà fra le proposte ricevute. La trovi nella tua dashboard."
          />
        </div>
      )}

      {errore && <p className="mt-4 text-sm text-red-600">{errore}</p>}
    </Pagina>
  );
}
