import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import logo from "../assets/cds.png"; // ← logo CDS

/** -------- Utils session / auth ---------- */
const useAuthInfo = (location) => {
  const stateUser = location.state || {};
  const stored = JSON.parse(localStorage.getItem("sessionUser") || "{}");
  const nomUtilisateur = stateUser.nomUtilisateur || stored.nomUtilisateur;
  const nomComplet = stateUser.nomComplet || stored.nomComplet || "Utilisateur";
  return { nomUtilisateur, nomComplet };
};

/** --------- DonutGauge (SVG sans lib) ---------
 * props:
 *  - label: string
 *  - value: number
 *  - objectif: number (>0)
 *  - size: px (facultatif)
 */
function DonutGauge({ label, value = 0, objectif = 100, size = 160 }) {
  const pct = objectif > 0 ? Math.max(0, Math.min(1, value / objectif)) : 0;
  const percentDisplay = Math.round(pct * 100);

  // Couleur par seuil
  const color =
    pct >= 1 ? "#16a34a" : pct >= 0.7 ? "#f59e0b" : "#ef4444"; // vert / ambre / rouge

  const stroke = 12;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = c * pct;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 flex flex-col shadow-sm">
      <div className="text-sm text-gray-600 mb-2">{label}</div>
      <div className="mx-auto relative" style={{ width: size, height: size }}>
        {/* fond */}
        <svg width={size} height={size}>
          <defs>
            <linearGradient id="gaugeGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={color} />
              <stop offset="100%" stopColor="#111827" />
            </linearGradient>
          </defs>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth={stroke}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="url(#gaugeGrad)"
            strokeWidth={stroke}
            strokeDasharray={`${dash} ${c - dash}`}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </svg>

        {/* Valeurs au centre */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-2xl font-semibold" style={{ color }}>
            {percentDisplay}%
          </div>
          <div className="text-xs text-gray-500">
            {value} / {objectif}
          </div>
        </div>
      </div>
    </div>
  );
}

/** ------- Barre de progression simple ------- */
function ProgressBar({ value = 0, max = 100 }) {
  const pct = max > 0 ? Math.max(0, Math.min(100, Math.round((value / max) * 100))) : 0;
  const color =
    pct >= 100 ? "bg-green-600" : pct >= 70 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
      <div
        className={`h-full ${color} transition-all`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function HomePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { nomUtilisateur, nomComplet } = useAuthInfo(location);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [performanceData, setPerformanceData] = useState([]);

  // Redirect si pas de session
  useEffect(() => {
    if (!nomUtilisateur) {
      navigate("/login", { replace: true });
    }
  }, [nomUtilisateur, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      if (!nomUtilisateur) return;
      setLoading(true);
      setError(null);
      try {
        const resp = await axios.get(
          `http://localhost:8086/api/auth/performance/${nomUtilisateur}`
        );
        setPerformanceData(Array.isArray(resp.data) ? resp.data : []);
      } catch (e) {
        console.error(e);
        setError(
          "Impossible de charger les données de performance. Réessayez plus tard."
        );
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [nomUtilisateur]);

  const kpis = useMemo(() => {
    const objectifTotal = performanceData.reduce((s, it) => s + (it.objectif || 0), 0);
    const realiseTotal = performanceData.reduce((s, it) => s + (it.realisation || 0), 0);
    const taux = objectifTotal > 0 ? Math.round((realiseTotal / objectifTotal) * 100) : 0;
    return { objectifTotal, realiseTotal, taux };
  }, [performanceData]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("sessionUser");
    navigate("/login", { replace: true });
  };
  const goto = (path) => navigate(path, { state: { nomUtilisateur, nomComplet } });

  if (!nomUtilisateur) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Brand bar fine en haut */}
      <div className="h-0.5 w-full bg-orange-500" />

      {/* Header avec logo + accents orange discrets */}
      <header className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-orange-200/40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/dashboard", { state: { nomUtilisateur, nomComplet } })}
              className="hidden sm:inline-flex px-3 py-2 text-sm rounded-lg border border-gray-200 hover:bg-gray-50"
            >
              ← Tableau de bord
            </button>
            <img src={logo} alt="CDS" className="h-8 w-auto object-contain" />
            <h1 className="font-bold text-lg">Performances</h1>
            {!loading && (
              <span className="ml-2 text-sm text-gray-500">
                {performanceData.length} indicateur(s)
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => goto("/clients")}
              className="px-3 py-2 text-sm rounded-lg border border-gray-200 hover:bg-gray-50"
            >
              Mes clients
            </button>
            <button
              onClick={() => goto("/appointments")}
              className="px-3 py-2 text-sm rounded-lg bg-orange-500 text-white hover:bg-orange-600"
            >
              Planifier un RDV
            </button>
            <button
              onClick={handleLogout}
              className="px-3 py-2 text-sm rounded-lg bg-gray-900 text-white hover:bg-gray-800"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      {/* Contenu */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Bandeau utilisateur + KPIs */}
        <section className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-orange-200 bg-orange-50 p-4">
            <div className="text-xs text-orange-700">Gestionnaire</div>
            <div className="text-base font-semibold text-gray-900">{nomComplet}</div>
            <div className="mt-2 text-xs text-gray-600">
              {new Date().toLocaleDateString("fr-FR")}
            </div>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-4">
            <div className="text-xs text-gray-500">Objectif total</div>
            <div className="text-2xl font-bold">{kpis.objectifTotal}</div>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-4">
            <div className="text-xs text-gray-500">Réalisé total</div>
            <div className="text-2xl font-bold">{kpis.realiseTotal}</div>
            <div className="mt-2 text-sm text-gray-600">
              Taux global : <span className="font-semibold">{kpis.taux}%</span>
            </div>
          </div>
        </section>

        {/* États globaux */}
        {loading ? (
          <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 text-gray-500">
            Chargement des données…
          </div>
        ) : error ? (
          <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 text-red-600">
            {error}
          </div>
        ) : performanceData.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 text-gray-500">
            Aucune donnée de performance disponible.
          </div>
        ) : (
          <>
            {/* Grille de jauges */}
            <section className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {performanceData.map((it) => (
                <DonutGauge
                  key={it.indicateur}
                  label={it.indicateur}
                  value={it.realisation || 0}
                  objectif={it.objectif || 0}
                />
              ))}
            </section>

            {/* Tableau récap avec progress bars */}
            <section className="mt-6 rounded-2xl border border-gray-200 bg-white overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <Th>Indicateur</Th>
                      <Th>Objectif</Th>
                      <Th>Réalisé</Th>
                      <Th>Taux</Th>
                      <Th>Progression</Th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {performanceData.map((it) => {
                      const obj = it.objectif || 0;
                      const rea = it.realisation || 0;
                      const taux = obj > 0 ? Math.round((rea / obj) * 100) : 0;
                      return (
                        <tr key={`${it.indicateur}-row`} className="hover:bg-gray-50">
                          <Td className="font-medium">{it.indicateur}</Td>
                          <Td>{obj}</Td>
                          <Td>{rea}</Td>
                          <Td>{taux}%</Td>
                          <Td>
                            <ProgressBar value={rea} max={obj} />
                          </Td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

/* Table helpers */
function Th({ children }) {
  return (
    <th className="text-left font-semibold text-gray-700 px-4 py-3">
      {children}
    </th>
  );
}
function Td({ children, className = "" }) {
  return <td className={`px-4 py-3 ${className}`}>{children}</td>;
}

export default HomePage;
