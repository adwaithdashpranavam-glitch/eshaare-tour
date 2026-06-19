import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import {
  getUserProfile,
  saveProfileDraft,
  completeUserProfile
} from "../../lib/firestore";
import {
  createEmptyProfile,
  STEP_META
} from "../../components/portal/ProfileSteps";
import { STEP_VALIDATORS } from "../../utils/profileValidation";
import { LoadingSpinner } from "../../components/ui/LoadingSpinner";
import {
  ShieldCheck, ChevronLeft, ChevronRight, Check, Loader2,
  CloudUpload, Pencil, BadgeCheck, LogOut
} from "lucide-react";
import foxLogo from "../../assets/fox-logo.png";
import toast from "react-hot-toast";

// Deep-merge a saved profile over the empty template so missing keys are filled.
const mergeProfile = (saved) => {
  const base = createEmptyProfile();
  if (!saved) return base;
  const merged = { ...base };
  Object.keys(base).forEach((section) => {
    merged[section] = { ...base[section], ...(saved[section] || {}) };
  });
  return merged;
};

const INTRO_POINTS = [
  "Enter details exactly as shown on your passport and official government documents.",
  "Incorrect information may lead to visa delays or rejection.",
  "This profile only needs to be completed once.",
  "Future visa applications can be submitted in minutes.",
  "Family members can be added later."
];

