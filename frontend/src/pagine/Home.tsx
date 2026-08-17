import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { categorie, io, type Categoria } from "../lib/api";
import { cancellaToken } from "../lib/sessione";

export default function Home() {
  const navigate = useNavigate();
  const [emailUtente, setEmailUtente] = useState("");
  const [elenco, setElenco] = useState<Categoria[]>([]);
  const [errore, setErrore] = useState("");

  useEffect(() => {
    Promise.all([io(), categorie()])
      .then(([email, categorieTrovate]) => {
        setEmailUtente(email);
        setElenco(categorieTrovate);
      })
      .catch((e) => setErrore(e instanceof Error ? e.message : "Errore inatteso"));
  }, []);

  function esci() {
    cancellaToken();
    navigate("/accesso");
  }

  return (
    <div className="mx-auto max-w-sm p-4">
      <h1 className="mb-2 text-xl font-bold">Tasky</h1>
      <p className="mb-4">Accesso come {emailUtente || "..."}</p>

      <h2 className="mb-2 font-bold">Categorie</h2>
      <ul className="mb-4 list-disc pl-5">
        {elenco.map((categoria) => (
          <li key={categoria.id}>{categoria.nome}</li>
        ))}
      </ul>

      {errore && <p className="mb-4 text-red-600">{errore}</p>}

      <button onClick={esci} className="border px-3 py-1">
        Esci
      </button>
    </div>
  );
}
