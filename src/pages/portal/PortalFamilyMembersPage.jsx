import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import {
  getFamilyMembers,
  saveFamilyMember,
  deleteFamilyMember
} from "../../lib/firestore";
import {
  PersonalSection, PassportSection, ContactSection, UaeResidenceSection,
  createEmptyProfile, Field, SelectInput
} from "../../components/portal/ProfileSteps";
import {
  validatePersonal, validatePassport, validateContact, validateUaeResidence
} from "../../utils/profileValidation";
import {
  UserPlus, Users, Pencil, Trash2, X, ChevronDown, Save, Loader2, Plane
} from "lucide-react";
import toast from "react-hot-toast";

const RELATIONSHIPS = ["Spouse", "Child", "Parent", "Sibling", "Other"];

// A family member uses a subset of the profile sections.
const MEMBER_SECTIONS = [
  { key: "personalInformation", title: "Personal Information", Section: PersonalSection, validate: (d) => validatePersonal(d, { isDependent: true }) },
  { key: "passportInformation", title: "Passport Information", Section: PassportSection, validate: validatePassport },
  { key: "contactInformation", title: "Contact Information", Section: ContactSection, validate: validateContact },
  { key: "uaeResidenceInformation", title: "UAE Residence", Section: UaeResidenceSection, validate: validateUaeResidence }
];

const emptyMember = () => {
  const base = createEmptyProfile();
  return {
    relationship: "",
    personalInformation: base.personalInformation,
    passportInformation: base.passportInformation,
    contactInformation: base.contactInformation,
    uaeResidenceInformation: base.uaeResidenceInformation
  };
};

const memberName = (m) => {
  const p = m.personalInformation || {};
  return [p.givenName, p.surname].filter(Boolean).join(" ") || "Unnamed Member";
};

