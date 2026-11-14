import React from "react";
import { Routes, Route, NavLink } from "react-router-dom";
import "./App.css";
import StartPage from "./pages/StartPage";
import DashboardPage from "./pages/DashboardPage";
import SystemPage from "./pages/SystemPage";
import SlamPage from "./pages/SlamPage";
import NavigationPage from "./pages/NavigationPage";
import AvoidancePage from "./pages/AvoidancePage";

function App() {
  return (
    <div className="App" style={{ fontFamily: "sans-serif" }}>
      <header
        style={{
          padding: "10px 20px",
          borderBottom: "1px solid #eee",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ fontWeight: "bold", fontSize: 18 }}>
          Indoor Autonomous Assist System
        </div>
        <nav style={{ display: "flex", gap: 12, fontSize: 14 }}>
          <NavLink
            to="/"
            style={({ isActive }) => ({
              textDecoration: "none",
              color: isActive ? "#1976d2" : "#555",
              fontWeight: isActive ? 700 : 400,
            })}
          >
            Start
          </NavLink>
          <NavLink
            to="/dashboard"
            style={({ isActive }) => ({
              textDecoration: "none",
              color: isActive ? "#1976d2" : "#555",
              fontWeight: isActive ? 700 : 400,
            })}
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/system"
            style={({ isActive }) => ({
              textDecoration: "none",
              color: isActive ? "#1976d2" : "#555",
              fontWeight: isActive ? 700 : 400,
            })}
          >
            System
          </NavLink>
          <NavLink
            to="/slam"
            style={({ isActive }) => ({
              textDecoration: "none",
              color: isActive ? "#1976d2" : "#555",
              fontWeight: isActive ? 700 : 400,
            })}
          >
            SLAM
          </NavLink>
          <NavLink
            to="/navigation"
            style={({ isActive }) => ({
              textDecoration: "none",
              color: isActive ? "#1976d2" : "#555",
              fontWeight: isActive ? 700 : 400,
            })}
          >
            Navigation
          </NavLink>
          <NavLink
            to="/avoidance"
            style={({ isActive }) => ({
              textDecoration: "none",
              color: isActive ? "#1976d2" : "#555",
              fontWeight: isActive ? 700 : 400,
            })}
          >
            Avoidance
          </NavLink>
        </nav>
      </header>

      <main>
        <Routes>
          <Route path="/" element={<StartPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/system" element={<SystemPage />} />
          <Route path="/slam" element={<SlamPage />} />
          <Route path="/navigation" element={<NavigationPage />} />
          <Route path="/avoidance" element={<AvoidancePage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
