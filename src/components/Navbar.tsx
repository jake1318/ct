import React from "react";
import { NavLink } from "react-router-dom";
import { ConnectButton } from "@suiet/wallet-kit";
import "../styles/Navbar.scss";

const Navbar: React.FC = () => (
  <nav className="navbar">
    <div className="navbar__logo">Cetus DApp</div>
    <div className="navbar__links">
      <NavLink to="/" className={({ isActive }) => (isActive ? "active" : "")}>
        Home
      </NavLink>
      <NavLink
        to="/pools"
        className={({ isActive }) => (isActive ? "active" : "")}
      >
        Pools
      </NavLink>
    </div>
    <div className="navbar__wallet">
      <ConnectButton />
    </div>
  </nav>
);

export default Navbar;
