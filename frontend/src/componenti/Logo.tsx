import logoBianco from "../assets/logo-bianco.svg";
import logoNero from "../assets/logo-nero.svg";

// due file distinti: il nero sui fondi chiari, il bianco sul corallo
export default function Logo({
  variante = "nero",
  className,
}: {
  variante?: "nero" | "bianco";
  className?: string;
}) {
  return (
    <img
      src={variante === "bianco" ? logoBianco : logoNero}
      alt="Tasky"
      className={className}
    />
  );
}
