import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function AdminPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get("http://localhost:8086/api/auth/users");
        setUsers(response.data);
      } catch (err) {
        setError("Impossible de charger la liste des utilisateurs.");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleSeePerformance = (nomUtilisateur) => {
    navigate("/home", { state: { nomUtilisateur } });
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-2xl">
        <h1 className="text-2xl font-extrabold text-center mb-6 text-gray-800">
           Liste des Utilisateurs
        </h1>

        {loading && <p className="text-center text-gray-500">Chargement...</p>}
        {error && <p className="text-center text-red-500">{error}</p>}

        {!loading && !error && (
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-200 text-left">
                <th className="p-3">Nom utilisateur</th>
                <th className="p-3">Nom complet</th>
                <th className="p-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user, idx) => (
                <tr key={idx} className="border-b">
                  <td className="p-3">{user.nomUtilisateur}</td>
                  <td className="p-3">{user.nomComplet}</td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => handleSeePerformance(user.nomUtilisateur)}
                      className="bg-orange-400 text-white px-4 py-2 rounded-lg hover:bg-orange-500"
                    >
                      Voir performance
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default AdminPage;
