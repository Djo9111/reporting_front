import React, { useEffect, useState } from "react";
import axios from "axios";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import { useLocation, useNavigate } from "react-router-dom";
import "react-big-calendar/lib/css/react-big-calendar.css";

const localizer = momentLocalizer(moment);

function AppointmentPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { nomUtilisateur, nomComplet } = location.state || {};

  const [clients, setClients] = useState([]);
  const [events, setEvents] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);

  useEffect(() => {
    if (!nomUtilisateur) return; // si pas connecté
    // Charger clients
    const fetchClients = async () => {
      try {
        const res = await axios.get(
          `http://localhost:8086/api/import/my-contacts/${nomUtilisateur}`
        );
        setClients(res.data);
      } catch (err) {
        console.error("Erreur clients", err);
      }
    };

    // Charger rendez-vous
    const fetchAppointments = async () => {
      try {
        const res = await axios.get(
          `http://localhost:8086/api/appointments/manager/${nomUtilisateur}`
        );
        setEvents(
          res.data.map((rdv) => ({
            id: rdv.id,
            title: `${rdv.numeroClient} - ${rdv.objetRdv || "RDV"}`,
            start: new Date(rdv.dateRdv),
            end: new Date(
              new Date(rdv.dateRdv).getTime() + rdv.dureeMinutes * 60000
            ),
          }))
        );
      } catch (err) {
        console.error("Erreur RDV", err);
      }
    };

    fetchClients();
    fetchAppointments();
  }, [nomUtilisateur]);

  // Quand on sélectionne un créneau
  const handleSelectSlot = async ({ start }) => {
    if (!selectedClient) {
      alert("Veuillez sélectionner un client !");
      return;
    }

    const client = clients.find((c) => c.id === selectedClient);

    const newAppointment = {
      contactPlanId: client.id,
      nomUtilisateur,
      numeroClient: client.numeroClient,
      dateRdv: start,
      dureeMinutes: 30,
      typeRdv: "physique",
      objetRdv: "Entretien commercial",
      statutRdv: "PLANIFIE",
      commentaires: "",
    };

    try {
      const res = await axios.post(
        "http://localhost:8086/api/appointments",
        newAppointment
      );

      setEvents([
        ...events,
        {
          id: res.data.id,
          title: `${client.numeroClient} - ${res.data.objetRdv}`,
          start: new Date(res.data.dateRdv),
          end: new Date(
            new Date(res.data.dateRdv).getTime() +
              res.data.dureeMinutes * 60000
          ),
        },
      ]);

      alert("Rendez-vous planifié !");
    } catch (err) {
      console.error("Erreur RDV", err);
      alert("Impossible d’enregistrer le rendez-vous.");
    }
  };

  if (!nomUtilisateur) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="p-6 bg-white shadow rounded">
          <p className="text-red-500">
            Nom utilisateur manquant. Veuillez vous reconnecter.
          </p>
          <button
            onClick={() => navigate("/login")}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
          >
            Retour connexion
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      {/* Colonne gauche : Clients */}
      <div className="w-1/3 bg-gray-100 p-4 overflow-y-auto">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
        >
          ← Retour au menu
        </button>
        <h2 className="text-xl font-bold mb-4">Mes clients</h2>
        <ul>
          {clients.map((c) => (
            <li
              key={c.id}
              className={`p-2 mb-2 rounded cursor-pointer ${
                selectedClient === c.id
                  ? "bg-orange-400 text-white"
                  : "bg-white hover:bg-gray-200"
              }`}
              onClick={() => setSelectedClient(c.id)}
            >
              {c.client} ({c.numeroClient})
            </li>
          ))}
        </ul>
      </div>

      {/* Colonne droite : calendrier */}
      <div className="w-2/3 p-4">
        <h2 className="text-xl font-bold mb-4">
          Planning des rendez-vous ({nomComplet})
        </h2>
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 600 }}
          selectable
          onSelectSlot={handleSelectSlot}
        />
      </div>
    </div>
  );
}

export default AppointmentPage;
