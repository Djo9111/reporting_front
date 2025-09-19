import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import logo from "../assets/cds.png";

function UploadPage() {
  const navigate = useNavigate();

  // --- Production ---
  const [prodFile, setProdFile] = useState(null);
  const [prodResult, setProdResult] = useState(null);
  const [prodError, setProdError] = useState("");
  const [prodLoading, setProdLoading] = useState(false);

  // --- Objectives ---
  const [objFile, setObjFile] = useState(null);
  const [objResult, setObjResult] = useState(null);
  const [objError, setObjError] = useState("");
  const [objLoading, setObjLoading] = useState(false);

  // ----------------- Handlers -----------------

  // Production
  const handleProdFileChange = (e) => {
    setProdFile(e.target.files[0]);
    setProdResult(null);
    setProdError("");
  };

  const handleProdUpload = async () => {
    if (!prodFile) {
      setProdError("Veuillez sélectionner un fichier Excel de production.");
      return;
    }
    setProdLoading(true);
    setProdError("");
    setProdResult(null);

    const formData = new FormData();
    formData.append("file", prodFile);

    try {
      const response = await axios.post(
        "http://localhost:8086/api/upload/excel",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      console.log("Réponse complète du backend (Production):", response);

      if (response.data && typeof response.data === "object") {
        setProdResult(response.data);
        console.log("Import Production réussi:", response.data);
      } else {
        setProdError("Format inattendu reçu du serveur : " + JSON.stringify(response.data));
        console.warn("Format inattendu (Production):", response.data);
      }
    } catch (err) {
      console.error("Erreur lors de l'import Production:", err);

      if (err.response) {
        console.log("Status:", err.response.status);
        console.log("Data:", err.response.data);
        setProdError("Erreur serveur: " + JSON.stringify(err.response.data));
      } else if (err.request) {
        console.log("Aucune réponse du serveur:", err.request);
        setProdError("Aucune réponse du serveur, vérifiez la connexion.");
      } else {
        setProdError("Erreur: " + err.message);
      }
    } finally {
      setProdLoading(false);
    }
  };

  // Objectives
  const handleObjFileChange = (e) => {
    setObjFile(e.target.files[0]);
    setObjResult(null);
    setObjError("");
  };

  const handleObjUpload = async () => {
    if (!objFile) {
      setObjError("Veuillez sélectionner un fichier Excel d'objectifs.");
      return;
    }
    setObjLoading(true);
    setObjError("");
    setObjResult(null);

    const formData = new FormData();
    formData.append("file", objFile);

    try {
      const response = await axios.post(
        "http://localhost:8086/api/import/objectives",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      console.log("Réponse complète du backend (Objectives):", response);

      if (response.data && typeof response.data === "object") {
        setObjResult(response.data);
        console.log("Import Objectives réussi:", response.data);
      } else {
        setObjError("Format inattendu reçu du serveur : " + JSON.stringify(response.data));
        console.warn("Format inattendu (Objectives):", response.data);
      }
    } catch (err) {
      console.error("Erreur lors de l'import Objectives:", err);

      if (err.response) {
        console.log("Status:", err.response.status);
        console.log("Data:", err.response.data);
        setObjError("Erreur serveur: " + JSON.stringify(err.response.data));
      } else if (err.request) {
        console.log("Aucune réponse du serveur:", err.request);
        setObjError("Aucune réponse du serveur, vérifiez la connexion.");
      } else {
        setObjError("Erreur: " + err.message);
      }
    } finally {
      setObjLoading(false);
    }
  };

  // ----------------- UI -----------------

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-100 p-6 space-y-10">
      <div className="flex justify-center mb-6">
        <img src={logo} alt="Logo CDS" className="h-20 w-auto" />
      </div>

      {/* Section Import Production */}
      <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-lg">
        <h1 className="text-xl font-bold text-center mb-6 text-gray-800">
          Importer les données de Production
        </h1>

        {prodError && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{prodError}</div>}

        <input
          type="file"
          accept=".xlsx"
          onChange={handleProdFileChange}
          className="w-full mb-4 p-2 border rounded"
        />
        <button
          onClick={handleProdUpload}
          disabled={prodLoading}
          className="w-full bg-orange-400 text-white font-semibold py-3 rounded-lg shadow-md hover:bg-orange-500 disabled:opacity-50"
        >
          {prodLoading ? "Importation en cours..." : "Charger le fichier Production"}
        </button>

        {prodResult && (
          <div className="mt-6 bg-gray-50 p-4 rounded-lg shadow">
            <p className="text-green-600 font-semibold">Insertion : {prodResult.inserted}</p>
            <p className="text-blue-600 font-semibold">Mise à jour : {prodResult.updated}</p>
            {prodResult.errors?.length > 0 && (
              <div className="mt-2">
                <p className="text-red-600 font-semibold">Erreurs :</p>
                <ul className="list-disc list-inside text-sm text-red-500">
                  {prodResult.errors.map((err, idx) => (
                    <li key={idx}>{err}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Section Import Objectives */}
      <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-lg">
        <h1 className="text-xl font-bold text-center mb-6 text-gray-800">
          Importer les Objectifs
        </h1>

        {objError && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{objError}</div>}

        <input
          type="file"
          accept=".xlsx"
          onChange={handleObjFileChange}
          className="w-full mb-4 p-2 border rounded"
        />
        <button
          onClick={handleObjUpload}
          disabled={objLoading}
          className="w-full bg-blue-500 text-white font-semibold py-3 rounded-lg shadow-md hover:bg-blue-600 disabled:opacity-50"
        >
          {objLoading ? "Importation en cours..." : "Charger le fichier Objectifs"}
        </button>

        {objResult && (
          <div className="mt-6 bg-gray-50 p-4 rounded-lg shadow">
            <p className="text-green-600 font-semibold">Insertion : {objResult.inserted}</p>
            <p className="text-blue-600 font-semibold">Mise à jour : {objResult.updated}</p>
            {objResult.errors?.length > 0 && (
              <div className="mt-2">
                <p className="text-red-600 font-semibold">Erreurs :</p>
                <ul className="list-disc list-inside text-sm text-red-500">
                  {objResult.errors.map((err, idx) => (
                    <li key={idx}>{err}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bouton navigation */}
      <button
        onClick={() => navigate("/login")}
        className="mt-6 w-full max-w-lg bg-green-500 text-white font-semibold py-3 rounded-lg shadow-md hover:bg-green-600"
      >
        Continuer vers la connexion
      </button>
    </div>
  );
}

export default UploadPage;
