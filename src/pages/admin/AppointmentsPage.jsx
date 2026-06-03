import React, { useState, useEffect } from "react";
import { collection, onSnapshot, addDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { Calendar, List, Plus, Clock, Video, Phone, Users } from "lucide-react";
import StatusBadge from "../../components/ui/StatusBadge";
import Modal from "../../components/ui/Modal";
import toast from "react-hot-toast";

export const AppointmentsPage = () => {
  const [viewMode, setViewMode] = useState("list"); // list or calendar
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isBookOpen, setIsBookOpen] = useState(false);
  
  const [bookingForm, setBookingForm] = useState({
    clientName: "",
    consultant: "Visa Advisor",
    date: "",
    time: "10:00 AM",
    type: "Video Call",
    notes: ""
  });

  useEffect(() => {
    const appRef = collection(db, "appointments");
    const unsubscribe = onSnapshot(appRef, (snapshot) => {
      if (!snapshot.empty) {
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAppointments(items);
      }
      setLoading(false);
    }, (error) => {
      console.warn("Using mock appointments fallback:", error);
      setAppointments([
        { id: "1", clientName: "Amit Sharma", consultant: "Visa Advisor A", date: "2026-06-02", time: "10:30 AM", type: "Video Call", status: "Confirmed" },
        { id: "2", clientName: "Sarah Connor", consultant: "Visa Advisor B", date: "2026-06-03", time: "02:00 PM", type: "In-Person", status: "Rescheduled" }
      ]);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleBookSubmit = async (e) => {
    e.preventDefault();
    try {
      const appRef = collection(db, "appointments");
      await addDoc(appRef, {
        ...bookingForm,
        status: "Confirmed",
        createdAt: new Date()
      });
      toast.success("Appointment Booked successfully!");
      setIsBookOpen(false);
      setBookingForm({
        clientName: "",
        consultant: "Visa Advisor",
        date: "",
        time: "10:00 AM",
        type: "Video Call",
        notes: ""
      });
    } catch (err) {
      console.error(err);
      toast.error("Error booking appointment slot");
    }
  };

  const hours = ["09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM"];
  const daysOfWeek = ["Mon 01", "Tue 02", "Wed 03", "Thu 04", "Fri 05", "Sat 06", "Sun 07"];

  return (
    <div className="space-y-6 font-sans">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-white tracking-wide">Appointments</h1>
          <p className="text-xs text-on-primary-container/50">Schedule VFS advice sessions and document review meetings.</p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex bg-primary-container border border-on-primary-fixed-variant p-0.5 rounded-button">
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded transition-colors ${
                viewMode === "list" ? "bg-secondary-container text-on-primary-fixed" : "text-on-primary-container/60"
              }`}
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("calendar")}
              className={`p-1.5 rounded transition-colors ${
                viewMode === "calendar" ? "bg-secondary-container text-on-primary-fixed" : "text-on-primary-container/60"
              }`}
            >
              <Calendar className="h-4 w-4" />
            </button>
          </div>

          <button
            onClick={() => setIsBookOpen(true)}
            className="px-4 py-2 bg-gradient-to-r from-secondary-container to-secondary-container text-on-primary-fixed font-bold text-xs rounded-button flex items-center space-x-1.5 shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Book Slot</span>
          </button>
        </div>
      </div>

      {/* List View */}
      {viewMode === "list" && (
        <div className="overflow-x-auto rounded-card border border-on-primary-fixed-variant bg-primary-container/40">
          <table className="min-w-full divide-y divide-outline-variant/15 text-left text-sm text-on-primary-container">
            <thead className="bg-primary-container/80 uppercase text-xs font-semibold text-on-primary-container/60 tracking-wider">
              <tr>
                <th className="px-6 py-4">Client Name</th>
                <th className="px-6 py-4">Advisor</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Time</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/15 bg-transparent">
              {appointments.map((app) => (
                <tr key={app.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 font-semibold text-white">{app.clientName}</td>
                  <td className="px-6 py-4 text-xs">{app.consultant}</td>
                  <td className="px-6 py-4 text-xs font-mono">{app.date}</td>
                  <td className="px-6 py-4 text-xs font-mono text-secondary font-bold">{app.time}</td>
                  <td className="px-6 py-4 text-xs uppercase tracking-wider">{app.type}</td>
                  <td className="px-6 py-4"><StatusBadge status={app.status} /></td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button
                      onClick={() => toast.success("Slot Rescheduled")}
                      className="px-2.5 py-1 bg-white/5 border border-on-primary-fixed-variant hover:border-secondary text-on-primary-container text-[9px] font-bold uppercase rounded"
                    >
                      Reschedule
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Calendar Week Grid View */}
      {viewMode === "calendar" && (
        <div className="overflow-x-auto rounded-card border border-on-primary-fixed-variant bg-primary-container/40 p-4">
          <div className="grid grid-cols-8 gap-2 min-w-[700px]">
            {/* Header row */}
            <div className="p-2 border-b border-on-primary-fixed-variant text-[10px] font-bold uppercase text-on-primary-container/40">Time</div>
            {daysOfWeek.map(d => (
              <div key={d} className="p-2 border-b border-on-primary-fixed-variant text-[10px] font-bold uppercase text-center text-white">
                {d}
              </div>
            ))}

            {/* Time Slots Grid */}
            {hours.map(hour => (
              <React.Fragment key={hour}>
                <div className="p-2 text-[10px] text-on-primary-container/50 font-mono flex items-center">{hour}</div>
                {daysOfWeek.map((day, dayIdx) => {
                  const match = appointments.find(a => a.time === hour);
                  return (
                    <div 
                      key={dayIdx} 
                      className={`p-2 border border-on-primary-fixed-variant/40 min-h-[50px] flex items-center justify-center rounded transition-colors ${
                        match ? "bg-secondary-container/10 border-secondary/30 text-secondary font-bold" : "hover:bg-white/5"
                      }`}
                    >
                      {match && (
                        <div className="text-[10px] text-center truncate w-full" title={match.clientName}>
                          {match.clientName}
                        </div>
                      )}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      {/* Book Slot Modal */}
      <Modal
        isOpen={isBookOpen}
        onClose={() => setIsBookOpen(false)}
        title="Book Appointment Slot"
        size="sm"
      >
        <form onSubmit={handleBookSubmit} className="space-y-4 font-sans text-xs">
          <div className="flex flex-col space-y-1">
            <label className="text-[10px] font-bold text-on-primary-container/50 uppercase">Client Name</label>
            <input
              type="text"
              required
              placeholder="Full Name"
              className="px-3 py-2 bg-primary-container border border-on-primary-fixed-variant text-on-primary-container rounded focus:outline-none"
              value={bookingForm.clientName}
              onChange={(e) => setBookingForm({ ...bookingForm, clientName: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col space-y-1">
              <label className="text-[10px] font-bold text-on-primary-container/50 uppercase">Date</label>
              <input
                type="date"
                required
                className="px-3 py-2 bg-primary-container border border-on-primary-fixed-variant text-on-primary-container rounded focus:outline-none"
                value={bookingForm.date}
                onChange={(e) => setBookingForm({ ...bookingForm, date: e.target.value })}
              />
            </div>
            <div className="flex flex-col space-y-1">
              <label className="text-[10px] font-bold text-on-primary-container/50 uppercase">Time Slot</label>
              <select
                className="px-3 py-2 bg-primary-container border border-on-primary-fixed-variant text-on-primary-container rounded focus:outline-none"
                value={bookingForm.time}
                onChange={(e) => setBookingForm({ ...bookingForm, time: e.target.value })}
              >
                {hours.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
          </div>
          <div className="flex flex-col space-y-1">
            <label className="text-[10px] font-bold text-on-primary-container/50 uppercase">Consultation Type</label>
            <select
              className="px-3 py-2 bg-primary-container border border-on-primary-fixed-variant text-on-primary-container rounded focus:outline-none"
              value={bookingForm.type}
              onChange={(e) => setBookingForm({ ...bookingForm, type: e.target.value })}
            >
              <option value="Video Call">Video Call</option>
              <option value="Phone Call">Phone Call</option>
              <option value="In-Person">In-Person</option>
            </select>
          </div>

          <div className="flex space-x-3 pt-4 border-t border-on-primary-fixed-variant">
            <button
              type="button"
              onClick={() => setIsBookOpen(false)}
              className="flex-1 py-2.5 bg-on-primary-fixed-variant border border-on-primary-fixed-variant text-on-primary-container font-semibold rounded text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-gradient-to-r from-secondary-container to-secondary-container text-on-primary-fixed font-bold rounded text-xs shadow-sm"
            >
              Confirm Appointment
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
};

export default AppointmentsPage;
