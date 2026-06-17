import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useTravelerProfile } from "../../contexts/TravelerProfileContext";
import { completeUserProfile } from "../../lib/firestore";
import { createEmptyProfile, STEP_META } from "../../components/portal/ProfileSteps";
import { STEP_VALIDATORS } from "../../utils/profileValidation";
import { ChevronDown, Save, BadgeCheck, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

const mergeProfile = (saved) => {
  const base = createEmptyProfile();
  if (!saved) return base;
  const merged = { ...base };
  Object.keys(base).forEach((section) => {
    merged[section] = { ...base[section], ...(saved[section] || {}) };
  });
  return merged;
};

export const PortalProfilePage = () => {
  const { user } = useAuth();
  const { profile: liveProfile } = useTravelerProfile();
  const [profile, setProfile] = useState(createEmptyProfile());
  const [openSection, setOpenSection] = useState("personalInformation");
  const [errorsBySection, setErrorsBySection] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (liveProfile) setProfile(mergeProfile(liveProfile));
  }, [liveProfile]);

  const updateSection = (key, value) => {
    setProfile((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    // Validate all sections
    const allErrors = {};
    for (let s = 1; s <= 6; s++) {
      const v = STEP_VALIDATORS[s];
      const errs = v.fn(profile[v.key] || {});
      if (Object.keys(errs).length > 0) allErrors[v.key] = errs;
    }
    if (Object.keys(allErrors).length > 0) {
      setErrorsBySection(allErrors);
      const firstKey = Object.keys(allErrors)[0];
      setOpenSection(firstKey);
      toast.error("Please fix the highlighted fields before saving.");
      return;
    }
    setErrorsBySection({});
    try {
      setSaving(true);
      await completeUserProfile(user.uid, profile);
      toast.success("Profile updated successfully!");
    } catch (e) {
      toast.error("Could not save profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#1A1A1A] flex items-center gap-2">
            My Travel Profile
            {liveProfile?.profileCompleted && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#0F3D2E]/10 text-[#0F3D2E] text-[10px] font-bold uppercase tracking-wider">
                <BadgeCheck className="h-3 w-3" /> Verified
              </span>
            )}
          </h1>
          <p className="text-xs text-[#6B7280] mt-1">
            Reused across all your future visa applications. Keep it accurate and up to date.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-[#0F3D2E] hover:bg-[#0F3D2E]/90 text-white font-bold rounded-xl uppercase tracking-wider text-xs shadow-sm transition-colors shrink-0 disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 text-[#C6A969]" />}
          Save
        </button>
      </div>

      {/* Accordion sections */}
      <div className="space-y-3">
        {STEP_META.map((s) => {
          const isOpen = openSection === s.key;
          const hasError = !!errorsBySection[s.key];
          return (
            <div key={s.key} className="bg-white border border-[#E5E7EB] rounded-[24px] shadow-sm overflow-hidden">
              <button
                onClick={() => setOpenSection(isOpen ? null : s.key)}
                className="w-full flex items-center justify-between px-6 py-4 text-left"
              >
                <span className={`text-sm font-bold uppercase tracking-wider flex items-center gap-2 ${hasError ? "text-red-500" : "text-[#0F3D2E]"}`}>
                  {s.title}
                  {hasError && <span className="text-[10px] normal-case font-medium">• needs attention</span>}
                </span>
                <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
              </button>
              {isOpen && (
                <div className="px-6 pb-6 border-t border-[#E5E7EB] pt-5">
                  {React.createElement(s.Section, {
                    data: profile[s.key],
                    onChange: (val) => updateSection(s.key, val),
                    errors: errorsBySection[s.key] || {}
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-1.5 px-5 py-3 bg-[#0F3D2E] hover:bg-[#0F3D2E]/90 text-white font-bold rounded-xl uppercase tracking-wider text-xs shadow-sm transition-colors disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 text-[#C6A969]" />}
          Save Changes
        </button>
      </div>
    </div>
  );
};

export default PortalProfilePage;
