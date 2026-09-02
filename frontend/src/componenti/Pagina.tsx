export default function Pagina({
  larga = false,
  children,
}: {
  larga?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`mx-auto min-h-screen px-6 pt-7 pb-32 md:px-10 md:pt-20 md:pb-12 lg:px-12 ${
        larga ? "max-w-md md:max-w-4xl lg:max-w-7xl" : "max-w-md md:max-w-3xl lg:max-w-6xl"
      }`}
    >
      {children}
    </div>
  );
}
