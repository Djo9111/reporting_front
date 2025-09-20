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

  // ----------------- Handlers (inchangés) -----------------
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
  const renderUploadSection = (
    title,
    fileHandler,
    uploadHandler,
    result,
    error,
    loading,
    buttonClass
  ) => (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2">
        <span className="inline-block h-2 w-2 rounded-full bg-orange-500" />
        {title}
      </h2>

      {error && (
        <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mt-4">
        <input
          type="file"
          accept=".xlsx"
          onChange={fileHandler}
          className="block w-full cursor-pointer rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm file:mr-4 file:rounded-lg file:border-0 file:bg-orange-50 file:px-3 file:py-2 file:text-orange-700 hover:file:bg-orange-100 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
        />
      </div>

      <button
        onClick={uploadHandler}
        disabled={loading}
        className={`mt-4 w-full rounded-xl px-4 py-2 text-sm font-medium shadow-sm disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-orange-500/20 ${buttonClass}`}
      >
        {loading ? "Importation en cours..." : `Charger le fichier ${title}`}
      </button>

      {result && (
        <div className="mt-5 rounded-xl border border-gray-100 bg-gray-50 p-4">
          <p className="text-sm text-green-700">
            <span className="font-semibold">Insertion :</span> {result.inserted}
          </p>
          <p className="mt-1 text-sm text-blue-700">
            <span className="font-semibold">Mise à jour :</span> {result.updated}
          </p>
          {result.errors?.length > 0 && (
            <div className="mt-2">
              <p className="text-sm font-semibold text-red-700">Erreurs :</p>
              <ul className="ml-4 list-disc text-sm text-red-600">
                {result.errors.map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Fine barre brand */}
      <div className="h-0.5 w-full bg-orange-500" />

      {/* Header avec logo */}
      <header className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-orange-200/40">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <img src={logo} alt="CDS" className="h-8 w-auto object-contain" />
            <h1 className="text-lg font-bold">Import des données</h1>
          </div>
          <button
            onClick={() => navigate("/login")}
            className="rounded-lg bg-orange-500 px-3 py-2 text-sm font-medium text-white hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
          >
            Continuer vers la connexion
          </button>
        </div>
      </header>

      {/* Contenu */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Bandeau d’intro */}
        <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-600">
            Importez vos fichiers **Production**, **Objectifs** et **Plan de Contact** au format
            <span className="mx-1 rounded bg-orange-50 px-1.5 py-0.5 text-orange-700">.xlsx</span>.
          </p>
        </div>

        {/* Grille des 3 cartes pour réduire les vides */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {renderUploadSection(
            "Production",
            handleProdFileChange,
            handleProdUpload,
            prodResult,
            prodError,
            prodLoading,
            "bg-orange-500 text-white hover:bg-orange-600"
          )}

          {renderUploadSection(
            "Objectifs",
            handleObjFileChange,
            handleObjUpload,
            objResult,
            objError,
            objLoading,
            "bg-blue-600 text-white hover:bg-blue-700"
          )}

          {renderUploadSection(
            "Plan de Contact",
            handlePlanFileChange,
            handlePlanUpload,
            planResult,
            planError,
            planLoading,
            "bg-purple-600 text-white hover:bg-purple-700"
          )}
        </div>

        {/* CTA secondaire en bas (option) */}
        <div className="mt-8 flex justify-center">
          <button
            onClick={() => navigate("/login")}
            className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
          >
            Ou se connecter plus tard →
          </button>
        </div>
      </main>
    </div>
  );
}

export default UploadPage;
