import { Check } from "lucide-react";
import CampoLuogo from "../componenti/CampoLuogo";
import TariffaCategoria from "../componenti/TariffaCategoria";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import RiquadroInfo from "../componenti/RiquadroInfo";
import Pagina from "../componenti/Pagina";
import {
  aggiornaProfiloFornitore,
  attivitaDiCategoria,
  categorie,
  creaProfiloFornitore,
  type Attivita,
  type Categoria,
  type Luogo,
  type TipoLavoratore,
} from "../lib/api";
import { scordaProfiloLavoratore, useProfiloLavoratore } from "../lib/lavoratore";

export default function DiventaLavoratore() {
  const navigate = useNavigate();
  const profilo = useProfiloLavoratore();
  const modifica = profilo != null;
  const [elencoCategorie, setElencoCategorie] = useState<Categoria[]>([]);
  const [categoriaAperta, setCategoriaAperta] = useState<number | null>(null);
  const [attivitaAperte, setAttivitaAperte] = useState<Attivita[]>([]);
  // i lavori scelti, con il nome accanto per poterli mostrare senza ricaricare
  const [scelte, setScelte] = useState<Attivita[]>([]);
  const [tipo, setTipo] = useState<TipoLavoratore>("PROFESSIONISTA");
  // una tariffa per categoria, indicizzata sull'id della categoria
  const [tariffe, setTariffe] = useState<Record<number, string>>({});
  const [termini, setTermini] = useState(false);
  const [descrizione, setDescrizione] = useState("");
  const [zonaOperativa, setZonaOperativa] = useState("");
  const [luogoZona, setLuogoZona] = useState<Luogo | null>(null);
  const [errore, setErrore] = useState("");
  const [inCorso, setInCorso] = useState(false);

  useEffect(() => {
    categorie()
      .then(setElencoCategorie)
      .catch((e) => setErrore(e instanceof Error ? e.message : "Errore inatteso"));
  }, []);

  useEffect(() => {
    if (!profilo) return;
    setDescrizione(profilo.descrizione);
    setZonaOperativa(profilo.zonaOperativa);
    if (profilo.latitudine != null && profilo.longitudine != null) {
      setLuogoZona({
        latitudine: profilo.latitudine,
        longitudine: profilo.longitudine,
        nome: profilo.zonaOperativa,
        via: null,
        civico: null,
        indirizzo: profilo.zonaOperativa,
        citta: profilo.zonaOperativa,
      });
    }
    setTipo(profilo.tipo);
    setTariffe(
      Object.fromEntries(profilo.tariffe.map((t) => [t.categoriaId, String(t.tariffaOraria)])),
    );
    setTermini(profilo.terminiAccettati);
  }, [profilo]);

  // il profilo salva i nomi dei lavori: risalgo agli id nelle categorie che lo riguardano
  useEffect(() => {
    if (!profilo || elencoCategorie.length === 0 || profilo.attivita.length === 0) return;
    const sue = elencoCategorie.filter((c) => profilo.categorie.includes(c.nome));
    Promise.all(sue.map((c) => attivitaDiCategoria(c.id)))
      .then((gruppi) =>
        setScelte(gruppi.flat().filter((a) => profilo.attivita.includes(a.nome))),
      )
      .catch(() => setScelte([]));
  }, [profilo, elencoCategorie]);

  useEffect(() => {
    if (categoriaAperta === null) return;
    attivitaDiCategoria(categoriaAperta)
      .then(setAttivitaAperte)
      .catch(() => setAttivitaAperte([]));
  }, [categoriaAperta]);

  function alterna(lavoro: Attivita) {
    setScelte((attuali) =>
      attuali.some((a) => a.id === lavoro.id)
        ? attuali.filter((a) => a.id !== lavoro.id)
        : [...attuali, lavoro],
    );
  }

  // le categorie coperte derivano dai lavori scelti, come fa il backend
  const categorieCoperte = elencoCategorie.filter((c) =>
    scelte.some((a) => a.categoriaId === c.id),
  );

  // le stesse condizioni che il backend usa per approvare
  const mancanti = [
    categorieCoperte.every((c) => tariffe[c.id]) ? null : "una tariffa per ogni categoria",
    scelte.length > 0 ? null : "almeno un lavoro",
    zonaOperativa.trim() !== "" ? null : "la zona in cui lavori",
    termini ? null : "l'accettazione dei termini",
  ].filter((x): x is string => x !== null);

  async function invia(evento: React.FormEvent) {
    evento.preventDefault();
    setErrore("");
    setInCorso(true);
    try {
      const dati = {
        descrizione,
        zonaOperativa,
        attivitaIds: scelte.map((a) => a.id),
        tipo,
        tariffe: categorieCoperte
          .filter((c) => tariffe[c.id])
          .map((c) => ({ categoriaId: c.id, tariffaOraria: Number(tariffe[c.id]) })),
        terminiAccettati: termini,
      };
      if (modifica) {
        await aggiornaProfiloFornitore(dati);
      } else {
        await creaProfiloFornitore(dati);
      }
      scordaProfiloLavoratore();
      navigate("/profilo");
    } catch (e) {
      setErrore(e instanceof Error ? e.message : "Errore inatteso");
    } finally {
      setInCorso(false);
    }
  }

  return (
    <Pagina>
      <h1 className="text-3xl font-bold">{modifica ? "Il tuo profilo lavoratore" : "Diventa lavoratore"}</h1>
      <p className="mt-2 text-base text-fumo">
        {modifica
          ? "Aggiorna descrizione, zona e lavori che svolgi."
          : "Racconta cosa sai fare e dove lavori. Il profilo va approvato prima di poterti candidare."}
      </p>

      <form onSubmit={invia} className="mt-5 flex flex-col gap-3 rounded-3xl border border-bordo bg-white p-4">
        <p className="text-xl font-semibold">Il tuo profilo</p>

        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium text-fumo">Come lavori</span>
          <div className="flex gap-2">
            {(
              [
                { valore: "PROFESSIONISTA", etichetta: "Professionista" },
                { valore: "HOBBISTA", etichetta: "Hobbista" },
              ] as const
            ).map((voce) => (
              <button
                key={voce.valore}
                type="button"
                onClick={() => setTipo(voce.valore)}
                className={`h-9 rounded-full border px-4 text-sm font-semibold ${
                  tipo === voce.valore
                    ? "border-corallo bg-corallo text-white"
                    : "border-bordo bg-white text-fumo"
                }`}
              >
                {voce.etichetta}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="descrizione" className="text-xs font-medium text-fumo">
            Descrizione
          </label>
          <textarea
            id="descrizione"
            value={descrizione}
            onChange={(e) => setDescrizione(e.target.value)}
            required
            rows={4}
            placeholder="Esperienza, attrezzatura, tipo di lavori che segui."
            className="rounded-2xl border border-bordo p-4 text-sm outline-none"
          />
        </div>


        <CampoLuogo
          etichetta="Zona operativa"
          aiuto="Il comune da cui parti: serve a misurare quanto distano i lavori."
          segnaposto="Ciampino"
          scelto={luogoZona}
          onScelto={(luogo) => {
            setLuogoZona(luogo);
            setZonaOperativa(luogo?.citta ?? "");
          }}
        />

        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium text-fumo">Che lavori svolgi</span>

          {scelte.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {scelte.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => alterna(a)}
                  className="h-9 rounded-full border border-corallo bg-corallo px-4 text-sm font-semibold text-white"
                >
                  {a.nome} ×
                </button>
              ))}
            </div>
          )}

          <p className="text-xs text-fumo">
            Apri una categoria e scegli i lavori che sai fare. Le categorie del tuo profilo si
            ricavano da questi.
          </p>

          <div className="flex flex-wrap gap-2">
            {elencoCategorie.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategoriaAperta(categoriaAperta === c.id ? null : c.id)}
                className={`h-9 rounded-full border px-4 text-sm font-semibold ${
                  categoriaAperta === c.id
                    ? "border-inchiostro bg-inchiostro text-white"
                    : "border-bordo bg-white text-fumo"
                }`}
              >
                {c.nome}
              </button>
            ))}
          </div>

          {categoriaAperta !== null && attivitaAperte.length > 0 && (
            <div className="flex flex-wrap gap-2 rounded-2xl bg-pesca-tenue p-3">
              {attivitaAperte.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => alterna(a)}
                  className={`h-9 rounded-full border px-4 text-sm font-semibold ${
                    scelte.some((x) => x.id === a.id)
                      ? "border-corallo bg-corallo text-white"
                      : "border-bordo bg-white text-fumo"
                  }`}
                >
                  {a.nome}
                </button>
              ))}
            </div>
          )}
        </div>

        {categorieCoperte.length > 0 && (
          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium text-fumo">
              Quanto chiedi, categoria per categoria
            </span>
            {categorieCoperte.map((c) => (
              <TariffaCategoria
                key={c.id}
                categoriaId={c.id}
                categoria={c.nome}
                valore={tariffe[c.id] ?? ""}
                onCambia={(v) => setTariffe((attuali) => ({ ...attuali, [c.id]: v }))}
              />
            ))}
          </div>
        )}

        <label className="flex items-center gap-2.5 text-sm text-fumo">
          <span className="relative flex size-5 shrink-0 items-center justify-center">
            <input
              type="checkbox"
              checked={termini}
              onChange={(e) => setTermini(e.target.checked)}
              className="size-5 appearance-none rounded-md border border-bordo bg-white checked:border-verde checked:bg-verde"
            />
            {termini && (
              <Check className="pointer-events-none absolute size-3.5 text-white" strokeWidth={3} />
            )}
          </span>
          Accetto termini e condizioni del servizio.
        </label>

        <button
          type="submit"
          disabled={inCorso}
          className="h-12 rounded-2xl bg-corallo text-sm font-semibold text-white"
        >
          {modifica ? "Salva modifiche" : "Crea profilo lavoratore"}
        </button>

        <button
          type="button"
          onClick={() => navigate("/profilo")}
          className="h-12 rounded-2xl border border-bordo text-sm font-semibold"
        >
          Annulla
        </button>

        {errore && <p className="text-sm text-red-600">{errore}</p>}
      </form>

      <div className="mt-5">
        {mancanti.length === 0 ? (
          <RiquadroInfo>
            Il profilo è completo: appena salvi potrai candidarti alle richieste.
          </RiquadroInfo>
        ) : (
          <RiquadroInfo>
            Per candidarti serve ancora: {mancanti.join(", ")}. Finché manca qualcosa il profilo
            resta in attesa.
          </RiquadroInfo>
        )}
      </div>
    </Pagina>
  );
}
