import { Compass, LayoutDashboard, ClipboardList, Search, User } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useSonoLavoratore } from "../lib/lavoratore";

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
  // il design cambia solo accento ed etichette: verde quando lavori, corallo quando cerchi
  const lavoratore = useSonoLavoratore();
  const voci = lavoratore ? LAVORATORE : CLIENTE;
  const accento = lavoratore ? "text-verde" : "text-corallo";

  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-bordo bg-white md:top-0 md:bottom-auto md:border-t-0 md:border-b">
      <div className="mx-auto flex max-w-md justify-around py-3 md:max-w-3xl md:justify-end md:gap-8 md:px-12 lg:max-w-6xl">
        {voci.map(({ etichetta, percorso, Icona }) => {
          const attiva = pathname === percorso;
          return (
            <Link
              key={etichetta}
              to={percorso}
              className={`flex w-20 flex-col items-center gap-1.5 md:w-auto md:flex-row md:gap-2 ${
                attiva ? accento : "text-fumo"
              }`}
            >
              <Icona className="size-6 md:size-5" strokeWidth={attiva ? 2.25 : 1.75} />
              <span className={`text-xs md:text-sm ${attiva ? "font-semibold" : "font-medium"}`}>
                {etichetta}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
