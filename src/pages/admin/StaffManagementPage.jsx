import React, { useState, useEffect } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db, functions, httpsCallable } from "../../lib/firebase";
import { UserPlus, Shield, ToggleLeft, ToggleRight, Mail, Trash2, ShieldAlert } from "lucide-react";
import Modal from "../../components/ui/Modal";
import { useAuth } from "../../contexts/AuthContext";
import toast from "react-hot-toast";

export const StaffManagementPage = () => {
  const { userProfile } = useAuth();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [actionLoading, setActionLoading] = useState(null); // stores uid of member undergoing action
  const [staffForm, setStaffForm] = useState({ name: "", email: "", role: "sales", password: "", status: "Active" });

  const isAuthorized = userProfile?.role === "super_admin" || userProfile?.role === "admin";

  if (!isAuthorized) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-4 font-sans">
        <Shield className="h-16 w-16 text-danger animate-pulse" />
        <h1 className="text-xl font-bold text-white uppercase tracking-wide">Access Denied</h1>
        <p className="text-xs text-on-primary-container/60 max-w-md leading-relaxed">
          You do not have the required permissions to access Staff Management. Only Super Admins and Admins can manage staff records.
        </p>
      </div>
    );
  }

  useEffect(() => {
    const sRef = collection(db, "users");
    const unsubscribe = onSnapshot(sRef, (snapshot) => {
      if (!snapshot.empty) {
        const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // Filter to display only staff members (exclude client/customer roles)
        const staffOnly = list.filter(u => u.role && !["client", "customer"].includes(u.role));
        setStaff(staffOnly);
      } else {
        setStaff([]);
      }
      setLoading(false);
    }, (error) => {
      console.warn("Error loading staff logs:", error);
      setStaff([]);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (userProfile?.role !== "super_admin") {
      toast.error("Only Super Admins can create staff accounts.");
      return;
    }
    setCreating(true);
    try {
      const createStaffFn = httpsCallable(functions, "createStaff");
      await createStaffFn({
        name: staffForm.name,
        email: staffForm.email,
        role: staffForm.role,
        password: staffForm.password
      });
      toast.success("Staff account and profile created successfully!");
      setIsAddOpen(false);
      setStaffForm({ name: "", email: "", role: "sales", password: "", status: "Active" });
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Error creating staff record");
    } finally {
      setCreating(false);
    }
  };

  const handleToggleStatus = async (member) => {
    if (userProfile?.role !== "super_admin") {
      toast.error("Only Super Admins can suspend or activate staff.");
      return;
    }
    const nextStatus = member.status === "Active" ? "Suspended" : "Active";
    setActionLoading(member.id);
    try {
      const updateStaffStatusFn = httpsCallable(functions, "updateStaffStatus");
      await updateStaffStatusFn({ uid: member.id, status: nextStatus });
      toast.success(`Staff status set to ${nextStatus}`);
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to update staff status");
    } finally {
      setActionLoading(null);
    }
  };

  const handleChangeRole = async (uid, newRole) => {
    if (userProfile?.role !== "super_admin") {
      toast.error("Only Super Admins can reassign staff roles.");
      return;
    }
    setActionLoading(uid);
    try {
      const updateStaffRoleFn = httpsCallable(functions, "updateStaffRole");
      await updateStaffRoleFn({ uid, role: newRole });
      toast.success("Staff role updated successfully");
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to update staff role");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteStaff = async (member) => {
    if (userProfile?.role !== "super_admin") {
      toast.error("Only Super Admins can delete staff accounts.");
      return;
    }
    if (!window.confirm(`Are you sure you want to permanently delete staff member "${member.name}"? This deletes both Auth and Firestore records.`)) {
      return;
    }
    setActionLoading(member.id);
    try {
      const deleteStaffFn = httpsCallable(functions, "deleteStaff");
      await deleteStaffFn({ uid: member.id });
      toast.success("Staff member deleted successfully");
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to delete staff member");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-white tracking-wide">Staff Management</h1>
          <p className="text-xs text-on-primary-container/50">Manage internal officer roles, permission credentials, and dashboard assignees.</p>
        </div>
        {userProfile?.role === "super_admin" && (
          <button
            onClick={() => setIsAddOpen(true)}
            className="px-4 py-2 bg-gradient-to-r from-secondary-container to-secondary-container text-on-primary-fixed font-bold text-xs rounded-button flex items-center space-x-1.5 shadow-sm hover:-translate-y-0.5 transition-all"
          >
            <UserPlus className="h-4 w-4" />
            <span>Add Staff Member</span>
          </button>
        )}
      </div>

      {userProfile?.role !== "super_admin" && (
        <div className="flex items-center space-x-3 p-4 bg-amber-500/10 border border-amber-500/25 rounded text-amber-400 text-xs">
          <ShieldAlert className="h-5 w-5 flex-shrink-0" />
          <span>Note: You are logged in as Admin. Staff creation, status updates, deletions, and role promotions are restricted to Super Admins only.</span>
        </div>
      )}

      {/* Staff Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-3 text-center text-xs text-on-primary-container/50 py-12">Loading Staff Records...</div>
        ) : staff.length === 0 ? (
          <div className="col-span-3 text-center text-xs text-on-primary-container/50 py-12">No Staff accounts found.</div>
        ) : (
          staff.map((member) => (
            <div key={member.id} className={`glass-card p-6 border border-on-primary-fixed-variant/60 flex flex-col justify-between space-y-4 relative ${
              actionLoading === member.id ? "opacity-50 pointer-events-none" : ""
            }`}>
              <div className="flex justify-between items-start">
                <div className="h-10 w-10 rounded-full bg-secondary-container/10 border border-secondary/20 text-secondary font-bold text-sm flex items-center justify-center">
                  {member.name?.slice(0, 2).toUpperCase() || "ST"}
                </div>
                <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${
                  member.status === "Active" ? "bg-success/15 text-success" : "bg-danger/15 text-danger"
                }`}>
                  {member.status || "Active"}
                </span>
              </div>
              
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-white">{member.name}</h3>
                <p className="text-xs text-on-primary-container/60 flex items-center truncate"><Mail className="h-3.5 w-3.5 mr-1 flex-shrink-0" /> {member.email}</p>
              </div>

              <div className="pt-3 border-t border-on-primary-fixed-variant flex justify-between items-center text-xs">
                <span className="font-bold text-secondary uppercase tracking-widest text-[9px]">Role: {member.role}</span>
                <span className="text-on-primary-container/40">Cases: {member.casesHandled || 0}</span>
              </div>

              {/* Super Admin operations */}
              {userProfile?.role === "super_admin" && member.role !== "super_admin" && (
                <div className="pt-3 border-t border-on-primary-fixed-variant/40 flex items-center justify-between gap-2">
                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => handleToggleStatus(member)}
                      className={`px-2 py-1 rounded text-[8px] font-bold uppercase transition-colors ${
                        member.status === "Active" 
                          ? "bg-amber-500/10 text-amber-500 hover:bg-amber-500/25" 
                          : "bg-success/10 text-success hover:bg-success/25"
                      }`}
                      title={member.status === "Active" ? "Suspend Account" : "Activate Account"}
                    >
                      {member.status === "Active" ? "Suspend" : "Activate"}
                    </button>
                    
                    <button
                      onClick={() => handleDeleteStaff(member)}
                      className="p-1 bg-red-500/10 text-red-500 hover:bg-red-500/25 rounded transition-colors"
                      title="Delete Staff"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <select
                    value={member.role}
                    onChange={(e) => handleChangeRole(member.id, e.target.value)}
                    className="px-1.5 py-0.5 bg-primary-container border border-on-primary-fixed-variant text-on-primary-container rounded text-[9px] focus:outline-none cursor-pointer"
                  >
                    <option value="admin">Admin</option>
                    <option value="manager">Manager</option>
                    <option value="sales">Sales</option>
                    <option value="visa_ops">Visa Ops</option>
                    <option value="finance">Finance</option>
                    <option value="support">Support</option>
                  </select>
                </div>
              )}
            </div>
          ))
        )}
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
              disabled={creating}
              placeholder="e.g. Lina Malik"
              className="px-3 py-2 bg-primary-container border border-on-primary-fixed-variant text-on-primary-container rounded focus:outline-none disabled:opacity-50"
              value={staffForm.name}
              onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
            />
          </div>
          <div className="flex flex-col space-y-1">
            <label className="text-[10px] font-bold text-on-primary-container/50 uppercase">Email Address</label>
            <input
              type="email"
              required
              disabled={creating}
              placeholder="lina@eshaare.com"
              className="px-3 py-2 bg-primary-container border border-on-primary-fixed-variant text-on-primary-container rounded focus:outline-none disabled:opacity-50"
              value={staffForm.email}
              onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
            />
          </div>
          <div className="flex flex-col space-y-1">
            <label className="text-[10px] font-bold text-on-primary-container/50 uppercase">Initial Password</label>
            <input
              type="password"
              required
              disabled={creating}
              placeholder="••••••••"
              minLength={6}
              className="px-3 py-2 bg-primary-container border border-on-primary-fixed-variant text-on-primary-container rounded focus:outline-none disabled:opacity-50"
              value={staffForm.password}
              onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })}
            />
          </div>
          <div className="flex flex-col space-y-1">
            <label className="text-[10px] font-bold text-on-primary-container/50 uppercase">Access Role</label>
            <select
              disabled={creating}
              className="px-3 py-2 bg-primary-container border border-on-primary-fixed-variant text-on-primary-container rounded focus:outline-none disabled:opacity-50"
              value={staffForm.role}
              onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value })}
            >
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="sales">Sales Consultant</option>
              <option value="visa_ops">Visa Ops Officer</option>
              <option value="finance">Finance Specialist</option>
              <option value="support">Support Specialist</option>
            </select>
          </div>

          <div className="flex space-x-3 pt-4 border-t border-on-primary-fixed-variant">
            <button
              type="button"
              disabled={creating}
              onClick={() => setIsAddOpen(false)}
              className="flex-1 py-2.5 bg-on-primary-fixed-variant border border-on-primary-fixed-variant text-on-primary-container font-semibold rounded text-xs disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating}
              className="flex-1 py-2.5 bg-gradient-to-r from-secondary-container to-secondary-container text-on-primary-fixed font-bold rounded text-xs shadow-sm disabled:opacity-50 flex items-center justify-center space-x-1"
            >
              {creating ? <span>Creating...</span> : <span>Add Staff</span>}
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
};

export default StaffManagementPage;
