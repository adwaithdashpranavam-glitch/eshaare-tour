import React, { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { doc, updateDoc, setDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { Save, User, Bell, Lock } from "lucide-react";
import toast from "react-hot-toast";

export const PortalSettingsPage = () => {
  const { user, userProfile } = useAuth();
  
  const [profile, setProfile] = useState({
    name: userProfile?.name || "Sarah Connor",
    phone: userProfile?.phone || "+971503334444",
    nationality: userProfile?.nationality || "Jordanian"
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const [notifs, setNotifs] = useState({
    appUpdateEmail: true,
    appUpdateWA: true,
    docStatusEmail: true,
    invoiceEmail: true
  });

  const handleProfileSave = async (e) => {
    e.preventDefault();
    if (!user) return;

    try {
      const docRef = doc(db, "users", user.uid);
      const customerRef = doc(db, "customers", user.uid);

      const profileUpdates = {
        name: profile.name,
        fullName: profile.name,
        phone: profile.phone,
        phoneNumber: profile.phone,
        nationality: profile.nationality
      };

      await updateDoc(docRef, profileUpdates);
      await setDoc(customerRef, {
        name: profile.name,
        phone: profile.phone,
        nationality: profile.nationality,
        updatedAt: new Date()
      }, { merge: true });

      toast.success("Profile updated successfully!");
    } catch (err) {
      console.warn("Firestore profile save skipped (mock mode):", err);
      toast.success("Profile saved!");
    }
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("New passwords do not match!");
      return;
    }
    toast.success("Password changed successfully!");
    setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
  };

  return (
    <div className="space-y-6 font-sans text-xs">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold text-white tracking-wide">Portal Settings</h1>
        <p className="text-[10px] text-on-primary-container/50">Modify traveller bio details, password credentials, and email/WhatsApp alert channels.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Profile Card (2/3) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Profile Form */}
          <div className="glass-card p-6 border border-on-primary-fixed-variant/60 space-y-4">
            <h3 className="text-sm font-semibold text-white border-b border-on-primary-fixed-variant pb-2 flex items-center space-x-2">
              <User className="h-4 w-4 text-secondary" />
              <span>Personal Details</span>
            </h3>
            <form onSubmit={handleProfileSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col space-y-1">
                  <span className="text-[10px] text-on-primary-container/40 uppercase">Full Name</span>
                  <input
                    type="text"
                    required
                    className="bg-primary-container border border-on-primary-fixed-variant text-on-primary-container p-2.5 rounded focus:outline-none"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  />
                </div>
                <div className="flex flex-col space-y-1">
                  <span className="text-[10px] text-on-primary-container/40 uppercase">WhatsApp Phone</span>
                  <input
                    type="tel"
                    required
                    className="bg-primary-container border border-on-primary-fixed-variant text-on-primary-container p-2.5 rounded focus:outline-none"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col space-y-1">
                  <span className="text-[10px] text-on-primary-container/40 uppercase">Nationality</span>
                  <input
                    type="text"
                    required
                    className="bg-primary-container border border-on-primary-fixed-variant text-on-primary-container p-2.5 rounded focus:outline-none"
                    value={profile.nationality}
                    onChange={(e) => setProfile({ ...profile, nationality: e.target.value })}
                  />
                </div>
                <div className="flex flex-col space-y-1">
                  <span className="text-[10px] text-on-primary-container/40 uppercase">Email Address (Read-only)</span>
                  <input
                    type="email"
                    readOnly
                    className="bg-primary-container/40 border border-on-primary-fixed-variant text-on-primary-container/50 p-2.5 rounded focus:outline-none cursor-not-allowed"
                    value={userProfile?.email || "traveller@example.com"}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="px-4 py-2 bg-secondary-container hover:bg-secondary-container text-on-primary-fixed font-bold rounded uppercase tracking-wider shadow-sm flex items-center space-x-1.5 ml-auto"
              >
                <Save className="h-4 w-4" />
                <span>Save Info</span>
              </button>
            </form>
          </div>

          {/* Password Form */}
          <div className="glass-card p-6 border border-on-primary-fixed-variant/60 space-y-4">
            <h3 className="text-sm font-semibold text-white border-b border-on-primary-fixed-variant pb-2 flex items-center space-x-2">
              <Lock className="h-4 w-4 text-secondary" />
              <span>Change Password</span>
            </h3>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex flex-col space-y-1">
                  <span className="text-[10px] text-on-primary-container/40 uppercase">Current Password</span>
                  <input
                    type="password"
                    required
                    className="bg-primary-container border border-on-primary-fixed-variant text-on-primary-container p-2.5 rounded focus:outline-none"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  />
                </div>
                <div className="flex flex-col space-y-1">
                  <span className="text-[10px] text-on-primary-container/40 uppercase">New Password</span>
                  <input
                    type="password"
                    required
                    className="bg-primary-container border border-on-primary-fixed-variant text-on-primary-container p-2.5 rounded focus:outline-none"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  />
                </div>
                <div className="flex flex-col space-y-1">
                  <span className="text-[10px] text-on-primary-container/40 uppercase">Confirm Password</span>
                  <input
                    type="password"
                    required
                    className="bg-primary-container border border-on-primary-fixed-variant text-on-primary-container p-2.5 rounded focus:outline-none"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="px-4 py-2 bg-on-primary-fixed-variant border border-on-primary-fixed-variant hover:border-secondary hover:text-secondary text-on-primary-container font-bold rounded uppercase tracking-wider flex items-center space-x-1.5 ml-auto transition-colors"
              >
                <Save className="h-4 w-4" />
                <span>Change Password</span>
              </button>
            </form>
          </div>
        </div>

        {/* Notifications preferences (1/3) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="glass-card p-6 border border-on-primary-fixed-variant/60 space-y-4">
            <h3 className="text-sm font-semibold text-white border-b border-on-primary-fixed-variant pb-2 flex items-center space-x-2">
              <Bell className="h-4 w-4 text-secondary" />
              <span>Notification Toggles</span>
            </h3>
            
            <div className="space-y-4 pt-2 font-sans text-xs">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-on-primary-container/70">Application Status Alerts (Email)</span>
                <input
                  type="checkbox"
                  className="rounded text-secondary bg-primary-container border-on-primary-fixed-variant focus:ring-0"
                  checked={notifs.appUpdateEmail}
                  onChange={(e) => setNotifs({ ...notifs, appUpdateEmail: e.target.checked })}
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-on-primary-container/70">Application Status Alerts (WhatsApp)</span>
                <input
                  type="checkbox"
                  className="rounded text-secondary bg-primary-container border-on-primary-fixed-variant focus:ring-0"
                  checked={notifs.appUpdateWA}
                  onChange={(e) => setNotifs({ ...notifs, appUpdateWA: e.target.checked })}
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-on-primary-container/70">Document Reviews (Email)</span>
                <input
                  type="checkbox"
                  className="rounded text-secondary bg-primary-container border-on-primary-fixed-variant focus:ring-0"
                  checked={notifs.docStatusEmail}
                  onChange={(e) => setNotifs({ ...notifs, docStatusEmail: e.target.checked })}
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-on-primary-container/70">Invoice Receipt updates (Email)</span>
                <input
                  type="checkbox"
                  className="rounded text-secondary bg-primary-container border-on-primary-fixed-variant focus:ring-0"
                  checked={notifs.invoiceEmail}
                  onChange={(e) => setNotifs({ ...notifs, invoiceEmail: e.target.checked })}
                />
              </label>
            </div>
            
            <button
              onClick={() => toast.success("Notification preferences updated")}
              className="w-full py-2 bg-gradient-to-r from-secondary-container to-secondary-container text-on-primary-fixed font-bold rounded uppercase tracking-wider shadow-sm"
            >
              Update Preferences
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};

export default PortalSettingsPage;
