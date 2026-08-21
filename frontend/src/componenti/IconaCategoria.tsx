import { Hammer, Leaf, SprayCan, Truck, Wrench, HeartHandshake, Tag } from "lucide-react";

// le categorie arrivano dal database: associo per nome, con un simbolo di riserva
const PER_NOME: Record<string, typeof Tag> = {
  Pulizie: SprayCan,
  Giardinaggio: Leaf,
  "Montaggi mobili": Hammer,
  "Traslochi e trasporti": Truck,
  "Manutenzioni e riparazioni": Wrench,
  "Assistenza pratica": HeartHandshake,
};

export default function IconaCategoria({ nome, className }: { nome: string; className?: string }) {
  const Icona = PER_NOME[nome] ?? Tag;
  return <Icona className={className} strokeWidth={1.75} />;
}
