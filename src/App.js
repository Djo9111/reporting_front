import React from "react";
import { Routes, Route } from "react-router-dom";
import UploadPage from "./pages/UploadPage"; // default import
import LoginPage from "./pages/LoginPage";   // default import
import HomePage from "./pages/HomePage";     // default import

function App() {
  return (
    <Routes>
      <Route path="/" element={<UploadPage />} />   {/* Page d'import */}
      <Route path="/login" element={<LoginPage />} /> {/* Page de connexion */}
      <Route path="/home" element={<HomePage />} />   {/* Dashboard */}
    </Routes>
  );
}

export default App;
