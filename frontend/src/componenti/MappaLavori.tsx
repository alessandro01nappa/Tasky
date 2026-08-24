import "leaflet/dist/leaflet.css";
import { DivIcon, latLngBounds, type LatLngBounds } from "leaflet";
import { CircleMarker, MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import { useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import type { Richiesta } from "../lib/api";

// Leaflet cerca le sue icone in una cartella che il bundler non conosce: gliele disegno io.
function segnaposto(quanti: number) {
  return new DivIcon({
    className: "",
    html: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="38" viewBox="0 0 28 38">
             <path d="M14 0C6.3 0 0 6.3 0 14c0 10 14 24 14 24s14-14 14-24c0-7.7-6.3-14-14-14z" fill="#f47c5c"/>
             <circle cx="14" cy="14" r="6.5" fill="#fff8f2"/>
             ${
               quanti > 1
                 ? `<text x="14" y="18" text-anchor="middle" font-family="Inter, sans-serif"
                          font-size="10" font-weight="700" fill="#f47c5c">${quanti}</text>`
                 : ""
             }
           </svg>`,
    iconSize: [28, 38],
    iconAnchor: [14, 38],
    popupAnchor: [0, -34],
  });
}

type Props = {
  richieste: Richiesta[];
  /** Da dove parte il lavoratore: se manca la mappa si centra sui lavori. */
  centro: [number, number] | null;
};

type Gruppo = { punto: [number, number]; richieste: Richiesta[] };

/**
 * La mappa viene creata prima che il contenitore abbia una larghezza, e con un
 * contenitore largo zero l'inquadratura finisce sul mondo intero. Invece di
 * indovinare il momento buono si sta a guardare: appena c'è una dimensione vera
 * si rimisura e si inquadra, una volta sola per non annullare gli spostamenti
 * fatti a mano.
 */
function Inquadra({ bordi }: { bordi: LatLngBounds }) {
  const mappa = useMap();

  useEffect(() => {
    let inquadrata = false;
    const sistema = () => {
      const contenitore = mappa.getContainer();
      if (contenitore.clientWidth === 0 || contenitore.clientHeight === 0) return;
      mappa.invalidateSize();
      if (!inquadrata) {
        mappa.fitBounds(bordi, { maxZoom: 15 });
        inquadrata = true;
      }
    };

    sistema();
    const osservatore = new ResizeObserver(sistema);
    osservatore.observe(mappa.getContainer());
    return () => osservatore.disconnect();
  }, [mappa, bordi]);

  return null;
}

export default function MappaLavori({ richieste, centro }: Props) {
  const gruppi = raggruppa(richieste);
  const punti: [number, number][] = gruppi.map((g) => g.punto);
  if (centro) punti.push(centro);
  const chiave = punti.join(";");

  // l'inquadratura la decidono i lavori: uno zoom fisso lascerebbe fuori i più lontani.
  // va ricordata, altrimenti a ogni render è un oggetto nuovo e Inquadra ripartirebbe all'infinito.
  const inquadratura = useMemo(
    () => (punti.length > 0 ? latLngBounds(punti).pad(0.25) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [chiave],
  );
  if (!inquadratura) return null;

  return (
    <div className="overflow-hidden rounded-3xl border border-bordo">
      <MapContainer
        bounds={inquadratura}
        maxZoom={15}
        scrollWheelZoom={false}
        className="h-72 w-full md:h-96"
      >
        <Inquadra bordi={inquadratura} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {centro && (
          <CircleMarker
            center={centro}
            radius={7}
            pathOptions={{ color: "#ffffff", weight: 2, fillColor: "#7aad91", fillOpacity: 1 }}
          >
            <Popup>La tua zona</Popup>
          </CircleMarker>
        )}
        {gruppi.map((gruppo) => (
          <Marker
            key={gruppo.punto.join()}
            position={gruppo.punto}
            icon={segnaposto(gruppo.richieste.length)}
          >
            <Popup>
              {gruppo.richieste.map((r) => (
                <span key={r.id} className="mb-1.5 block last:mb-0">
                  <Link to={`/richieste/${r.id}`} className="font-semibold text-corallo">
                    {r.titolo}
                  </Link>
                  <span className="block text-fumo">
                    {r.citta}
                    {r.distanzaKm !== null && ` • a ${r.distanzaKm} km`}
                  </span>
                </span>
              ))}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

/** Senza indirizzo un lavoro sta sul centro della sua città: molti finiscono sullo stesso punto. */
function raggruppa(richieste: Richiesta[]): Gruppo[] {
  const per = new Map<string, Gruppo>();
  for (const r of richieste) {
    if (r.latitudine === null || r.longitudine === null) continue;
    const chiave = `${r.latitudine},${r.longitudine}`;
    const gruppo = per.get(chiave);
    if (gruppo) {
      gruppo.richieste.push(r);
    } else {
      per.set(chiave, { punto: [r.latitudine, r.longitudine], richieste: [r] });
    }
  }
  return [...per.values()];
}
