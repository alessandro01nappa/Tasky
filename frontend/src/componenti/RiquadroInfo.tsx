import { Info } from "lucide-react";

export default function RiquadroInfo({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-2.5 rounded-3xl bg-pesca-tenue p-3.5">
      <Info className="mt-0.5 size-5 shrink-0 text-corallo" strokeWidth={1.75} />
      <p className="text-sm">{children}</p>
    </div>
  );
}
