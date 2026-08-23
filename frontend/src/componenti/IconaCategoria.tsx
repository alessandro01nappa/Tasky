import {
  Axe,
  Baby,
  Flame,
  Grid2x2,
  Hammer,
  Droplets,
  Laptop,
  Leaf,
  Paintbrush,
  PawPrint,
  SprayCan,
  Tag,
  Trash2,
  WashingMachine,
  Truck,
  Wrench,
  Zap,
} from "lucide-react";

// le categorie arrivano dal database: associo per nome, con un simbolo di riserva
const PER_NOME: Record<string, typeof Tag> = {
  Pulizie: SprayCan,
  "Giardino ed esterni": Leaf,
  "Montaggi mobili": Hammer,
  "Traslochi e trasporti": Truck,
  "Riparazioni e piccoli lavori": Wrench,
  "Impianti idraulici": Droplets,
  "Impianti elettrici": Zap,
  "Imbiancatura e verniciatura": Paintbrush,
  "Lavori in legno": Axe,
  "Sgomberi e smaltimento": Trash2,
  "Informatica e tecnologia": Laptop,
  "Cura animali": PawPrint,
  "Baby sitting": Baby,
  "Riparazione elettrodomestici": WashingMachine,
  "Piastrelle e pavimenti": Grid2x2,
  "Camini e canne fumarie": Flame,
};

export default function IconaCategoria({ nome, className }: { nome: string; className?: string }) {
  const Icona = PER_NOME[nome] ?? Tag;
  return <Icona className={className} strokeWidth={1.75} />;
}
