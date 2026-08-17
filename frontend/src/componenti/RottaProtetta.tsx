import { Navigate } from "react-router-dom";
import { leggiToken } from "../lib/sessione";

export default function RottaProtetta({ children }: { children: React.ReactNode }) {
  if (!leggiToken()) {
    return <Navigate to="/accesso" replace />;
  }
  return children;
}
