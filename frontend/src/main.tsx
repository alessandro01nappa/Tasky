import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import RottaProtetta from "./componenti/RottaProtetta";
import SoloModalita from "./componenti/SoloModalita";
import { useSonoLavoratore } from "./lib/lavoratore";
import Accesso from "./pagine/Accesso";
import DashboardLavoratore from "./pagine/DashboardLavoratore";
import DettaglioIncarico from "./pagine/DettaglioIncarico";
import DettaglioRichiesta from "./pagine/DettaglioRichiesta";
import ElencoProfessionisti from "./pagine/ElencoProfessionisti";
import Esplora from "./pagine/Esplora";
import TrovaLavori from "./pagine/TrovaLavori";
import MieRichieste from "./pagine/MieRichieste";
import NuovaRichiesta from "./pagine/NuovaRichiesta";
import DiventaLavoratore from "./pagine/DiventaLavoratore";
import Permessi from "./pagine/Permessi";
import Profilo from "./pagine/Profilo";
import ProfiloLavoratore from "./pagine/ProfiloLavoratore";
import Registrazione from "./pagine/Registrazione";
import "./index.css";

/** La radice mostra la home giusta: chi lavora vede gli annunci, chi cerca vede le persone. */
function Home() {
  return useSonoLavoratore() ? <TrovaLavori /> : <Esplora />;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/accesso" element={<Accesso />} />
        <Route path="/registrazione" element={<Registrazione />} />
        <Route
          path="/permessi"
          element={
            <RottaProtetta>
              <Permessi />
            </RottaProtetta>
          }
        />
        <Route
          path="/"
          element={
            <RottaProtetta>
              <Home />
            </RottaProtetta>
          }
        />
        <Route
          path="/diventa-lavoratore"
          element={
            <RottaProtetta>
              <DiventaLavoratore />
            </RottaProtetta>
          }
        />
        <Route
          path="/professionisti"
          element={
            <RottaProtetta>
              <SoloModalita lavoratore={false}>
                <ElencoProfessionisti />
              </SoloModalita>
            </RottaProtetta>
          }
        />
        <Route
          path="/lavoratori/:id"
          element={
            <RottaProtetta>
              <ProfiloLavoratore />
            </RottaProtetta>
          }
        />
        <Route
          path="/richieste"
          element={
            <RottaProtetta>
              <SoloModalita lavoratore={false}>
                <MieRichieste />
              </SoloModalita>
            </RottaProtetta>
          }
        />
        <Route
          path="/lavoratore"
          element={
            <RottaProtetta>
              <SoloModalita lavoratore={true}>
                <DashboardLavoratore />
              </SoloModalita>
            </RottaProtetta>
          }
        />
        <Route
          path="/richieste/nuova"
          element={
            <RottaProtetta>
              <SoloModalita lavoratore={false}>
                <NuovaRichiesta />
              </SoloModalita>
            </RottaProtetta>
          }
        />
        <Route
          path="/richieste/:id"
          element={
            <RottaProtetta>
              <DettaglioRichiesta />
            </RottaProtetta>
          }
        />
        <Route
          path="/incarichi/:id"
          element={
            <RottaProtetta>
              <DettaglioIncarico />
            </RottaProtetta>
          }
        />
        <Route
          path="/profilo"
          element={
            <RottaProtetta>
              <Profilo />
            </RottaProtetta>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
