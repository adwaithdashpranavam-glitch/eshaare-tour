import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { collection, query, where, onSnapshot, addDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { Calendar, Plus, Video } from "lucide-react";
import Modal from "../../components/ui/Modal";
import { formatShortDate } from "../../utils/formatters";
import toast from "react-hot-toast";

// Premium Luxury Status Badge
const PortalStatusBadge = ({ status }) => {
  const s = status || "Submitted";
  
  const stylesMap = {
    "Docs Pending": "bg-amber-50 text-amber-700 border border-amber-200",
    "Pending Documents": "bg-amber-50 text-amber-700 border border-amber-200",
    
    "Verification": "bg-blue-50 text-blue-700 border border-blue-200",
    "Under Review": "bg-blue-50 text-blue-700 border border-blue-200",
    "Submitted": "bg-blue-50 text-blue-700 border border-blue-200",
    "Awaiting Decision": "bg-blue-50 text-blue-700 border border-blue-200",
    
    "Approved": "bg-emerald-50 text-emerald-700 border border-emerald-200",
    "Paid": "bg-emerald-50 text-emerald-700 border border-emerald-200",
    "Confirmed": "bg-emerald-50 text-emerald-700 border border-emerald-200",
    
    "Rejected": "bg-rose-50 text-rose-700 border border-rose-200",
    "Overdue": "bg-rose-50 text-rose-700 border border-rose-200",
    
    "Withdrawn": "bg-gray-100 text-gray-600 border border-gray-200",
    "Cancelled": "bg-gray-100 text-gray-600 border border-gray-200",
  };

  const currentStyle = stylesMap[s] || "bg-gray-50 text-gray-600 border border-gray-200";
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${currentStyle}`}>
      {s}
    </span>
  );
};

export const PortalAppointmentsPage = () => {
  const { userProfile } = useAuth();
  const [appts, setAppts] = useState([]);
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
    }, (error) => {
      console.warn("Error fetching appointments:", error);
      setAppts([]);
    });

    return () => unsubscribe();
  }, [userProfile]);

  const handleBookSubmit = async (e) => {
    e.preventDefault();
    if (!bookingForm.date) {
      toast.error("Please select an appointment date");
      return;
    }
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
    <div className="space-y-6 font-sans">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-[#1A1A1A] tracking-wide">My Appointments</h1>
          <p className="text-xs text-gray-500">Schedule and review virtual or in-person advice bookings.</p>
        </div>
        <button
          onClick={() => setIsBookOpen(true)}
          className="px-4 py-2.5 bg-[#C8A45D] hover:bg-[#b08e4f] text-white font-bold text-xs rounded-lg flex items-center space-x-1.5 shadow-sm transition-all"
        >
          <Plus className="h-4 w-4" />
          <span>Book Session</span>
        </button>
      </div>

      {/* Grid List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {appts.map((app) => (
          <div key={app.id} className="bg-white border border-[#E7E1D6] rounded-[20px] p-6 shadow-sm flex flex-col justify-between space-y-4 hover:border-[#C8A45D] transition-all">
            <div className="flex justify-between items-start">
              <div className="flex items-center space-x-3">
                <div className="p-3 rounded-xl bg-[#F7F5F1] border border-[#E7E1D6] text-[#C8A45D] shrink-0">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-[#1A1A1A] text-sm">{app.time}</h4>
                  <span className="text-[9px] text-[#C8A45D] font-bold uppercase tracking-wider">{app.type}</span>
                </div>
              </div>
              <PortalStatusBadge status={app.status} />
            </div>

            <div className="space-y-1">
              <p className="text-xs text-gray-600 truncate font-medium">{app.notes || "Initial Consultation Slot"}</p>
              <span className="text-[10px] text-gray-400 font-semibold block">Advisor: {app.consultant || "Operations Team"}</span>
            </div>

            <div className="pt-4 border-t border-gray-100 flex justify-between items-center text-xs">
              <span className="text-gray-500 font-mono">Date: {formatShortDate(app.date)}</span>
              {app.type === "Video Call" && app.status === "Confirmed" && (
                <button
                  onClick={() => window.open("https://meet.google.com", "_blank")}
                  className="px-3 py-1.5 bg-[#C8A45D] hover:bg-[#b08e4f] text-white font-bold rounded-lg flex items-center space-x-1 transition-colors"
                >
                  <Video className="h-3.5 w-3.5" />
                  <span>Join Meet</span>
                </button>
              )}
            </div>
          </div>
        ))}

        {appts.length === 0 && (
          <div className="col-span-2 bg-white border border-[#E7E1D6] rounded-[20px] p-12 text-center text-xs text-gray-400 italic space-y-3">
            <div className="mx-auto w-12 h-12 rounded-full bg-[#F7F5F1] flex items-center justify-center border border-[#E7E1D6] text-[#C8A45D]">
              <Calendar className="w-5 h-5" />
            </div>
            <p>No advice slots scheduled yet. Select Book Session above.</p>
          </div>
        )}
      </div>

      {/* Book Modal */}
      <Modal
        isOpen={isBookOpen}
        onClose={() => setIsBookOpen(false)}
        title="Schedule Consultation Slot"
        size="md"
      >
        <form onSubmit={handleBookSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col space-y-1.5">
              <label className="text-[10px] font-bold text-gray-500 uppercase">Preferred Date *</label>
              <input
                type="date"
                required
                className="px-3 py-2 bg-[#F7F5F1] border border-[#E7E1D6] text-[#1A1A1A] rounded focus:outline-none focus:border-[#C8A45D]"
                value={bookingForm.date}
                onChange={(e) => setBookingForm({ ...bookingForm, date: e.target.value })}
              />
            </div>
            <div className="flex flex-col space-y-1.5">
              <label className="text-[10px] font-bold text-gray-500 uppercase">Preferred Time *</label>
              <select
                className="px-3 py-2 bg-[#F7F5F1] border border-[#E7E1D6] text-[#1A1A1A] rounded focus:outline-none focus:border-[#C8A45D]"
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
            <label className="text-[10px] font-bold text-gray-500 uppercase">Consultation Type</label>
            <select
              className="px-3 py-2 bg-[#F7F5F1] border border-[#E7E1D6] text-[#1A1A1A] rounded focus:outline-none focus:border-[#C8A45D]"
              value={bookingForm.type}
              onChange={(e) => setBookingForm({ ...bookingForm, type: e.target.value })}
            >
              <option value="Video Call">Video Zoom Call</option>
              <option value="Phone Call">Phone Call</option>
              <option value="In-Person">In-Person Dubai Office</option>
            </select>
          </div>

          <div className="flex flex-col space-y-1">
            <label className="text-[10px] font-bold text-gray-500 uppercase">Notes / Special Instructions</label>
            <textarea
              rows={2}
              className="px-3 py-2 bg-[#F7F5F1] border border-[#E7E1D6] text-[#1A1A1A] placeholder-gray-400 rounded focus:outline-none focus:border-[#C8A45D]"
              placeholder="Describe what help you need with your visa dossier..."
              value={bookingForm.notes}
              onChange={(e) => setBookingForm({ ...bookingForm, notes: e.target.value })}
            />
          </div>

          <div className="flex space-x-3 pt-4 border-t border-[#E7E1D6]">
            <button
              type="button"
              onClick={() => setIsBookOpen(false)}
              className="flex-1 py-2.5 bg-white border border-[#E7E1D6] text-gray-700 hover:text-[#C8A45D] font-bold rounded text-xs uppercase tracking-wider transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-[#C8A45D] text-white hover:bg-[#b08e4f] font-bold rounded text-xs uppercase tracking-wider shadow-sm transition-all"
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
