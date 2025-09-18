import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import logo from "../assets/cds.png";

function UploadPage() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setResult(null);
    setError("");
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Veuillez sélectionner un fichier Excel (.xlsx)");
      return;
    }
    setLoading(true);
    setError("");
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post("http://localhost:8086/api/upload/excel", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResult(response.data);
    } catch (err) {
      console.error(err);
      setError("Échec de l'import. Vérifiez le fichier et réessayez.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-lg">
        <div className="flex justify-center mb-6">
          <img src={logo} alt="Logo CDS" className="h-20 w-auto" />
        </div>
        <h1 className="text-2xl font-extrabold text-center mb-6 text-gray-800">
          Importer les données hebdomadaires
        </h1>

        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
            {error}
          </div>
        )}

        <input
          type="file"
          accept=".xlsx"
          onChange={handleFileChange}
          className="w-full mb-4 p-2 border rounded"
        />
        <button
          onClick={handleUpload}
          disabled={loading}
          className="w-full bg-orange-400 text-white font-semibold py-3 rounded-lg shadow-md hover:bg-orange-500 disabled:opacity-50"
        >
          {loading ? "Importation en cours..." : "Charger le fichier"}
        </button>

        {result && (
          <div className="mt-6 bg-gray-50 p-4 rounded-lg shadow">
            <p className="text-green-600 font-semibold">
               Insertion : {result.inserted}
            </p>
            <p className="text-blue-600 font-semibold">
               Mise à jour : {result.updated}
            </p>
            {result.errors.length > 0 && (
              <div className="mt-2">
                <p className="text-red-600 font-semibold"> Erreurs :</p>
                <ul className="list-disc list-inside text-sm text-red-500">
                  {result.errors.map((err, idx) => (
                    <li key={idx}>{err}</li>
                  ))}
                </ul>
              </div>
            )}
            <button
              onClick={() => navigate("/login")}
              className="mt-4 w-full bg-green-500 text-white font-semibold py-2 rounded-lg shadow-md hover:bg-green-600"
            >
              Continuer vers la connexion
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default UploadPage;
