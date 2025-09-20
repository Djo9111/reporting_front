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
  const [pendingAppointment, setPendingAppointment] = useState(null);
  const [objetRdv, setObjetRdv] = useState("");
  const [commentaires, setCommentaires] = useState("");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [statutRdv, setStatutRdv] = useState("PLANIFIE");

  // Nouveaux états pour l'édition de la date & durée
  const [editStart, setEditStart] = useState("");    // input datetime-local
  const [editDuree, setEditDuree] = useState(30);    // minutes

  useEffect(() => {
    if (!nomUtilisateur) return;

    const fetchClients = async () => {
      try {
        const res = await axios.get(
          `http://localhost:8086/api/import/my-contacts/${nomUtilisateur}`
        );
        setClients(res.data);
      } catch (err) {
        console.error("Erreur chargement clients", err);
      }
    };

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
            end: new Date(new Date(rdv.dateRdv).getTime() + rdv.dureeMinutes * 60000),
            objetRdv: rdv.objetRdv,
            commentaires: rdv.commentaires,
            statutRdv: rdv.statutRdv,
            numeroClient: rdv.numeroClient,
            nomUtilisateur: rdv.nomUtilisateur,
            contactPlanId: rdv.contactPlanId,
            typeRdv: rdv.typeRdv,
            dureeMinutes: rdv.dureeMinutes,
          }))
        );
      } catch (err) {
        console.error("Erreur chargement RDV", err);
      }
    };

    fetchClients();
    fetchAppointments();
  }, [nomUtilisateur]);

  const handleSelectSlot = ({ start }) => {
    if (!selectedClient) {
      alert("Veuillez sélectionner un client !");
      return;
    }
    const client = clients.find((c) => c.id === selectedClient);

    setPendingAppointment({
      client,
      start,
      end: new Date(start.getTime() + 30 * 60000),
    });
    setObjetRdv("");
    setCommentaires("");
  };

  const confirmAppointment = async () => {
    if (!pendingAppointment) return;
    if (!objetRdv.trim()) {
      alert("Veuillez renseigner l'objet du RDV !");
      return;
    }

    const { client, start } = pendingAppointment;

    const newAppointment = {
      contactPlanId: client.id,
      nomUtilisateur,
      numeroClient: client.numeroClient,
      dateRdv: start,
      dureeMinutes: 30,
      typeRdv: "physique",
      objetRdv,
      statutRdv: "PLANIFIE",
      commentaires,
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
          end: new Date(new Date(res.data.dateRdv).getTime() + res.data.dureeMinutes * 60000),
          objetRdv: res.data.objetRdv,
          commentaires: res.data.commentaires,
          statutRdv: res.data.statutRdv,
          numeroClient: res.data.numeroClient,
          nomUtilisateur: res.data.nomUtilisateur,
          contactPlanId: res.data.contactPlanId,
          typeRdv: res.data.typeRdv,
          dureeMinutes: res.data.dureeMinutes,
        },
      ]);

      alert("✅ Rendez-vous planifié !");
      setPendingAppointment(null);
    } catch (err) {
      console.error("Erreur RDV", err);
      alert("Impossible d’enregistrer le rendez-vous.");
    }
  };

  // Sélection d'un RDV existant
  const handleSelectEvent = (event) => {
    setSelectedEvent(event);
    setObjetRdv(event.objetRdv || "");
    setCommentaires(event.commentaires || "");
    setStatutRdv(event.statutRdv || "PLANIFIE");

    // Init des champs éditables date & durée
    const startISO = new Date(event.start);
    // format "YYYY-MM-DDTHH:mm" pour input datetime-local
    const toLocalInputValue = (d) => {
      const pad = (n) => (n < 10 ? "0" + n : n);
      return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };
    setEditStart(toLocalInputValue(startISO));

    const dureeMinutes = Math.max(1, Math.round((new Date(event.end) - new Date(event.start)) / 60000));
    setEditDuree(dureeMinutes);
  };

  const updateAppointment = async () => {
    if (!selectedEvent) return;

    try {
      // On envoie un payload PARTIEL : uniquement ce qui a changé
      const payload = {};

      if (objetRdv !== selectedEvent.objetRdv) payload.objetRdv = objetRdv;
      if (commentaires !== selectedEvent.commentaires) payload.commentaires = commentaires;
      if (statutRdv !== selectedEvent.statutRdv) payload.statutRdv = statutRdv;

      // Conversion de editStart (datetime-local) en ISO (évite les soucis de parsing côté Spring)
      // Si l'utilisateur a changé la date/heure OU la durée, on envoie dateRdv/dureeMinutes
      const currentStartLocalValue = (() => {
        const d = new Date(selectedEvent.start);
        const pad = (n) => (n < 10 ? "0" + n : n);
        return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
      })();

      const dateChanged = editStart && editStart !== currentStartLocalValue;
      const dureeChanged = Number(editDuree) !== Number(selectedEvent.dureeMinutes || Math.round((new Date(selectedEvent.end) - new Date(selectedEvent.start)) / 60000));

      if (dateChanged || dureeChanged) {
        const dateRdvISO = new Date(editStart).toISOString(); // ISO 8601
        payload.dateRdv = dateRdvISO;
        payload.dureeMinutes = Number(editDuree) || 30;
      }

      // Optionnel : si besoin côté back
      payload.nomUtilisateur = selectedEvent.nomUtilisateur;
      payload.numeroClient  = selectedEvent.numeroClient;
      if (selectedEvent.contactPlanId) payload.contactPlanId = selectedEvent.contactPlanId;
      if (selectedEvent.typeRdv) payload.typeRdv = selectedEvent.typeRdv;

      const res = await axios.put(
        `http://localhost:8086/api/appointments/${selectedEvent.id}`,
        payload
      );

      // Recalcule l'event dans le calendrier
      const newStart = payload.dateRdv ? new Date(payload.dateRdv) : new Date(selectedEvent.start);
      const newDuree = payload.dureeMinutes
        ? Number(payload.dureeMinutes)
        : (selectedEvent.dureeMinutes || Math.max(1, Math.round((new Date(selectedEvent.end) - new Date(selectedEvent.start)) / 60000)));
      const newEnd = new Date(newStart.getTime() + newDuree * 60000);

      setEvents(events.map((ev) =>
        ev.id === selectedEvent.id
          ? {
              ...ev,
              start: newStart,
              end: newEnd,
              objetRdv: res.data.objetRdv ?? ev.objetRdv,
              commentaires: res.data.commentaires ?? ev.commentaires,
              statutRdv: res.data.statutRdv ?? ev.statutRdv,
              dureeMinutes: res.data.dureeMinutes ?? newDuree,
              title: `${ev.numeroClient} - ${(res.data.objetRdv ?? ev.objetRdv) || "RDV"}`,
            }
          : ev
      ));

      alert("💾 RDV modifié !");
      setSelectedEvent(null);
    } catch (err) {
      console.error("Erreur update RDV", err);
      alert("Impossible de modifier le RDV.");
    }
  };

  return (
    <div className="flex h-screen">
      {/* Colonne gauche : clients */}
      <div className="w-1/3 bg-gray-100 p-4 overflow-y-auto">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
        >
          ← Retour
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

        {/* Formulaire création RDV */}
        {pendingAppointment && (
          <div className="mt-6 p-4 bg-yellow-100 rounded shadow">
            <p className="mb-2 font-semibold">
              RDV provisoire : {pendingAppointment.client.client} <br />
              {moment(pendingAppointment.start).format("DD/MM/YYYY HH:mm")}
            </p>
            <label className="block mb-2">
              Objet :
              <input
                type="text"
                value={objetRdv}
                onChange={(e) => setObjetRdv(e.target.value)}
                className="w-full p-2 border rounded mt-1"
              />
            </label>
            <label className="block mb-2">
              Commentaires :
              <textarea
                value={commentaires}
                onChange={(e) => setCommentaires(e.target.value)}
                className="w-full p-2 border rounded mt-1"
              />
            </label>
            <button
              onClick={confirmAppointment}
              className="mt-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              ✅ Confirmer
            </button>
          </div>
        )}

        {/* Formulaire édition RDV */}
        {selectedEvent && (
          <div className="mt-6 p-4 bg-blue-100 rounded shadow">
            <p className="mb-2 font-semibold">
              Modifier RDV : {selectedEvent.numeroClient}
            </p>

            {/* Nouvelle section : date & durée */}
            <label className="block mb-2">
              Date & heure :
              <input
                type="datetime-local"
                value={editStart}
                onChange={(e) => setEditStart(e.target.value)}
                className="w-full p-2 border rounded mt-1"
              />
            </label>
            <label className="block mb-2">
              Durée (minutes) :
              <input
                type="number"
                min={1}
                value={editDuree}
                onChange={(e) => setEditDuree(e.target.value)}
                className="w-full p-2 border rounded mt-1"
              />
            </label>

            <label className="block mb-2">
              Objet :
              <input
                type="text"
                value={objetRdv}
                onChange={(e) => setObjetRdv(e.target.value)}
                className="w-full p-2 border rounded mt-1"
              />
            </label>
            <label className="block mb-2">
              Commentaires :
              <textarea
                value={commentaires}
                onChange={(e) => setCommentaires(e.target.value)}
                className="w-full p-2 border rounded mt-1"
              />
            </label>
            <label className="block mb-2">
              Statut :
              <select
                value={statutRdv}
                onChange={(e) => setStatutRdv(e.target.value)}
                className="w-full p-2 border rounded mt-1"
              >
                <option value="PLANIFIE">PLANIFIÉ</option>
                <option value="REALISE">RÉALISÉ</option>
                <option value="ANNULE">ANNULÉ</option>
              </select>
            </label>

            <button
              onClick={updateAppointment}
              className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              💾 Sauvegarder
            </button>
            <button
              onClick={() => setSelectedEvent(null)}
              className="mt-2 ml-2 px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
            >
              ❌ Annuler
            </button>
          </div>
        )}
      </div>

      {/* Colonne droite : calendrier */}
      <div className="w-2/3 p-4">
        <h2 className="text-xl font-bold mb-4">Planning ({nomComplet})</h2>
        <Calendar
          localizer={localizer}
          events={[
            ...events,
            ...(pendingAppointment
              ? [
                  {
                    id: "temp",
                    title: `🔵 [Provisoire] ${pendingAppointment.client.numeroClient}`,
                    start: pendingAppointment.start,
                    end: pendingAppointment.end,
                  },
                ]
              : []),
          ]}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 600 }}
          selectable
          onSelectSlot={handleSelectSlot}
          onSelectEvent={handleSelectEvent}
        />
      </div>
    </div>
  );
}

export default AppointmentPage;
