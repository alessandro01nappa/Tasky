// stato di caricamento della dashboard: stessa struttura, contenuti sostituiti da blocchi vuoti
export default function ScheletroDashboard() {
  return (
    <div className="animate-pulse">
      <div className="mt-5 grid grid-cols-3 gap-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-3xl border border-bordo bg-white p-4">
            <div className="h-6 w-10 rounded-full bg-sabbia" />
            <div className="mt-2 h-3 w-16 rounded-full bg-sabbia" />
          </div>
        ))}
      </div>

      <div className="mt-8 h-4.5 w-32 rounded-full bg-sabbia" />
      <div className="mt-3 rounded-3xl border border-bordo bg-white p-5">
        <div className="h-4.5 w-40 rounded-full bg-sabbia" />
        <div className="mt-2 h-3 w-48 rounded-full bg-sabbia" />
        <div className="mt-4 flex gap-2.5">
          <div className="h-12 w-28 rounded-2xl bg-sabbia" />
          <div className="h-12 flex-1 rounded-2xl bg-sabbia" />
        </div>
      </div>

      <div className="mt-8 h-4.5 w-28 rounded-full bg-sabbia" />
      <div className="mt-3 flex flex-col gap-3">
        {[0, 1].map((i) => (
          <div key={i} className="rounded-3xl border border-bordo bg-white p-5">
            <div className="h-4.5 w-44 rounded-full bg-sabbia" />
            <div className="mt-2 h-3 w-28 rounded-full bg-sabbia" />
          </div>
        ))}
      </div>
    </div>
  );
}
