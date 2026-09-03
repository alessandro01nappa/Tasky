import { ImageOff } from "lucide-react";
import { useEffect, useState } from "react";
import { anteprimaFoto } from "../lib/api";

type Props = {
  id: number;
  className?: string;
  onClick?: () => void;
};

/**
 * Un <img src> semplice non basta: il contenuto vuole il token nell'intestazione.
 * Si scarica a mano e si mostra da un URL locale, che si dimentica quando il
 * componente sparisce.
 */
export default function FotoAutenticata({ id, className, onClick }: Props) {
  const [url, setUrl] = useState<string | null>(null);
  const [fallita, setFallita] = useState(false);

  useEffect(() => {
    let annullato = false;
    setFallita(false);
    anteprimaFoto(id)
      .then((u) => !annullato && setUrl(u))
      .catch(() => !annullato && setFallita(true));
    return () => {
      annullato = true;
      // revocarlo troppo presto romperebbe l'immagine mentre è ancora a schermo
    };
  }, [id]);

  // l'URL locale non serve più quando questa istanza ne prende uno nuovo o sparisce
  useEffect(() => {
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [url]);

  if (fallita) {
    return (
      <div className={`flex items-center justify-center bg-sabbia text-fumo ${className}`}>
        <ImageOff className="size-5" strokeWidth={1.75} />
      </div>
    );
  }

  if (!url) {
    return <div className={`animate-pulse bg-sabbia ${className}`} />;
  }

  return (
    <img
      src={url}
      alt=""
      onClick={onClick}
      className={`object-cover ${className} ${onClick ? "cursor-pointer" : ""}`}
    />
  );
}
