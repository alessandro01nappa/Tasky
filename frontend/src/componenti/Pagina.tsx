// contenitore comune: colonna stretta su telefono, più larga da tablet in su.
// il padding basso serve a non finire sotto la barra, che su mobile sta in fondo.
export default function Pagina({
  larga = false,
  children,
}: {
  larga?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`mx-auto min-h-screen px-6 pt-7 pb-32 md:px-12 md:pt-24 md:pb-12 ${
        larga ? "max-w-md md:max-w-3xl lg:max-w-6xl" : "max-w-md md:max-w-2xl"
      }`}
    >
      {children}
    </div>
  );
}
