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

  // --- Contact Plans ---
  const [planFile, setPlanFile] = useState(null);
  const [planResult, setPlanResult] = useState(null);
  const [planError, setPlanError] = useState("");
  const [planLoading, setPlanLoading] = useState(false);

  // ----------------- Handlers -----------------

  // Production
  const handleProdFileChange = (e) => {
    setProdFile(e.target.files[0]);
    setProdResult(null);
    setProdError("");
  };
  const handleProdUpload = async () => {
    if (!prodFile) { setProdError("Veuillez sélectionner un fichier Excel de production."); return; }
    setProdLoading(true); setProdError(""); setProdResult(null);
    const formData = new FormData(); formData.append("file", prodFile);

    try {
      const response = await axios.post("http://localhost:8086/api/upload/excel", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setProdResult(response.data);
    } catch (err) {
      console.error(err);
      setProdError(err.response?.data ? JSON.stringify(err.response.data) : "Aucune réponse du serveur.");
    } finally { setProdLoading(false); }
  };

  // Objectives
  const handleObjFileChange = (e) => {
    setObjFile(e.target.files[0]);
    setObjResult(null);
    setObjError("");
  };
  const handleObjUpload = async () => {
    if (!objFile) { setObjError("Veuillez sélectionner un fichier Excel d'objectifs."); return; }
    setObjLoading(true); setObjError(""); setObjResult(null);
    const formData = new FormData(); formData.append("file", objFile);

    try {
      const response = await axios.post("http://localhost:8086/api/import/objectives", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setObjResult(response.data);
    } catch (err) {
      console.error(err);
      setObjError(err.response?.data ? JSON.stringify(err.response.data) : "Aucune réponse du serveur.");
    } finally { setObjLoading(false); }
  };

  // Contact Plans
  const handlePlanFileChange = (e) => {
    setPlanFile(e.target.files[0]);
    setPlanResult(null);
    setPlanError("");
  };
  const handlePlanUpload = async () => {
    if (!planFile) { setPlanError("Veuillez sélectionner un fichier Excel Plan de Contact."); return; }
    setPlanLoading(true); setPlanError(""); setPlanResult(null);
    const formData = new FormData(); formData.append("file", planFile);

    try {
      const response = await axios.post("http://localhost:8086/api/import/contact-plans", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setPlanResult(response.data);
    } catch (err) {
      console.error(err);
      setPlanError(err.response?.data ? JSON.stringify(err.response.data) : "Aucune réponse du serveur.");
    } finally { setPlanLoading(false); }
  };

  // ----------------- UI -----------------

  const renderUploadSection = (title, fileHandler, uploadHandler, result, error, loading, buttonColor) => (
    <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-lg">
      <h1 className="text-xl font-bold text-center mb-6 text-gray-800">{title}</h1>
      {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}
      <input type="file" accept=".xlsx" onChange={fileHandler} className="w-full mb-4 p-2 border rounded" />
      <button
        onClick={uploadHandler}
        disabled={loading}
        className={`w-full ${buttonColor} text-white font-semibold py-3 rounded-lg shadow-md disabled:opacity-50`}
      >
        {loading ? "Importation en cours..." : `Charger le fichier ${title}`}
      </button>
      {result && (
        <div className="mt-6 bg-gray-50 p-4 rounded-lg shadow">
          <p className="text-green-600 font-semibold">Insertion : {result.inserted}</p>
          <p className="text-blue-600 font-semibold">Mise à jour : {result.updated}</p>
          {result.errors?.length > 0 && (
            <div className="mt-2">
              <p className="text-red-600 font-semibold">Erreurs :</p>
              <ul className="list-disc list-inside text-sm text-red-500">
                {result.errors.map((err, idx) => <li key={idx}>{err}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-100 p-6 space-y-10">
      <div className="flex justify-center mb-6"><img src={logo} alt="Logo CDS" className="h-20 w-auto" /></div>

      {renderUploadSection("Production", handleProdFileChange, handleProdUpload, prodResult, prodError, prodLoading, "bg-orange-400 hover:bg-orange-500")}
      {renderUploadSection("Objectifs", handleObjFileChange, handleObjUpload, objResult, objError, objLoading, "bg-blue-500 hover:bg-blue-600")}
      {renderUploadSection("Plan de Contact", handlePlanFileChange, handlePlanUpload, planResult, planError, planLoading, "bg-purple-500 hover:bg-purple-600")}

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
