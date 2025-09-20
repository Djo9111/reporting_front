import React from "react";
import { Routes, Route } from "react-router-dom";
import UploadPage from "./pages/UploadPage";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import AdminPage from "./pages/AdminPage";
import ClientListPage from "./pages/ClientListPage";
import DashboardPage from "./pages/DashboardPage";
import AppointmentPage from "./pages/AppointmentPage"; // ✅ nouvelle import

function App() {
  return (
    <Routes>
      <Route path="/" element={<UploadPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/home" element={<HomePage />} />
      <Route path="/admin" element={<AdminPage />} />
      <Route path="/clients" element={<ClientListPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/appointments" element={<AppointmentPage />} /> {/* ✅ nouvelle route */}
    </Routes>
  );
}

export default App;
