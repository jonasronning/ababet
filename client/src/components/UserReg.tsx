import { useState, useEffect } from "react";
import { LoginUtils } from "../utils";
import { Link, Navigate } from "react-router-dom";
import axios from "axios";

import TextField from "@mui/material/TextField";
import { AlertTitle, Button, InputAdornment } from "@mui/material";
import Alert, { AlertColor } from "@mui/material/Alert";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../redux/hooks";
import { setUsername } from "../redux/userSlice";
import AlertComp from "./Alert";
import { AlertT, UserAvailability } from "../types";
import { AccountCircle, ConstructionOutlined } from "@mui/icons-material";
import InsertEmoticonIcon from "@mui/icons-material/InsertEmoticon";
import KeyIcon from "@mui/icons-material/Key";
import { selectPath } from "../redux/envSlice";

function UserReg() {
  const navigate = useNavigate();

  let alertmsg = "";

  const dispatch = useAppDispatch();
  const url_path = useAppSelector(selectPath);

  const [missingUsername, setMissingUsername] = useState<boolean>(false);
  const [missingFirstname, setMissingFirstname] = useState<boolean>(false);

  //password local component state
  const [pass, setPass] = useState("");
  //password local component state
  const [confirmPass, setConfirmPass] = useState("");
  //user local component state
  const [user, setUser] = useState("");
  //user local component state
  const [firstname, setFirstname] = useState("");
  //user local component state
  const [lastname, setLastname] = useState("");
  //error toggle
  const [_alert, setAlert] = useState<boolean>(false);
  const [_alertType, setAlertType] = useState<AlertT>({
    type: "info",
    msg: "",
  });

  // //fetched user from neo4j
  const [userAvailability, setUserAvailability] = useState<UserAvailability>({
    checkedDB: false,
    userTaken: false,
  });

  const fetchUserAvailability = async (user: string) => {
    const response = await fetch(`${url_path}api/userAvailability/${user}`);
    const resp = await response.json();

    setUserAvailability({ checkedDB: true, userTaken: resp["userTaken"] });
  };

  // Toggle error with message
  function toggleAlert(
    isActive: boolean,
    msg: string = "",
    type: AlertColor = "info"
  ) {
    setAlert(isActive);
    setAlertType({ type: type, msg: msg });
  }

  // Create user first function
  function initCreateUser() {
    if (user == "" || firstname == "") {
      if (user == "") {
        setMissingUsername(true);
      }
      if (firstname == "") {
        setMissingFirstname(true);
      }
    } else {
      if (pass == confirmPass) {
        // Check if password fulfills criterias
        if (LoginUtils.verifyPass(pass)) {
          // Check if that username exists from before in DB
          fetchUserAvailability(user.toLowerCase());
        } else {
          alertmsg = "Passordet må være minst 6 tegn langt";
          toggleAlert(true, alertmsg, "error");
        }
      } else {
        alertmsg = "Passordene er ikke like";
        toggleAlert(true, alertmsg, "error");
      }
    }
  }

  // Create user part 2, useeffect on fetcheduser
  // Triggered when _fetchedUser state changes
  // If _fetchedUser is empty, it means username is not taken -> create user in DB
  useEffect(() => {
    //if username already taken
    if (userAvailability["checkedDB"]) {
      if (userAvailability["userTaken"]) {
        alertmsg = `Bruker '${user}' er tatt, vennligst velg et annet brukernavn`;
        toggleAlert(true, alertmsg, "error");
      } else {
        //hash pass and set to neo4j
        let hashedPass = LoginUtils.hashPass(pass);
        let newUser = {
          username: user,
          firstname: firstname,
          password: hashedPass,
        };
        if (lastname !== "") {
          Object.assign(newUser, { lastname: lastname });
        }

        createUser(newUser);
      }
    }
  }, [userAvailability]);

  const createUser = async (newUser: Object) => {
    const response = await fetch(`${url_path}api/createUser`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newUser),
    });

    const resp = await response.json();
    if (resp.userCreated) {
      navigate("/login");
    } else {
      alertmsg = `Bruker ble ikke opprettet, noe gikk galt. Send melding til Lau. Error message: ${resp}`;
      toggleAlert(true, alertmsg, "error");
    }
  };

  return (
    <>
      <AlertComp
        setAlert={setAlert}
        _alert={_alert}
        _alertType={_alertType}
        toggleAlert={toggleAlert}
      ></AlertComp>
      <div className="userReg">
        <div>
          <Button
            component={Link}
            to="/login"
            sx={{
              color: "#3d4a58",
              mt: 2,
              ":hover": {
                color: "#ffffff",
                backgroundColor: "#3d4a58",
              },
            }}
          >
            <b>Allerede bruker? Klikk her</b>
          </Button>
        </div>
        <h1>Opprett bruker i AbaBet </h1>
        <div className="register-fields">
          <TextField
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <InsertEmoticonIcon />
                </InputAdornment>
              ),
            }}
            error={missingUsername ? true : false}
            helperText={missingUsername ? "Dette feltet må fylles ut" : ""}
            id="register-username"
            label="Brukernavn*"
            value={user}
            onChange={(e) => {
              setUser(e.target.value);
              setMissingUsername(false);
            }}
          />{" "}
          <br /> <br />
          <TextField
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <AccountCircle />
                </InputAdornment>
              ),
            }}
            error={missingFirstname ? true : false}
            helperText={missingFirstname ? "Dette feltet må fylles ut" : ""}
            id="register-firstname"
            label="Fornavn*"
            value={firstname}
            onChange={(e) => {
              setFirstname(e.target.value);
              setMissingFirstname(false);
            }}
          />{" "}
          <br /> <br />
          <TextField
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <AccountCircle />
                </InputAdornment>
              ),
            }}
            id="register-lastname"
            label="Etternavn"
            value={lastname}
            onChange={(e) => setLastname(e.target.value)}
          />{" "}
          <br /> <br />
          <TextField
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <KeyIcon />
                </InputAdornment>
              ),
            }}
            id="register-password"
            type={"password"}
            label="Passord*"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
          />{" "}
          <br /> <br />
          <TextField
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <KeyIcon />
                </InputAdornment>
              ),
            }}
            id="confirm-password"
            type={"password"}
            label="Bekreft passord*"
            value={confirmPass}
            onChange={(e) => setConfirmPass(e.target.value)}
          />
          <br />
          <br />
          <div
            style={{
              maxWidth: 500,
              display: "grid",
              margin: "auto",
              textAlign: "center",
            }}
          >
            <Alert severity="info">
              <AlertTitle>Lagring av passord</AlertTitle>
              Passordet blir "kvernet" (hashet) til en ugjenkjennelig streng.
              Dermed er det umulig for meg å se passordet ditt, men vil
              allikevel anbefale å bruke et passord det ikke er så "farlig" med.
            </Alert>
          </div>
        </div>
        <div>
          <Button
            id="register-user-button"
            variant="contained"
            onClick={() => initCreateUser()}
            sx={{
              color: "#ffffff",
              backgroundColor: "#3d4a58",
              mt: 2,
              ":hover": {
                color: "#ffffff",
                backgroundColor: "#3d4a58",
              },
            }}
          >
            <b> Opprett bruker </b>
          </Button>
          <br />
          <br />
          <br />
          <br />
        </div>
      </div>
    </>
  );
}

export default UserReg;
