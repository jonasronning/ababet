import React, { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import accumSlice, {
  selectAccum,
  removeAccum,
  removeBet,
} from "../../redux/accumSlice";
import { AccumBetOption, AlertT } from "../../types";
import {
  AlertColor,
  Button,
  Chip,
  IconButton,
  Input,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import {
  setBalance,
  selectBalance,
  selectUsername,
} from "../../redux/userSlice";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import { selectPath } from "../../redux/envSlice";

import Box from "@mui/material/Box";
import Fab from "@mui/material/Fab";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import FavoriteIcon from "@mui/icons-material/Favorite";
import NavigationIcon from "@mui/icons-material/Navigation";
import ReceiptIcon from "@mui/icons-material/Receipt";
import AlertComp from "../Alert";

export default function Accumulator() {
  const dispatch = useAppDispatch();

  const username = useAppSelector(selectUsername);

  const [stake, setStake] = React.useState<string>();
  const [isCollapsed, setIsCollapsed] = React.useState<boolean>(false);
  const bets = useAppSelector(selectAccum);
  const balance = useAppSelector(selectBalance);

  const [betCompleted, setBetCompleted] = React.useState<boolean>(false);

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

  useEffect(() => {
    var valueArr = bets.map(function (bet) {
      return bet.bet;
    });
    var isDuplicate = valueArr.some(function (item, idx) {
      return valueArr.indexOf(item) != idx;
    });
    if (isDuplicate) {
      toggleAlert(
        true,
        "Du kan ikke ha flere valg fra samme bet i én kupong",
        "error"
      );
    } else {
      setAlert(false);
    }
  }, [bets]);

  let totalodds = 1;
  bets.map((bet: AccumBetOption) => {
    totalodds = totalodds * bet.option.latest_odds;
  });
  const url_path = useAppSelector(selectPath);

  if (bets.length == 0) {
    return <></>;
  }

  async function createAccum() {
    var valueArr = bets.map(function (bet) {
      return bet.bet;
    });
    var isDuplicate = valueArr.some(function (item, idx) {
      return valueArr.indexOf(item) != idx;
    });

    if (isDuplicate) {
      toggleAlert(
        true,
        "Du kan ikke ha flere valg fra samme bet i én kupong",
        "error"
      );
      return;
    }
    if (stake == undefined || stake == "") {
      toggleAlert(true, "Innsats kan ikke være tom", "error");
      return;
    }
    let bet_packet: any = { bets: bets, stake: stake, totalodds: totalodds };
    const response = await fetch(`${url_path}api/placebet`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("jwt")}`,
      },
      body: JSON.stringify(bet_packet),
    });

    const resp = await response.json();
    if (resp["placeBet"]) {
      let new_balance = balance - Number(stake);
      dispatch(setBalance(new_balance));

      setBetCompleted(true);
    } else {
      toggleAlert(true, resp["errorMsg"], "error");
    }
  }

  if (betCompleted) {
    return (
      <>
        <div className="Accum">
          <div style={{ padding: 20 }}>
            Spillet ditt ble satt! <br />
            <br />
            <Button
              variant="contained"
              onClick={() => {
                afterAccumPlaced(true);
              }}
            >
              Behold valg
            </Button>
            <Button
              variant="contained"
              onClick={() => {
                afterAccumPlaced(false);
              }}
            >
              Lukk
            </Button>
          </div>
        </div>
      </>
    );
  }

  // Handle button click after accum is placed
  function afterAccumPlaced(keep: boolean) {
    setBetCompleted(false);
    setStake("");
    if (!keep) dispatch(removeAccum());
  }

  return (
    <>
      {!isCollapsed ? (
        <>
          <div className="Accum">
            <div style={{ padding: "20px" }}>
              <AlertComp
                setAlert={setAlert}
                _alert={_alert}
                _alertType={_alertType}
                toggleAlert={toggleAlert}
              ></AlertComp>
              <Button
                sx={{
                  color: "#ffffff",
                  backgroundColor: "#3d4a58",
                  mt: 2,
                  mb: 2,
                  ":hover": {
                    color: "#ffffff",
                    backgroundColor: "#636e72",
                  },
                }}
                size="small"
                variant="contained"
                onClick={() => {
                  setIsCollapsed(true);
                }}
              >
                Skjul kupong
              </Button>
              <br />
              <br />
              {bets.map((bet: AccumBetOption) => {
                return (
                  <>
                    <Paper sx={{ padding: 1 }} elevation={3}>
                      <div>
                        <b>{bet.bet}</b>
                        <br />

                        <Chip
                          sx={{ backgroundColor: "" }}
                          label={
                            bet.option.option + " - " + bet.option.latest_odds
                          }
                          variant="outlined"
                        />
                        <IconButton
                          onClick={() => {
                            dispatch(removeBet(bet));
                          }}
                        >
                          <DeleteForeverIcon />
                        </IconButton>
                      </div>
                    </Paper>
                    <br />
                  </>
                );
              })}
              <TextField
                error={balance < Number(stake) ? true : false}
                helperText={
                  balance < Number(stake)
                    ? "Innsats overstiger din balanse"
                    : ""
                }
                value={stake}
                type="number"
                onChange={(e) => {
                  setStake(e.target.value);
                }}
                id="outlined-basic"
                label="Innsats"
                variant="outlined"
              />{" "}
              <br />
              <div style={{ marginTop: 10, marginBottom: 10 }}>
                <Chip
                  sx={{ backgroundColor: "white" }}
                  label={"Totalodds: " + totalodds.toFixed(2)}
                ></Chip>
              </div>
              <div style={{ marginTop: 10, marginBottom: 10 }}>
                <Chip
                  sx={{ backgroundColor: "#388e3c", color: "white" }}
                  label={
                    "Mulig utbetaling: " +
                    (totalodds * Number(stake ? stake : 0)).toLocaleString() +
                    " NOK"
                  }
                ></Chip>
              </div>
              <Button
                sx={{
                  color: "#ffffff",
                  backgroundColor: "#3d4a58",
                  mt: 2,
                  mb: 2,
                  ":hover": {
                    color: "#ffffff",
                    backgroundColor: "#636e72",
                  },
                }}
                disabled={balance < Number(stake) ? true : false}
                variant="contained"
                onClick={() => {
                  createAccum();
                }}
              >
                Sett spill
              </Button>
            </div>
          </div>
        </>
      ) : (
        <div className="AccumCollapsed">
          <Fab
            color="primary"
            sx={{ backgroundColor: "#f90000" }}
            variant="extended"
            onClick={() => {
              setIsCollapsed(false);
            }}
          >
            <ReceiptIcon sx={{ mr: 1 }} /> Vis kupong
          </Fab>
        </div>
      )}
    </>
  );
}
function toggleAlert(arg0: boolean, arg1: any, arg2: string) {
  throw new Error("Function not implemented.");
}
