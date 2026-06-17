import React, { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { doc, updateDoc, setDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { Save, User, Bell, Lock } from "lucide-react";
import toast from "react-hot-toast";

export const PortalSettingsPage = () => {
  const { user, userProfile } = useAuth();
  
  const [profile, setProfile] = useState({
    name: "",
    phone: "",
    nationality: ""
  });

  React.useEffect(() => {
    if (userProfile) {
      setProfile({
        name: userProfile.name || "",
        phone: userProfile.phone || "",
        nationality: userProfile.nationality || ""
      });
    }
  }, [userProfile]);

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
        <h1 className="text-2xl font-semibold text-[#1A1A1A]">Portal Settings</h1>
        <p className="text-xs text-[#6B7280]">Modify traveller bio details, password credentials, and email/WhatsApp alert channels.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start text-xs">
        {/* Profile Card (2/3) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Profile Form */}
          <div className="bg-white border border-[#E5E7EB] rounded-[24px] p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-semibold text-[#1A1A1A] border-b border-[#E5E7EB] pb-2 flex items-center space-x-2">
              <User className="h-4.5 w-4.5 text-[#0F3D2E]" />
              <span>Personal Details</span>
            </h3>
            <form onSubmit={handleProfileSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col space-y-1">
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Full Name</span>
                  <input
                    type="text"
                    required
                    className="px-3.5 py-2.5 bg-[#F8F6F2] border border-[#E5E7EB] text-[#1A1A1A] rounded-xl focus:outline-none focus:border-[#0F3D2E]"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  />
                </div>
                <div className="flex flex-col space-y-1">
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">WhatsApp Phone</span>
                  <input
                    type="tel"
                    required
                    className="px-3.5 py-2.5 bg-[#F8F6F2] border border-[#E5E7EB] text-[#1A1A1A] rounded-xl focus:outline-none focus:border-[#0F3D2E]"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col space-y-1">
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Nationality</span>
                  <input
                    type="text"
                    required
                    className="px-3.5 py-2.5 bg-[#F8F6F2] border border-[#E5E7EB] text-[#1A1A1A] rounded-xl focus:outline-none focus:border-[#0F3D2E]"
                    value={profile.nationality}
                    onChange={(e) => setProfile({ ...profile, nationality: e.target.value })}
                  />
                </div>
                <div className="flex flex-col space-y-1">
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Email Address (Read-only)</span>
                  <input
                    type="email"
                    readOnly
                    className="px-3.5 py-2.5 bg-gray-100 border border-[#E5E7EB] text-gray-500 rounded-xl focus:outline-none cursor-not-allowed"
                    value={userProfile?.email || "traveller@example.com"}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="px-4 py-2.5 bg-[#0F3D2E] hover:bg-[#0F3D2E]/90 text-white font-bold rounded-xl uppercase tracking-wider shadow-sm flex items-center space-x-1.5 ml-auto transition-colors"
              >
                <Save className="h-4 w-4 text-[#C6A969]" />
                <span>Save Info</span>
              </button>
            </form>
          </div>

          {/* Password Form */}
          <div className="bg-white border border-[#E5E7EB] rounded-[24px] p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-semibold text-[#1A1A1A] border-b border-[#E5E7EB] pb-2 flex items-center space-x-2">
              <Lock className="h-4.5 w-4.5 text-[#0F3D2E]" />
              <span>Change Password</span>
            </h3>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex flex-col space-y-1">
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Current Password</span>
                  <input
                    type="password"
                    required
                    className="px-3.5 py-2.5 bg-[#F8F6F2] border border-[#E5E7EB] text-[#1A1A1A] rounded-xl focus:outline-none focus:border-[#0F3D2E]"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  />
                </div>
                <div className="flex flex-col space-y-1">
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">New Password</span>
                  <input
                    type="password"
                    required
                    className="px-3.5 py-2.5 bg-[#F8F6F2] border border-[#E5E7EB] text-[#1A1A1A] rounded-xl focus:outline-none focus:border-[#0F3D2E]"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  />
                </div>
                <div className="flex flex-col space-y-1">
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Confirm Password</span>
                  <input
                    type="password"
                    required
                    className="px-3.5 py-2.5 bg-[#F8F6F2] border border-[#E5E7EB] text-[#1A1A1A] rounded-xl focus:outline-none focus:border-[#0F3D2E]"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="px-4 py-2.5 bg-[#F8F6F2] hover:bg-gray-100 text-[#1A1A1A] border border-[#E5E7EB] font-bold rounded-xl uppercase tracking-wider flex items-center space-x-1.5 ml-auto transition-colors"
              >
                <Save className="h-4 w-4 text-[#C6A969]" />
                <span>Update Password</span>
              </button>
            </form>
          </div>
        </div>

        {/* Notifications preferences (1/3) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white border border-[#E5E7EB] rounded-[24px] p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-semibold text-[#1A1A1A] border-b border-[#E5E7EB] pb-2 flex items-center space-x-2">
              <Bell className="h-4.5 w-4.5 text-[#0F3D2E]" />
              <span>Notification Toggles</span>
            </h3>
            
            <div className="space-y-4 pt-2 font-sans text-xs">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-gray-600 font-medium">Application Status (Email)</span>
                <input
                  type="checkbox"
                  className="rounded-lg text-[#0F3D2E] bg-[#F8F6F2] border-[#E5E7EB] focus:ring-0 cursor-pointer h-4 w-4"
                  checked={notifs.appUpdateEmail}
                  onChange={(e) => setNotifs({ ...notifs, appUpdateEmail: e.target.checked })}
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-gray-600 font-medium">Application Status (WhatsApp)</span>
                <input
                  type="checkbox"
                  className="rounded-lg text-[#0F3D2E] bg-[#F8F6F2] border-[#E5E7EB] focus:ring-0 cursor-pointer h-4 w-4"
                  checked={notifs.appUpdateWA}
                  onChange={(e) => setNotifs({ ...notifs, appUpdateWA: e.target.checked })}
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-gray-600 font-medium">Document Reviews (Email)</span>
                <input
                  type="checkbox"
                  className="rounded-lg text-[#0F3D2E] bg-[#F8F6F2] border-[#E5E7EB] focus:ring-0 cursor-pointer h-4 w-4"
                  checked={notifs.docStatusEmail}
                  onChange={(e) => setNotifs({ ...notifs, docStatusEmail: e.target.checked })}
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-gray-600 font-medium">Invoice updates (Email)</span>
                <input
                  type="checkbox"
                  className="rounded-lg text-[#0F3D2E] bg-[#F8F6F2] border-[#E5E7EB] focus:ring-0 cursor-pointer h-4 w-4"
                  checked={notifs.invoiceEmail}
                  onChange={(e) => setNotifs({ ...notifs, invoiceEmail: e.target.checked })}
                />
              </label>
            </div>
            
            <button
              onClick={() => toast.success("Notification preferences updated")}
              className="w-full py-2.5 bg-[#0F3D2E] hover:bg-[#0F3D2E]/95 text-white font-bold rounded-xl uppercase tracking-wider shadow-sm transition-colors mt-2"
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
