import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import logo from "../assets/cds.png"; // chemin vérifié

function LoginPage() {
  const [nomUtilisateur, setNomUtilisateur] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const normalizeUsername = (v) => (v || "").trim();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const user = normalizeUsername(nomUtilisateur);
    if (!user) return setError("Veuillez saisir votre nom d'utilisateur.");
    if (!motDePasse) return setError("Veuillez saisir votre mot de passe.");

    setLoading(true);
    try {
      // 1) Auth
      const resp = await axios.post("http://localhost:8086/api/auth/login", {
        nomUtilisateur: user,
        motDePasse,
      });

      if (resp.status !== 200) {
        throw new Error("Authentification échouée.");
      }

      const data = resp.data || {};
      // Essayons de récupérer un token et des infos utilisateur si déjà incluses
      if (data.token) {
        localStorage.setItem("token", data.token);
      }

      // 2) Construire une sessionUser à partir de la réponse + fallback via /user
      let sessionUser = {
        nomUtilisateur: user,
        nomComplet: data.nomComplet || "", // pourra être complété après
        codeAgence: data.codeAgence || "",
        telephone: data.telephone || "",
        email: data.email || "",
        porteFeuille: data.porteFeuille || data.portefeuille || "",
        fonction: data.fonction || "",
      };

      if (!sessionUser.nomComplet) {
        try {
          const userInfo = await axios.get(
            `http://localhost:8086/api/auth/user/${encodeURIComponent(user)}`
          );
          const u = userInfo.data || {};
          // Le contrôleur garantit au moins nomComplet s’il existe
          sessionUser.nomComplet = u.nomComplet || sessionUser.nomComplet || user;
          // S’il renvoie d’autres champs, on les prend (robuste si tu les ajoutes plus tard)
          sessionUser.codeAgence = u.codeAgence || sessionUser.codeAgence;
          sessionUser.telephone = u.telephone || sessionUser.telephone;
          sessionUser.email = u.email || sessionUser.email;
          sessionUser.porteFeuille =
            u.porteFeuille || u.portefeuille || sessionUser.porteFeuille;
          sessionUser.fonction = u.fonction || sessionUser.fonction;
        } catch {
          // pas bloquant : on garde au moins l’identifiant
          if (!sessionUser.nomComplet) sessionUser.nomComplet = user;
        }
      }

      // 3) Persistance session + "remember me"
      localStorage.setItem("sessionUser", JSON.stringify(sessionUser));
      if (!remember) {
        // si tu préfères sessionStorage, remplace ici
      }

      // 4) Navigation vers le dashboard avec state
      navigate("/dashboard", {
        replace: true,
        state: { nomUtilisateur: sessionUser.nomUtilisateur, nomComplet: sessionUser.nomComplet },
      });
    } catch (err) {
      console.error(err);
      const serverMsg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Nom d'utilisateur ou mot de passe incorrect.";
      setError(serverMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 via-white to-orange-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Carte */}
        <div className="bg-white rounded-3xl border border-orange-200/60 shadow-xl shadow-orange-100/60 overflow-hidden">
          {/* Bandeau haut orange avec logo */}
          <div className="bg-orange-500/90 text-white px-6 py-5 flex items-center gap-3">
            <img src={logo} alt="Logo" className="h-10 w-auto object-contain" />
            <div>
              <div className="text-lg font-semibold leading-tight">
                Portail Gestion Commerciale
              </div>
              <div className="text-xs text-white/90">
                Authentification sécurisée
              </div>
            </div>
          </div>

          {/* Corps */}
          <div className="px-6 py-6">
            <h1 className="text-xl font-bold text-gray-800">Se connecter</h1>
            <p className="text-sm text-gray-500 mt-1">
              Accédez à votre tableau de bord
            </p>

            {error && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Nom d'utilisateur
                </label>
                <input
                  autoFocus
                  type="text"
                  placeholder="ex: mjalloh"
                  value={nomUtilisateur}
                  onChange={(e) => setNomUtilisateur(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-orange-400/30"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Mot de passe
                </label>
                <div className="mt-1 relative">
                  <input
                    type={showPwd ? "text" : "password"}
                    placeholder="••••••••"
                    value={motDePasse}
                    onChange={(e) => setMotDePasse(e.target.value)}
                    className="w-full px-3 py-2 pr-10 rounded-xl border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-orange-400/30"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd((v) => !v)}
                    className="absolute inset-y-0 right-0 px-3 text-gray-500 hover:text-gray-700"
                    aria-label={showPwd ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                  >
                    {showPwd ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="inline-flex items-center gap-2 text-sm text-gray-600">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                  />
                  Rester connecté
                </label>

                <a
                  href="#"
                  className="text-sm text-orange-600 hover:text-orange-700"
                  onClick={(e) => e.preventDefault()}
                  title="Contactez l'admin pour réinitialiser"
                >
                  Mot de passe oublié ?
                </a>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full flex items-center justify-center gap-2 bg-orange-500 text-white font-semibold py-2.5 rounded-xl shadow-md hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2 transition ${
                  loading ? "opacity-70 cursor-not-allowed" : ""
                }`}
              >
                {loading ? (
                  <>
                    <span className="h-5 w-5 border-2 border-white/60 border-t-transparent rounded-full animate-spin" />
                    Connexion…
                  </>
                ) : (
                  "Se connecter"
                )}
              </button>
            </form>

            <div className="mt-5 text-xs text-gray-500">
              En vous connectant, vous acceptez nos conditions d’utilisation.
            </div>
          </div>
        </div>

        {/* Footer mini */}
        <div className="text-center text-xs text-gray-500 mt-3">
          © {new Date().getFullYear()} CDS — Tous droits réservés.
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
