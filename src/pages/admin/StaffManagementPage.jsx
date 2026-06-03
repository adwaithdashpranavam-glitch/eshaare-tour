import React, { useState, useEffect } from "react";
import { collection, onSnapshot, addDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { UserPlus, Shield, ToggleLeft, ToggleRight, Mail } from "lucide-react";
import Modal from "../../components/ui/Modal";
import toast from "react-hot-toast";

export const StaffManagementPage = () => {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [staffForm, setStaffForm] = useState({ name: "", email: "", role: "sales", status: "Active" });

  useEffect(() => {
    const sRef = collection(db, "users");
    const unsubscribe = onSnapshot(sRef, (snapshot) => {
      if (!snapshot.empty) {
        setStaff(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }
      setLoading(false);
    }, (error) => {
      console.warn("Using mock staff logs:", error);
      setStaff([
        { id: "1", name: "Rana G.", email: "rana@eshaare.com", role: "super_admin", status: "Active", casesHandled: 42 },
        { id: "2", name: "Ahmed K.", email: "ahmed@eshaare.com", role: "visa_ops", status: "Active", casesHandled: 28 },
        { id: "3", name: "Lina M.", email: "lina@eshaare.com", role: "sales", status: "Inactive", casesHandled: 15 }
      ]);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      const sRef = collection(db, "users");
      await addDoc(sRef, {
        ...staffForm,
        casesHandled: 0,
        createdAt: new Date()
      });
      toast.success("Staff profile created!");
      setIsAddOpen(false);
      setStaffForm({ name: "", email: "", role: "sales", status: "Active" });
    } catch (err) {
      console.error(err);
      toast.error("Error creating staff record");
    }
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-white tracking-wide">Staff Management</h1>
          <p className="text-xs text-on-primary-container/50">Manage internal officer roles, permission credentials and dashboard assignees.</p>
        </div>
        <button
          onClick={() => setIsAddOpen(true)}
          className="px-4 py-2 bg-gradient-to-r from-secondary-container to-secondary-container text-on-primary-fixed font-bold text-xs rounded-button flex items-center space-x-1.5 shadow-sm"
        >
          <UserPlus className="h-4 w-4" />
          <span>Add Staff Member</span>
        </button>
      </div>

      {/* Staff Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {staff.map((member) => (
          <div key={member.id} className="glass-card p-6 border border-on-primary-fixed-variant/60 flex flex-col justify-between space-y-4">
            <div className="flex justify-between items-start">
              <div className="h-10 w-10 rounded-full bg-secondary-container/10 border border-secondary/20 text-secondary font-bold text-sm flex items-center justify-center">
                {member.name?.slice(0, 2).toUpperCase()}
              </div>
              <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${
                member.status === "Active" ? "bg-success/15 text-success" : "bg-danger/15 text-danger"
              }`}>
                {member.status}
              </span>
            </div>
            
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-white">{member.name}</h3>
              <p className="text-xs text-on-primary-container/60 flex items-center"><Mail className="h-3.5 w-3.5 mr-1" /> {member.email}</p>
            </div>

            <div className="pt-4 border-t border-on-primary-fixed-variant flex justify-between items-center text-xs">
              <span className="font-bold text-secondary uppercase tracking-widest text-[9px]">Role: {member.role}</span>
              <span className="text-on-primary-container/40">Cases: {member.casesHandled}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Add Staff modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Add Staff Member"
        size="sm"
      >
        <form onSubmit={handleAddSubmit} className="space-y-4 font-sans text-xs">
          <div className="flex flex-col space-y-1">
            <label className="text-[10px] font-bold text-on-primary-container/50 uppercase">Full Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Lina Malik"
              className="px-3 py-2 bg-primary-container border border-on-primary-fixed-variant text-on-primary-container rounded focus:outline-none"
              value={staffForm.name}
              onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
            />
          </div>
          <div className="flex flex-col space-y-1">
            <label className="text-[10px] font-bold text-on-primary-container/50 uppercase">Email Address</label>
            <input
              type="email"
              required
              placeholder="lina@eshaare.com"
              className="px-3 py-2 bg-primary-container border border-on-primary-fixed-variant text-on-primary-container rounded focus:outline-none"
              value={staffForm.email}
              onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
            />
          </div>
          <div className="flex flex-col space-y-1">
            <label className="text-[10px] font-bold text-on-primary-container/50 uppercase">Access Role</label>
            <select
              className="px-3 py-2 bg-primary-container border border-on-primary-fixed-variant text-on-primary-container rounded focus:outline-none"
              value={staffForm.role}
              onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value })}
            >
              <option value="super_admin">Super Admin</option>
              <option value="manager">Manager</option>
              <option value="sales">Sales Consultant</option>
              <option value="visa_ops">Visa Ops Officer</option>
              <option value="finance">Finance Specialist</option>
            </select>
          </div>

          <div className="flex space-x-3 pt-4 border-t border-on-primary-fixed-variant">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="flex-1 py-2.5 bg-on-primary-fixed-variant border border-on-primary-fixed-variant text-on-primary-container font-semibold rounded text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-gradient-to-r from-secondary-container to-secondary-container text-on-primary-fixed font-bold rounded text-xs shadow-sm"
            >
              Add Staff
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
};

export default StaffManagementPage;
