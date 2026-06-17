import React from "react";
import { DEFAULT_DIAL_CODE } from "../../utils/countries";
import { SearchableCountryDropdown, MultiCountryDropdown } from "../ui/SearchableCountryDropdown";
import { CountryCodeDropdown } from "../ui/CountryCodeDropdown";
import { DatePickerField } from "../ui/DatePickerField";

// ==========================================================================
// Default (empty) profile shape — single source of truth for the data model.
// ==========================================================================
export const emptyPhone = () => ({ dialCode: DEFAULT_DIAL_CODE, number: "" });

export const createEmptyProfile = () => ({
  personalInformation: {
    surname: "", givenName: "", middleName: "", formerName: "",
    gender: "", dateOfBirth: "", placeOfBirth: "", countryOfBirth: "",
    currentNationality: "", nationalityAtBirth: "", otherNationalities: [],
    nationalId: "", maritalStatus: ""
  },
  passportInformation: {
    passportType: "", passportNumber: "", dateOfIssue: "", dateOfExpiry: "",
    issuingCountry: "", issuingAuthority: "", placeOfIssue: "",
    holdsAnotherPassport: "no", secondPassportNumber: "", secondPassportCountry: "",
    secondPassportExpiry: ""
  },
  contactInformation: {
    email: "", mobile: emptyPhone(), whatsappSameAsMobile: true, whatsapp: emptyPhone(),
    addressLine1: "", addressLine2: "", city: "", state: "", country: "", postalCode: ""
  },
  uaeResidenceInformation: {
    residingInUae: "yes", emiratesId: "", residenceVisaNumber: "", unifiedNumber: "",
    visaIssueDate: "", visaExpiryDate: "", emirate: "", sponsorType: "",
    occupationOnVisa: "", firstEnteredUae: ""
  },
  employmentInformation: {
    currentStatus: "", occupation: "", employerName: "", employerAddress: "",
    employerPhone: "", employerEmail: "", employmentStartDate: "",
    institutionName: "", institutionAddress: "", course: "", yearOfStudy: ""
  },
  emergencyContact: {
    fullName: "", relationship: "", mobile: emptyPhone(), address: "", country: ""
  }
});

// ==========================================================================
// Reusable styled field primitives
// ==========================================================================
export const Label = ({ children, required }) => (
  <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">
    {children} {required && <span className="text-[#C6A969]">*</span>}
  </span>
);

export const Field = ({ label, required, error, children, className = "" }) => (
  <div className={`flex flex-col space-y-1 ${className}`}>
    <Label required={required}>{label}</Label>
    {children}
    {error && <span className="text-[10px] text-red-500 font-medium mt-0.5">{error}</span>}
  </div>
);

const inputCls = (error) =>
  `px-3.5 py-2.5 bg-[#F8F6F2] border ${error ? "border-red-400" : "border-[#E5E7EB]"} text-[#1A1A1A] rounded-xl focus:outline-none focus:border-[#0F3D2E] transition-colors w-full`;

export const TextInput = ({ value, onChange, error, type = "text", placeholder, ...rest }) => (
  <input
    type={type}
    value={value || ""}
    placeholder={placeholder}
    onChange={(e) => onChange(e.target.value)}
    className={inputCls(error)}
    {...rest}
  />
);

export const SelectInput = ({ value, onChange, options, error, placeholder = "Select..." }) => (
  <select
    value={value || ""}
    onChange={(e) => onChange(e.target.value)}
    className={`${inputCls(error)} appearance-none cursor-pointer ${!value ? "text-gray-400" : ""}`}
  >
    <option value="" disabled>{placeholder}</option>
    {options.map((o) => (
      <option key={o} value={o} className="text-[#1A1A1A]">{o}</option>
    ))}
  </select>
);

