import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "../../lib/firebase";
import { submitSchengenApplication, markSchengenPaidAndSubmit, markClientDeliverableDownloaded } from "../../lib/firestore";
import { buildClientTimeline, isDeliverableReady } from "../../utils/caseWorkspace";
import { getApplicationDisplayName } from "../../utils/helpers";
import { useAuth } from "../../contexts/AuthContext";
import { useTravelerProfile } from "../../contexts/TravelerProfileContext";
import { useMandatoryDocuments } from "../../hooks/useMandatoryDocuments";
import { 
  PersonalSection, 
  PassportSection, 
  ContactSection, 
  UaeResidenceSection, 
  EmploymentSection, 
  EmergencySection, 
  createEmptyProfile,
  STEP_META
} from "../../components/portal/ProfileSteps";
import { STEP_VALIDATORS } from "../../utils/profileValidation";
import { getMinStartDate, getMinEndDate, validateAppointmentDates } from "../../utils/appointmentDateRules";
import toast from "react-hot-toast";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import SecurePreviewButton from "../../components/ui/SecurePreviewButton";
import { ChevronLeft, ChevronRight, ChevronDown, Save, CheckCircle, FileText, Globe, Calendar, User, List, CreditCard, Check, Download, AlertCircle, Lock, Clock, ArrowRight, MessageSquare, Phone, Mail, FileCheck, FileClock, Upload, ExternalLink, Copy, HelpCircle, Send } from "lucide-react";

const SCHENGEN_COUNTRIES = [
  "Austria", "Belgium", "Croatia", "Czech Republic", "Denmark", "Estonia", "Finland", "France", "Germany", 
  "Greece", "Hungary", "Iceland", "Italy", "Latvia", "Liechtenstein", "Lithuania", "Luxembourg", "Malta", 
  "Netherlands", "Norway", "Poland", "Portugal", "Slovakia", "Slovenia", "Spain", "Sweden", "Switzerland"
];

const VISA_TYPES = [
  "Tourist Visa", "Business Visa", "Visiting Family or Friends", "Cultural Visa", 
  "Sports Visa", "Official Visit", "Medical Visa", "Study Visa", "Airport Transit Visa", "Other"
];

const DEFAULT_CLIENT_SPECIFIC_DOCUMENTS = [
  { key: "visa_application_form", name: "Visa Application Form", status: "pending_consultant_upload", fileUrl: null, uploadedBy: null, uploadedAt: null, scope: "client_specific" },
  { key: "appointment_letter", name: "Appointment Letter", status: "pending_consultant_upload", fileUrl: null, uploadedBy: null, uploadedAt: null, scope: "client_specific" },
  { key: "hotel_reservation", name: "Hotel Reservation", status: "pending_consultant_upload", fileUrl: null, uploadedBy: null, uploadedAt: null, scope: "client_specific" },
  { key: "flight_reservation", name: "Flight Reservation", status: "pending_consultant_upload", fileUrl: null, uploadedBy: null, uploadedAt: null, scope: "client_specific" },
  { key: "travel_insurance", name: "Travel Insurance", status: "pending_consultant_upload", fileUrl: null, uploadedBy: null, uploadedAt: null, scope: "client_specific" },
  { key: "cover_letter", name: "Cover Letter", status: "pending_consultant_upload", fileUrl: null, uploadedBy: null, uploadedAt: null, scope: "client_specific" },
  { key: "detailed_itinerary", name: "Detailed Itinerary", status: "pending_consultant_upload", fileUrl: null, uploadedBy: null, uploadedAt: null, scope: "client_specific" }
];

const STEPS = [
  { id: "visa", label: "Visa", icon: Globe },
  { id: "appointment", label: "Appointment", icon: Calendar },
  { id: "profile", label: "Profile", icon: User },
  { id: "questionnaire", label: "Questionnaire", icon: List },
  { id: "payment", label: "Payment", icon: CreditCard },
  { id: "confirmation", label: "Confirmation", icon: CheckCircle },
];

const SCHENGEN_FIELDS = [
  { fieldId: "surname", label: "Surname (Family Name)", required: true, profileMapping: "personalInformation.surname" },
  { fieldId: "formerName", label: "Surname at birth (Former family name)", required: false, profileMapping: "personalInformation.formerName" },
  { fieldId: "givenName", label: "First name(s) (Given Name)", required: true, profileMapping: "personalInformation.givenName" },
  { fieldId: "dateOfBirth", label: "Date of Birth", required: true, profileMapping: "personalInformation.dateOfBirth" },
  { fieldId: "placeOfBirth", label: "Place of Birth", required: true, profileMapping: "personalInformation.placeOfBirth" },
  { fieldId: "countryOfBirth", label: "Country of Birth", required: true, profileMapping: "personalInformation.countryOfBirth" },
  { fieldId: "currentNationality", label: "Current Nationality", required: true, profileMapping: "personalInformation.currentNationality" },
  { fieldId: "nationalityAtBirth", label: "Nationality at birth (if different)", required: false, profileMapping: "personalInformation.nationalityAtBirth" },
  { fieldId: "gender", label: "Sex", required: true, profileMapping: "personalInformation.gender" },
  { fieldId: "maritalStatus", label: "Civil Status", required: true, profileMapping: "personalInformation.maritalStatus" },
  { fieldId: "nationalId", label: "National Identity Number", required: false, profileMapping: "personalInformation.nationalId" },
  { fieldId: "passportType", label: "Type of travel document", required: true, profileMapping: "passportInformation.passportType" },
  { fieldId: "passportNumber", label: "Number of travel document", required: true, profileMapping: "passportInformation.passportNumber" },
  { fieldId: "dateOfIssue", label: "Date of issue", required: true, profileMapping: "passportInformation.dateOfIssue" },
  { fieldId: "dateOfExpiry", label: "Valid until", required: true, profileMapping: "passportInformation.dateOfExpiry" },
  { fieldId: "issuingCountry", label: "Issued by (country)", required: true, profileMapping: "passportInformation.issuingCountry" },
  { fieldId: "homeAddress", label: "Applicant's home address", required: true, profileMapping: "contactInformation.addressLine1" },
  { fieldId: "emailAddress", label: "Email address", required: true, profileMapping: "contactInformation.email" },
  { fieldId: "phoneNumber", label: "Telephone number", required: true, profileMapping: "contactInformation.mobile.number" },
  { fieldId: "residencePermit", label: "Residence permit or equivalent number", required: false, profileMapping: "uaeResidenceInformation.residenceVisaNumber", condition: (d) => d.travelProfileSnapshot?.uaeResidenceInformation?.residingInUae === "yes" },
  { fieldId: "occupation", label: "Current occupation", required: true, profileMapping: "employmentInformation.occupation" },
  { fieldId: "employerName", label: "Employer / school name", required: true, profileMapping: "employmentInformation.employerName" },
  { fieldId: "employerAddress", label: "Employer / school address", required: true, profileMapping: "employmentInformation.employerAddress" },
  { fieldId: "employerPhone", label: "Employer / school phone number", required: true, profileMapping: "employmentInformation.employerPhone" },
  { fieldId: "journeyPurpose", label: "Purpose of the journey", required: true, source: "visaType" },
  { fieldId: "destinationCountry", label: "Member State of main destination", required: true, source: "destinationCountry" },
  { fieldId: "firstEntry", label: "Member State of first entry", required: true, questionnairePath: "destinationAndEntry.firstEntry" },
  { fieldId: "entriesRequested", label: "Number of entries requested", required: false, questionnairePath: "destinationAndEntry.entriesRequested" },
  { fieldId: "arrivalDate", label: "Intended date of arrival", required: true, source: "appointmentPreference.startDate" },
  { fieldId: "departureDate", label: "Intended date of departure", required: true, source: "appointmentPreference.endDate" },
  { fieldId: "fingerprintsCollected", label: "Fingerprints collected previously", required: true, questionnairePath: "previousBiometrics.collected" },
  { fieldId: "fingerprintsDate", label: "Fingerprints date (if known)", required: false, questionnairePath: "previousBiometrics.date", condition: (d) => d.schengenQuestionnaire?.previousBiometrics?.collected === "yes" },
  // Accommodation, inviting-party and cost-coverage details are arranged by Eshaare's visa
  // operations team after submission. They are optional for the client and grouped into a
  // consultant-completed section to reduce friction during application submission.
  { fieldId: "accommodationType", label: "Accommodation Type", required: false, consultantCompleted: true, questionnairePath: "accommodationOrInvitation.type" },
  { fieldId: "invitingPersonName", label: "Inviting person name / Hotel name", required: false, consultantCompleted: true, questionnairePath: "accommodationOrInvitation.name" },
  { fieldId: "invitingPersonAddress", label: "Address and email of hotel / inviting person", required: false, consultantCompleted: true, questionnairePath: "accommodationOrInvitation.address" },
  { fieldId: "invitingPersonPhone", label: "Telephone number of hotel / inviting person", required: false, consultantCompleted: true, questionnairePath: "accommodationOrInvitation.phone" },
  { fieldId: "costCoveredBy", label: "Cost of travelling and living covered by", required: false, consultantCompleted: true, questionnairePath: "travelCostCoverage.coveredBy" },
];

