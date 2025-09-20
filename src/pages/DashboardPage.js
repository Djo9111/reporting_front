import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import logo from "../assets/cds.png"; // ← logo CDS

// Utilitaire : lecture user depuis location.state ou storage
const useAuthInfo = (location) => {
  const stateUser = location.state || {};
  const stored = JSON.parse(localStorage.getItem("sessionUser") || "{}");
  const nomUtilisateur = stateUser.nomUtilisateur || stored.nomUtilisateur;
  const nomComplet = stateUser.nomComplet || stored.nomComplet;
  return { nomUtilisateur, nomComplet };
};

function DashboardPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { nomUtilisateur, nomComplet } = useAuthInfo(location);

  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Persister l’utilisateur pour la navigation inter-pages
  useEffect(() => {
    if (nomUtilisateur) {
      localStorage.setItem(
        "sessionUser",
        JSON.stringify({ nomUtilisateur, nomComplet })
      );
    }
  }, [nomUtilisateur, nomComplet]);

  // Si pas connecté → /login
  useEffect(() => {
    if (!nomUtilisateur) {
      navigate("/login", { replace: true });
    }
  }, [nomUtilisateur, navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("sessionUser");
    navigate("/login", { replace: true });
  };

  const gotoClients = () => navigate("/clients", { state: { nomUtilisateur, nomComplet } });
  const gotoPerf    = () => navigate("/home",   { state: { nomUtilisateur, nomComplet } });
  const gotoRdv     = () => navigate("/appointments", { state: { nomUtilisateur, nomComplet } });

  if (!nomUtilisateur) return null; // le redirect fera le boulot

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Brand bar fine en haut */}
      <div className="h-0.5 w-full bg-orange-500" />

      {/* Header */}
      <header className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-orange-200/40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Burger mobile */}
            <button
              aria-label="Ouvrir le menu"
              className="md:hidden inline-flex items-center justify-center rounded-lg border border-gray-200 w-10 h-10"
              onClick={() => setSidebarOpen((v) => !v)}
            >
              <span className="sr-only">Menu</span>
              <div className="space-y-1.5">
                <span className="block w-5 h-0.5 bg-gray-700"></span>
                <span className="block w-5 h-0.5 bg-gray-700"></span>
                <span className="block w-5 h-0.5 bg-gray-700"></span>
              </div>
            </button>

            {/* Logo + titre */}
            <img src={logo} alt="CDS" className="h-8 w-auto object-contain" />
            <div className="font-extrabold text-xl tracking-tight">
              Tableau de bord
            </div>
            {/* Pastille marque légère */}
            <span className="ml-2 inline-flex items-center rounded-full bg-orange-50 text-orange-700 border border-orange-200 px-2 py-0.5 text-xs">
              CDS
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-sm text-gray-600">
              Connecté en tant que{" "}
              <span className="font-semibold text-gray-800">{nomComplet}</span>
            </div>
            <button
              onClick={handleLogout}
              className="px-3 py-2 text-sm font-medium rounded-lg bg-gray-900 text-white hover:bg-gray-800"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 grid grid-cols-1 md:grid-cols-[240px_1fr] gap-6">
        {/* Sidebar */}
        <aside
          className={`${
            sidebarOpen ? "block" : "hidden"
          } md:block bg-white border border-gray-200 rounded-2xl p-3 h-fit md:sticky md:top-24`}
        >
          <nav className="space-y-1">
            <SidebarLink label="Mes clients" onClick={gotoClients} />
            <SidebarLink label="Mes performances" onClick={gotoPerf} />
            <SidebarLink label="Planifier un RDV" onClick={gotoRdv} />
          </nav>

          <div className="mt-4 pt-4 border-t border-gray-200">
            <button
              onClick={handleLogout}
              className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-orange-50"
            >
              Se déconnecter
            </button>
          </div>
        </aside>

        {/* Contenu principal : cartes d’actions */}
        <main>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <ActionCard
              title="Voir mes clients"
              desc="Consulter la liste, rechercher et accéder aux fiches."
              cta="Ouvrir"
              onClick={gotoClients}
            />
            <ActionCard
              title="Voir mes performances"
              desc="Suivre vos indicateurs et objectifs."
              cta="Analyser"
              onClick={gotoPerf}
            />
            <ActionCard
              title="Planifier un rendez-vous"
              desc="Créer, modifier et visualiser vos RDV."
              cta="Planifier"
              onClick={gotoRdv}
            />
          </div>

          {/* Bandeau d’info compact avec accent orange */}
          <div className="mt-6">
            <div className="rounded-2xl border border-orange-200 bg-orange-50 p-4">
              <p className="text-sm text-orange-800">
                Astuce : vous pouvez accéder à ces sections via la barre latérale à tout moment.
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

/** Composants UI simples (dans le même fichier .js) */
function SidebarLink({ label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left px-3 py-2 rounded-lg hover:bg-orange-50 hover:text-orange-700 text-sm transition-colors"
    >
      {label}
    </button>
  );
}

function ActionCard({ title, desc, cta, onClick }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 flex flex-col shadow-sm">
      <div className="flex-1">
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="mt-1 text-sm text-gray-600">{desc}</p>
      </div>
      <div className="mt-4">
        <button
          onClick={onClick}
          className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 w-full transition-colors"
        >
          {cta}
        </button>
      </div>
    </div>
  );
}

export default DashboardPage;
