import React from "react";
import { Routes, Route } from "react-router-dom";
import UploadPage from "./pages/UploadPage";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import AdminPage from "./pages/AdminPage";  // ✅ nouvelle page

function App() {
  return (
    <Routes>
      <Route path="/" element={<UploadPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/home" element={<HomePage />} />
      <Route path="/admin" element={<AdminPage />} /> {/* ✅ nouvelle route */}
    </Routes>
  );
}

export default App;
