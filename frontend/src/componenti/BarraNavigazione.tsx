import { Compass, LayoutDashboard, ClipboardList, Search, User } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useProfiloLavoratore } from "../lib/lavoratore";

const CLIENTE = [
  { etichetta: "Esplora", percorso: "/", Icona: Compass },
  { etichetta: "Richieste", percorso: "/richieste", Icona: ClipboardList },
  { etichetta: "Profilo", percorso: "/profilo", Icona: User },
];

const LAVORATORE = [
  { etichetta: "Dashboard", percorso: "/lavoratore", Icona: LayoutDashboard },
  { etichetta: "Trova lavori", percorso: "/", Icona: Search },
  { etichetta: "Profilo", percorso: "/profilo", Icona: User },
];

export default function BarraNavigazione() {
  const { pathname } = useLocation();
  const profilo = useProfiloLavoratore();

  // il design cambia solo accento ed etichette: verde quando lavori, corallo quando cerchi
  const lavoratore = profilo?.stato === "APPROVATO";
  const voci = lavoratore ? LAVORATORE : CLIENTE;
  const accento = lavoratore ? "text-verde" : "text-corallo";

  return (
    <nav className="fixed inset-x-0 bottom-0 border-t border-bordo bg-white">
      <div className="mx-auto flex max-w-md justify-around py-3">
        {voci.map(({ etichetta, percorso, Icona }) => {
          const attiva = pathname === percorso;
          return (
            <Link
              key={etichetta}
              to={percorso}
              className={`flex w-20 flex-col items-center gap-1.5 ${attiva ? accento : "text-fumo"}`}
            >
              <Icona className="size-6" strokeWidth={attiva ? 2.25 : 1.75} />
              <span className={`text-xs ${attiva ? "font-semibold" : "font-medium"}`}>
                {etichetta}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
