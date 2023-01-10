import { Alert, Button, Divider, TextField } from "@mui/material";
import React, { useEffect, useState } from "react";
import { LoginUtils } from "../utils";
// Icons
import HomeIcon from "@mui/icons-material/Home";
import PersonIcon from "@mui/icons-material/Person";
import LocalAtmIcon from "@mui/icons-material/LocalAtm";
import ReceiptIcon from "@mui/icons-material/Receipt";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import PaidIcon from "@mui/icons-material/Paid";
import MenuIcon from "@mui/icons-material/Menu";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import LockPersonIcon from "@mui/icons-material/LockPerson";
import ScheduleSendIcon from "@mui/icons-material/ScheduleSend";
import ForumIcon from "@mui/icons-material/Forum";
import LeaderboardIcon from "@mui/icons-material/Leaderboard";
import SportsTennisIcon from "@mui/icons-material/SportsTennis";
import QuizIcon from "@mui/icons-material/Quiz";
import DynamicFeedIcon from "@mui/icons-material/DynamicFeed";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();

  return (
    <>
      <div>
        <h1>Velkommen til AbaBet!</h1>
        <div
          style={{
            maxWidth: 500,
            display: "grid",
            margin: "auto",
            textAlign: "center",
          }}
        >
          {/* <Alert
            sx={{ ":hover": { cursor: "pointer" } }}
            onClick={() => {
              navigate("/competition");
            }}
            severity="info"
          >
            Klikk på denne meldingen for å gå til den nye betting-konkurransen
            for å lese reglene og melde deg på!!
          </Alert> */}
        </div>
        <br />
        <h3>En oversikt over funksjoner:</h3>
        <div className="flex-container">
          <div>
            <LocalAtmIcon sx={{ fontSize: 80 }} /> <br />
            <h3>Odds</h3>
            Oddssiden er selve kjernefunksjonen til AbaBet, det er her man går
            for å finne spill og sette penger på oddsen!
          </div>
          <div>
            <LockPersonIcon sx={{ fontSize: 80 }} /> <br />
            <h3>Innlogging</h3>
            AbaBet har et eget brukersystem hvor dere oppretter egne brukere, og
            blir whitelistet av Lau og Jonas. All informasjon på AbaBet er
            utilgjengelig for alle andre.
          </div>
          {/* <div>
            <MenuBookIcon sx={{ fontSize: 80 }} /> <br />
            <h3>Ordboka</h3>
            Ordboka er er en funksjonalitet som egentlig er ment for 
          </div> */}
          <div>
            <DynamicFeedIcon sx={{ fontSize: 80 }} /> <br />
            <h3>BetFeed</h3>
            Sjekk hvilke bonger de andre spillerne har levert inn!
          </div>
          <div>
            <ScheduleSendIcon sx={{ fontSize: 80 }} /> <br />
            <h3>Request-a-bet</h3>
            Dersom du ønsker å foreslå et bet som bør inn på AbaBet er det
            muligheter for å requeste dette.
          </div>
          <div>
            <LeaderboardIcon sx={{ fontSize: 80 }} /> <br />
            <h3>Leaderboard</h3>
            Sjekk hvem som har har mest cash på AbaBet, og hvem som har flest
            grønne bonger i portefølgen sin.
          </div>
        </div>
      </div>
      <br />
      <br />
      <br />
    </>
  );
}