export default function SchengenWizard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, userProfile, role } = useAuth();
  // Only manager-level staff ("consultants") may approve test payments. This mirrors the
  // authoritative firestore.rules gate, which lets only isManager() change payment fields,
  // so the UI never offers an action the rules would reject.
  const isStaff = !!role && ["super_admin", "admin", "manager"].includes(role.toLowerCase());
  const { profile: travelerProfile, loading: loadingProfile } = useTravelerProfile();
  // Direct-URL protection: clients must have all mandatory documents uploaded
  // before they can open the wizard. Staff (consultants/admins) are exempt so
  // they can review/complete cases.
  const { loading: loadingMandatoryDocs, missing: missingMandatoryDocs } = useMandatoryDocuments();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [draft, setDraft] = useState(null);
  const [globalNoc, setGlobalNoc] = useState(null);
  const [openSection, setOpenSection] = useState("personalInformation");
  const [errorsBySection, setErrorsBySection] = useState({});
  const [sectionEditStates, setSectionEditStates] = useState({});
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  // The draft is fetched from Firestore only once per mount. The traveler profile is a
  // live onSnapshot listener that emits a fresh object on every tick; without this guard,
  // those ticks re-run the fetch effect and setDraft(serverData) wipes whatever the user is
  // currently typing — looking like the form "resets/refreshes" on the first keystroke.
  const draftLoadedRef = useRef(false);
  // Step 4 splits questionnaire fields into read-only "verified" vs editable "required".
  // That split is captured once per visit to the step: without freezing it, a field the user
  // starts filling flips from missing→filled on the next render, moves to the read-only group,
  // and its <input> unmounts mid-keystroke (losing focus after the first character).
  const [frozenEditableFieldIds, setFrozenEditableFieldIds] = useState(null);
  // A submitted application is permanently read-only: the wizard becomes the
  // confirmation/tracking view and no step is editable.
  const [isReadOnly, setIsReadOnly] = useState(false);

  // NOTE: Consultant deliverables (Visa Application Form, Appointment Letter,
  // Hotel/Flight reservations, etc.) are NOT uploaded by the client. They are
  // produced and uploaded by staff via the admin Case Workspace, which writes a
  // real fileUrl + status: "ready_to_download" into applications/{id}.documents[].
  // The client view below is strictly read-only/download — there is intentionally
  // no client-side upload handler for these documents.

  const deepMergeProfile = (savedSnapshot, currentProfile) => {
    const base = createEmptyProfile();
    const merged = { ...base };
    
    const isPresent = (val) => {
      if (val === undefined || val === null || String(val).trim() === "") return false;
      if (typeof val === "object" && val.number !== undefined) {
        return val.number !== undefined && val.number !== null && String(val.number).trim() !== "";
      }
      if (Array.isArray(val)) {
        return val.length > 0;
      }
      return true;
    };

    Object.keys(base).forEach((section) => {
      merged[section] = { ...base[section] };
      const secKeys = Object.keys(base[section]);
      
      secKeys.forEach((key) => {
        const snapVal = savedSnapshot?.[section]?.[key];
        const curVal = currentProfile?.[section]?.[key];

        if (base[section][key] && typeof base[section][key] === "object" && base[section][key].number !== undefined) {
          const curPhone = curVal || {};
          const snapPhone = snapVal || {};
          const mergedPhone = { ...base[section][key] };
          
          if (isPresent(curPhone.number)) {
            mergedPhone.dialCode = curPhone.dialCode || base[section][key].dialCode;
            mergedPhone.number = curPhone.number;
          } else if (isPresent(snapPhone.number)) {
            mergedPhone.dialCode = snapPhone.dialCode || base[section][key].dialCode;
            mergedPhone.number = snapPhone.number;
          }
          merged[section][key] = mergedPhone;
        } else {
          if (isPresent(curVal)) {
            merged[section][key] = curVal;
          } else if (isPresent(snapVal)) {
            merged[section][key] = snapVal;
          } else {
            merged[section][key] = base[section][key];
          }
        }
      });
    });
    return merged;
  };

  useEffect(() => {
    const fetchDraft = async () => {
      try {
        const docRef = doc(db, "applications", id);
        const docSnap = await getDoc(docRef);
        
        // Fetch universal NOC template
        try {
          const nocRef = doc(db, "systemDocuments", "universal_noc_template");
          const nocSnap = await getDoc(nocRef);
          if (nocSnap.exists()) {
            setGlobalNoc(nocSnap.data());
          }
        } catch (nocErr) {
          console.error("Failed to load global NOC template:", nocErr);
        }

        if (docSnap.exists()) {
          const data = docSnap.data();
          data.travelProfileSnapshot = deepMergeProfile(data.travelProfileSnapshot || {}, travelerProfile || {});
          setDraft(data);
          // A submitted application is no longer editable. Instead of redirecting away,
          // the wizard renders its Confirmation step as the permanent read-only
          // tracking view, and we lock navigation to the editable steps.
          if (data.status && data.status !== "Draft") {
            setIsReadOnly(true);
            setCurrentStep(STEPS.findIndex(s => s.id === "confirmation"));
          }
        } else {
          toast.error("Application not found");
          navigate("/portal/applications");
        }
      } catch (error) {
        console.error("Error fetching draft", error);
        toast.error("Failed to load application");
      } finally {
        setLoading(false);
      }
    };
    // Only ever seed the draft once (after the profile has loaded so the initial
    // prefill/merge is complete). Later profile-snapshot ticks must not re-fetch and
    // overwrite the user's in-progress edits.
    if (!loadingProfile && !draftLoadedRef.current) {
      draftLoadedRef.current = true;
      fetchDraft();
    }
  }, [id, navigate, travelerProfile, loadingProfile]);

  // Mandatory-document route guard. Once the draft and document status have both
  // resolved, block clients (not staff) who are missing any mandatory document
  // from an editable application. Submitted/read-only applications remain
  // viewable so clients can always track an application they already filed.
  useEffect(() => {
    if (isStaff) return;
    if (loading || loadingMandatoryDocs) return;
    if (!draft || isReadOnly) return;
    if (missingMandatoryDocs.length > 0) {
      const missingLabels = missingMandatoryDocs.map((m) => m.label);
      toast.error(
        `Please upload and verify all mandatory documents before applying for a visa. Pending: ${missingLabels.join(", ")}.`,
        { duration: 6000 }
      );
      navigate("/portal/documents", { state: { mandatoryDocsMissing: true, missing: missingLabels } });
    }
  }, [isStaff, loading, loadingMandatoryDocs, draft, isReadOnly, missingMandatoryDocs, navigate]);

  const getFieldValue = (field) => {
    if (!draft) return "";
    if (field.source) {
      if (field.source === "visaType") return draft.visaType;
      if (field.source === "destinationCountry") return draft.destinationCountry;
      if (field.source === "appointmentPreference.startDate") return draft.appointmentPreference?.startDate;
      if (field.source === "appointmentPreference.endDate") return draft.appointmentPreference?.endDate;
    }
    if (field.profileMapping) {
      const parts = field.profileMapping.split(".");
      let val = draft.travelProfileSnapshot;
      for (const p of parts) {
        val = val?.[p];
      }
      // Handle phone object
      if (val && typeof val === "object" && val.number !== undefined) {
        return val.number ? `${val.dialCode || ""} ${val.number}` : "";
      }
      return val || "";
    }
    if (field.questionnairePath) {
      const parts = field.questionnairePath.split(".");
      let val = draft.schengenQuestionnaire;
      for (const p of parts) {
        val = val?.[p];
      }
      return val || "";
    }
    return "";
  };

  // Capture which fields are editable when the user enters Step 4, and keep that set stable
  // while they type. Reset when they leave so a fresh capture happens on the next visit.
  useEffect(() => {
    if (currentStep !== 3 || !draft) {
      if (frozenEditableFieldIds !== null) setFrozenEditableFieldIds(null);
      return;
    }
    if (frozenEditableFieldIds !== null) return; // already captured for this visit
    const ids = new Set();
    SCHENGEN_FIELDS.forEach((field) => {
      const value = getFieldValue(field);
      const isFilled = value !== undefined && value !== null && String(value).trim() !== "";
      if (field.questionnairePath || !isFilled) ids.add(field.fieldId);
    });
    setFrozenEditableFieldIds(ids);
  }, [currentStep, draft, frozenEditableFieldIds]);

  const updateQuestionnaire = (path, value) => {
    const parts = path.split(".");
    setDraft(prev => {
      const quest = { ...(prev.schengenQuestionnaire || {}) };
      let current = quest;
      for (let i = 0; i < parts.length - 1; i++) {
        current[parts[i]] = { ...(current[parts[i]] || {}) };
        current = current[parts[i]];
      }
      current[parts[parts.length - 1]] = value;
      return { ...prev, schengenQuestionnaire: quest };
    });
  };

  const updateFieldValue = (field, value) => {
    if (field.profileMapping) {
      const parts = field.profileMapping.split(".");
      setDraft(prev => {
        const snapshot = { ...(prev.travelProfileSnapshot || {}) };
        let current = snapshot;
        for (let i = 0; i < parts.length - 1; i++) {
          current[parts[i]] = { ...(current[parts[i]] || {}) };
          current = current[parts[i]];
        }
        current[parts[parts.length - 1]] = value;
        return { ...prev, travelProfileSnapshot: snapshot };
      });
    } else if (field.questionnairePath) {
      updateQuestionnaire(field.questionnairePath, value);
    }
  };

  const updateProfileSection = (sectionKey, sectionData) => {
    setDraft(prev => ({
      ...prev,
      travelProfileSnapshot: {
        ...(prev.travelProfileSnapshot || {}),
        [sectionKey]: sectionData
      }
    }));
  };

  const renderSectionSummary = (sectionKey, data) => {
    if (!data) return null;
    
    const fields = [];
    const add = (label, val) => {
      if (val !== undefined && val !== null && String(val).trim() !== "") {
        fields.push({ label, val: String(val) });
      }
    };
    const formatPhone = (p) => p?.number ? `${p.dialCode || ""} ${p.number}` : "";

    if (sectionKey === "personalInformation") {
      add("Surname / Family Name", data.surname);
      add("Given Name", data.givenName);
      add("Middle Name", data.middleName);
      add("Former Name", data.formerName);
      add("Gender", data.gender);
      add("Date of Birth", data.dateOfBirth);
      add("Place of Birth", data.placeOfBirth);
      add("Country of Birth", data.countryOfBirth);
      add("Current Nationality", data.currentNationality);
      add("Nationality at Birth", data.nationalityAtBirth);
      add("National ID", data.nationalId);
      add("Civil Status", data.maritalStatus);
    } else if (sectionKey === "passportInformation") {
      add("Passport Type", data.passportType);
      add("Passport Number", data.passportNumber);
      add("Date of Issue", data.dateOfIssue);
      add("Date of Expiry", data.dateOfExpiry);
      add("Issuing Country", data.issuingCountry);
      add("Holds Another Passport", data.holdsAnotherPassport);
      if (data.holdsAnotherPassport === "yes") {
        add("Second Passport Number", data.secondPassportNumber);
        add("Second Passport Country", data.secondPassportCountry);
      }
    } else if (sectionKey === "contactInformation") {
      add("Email", data.email);
      add("Mobile Number", formatPhone(data.mobile));
      if (!data.whatsappSameAsMobile) {
        add("WhatsApp Number", formatPhone(data.whatsapp));
      }
      add("Address Line 1", data.addressLine1);
      add("Address Line 2", data.addressLine2);
      add("City", data.city);
      add("State / Province", data.state);
      add("Country", data.country);
      add("Postal Code", data.postalCode);
    } else if (sectionKey === "uaeResidenceInformation") {
      add("Residing in UAE", data.residingInUae);
      if (data.residingInUae === "yes") {
        add("Emirates ID", data.emiratesId);
        add("Visa Number", data.residenceVisaNumber);
        add("Unified Number", data.unifiedNumber);
        add("Visa Issue Date", data.visaIssueDate);
        add("Visa Expiry Date", data.visaExpiryDate);
        add("Emirate", data.emirate);
        add("Sponsor Type", data.sponsorType);
      }
    } else if (sectionKey === "employmentInformation") {
      add("Current Status", data.currentStatus);
      add("Occupation", data.occupation);
      add("Employer/School Name", data.employerName);
      add("Employer/School Address", data.employerAddress);
      add("Employer/School Phone", data.employerPhone);
    } else if (sectionKey === "emergencyContact") {
      add("Full Name", data.fullName);
      add("Relationship", data.relationship);
      add("Mobile Number", formatPhone(data.mobile));
      add("Address", data.address);
      add("Country", data.country);
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-2 font-sans">
        {fields.map((f, idx) => (
          <div key={idx} className="flex flex-col">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{f.label}</span>
            <span className="text-sm font-semibold text-gray-700">{f.val}</span>
          </div>
        ))}
      </div>
    );
  };

  const renderFieldInput = (field) => {
    const value = getFieldValue(field);
    
    // Choose options for select inputs
    let options = null;
    if (field.fieldId === "firstEntry") {
      options = SCHENGEN_COUNTRIES;
    } else if (field.fieldId === "entriesRequested") {
      options = ["Single Entry", "Two Entries", "Multiple Entries"];
    } else if (field.fieldId === "accommodationType") {
      options = ["Hotel / Temporary Accommodation", "Inviting Person", "Not arranged yet"];
    } else if (field.fieldId === "costCoveredBy") {
      options = ["by the applicant", "by a sponsor (host, company, organisation)"];
    } else if (field.fieldId === "gender") {
      options = ["Male", "Female", "Other"];
    } else if (field.fieldId === "maritalStatus") {
      options = ["Single", "Married", "Registered partnership", "Separated", "Divorced", "Widow(er)", "Other"];
    } else if (field.fieldId === "passportType") {
      options = ["Ordinary passport", "Diplomatic passport", "Service passport", "Official passport", "Special passport", "Other travel document"];
    } else if (field.fieldId === "fingerprintsCollected") {
      options = ["yes", "no"];
    }

    const isSelect = options !== null;
    const isDate = field.fieldId.toLowerCase().includes("date") || field.fieldId === "dateOfBirth" || field.fieldId === "dateOfIssue" || field.fieldId === "dateOfExpiry" || field.fieldId === "fingerprintsDate";

    const handleChange = (val) => {
      updateFieldValue(field, val);
    };

    if (isSelect) {
      return (
        <div key={field.fieldId} className="flex flex-col space-y-1.5">
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
            {field.label} {field.required && "*"}
          </label>
          <select
            value={value || ""}
            onChange={(e) => handleChange(e.target.value)}
            className="px-4 py-3 bg-[#F8F6F2] border border-[#E5E7EB] text-[#1A1A1A] rounded-xl focus:outline-none focus:border-[#C6A969] text-sm font-sans"
          >
            <option value="" disabled>Select Option</option>
            {options.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
          {field.fieldId === "accommodationType" && value === "Not arranged yet" && (
            <p className="text-xs text-amber-600 bg-amber-50 p-2.5 rounded-lg border border-amber-100 mt-1">
              Our consultant will prepare or verify your accommodation documents after payment confirmation.
            </p>
          )}
        </div>
      );
    }

    if (isDate) {
      return (
        <div key={field.fieldId} className="flex flex-col space-y-1.5">
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
            {field.label} {field.required && "*"}
          </label>
          <input
            type="date"
            value={value || ""}
            onChange={(e) => handleChange(e.target.value)}
            className="px-4 py-3 bg-[#F8F6F2] border border-[#E5E7EB] text-[#1A1A1A] rounded-xl focus:outline-none focus:border-[#C6A969] text-sm font-sans"
          />
        </div>
      );
    }

    return (
      <div key={field.fieldId} className="flex flex-col space-y-1.5">
        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
          {field.label} {field.required && "*"}
        </label>
        <input
          type="text"
          value={value || ""}
          onChange={(e) => handleChange(e.target.value)}
          className="px-4 py-3 bg-[#F8F6F2] border border-[#E5E7EB] text-[#1A1A1A] rounded-xl focus:outline-none focus:border-[#C6A969] text-sm font-sans"
          placeholder={`Enter ${field.label}`}
        />
      </div>
    );
  };

  const sanitizePayload = (obj) => {
    if (obj === undefined) {
      return undefined;
    }
    if (obj === null) {
      return null;
    }
    if (obj instanceof Date) {
      return obj.toISOString();
    }
    if (Array.isArray(obj)) {
      return obj.map(item => sanitizePayload(item)).filter(item => item !== undefined);
    }
    if (typeof obj === "object") {
      // Keep Firestore FieldValue / Timestamp intact
      if (obj.constructor && (obj.constructor.name === "FieldValue" || obj.constructor.name === "Timestamp" || typeof obj.toDate === "function")) {
        return obj;
      }
      const sanitized = {};
      Object.keys(obj).forEach((key) => {
        const val = sanitizePayload(obj[key]);
        if (val !== undefined) {
          sanitized[key] = val;
        }
      });
      return sanitized;
    }
    return obj;
  };

  const handleSave = async (showToast = true) => {
    setSaving(true);
    let payload;
    try {
      const docRef = doc(db, "applications", id);
      const cleanDraft = sanitizePayload(draft);
      if (cleanDraft) {
        delete cleanDraft.id;
      }

      payload = {
        ...cleanDraft,
        updatedAt: serverTimestamp()
      };

      await updateDoc(docRef, payload);
      if (showToast) toast.success("Draft saved successfully!");
      return true;
    } catch (error) {
      console.error("[SchengenWizard.handleSave] Failed to save draft", {
        code: error.code,
        message: error.message,
        applicationId: id,
        uid: auth.currentUser?.uid || user?.uid || null,
        payloadKeys: payload ? Object.keys(payload) : null
      });
      if (error.code === "permission-denied") {
        toast.error("You don't have permission to update this application. Please contact support.");
      } else {
        toast.error("Unable to save draft. Please check your connection and try again.");
      }
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleNext = async () => {
    // Validation before next
    if (currentStep === 0) {
      if (!draft.destinationCountry) return toast.error("Please select a destination country.");
      if (!draft.visaType) return toast.error("Please select a visa type.");
    }
    if (currentStep === 1) {
      const { valid, error } = validateAppointmentDates(draft.appointmentPreference, "schengen");
      if (!valid) return toast.error(error);
    }
    if (currentStep === 2) {
      const allErrors = {};
      for (let s = 1; s <= 6; s++) {
        const v = STEP_VALIDATORS[s];
        const errs = v.fn(draft.travelProfileSnapshot?.[v.key] || {});
        if (Object.keys(errs).length > 0) allErrors[v.key] = errs;
      }
      if (Object.keys(allErrors).length > 0) {
        setErrorsBySection(allErrors);
        const firstKey = Object.keys(allErrors)[0];
        setOpenSection(firstKey);
        return toast.error("Please fix the highlighted travel profile fields before continuing.");
      }
      setErrorsBySection({});
    }

    const saved = await handleSave(false);
    if (saved && currentStep < STEPS.length - 1) {
      setCurrentStep(curr => curr + 1);
      window.scrollTo(0, 0);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep(curr => curr - 1);
  };

  // --- Payment action ---------------------------------------------------------
  // TEMPORARY: manual test-mode approval used until Stripe Checkout is wired up.
  // This is the ONLY payment-specific logic in the wizard. When integrating Stripe,
  // replace the body of `approveTestPayment` with the Checkout/redirect + webhook
  // confirmation flow that writes the same payment fields below. The surrounding
  // wizard (stepper, confirmation unlock, persistence) needs no changes.
  //
  // SECURITY: this performs a direct client-side write, so it is gated to staff
  // ("consultant") accounts only — both in the UI (button hidden from clients) and,
  // authoritatively, in firestore.rules (only isStaff() may change payment fields).
  // A client cannot self-approve their own payment.
  const approveTestPayment = async () => {
    if (!isStaff) {
      return toast.error("Only an authorized consultant can approve payment.");
    }
    if (draft.paymentStatus === "paid" || processingPayment) return; // only allow once
    setProcessingPayment(true);
    try {
      // Business rule: for Schengen, payment === submission. Approving payment
      // atomically marks the application Paid + Submitted and creates the visa_case
      // in one batch, so a paid-but-Draft state can never exist.
      await markSchengenPaidAndSubmit(id, "manual_test");
      setDraft(prev => ({
        ...prev,
        paymentStatus: "paid",
        paymentMethod: "manual_test",
        paymentApprovedAt: new Date().toISOString(),
        status: "Submitted",
        submittedAt: new Date().toISOString()
      }));
      setShowPaymentModal(false);
      toast.success("Payment approved. Application submitted successfully.");
    } catch (err) {
      console.error("Failed to approve payment / submit application:", err);
      toast.error("Failed to approve payment. Please try again.");
    } finally {
      setProcessingPayment(false);
    }
  };

  const [submittingApplication, setSubmittingApplication] = useState(false);

  // Finalize the application before showing the confirmation step. This is the
  // transition that actually flips status Draft -> Submitted and creates the CRM
  // case; without it the file stays a draft forever and keeps showing under
  // "Draft Applications". submitSchengenApplication is idempotent, so re-entering
  // confirmation never creates a duplicate case.
  const goToConfirmation = async () => {
    if (submittingApplication) return;
    if (draft.status !== "Submitted") {
      setSubmittingApplication(true);
      try {
        // Persist any last in-memory edits, then submit.
        await handleSave(false);
        await submitSchengenApplication(id);
        setDraft(prev => ({ ...prev, status: "Submitted", submittedAt: new Date().toISOString() }));
      } catch (err) {
        console.error("Failed to submit application:", err);
        toast.error("Failed to submit application. Please try again.");
        setSubmittingApplication(false);
        return;
      }
      setSubmittingApplication(false);
    }
    setCurrentStep(STEPS.findIndex(s => s.id === "confirmation"));
    window.scrollTo(0, 0);
  };

  const downloadNOC = () => {
    const nocContent = `NO OBJECTION CERTIFICATE\n\nDate: ${new Date().toLocaleDateString()}\n\nTo,\nThe Visa Officer\nEmbassy / Consulate of ${draft.destinationCountry || "[Destination Country]"}\n\nSubject: No Objection Certificate for Schengen Visa Application\n\nThis is to certify that ${draft.travelProfileSnapshot?.personalInformation?.firstName || "[Applicant]"} ${draft.travelProfileSnapshot?.personalInformation?.lastName || ""}, is an applicant for a Schengen visa.\n\nThe company has no objection to the applicant travelling to ${draft.destinationCountry || "[Destination Country]"} and other Schengen countries for tourism/business purpose from ${draft.appointmentPreference?.startDate || "[Travel Start Date]"} to ${draft.appointmentPreference?.endDate || "[Travel End Date]"}.\n\nThe applicant is expected to resume duties after the approved leave period.\n\nSincerely,\nAuthorized Signatory`;
    
    const blob = new Blob([nocContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'NOC_Template.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const declarationsAccepted = 
    draft?.schengenQuestionnaire?.declarations?.infoCorrect === true && 
    draft?.schengenQuestionnaire?.declarations?.feesNonRefundable === true;

  if (loading) return <div className="min-h-screen bg-[#F8F6F2] flex items-center justify-center"><LoadingSpinner message="Loading wizard..." /></div>;
  if (!draft) return null;

  return (
    <div className="min-h-screen bg-[#F8F6F2] font-sans pb-20">
      {/* Header / Stepper */}
      <div className="bg-white border-b border-[#E5E7EB] sticky top-0 z-10 px-4 py-4 md:px-8">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex flex-col">
            <h1 className="text-xl font-bold text-[#0F3D2E]">Schengen Application</h1>
            <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">{getApplicationDisplayName(draft)}</p>
          </div>
          <button 
            onClick={() => navigate("/portal/applications")}
            className="text-xs font-bold text-gray-500 hover:text-[#1A1A1A] uppercase tracking-wider"
          >
            Exit to Portal
          </button>
        </div>
        
        {/* Stepper UI */}
        <div className="max-w-4xl mx-auto mt-6">
          <div className="flex justify-between items-center relative">
            <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-gray-200 -z-10 transform -translate-y-1/2"></div>
            {STEPS.map((step, idx) => {
              const paymentIdx = STEPS.findIndex(s => s.id === "payment");
              const isPast = idx < currentStep || (idx === paymentIdx && draft.paymentStatus === "paid");
              const isCurrent = idx === currentStep;
              const Icon = step.icon;
              return (
                <div key={step.id} className="flex flex-col items-center bg-white px-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${
                    isPast ? 'bg-[#0F3D2E] border-[#0F3D2E] text-white' :
                    isCurrent ? 'bg-white border-[#C6A969] text-[#C6A969]' : 'bg-white border-gray-200 text-gray-400'
                  }`}>
                    {isPast ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                  </div>
                  <span className={`text-[10px] mt-2 font-bold uppercase tracking-wider hidden md:block ${
                    isCurrent ? 'text-[#C6A969]' : isPast ? 'text-[#0F3D2E]' : 'text-gray-400'
                  }`}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className={`${currentStep === 5 ? "max-w-[1400px]" : "max-w-3xl"} mx-auto mt-8 px-4`}>
        
        {/* STEP 1: VISA SELECTION */}
        {currentStep === 0 && (
          <div className="bg-white rounded-[20px] border border-[#E5E7EB] p-6 shadow-sm space-y-6 animate-fadeIn">
            <div>
              <h2 className="text-xl font-bold text-[#1A1A1A]">Visa Selection</h2>
              <p className="text-xs text-[#6B7280] mt-1">Select your main Schengen destination and visa purpose. These details help our visa experts prepare the correct application file.</p>
            </div>
            
            <div className="space-y-4">
              <div className="flex flex-col space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Destination Country *</label>
                <select
                  value={draft.destinationCountry || ""}
                  onChange={(e) => setDraft({...draft, destinationCountry: e.target.value})}
                  disabled={draft.sourcePageType === "country-schengen"}
                  className="px-4 py-3 bg-[#F8F6F2] border border-[#E5E7EB] text-[#1A1A1A] rounded-xl focus:outline-none focus:border-[#C6A969] text-sm disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  <option value="" disabled>Select Country</option>
                  {SCHENGEN_COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="flex flex-col space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Visa Type *</label>
                <select
                  value={draft.visaType || ""}
                  onChange={(e) => setDraft({...draft, visaType: e.target.value})}
                  className="px-4 py-3 bg-[#F8F6F2] border border-[#E5E7EB] text-[#1A1A1A] rounded-xl focus:outline-none focus:border-[#C6A969] text-sm"
                >
                  <option value="" disabled>Select Visa Type</option>
                  {VISA_TYPES.map(vt => <option key={vt} value={vt}>{vt}</option>)}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: APPOINTMENT PREFERENCE */}
        {currentStep === 1 && (
          <div className="bg-white rounded-[20px] border border-[#E5E7EB] p-6 shadow-sm space-y-6 animate-fadeIn">
            <div>
              <h2 className="text-xl font-bold text-[#1A1A1A]">Appointment Preference</h2>
              <div className="bg-blue-50 text-blue-800 text-xs p-3 rounded-lg mt-3 border border-blue-100 flex gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <p>Appointment availability is subject to embassy, consulate, and VFS slot availability. Our visa experts will monitor available slots and do their best to secure the earliest suitable appointment for you.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Earliest Date You Can Attend *</label>
                <input
                  type="date"
                  min={getMinStartDate("schengen")}
                  value={draft.appointmentPreference?.startDate || ""}
                  onChange={(e) => setDraft({...draft, appointmentPreference: {...draft.appointmentPreference, startDate: e.target.value}})}
                  className="px-4 py-3 bg-[#F8F6F2] border border-[#E5E7EB] text-[#1A1A1A] rounded-xl focus:outline-none focus:border-[#C6A969] text-sm"
                />
              </div>
              <div className="flex flex-col space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Latest Date You Can Attend *</label>
                <input
                  type="date"
                  min={getMinEndDate(draft.appointmentPreference?.startDate, "schengen")}
                  value={draft.appointmentPreference?.endDate || ""}
                  onChange={(e) => setDraft({...draft, appointmentPreference: {...draft.appointmentPreference, endDate: e.target.value}})}
                  className="px-4 py-3 bg-[#F8F6F2] border border-[#E5E7EB] text-[#1A1A1A] rounded-xl focus:outline-none focus:border-[#C6A969] text-sm"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: REVIEW TRAVEL PROFILE */}
        {currentStep === 2 && (
          <div className="bg-white rounded-[20px] border border-[#E5E7EB] p-6 shadow-sm space-y-6 animate-fadeIn">
            <div>
              <h2 className="text-xl font-bold text-[#1A1A1A]">Review Travel Profile</h2>
              <p className="text-xs text-[#6B7280] mt-1">Please review your saved travel profile. These details will be reused for your Schengen visa application and official forms.</p>
            </div>
            
            <div className="space-y-4">
              {STEP_META.map((s) => {
                const validatorEntry = Object.values(STEP_VALIDATORS).find(v => v.key === s.key);
                const sectionErrors = validatorEntry ? validatorEntry.fn(draft.travelProfileSnapshot?.[s.key] || {}) : {};
                const isComplete = Object.keys(sectionErrors).length === 0;
                const isEditing = sectionEditStates[s.key] === true || !isComplete;

                return (
                  <div key={s.key} className="bg-white border border-[#E5E7EB] rounded-[24px] shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50 bg-gray-50/20">
                      <span className={`text-sm font-bold uppercase tracking-wider flex items-center gap-2 ${!isComplete ? "text-amber-600" : "text-[#0F3D2E]"}`}>
                        {s.title}
                        {!isComplete && (
                          <span className="text-[10px] normal-case font-semibold bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-100 font-sans">
                            needs attention
                          </span>
                        )}
                        {isComplete && (
                          <span className="text-[10px] normal-case font-semibold bg-green-50 text-green-700 px-2 py-0.5 rounded-full border border-green-100 font-sans">
                            completed
                          </span>
                        )}
                      </span>
                      
                      {isComplete && (
                        <button
                          type="button"
                          onClick={() => setSectionEditStates(prev => ({ ...prev, [s.key]: !isEditing }))}
                          className="text-xs font-bold text-[#0F3D2E] hover:text-[#C6A969] uppercase tracking-wider focus:outline-none font-sans"
                        >
                          {isEditing ? "Minimize" : "Edit"}
                        </button>
                      )}
                    </div>
                    
                    <div className="px-6 py-5">
                      {isEditing ? (
                        <div className="space-y-4">
                          {React.createElement(s.Section, {
                            data: draft.travelProfileSnapshot?.[s.key] || {},
                            onChange: (val) => updateProfileSection(s.key, val),
                            errors: sectionErrors,
                            user,
                            userProfile
                          })}
                        </div>
                      ) : (
                        renderSectionSummary(s.key, draft.travelProfileSnapshot?.[s.key])
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 4: ADDITIONAL QUESTIONNAIRE */}
        {currentStep === 3 && (() => {
          const activeFields = SCHENGEN_FIELDS.filter(field => {
            if (field.condition && !field.condition({
              travelProfileSnapshot: draft.travelProfileSnapshot,
              schengenQuestionnaire: draft.schengenQuestionnaire
            })) return false;
            return true;
          });

          const knownFields = [];
          const missingFields = [];
          const consultantFields = [];

          // Use the partition frozen on entry so a field being typed into doesn't migrate
          // from the editable group to the read-only group mid-keystroke.
          const editableIds = frozenEditableFieldIds;
          activeFields.forEach(field => {
            // Booking/accommodation/sponsor details are optional and arranged later by the
            // assigned visa consultant — always grouped into their own section.
            if (field.consultantCompleted) {
              consultantFields.push(field);
              return;
            }
            const value = getFieldValue(field);
            const isFilled = value !== undefined && value !== null && String(value).trim() !== "";
            const isEditable = field.questionnairePath ||
              (editableIds ? editableIds.has(field.fieldId) : !isFilled);

            if (isFilled && !isEditable) {
              knownFields.push({ field, value });
            } else {
              missingFields.push(field);
            }
          });

          return (
            <div className="bg-white rounded-[20px] border border-[#E5E7EB] p-6 shadow-sm space-y-8 animate-fadeIn">
              <div>
                <h2 className="text-xl font-bold text-[#1A1A1A]">Additional Schengen Questionnaire</h2>
                <p className="text-xs text-[#6B7280] mt-1">Please provide additional details required specifically for the Harmonised Application Form.</p>
              </div>

              {/* Known Information */}
              {knownFields.length > 0 && (
                <div className="space-y-4 bg-gray-50/50 rounded-2xl border border-gray-100 p-5">
                  <h3 className="text-xs font-bold text-[#0F3D2E] uppercase tracking-wider border-b pb-1">Verified Information (Read Only)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {knownFields.map(({ field, value }) => (
                      <div key={field.fieldId} className="flex flex-col space-y-1">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{field.label}</span>
                        <span className="text-sm font-semibold text-gray-700 bg-gray-100/50 px-3 py-2 rounded-lg border border-gray-200/50">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Missing Information Required */}
              {missingFields.length > 0 && (
                <div className="space-y-6">
                  <h3 className="text-xs font-bold text-[#0F3D2E] uppercase tracking-wider border-b pb-1">Required Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {missingFields.map(field => renderFieldInput(field))}
                  </div>
                </div>
              )}

              {/* Consultant-Completed: Booking & Accommodation (optional for client) */}
              {consultantFields.length > 0 && (
                <div className="space-y-4 bg-[#F8F6F2] rounded-2xl border border-[#E5E7EB] p-5">
                  <div>
                    <h3 className="text-xs font-bold text-[#0F3D2E] uppercase tracking-wider border-b pb-1">Booking &amp; Accommodation Details (Optional)</h3>
                    <p className="text-xs text-[#6B7280] mt-2 flex items-start gap-2">
                      <HelpCircle className="w-4 h-4 text-[#C6A969] mt-0.5 flex-shrink-0" />
                      This section can be completed later by your assigned visa consultant.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {consultantFields.map(field => renderFieldInput(field))}
                  </div>
                </div>
              )}

              {/* Declarations */}
              <div className="space-y-4 pt-4 border-t border-gray-100">
                <h3 className="text-xs font-bold text-[#0F3D2E] uppercase tracking-wider border-b pb-1">Declarations</h3>
                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input 
                    type="checkbox" 
                    className="mt-1 w-4 h-4 rounded border-gray-300 text-[#0F3D2E] focus:ring-[#0F3D2E]" 
                    checked={draft.schengenQuestionnaire?.declarations?.infoCorrect || false}
                    onChange={e => updateQuestionnaire("declarations.infoCorrect", e.target.checked)}
                  />
                  <span className="text-xs text-gray-700">I confirm that the information provided is correct and complete. I understand that false or incomplete information may lead to visa refusal.</span>
                </label>
                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input 
                    type="checkbox" 
                    className="mt-1 w-4 h-4 rounded border-gray-300 text-[#0F3D2E] focus:ring-[#0F3D2E]" 
                    checked={draft.schengenQuestionnaire?.declarations?.feesNonRefundable || false}
                    onChange={e => updateQuestionnaire("declarations.feesNonRefundable", e.target.checked)}
                  />
                  <span className="text-xs text-gray-700">I understand that visa fees and service charges may be non-refundable after processing has started.</span>
                </label>
              </div>
            </div>
          );
        })()}

        {/* STEP 5: PAYMENT (temporary manual test-mode approval until Stripe is integrated) */}
        {currentStep === 4 && (() => {
          const isPaid = draft.paymentStatus === "paid";
          const approvedAtLabel = draft.paymentApprovedAt
            ? new Date(draft.paymentApprovedAt).toLocaleString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
            : null;
          return (
            <div className="bg-white rounded-[20px] border border-[#E5E7EB] p-8 shadow-sm text-center space-y-6 animate-fadeIn">
              {/* TEST MODE badge */}
              <div className="flex justify-center">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold uppercase tracking-wider border border-amber-200">
                  <AlertCircle className="w-3 h-3" /> Test Mode &middot; No real payment processed
                </span>
              </div>

              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto ${isPaid ? "bg-green-100" : "bg-[#0F3D2E]/10"}`}>
                {isPaid
                  ? <CheckCircle className="w-8 h-8 text-green-600" />
                  : <CreditCard className="w-8 h-8 text-[#0F3D2E]" />}
              </div>

              {!isPaid ? (
                <>
                  <div>
                    <h2 className="text-2xl font-bold text-[#1A1A1A]">Payment Approval</h2>
                    <p className="text-sm text-[#6B7280] mt-2 max-w-md mx-auto">
                      Stripe integration is currently under development. For testing purposes, applications can be manually marked as paid by an authorized consultant.
                    </p>
                  </div>
                  <div className="pt-2">
                    {isStaff ? (
                      <button
                        onClick={() => setShowPaymentModal(true)}
                        disabled={processingPayment}
                        className="px-6 py-3 bg-[#0F3D2E] text-white font-bold rounded-xl text-xs uppercase tracking-wider hover:bg-[#0F3D2E]/90 transition-colors shadow-md disabled:opacity-50"
                      >
                        Mark Payment as Received (Test Mode)
                      </button>
                    ) : (
                      <p className="inline-flex items-center gap-2 text-xs font-medium text-[#6B7280] bg-[#F8F6F2] border border-[#E5E7EB] rounded-xl px-4 py-3">
                        <Lock className="w-4 h-4 text-[#C6A969]" />
                        Your consultant will confirm payment for this application.
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <h2 className="text-2xl font-bold text-[#1A1A1A]">Payment Approved</h2>
                    <p className="text-sm text-[#6B7280] mt-2 max-w-md mx-auto">
                      Test payment approved successfully. You may continue to the confirmation step.
                    </p>
                    {approvedAtLabel && (
                      <p className="text-[11px] text-gray-400 mt-2">Approved {approvedAtLabel} &middot; Method: Manual (Test)</p>
                    )}
                  </div>
                  <div className="pt-2">
                    <button
                      onClick={goToConfirmation}
                      disabled={submittingApplication}
                      className="px-6 py-3 bg-[#0F3D2E] text-white font-bold rounded-xl text-xs uppercase tracking-wider hover:bg-[#0F3D2E]/90 transition-colors shadow-md inline-flex items-center gap-2 disabled:opacity-50"
                    >
                      {submittingApplication ? "Submitting..." : "Continue to Confirmation"} <ChevronRight className="w-4 h-4 text-[#C6A969]" />
                    </button>
                  </div>
                </>
              )}
            </div>
          );
        })()}

        {/* STEP 6: CONFIRMATION & DOCUMENTS */}
        {currentStep === 5 && (() => {
          const clientDocsFiltered = (draft.documents && draft.documents.length > 0
            ? draft.documents
            : DEFAULT_CLIENT_SPECIFIC_DOCUMENTS)
            .filter(d => d.key !== "noc" && d.name !== "NOC")
            .map(d => {
              // Normalize names and keys if they are from old schema
              let key = d.key;
              let name = d.name;
              if (name === "Hotel Booking" || name === "Hotel Reservation") {
                key = "hotel_reservation";
                name = "Hotel Reservation";
              } else if (name === "Flight Booking" || name === "Flight Reservation") {
                key = "flight_reservation";
                name = "Flight Reservation";
              } else if (name === "Visa Application Form") {
                key = "visa_application_form";
              } else if (name === "Appointment Letter") {
                key = "appointment_letter";
              } else if (name === "Travel Insurance") {
                key = "travel_insurance";
              } else if (name === "Cover Letter") {
                key = "cover_letter";
              } else if (name === "Detailed Itinerary") {
                key = "detailed_itinerary";
              }
              return {
                ...d,
                key,
                name
              };
            });

          const nocExists = globalNoc && globalNoc.fileUrl && globalNoc.active !== false;
          
          const documentsToRender = [
            {
              key: "noc",
              name: "NOC",
              status: nocExists ? "ready_to_download" : "pending_consultant_upload",
              scope: "global",
              fileUrl: nocExists ? globalNoc.fileUrl : null,
              fileName: nocExists ? globalNoc.fileName : null
            },
            ...clientDocsFiltered
          ];

          const completedCount = documentsToRender.filter(d => d.fileUrl && d.status === "ready_to_download").length;

          const refNumber = `ES-SCH-${id.substring(0, 8).toUpperCase()}`;
          const submissionDate = draft.submittedAt 
            ? new Date(draft.submittedAt?.seconds ? draft.submittedAt.seconds * 1000 : draft.submittedAt).toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' })
            : new Date().toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' });

          const appointmentPreferredDates = draft.appointmentPreference?.startDate && draft.appointmentPreference?.endDate
            ? `${new Date(draft.appointmentPreference.startDate).toLocaleDateString("en-US", { year: 'numeric', month: 'short', day: 'numeric' })} - ${new Date(draft.appointmentPreference.endDate).toLocaleDateString("en-US", { year: 'numeric', month: 'short', day: 'numeric' })}`
            : "Not Selected";

          // Derived, business-logic-driven 5-step tracker (no "Profile Verification").
          // Steps + their completed/in-progress/pending state come from the shared
          // helper so the client view always matches the admin case status.
          const clientTimeline = buildClientTimeline(draft);
          const timelineSteps = clientTimeline.steps;
          const timelineProgressPct = Math.round(
            (clientTimeline.completedCount / timelineSteps.length) * 100
          );

          return (
            <div className="space-y-8 animate-fadeIn max-w-[1400px] mx-auto pb-12 font-sans">
              
              {/* SECTION 1 — SUCCESS HERO */}
              <div className="bg-white rounded-[24px] border border-[#E5E7EB] shadow-sm overflow-hidden">
                <div className="p-8 md:p-10 flex flex-col lg:flex-row justify-between items-center gap-8 relative bg-gradient-to-br from-white to-emerald-50/10">
                  <div className="absolute right-0 top-0 w-48 h-48 bg-emerald-50 rounded-full filter blur-3xl opacity-60 -mr-12 -mt-12 pointer-events-none"></div>
                  
                  <div className="flex-1 space-y-4 text-center lg:text-left">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                      Application Submitted
                    </span>
                    <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-[#0F3D2E] tracking-tight">
                      Your Schengen Visa Application Has Been Submitted
                    </h2>
                    <p className="text-sm md:text-base text-gray-500 leading-relaxed max-w-2xl">
                      We have successfully received your application and assigned it to our visa processing team.
                    </p>
                  </div>
                  
                  <div className="shrink-0 flex justify-center items-center bg-white p-2 rounded-3xl shadow-sm border border-gray-100">
                    <svg className="w-24 h-24 text-emerald-600" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="60" cy="60" r="54" stroke="#D1FAE5" strokeWidth="4" strokeDasharray="6 6" />
                      <circle cx="60" cy="60" r="46" fill="#A7F3D0" fillOpacity="0.4" />
                      <circle cx="60" cy="60" r="36" fill="#34D399" fillOpacity="0.1" />
                      <path d="M95 30 L97 34 L101 35 L97 36 L95 40 L93 36 L89 35 L93 34 Z" fill="#C6A969" />
                      <path d="M25 85 L26 88 L29 89 L26 90 L25 93 L24 90 L21 89 L24 88 Z" fill="#C6A969" />
                      <circle cx="60" cy="60" r="28" fill="#10B981" />
                      <path d="M48 60 L56 68 L72 52" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>
                
                {/* Details Bar */}
                <div className="bg-[#F8F6F2]/60 border-t border-[#E5E7EB] grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-6 p-6 md:p-8">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Reference Number</span>
                    <span className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
                      {refNumber}
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(refNumber);
                          toast.success("Reference number copied!");
                        }}
                        className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600 transition-all"
                        title="Copy to clipboard"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Destination Country</span>
                    <span className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
                      <Globe className="w-4 h-4 text-[#C6A969]" />
                      {draft.destinationCountry}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Visa Type</span>
                    <span className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-[#C6A969]" />
                      {draft.visaType}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Submission Date</span>
                    <span className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-[#C6A969]" />
                      {submissionDate}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Dates You Can Attend</span>
                    <span className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-[#C6A969]" />
                      {appointmentPreferredDates}
                    </span>
                  </div>
                </div>
              </div>

              {/* Two Column Layout: Main content vs Sidebar */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                
                {/* Main Column */}
                <div className="lg:col-span-2 space-y-8">
                  
                  {/* SECTION 2 — WHAT HAPPENS NEXT (TIMELINE) */}
                  {/* Horizontal Timeline (Desktop) */}
                  <div className="hidden md:block bg-white border border-[#E5E7EB] rounded-[24px] p-8 shadow-sm">
                    <h3 className="text-sm font-bold text-[#0F3D2E] uppercase tracking-wider mb-8 flex items-center justify-between gap-2">
                      <span className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-[#C6A969]" /> Application Track & Estimated Timeline
                      </span>
                      <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 normal-case tracking-normal">
                        {clientTimeline.statusLabel}
                      </span>
                    </h3>
                    <div className="relative">
                      {/* Line connector */}
                      <div className="absolute left-[10%] right-[10%] top-[20px] h-[3px] bg-gray-100 -z-10">
                        <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${timelineProgressPct}%` }}></div>
                      </div>

                      <div className="grid grid-cols-5 gap-2">
                        {timelineSteps.map((s) => {
                          const isCompleted = s.status === "completed";
                          const isInProgress = s.status === "in_progress";
                          const isPending = s.status === "pending";
                          
                          return (
                            <div key={s.step} className="flex flex-col items-center text-center px-1">
                              {/* Node circle */}
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-4 transition-all duration-300 ${
                                isCompleted ? "bg-emerald-500 border-emerald-100 text-white shadow-[0_0_12px_rgba(16,185,129,0.3)]" :
                                isInProgress ? "bg-white border-[#C6A969] text-[#C6A969] shadow-[0_0_12px_rgba(198,169,105,0.4)] animate-pulse" :
                                "bg-white border-gray-200 text-gray-400"
                              }`}>
                                {isCompleted ? (
                                  <Check className="w-5 h-5" />
                                ) : (
                                  <span className="text-xs font-bold">{s.step}</span>
                                )}
                              </div>
                              
                              <h4 className={`text-xs font-bold mt-3 font-sans ${isPending ? "text-gray-400" : "text-[#1A1A1A]"}`}>
                                {s.title}
                              </h4>
                              <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mt-1.5 border ${
                                isCompleted ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                                isInProgress ? "bg-amber-50 text-amber-700 border-amber-200" :
                                "bg-gray-50 text-gray-400 border-gray-100"
                              }`}>
                                {isCompleted ? "Completed" : isInProgress ? "In Progress" : "Pending"}
                              </span>
                              <p className="text-[10px] text-gray-400 mt-2 line-clamp-2 max-w-[150px] leading-relaxed">
                                {s.desc}
                              </p>
                              <span className="text-[9px] text-[#C6A969] font-bold mt-1.5 font-mono">
                                {s.est}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Vertical Timeline (Mobile) */}
                  <div className="block md:hidden bg-white border border-[#E5E7EB] rounded-[24px] p-6 shadow-sm space-y-6">
                    <h3 className="text-sm font-bold text-[#0F3D2E] uppercase tracking-wider border-b pb-2 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[#C6A969]" /> Application Track & Timeline
                    </h3>
                    <div className="relative pl-6 space-y-8 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-gray-100">
                      {timelineSteps.map((s) => {
                        const isCompleted = s.status === "completed";
                        const isInProgress = s.status === "in_progress";
                        
                        return (
                          <div key={s.step} className="relative">
                            {/* Bullet */}
                            <div className={`absolute -left-6 top-0.5 w-[24px] h-[24px] rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                              isCompleted ? "bg-emerald-500 border-white text-white shadow-sm" :
                              isInProgress ? "bg-white border-[#C6A969] text-[#C6A969] shadow-sm animate-pulse" :
                              "bg-white border-gray-200 text-gray-400"
                            }`}>
                              {isCompleted ? (
                                <Check className="w-3 h-3" />
                              ) : (
                                <span className="text-[10px] font-bold">{s.step}</span>
                              )}
                            </div>
                            
                            <div className="space-y-1">
                              <div className="flex items-center justify-between">
                                <span className={`text-xs font-bold font-sans ${isCompleted || isInProgress ? "text-gray-800" : "text-gray-400"}`}>
                                  {s.title}
                                </span>
                                <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                                  isCompleted ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                                  isInProgress ? "bg-amber-50 text-amber-700 border-amber-200" :
                                  "bg-gray-50 text-gray-400 border-gray-100"
                                }`}>
                                  {isCompleted ? "Completed" : isInProgress ? "In Progress" : "Pending"}
                                </span>
                              </div>
                              <p className="text-xs text-gray-500 leading-relaxed">
                                {s.desc}
                              </p>
                              <span className="text-[10px] text-[#C6A969] font-bold font-mono block">
                                {s.est}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* SECTION 4 — REQUIRED DOCUMENTS */}
                  <div className="bg-white rounded-[24px] border border-[#E5E7EB] p-6 shadow-sm space-y-6">
                    <div className="flex items-center justify-between border-b pb-4">
                      <h3 className="text-sm font-bold text-[#0F3D2E] uppercase tracking-wider flex items-center gap-2 font-sans">
                        <FileText className="w-4 h-4 text-[#C6A969]" /> Required Documents Checklist
                      </h3>
                      <span className="text-xs font-bold text-gray-500 bg-[#F8F6F2] px-3 py-1 rounded-full border border-gray-100 font-sans font-mono">
                        {completedCount} of {documentsToRender.length} Completed
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-2 gap-4">
                      {documentsToRender.map((doc, idx) => {
                        const isNoc = doc.key === "noc";
                        // Download is enabled ONLY when the document is both flagged
                        // ready by a consultant AND carries a real file URL. This
                        // prevents any stale/partial record from appearing downloadable.
                        const hasFile = !!doc.fileUrl && doc.status === "ready_to_download";
                        
                        let badgeBg = "";
                        let badgeLabel = "";
                        let descText = "";
                        let actionNode = null;
                        
                        if (isNoc) {
                          if (hasFile) {
                            badgeBg = "bg-emerald-50 border-emerald-100 text-emerald-700";
                            badgeLabel = "Ready for Download";
                            descText = "Your certified NOC is generated and ready to download.";
                            // Security: never render doc.fileUrl. The NOC template is a
                            // shared system document with no per-user owner — routed through
                            // the systemDocumentKey mode, which resolves the Storage path
                            // itself from an admin-controlled allowlist entry, never from
                            // anything this client sends.
                            actionNode = (
                              <SecurePreviewButton
                                access={{ systemDocumentKey: "noc" }}
                                title="NOC Certificate"
                                fileName="NOC.pdf"
                                className="flex items-center justify-center gap-1.5 px-3 py-2 bg-[#0F3D2E] hover:bg-[#0F3D2E]/90 text-white font-bold rounded-xl text-[10px] uppercase tracking-wider transition-all shadow-sm focus:outline-none font-sans"
                              >
                                <Download className="w-3.5 h-3.5" /> Download NOC
                              </SecurePreviewButton>
                            );
                          } else {
                            badgeBg = "bg-amber-50 border-amber-100 text-amber-700";
                            badgeLabel = "Awaiting Template";
                            descText = "NOC template will be available soon";
                            actionNode = (
                              <button
                                disabled
                                className="flex items-center justify-center gap-1.5 px-3 py-2 bg-gray-100 text-gray-400 font-bold rounded-xl text-[10px] uppercase tracking-wider transition-all focus:outline-none font-sans cursor-not-allowed"
                              >
                                <Download className="w-3.5 h-3.5" /> Download NOC
                              </button>
                            );
                          }
                        } else {
                          // Client-specific document
                          if (hasFile) {
                            badgeBg = "bg-emerald-50 border-emerald-100 text-emerald-700";
                            badgeLabel = "Uploaded";
                            descText = "Document uploaded successfully and verified.";
                            // Security: never render doc.fileUrl. The secure preview modal
                            // fetches a fresh short-lived signed URL by application + the
                            // exact storagePath this deliverable was uploaded under — never
                            // a raw Storage URL. Older deliverables uploaded before
                            // storagePath was recorded (e.g. via the admin audit-panel
                            // upload path) have no storagePath yet and are disabled here
                            // rather than falling back to the raw fileUrl.
                            actionNode = (
                              <SecurePreviewButton
                                access={doc.storagePath ? { applicationId: id, storageKey: doc.storagePath } : null}
                                title={doc.name}
                                fileName={doc.fileName}
                                disabled={!doc.storagePath}
                                onTriggerClick={() => {
                                  // Owning client opening/downloading a ready consultant
                                  // deliverable records ONLY an access marker
                                  // (clientDeliverablesDownloadedAt). It does NOT change the
                                  // case status — that advances to Decision Pending only when
                                  // staff mark the visa submitted. Fire-and-forget; never
                                  // blocks the download; staff/admin viewers don't trigger it.
                                  const isClientUser = role === "client" || role === "customer";
                                  if (isClientUser && isDeliverableReady(doc)) {
                                    markClientDeliverableDownloaded(id);
                                  }
                                }}
                                className="flex items-center justify-center gap-1.5 px-3 py-2 bg-[#0F3D2E] hover:bg-[#0F3D2E]/90 text-white font-bold rounded-xl text-[10px] uppercase tracking-wider transition-all shadow-sm focus:outline-none font-sans disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <Download className="w-3.5 h-3.5" /> Download File
                              </SecurePreviewButton>
                            );
                          } else {
                            badgeBg = "bg-gray-50 border-gray-200 text-gray-400";
                            badgeLabel = "Pending Specialist";
                            descText = "Will be uploaded by your assigned consultant";
                            actionNode = (
                              <button
                                disabled
                                className="flex items-center justify-center gap-1.5 px-3 py-2 bg-gray-100 text-gray-400 font-bold rounded-xl text-[10px] uppercase tracking-wider transition-all focus:outline-none font-sans cursor-not-allowed"
                              >
                                <Download className="w-3.5 h-3.5" /> Download File
                              </button>
                            );
                          }
                        }
                        
                        return (
                          <div key={idx} className={`p-5 rounded-2xl border transition-all duration-300 bg-white hover:shadow-md flex flex-col justify-between min-h-[140px] ${
                            isNoc && hasFile ? "border-emerald-100 bg-emerald-50/5" :
                            !isNoc && hasFile ? "border-emerald-100 bg-emerald-50/5" :
                            "border-gray-100 bg-[#F8F6F2]/10"
                          }`}>
                            <div className="space-y-1.5">
                              <div className="flex items-start justify-between gap-3">
                                <h4 className="text-sm font-bold text-gray-800 font-sans">{doc.name}</h4>
                                <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border font-sans ${badgeBg}`}>
                                  {badgeLabel}
                                </span>
                              </div>
                              <p className="text-xs text-gray-400 leading-relaxed font-sans">{descText}</p>
                            </div>
                            
                            <div className="flex justify-end items-center pt-3 border-t border-gray-100/50 mt-2">
                              {actionNode}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>

                {/* Sidebar Column */}
                <div className="space-y-8">
                  
                  {/* SECTION 3 — ASSIGNED CONSULTANT */}
                  <div className="bg-white rounded-[24px] border border-[#E5E7EB] p-6 shadow-sm space-y-6">
                    <div className="flex items-center justify-between border-b pb-3">
                      <h3 className="text-sm font-bold text-[#0F3D2E] uppercase tracking-wider flex items-center gap-2 font-sans">
                        <User className="w-4 h-4 text-[#C6A969]" /> Assigned Specialist
                      </h3>
                      <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Online
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="w-14 h-14 bg-gradient-to-tr from-[#0F3D2E] to-[#C6A969] text-white rounded-full flex items-center justify-center font-bold text-lg shadow-md border-2 border-white">
                          AD
                        </div>
                        <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white shadow-sm"></div>
                      </div>
                      <div className="space-y-0.5">
                        <h4 className="font-bold text-gray-800 text-sm font-sans">Mr. Adwaith Das</h4>
                        <p className="text-[10px] font-bold text-[#C6A969] uppercase tracking-wider font-sans">Senior Visa Concierge Specialist</p>
                      </div>
                    </div>

                    <div className="space-y-3 pt-4 text-xs border-t border-gray-100 font-sans">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Direct Line:</span>
                        <a href="tel:+971557338429" className="font-semibold text-gray-700 hover:text-[#C6A969] transition-all flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-gray-400" /> +971 55 733 8429
                        </a>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Email:</span>
                        <a href="mailto:adwaith@eshaareuae.com" className="font-semibold text-gray-700 hover:text-[#C6A969] transition-all flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5 text-gray-400" /> adwaith@eshaareuae.com
                        </a>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Working Hours:</span>
                        <span className="font-semibold text-gray-700 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-gray-400" /> 09:00 - 18:00 (GST)
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 pt-2">
                      <a 
                        href="https://wa.me/971557338429?text=Hello%20Mr.%20Adwaith%20Das%2C%20I%20have%20submitted%20my%20Schengen%20visa%20application%20through%20Eshaare%20Tours%20client%20portal.%20Please%20assist%20me%20with%20my%20appointment%20and%20documents."
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-2.5 bg-[#25D366] hover:bg-[#20ba5a] text-white font-bold rounded-xl text-[10px] uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 shadow-sm font-sans"
                      >
                        <MessageSquare className="w-3.5 h-3.5 fill-white" /> WhatsApp Consultant
                      </a>
                      <a 
                        href="tel:+971557338429"
                        className="w-full py-2.5 border border-[#E5E7EB] hover:bg-[#F8F6F2] hover:text-[#0F3D2E] hover:border-[#0F3D2E] font-bold rounded-xl text-[10px] uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 focus:outline-none font-sans"
                      >
                        <Phone className="w-3.5 h-3.5 text-[#C6A969]" /> Schedule Call
                      </a>
                      <a 
                        href="mailto:adwaith@eshaareuae.com?subject=Schengen%20Visa%20Application%20Support&body=Dear%20Adwaith%2C%20I%20have%20submitted%20my%20Schengen%20visa%20application.%20My%20reference%20number%20is%20..."
                        className="w-full py-2.5 border border-[#E5E7EB] hover:bg-[#F8F6F2] hover:text-[#0F3D2E] hover:border-[#0F3D2E] font-bold rounded-xl text-[10px] uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 focus:outline-none font-sans"
                      >
                        <Send className="w-3.5 h-3.5 text-[#C6A969]" /> Send Message
                      </a>
                    </div>
                  </div>

                  {/* SECTION 7 — ACTION CENTER */}
                  <div className="bg-white rounded-[24px] border border-[#E5E7EB] p-6 shadow-sm space-y-4">
                    <h3 className="text-sm font-bold text-[#0F3D2E] uppercase tracking-wider border-b pb-3 font-sans">
                      Portal Action Center
                    </h3>
                    <div className="flex flex-col gap-2.5">
                      <button 
                        onClick={() => navigate("/portal/dashboard")}
                        className="w-full py-3 bg-[#0F3D2E] text-white hover:bg-[#0F3D2E]/90 font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-sm focus:outline-none font-sans flex items-center justify-center gap-1.5"
                      >
                        Back to Dashboard
                      </button>
                      <button 
                        onClick={() => navigate("/portal/applications")}
                        className="w-full py-3 border border-[#E5E7EB] hover:bg-[#F8F6F2] text-gray-700 font-bold rounded-xl text-xs uppercase tracking-wider transition-all focus:outline-none font-sans flex items-center justify-center gap-1.5"
                      >
                        View My Applications
                      </button>
                      <button 
                        onClick={() => navigate("/portal/documents")}
                        className="w-full py-3 border border-[#E5E7EB] hover:bg-[#F8F6F2] text-gray-700 font-bold rounded-xl text-xs uppercase tracking-wider transition-all focus:outline-none font-sans flex items-center justify-center gap-1.5"
                      >
                        View Documents
                      </button>
                      <a 
                        href="https://wa.me/971557338429?text=Hello%20Mr.%20Adwaith%20Das%2C%20I%20have%20submitted%20my%20Schengen%20visa%20application%20through%20Eshaare%20Tours%20client%20portal.%20Please%20assist%20me%20with%20my%20appointment%20and%20documents."
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-3 bg-[#25D366] hover:bg-[#20ba5a] text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-sm focus:outline-none font-sans flex items-center justify-center gap-1.5"
                      >
                        <MessageSquare className="w-3.5 h-3.5 fill-white" /> Chat on WhatsApp
                      </a>
                    </div>
                  </div>

                </div>
              </div>

              {/* SECTION 6 — IMPORTANT ADVISORIES */}
              <div className="bg-white rounded-[24px] border border-[#E5E7EB] p-6 shadow-sm space-y-6">
                <h3 className="text-sm font-bold text-[#0F3D2E] uppercase tracking-wider border-b pb-3 flex items-center gap-2 font-sans">
                  <AlertCircle className="w-4 h-4 text-[#C6A969]" /> Important Advisories
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="flex gap-3.5 p-4 bg-[#F8F6F2]/30 border border-gray-100 rounded-xl hover:border-amber-200 transition-all duration-300">
                    <div className="w-8 h-8 bg-amber-50 border border-amber-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                      <Clock className="w-4 h-4 text-amber-700" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-gray-800 font-sans">Document Prep Timeline</h4>
                      <p className="text-[11px] text-gray-500 leading-relaxed font-sans">
                        Document preparation normally starts <strong>3-5 days before your appointment</strong>. This ensures bank statements, salary certificates, and insurance policies remain fresh and fully compliant with consulate rules.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3.5 p-4 bg-[#F8F6F2]/30 border border-gray-100 rounded-xl hover:border-amber-200 transition-all duration-300">
                    <div className="w-8 h-8 bg-amber-50 border border-amber-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                      <User className="w-4 h-4 text-amber-700" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-gray-800 font-sans">Specialist Requests</h4>
                      <p className="text-[11px] text-gray-500 leading-relaxed font-sans">
                        Your assigned specialist may reach out to request <strong>additional support documents</strong> depending on the specific embassy's current rules or updates to local Schengen policy.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3.5 p-4 bg-[#F8F6F2]/30 border border-gray-100 rounded-xl hover:border-amber-200 transition-all duration-300">
                    <div className="w-8 h-8 bg-amber-50 border border-amber-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                      <Lock className="w-4 h-4 text-amber-700" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-gray-800 font-sans">Non-Refundable Plans</h4>
                      <p className="text-[11px] text-gray-500 leading-relaxed font-sans">
                        We strongly advise that <strong>travel plans should not be finalized</strong> (e.g. non-refundable flights, prepaid hotel reservations) until the official visa decision is issued by the Embassy.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3.5 p-4 bg-[#F8F6F2]/30 border border-gray-100 rounded-xl hover:border-amber-200 transition-all duration-300">
                    <div className="w-8 h-8 bg-amber-50 border border-amber-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                      <CreditCard className="w-4 h-4 text-amber-700" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-gray-800 font-sans">Visa Fee Policy</h4>
                      <p className="text-[11px] text-gray-500 leading-relaxed font-sans">
                        All embassy visa fees and concierge service charges are <strong>non-refundable after processing starts</strong>. Refusals do not entitle applicants to refunds.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Footer Actions (except Step 6 and Step 5) */}
        {currentStep < 4 && (
          <div className="mt-8 flex justify-between items-center border-t border-gray-200 pt-6">
            <button
              type="button"
              onClick={handleBack}
              className={`px-6 py-3 font-bold rounded-xl text-xs uppercase tracking-wider flex items-center gap-2 transition-colors ${
                currentStep === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-[#0F3D2E] hover:bg-gray-100'
              }`}
              disabled={currentStep === 0 || saving}
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => handleSave(true)}
                disabled={saving}
                className="px-6 py-3 border border-[#E5E7EB] text-[#1A1A1A] bg-white font-bold rounded-xl text-xs uppercase tracking-wider hover:bg-gray-50 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <Save className="w-4 h-4 text-[#C6A969]" /> Save Draft
              </button>
              <button
                type="button"
                onClick={handleNext}
                disabled={saving || (currentStep === 3 && !declarationsAccepted)}
                className="px-8 py-3 bg-[#0F3D2E] text-white font-bold rounded-xl text-xs uppercase tracking-wider hover:bg-[#0F3D2E]/90 transition-colors shadow-md flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue <ChevronRight className="w-4 h-4 text-[#C6A969]" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Confirm Test Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4 animate-fadeIn">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-amber-600" />
              </div>
              <h3 className="text-lg font-bold text-[#1A1A1A]">Confirm Test Payment</h3>
            </div>
            <p className="text-sm text-gray-600">
              This is a temporary payment approval used for testing before Stripe integration.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowPaymentModal(false)}
                disabled={processingPayment}
                className="px-5 py-2.5 border border-[#E5E7EB] text-[#1A1A1A] bg-white font-bold rounded-xl text-xs uppercase tracking-wider hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={approveTestPayment}
                disabled={processingPayment}
                className="px-5 py-2.5 bg-[#0F3D2E] text-white font-bold rounded-xl text-xs uppercase tracking-wider hover:bg-[#0F3D2E]/90 transition-colors shadow-md disabled:opacity-50"
              >
                {processingPayment ? "Processing..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
