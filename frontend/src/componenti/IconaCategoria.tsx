import {
  Accessibility,
  Axe,
  Baby,
  GraduationCap,
  Hammer,
  Droplets,
  Laptop,
  Leaf,
  Paintbrush,
  PawPrint,
  ShoppingCart,
  SprayCan,
  Tag,
  Trash2,
  Truck,
  Wrench,
  HeartHandshake,
  Zap,
} from "lucide-react";

// le categorie arrivano dal database: associo per nome, con un simbolo di riserva
const PER_NOME: Record<string, typeof Tag> = {
  Pulizie: SprayCan,
  Giardinaggio: Leaf,
  "Montaggi mobili": Hammer,
  "Traslochi e trasporti": Truck,
  "Manutenzioni e riparazioni": Wrench,
  "Assistenza pratica": HeartHandshake,
  Idraulica: Droplets,
  Elettricista: Zap,
  Imbianchino: Paintbrush,
  Falegnameria: Axe,
  "Sgomberi e smaltimento": Trash2,
  "Informatica e tecnologia": Laptop,
  "Spesa e commissioni": ShoppingCart,
  "Cura animali": PawPrint,
  "Assistenza anziani": Accessibility,
  "Baby sitting": Baby,
  "Lezioni private": GraduationCap,
};

export default function IconaCategoria({ nome, className }: { nome: string; className?: string }) {
  const Icona = PER_NOME[nome] ?? Tag;
  return <Icona className={className} strokeWidth={1.75} />;
}
