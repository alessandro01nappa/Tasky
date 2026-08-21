import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import RottaProtetta from "./componenti/RottaProtetta";
import Accesso from "./pagine/Accesso";
import DashboardLavoratore from "./pagine/DashboardLavoratore";
import DettaglioIncarico from "./pagine/DettaglioIncarico";
import DettaglioRichiesta from "./pagine/DettaglioRichiesta";
import Esplora from "./pagine/Esplora";
import MieRichieste from "./pagine/MieRichieste";
import NuovaRichiesta from "./pagine/NuovaRichiesta";
import DiventaLavoratore from "./pagine/DiventaLavoratore";
import Permessi from "./pagine/Permessi";
import Profilo from "./pagine/Profilo";
import Registrazione from "./pagine/Registrazione";
import "./index.css";

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
              <Esplora />
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
          path="/richieste"
          element={
            <RottaProtetta>
              <MieRichieste />
            </RottaProtetta>
          }
        />
        <Route
          path="/lavoratore"
          element={
            <RottaProtetta>
              <DashboardLavoratore />
            </RottaProtetta>
          }
        />
        <Route
          path="/richieste/nuova"
          element={
            <RottaProtetta>
              <NuovaRichiesta />
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
