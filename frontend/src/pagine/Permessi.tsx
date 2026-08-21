import { Bell, Image, MapPin } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import RiquadroInfo from "../componenti/RiquadroInfo";

type Stato = "sconosciuto" | "concesso" | "negato" | "da chiedere";

const ETICHETTE: Record<Stato, string> = {
  sconosciuto: "",
  concesso: "consentito",
  negato: "negato",
  "da chiedere": "da consentire",
};

async function statoPermesso(nome: PermissionName): Promise<Stato> {
  if (!navigator.permissions) return "sconosciuto";
  try {
    const esito = await navigator.permissions.query({ name: nome });
    if (esito.state === "granted") return "concesso";
    if (esito.state === "denied") return "negato";
    return "da chiedere";
  } catch {
    return "sconosciuto";
  }
}

export default function Permessi() {
  const navigate = useNavigate();
  const [posizione, setPosizione] = useState<Stato>("sconosciuto");
  const [notifiche, setNotifiche] = useState<Stato>("sconosciuto");
  const [inCorso, setInCorso] = useState(false);

  useEffect(() => {
    statoPermesso("geolocation" as PermissionName).then(setPosizione);
    statoPermesso("notifications" as PermissionName).then(setNotifiche);
  }, []);

  async function consenti() {
    setInCorso(true);

    if ("Notification" in window && Notification.permission === "default") {
      try {
        await Notification.requestPermission();
      } catch {
        // il browser può rifiutare la richiesta: si prosegue comunque
      }
    }

    if (navigator.geolocation && posizione !== "negato") {
      await new Promise<void>((risolvi) =>
        navigator.geolocation.getCurrentPosition(
          () => risolvi(),
          () => risolvi(),
          { timeout: 8000 },
        ),
      );
    }

    navigate("/");
  }

  const permessi = [
    {
      titolo: "Posizione attuale",
      testo:
        "Serve per trovare lavori, richieste e professionisti nella tua zona senza dover inserire ogni volta l’indirizzo.",
      sfondo: "bg-pesca",
      colore: "text-corallo",
      Icona: MapPin,
      stato: posizione,
    },
    {
      titolo: "Notifiche importanti",
      testo:
        "Ti avvisiamo quando ricevi candidature, messaggi, conferme o aggiornamenti su prenotazioni e pagamenti.",
      sfondo: "bg-verde-chiaro",
      colore: "text-verde",
      Icona: Bell,
      stato: notifiche,
    },
    {
      titolo: "Foto e allegati",
      testo:
        "Solo quando ti servono: per caricare immagini del problema, documenti o portfolio dei lavori svolti.",
      sfondo: "bg-miele",
      colore: "text-ambra",
      Icona: Image,
      // il browser chiede il permesso al momento del caricamento, non prima
      stato: "sconosciuto" as Stato,
    },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="absolute -top-10 -right-16 size-70 rounded-full bg-corallo/10" />

      <div className="relative mx-auto flex max-w-md flex-col gap-5 px-6 pt-17 pb-12">
        <div>
          <h1 className="text-3xl font-bold">Personalizziamo la tua esperienza</h1>
          <p className="mt-2.5 text-base text-fumo">
            Per mostrarti richieste e professionisti davvero vicini, abbiamo bisogno di pochi
            permessi essenziali.
          </p>
        </div>

        <div className="flex flex-col gap-3.5">
          {permessi.map((permesso) => (
            <div
              key={permesso.titolo}
              className="flex gap-3.5 rounded-3xl border border-bordo bg-white p-4"
            >
              <div
                className={`flex size-12 shrink-0 items-center justify-center rounded-2xl ${permesso.sfondo}`}
              >
                <permesso.Icona className={`size-6 ${permesso.colore}`} strokeWidth={1.75} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-base font-semibold">{permesso.titolo}</p>
                  {permesso.stato !== "sconosciuto" && (
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        permesso.stato === "concesso"
                          ? "bg-verde-chiaro text-verde"
                          : "bg-sabbia text-fumo"
                      }`}
                    >
                      {ETICHETTE[permesso.stato]}
                    </span>
                  )}
                </div>
                <p className="mt-1.5 text-sm text-fumo">{permesso.testo}</p>
              </div>
            </div>
          ))}
        </div>

        <RiquadroInfo>
          Potrai modificare tutto in qualsiasi momento dalle impostazioni del profilo.
        </RiquadroInfo>

        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={consenti}
            disabled={inCorso}
            className="h-12 rounded-2xl bg-corallo text-sm font-semibold text-white"
          >
            Consenti e continua
          </button>
          <button
            type="button"
            onClick={() => navigate("/")}
            className="h-11 rounded-2xl border border-bordo text-sm font-semibold"
          >
            Decidi più tardi
          </button>
        </div>
      </div>
    </div>
  );
}
