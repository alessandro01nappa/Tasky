import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

type Props = {
  id: string;
  etichetta: string;
  valore: string;
  onCambia: (valore: string) => void;
  minLength?: number;
};

export default function CampoPassword({ id, etichetta, valore, onCambia, minLength }: Props) {
  const [visibile, setVisibile] = useState(false);

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-xs font-medium text-fumo">
        {etichetta}
      </label>
      <div className="flex h-11 items-center gap-2 rounded-2xl border border-bordo px-4">
        <input
          id={id}
          type={visibile ? "text" : "password"}
          placeholder={etichetta}
          value={valore}
          onChange={(e) => onCambia(e.target.value)}
          required
          minLength={minLength}
          className="min-w-0 flex-1 text-sm outline-none"
        />
        <button
          type="button"
          onClick={() => setVisibile(!visibile)}
          aria-label={visibile ? "Nascondi la password" : "Mostra la password"}
          className="shrink-0 text-fumo"
        >
          {visibile ? <EyeOff className="size-5" strokeWidth={1.75} /> : <Eye className="size-5" strokeWidth={1.75} />}
        </button>
      </div>
    </div>
  );
}
