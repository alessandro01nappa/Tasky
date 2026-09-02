import { Compass, LayoutDashboard, ClipboardList, Search, User } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import InterruttoreModalita from "./InterruttoreModalita";
import Logo from "./Logo";
import { useProfiloLavoratore, useSonoLavoratore } from "../lib/lavoratore";

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
  const lavoratore = useSonoLavoratore();
  const voci = lavoratore ? LAVORATORE : CLIENTE;
  const accento = lavoratore ? "text-verde" : "text-corallo";
  const puoCambiare = profilo?.stato === "APPROVATO";

  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-bordo bg-white md:top-0 md:bottom-auto md:border-t-0 md:border-b">
      <div className="mx-auto flex max-w-md justify-around py-3 md:max-w-7xl md:justify-between md:px-10 lg:px-12">
        <Link to="/" className="hidden items-center md:flex">
          <Logo className="h-8 w-auto" />
        </Link>
        <div className="flex flex-1 justify-around md:flex-none md:justify-end md:gap-8">
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

          {puoCambiare && <InterruttoreModalita acceso={lavoratore} />}
        </div>
      </div>
    </nav>
  );
}
