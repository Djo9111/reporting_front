import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import { useLocation, useNavigate } from "react-router-dom";
import "react-big-calendar/lib/css/react-big-calendar.css";
import logo from "../assets/cds.png"; // ← logo CDS

const localizer = momentLocalizer(moment);

// util: lire l'utilisateur depuis state ou storage
const useAuthInfo = (location) => {
  const stateUser = location.state || {};
  const stored = JSON.parse(localStorage.getItem("sessionUser") || "{}");
  const nomUtilisateur = stateUser.nomUtilisateur || stored.nomUtilisateur;
  const nomComplet = stateUser.nomComplet || stored.nomComplet || "Utilisateur";
  return { nomUtilisateur, nomComplet };
};

// petit helper pour datetime-local
const toLocalInputValue = (d) => {
  const pad = (n) => (n < 10 ? "0" + n : n);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

function AppointmentPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { nomUtilisateur, nomComplet } = useAuthInfo(location);

  const [clients, setClients] = useState([]);
  const [events, setEvents] = useState([]);

  const [loadingClients, setLoadingClients] = useState(true);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [errorClients, setErrorClients] = useState(null);
  const [errorEvents, setErrorEvents] = useState(null);

  const [q, setQ] = useState(""); // recherche client

  const [selectedClient, setSelectedClient] = useState(null);
  const [pendingAppointment, setPendingAppointment] = useState(null);

  const [objetRdv, setObjetRdv] = useState("");
  const [commentaires, setCommentaires] = useState("");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [statutRdv, setStatutRdv] = useState("PLANIFIE");

  // états pour l'édition date & durée
  const [editStart, setEditStart] = useState(""); // input datetime-local
  const [editDuree, setEditDuree] = useState(30); // minutes

  // redirect si pas connecté + persister session
  useEffect(() => {
    if (!nomUtilisateur) {
      navigate("/login", { replace: true });
    } else {
      localStorage.setItem("sessionUser", JSON.stringify({ nomUtilisateur, nomComplet }));
    }
  }, [nomUtilisateur, nomComplet, navigate]);

  // charger clients & RDV
  useEffect(() => {
    if (!nomUtilisateur) return;

    const fetchClients = async () => {
      setLoadingClients(true);
      setErrorClients(null);
      try {
        const res = await axios.get(`http://localhost:8086/api/import/my-contacts/${nomUtilisateur}`);
        setClients(res.data || []);
      } catch (err) {
        console.error("Erreur chargement clients", err);
        setErrorClients("Impossible de charger la liste des clients.");
      } finally {
        setLoadingClients(false);
      }
    };

    const fetchAppointments = async () => {
      setLoadingEvents(true);
      setErrorEvents(null);
      try {
        const res = await axios.get(`http://localhost:8086/api/appointments/manager/${nomUtilisateur}`);
        setEvents(
          (res.data || []).map((rdv) => ({
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
        setErrorEvents("Impossible de charger les rendez-vous.");
      } finally {
        setLoadingEvents(false);
      }
    };

    fetchClients();
    fetchAppointments();
  }, [nomUtilisateur]);

  // filtrage clients
  const filteredClients = useMemo(() => {
    if (!q.trim()) return clients;
    const needle = q.toLowerCase();
    return clients.filter((c) =>
      [c.client, c.numeroClient, c.agence, c.email, c.telephone].join(" ").toLowerCase().includes(needle)
    );
  }, [q, clients]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("sessionUser");
    navigate("/login", { replace: true });
  };
  const goto = (path) => navigate(path, { state: { nomUtilisateur, nomComplet } });

  const handleSelectSlot = ({ start }) => {
    if (!selectedClient) {
      alert("Veuillez d'abord sélectionner un client.");
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
      alert("Veuillez renseigner l'objet du RDV.");
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
      const res = await axios.post("http://localhost:8086/api/appointments", newAppointment);

      setEvents((prev) => [
        ...prev,
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

  const handleSelectEvent = (event) => {
    setSelectedEvent(event);
    setObjetRdv(event.objetRdv || "");
    setCommentaires(event.commentaires || "");
    setStatutRdv(event.statutRdv || "PLANIFIE");

    const startISO = new Date(event.start);
    setEditStart(toLocalInputValue(startISO));

    const dureeMinutes = Math.max(1, Math.round((new Date(event.end) - new Date(event.start)) / 60000));
    setEditDuree(dureeMinutes);
  };

  const updateAppointment = async () => {
    if (!selectedEvent) return;

    try {
      const payload = {};
      if (objetRdv !== selectedEvent.objetRdv) payload.objetRdv = objetRdv;
      if (commentaires !== selectedEvent.commentaires) payload.commentaires = commentaires;
      if (statutRdv !== selectedEvent.statutRdv) payload.statutRdv = statutRdv;

      const currentStartLocalValue = toLocalInputValue(new Date(selectedEvent.start));
      const dateChanged = editStart && editStart !== currentStartLocalValue;
      const dureeChanged =
        Number(editDuree) !==
        Number(
          selectedEvent.dureeMinutes ||
            Math.round((new Date(selectedEvent.end) - new Date(selectedEvent.start)) / 60000)
        );

      if (dateChanged || dureeChanged) {
        payload.dateRdv = new Date(editStart).toISOString();
        payload.dureeMinutes = Number(editDuree) || 30;
      }

      // Optionnel : champs utiles côté back
      payload.nomUtilisateur = selectedEvent.nomUtilisateur;
      payload.numeroClient = selectedEvent.numeroClient;
      if (selectedEvent.contactPlanId) payload.contactPlanId = selectedEvent.contactPlanId;
      if (selectedEvent.typeRdv) payload.typeRdv = selectedEvent.typeRdv;

      const res = await axios.put(`http://localhost:8086/api/appointments/${selectedEvent.id}`, payload);

      const newStart = payload.dateRdv ? new Date(payload.dateRdv) : new Date(selectedEvent.start);
      const newDuree =
        payload.dureeMinutes ||
        selectedEvent.dureeMinutes ||
        Math.max(1, Math.round((new Date(selectedEvent.end) - new Date(selectedEvent.start)) / 60000));
      const newEnd = new Date(newStart.getTime() + newDuree * 60000);

      setEvents((prev) =>
        prev.map((ev) =>
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
        )
      );

      alert("💾 RDV modifié !");
      setSelectedEvent(null);
    } catch (err) {
      console.error("Erreur update RDV", err);
      alert("Impossible de modifier le RDV.");
    }
  };

  // Style des events selon statut (PLANIFIÉ → orange, RÉALISÉ → vert, ANNULÉ → rouge)
  const eventPropGetter = (event) => {
    let bg = "#f97316"; // orange par défaut pour PLANIFIE
    if (event.statutRdv === "REALISE") bg = "#16a34a"; // vert
    if (event.statutRdv === "ANNULE") bg = "#ef4444"; // rouge
    return {
      style: {
        backgroundColor: bg,
        borderRadius: "10px",
        color: "white",
        border: "none",
        padding: "2px 6px",
      },
    };
  };

  if (!nomUtilisateur) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Redirection vers la connexion…
      </div>
    );
  }

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
            <h1 className="font-bold text-lg">Planifier / Gérer mes RDV</h1>
            {!loadingEvents && (
              <span className="ml-2 text-sm text-gray-500">{events.length} RDV</span>
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6">
        {/* Colonne gauche */}
        <aside className="space-y-4">
          {/* Carte sélection client */}
          <div className="rounded-2xl border border-gray-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Mes clients</h2>
              <div className="text-sm text-gray-500">
                {loadingClients ? "…" : `${filteredClients.length} résultat(s)`}
              </div>
            </div>

            <div className="mt-3">
              <input
                type="text"
                placeholder="Rechercher un client..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              />
            </div>

            <div className="mt-3 max-h-[320px] overflow-auto rounded-xl border border-gray-100">
              {loadingClients ? (
                <div className="p-4 text-gray-500">Chargement…</div>
              ) : errorClients ? (
                <div className="p-4 text-red-600">{errorClients}</div>
              ) : filteredClients.length === 0 ? (
                <div className="p-4 text-gray-500">Aucun client trouvé.</div>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {filteredClients.map((c) => (
                    <li
                      key={c.id}
                      className={`p-3 cursor-pointer ${
                        selectedClient === c.id ? "bg-orange-50" : "hover:bg-gray-50"
                      }`}
                      onClick={() => setSelectedClient(c.id)}
                    >
                      <div className="font-medium">{c.client}</div>
                      <div className="text-xs text-gray-500">
                        #{c.numeroClient} • {c.agence || "—"}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="mt-2 text-xs text-gray-500">
              Sélectionnez un client puis cliquez dans le calendrier pour créer un RDV.
            </div>
          </div>

          {/* Création RDV */}
          {pendingAppointment && (
            <div className="rounded-2xl border border-gray-200 bg-white p-4">
              <div className="font-semibold">
                RDV provisoire : {pendingAppointment.client.client}
              </div>
              <div className="text-sm text-gray-600">
                {moment(pendingAppointment.start).format("DD/MM/YYYY HH:mm")} →{" "}
                {moment(pendingAppointment.end).format("HH:mm")}
              </div>

              <label className="block mt-3 text-sm">
                Objet :
                <input
                  type="text"
                  value={objetRdv}
                  onChange={(e) => setObjetRdv(e.target.value)}
                  className="w-full p-2 border rounded mt-1"
                />
              </label>
              <label className="block mt-3 text-sm">
                Commentaires :
                <textarea
                  value={commentaires}
                  onChange={(e) => setCommentaires(e.target.value)}
                  className="w-full p-2 border rounded mt-1"
                />
              </label>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={confirmAppointment}
                  className="flex-1 px-4 py-2 rounded-lg bg-orange-500 text-white hover:bg-orange-600"
                >
                  ✅ Confirmer
                </button>
                <button
                  onClick={() => setPendingAppointment(null)}
                  className="px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50"
                >
                  Annuler
                </button>
              </div>
            </div>
          )}

          {/* Édition RDV */}
          {selectedEvent && (
            <div className="rounded-2xl border border-gray-200 bg-white p-4">
              <div className="font-semibold">Modifier RDV : {selectedEvent.numeroClient}</div>

              <label className="block mt-3 text-sm">
                Date & heure :
                <input
                  type="datetime-local"
                  value={editStart}
                  onChange={(e) => setEditStart(e.target.value)}
                  className="w-full p-2 border rounded mt-1"
                />
              </label>

              <label className="block mt-3 text-sm">
                Durée (minutes) :
                <input
                  type="number"
                  min={1}
                  value={editDuree}
                  onChange={(e) => setEditDuree(e.target.value)}
                  className="w-full p-2 border rounded mt-1"
                />
              </label>

              <label className="block mt-3 text-sm">
                Objet :
                <input
                  type="text"
                  value={objetRdv}
                  onChange={(e) => setObjetRdv(e.target.value)}
                  className="w-full p-2 border rounded mt-1"
                />
              </label>
              <label className="block mt-3 text-sm">
                Commentaires :
                <textarea
                  value={commentaires}
                  onChange={(e) => setCommentaires(e.target.value)}
                  className="w-full p-2 border rounded mt-1"
                />
              </label>
              <label className="block mt-3 text-sm">
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

              <div className="mt-3 flex gap-2">
                <button
                  onClick={updateAppointment}
                  className="flex-1 px-4 py-2 rounded-lg bg-orange-500 text-white hover:bg-orange-600"
                >
                  💾 Sauvegarder
                </button>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50"
                >
                  Annuler
                </button>
              </div>
            </div>
          )}
        </aside>

        {/* Colonne droite : calendrier */}
        <section className="rounded-2xl border border-gray-200 bg-white p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Planning ({nomComplet})</h2>
            <div className="text-sm text-gray-500">
              {loadingEvents ? "Chargement…" : errorEvents ? errorEvents : ""}
            </div>
          </div>

          <div className="rounded-xl overflow-hidden border border-gray-100">
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
                        statutRdv: "PLANIFIE",
                      },
                    ]
                  : []),
              ]}
              startAccessor="start"
              endAccessor="end"
              style={{ height: 620 }}
              selectable
              onSelectSlot={handleSelectSlot}
              onSelectEvent={handleSelectEvent}
              eventPropGetter={eventPropGetter}
            />
          </div>
          <div className="mt-3 text-xs text-gray-500">
            Conseil : cliquez sur un créneau pour créer un RDV (après avoir choisi un client).
            Cliquez sur un RDV existant pour le modifier.
          </div>
        </section>
      </main>
    </div>
  );
}

export default AppointmentPage;
