import * as React from "react";
import { useNavigate } from "react-router-dom";
import { AppBar, Box, Toolbar, Typography, IconButton } from "@mui/material/";
// Icons
import HomeIcon from "@mui/icons-material/Home";
import PersonIcon from "@mui/icons-material/Person";
import LocalAtmIcon from "@mui/icons-material/LocalAtm";
import ReceiptIcon from "@mui/icons-material/Receipt";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import Tooltip from "@mui/material/Tooltip";

export default function NavBar() {
  const navigate = useNavigate();
  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar
        position="static"
        style={{
          background: "#3d4a58",
          fontFamily: "Roboto",
        }}
      >
        <Toolbar>
          <IconButton
            size="large"
            edge="start"
            color="inherit"
            aria-label="menu"
            sx={{ mr: 2 }}
            onClick={() => {
              navigate("/");
            }}
          >
            <HomeIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            AbaBet
          </Typography>

          <IconButton
            id="login-button"
            size="large"
            edge="start"
            color="inherit"
            aria-label="menu"
            sx={{ mr: 2 }}
            onClick={() => {
              navigate("/login");
            }}
          >
            <PersonIcon />
          </IconButton>
          <IconButton
            id="betting-button"
            size="large"
            edge="start"
            color="inherit"
            aria-label="menu"
            sx={{ mr: 2 }}
            onClick={() => {
              navigate("/bettinghome");
            }}
          >
            <LocalAtmIcon />
          </IconButton>
          <IconButton
            id="betting-button"
            size="large"
            edge="start"
            color="inherit"
            aria-label="menu"
            sx={{ mr: 2 }}
            onClick={() => {
              navigate("/bettingmyaccums");
            }}
          >
            <ReceiptIcon />
          </IconButton>
          <IconButton
            id="betting-button"
            size="large"
            edge="start"
            color="inherit"
            aria-label="menu"
            sx={{ mr: 2 }}
            onClick={() => {
              navigate("/bettingadmin");
            }}
          >
            <AdminPanelSettingsIcon />
          </IconButton>
        </Toolbar>
      </AppBar>
    </Box>
  );
}
