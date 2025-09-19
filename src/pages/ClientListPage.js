import React, { useEffect, useState } from "react";
import axios from "axios";

function ClientListPage({ nomUtilisateur, nomComplet, goBack }) {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const res = await axios.get(`http://localhost:8086/api/import/my-contacts/${nomUtilisateur}`);
        setClients(res.data);
      } catch (err) {
        console.error(err);
        setError("Impossible de charger la liste des clients.");
      } finally {
        setLoading(false);
      }
    };
    fetchClients();
  }, [nomUtilisateur]);

  if (loading) return <p className="text-center mt-10">Chargement des clients...</p>;
  if (error) return <p className="text-red-500 text-center mt-10">{error}</p>;

  return (
    <div className="container mx-auto p-8">
      <button onClick={goBack} className="mb-6 px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500">
        ← Retour au menu
      </button>
      <h2 className="text-2xl font-bold mb-4">Mes clients</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white shadow-md rounded-lg overflow-hidden">
          <thead className="bg-gray-200">
            <tr>
              <th className="py-2 px-4">Client</th>
              <th className="py-2 px-4">Numéro client</th>
              <th className="py-2 px-4">Agence</th>
              <th className="py-2 px-4">Motif</th>
              <th className="py-2 px-4">Email</th>
              <th className="py-2 px-4">Téléphone</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((c) => (
              <tr key={c.id} className="border-b hover:bg-gray-50">
                <td className="py-2 px-4">{c.client}</td>
                <td className="py-2 px-4">{c.numeroClient}</td>
                <td className="py-2 px-4">{c.agence}</td>
                <td className="py-2 px-4">{c.motifDeContact}</td>
                <td className="py-2 px-4">{c.email}</td>
                <td className="py-2 px-4">{c.telephone}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ClientListPage;
