import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import CampoLuogo from "../componenti/CampoLuogo";
import IconaCategoria from "../componenti/IconaCategoria";
import Pagina from "../componenti/Pagina";
import RiquadroInfo from "../componenti/RiquadroInfo";
import {
  attivitaDiCategoria,
  categorie,
  creaRichiesta,
  elencoLavoratori,
  type Attivita,
  type Categoria,
  type Lavoratore,
  type Luogo,
} from "../lib/api";
import { usePosizioneCliente } from "../lib/posizione";

const PASSI = ["Titolo", "Dettagli", "Budget", "Data"];

export default function NuovaRichiesta() {
  const navigate = useNavigate();
  // la città del cliente aiuta a mettere in cima le vie giuste
  const posizione = usePosizioneCliente();
  const [parametri] = useSearchParams();
  const fornitoreId = parametri.get("fornitore");

  const [passo, setPasso] = useState(0);
  const [prenotato, setPrenotato] = useState<Lavoratore | null>(null);
  const [elencoCategorie, setElencoCategorie] = useState<Categoria[]>([]);
  const [categoriaId, setCategoriaId] = useState<number | null>(null);
  const [attivita, setAttivita] = useState<Attivita[]>([]);
  const [attivitaId, setAttivitaId] = useState<number | null>(null);
  const [titolo, setTitolo] = useState("");
  const [descrizione, setDescrizione] = useState("");
  const [citta, setCitta] = useState("");
  // la tendina da' la via con le sue coordinate, il civico lo scrive il cliente
  const [via, setVia] = useState<Luogo | null>(null);
  const [civico, setCivico] = useState("");
  const [budget, setBudget] = useState("");
  const [preventivo, setPreventivo] = useState(false);
  const [dataPreferita, setDataPreferita] = useState("");
  const [errore, setErrore] = useState("");
  const [inCorso, setInCorso] = useState(false);

  useEffect(() => {
    categorie()
      .then(setElencoCategorie)
      .catch((e) => setErrore(e instanceof Error ? e.message : "Errore inatteso"));
  }, []);

  // se arrivo dal profilo di un lavoratore la richiesta è indirizzata solo a lui
  useEffect(() => {
    if (!fornitoreId) return;
    elencoLavoratori()
      .then((tutti) => setPrenotato(tutti.find((l) => l.id === Number(fornitoreId)) ?? null))
      .catch(() => setPrenotato(null));
  }, [fornitoreId]);

  // cambiando categoria ricarico i lavori concreti che contiene
  useEffect(() => {
    setAttivita([]);
    setAttivitaId(null);
    if (categoriaId === null) return;
    attivitaDiCategoria(categoriaId)
      .then(setAttivita)
      .catch(() => setAttivita([]));
  }, [categoriaId]);

  const completo = [
    categoriaId !== null && titolo.trim() !== "",
    descrizione.trim() !== "" && via !== null && civico.trim() !== "",
    true,
    true,
  ];

  async function pubblica() {
    setErrore("");
    setInCorso(true);
    try {
      const creata = await creaRichiesta({
        categoriaId: categoriaId!,
        ...(attivitaId ? { attivitaId } : {}),
        ...(prenotato ? { fornitoreId: prenotato.id } : {}),
        titolo,
        descrizione,
        citta,
        indirizzo: `${via?.indirizzo.split(",")[0] ?? ""} ${civico}`.trim(),
        ...(via ? { latitudine: via.latitudine, longitudine: via.longitudine } : {}),
        budget: preventivo || !budget ? null : Number(budget),
        dataPreferita: dataPreferita || null,
      });
      navigate(`/richieste/${creata.id}`);
    } catch (e) {
      setErrore(e instanceof Error ? e.message : "Errore inatteso");
    } finally {
      setInCorso(false);
    }
  }

  return (
    <Pagina>
      <Link to="/" className="flex items-center gap-1.5 text-sm font-semibold text-corallo">
        <ArrowLeft className="size-4" strokeWidth={2.25} />
        Torna alla home
      </Link>

      <h1 className="mt-4 text-3xl font-bold">{prenotato ? "Prenota" : "Nuova richiesta"}</h1>
      <p className="mt-1 text-sm font-medium text-fumo">
        {prenotato ? `La richiesta va solo a ${prenotato.nome}` : "Pubblica in pochi passi"}
      </p>

      <div className="mt-4 flex gap-2">
        {PASSI.map((nome, indice) => (
          <button
            key={nome}
            type="button"
            onClick={() => indice <= passo && setPasso(indice)}
            disabled={indice > passo}
            className={`h-8 flex-1 rounded-2xl border text-xs font-semibold ${
              indice === passo
                ? "border-corallo bg-corallo text-white"
                : indice < passo
                  ? "border-bordo bg-white text-inchiostro"
                  : "border-bordo bg-white text-fumo"
            }`}
          >
            {indice + 1} {nome}
          </button>
        ))}
      </div>

      {prenotato && (
        <div className="mt-5">
          <RiquadroInfo>
            Se {prenotato.nome.split(" ")[0]} rifiuta, la richiesta diventa pubblica e gli altri
            lavoratori potranno candidarsi.
          </RiquadroInfo>
        </div>
      )}

      {passo === 0 && (
        <div className="mt-5 flex flex-col gap-3 rounded-3xl border border-bordo bg-white p-5 shadow-morbida">
          <p className="text-sm font-semibold text-fumo">Categoria</p>
          <div className="grid grid-cols-3 gap-3">
            {elencoCategorie.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategoriaId(c.id)}
                className="text-left"
              >
                <span
                  className={`flex size-14 items-center justify-center rounded-full border ${
                    categoriaId === c.id
                      ? "border-corallo bg-corallo text-white"
                      : "border-bordo bg-white text-corallo"
                  }`}
                >
                  <IconaCategoria nome={c.nome} className="size-6" />
                </span>
                <span className="mt-1.5 block text-xs font-medium break-words text-fumo">
                  {c.nome}
                </span>
              </button>
            ))}
          </div>

          {attivita.length > 0 && (
            <>
              <p className="mt-2 text-sm font-semibold text-fumo">Che lavoro ti serve?</p>
              <div className="flex flex-wrap gap-2">
                {attivita.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => {
                      setAttivitaId(a.id);
                      // il titolo parte dal lavoro scelto, resta modificabile
                      if (!titolo.trim()) setTitolo(a.nome);
                    }}
                    className={`h-9 rounded-full border px-4 text-sm font-semibold ${
                      attivitaId === a.id
                        ? "border-corallo bg-corallo text-white"
                        : "border-bordo bg-white text-fumo"
                    }`}
                  >
                    {a.nome}
                  </button>
                ))}
              </div>
            </>
          )}

          <label htmlFor="titolo" className="mt-2 text-sm font-semibold text-fumo">
            Titolo richiesta
          </label>
          <input
            id="titolo"
            value={titolo}
            onChange={(e) => setTitolo(e.target.value)}
            placeholder="Rubinetto della cucina che perde"
            className="h-11 rounded-2xl border border-bordo px-4 outline-none"
          />
        </div>
      )}

      {passo === 1 && (
        <div className="mt-5 flex flex-col gap-3 rounded-3xl border border-bordo bg-white p-5 shadow-morbida">
          <label htmlFor="descrizione" className="text-sm font-semibold text-fumo">
            Descrizione
          </label>
          <textarea
            id="descrizione"
            value={descrizione}
            onChange={(e) => setDescrizione(e.target.value)}
            rows={5}
            placeholder="Descrivi il problema, indica materiali e misure."
            className="rounded-2xl border border-bordo p-4 outline-none"
          />

          <div className="mt-2">
            <CampoLuogo
              etichetta="Via"
              aiuto="Scegli la via dall'elenco. L'indirizzo lo vedrai solo tu, finché non assegni il lavoro."
              segnaposto="Via del Corso, Roma"
              vicinoA={posizione}
              scelto={via}
              onScelto={(luogo) => {
                setVia(luogo);
                setCitta(luogo?.citta ?? "");
              }}
            />
          </div>

          <label htmlFor="civico" className="mt-2 text-sm font-semibold text-fumo">
            Numero civico e interno
          </label>
          <input
            id="civico"
            value={civico}
            onChange={(e) => setCivico(e.target.value)}
            placeholder="12, scala B, interno 4"
            className="h-11 rounded-2xl border border-bordo px-4 outline-none"
          />
        </div>
      )}

      {passo === 2 && (
        <div className="mt-5 flex gap-3">
          <div className="flex-1 rounded-3xl border border-bordo bg-white p-5 shadow-morbida">
            <p className="text-sm font-semibold text-fumo">Budget €</p>
            <input
              type="number"
              min="0"
              value={budget}
              onChange={(e) => {
                setBudget(e.target.value);
                setPreventivo(false);
              }}
              placeholder="120"
              className="mt-2 h-11 w-full rounded-2xl border border-bordo px-4 text-lg font-semibold text-corallo outline-none"
            />
          </div>
          <button
            type="button"
            onClick={() => {
              setPreventivo(!preventivo);
              setBudget("");
            }}
            className={`flex-1 rounded-3xl border p-5 text-left shadow-morbida ${
              preventivo ? "border-corallo bg-pesca" : "border-bordo bg-white"
            }`}
          >
            <span className="block text-sm font-semibold text-fumo">Oppure</span>
            <span className="mt-2 block text-lg font-semibold">Richiedi preventivo</span>
          </button>
        </div>
      )}

      {passo === 3 && (
        <>
          <div className="mt-5 rounded-3xl border border-bordo bg-white p-5 shadow-morbida">
            <label htmlFor="data" className="text-sm font-semibold text-fumo">
              Data preferita
            </label>
            <input
              id="data"
              type="date"
              value={dataPreferita}
              onChange={(e) => setDataPreferita(e.target.value)}
              className="mt-2 h-11 w-full rounded-2xl border border-bordo px-4 outline-none"
            />
          </div>

          <div className="mt-3 rounded-3xl border border-bordo bg-white p-5">
            <p className="text-sm font-semibold text-fumo">Riepilogo</p>
            <p className="mt-2 text-base font-semibold">{titolo}</p>
            <p className="mt-1 text-sm text-fumo">
              {attivita.find((a) => a.id === attivitaId)?.nome ??
                elencoCategorie.find((c) => c.id === categoriaId)?.nome}{" "}
              • {citta} • {preventivo || !budget ? "preventivo da concordare" : `${budget} €`}
            </p>
          </div>
        </>
      )}

      <div className="mt-5 flex gap-3">
        {passo > 0 && (
          <button
            type="button"
            onClick={() => setPasso(passo - 1)}
            className="h-14 w-28 rounded-2xl border border-bordo text-sm font-semibold"
          >
            Indietro
          </button>
        )}
        {passo < PASSI.length - 1 ? (
          <button
            type="button"
            onClick={() => setPasso(passo + 1)}
            disabled={!completo[passo]}
            className="h-14 flex-1 rounded-2xl bg-corallo font-semibold text-white shadow-corallo disabled:opacity-40"
          >
            Continua
          </button>
        ) : (
          <button
            type="button"
            onClick={pubblica}
            disabled={inCorso}
            className="h-14 flex-1 rounded-2xl bg-corallo font-semibold text-white shadow-corallo"
          >
            {prenotato ? "Invia la prenotazione" : "Pubblica richiesta"}
          </button>
        )}
      </div>

      {errore && <p className="mt-4 text-sm text-red-600">{errore}</p>}
    </Pagina>
  );
}
