import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import logo from "../assets/cds.png"; // Vérifie le chemin

// Composant réutilisable pour une jauge
const GaugeDisplay = ({ title, value, max, color }) => {
  const percentage = max > 0 ? (value / max) * 100 : 0;
  const displayPercentage = Math.min(Math.round(percentage), 100);
  const textPercentage = Math.round(percentage);
  const isComplete = percentage >= 100;

  return (
    <div className="flex flex-col items-center p-4 bg-white rounded-lg shadow-md transition-transform transform hover:scale-105 duration-300 ease-in-out">
      <h3 className="text-xl font-semibold mb-4 text-gray-700">{title}</h3>
      <div className="w-32 h-32 relative">
        <CircularProgressbar
          value={displayPercentage}
          text={`${textPercentage}%`}
          styles={buildStyles({
            rotation: 0.25,
            strokeLinecap: "butt",
            textSize: "16px",
            pathTransitionDuration: 0.5,
            pathColor: isComplete ? "#22c55e" : color,
            textColor: isComplete ? "#22c55e" : "#4a5568",
            trailColor: "#d1d5db",
            backgroundColor: "#f9fafb",
          })}
        />
      </div>
      <div className="mt-4 text-center">
        <p className="text-sm text-gray-500">
          Réalisé : <span className="font-bold text-gray-800">{value}</span>
        </p>
        <p className="text-sm text-gray-500">
          Objectif : <span className="font-bold text-gray-800">{max}</span>
        </p>
      </div>
    </div>
  );
};

function HomePage() {
  const location = useLocation();
  const { nomUtilisateur } = location.state || {};
  const [nomComplet, setNomComplet] = useState("Utilisateur");
  const [performanceData, setPerformanceData] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllData = async () => {
      if (!nomUtilisateur) {
        setError("Nom d'utilisateur non disponible. Veuillez vous reconnecter.");
        setLoading(false);
        return;
      }
      try {
        const userResponse = await axios.get(
          `http://localhost:8086/api/auth/user/${nomUtilisateur}`
        );
        setNomComplet(userResponse.data.nomComplet || "Utilisateur");

        const performanceResponse = await axios.get(
          `http://localhost:8086/api/auth/performance/${nomUtilisateur}`
        );
        setPerformanceData(performanceResponse.data);
      } catch (err) {
        console.error("Erreur lors de la récupération des données :", err);
        setError(
          "Impossible de charger les données de performance. Veuillez réessayer plus tard."
        );
      } finally {
        setLoading(false);
      }
    };
    fetchAllData();
  }, [nomUtilisateur]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100 p-4">
        <div className="bg-white p-10 rounded-3xl shadow-xl w-full max-w-lg text-center">
          <p className="text-gray-500">Chargement des données en cours...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100 p-4">
        <div className="bg-white p-10 rounded-3xl shadow-xl w-full max-w-lg text-center">
          <p className="text-red-500 text-lg">{error}</p>
        </div>
      </div>
    );
  }

  // Répartition des jauges par colonnes
  const leftColumnIndicators = ["Packages", "Monétique"];
  const rightColumnIndicators = ["Crédits Conso", "Crédits Immo"];

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-orange-400 p-4 shadow-md flex justify-between items-center">
        <div className="flex items-center">
          <img src={logo} alt="Logo CDS" className="h-10 w-auto" />
        </div>
        <div className="text-right text-white">
          <p className="text-lg">
            Bienvenue, <span className="font-semibold">{nomComplet}</span> 👋
          </p>
        </div>
      </nav>

      <main className="container mx-auto p-8">
        <h1 className="text-3xl font-extrabold text-gray-800 text-center mb-12">
          Tableau de bord de performance
        </h1>

        <div className="flex justify-center">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl">
            {performanceData
              .filter((item) => leftColumnIndicators.includes(item.indicateur))
              .map((item) => (
                <GaugeDisplay
                  key={item.indicateur}
                  title={item.indicateur}
                  value={item.realisation}
                  max={item.objectif}
                  color={item.tauxAtteinte < 100 ? "#f97316" : "#22c55e"}
                />
              ))}
            {performanceData
              .filter((item) => rightColumnIndicators.includes(item.indicateur))
              .map((item) => (
                <GaugeDisplay
                  key={item.indicateur}
                  title={item.indicateur}
                  value={item.realisation}
                  max={item.objectif}
                  color={item.tauxAtteinte < 100 ? "#f97316" : "#22c55e"}
                />
              ))}
          </div>
        </div>

        {performanceData.length === 0 && (
          <div className="bg-white p-10 rounded-3xl shadow-xl w-full text-center mt-12">
            <p className="text-gray-500">
              Aucune donnée de performance n'est disponible pour l'instant.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

export default HomePage;
