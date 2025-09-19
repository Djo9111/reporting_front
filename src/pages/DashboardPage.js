import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import HomePage from "./HomePage";
import ClientListPage from "./ClientListPage"; // On créera cette page

function DashboardPage() {
  const location = useLocation();
  const { nomUtilisateur, nomComplet } = location.state || {};

  const [view, setView] = useState(null); // null | "clients" | "performance"

  if (!nomUtilisateur) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100">
        <div className="bg-white p-10 rounded-3xl shadow-xl w-full max-w-lg text-center">
          <p className="text-red-500 text-lg">
            Nom d'utilisateur non disponible. Veuillez vous reconnecter.
          </p>
        </div>
      </div>
    );
  }

  if (view === "clients") {
    return <ClientListPage nomUtilisateur={nomUtilisateur} nomComplet={nomComplet} goBack={() => setView(null)} />;
  }

  if (view === "performance") {
    return <HomePage nomUtilisateur={nomUtilisateur} />;
  }

  // Menu principal
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-3xl font-extrabold mb-10">Bienvenue, {nomComplet}</h1>
      <div className="flex flex-col space-y-6">
        <button
          onClick={() => setView("clients")}
          className="px-10 py-4 bg-blue-500 text-white font-semibold rounded-lg shadow-md hover:bg-blue-600"
        >
          Voir mes clients
        </button>
        <button
          onClick={() => setView("performance")}
          className="px-10 py-4 bg-green-500 text-white font-semibold rounded-lg shadow-md hover:bg-green-600"
        >
          Voir mes performances
        </button>
      </div>
    </div>
  );
}

export default DashboardPage;
