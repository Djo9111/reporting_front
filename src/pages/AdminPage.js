import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import logo from "../assets/cds.png"; // ← logo CDS

/** Session helper : lit depuis location.state ou localStorage */
const useAuthInfo = (location) => {
  const stateUser = location.state || {};
  const stored = JSON.parse(localStorage.getItem("sessionUser") || "{}");
  const nomUtilisateur = stateUser.nomUtilisateur || stored.nomUtilisateur;
  const nomComplet = stateUser.nomComplet || stored.nomComplet || "Administrateur";
  return { nomUtilisateur, nomComplet };
};

function AdminPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { nomUtilisateur, nomComplet } = useAuthInfo(location);

  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");

  // Redirect si pas connecté + persistance session
  useEffect(() => {
    if (!nomUtilisateur) {
      navigate("/login", { replace: true });
    } else {
      localStorage.setItem("sessionUser", JSON.stringify({ nomUtilisateur, nomComplet }));
    }
  }, [nomUtilisateur, nomComplet, navigate]);

  useEffect(() => {
    const fetchManagers = async () => {
      setLoading(true);
      setError("");
      try {
        // On ne garde que: nomComplet & nomUtilisateur
        const response = await axios.get("http://localhost:8086/api/auth/users");
        const rows = (response.data || []).map((m, i) => ({
          id: m.id ?? i,
          nomUtilisateur: m.nomUtilisateur ?? m.nom_utilisateur ?? "",
          nomComplet: m.nomComplet ?? m.nom ?? m.nom_complet ?? "",
        }));
        setManagers(rows);
      } catch (err) {
        console.error(err);
        setError("Impossible de charger la liste des gestionnaires.");
      } finally {
        setLoading(false);
      }
    };
    fetchManagers();
  }, []);

  const filtered = useMemo(() => {
    if (!q.trim()) return managers;
    const needle = q.toLowerCase();
    return managers.filter((m) =>
      [m.nomComplet, m.nomUtilisateur].join(" ").toLowerCase().includes(needle)
    );
  }, [q, managers]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("sessionUser");
    navigate("/login", { replace: true });
  };

  const goto = (path, state) => navigate(path, { state });
  const seePerf = (m) =>
    goto("/home", { nomUtilisateur: m.nomUtilisateur, nomComplet: m.nomComplet || m.nomUtilisateur });
  const seeClients = (m) =>
    goto("/clients", { nomUtilisateur: m.nomUtilisateur, nomComplet: m.nomComplet || m.nomUtilisateur });
  const seePlanning = (m) =>
    goto("/appointments", { nomUtilisateur: m.nomUtilisateur, nomComplet: m.nomComplet || m.nomUtilisateur });

  if (!nomUtilisateur) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Redirection vers la connexion…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Fine barre de brand en haut */}
      <div className="h-0.5 w-full bg-orange-500" />

      {/* Header avec logo + accents orange discrets */}
      <header className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-orange-200/40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/dashboard")}
              className="hidden sm:inline-flex px-3 py-2 text-sm rounded-lg border border-gray-200 hover:bg-gray-50"
            >
              ← Tableau de bord
            </button>
            <img src={logo} alt="CDS" className="h-8 w-auto object-contain" />
            <h1 className="font-bold text-lg">Administration — Gestionnaires</h1>
            {!loading && (
              <span className="ml-2 text-sm text-gray-500">{filtered.length} résultat(s)</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/clients", { state: { nomUtilisateur, nomComplet } })}
              className="px-3 py-2 text-sm rounded-lg border border-gray-200 hover:bg-gray-50"
            >
              Mes clients
            </button>
            <button
              onClick={() => navigate("/home", { state: { nomUtilisateur, nomComplet } })}
              className="px-3 py-2 text-sm rounded-lg border border-gray-200 hover:bg-gray-50"
            >
              Mes performances
            </button>
            <button
              onClick={() => navigate("/appointments", { state: { nomUtilisateur, nomComplet } })}
              className="px-3 py-2 text-sm rounded-lg bg-orange-500 text-white hover:bg-orange-600"
            >
              Mes RDV
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
        {/* Barre outils */}
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <input
            type="text"
            placeholder="Rechercher (nom ou identifiant)…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full sm:w-[420px] px-3 py-2 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20"
          />
          <div className="text-sm text-gray-600">
            Connecté : <span className="font-medium">{nomComplet}</span>
          </div>
        </div>

        {/* Tableau (Nom / Identifiant / Actions) */}
        <div className="mt-4 rounded-2xl border border-gray-200 bg-white overflow-hidden">
          {loading ? (
            <SkeletonRows />
          ) : error ? (
            <div className="p-6 text-red-600">{error}</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-gray-500">Aucun gestionnaire trouvé.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <Th>Gestionnaire</Th>
                    <Th>Identifiant</Th>
                    <Th className="text-center">Actions</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((m) => (
                    <tr key={m.id} className="hover:bg-gray-50">
                      <Td className="font-medium">{m.nomComplet || "—"}</Td>
                      <Td>{m.nomUtilisateur || "—"}</Td>
                      <Td>
                        <div className="flex flex-wrap gap-2 justify-center">
                          <button
                            onClick={() => seePerf(m)}
                            className="px-3 py-1.5 rounded-md border border-gray-200 hover:bg-gray-50"
                          >
                            Performances
                          </button>
                          <button
                            onClick={() => seeClients(m)}
                            className="px-3 py-1.5 rounded-md border border-gray-200 hover:bg-gray-50"
                          >
                            Clients
                          </button>
                          <button
                            onClick={() => seePlanning(m)}
                            className="px-3 py-1.5 rounded-md bg-orange-500 text-white hover:bg-orange-600"
                          >
                            Planning
                          </button>
                        </div>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

/* Helpers table + skeleton */
function Th({ children, className = "" }) {
  return (
    <th className={`text-left font-semibold text-gray-700 px-4 py-3 ${className}`}>
      {children}
    </th>
  );
}
function Td({ children, className = "" }) {
  return <td className={`px-4 py-3 ${className}`}>{children}</td>;
}
function SkeletonRows() {
  const Row = () => (
    <div className="grid grid-cols-3 gap-4 px-4 py-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="h-4 rounded bg-gray-200 animate-pulse"></div>
      ))}
    </div>
  );
  return (
    <div className="divide-y divide-gray-100">
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="grid grid-cols-3 gap-4 px-4 py-3">
          {["Gestionnaire", "Identifiant", "Actions"].map((h) => (
            <div key={h} className="h-4 w-24 bg-gray-100 rounded"></div>
          ))}
        </div>
      </div>
      {Array.from({ length: 8 }).map((_, i) => (
        <Row key={i} />
      ))}
    </div>
  );
}

export default AdminPage;
