import { useNavigate } from "react-router-dom";
import { salvaModalita } from "../lib/modalita";

type Props = {
  acceso: boolean;
};

/** Acceso si lavora, spento si cerca: le due parti dell'app sono separate. */
export default function InterruttoreModalita({ acceso }: Props) {
  const navigate = useNavigate();

  function cambia() {
    salvaModalita(acceso ? "cliente" : "lavoratore");
    // le pagine dei due lati non si mescolano: si riparte dalla home di quello scelto
    navigate("/");
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={acceso}
      onClick={cambia}
      className="flex w-20 flex-col items-center gap-1.5 md:w-auto md:flex-row-reverse md:gap-2.5"
    >
      <span
        className={`flex h-6 w-11 items-center rounded-full p-0.5 transition-colors ${
          acceso ? "bg-verde" : "bg-bordo"
        }`}
      >
        <span
          className={`size-5 rounded-full bg-white shadow-morbida transition-transform ${
            acceso ? "translate-x-5" : ""
          }`}
        />
      </span>
      <span
        className={`text-xs md:text-sm ${acceso ? "font-semibold text-verde" : "font-medium text-fumo"}`}
      >
        Lavoratore
      </span>
    </button>
  );
}