export const PortalFamilyMembersPage = () => {
  const { user } = useAuth();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // { id?, ...member } or null

  useEffect(() => {
    if (!user?.uid) return;
    const unsub = getFamilyMembers(
      user.uid,
      (list) => { setMembers(list); setLoading(false); },
      () => setLoading(false)
    );
    return () => unsub && unsub();
  }, [user?.uid]);

  const handleDelete = async (id) => {
    if (!window.confirm("Remove this family member? This cannot be undone.")) return;
    try {
      await deleteFamilyMember(user.uid, id);
      toast.success("Family member removed.");
    } catch (e) {
      toast.error("Could not remove member.");
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#1A1A1A]">Family Members</h1>
          <p className="text-xs text-[#6B7280] mt-1">
            Add family members once and select them when applying for visas together.
          </p>
        </div>
        <button
          onClick={() => setEditing(emptyMember())}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-[#0F3D2E] hover:bg-[#0F3D2E]/90 text-white font-bold rounded-xl uppercase tracking-wider text-xs shadow-sm transition-colors shrink-0"
        >
          <UserPlus className="h-4 w-4 text-[#C6A969]" /> Add Member
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-400 text-xs">
          <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading family members…
        </div>
      ) : members.length === 0 ? (
        <div className="bg-white border border-dashed border-[#E5E7EB] rounded-[24px] p-12 text-center">
          <div className="inline-flex h-14 w-14 rounded-2xl bg-[#0F3D2E]/5 items-center justify-center mb-3">
            <Users className="h-7 w-7 text-[#0F3D2E]/60" />
          </div>
          <h3 className="text-sm font-bold text-[#1A1A1A]">No family members yet</h3>
          <p className="text-xs text-[#6B7280] mt-1 max-w-sm mx-auto">
            Add your spouse, children, parents or siblings to apply for family visas in minutes.
          </p>
          <button
            onClick={() => setEditing(emptyMember())}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#0F3D2E] text-white font-bold rounded-xl uppercase tracking-wider text-xs shadow-sm"
          >
            <UserPlus className="h-4 w-4 text-[#C6A969]" /> Add First Member
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {members.map((m) => {
            const p = m.personalInformation || {};
            return (
              <div key={m.id} className="bg-white border border-[#E5E7EB] rounded-[24px] shadow-sm p-5 flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="h-11 w-11 rounded-full bg-[#0F3D2E] text-white font-bold text-sm flex items-center justify-center shrink-0">
                    {(p.givenName?.[0] || "") + (p.surname?.[0] || "") || "FM"}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-[#1A1A1A] truncate">{memberName(m)}</p>
                    <p className="text-[11px] text-[#C6A969] font-semibold uppercase tracking-wider">{m.relationship || "Family"}</p>
                    <p className="text-[11px] text-[#6B7280] mt-1 truncate">
                      {p.currentNationality || "—"}
                      {m.passportInformation?.passportNumber ? ` · ${m.passportInformation.passportNumber}` : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => setEditing(m)} className="p-2 rounded-lg text-gray-400 hover:text-[#0F3D2E] hover:bg-[#F8F6F2] transition-colors" title="Edit">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => handleDelete(m.id)} className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors" title="Remove">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Auto-populate hint */}
      {members.length > 0 && (
        <div className="flex items-start gap-2 text-[11px] text-[#6B7280] bg-[#0F3D2E]/[0.03] border border-[#0F3D2E]/10 rounded-xl px-4 py-3">
          <Plane className="h-4 w-4 text-[#0F3D2E] shrink-0 mt-0.5" />
          <span>When you start a new visa application, you'll be able to select any of these saved travelers and their details will auto-fill.</span>
        </div>
      )}

      {editing && (
        <MemberEditor
          userId={user.uid}
          member={editing}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
};

// ---- Add / Edit modal ----
const MemberEditor = ({ userId, member, onClose }) => {
  const [data, setData] = useState(member);
  const [openSection, setOpenSection] = useState("personalInformation");
  const [errorsBySection, setErrorsBySection] = useState({});
  const [relError, setRelError] = useState("");
  const [saving, setSaving] = useState(false);

  const updateSection = (key, value) => setData((prev) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    let ok = true;
    if (!data.relationship) { setRelError("Relationship is required"); ok = false; } else setRelError("");

    const allErrors = {};
    MEMBER_SECTIONS.forEach((s) => {
      const errs = s.validate(data[s.key] || {});
      if (Object.keys(errs).length > 0) allErrors[s.key] = errs;
    });
    if (Object.keys(allErrors).length > 0) {
      setErrorsBySection(allErrors);
      setOpenSection(Object.keys(allErrors)[0]);
      ok = false;
    } else {
      setErrorsBySection({});
    }
    if (!ok) {
      toast.error("Please complete the required fields.");
      return;
    }

    try {
      setSaving(true);
      await saveFamilyMember(userId, data.id || null, {
        relationship: data.relationship,
        personalInformation: data.personalInformation,
        passportInformation: data.passportInformation,
        contactInformation: data.contactInformation,
        uaeResidenceInformation: data.uaeResidenceInformation
      });
      toast.success(data.id ? "Family member updated." : "Family member added.");
      onClose();
    } catch (e) {
      toast.error("Could not save family member.");
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 backdrop-blur-sm p-4 py-8">
      <div className="relative w-full max-w-2xl bg-[#F8F6F2] rounded-[28px] shadow-2xl">
        {/* Modal header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-white border-b border-[#E5E7EB] rounded-t-[28px]">
          <h2 className="text-lg font-bold text-[#1A1A1A]">{data.id ? "Edit Family Member" : "Add Family Member"}</h2>
          <button onClick={onClose} className="p-2 rounded-lg text-gray-400 hover:text-[#1A1A1A] hover:bg-[#F8F6F2] transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Relationship */}
          <div className="bg-white border border-[#E5E7EB] rounded-[20px] p-5">
            <Field label="Relationship" required error={relError} className="sm:max-w-[60%]">
              <SelectInput
                value={data.relationship}
                onChange={(v) => setData((p) => ({ ...p, relationship: v }))}
                options={RELATIONSHIPS}
                error={relError}
                placeholder="Select relationship"
              />
            </Field>
          </div>

          {/* Sections */}
          {MEMBER_SECTIONS.map((s) => {
            const isOpen = openSection === s.key;
            const hasError = !!errorsBySection[s.key];
            return (
              <div key={s.key} className="bg-white border border-[#E5E7EB] rounded-[20px] overflow-hidden">
                <button
                  onClick={() => setOpenSection(isOpen ? null : s.key)}
                  className="w-full flex items-center justify-between px-5 py-3.5 text-left"
                >
                  <span className={`text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${hasError ? "text-red-500" : "text-[#0F3D2E]"}`}>
                    {s.title}
                    {hasError && <span className="text-[10px] normal-case font-medium">• needs attention</span>}
                  </span>
                  <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 border-t border-[#E5E7EB] pt-4">
                    {React.createElement(s.Section, {
                      data: data[s.key],
                      onChange: (val) => updateSection(s.key, val),
                      errors: errorsBySection[s.key] || {}
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 flex items-center justify-end gap-3 px-6 py-4 bg-white border-t border-[#E5E7EB] rounded-b-[28px]">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-[#E5E7EB] text-[#6B7280] hover:text-[#1A1A1A] font-bold uppercase tracking-wider text-xs transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-5 py-2.5 bg-[#0F3D2E] hover:bg-[#0F3D2E]/90 text-white font-bold rounded-xl uppercase tracking-wider text-xs shadow-sm transition-colors disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 text-[#C6A969]" />}
            Save Member
          </button>
        </div>
      </div>
    </div>
  );
};

export default PortalFamilyMembersPage;