export const RadioGroup = ({ value, onChange, name }) => (
  <div className="flex gap-3">
    {["yes", "no"].map((opt) => (
      <button
        key={opt}
        type="button"
        onClick={() => onChange(opt)}
        className={`flex-1 px-4 py-2.5 rounded-xl border text-xs font-semibold uppercase tracking-wider transition-all ${
          value === opt
            ? "bg-[#0F3D2E] text-white border-[#0F3D2E] shadow-sm"
            : "bg-[#F8F6F2] text-[#6B7280] border-[#E5E7EB] hover:border-[#0F3D2E]/40"
        }`}
      >
        {opt === "yes" ? "Yes" : "No"}
      </button>
    ))}
  </div>
);

export const HelpText = ({ children }) => (
  <p className="text-[11px] leading-relaxed text-[#6B7280] bg-[#0F3D2E]/[0.03] border border-[#0F3D2E]/10 rounded-xl px-3.5 py-2.5">
    {children}
  </p>
);

// Option lists
const GENDERS = ["Male", "Female", "Other"];
const MARITAL = ["Single", "Married", "Divorced", "Widowed", "Separated", "Registered Partnership"];
const PASSPORT_TYPES = ["Ordinary Passport", "Diplomatic Passport", "Official Passport", "Service Passport", "Other"];
const EMIRATES = ["Abu Dhabi", "Dubai", "Sharjah", "Ajman", "Fujairah", "Ras Al Khaimah", "Umm Al Quwain"];
const SPONSOR_TYPES = ["Employer", "Family", "Investor", "Golden Visa", "Freelancer", "Other"];
const EMPLOYMENT_STATUS = ["Employed", "Self Employed", "Business Owner", "Student", "Retired", "Homemaker", "Unemployed"];
const RELATIONSHIPS = ["Spouse", "Father", "Mother", "Son", "Daughter", "Brother", "Sister", "Relative", "Friend", "Other"];

// Helper to build a per-field updater
const makeUpdate = (data, onChange) => (key, val) => onChange({ ...data, [key]: val });

// ==========================================================================
// STEP 1 — Personal Information
// ==========================================================================
export const PersonalSection = ({ data, onChange, errors = {} }) => {
  const u = makeUpdate(data, onChange);
  return (
    <div className="space-y-4">
      <HelpText>Required by Schengen, USA, UK, Canada, Australia, New Zealand and most visa authorities for identity verification.</HelpText>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Surname / Family Name" required error={errors.surname}>
          <TextInput value={data.surname} onChange={(v) => u("surname", v)} error={errors.surname} placeholder="As shown on passport" />
        </Field>
        <Field label="Given Name" required error={errors.givenName}>
          <TextInput value={data.givenName} onChange={(v) => u("givenName", v)} error={errors.givenName} placeholder="As shown on passport" />
        </Field>
        <Field label="Middle Name" error={errors.middleName}>
          <TextInput value={data.middleName} onChange={(v) => u("middleName", v)} />
        </Field>
        <Field label="Former Name" error={errors.formerName}>
          <TextInput value={data.formerName} onChange={(v) => u("formerName", v)} placeholder="If changed (e.g. maiden name)" />
        </Field>
        <Field label="Gender" required error={errors.gender}>
          <SelectInput value={data.gender} onChange={(v) => u("gender", v)} options={GENDERS} error={errors.gender} />
        </Field>
        <Field label="Date of Birth" required error={errors.dateOfBirth}>
          <DatePickerField value={data.dateOfBirth} onChange={(v) => u("dateOfBirth", v)} error={errors.dateOfBirth} max={new Date().toISOString().split("T")[0]} />
        </Field>
        <Field label="Place of Birth" required error={errors.placeOfBirth}>
          <TextInput value={data.placeOfBirth} onChange={(v) => u("placeOfBirth", v)} error={errors.placeOfBirth} placeholder="City / town" />
        </Field>
        <Field label="Country of Birth" required error={errors.countryOfBirth}>
          <SearchableCountryDropdown value={data.countryOfBirth} onChange={(v) => u("countryOfBirth", v)} error={errors.countryOfBirth} />
        </Field>
        <Field label="Current Nationality" required error={errors.currentNationality}>
          <SearchableCountryDropdown value={data.currentNationality} onChange={(v) => u("currentNationality", v)} error={errors.currentNationality} />
        </Field>
        <Field label="Nationality at Birth" error={errors.nationalityAtBirth}>
          <SearchableCountryDropdown value={data.nationalityAtBirth} onChange={(v) => u("nationalityAtBirth", v)} />
        </Field>
        <Field label="Other Nationalities" error={errors.otherNationalities} className="sm:col-span-2">
          <MultiCountryDropdown value={data.otherNationalities || []} onChange={(v) => u("otherNationalities", v)} placeholder="Select any additional nationalities" />
        </Field>
        <Field label="National ID Number" error={errors.nationalId}>
          <TextInput value={data.nationalId} onChange={(v) => u("nationalId", v)} placeholder="Optional" />
        </Field>
        <Field label="Marital Status" required error={errors.maritalStatus}>
          <SelectInput value={data.maritalStatus} onChange={(v) => u("maritalStatus", v)} options={MARITAL} error={errors.maritalStatus} />
        </Field>
      </div>
    </div>
  );
};

