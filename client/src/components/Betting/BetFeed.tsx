import React, { useEffect } from "react";
import {
  AlertColor,
  Button,
  Card,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  Paper,
  TextField,
} from "@mui/material";
import { useAppSelector } from "../../redux/hooks";
import { selectPath } from "../../redux/envSlice";
import { selectAdmin } from "../../redux/userSlice";
import { useNavigate } from "react-router-dom";
import { AccumBets, Accums, AlertT } from "../../types";
import NoAccess from "../NoAccess";

export default function BetFeed() {
  const url_path = useAppSelector(selectPath);

  const [accums, setAccums] = React.useState<Accums[]>([]);

  const [responseCode, setResponseCode] = React.useState<number>();
  const [responseText, setResponseText] = React.useState<number>();

  //error toggle
  const [_alert, setAlert] = React.useState<boolean>(false);
  const [_alertType, setAlertType] = React.useState<AlertT>({
    type: "info",
    msg: "",
  });
  // Toggle error with message
  function toggleAlert(
    isActive: boolean,
    msg: string = "",
    type: AlertColor = "info"
  ) {
    setAlert(isActive);
    setAlertType({ type: type, msg: msg });
  }

  const fetchBets = async () => {
    const response = await fetch(`${url_path}api/allaccums`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("jwt")}` },
    });
    const resp = await response.json();
    setResponseCode(response.status);
    if (response.status == 200) {
      setAccums(resp);
    } else {
      setResponseText(resp.detail);
    }
  };

  useEffect(() => {
    fetchBets();
  }, []);

  function getAccumStatus(accum: Accums) {
    let hasWon: boolean = false;
    let hasLost: boolean = false;
    let hasOpen: boolean = false;
    accum.accumBets.forEach((bet: AccumBets) => {
      if (bet.option_status == 3) {
        hasLost = true;
        return;
      } else if (bet.option_status == 2) {
        hasWon = true;
      } else if (bet.option_status == 1) {
        hasOpen = true;
      }
    });
    if (hasLost) {
      return ["5px solid #a81a3f", 3];
    }
    if (hasOpen) {
      return ["white", 1];
    }
    if (hasWon) {
      return ["5px solid #388e3c", 2];
    } else {
      return ["white", 1];
    }
  }

  const MONTHS = [
    "jan",
    "feb",
    "mar",
    "apr",
    "mai",
    "jun",
    "jul",
    "aug",
    "sep",
    "okt",
    "nov",
    "des",
  ];

  const navigate = useNavigate();

  if (responseCode == undefined) {
    return (
      <>
        <br />
        <br />
        <br />
        <CircularProgress />
      </>
    );
  }

  if (responseCode !== 200) {
    return <NoAccess responseCode={responseCode} responseText={responseText} />;
  }

  return (
    <>
      <div className="accums-flex-container">
        {accums.map((accum) => {
          let status: (string | number)[] = getAccumStatus(accum);

          return (
            <>
              <div>
                <Card
                  sx={{
                    border: status[0],
                    padding: 1,
                    width: 345,
                  }}
                >
                  <p
                    style={{
                      marginTop: 1,
                      marginBottom: 1,
                      color: "#828385",
                    }}
                  >
                    <b>{accum.username}</b> |{" "}
                    {new Date(accum.placed_timestamp).getDate() +
                      " " +
                      MONTHS[new Date(accum.placed_timestamp).getMonth()] +
                      " " +
                      new Date(accum.placed_timestamp).getFullYear() +
                      " " +
                      ("0" + new Date(accum.placed_timestamp).getHours()).slice(
                        -2
                      ) +
                      ":" +
                      (
                        "0" + new Date(accum.placed_timestamp).getMinutes()
                      ).slice(-2)}
                  </p>
                  {accum.accumBets.map((bet) => {
                    let border = "";
                    let status_color = "white";
                    let text_color = "black";
                    if (bet.option_status == 2) {
                      border = "2px solid #388e3c";
                      status_color = "#388e3c";
                      text_color = "white";
                    } else if (bet.option_status == 3) {
                      border = "2px solid #a81a3f";
                      status_color = "#a81a3f";
                      text_color = "white";
                    }
                    return (
                      <>
                        <Paper
                          sx={{
                            border: border,
                            padding: 1,
                            marginLeft: 2,
                            marginRight: 2,
                            marginTop: 1,
                            marginBottom: 2,
                          }}
                          elevation={3}
                        >
                          <b>{bet.title} </b>
                          <br />
                          <Chip
                            sx={{
                              backgroundColor: status_color,
                              color: text_color,
                            }}
                            label={bet.option + " - " + bet.user_odds}
                          ></Chip>

                          <br />
                        </Paper>
                      </>
                    );
                  })}
                  <Chip
                    sx={{
                      backgroundColor: "#f90000",
                      color: "white",
                      marginRight: 1,
                    }}
                    label={"Innsats: " + accum.stake + "kr"}
                  ></Chip>
                  <Chip
                    sx={{ backgroundColor: "#f90000", color: "white" }}
                    label={"Totalodds: " + accum.total_odds.toFixed(2)}
                  ></Chip>
                  <br />
                  <Chip
                    sx={{
                      marginTop: 1,
                      backgroundColor: "#f90000",
                      color: "white",
                    }}
                    label={
                      "Mulig utbetaling: " +
                      (accum.stake * accum.total_odds).toFixed(2) +
                      " kr"
                    }
                  ></Chip>
                </Card>
              </div>
            </>
          );
        })}
      </div>
    </>
  );
}
