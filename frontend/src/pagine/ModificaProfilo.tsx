import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import CampoLuogo from "../componenti/CampoLuogo";
import Pagina from "../componenti/Pagina";
import { aggiornaIo, io, type Luogo } from "../lib/api";
import { salvaDove } from "../lib/dove";

export default function ModificaProfilo() {
  const navigate = useNavigate();
  const [nomeCompleto, setNomeCompleto] = useState("");
  const [telefono, setTelefono] = useState("");
  const [citta, setCitta] = useState<Luogo | null>(null);
  const [email, setEmail] = useState("");
  const [errore, setErrore] = useState("");
  const [inCorso, setInCorso] = useState(false);

  useEffect(() => {
    io()
      .then((utente) => {
        setEmail(utente.email);
        setNomeCompleto(utente.nomeCompleto);
        setTelefono(utente.telefono ?? "");
      })
      .catch((e) => setErrore(e instanceof Error ? e.message : "Errore inatteso"));
  }, []);

  async function salva(evento: React.FormEvent) {
    evento.preventDefault();
    setErrore("");
    setInCorso(true);
    try {
      await aggiornaIo({ nomeCompleto, telefono, citta: citta?.citta ?? "" });
      // la città del profilo è anche il punto da cui si cerca: si aggiornano insieme
      if (citta) salvaDove(citta);
      navigate("/profilo");
    } catch (e) {
      setErrore(e instanceof Error ? e.message : "Errore inatteso");
    } finally {
      setInCorso(false);
    }
  }

  return (
    <Pagina>
      <Link to="/profilo" className="flex items-center gap-1.5 text-sm font-semibold text-corallo">
        <ArrowLeft className="size-4" strokeWidth={2.25} />
        Torna al profilo
      </Link>

      <h1 className="mt-4 text-3xl font-bold">I tuoi dati</h1>
      <p className="mt-1 text-sm text-fumo">L'email resta {email}: è con quella che entri.</p>

      <form
        onSubmit={salva}
        className="mt-5 flex flex-col gap-4 rounded-3xl border border-bordo bg-white p-5"
      >
        <div className="flex flex-col gap-2">
          <label htmlFor="nome" className="text-sm font-semibold text-fumo">
            Nome e cognome
          </label>
          <input
            id="nome"
            value={nomeCompleto}
            onChange={(e) => setNomeCompleto(e.target.value)}
            required
            className="h-11 rounded-2xl border border-bordo px-4 text-sm outline-none"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="telefono" className="text-sm font-semibold text-fumo">
            Telefono
          </label>
          <input
            id="telefono"
            type="tel"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            placeholder="Facoltativo"
            className="h-11 rounded-2xl border border-bordo px-4 text-sm outline-none"
          />
        </div>

        <CampoLuogo
          etichetta="Città"
          aiuto="È il punto da cui parti quando cerchi un Tasker."
          segnaposto="Roma, Milano…"
          scelto={citta}
          onScelto={setCitta}
        />

        <button
          type="submit"
          disabled={inCorso}
          className="h-12 rounded-2xl bg-corallo text-sm font-semibold text-white disabled:opacity-40"
        >
          Salva
        </button>

        {errore && <p className="text-sm text-red-600">{errore}</p>}
      </form>
    </Pagina>
  );
}
