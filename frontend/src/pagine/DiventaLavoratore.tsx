import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import RiquadroInfo from "../componenti/RiquadroInfo";
import {
  aggiornaProfiloFornitore,
  categorie,
  creaProfiloFornitore,
  type Categoria,
  type TipoLavoratore,
} from "../lib/api";
import { scordaProfiloLavoratore, useProfiloLavoratore } from "../lib/lavoratore";

export default function DiventaLavoratore() {
  const navigate = useNavigate();
  const profilo = useProfiloLavoratore();
  const modifica = profilo != null;
  const [elencoCategorie, setElencoCategorie] = useState<Categoria[]>([]);
  const [scelte, setScelte] = useState<number[]>([]);
  const [tipo, setTipo] = useState<TipoLavoratore>("PROFESSIONISTA");
  const [descrizione, setDescrizione] = useState("");
  const [zonaOperativa, setZonaOperativa] = useState("");
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
    setTipo(profilo.tipo);
  }, [profilo]);

  // il profilo salva i nomi delle categorie, il form lavora sugli id
  useEffect(() => {
    if (!profilo || elencoCategorie.length === 0) return;
    setScelte(
      elencoCategorie.filter((c) => profilo.categorie.includes(c.nome)).map((c) => c.id),
    );
  }, [profilo, elencoCategorie]);

  function alterna(id: number) {
    setScelte((attuali) =>
      attuali.includes(id) ? attuali.filter((x) => x !== id) : [...attuali, id],
    );
  }

  async function invia(evento: React.FormEvent) {
    evento.preventDefault();
    setErrore("");
    setInCorso(true);
    try {
      const dati = { descrizione, zonaOperativa, categorieIds: scelte, tipo };
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
    <div className="mx-auto min-h-screen max-w-md px-6 pt-7 pb-12">
      <h1 className="text-3xl font-bold">{modifica ? "Il tuo profilo lavoratore" : "Diventa lavoratore"}</h1>
      <p className="mt-2 text-base text-fumo">
        {modifica
          ? "Aggiorna descrizione, zona e categorie del tuo profilo."
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

        <div className="flex flex-col gap-2">
          <label htmlFor="zona" className="text-xs font-medium text-fumo">
            Zona operativa
          </label>
          <input
            id="zona"
            value={zonaOperativa}
            onChange={(e) => setZonaOperativa(e.target.value)}
            required
            placeholder="Roma sud"
            className="h-11 rounded-2xl border border-bordo px-4 text-sm outline-none"
          />
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium text-fumo">Categorie che segui</span>
          <div className="flex flex-wrap gap-2">
            {elencoCategorie.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => alterna(c.id)}
                className={`h-9 rounded-full border px-4 text-sm font-semibold ${
                  scelte.includes(c.id)
                    ? "border-corallo bg-corallo text-white"
                    : "border-bordo bg-white text-fumo"
                }`}
              >
                {c.nome}
              </button>
            ))}
          </div>
        </div>

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

      {!modifica && (
        <div className="mt-5">
          <RiquadroInfo>
            L'approvazione oggi è manuale: dopo l'invio il profilo resta in attesa finché non viene
            approvato.
          </RiquadroInfo>
        </div>
      )}
    </div>
  );
}