// ==========================================================================
// STEP 2 — Passport Information
// ==========================================================================
export const PassportSection = ({ data, onChange, errors = {} }) => {
  const u = makeUpdate(data, onChange);
  return (
    <div className="space-y-4">
      <HelpText>Mandatory for all visa applications and international travel.</HelpText>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Passport Type" required error={errors.passportType}>
          <SelectInput value={data.passportType} onChange={(v) => u("passportType", v)} options={PASSPORT_TYPES} error={errors.passportType} />
        </Field>
        <Field label="Passport Number" required error={errors.passportNumber}>
          <TextInput value={data.passportNumber} onChange={(v) => u("passportNumber", v)} error={errors.passportNumber} />
        </Field>
        <Field label="Date of Issue" required error={errors.dateOfIssue}>
          <DatePickerField value={data.dateOfIssue} onChange={(v) => u("dateOfIssue", v)} error={errors.dateOfIssue} />
        </Field>
        <Field label="Date of Expiry" required error={errors.dateOfExpiry}>
          <DatePickerField value={data.dateOfExpiry} onChange={(v) => u("dateOfExpiry", v)} error={errors.dateOfExpiry} min={data.dateOfIssue || undefined} />
        </Field>
        <Field label="Issuing Country" required error={errors.issuingCountry}>
          <SearchableCountryDropdown value={data.issuingCountry} onChange={(v) => u("issuingCountry", v)} error={errors.issuingCountry} />
        </Field>
        <Field label="Issuing Authority" error={errors.issuingAuthority}>
          <TextInput value={data.issuingAuthority} onChange={(v) => u("issuingAuthority", v)} />
        </Field>
        <Field label="Place of Issue" error={errors.placeOfIssue}>
          <TextInput value={data.placeOfIssue} onChange={(v) => u("placeOfIssue", v)} />
        </Field>
        <Field label="Do you hold another passport?" error={errors.holdsAnotherPassport}>
          <RadioGroup value={data.holdsAnotherPassport} onChange={(v) => u("holdsAnotherPassport", v)} name="secondPassport" />
        </Field>
      </div>

      {data.holdsAnotherPassport === "yes" && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-[#0F3D2E]/[0.03] border border-[#0F3D2E]/10 rounded-xl">
          <Field label="Second Passport Number" required error={errors.secondPassportNumber}>
            <TextInput value={data.secondPassportNumber} onChange={(v) => u("secondPassportNumber", v)} error={errors.secondPassportNumber} />
          </Field>
          <Field label="Country" required error={errors.secondPassportCountry}>
            <SearchableCountryDropdown value={data.secondPassportCountry} onChange={(v) => u("secondPassportCountry", v)} error={errors.secondPassportCountry} />
          </Field>
          <Field label="Expiry Date" error={errors.secondPassportExpiry}>
            <DatePickerField value={data.secondPassportExpiry} onChange={(v) => u("secondPassportExpiry", v)} />
          </Field>
        </div>
      )}
    </div>
  );
};

