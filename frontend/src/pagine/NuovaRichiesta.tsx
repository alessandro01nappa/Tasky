import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import RiquadroInfo from "../componenti/RiquadroInfo";
import { categorie, creaRichiesta, elencoLavoratori, type Categoria, type Lavoratore } from "../lib/api";

export default function NuovaRichiesta() {
  const navigate = useNavigate();
  const [parametri] = useSearchParams();
  const fornitoreId = parametri.get("fornitore");
  const [prenotato, setPrenotato] = useState<Lavoratore | null>(null);
  const [elencoCategorie, setElencoCategorie] = useState<Categoria[]>([]);
  const [categoriaId, setCategoriaId] = useState<number | null>(null);
  const [titolo, setTitolo] = useState("");
  const [descrizione, setDescrizione] = useState("");
  const [citta, setCitta] = useState("");
  const [budget, setBudget] = useState("");
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
      .then((tutti) => {
        const trovato = tutti.find((l) => l.id === Number(fornitoreId)) ?? null;
        setPrenotato(trovato);
        if (trovato && trovato.categorie.length > 0) {
          setElencoCategorie((attuali) => {
            const suo = attuali.find((c) => trovato.categorie.includes(c.nome));
            if (suo) setCategoriaId(suo.id);
            return attuali;
          });
        }
      })
      .catch(() => setPrenotato(null));
  }, [fornitoreId]);

  async function invia(evento: React.FormEvent) {
    evento.preventDefault();
    if (categoriaId === null) {
      setErrore("Scegli una categoria");
      return;
    }
    setErrore("");
    setInCorso(true);
    try {
      const creata = await creaRichiesta({
        categoriaId,
        ...(prenotato ? { fornitoreId: prenotato.id } : {}),
        titolo,
        descrizione,
        citta,
        budget: budget ? Number(budget) : null,
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
    <div className="mx-auto min-h-screen max-w-md px-6 pt-7 pb-12">
      <h1 className="text-3xl font-bold">{prenotato ? "Prenota" : "Crea un annuncio"}</h1>
      <p className="mt-2 text-base text-fumo">
        {prenotato
          ? `La richiesta va solo a ${prenotato.nome}, che può accettarla o rifiutarla.`
          : "Descrivi cosa ti serve: i lavoratori della zona potranno candidarsi."}
      </p>

      {prenotato && (
        <div className="mt-5">
          <RiquadroInfo>
            Se {prenotato.nome.split(" ")[0]} rifiuta, la richiesta diventa pubblica e gli altri
            lavoratori potranno candidarsi.
          </RiquadroInfo>
        </div>
      )}

      <form onSubmit={invia} className="mt-5 flex flex-col gap-3 rounded-3xl border border-bordo bg-white p-4">
        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium text-fumo">Categoria</span>
          <div className="flex flex-wrap gap-2">
            {elencoCategorie.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategoriaId(c.id)}
                className={`h-9 rounded-full border px-4 text-sm font-semibold ${
                  categoriaId === c.id
                    ? "border-corallo bg-corallo text-white"
                    : "border-bordo bg-white text-fumo"
                }`}
              >
                {c.nome}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="titolo" className="text-xs font-medium text-fumo">
            Titolo
          </label>
          <input
            id="titolo"
            value={titolo}
            onChange={(e) => setTitolo(e.target.value)}
            required
            placeholder="Potatura siepe in giardino"
            className="h-11 rounded-2xl border border-bordo px-4 text-sm outline-none"
          />
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
            placeholder="Spiega il lavoro, le misure, cosa serve portare."
            className="rounded-2xl border border-bordo p-4 text-sm outline-none"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="citta" className="text-xs font-medium text-fumo">
            Città
          </label>
          <input
            id="citta"
            value={citta}
            onChange={(e) => setCitta(e.target.value)}
            required
            placeholder="Roma"
            className="h-11 rounded-2xl border border-bordo px-4 text-sm outline-none"
          />
        </div>

        <div className="flex gap-3">
          <div className="flex flex-1 flex-col gap-2">
            <label htmlFor="budget" className="text-xs font-medium text-fumo">
              Budget €
            </label>
            <input
              id="budget"
              type="number"
              min="0"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="120"
              className="h-11 w-full rounded-2xl border border-bordo px-4 text-sm outline-none"
            />
          </div>
          <div className="flex flex-1 flex-col gap-2">
            <label htmlFor="data" className="text-xs font-medium text-fumo">
              Data preferita
            </label>
            <input
              id="data"
              type="date"
              value={dataPreferita}
              onChange={(e) => setDataPreferita(e.target.value)}
              className="h-11 w-full rounded-2xl border border-bordo px-4 text-sm outline-none"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={inCorso}
          className="h-12 rounded-2xl bg-corallo text-sm font-semibold text-white"
        >
          {prenotato ? "Invia la prenotazione" : "Pubblica richiesta"}
        </button>

        <button
          type="button"
          onClick={() => navigate("/")}
          className="h-12 rounded-2xl border border-bordo text-sm font-semibold"
        >
          Annulla
        </button>

        {errore && <p className="text-sm text-red-600">{errore}</p>}
      </form>
    </div>
  );
}
