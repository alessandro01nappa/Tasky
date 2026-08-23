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
  Giardinaggio: Leaf,
  "Montaggi mobili": Hammer,
  "Traslochi e trasporti": Truck,
  "Manutenzioni e riparazioni": Wrench,
  Idraulica: Droplets,
  Elettricista: Zap,
  Imbianchino: Paintbrush,
  Falegnameria: Axe,
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