// ==========================================================================
// STEP 3 — Contact Information
// ==========================================================================
export const ContactSection = ({ data, onChange, errors = {} }) => {
  const u = makeUpdate(data, onChange);
  return (
    <div className="space-y-4">
      <HelpText>Used by embassies, visa centres and travel consultants to contact applicants.</HelpText>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Email Address" required error={errors.email}>
          <TextInput type="email" value={data.email} onChange={(v) => u("email", v)} error={errors.email} placeholder="name@example.com" />
        </Field>
        <Field label="Mobile Number" required error={errors.mobile}>
          <CountryCodeDropdown
            dialCode={data.mobile?.dialCode}
            number={data.mobile?.number}
            onChange={(val) => u("mobile", val)}
            error={errors.mobile}
          />
        </Field>
      </div>

      <label className="flex items-center gap-2 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={!!data.whatsappSameAsMobile}
          onChange={(e) => u("whatsappSameAsMobile", e.target.checked)}
          className="rounded text-[#0F3D2E] bg-[#F8F6F2] border-[#E5E7EB] focus:ring-0 h-4 w-4 cursor-pointer"
        />
        <span className="text-xs text-[#6B7280] font-medium">WhatsApp number is same as mobile number</span>
      </label>

      {!data.whatsappSameAsMobile && (
        <Field label="WhatsApp Number" className="sm:max-w-[50%]">
          <CountryCodeDropdown
            dialCode={data.whatsapp?.dialCode}
            number={data.whatsapp?.number}
            onChange={(val) => u("whatsapp", val)}
          />
        </Field>
      )}

      <div className="pt-2">
        <p className="text-[10px] uppercase tracking-wider font-bold text-[#0F3D2E] mb-3">Home Address</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Address Line 1" required error={errors.addressLine1} className="sm:col-span-2">
            <TextInput value={data.addressLine1} onChange={(v) => u("addressLine1", v)} error={errors.addressLine1} />
          </Field>
          <Field label="Address Line 2" className="sm:col-span-2">
            <TextInput value={data.addressLine2} onChange={(v) => u("addressLine2", v)} />
          </Field>
          <Field label="City" required error={errors.city}>
            <TextInput value={data.city} onChange={(v) => u("city", v)} error={errors.city} />
          </Field>
          <Field label="State / Province" required error={errors.state}>
            <TextInput value={data.state} onChange={(v) => u("state", v)} error={errors.state} />
          </Field>
          <Field label="Country" required error={errors.country}>
            <SearchableCountryDropdown value={data.country} onChange={(v) => u("country", v)} error={errors.country} />
          </Field>
          <Field label="Postal Code" error={errors.postalCode}>
            <TextInput value={data.postalCode} onChange={(v) => u("postalCode", v)} />
          </Field>
        </div>
      </div>
    </div>
  );
};

