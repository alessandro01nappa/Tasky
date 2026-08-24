import { Navigate } from "react-router-dom";
import { useSonoLavoratore } from "../lib/lavoratore";

type Props = {
  /** true = pagina del lato Tasker, false = pagina del lato cliente. */
  lavoratore: boolean;
  children: React.ReactNode;
};

/**
 * I due lati sono separati anche via indirizzo: scrivere /lavoratore da cliente
 * apriva una pagina che non c'entra niente con la barra che si ha sotto.
 */
export default function SoloModalita({ lavoratore, children }: Props) {
  const sonoLavoratore = useSonoLavoratore();
  if (sonoLavoratore !== lavoratore) {
    return <Navigate to="/" replace />;
  }
  return children;
}