export const PortalVerifyProfilePage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/portal/login", { replace: true });
  };

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(createEmptyProfile());
  const [screen, setScreen] = useState(0); // 0 intro, 1..6 steps, 7 review
  const [introConfirmed, setIntroConfirmed] = useState(false);
  const [finalConfirmed, setFinalConfirmed] = useState(false);
  const [errors, setErrors] = useState({});
  const [saveState, setSaveState] = useState("idle"); // idle | saving | saved
  const [submitting, setSubmitting] = useState(false);

  const saveTimer = useRef(null);
  const isFirstLoad = useRef(true);

  // Load existing draft
  useEffect(() => {
    let active = true;
    (async () => {
      if (!user?.uid) return;
      try {
        const saved = await getUserProfile(user.uid);
        if (!active) return;
        // Already verified — don't show onboarding again
        if (saved?.profileCompleted) {
          navigate("/portal/dashboard", { replace: true });
          return;
        }
        if (saved) {
          setProfile(mergeProfile(saved));
          if (typeof saved.currentStep === "number") {
            setScreen(saved.currentStep);
            if (saved.currentStep > 0) setIntroConfirmed(true);
          }
        }
      } catch (e) {
        console.warn("Could not load profile draft:", e);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [user?.uid]);

  // Debounced autosave whenever profile or screen changes (after initial load)
  const scheduleSave = useCallback((nextProfile, nextScreen) => {
    if (!user?.uid) return;
    setSaveState("saving");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        await saveProfileDraft(user.uid, { ...nextProfile, currentStep: nextScreen });
        setSaveState("saved");
        setTimeout(() => setSaveState("idle"), 1500);
      } catch (e) {
        setSaveState("idle");
        console.warn("Autosave failed:", e);
      }
    }, 900);
  }, [user?.uid]);

  useEffect(() => {
    if (loading) return;
    if (isFirstLoad.current) {
      isFirstLoad.current = false;
      return;
    }
    scheduleSave(profile, screen);
  }, [profile, screen, loading, scheduleSave]);

  // Warn before accidental tab close while editing
  useEffect(() => {
    const handler = (e) => {
      if (saveState === "saving") {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [saveState]);

  const updateSection = (sectionKey, value) => {
    setProfile((prev) => ({ ...prev, [sectionKey]: value }));
  };

  const validateStep = (stepNumber) => {
    const v = STEP_VALIDATORS[stepNumber];
    if (!v) return true;
    const errs = v.fn(profile[v.key] || {});
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const goNext = () => {
    if (screen === 0) {
      if (!introConfirmed) return;
      setScreen(1);
      return;
    }
    if (screen >= 1 && screen <= 6) {
      if (!validateStep(screen)) {
        toast.error("Please complete the required fields before continuing.");
        return;
      }
      setErrors({});
      setScreen(screen + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const goBack = () => {
    if (screen > 0) {
      setErrors({});
      setScreen(screen - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleSaveAndExit = async () => {
    if (!user?.uid) return;
    try {
      setSaveState("saving");
      await saveProfileDraft(user.uid, { ...profile, currentStep: screen });
      toast.success("Draft saved. You can complete it later.");
      navigate("/portal/verify-profile");
    } catch (e) {
      toast.error("Could not save draft.");
    } finally {
      setSaveState("idle");
    }
  };

  const handleSubmit = async () => {
    // Validate every step before final submit
    for (let s = 1; s <= 6; s++) {
      const v = STEP_VALIDATORS[s];
      const errs = v.fn(profile[v.key] || {});
      if (Object.keys(errs).length > 0) {
        setErrors(errs);
        setScreen(s);
        toast.error(`Please complete the "${STEP_META[s - 1].title}" section.`);
        return;
      }
    }
    if (!finalConfirmed) {
      toast.error("Please confirm the declaration to complete verification.");
      return;
    }
    try {
      setSubmitting(true);
      await completeUserProfile(user.uid, profile);
      toast.success("Profile verified successfully!");
      navigate("/portal/dashboard", { replace: true });
    } catch (e) {
      toast.error("Submission failed. Please try again.");
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading your travel profile..." fullScreen={true} />;

  const totalSteps = 6;
  const progressPct = screen === 0 ? 0 : Math.round(((Math.min(screen, totalSteps)) / totalSteps) * 100);

  return (
    <div className="min-h-screen w-full bg-[#F8F6F2] text-[#1A1A1A] font-sans antialiased flex flex-col">
      {/* Header */}
      <header className="h-16 bg-white border-b border-[#E5E7EB] sticky top-0 z-30 flex items-center justify-between px-4 md:px-8">
        <div className="flex items-center gap-2">
          <img src={foxLogo} alt="Eshaare Tour" className="h-9 w-auto object-contain" />
          <div className="leading-none">
            <h1 className="text-base md:text-lg text-[#0F3D2E] font-bold" style={{ fontFamily: "'Great Vibes', cursive" }}>
              Eshaare Tour
            </h1>
            <p className="text-[5px] tracking-[0.25em] uppercase text-gray-500 font-semibold">Visa Concierge</p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-[11px]">
          {saveState === "saving" && (
            <span className="flex items-center gap-1 text-gray-400"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…</span>
          )}
          {saveState === "saved" && (
            <span className="flex items-center gap-1 text-[#0F3D2E]"><Check className="h-3.5 w-3.5" /> Draft saved</span>
          )}
          {screen > 0 && (
            <button
              onClick={handleSaveAndExit}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E5E7EB] text-[#6B7280] hover:text-[#0F3D2E] hover:border-[#0F3D2E]/40 font-semibold transition-colors"
            >
              <CloudUpload className="h-3.5 w-3.5" /> Save &amp; finish later
            </button>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E5E7EB] text-[#6B7280] hover:text-red-600 hover:border-red-200 hover:bg-red-50 font-semibold transition-colors"
            title="Log out"
          >
            <LogOut className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Log out</span>
          </button>
        </div>
      </header>

      <main className="flex-1 w-full max-w-3xl mx-auto px-4 md:px-6 py-8">
        {/* ============ SCREEN 0 — INTRO ============ */}
        {screen === 0 && (
          <div className="bg-white border border-[#E5E7EB] rounded-[28px] shadow-sm overflow-hidden">
            <div className="bg-gradient-to-br from-[#0F3D2E] to-[#155740] px-6 md:px-10 py-10 text-center">
              <div className="inline-flex h-16 w-16 rounded-2xl bg-white/10 border border-white/20 items-center justify-center mb-4">
                <ShieldCheck className="h-8 w-8 text-[#C6A969]" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-white">Complete Your Travel Profile</h2>
              <p className="text-[#C6A969] text-xs uppercase tracking-[0.2em] font-semibold mt-2">One-time verification</p>
            </div>
            <div className="px-6 md:px-10 py-8 space-y-6">
              <p className="text-sm text-[#1A1A1A] font-medium">To ensure successful visa processing:</p>
              <ul className="space-y-3">
                {INTRO_POINTS.map((point) => (
                  <li key={point} className="flex items-start gap-3">
                    <span className="mt-0.5 h-5 w-5 rounded-full bg-[#0F3D2E]/10 flex items-center justify-center shrink-0">
                      <Check className="h-3 w-3 text-[#0F3D2E]" />
                    </span>
                    <span className="text-[13px] leading-relaxed text-[#6B7280]">{point}</span>
                  </li>
                ))}
              </ul>

              <label className="flex items-start gap-3 cursor-pointer select-none bg-[#F8F6F2] border border-[#E5E7EB] rounded-xl px-4 py-3.5">
                <input
                  type="checkbox"
                  checked={introConfirmed}
                  onChange={(e) => setIntroConfirmed(e.target.checked)}
                  className="mt-0.5 rounded text-[#0F3D2E] bg-white border-[#E5E7EB] focus:ring-0 h-4 w-4 cursor-pointer shrink-0"
                />
                <span className="text-[13px] text-[#1A1A1A] font-medium leading-relaxed">
                  I confirm that all information entered will match my official documents.
                </span>
              </label>

              <button
                onClick={goNext}
                disabled={!introConfirmed}
                className={`w-full py-3.5 rounded-xl font-bold uppercase tracking-wider text-sm flex items-center justify-center gap-2 transition-all ${
                  introConfirmed
                    ? "bg-[#0F3D2E] text-white hover:bg-[#0F3D2E]/90 shadow-sm"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }`}
              >
                Continue <ChevronRight className="h-4 w-4 text-[#C6A969]" />
              </button>
            </div>
          </div>
        )}

        {/* ============ STEPS 1-6 ============ */}
        {screen >= 1 && screen <= 6 && (
          <div className="space-y-6">
            {/* Stepper */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold text-[#0F3D2E] uppercase tracking-wider">
                  Step {screen} of {totalSteps}
                </p>
                <p className="text-[11px] text-gray-400 font-medium">{progressPct}% complete</p>
              </div>
              <div className="h-1.5 w-full bg-[#E5E7EB] rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[#0F3D2E] to-[#C6A969] transition-all duration-500" style={{ width: `${progressPct}%` }} />
              </div>
              {/* Step dots */}
              <div className="hidden md:flex items-center justify-between mt-4">
                {STEP_META.map((s, i) => {
                  const n = i + 1;
                  const done = n < screen;
                  const active = n === screen;
                  return (
                    <button
                      key={s.key}
                      onClick={() => { if (n < screen) { setErrors({}); setScreen(n); } }}
                      className="flex flex-col items-center gap-1.5 flex-1 group"
                    >
                      <span className={`h-7 w-7 rounded-full flex items-center justify-center text-[11px] font-bold transition-all ${
                        active ? "bg-[#0F3D2E] text-white ring-4 ring-[#0F3D2E]/10"
                        : done ? "bg-[#0F3D2E]/10 text-[#0F3D2E]" : "bg-[#E5E7EB] text-gray-400"
                      }`}>
                        {done ? <Check className="h-3.5 w-3.5" /> : n}
                      </span>
                      <span className={`text-[9px] text-center leading-tight ${active ? "text-[#0F3D2E] font-bold" : "text-gray-400 font-medium"}`}>
                        {s.title}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Section card */}
            <div className="bg-white border border-[#E5E7EB] rounded-[24px] shadow-sm p-6 md:p-8">
              <h3 className="text-lg font-bold text-[#1A1A1A] mb-1">{STEP_META[screen - 1].title}</h3>
              <div className="h-px bg-[#E5E7EB] my-4" />
              {React.createElement(STEP_META[screen - 1].Section, {
                data: profile[STEP_META[screen - 1].key],
                onChange: (val) => updateSection(STEP_META[screen - 1].key, val),
                errors
              })}
            </div>

            {/* Nav buttons */}
            <div className="flex items-center justify-between gap-3">
              <button
                onClick={goBack}
                className="flex items-center gap-1.5 px-5 py-3 rounded-xl border border-[#E5E7EB] bg-white text-[#6B7280] hover:text-[#0F3D2E] hover:border-[#0F3D2E]/40 font-bold uppercase tracking-wider text-xs transition-colors"
              >
                <ChevronLeft className="h-4 w-4" /> Back
              </button>
              <button
                onClick={goNext}
                className="flex items-center gap-1.5 px-6 py-3 rounded-xl bg-[#0F3D2E] text-white hover:bg-[#0F3D2E]/90 font-bold uppercase tracking-wider text-xs shadow-sm transition-colors"
              >
                {screen === 6 ? "Review" : "Next"} <ChevronRight className="h-4 w-4 text-[#C6A969]" />
              </button>
            </div>
          </div>
        )}

        {/* ============ SCREEN 7 — REVIEW ============ */}
        {screen === 7 && (
          <ReviewScreen
            profile={profile}
            onEdit={(stepNumber) => { setErrors({}); setScreen(stepNumber); window.scrollTo({ top: 0 }); }}
            finalConfirmed={finalConfirmed}
            setFinalConfirmed={setFinalConfirmed}
            onBack={goBack}
            onSubmit={handleSubmit}
            submitting={submitting}
          />
        )}
      </main>
    </div>
  );
};

// ---- Review screen ----
const prettyValue = (v) => {
  if (v === undefined || v === null || v === "") return "—";
  if (Array.isArray(v)) return v.length ? v.join(", ") : "—";
  if (typeof v === "object") {
    if ("dialCode" in v || "number" in v) {
      return v.number ? `${v.dialCode || ""} ${v.number}`.trim() : "—";
    }
    return "—";
  }
  if (v === "yes") return "Yes";
  if (v === "no") return "No";
  return String(v);
};

const LABELS = {
  surname: "Surname", givenName: "Given Name", middleName: "Middle Name", formerName: "Former Name",
  gender: "Gender", dateOfBirth: "Date of Birth", placeOfBirth: "Place of Birth", countryOfBirth: "Country of Birth",
  currentNationality: "Current Nationality", nationalityAtBirth: "Nationality at Birth", otherNationalities: "Other Nationalities",
  nationalId: "National ID", maritalStatus: "Marital Status",
  passportType: "Passport Type", passportNumber: "Passport Number", dateOfIssue: "Date of Issue", dateOfExpiry: "Date of Expiry",
  issuingCountry: "Issuing Country", issuingAuthority: "Issuing Authority", placeOfIssue: "Place of Issue",
  holdsAnotherPassport: "Holds Another Passport", secondPassportNumber: "2nd Passport Number", secondPassportCountry: "2nd Passport Country",
  secondPassportExpiry: "2nd Passport Expiry",
  email: "Email", mobile: "Mobile", whatsappSameAsMobile: "WhatsApp = Mobile", whatsapp: "WhatsApp",
  addressLine1: "Address Line 1", addressLine2: "Address Line 2", city: "City", state: "State / Province", country: "Country", postalCode: "Postal Code",
  residingInUae: "Residing in UAE", emiratesId: "Emirates ID", residenceVisaNumber: "Residence Visa No.", unifiedNumber: "Unified No. (UID)",
  visaIssueDate: "Visa Issue Date", visaExpiryDate: "Visa Expiry Date", emirate: "Emirate", sponsorType: "Sponsor Type",
  occupationOnVisa: "Occupation on Visa", firstEnteredUae: "First Entered UAE",
  currentStatus: "Current Status", occupation: "Occupation", employerName: "Employer", employerAddress: "Employer Address",
  employerPhone: "Employer Phone", employerEmail: "Employer Email", employmentStartDate: "Employment Start",
  institutionName: "Institution", institutionAddress: "Institution Address", course: "Course", yearOfStudy: "Year of Study",
  fullName: "Full Name", relationship: "Relationship", address: "Address"
};

const ReviewScreen = ({ profile, onEdit, finalConfirmed, setFinalConfirmed, onBack, onSubmit, submitting }) => (
  <div className="space-y-6">
    <div className="text-center">
      <div className="inline-flex h-14 w-14 rounded-2xl bg-[#0F3D2E]/10 items-center justify-center mb-3">
        <BadgeCheck className="h-7 w-7 text-[#0F3D2E]" />
      </div>
      <h2 className="text-2xl font-bold text-[#1A1A1A]">Review &amp; Submit</h2>
      <p className="text-xs text-[#6B7280] mt-1">Please review all sections carefully before submitting.</p>
    </div>

    {STEP_META.map((s, i) => {
      const sectionData = profile[s.key] || {};
      const entries = Object.entries(sectionData).filter(([k]) => LABELS[k]);
      return (
        <div key={s.key} className="bg-white border border-[#E5E7EB] rounded-[24px] shadow-sm p-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-[#0F3D2E] uppercase tracking-wider">{s.title}</h3>
            <button
              onClick={() => onEdit(i + 1)}
              className="flex items-center gap-1 text-[11px] font-bold text-[#6B7280] hover:text-[#0F3D2E] uppercase tracking-wider transition-colors"
            >
              <Pencil className="h-3 w-3" /> Edit
            </button>
          </div>
          <div className="h-px bg-[#E5E7EB] mb-4" />
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
            {entries.map(([k, v]) => (
              <div key={k} className="flex flex-col">
                <dt className="text-[10px] uppercase tracking-wider font-bold text-gray-400">{LABELS[k]}</dt>
                <dd className="text-[13px] text-[#1A1A1A] font-medium break-words">{prettyValue(v)}</dd>
              </div>
            ))}
          </dl>
        </div>
      );
    })}

    <label className="flex items-start gap-3 cursor-pointer select-none bg-white border border-[#E5E7EB] rounded-xl px-4 py-3.5">
      <input
        type="checkbox"
        checked={finalConfirmed}
        onChange={(e) => setFinalConfirmed(e.target.checked)}
        className="mt-0.5 rounded text-[#0F3D2E] bg-[#F8F6F2] border-[#E5E7EB] focus:ring-0 h-4 w-4 cursor-pointer shrink-0"
      />
      <span className="text-[13px] text-[#1A1A1A] font-medium leading-relaxed">
        I confirm all information is accurate and matches my official documents.
      </span>
    </label>

    <div className="flex items-center justify-between gap-3">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 px-5 py-3 rounded-xl border border-[#E5E7EB] bg-white text-[#6B7280] hover:text-[#0F3D2E] hover:border-[#0F3D2E]/40 font-bold uppercase tracking-wider text-xs transition-colors"
      >
        <ChevronLeft className="h-4 w-4" /> Back
      </button>
      <button
        onClick={onSubmit}
        disabled={!finalConfirmed || submitting}
        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold uppercase tracking-wider text-xs shadow-sm transition-all ${
          finalConfirmed && !submitting
            ? "bg-[#0F3D2E] text-white hover:bg-[#0F3D2E]/90"
            : "bg-gray-200 text-gray-400 cursor-not-allowed"
        }`}
      >
        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4 text-[#C6A969]" />}
        Complete Profile Verification
      </button>
    </div>
  </div>
);

export default PortalVerifyProfilePage;
