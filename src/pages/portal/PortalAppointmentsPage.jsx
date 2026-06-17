import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { collection, query, where, onSnapshot, addDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { Calendar, Plus, Clock, Video, Info, MapPin } from "lucide-react";
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
    if (!userProfile?.email) return;

    const appRef = collection(db, "appointments");
    const q = query(appRef, where("email", "==", userProfile.email.toLowerCase()));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        setAppts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } else {
        setAppts([]);
      }
      setLoading(false);
    }, (error) => {
      console.warn("Error fetching appointments:", error);
      setAppts([]);
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
        email: userProfile.email.toLowerCase(),
        clientUid: userProfile.id || "",
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
    <div className="space-y-8 font-sans pb-16">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#1A1A1A]">My Appointments</h1>
          <p className="text-xs text-[#6B7280]">Schedule and review virtual or in-person advice bookings.</p>
        </div>
        <button
          onClick={() => setIsBookOpen(true)}
          className="px-4 py-2.5 bg-[#0F3D2E] text-white hover:bg-[#0F3D2E]/90 font-bold text-xs rounded-xl flex items-center space-x-1.5 shadow-sm transition-colors"
        >
          <Plus className="h-4 w-4 text-[#C6A969]" />
          <span>Book Session</span>
        </button>
      </div>

      {/* Grid List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {appts.map((app) => (
          <div key={app.id} className="bg-white border border-[#E5E7EB] rounded-[24px] p-6 flex flex-col justify-between space-y-4 hover:shadow-md transition-all duration-200 shadow-sm">
            <div className="flex justify-between items-start">
              <div className="flex items-center space-x-3">
                <div className="p-3 rounded-xl bg-[#0F3D2E]/5 border border-[#0F3D2E]/10 text-[#0F3D2E]">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-[#1A1A1A] font-mono text-sm">{app.time}</h4>
                  <span className="text-[10px] text-[#C6A969] font-bold uppercase tracking-wider flex items-center gap-1 mt-0.5">
                    {app.type === "In-Person" ? <MapPin className="w-3 h-3" /> : <Video className="w-3 h-3" />}
                    <span>{app.type}</span>
                  </span>
                </div>
              </div>
              <StatusBadge status={app.status} />
            </div>

            <div className="pt-4 border-t border-[#E5E7EB] flex justify-between items-center text-xs text-[#6B7280]">
              <span className="font-semibold font-mono">Date: {app.date}</span>
              <span>Advisor: {app.consultant || "Staff Advisor"}</span>
            </div>
          </div>
        ))}

        {appts.length === 0 && !loading && (
          <div className="col-span-2 text-center py-12 text-xs text-[#6B7280] italic bg-white border border-[#E5E7EB] rounded-[24px]">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col space-y-1">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Date</label>
              <input
                type="date"
                required
                className="px-3.5 py-2.5 bg-[#F8F6F2] border border-[#E5E7EB] text-[#1A1A1A] rounded-xl focus:outline-none focus:border-[#0F3D2E] text-xs"
                value={bookingForm.date}
                onChange={(e) => setBookingForm({ ...bookingForm, date: e.target.value })}
              />
            </div>
            <div className="flex flex-col space-y-1">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Time Slot</label>
              <select
                className="px-3.5 py-2.5 bg-[#F8F6F2] border border-[#E5E7EB] text-[#1A1A1A] rounded-xl focus:outline-none focus:border-[#0F3D2E] text-xs cursor-pointer"
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
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Consultation Type</label>
            <select
              className="px-3.5 py-2.5 bg-[#F8F6F2] border border-[#E5E7EB] text-[#1A1A1A] rounded-xl focus:outline-none focus:border-[#0F3D2E] text-xs cursor-pointer"
              value={bookingForm.type}
              onChange={(e) => setBookingForm({ ...bookingForm, type: e.target.value })}
            >
              <option value="Video Call">Video Zoom Call</option>
              <option value="Phone Call">Phone Call</option>
              <option value="In-Person">In-Person Dubai Office</option>
            </select>
          </div>

          <div className="flex flex-col space-y-1">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Additional Notes</label>
            <textarea
              rows={3}
              className="px-3.5 py-2.5 bg-[#F8F6F2] border border-[#E5E7EB] text-[#1A1A1A] placeholder-gray-400 rounded-xl focus:outline-none focus:border-[#0F3D2E] text-xs"
              placeholder="e.g. Schengen visa checklist questions, UAE residence details..."
              value={bookingForm.notes}
              onChange={(e) => setBookingForm({ ...bookingForm, notes: e.target.value })}
            />
          </div>

          <div className="flex space-x-3 pt-4 border-t border-[#E5E7EB]">
            <button
              type="button"
              onClick={() => setIsBookOpen(false)}
              className="flex-1 py-2.5 bg-[#F8F6F2] border border-[#E5E7EB] text-[#1A1A1A] hover:bg-gray-100 font-bold rounded-xl text-xs uppercase tracking-wider transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-[#0F3D2E] text-white hover:bg-[#0F3D2E]/90 font-bold rounded-xl text-xs uppercase tracking-wider shadow-sm transition-colors"
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
