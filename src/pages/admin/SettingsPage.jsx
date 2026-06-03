import React, { useState, useEffect } from "react";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { Settings, Shield, HelpCircle, Save, Plus, Trash2 } from "lucide-react";
import { VISA_REQUIREMENTS } from "../../utils/constants";
import toast from "react-hot-toast";

export const SettingsPage = () => {
  const [subTab, setSubTab] = useState("general");
  
  // General settings state
  const [generalSettings, setGeneralSettings] = useState({
    agencyName: "ESHAARE Travel & Tourism LLC",
    whatsappHelpdesk: "+971501234567"
  });

  // Visa fee master list state
  const [feeMaster, setFeeMaster] = useState([
    { type: "Schengen", dest: "France", govFee: 380, serviceFee: 450, days: 5 },
    { type: "Schengen", dest: "Germany", govFee: 380, serviceFee: 450, days: 7 },
    { type: "UK Visa", dest: "United Kingdom", govFee: 570, serviceFee: 650, days: 12 },
    { type: "US Visa", dest: "United States", govFee: 730, serviceFee: 800, days: 15 }
  ]);

  const [newFee, setNewFee] = useState({ type: "Schengen", dest: "", govFee: "", serviceFee: "", days: "" });

  // Listen to Firestore settings
  useEffect(() => {
    // 1. General settings
    const unsubGen = onSnapshot(doc(db, "settings", "general"), (snap) => {
      if (snap.exists()) {
        setGeneralSettings(snap.data());
      }
    }, (err) => {
      console.warn("Using local general settings fallback:", err);
    });

    // 2. Visa fee master
    const unsubVisa = onSnapshot(doc(db, "settings", "visaTypes"), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        const list = Object.keys(data).map(key => ({
          dest: key,
          type: data[key].type || "Schengen",
          govFee: data[key].govFee || 0,
          serviceFee: data[key].serviceFee || 0,
          days: data[key].days || 5
        }));
        if (list.length > 0) {
          setFeeMaster(list);
        }
      }
    }, (err) => {
      console.warn("Using local visaType configs fallback:", err);
    });

    return () => {
      unsubGen();
      unsubVisa();
    };
  }, []);

  const handleSaveGeneralSettings = async () => {
    try {
      await setDoc(doc(db, "settings", "general"), generalSettings);
      toast.success("General settings saved successfully!");
    } catch (err) {
      console.error("Error saving general settings:", err);
      toast.error("Failed to save general settings");
    }
  };

  const handleSaveFeeListings = async () => {
    try {
      const payload = {};
      feeMaster.forEach(fee => {
        const normKey = Object.keys(VISA_REQUIREMENTS).find(k => 
          fee.type?.toLowerCase().includes(k.toLowerCase()) || 
          fee.dest?.toLowerCase().includes(k.toLowerCase())
        ) || "Schengen";
        const requiredDocs = VISA_REQUIREMENTS[normKey] || [];

        payload[fee.dest] = {
          type: fee.type,
          dest: fee.dest,
          govFee: Number(fee.govFee),
          serviceFee: Number(fee.serviceFee),
          days: Number(fee.days),
          requiredDocs
        };
      });
      await setDoc(doc(db, "settings", "visaTypes"), payload);
      toast.success("Fee Master configurations saved to Firestore settings/visaTypes");
    } catch (err) {
      console.error("Error saving fee master:", err);
      toast.error("Failed to save Fee Master configurations to Firestore");
    }
  };

  const handleAddFee = () => {
    if (!newFee.dest || !newFee.govFee || !newFee.serviceFee) {
      toast.error("Please fill in all fee master fields");
      return;
    }
    setFeeMaster([...feeMaster, { ...newFee, govFee: Number(newFee.govFee), serviceFee: Number(newFee.serviceFee), days: Number(newFee.days || 5) }]);
    setNewFee({ type: "Schengen", dest: "", govFee: "", serviceFee: "", days: "" });
    toast.success("New fee config row added!");
  };

  const handleRemoveFee = (idx) => {
    setFeeMaster(feeMaster.filter((_, i) => i !== idx));
    toast.success("Fee row removed");
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold text-white tracking-wide">System Settings</h1>
        <p className="text-xs text-on-primary-container/50">Configure agency fee master rates, default message templates and security profiles.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Sub-nav */}
        <div className="lg:col-span-3 glass-card p-4 space-y-2 border border-on-primary-fixed-variant/60">
          {[
            { id: "general", label: "General Settings" },
            { id: "feemaster", label: "Visa Fee Master" },
            { id: "auditlog", label: "System Audit Logs" }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setSubTab(item.id)}
              className={`w-full text-left px-4 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors ${
                subTab === item.id 
                  ? "bg-secondary-container/10 text-secondary border-l-2 border-secondary pl-3.5" 
                  : "text-on-primary-container/60 hover:text-white"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Right Form Fields */}
        <div className="lg:col-span-9 space-y-6">
          
          {subTab === "general" && (
            <div className="glass-card p-6 border border-on-primary-fixed-variant/60 space-y-6 font-sans text-xs">
              <h3 className="text-base font-semibold text-white border-b border-on-primary-fixed-variant pb-2">Business Profile</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col space-y-1">
                  <span className="text-[10px] text-on-primary-container/40 uppercase">Agency Name</span>
                  <input 
                    type="text" 
                    className="bg-primary-container border border-on-primary-fixed-variant p-2 rounded focus:outline-none text-white text-xs" 
                    value={generalSettings.agencyName} 
                    onChange={(e) => setGeneralSettings({ ...generalSettings, agencyName: e.target.value })}
                  />
                </div>
                <div className="flex flex-col space-y-1">
                  <span className="text-[10px] text-on-primary-container/40 uppercase">WhatsApp Helpdesk</span>
                  <input 
                    type="text" 
                    className="bg-primary-container border border-on-primary-fixed-variant p-2 rounded focus:outline-none text-white text-xs" 
                    value={generalSettings.whatsappHelpdesk} 
                    onChange={(e) => setGeneralSettings({ ...generalSettings, whatsappHelpdesk: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleSaveGeneralSettings}
                  className="px-4 py-2 bg-secondary-container hover:bg-secondary-container text-on-primary-fixed font-bold rounded uppercase tracking-wider shadow-sm flex items-center space-x-1.5"
                >
                  <Save className="h-4 w-4" />
                  <span>Save Config</span>
                </button>
              </div>
            </div>
          )}

          {subTab === "feemaster" && (
            <div className="glass-card p-6 border border-on-primary-fixed-variant/60 space-y-6 font-sans text-xs">
              <h3 className="text-base font-semibold text-white border-b border-on-primary-fixed-variant pb-2">Visa Fee Master Listing</h3>
              
              {/* Fee Master Table */}
              <div className="overflow-x-auto border border-on-primary-fixed-variant rounded">
                <table className="min-w-full text-left divide-y divide-outline-variant/15 text-[11px]">
                  <thead>
                    <tr className="bg-primary-container text-on-primary-container/50 uppercase font-bold">
                      <th className="p-3">Visa Type</th>
                      <th className="p-3">Destination</th>
                      <th className="p-3 text-right">Gov Fee</th>
                      <th className="p-3 text-right">Service Fee</th>
                      <th className="p-3 text-center">Days</th>
                      <th className="p-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/20">
                    {feeMaster.map((fee, idx) => (
                      <tr key={idx} className="text-white">
                        <td className="p-3 font-semibold">{fee.type}</td>
                        <td className="p-3">{fee.dest}</td>
                        <td className="p-3 text-right font-mono">{fee.govFee} AED</td>
                        <td className="p-3 text-right font-mono">{fee.serviceFee} AED</td>
                        <td className="p-3 text-center font-mono">{fee.days} days</td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => handleRemoveFee(idx)}
                            className="p-1 text-danger hover:bg-danger/10 rounded"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Add New Fee form */}
              <div className="bg-primary-container p-4 border border-on-primary-fixed-variant rounded space-y-3">
                <h4 className="font-semibold text-white">Add Fee Rule</h4>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <select
                    className="bg-primary-container border border-on-primary-fixed-variant p-2 rounded focus:outline-none"
                    value={newFee.type}
                    onChange={(e) => setNewFee({ ...newFee, type: e.target.value })}
                  >
                    <option value="Schengen">Schengen</option>
                    <option value="UK Visa">UK Visa</option>
                    <option value="US Visa">US Visa</option>
                    <option value="UAE Entry">UAE Entry</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Destination Country"
                    className="bg-primary-container border border-on-primary-fixed-variant p-2 rounded focus:outline-none text-[11px]"
                    value={newFee.dest}
                    onChange={(e) => setNewFee({ ...newFee, dest: e.target.value })}
                  />
                  <input
                    type="number"
                    placeholder="Gov Fee AED"
                    className="bg-primary-container border border-on-primary-fixed-variant p-2 rounded focus:outline-none text-[11px] text-right"
                    value={newFee.govFee}
                    onChange={(e) => setNewFee({ ...newFee, govFee: e.target.value })}
                  />
                  <input
                    type="number"
                    placeholder="Service Fee"
                    className="bg-primary-container border border-on-primary-fixed-variant p-2 rounded focus:outline-none text-[11px] text-right"
                    value={newFee.serviceFee}
                    onChange={(e) => setNewFee({ ...newFee, serviceFee: e.target.value })}
                  />
                  <input
                    type="number"
                    placeholder="Days"
                    className="bg-primary-container border border-on-primary-fixed-variant p-2 rounded focus:outline-none text-[11px] text-center"
                    value={newFee.days}
                    onChange={(e) => setNewFee({ ...newFee, days: e.target.value })}
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddFee}
                  className="px-3 py-1.5 bg-secondary-container hover:bg-secondary-container text-on-primary-fixed font-bold rounded flex items-center space-x-1"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Rule</span>
                </button>
              </div>

              <div className="flex justify-end border-t border-on-primary-fixed-variant pt-4">
                <button
                  onClick={handleSaveFeeListings}
                  className="px-4 py-2 bg-gradient-to-r from-secondary-container to-secondary-container text-on-primary-fixed font-bold rounded uppercase tracking-wider shadow-sm flex items-center space-x-1.5"
                >
                  <Save className="h-4 w-4" />
                  <span>Save Fee Listings</span>
                </button>
              </div>
            </div>
          )}

          {subTab === "auditlog" && (
            <div className="glass-card p-6 border border-on-primary-fixed-variant/60 space-y-4 font-sans text-xs">
              <h3 className="text-base font-semibold text-white border-b border-on-primary-fixed-variant pb-2">System Audit Logs</h3>
              <div className="space-y-3">
                {[
                  { time: "2026-06-01 14:32:01", member: "Rana G.", action: "Verified Document", details: "Original Passport verified for Amit Sharma" },
                  { time: "2026-06-01 11:15:40", member: "Ahmed K.", action: "Stage Advanced", details: "Advanced case VC-20260601-002 to Submitted" },
                  { time: "2026-05-30 09:40:12", member: "Lina M.", action: "Created Quotation", details: "Created Draft QT-20260528-002 for Sarah Connor" }
                ].map((log, idx) => (
                  <div key={idx} className="p-3 bg-white/5 rounded border border-outline-variant/10 flex justify-between gap-4 font-sans leading-relaxed">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2 text-[10px] text-on-primary-container/40">
                        <span className="font-mono">{log.time}</span>
                        <span>•</span>
                        <span className="font-bold text-secondary">{log.member}</span>
                        <span>•</span>
                        <span className="px-1.5 py-0.2 rounded bg-white/5 text-[9px] font-bold text-white uppercase tracking-wider">{log.action}</span>
                      </div>
                      <p className="text-xs text-on-primary-container/80">{log.details}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

    </div>
  );
};

export default SettingsPage;