// ==========================================================================
// STEP 4 — UAE Residence Information
// ==========================================================================
export const UaeResidenceSection = ({ data, onChange, errors = {} }) => {
  const u = makeUpdate(data, onChange);
  return (
    <div className="space-y-4">
      <HelpText>Most embassies require proof of legal UAE residency before accepting visa applications.</HelpText>
      <Field label="Are you currently residing in UAE?" className="sm:max-w-[50%]">
        <RadioGroup value={data.residingInUae} onChange={(v) => u("residingInUae", v)} name="residingUae" />
      </Field>

      {data.residingInUae === "yes" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Emirates ID Number" required error={errors.emiratesId}>
            <TextInput value={data.emiratesId} onChange={(v) => u("emiratesId", v)} error={errors.emiratesId} placeholder="784-XXXX-XXXXXXX-X" />
          </Field>
          <Field label="UAE Residence Visa Number" required error={errors.residenceVisaNumber}>
            <TextInput value={data.residenceVisaNumber} onChange={(v) => u("residenceVisaNumber", v)} error={errors.residenceVisaNumber} />
          </Field>
          <Field label="Unified Number (UID)" error={errors.unifiedNumber}>
            <TextInput value={data.unifiedNumber} onChange={(v) => u("unifiedNumber", v)} placeholder="Optional" />
          </Field>
          <Field label="Emirate" required error={errors.emirate}>
            <SelectInput value={data.emirate} onChange={(v) => u("emirate", v)} options={EMIRATES} error={errors.emirate} />
          </Field>
          <Field label="Residence Visa Issue Date" required error={errors.visaIssueDate}>
            <DatePickerField value={data.visaIssueDate} onChange={(v) => u("visaIssueDate", v)} error={errors.visaIssueDate} />
          </Field>
          <Field label="Residence Visa Expiry Date" required error={errors.visaExpiryDate}>
            <DatePickerField value={data.visaExpiryDate} onChange={(v) => u("visaExpiryDate", v)} error={errors.visaExpiryDate} min={data.visaIssueDate || undefined} />
          </Field>
          <Field label="Sponsor Type" required error={errors.sponsorType}>
            <SelectInput value={data.sponsorType} onChange={(v) => u("sponsorType", v)} options={SPONSOR_TYPES} error={errors.sponsorType} />
          </Field>
          <Field label="Occupation Mentioned On UAE Visa" error={errors.occupationOnVisa}>
            <TextInput value={data.occupationOnVisa} onChange={(v) => u("occupationOnVisa", v)} />
          </Field>
          <Field label="Date First Entered UAE" error={errors.firstEnteredUae}>
            <DatePickerField value={data.firstEnteredUae} onChange={(v) => u("firstEnteredUae", v)} max={new Date().toISOString().split("T")[0]} />
          </Field>
        </div>
      )}
    </div>
  );
};

// ==========================================================================
// STEP 5 — Employment / Education
// ==========================================================================
export const EmploymentSection = ({ data, onChange, errors = {} }) => {
  const u = makeUpdate(data, onChange);
  const status = data.currentStatus;
  const isStudent = status === "Student";
  // Employer details only make sense for working statuses.
  const isWorking = ["Employed", "Self Employed", "Business Owner"].includes(status);
  // Retired travellers can list their former occupation; working ones their current one.
  const showOccupation = isWorking || status === "Retired";
  const occupationLabel =
    status === "Retired" ? "Former Occupation"
    : status === "Self Employed" ? "Profession / Trade"
    : status === "Business Owner" ? "Role / Title"
    : "Occupation";

  // Label set adapts to the kind of work (employee vs. self-employed vs. business owner).
  const workLabels =
    status === "Self Employed"
      ? { org: "Business / Trade Name", phone: "Business Phone Number", address: "Business Address", email: "Business Email", date: "Self-Employed Since", heading: "Self-Employment Details" }
      : status === "Business Owner"
      ? { org: "Company Name", phone: "Company Phone Number", address: "Company Address", email: "Company Email", date: "Business Established Date", heading: "Business Details" }
      : { org: "Employer / Company Name", phone: "Employer Phone Number", address: "Employer Address", email: "Employer Email", date: "Employment Start Date", heading: "Employment Details" };

  return (
    <div className="space-y-4">
      <HelpText>Required by most embassies to establish employment, education and residency ties.</HelpText>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Current Status" required error={errors.currentStatus}>
          <SelectInput value={data.currentStatus} onChange={(v) => u("currentStatus", v)} options={EMPLOYMENT_STATUS} error={errors.currentStatus} />
        </Field>
        {showOccupation && (
          <Field label={occupationLabel} error={errors.occupation}>
            <TextInput value={data.occupation} onChange={(v) => u("occupation", v)} />
          </Field>
        )}
      </div>

      {/* Work details — labels adapt to Employed / Self Employed / Business Owner */}
      {isWorking && (
        <div className="space-y-4 p-4 bg-[#0F3D2E]/[0.03] border border-[#0F3D2E]/10 rounded-xl">
          <p className="text-[10px] uppercase tracking-wider font-bold text-[#0F3D2E]">{workLabels.heading}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label={workLabels.org} error={errors.employerName}>
              <TextInput value={data.employerName} onChange={(v) => u("employerName", v)} />
            </Field>
            <Field label={workLabels.phone} error={errors.employerPhone}>
              <TextInput type="tel" value={data.employerPhone} onChange={(v) => u("employerPhone", v)} />
            </Field>
            <Field label={workLabels.address} error={errors.employerAddress} className="sm:col-span-2">
              <TextInput value={data.employerAddress} onChange={(v) => u("employerAddress", v)} />
            </Field>
            <Field label={workLabels.email} error={errors.employerEmail}>
              <TextInput type="email" value={data.employerEmail} onChange={(v) => u("employerEmail", v)} />
            </Field>
            <Field label={workLabels.date} error={errors.employmentStartDate}>
              <DatePickerField value={data.employmentStartDate} onChange={(v) => u("employmentStartDate", v)} max={new Date().toISOString().split("T")[0]} />
            </Field>
          </div>
        </div>
      )}

      {/* Education details — only for Students */}
      {isStudent && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-[#0F3D2E]/[0.03] border border-[#0F3D2E]/10 rounded-xl">
          <Field label="Institution Name" error={errors.institutionName}>
            <TextInput value={data.institutionName} onChange={(v) => u("institutionName", v)} />
          </Field>
          <Field label="Course" error={errors.course}>
            <TextInput value={data.course} onChange={(v) => u("course", v)} />
          </Field>
          <Field label="Institution Address" error={errors.institutionAddress} className="sm:col-span-2">
            <TextInput value={data.institutionAddress} onChange={(v) => u("institutionAddress", v)} />
          </Field>
          <Field label="Year Of Study" error={errors.yearOfStudy}>
            <TextInput value={data.yearOfStudy} onChange={(v) => u("yearOfStudy", v)} />
          </Field>
        </div>
      )}
    </div>
  );
};

