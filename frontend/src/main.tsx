import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import RottaProtetta from "./componenti/RottaProtetta";
import Accesso from "./pagine/Accesso";
import Home from "./pagine/Home";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/accesso" element={<Accesso />} />
        <Route
          path="/"
          element={
            <RottaProtetta>
              <Home />
            </RottaProtetta>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
