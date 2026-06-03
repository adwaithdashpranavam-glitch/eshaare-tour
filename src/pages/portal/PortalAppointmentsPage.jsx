import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { collection, query, where, onSnapshot, addDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { Calendar, Plus, Clock, Video, Info } from "lucide-react";
import StatusBadge from "../../components/ui/StatusBadge";
import Modal from "../../components/ui/Modal";
import { formatShortDate } from "../../utils/formatters";
import toast from "react-hot-toast";

export const PortalAppointmentsPage = () => {
  const { userProfile } = useAuth();
  const [appts, setAppts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isBookOpen, setIsBookOpen] = useState(false);
  
  const [bookingForm, setBookingForm] = useState({
    date: "",
    time: "10:00 AM",
    type: "Video Call",
    notes: ""
  });

  useEffect(() => {
    if (!userProfile?.name) return;

    const appRef = collection(db, "appointments");
    const q = query(appRef, where("clientName", "==", userProfile.name));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        setAppts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }
      setLoading(false);
    }, (error) => {
      console.warn("Using mock appts fallback lists:", error);
      setAppts([
        { id: "1", date: "2026-06-02", time: "10:30 AM", type: "Video Call", status: "Confirmed", consultant: "Rana G." }
      ]);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userProfile]);

  const handleBookSubmit = async (e) => {
    e.preventDefault();
    try {
      const appRef = collection(db, "appointments");
      await addDoc(appRef, {
        clientName: userProfile.name,
        consultant: "Unassigned Advisor",
        date: bookingForm.date,
        time: bookingForm.time,
        type: bookingForm.type,
        notes: bookingForm.notes,
        status: "Confirmed",
        createdAt: new Date()
      });
      toast.success("Appointment booked!");
      setIsBookOpen(false);
    } catch (err) {
      console.error(err);
      toast.error("Error booking slot");
    }
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-white tracking-wide">My Appointments</h1>
          <p className="text-xs text-on-primary-container/50">Schedule and review virtual or in-person advice bookings.</p>
        </div>
        <button
          onClick={() => setIsBookOpen(true)}
          className="px-4 py-2 bg-gradient-to-r from-secondary-container to-secondary-container text-on-primary-fixed font-bold text-xs rounded-button flex items-center space-x-1.5 shadow-sm"
        >
          <Plus className="h-4 w-4" />
          <span>Book Session</span>
        </button>
      </div>

      {/* Grid List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {appts.map((app) => (
          <div key={app.id} className="glass-card p-6 border border-on-primary-fixed-variant/65 flex flex-col justify-between space-y-4">
            <div className="flex justify-between items-start">
              <div className="flex items-center space-x-2.5">
                <div className="p-2.5 rounded bg-white/5 border border-on-primary-fixed-variant text-secondary">
                  <Calendar className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h4 className="font-semibold text-white font-mono">{app.time}</h4>
                  <span className="text-[10px] text-on-primary-container/40 uppercase tracking-widest">{app.type}</span>
                </div>
              </div>
              <StatusBadge status={app.status} />
            </div>

            <div className="pt-4 border-t border-on-primary-fixed-variant flex justify-between items-center text-xs">
              <span className="text-on-primary-container/60 font-mono">Date: {app.date}</span>
              <span className="text-on-primary-container/40">Advisor: {app.consultant || "Staff Advisor"}</span>
            </div>
          </div>
        ))}

        {appts.length === 0 && !loading && (
          <div className="col-span-2 text-center py-12 text-xs text-on-primary-container/40 italic">
            No upcoming sessions booked. Click Book Session above to choose a slot.
          </div>
        )}
      </div>

      {/* Booking Modal */}
      <Modal
        isOpen={isBookOpen}
        onClose={() => setIsBookOpen(false)}
        title="Schedule Consultation"
        size="sm"
      >
        <form onSubmit={handleBookSubmit} className="space-y-4 font-sans text-xs">
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
                <option value="09:00 AM">09:00 AM</option>
                <option value="10:30 AM">10:30 AM</option>
                <option value="01:00 PM">01:00 PM</option>
                <option value="03:30 PM">03:30 PM</option>
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
              <option value="Video Call">Video Zoom Call</option>
              <option value="Phone Call">Phone Call</option>
              <option value="In-Person">In-Person Dubai Office</option>
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
              Book Slot
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
};

export default PortalAppointmentsPage;
