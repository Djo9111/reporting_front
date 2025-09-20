import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import logo from "../assets/cds.png"; // ← logo CDS

// --- util pour lire l'utilisateur depuis state ou storage
const useAuthInfo = (location) => {
  const stateUser = location.state || {};
  const stored = JSON.parse(localStorage.getItem("sessionUser") || "{}");
  const nomUtilisateur = stateUser.nomUtilisateur || stored.nomUtilisateur;
  const nomComplet = stateUser.nomComplet || stored.nomComplet;
  return { nomUtilisateur, nomComplet };
};

function ClientListPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { nomUtilisateur, nomComplet } = useAuthInfo(location);

  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [q, setQ] = useState(""); // recherche

  // redirect si non connecté
  useEffect(() => {
    if (!nomUtilisateur) {
      navigate("/login", { replace: true });
    }
  }, [nomUtilisateur, navigate]);

  useEffect(() => {
    if (!nomUtilisateur) return;
    const fetchClients = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await axios.get(
          `http://localhost:8086/api/import/my-contacts/${nomUtilisateur}`
        );
        setClients(res.data || []);
      } catch (err) {
        console.error(err);
        setError("Impossible de charger la liste des clients.");
      } finally {
        setLoading(false);
      }
    };
    fetchClients();
  }, [nomUtilisateur]);

  const filtered = useMemo(() => {
    if (!q.trim()) return clients;
    const needle = q.toLowerCase();
    return clients.filter((c) => {
      const line = [
        c.client,
        c.numeroClient,
        c.agence,
        c.motifDeContact,
        c.email,
        c.telephone,
      ]
        .join(" ")
        .toLowerCase();
      return line.includes(needle);
    });
  }, [q, clients]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("sessionUser");
    navigate("/login", { replace: true });
  };

  const goto = (path) =>
    navigate(path, { state: { nomUtilisateur, nomComplet } });

  if (!nomUtilisateur) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Brand bar fine en haut */}
      <div className="h-0.5 w-full bg-orange-500" />

      {/* Header compact */}
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
            <h1 className="font-bold text-lg">Mes clients</h1>
            <span className="ml-2 text-sm text-gray-500">
              {loading ? "Chargement..." : `${filtered.length} résultat(s)`}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => goto("/appointments")}
              className="px-3 py-2 text-sm rounded-lg bg-orange-500 text-white hover:bg-orange-600"
            >
              Planifier un RDV
            </button>
            <button
              onClick={() => goto("/home")}
              className="px-3 py-2 text-sm rounded-lg border border-gray-200 hover:bg-gray-50"
            >
              Performances
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
          <div className="flex-1">
            <input
              type="text"
              placeholder="Rechercher (nom, numéro, agence, email, téléphone...)"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="w-full sm:w-[480px] px-3 py-2 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20"
            />
          </div>
          <div className="text-sm text-gray-600">
            Connecté : <span className="font-medium">{nomComplet}</span>
          </div>
        </div>

        {/* Tableau / états */}
        <div className="mt-4 rounded-2xl border border-gray-200 bg-white overflow-hidden">
          {loading ? (
            <SkeletonRows />
          ) : error ? (
            <div className="p-6 text-red-600">{error}</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              Aucun client trouvé. Essayez un autre terme de recherche.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <Th>Client</Th>
                    <Th>Numéro client</Th>
                    <Th>Agence</Th>
                    <Th>Motif</Th>
                    <Th>Email</Th>
                    <Th>Téléphone</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50 cursor-default">
                      <Td className="font-medium">{c.client}</Td>
                      <Td>{c.numeroClient}</Td>
                      <Td>{c.agence}</Td>
                      <Td title={c.motifDeContact || ""}>
                        {c.motifDeContact || "—"}
                      </Td>
                      <Td>
                        {c.email ? (
                          <a
                            className="text-blue-600 hover:underline"
                            href={`mailto:${c.email}`}
                          >
                            {c.email}
                          </a>
                        ) : (
                          "—"
                        )}
                      </Td>
                      <Td>{c.telephone || "—"}</Td>
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

/* Petits composants table + skeleton pour un rendu propre */
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

function SkeletonRows() {
  const Row = () => (
    <div className="grid grid-cols-6 gap-4 px-4 py-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-4 rounded bg-gray-200 animate-pulse"></div>
      ))}
    </div>
  );
  return (
    <div className="divide-y divide-gray-100">
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="grid grid-cols-6 gap-4 px-4 py-3">
          {["Client", "Numéro client", "Agence", "Motif", "Email", "Téléphone"].map(
            (h) => (
              <div key={h} className="h-4 w-24 bg-gray-100 rounded"></div>
            )
          )}
        </div>
      </div>
      {Array.from({ length: 8 }).map((_, i) => (
        <Row key={i} />
      ))}
    </div>
  );
}

export default ClientListPage;
