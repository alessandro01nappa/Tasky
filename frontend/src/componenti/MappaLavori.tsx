import "leaflet/dist/leaflet.css";
import { Icon, latLngBounds } from "leaflet";
import { CircleMarker, MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import { Link } from "react-router-dom";
import type { Richiesta } from "../lib/api";

// Leaflet cerca le sue icone in una cartella che il bundler non conosce: gliela disegno io.
const SEGNAPOSTO = new Icon({
  iconUrl:
    "data:image/svg+xml;base64," +
    btoa(
      `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="38" viewBox="0 0 28 38">
         <path d="M14 0C6.3 0 0 6.3 0 14c0 10 14 24 14 24s14-14 14-24c0-7.7-6.3-14-14-14z" fill="#f47c5c"/>
         <circle cx="14" cy="14" r="5.5" fill="#fff8f2"/>
       </svg>`,
    ),
  iconSize: [28, 38],
  iconAnchor: [14, 38],
  popupAnchor: [0, -34],
});

type Props = {
  richieste: Richiesta[];
  /** Da dove parte il lavoratore: se manca la mappa si centra sui lavori. */
  centro: [number, number] | null;
};

export default function MappaLavori({ richieste, centro }: Props) {
  const conPunto = richieste.filter((r) => r.latitudine !== null && r.longitudine !== null);
  const punti: [number, number][] = conPunto.map((r) => [r.latitudine!, r.longitudine!]);
  if (centro) punti.push(centro);
  if (punti.length === 0) return null;

  // l'inquadratura la decidono i lavori: uno zoom fisso lascerebbe fuori i più lontani
  const inquadratura = latLngBounds(punti).pad(0.25);

  return (
    <div className="overflow-hidden rounded-3xl border border-bordo">
      <MapContainer
        bounds={inquadratura}
        maxZoom={15}
        scrollWheelZoom={false}
        className="h-72 w-full md:h-96"
      >
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
        {conPunto.map((r) => (
          <Marker key={r.id} position={[r.latitudine!, r.longitudine!]} icon={SEGNAPOSTO}>
            <Popup>
              <span className="block font-semibold">{r.titolo}</span>
              <span className="block text-fumo">
                {r.citta}
                {r.distanzaKm !== null && ` • a ${r.distanzaKm} km`}
              </span>
              <Link to={`/richieste/${r.id}`} className="mt-1 block font-semibold text-corallo">
                Vedi la richiesta
              </Link>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
