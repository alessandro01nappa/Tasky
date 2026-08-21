// stato di caricamento di Esplora: stessa struttura, contenuti sostituiti da blocchi vuoti
export default function ScheletroHome() {
  return (
    <div className="animate-pulse">
      <div className="mt-5 h-26 rounded-3xl bg-sabbia" />

      <div className="mt-8 h-4.5 w-22 rounded-full bg-sabbia" />
      <div className="mt-3 grid grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i}>
            <div className="size-17 rounded-full border border-bordo bg-white" />
            <div className="mt-2 h-3 w-17 rounded-full bg-sabbia" />
          </div>
        ))}
      </div>

      <div className="mt-8 h-4.5 w-30 rounded-full bg-sabbia" />
      <div className="mt-3 flex flex-col gap-3">
        {[0, 1].map((i) => (
          <div key={i} className="rounded-3xl border border-bordo bg-white p-5">
            <div className="h-4.5 w-40 rounded-full bg-sabbia" />
            <div className="mt-2 h-3 w-30 rounded-full bg-sabbia" />
            <div className="mt-3 h-3 w-full rounded-full bg-sabbia" />
          </div>
        ))}
      </div>
    </div>
  );
}