// ==========================================================================
// STEP 6 — Emergency Contact
// ==========================================================================
export const EmergencySection = ({ data, onChange, errors = {} }) => {
  const u = makeUpdate(data, onChange);
  return (
    <div className="space-y-4">
      <HelpText>May be required by embassies, airlines, travel insurance providers and consular authorities.</HelpText>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Full Name" required error={errors.fullName}>
          <TextInput value={data.fullName} onChange={(v) => u("fullName", v)} error={errors.fullName} />
        </Field>
        <Field label="Relationship" required error={errors.relationship}>
          <SelectInput value={data.relationship} onChange={(v) => u("relationship", v)} options={RELATIONSHIPS} error={errors.relationship} />
        </Field>
        <Field label="Mobile Number" required error={errors.mobile}>
          <CountryCodeDropdown
            dialCode={data.mobile?.dialCode}
            number={data.mobile?.number}
            onChange={(val) => u("mobile", val)}
            error={errors.mobile}
          />
        </Field>
        <Field label="Country" required error={errors.country}>
          <SearchableCountryDropdown value={data.country} onChange={(v) => u("country", v)} error={errors.country} />
        </Field>
        <Field label="Address" required error={errors.address} className="sm:col-span-2">
          <TextInput value={data.address} onChange={(v) => u("address", v)} error={errors.address} />
        </Field>
      </div>
    </div>
  );
};

// Ordered step metadata used by the stepper + review screen.
export const STEP_META = [
  { key: "personalInformation", title: "Personal Information", Section: PersonalSection },
  { key: "passportInformation", title: "Passport Information", Section: PassportSection },
  { key: "contactInformation", title: "Contact Information", Section: ContactSection },
  { key: "uaeResidenceInformation", title: "UAE Residence", Section: UaeResidenceSection },
  { key: "employmentInformation", title: "Employment / Education", Section: EmploymentSection },
  { key: "emergencyContact", title: "Emergency Contact", Section: EmergencySection }
];
