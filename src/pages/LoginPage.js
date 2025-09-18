import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import logo from '../assets/cds.png'; // Assurez-vous que le chemin d'accès est correct

function LoginPage() {
  const [nomUtilisateur, setNomUtilisateur] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); // Réinitialise l'erreur

    try {
      const response = await axios.post("http://localhost:8086/api/auth/login", {
        nomUtilisateur,
        motDePasse,
      });

      if (response.status === 200) {
        navigate("/home", { state: { nomUtilisateur } });
      }
    } catch (err) {
      setError("Nom d'utilisateur ou mot de passe incorrect.");
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-sm transform transition duration-500 hover:scale-105">
        <div className="flex justify-center mb-6">
          <img src={logo} alt="Logo de l'entreprise" className="h-20 w-auto object-contain" />
        </div>
        <h1 className="text-3xl font-extrabold text-center mb-2 text-gray-800">Se connecter</h1>
        <p className="text-center text-gray-500 mb-6">Accédez à votre tableau de bord de reporting</p>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Nom d'utilisateur"
            value={nomUtilisateur}
            onChange={(e) => setNomUtilisateur(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 transition"
          />
          <input
            type="password"
            placeholder="Mot de passe"
            value={motDePasse}
            onChange={(e) => setMotDePasse(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 transition"
          />
          <button
            type="submit"
            className="w-full bg-orange-400 text-white font-semibold py-3 rounded-lg shadow-md hover:bg-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2 transition"
          >
            Se connecter
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;