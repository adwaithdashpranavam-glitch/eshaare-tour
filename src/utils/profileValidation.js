// Validation rules for the traveler profile verification flow.
// Each step validator returns an object of { fieldKey: "error message" }.
// An empty object means the step is valid.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const isValidEmail = (email) => EMAIL_RE.test(String(email || "").trim());

// Returns age in whole years from an ISO date string, or null.
export const getAge = (isoDate) => {
  if (!isoDate) return null;
  const dob = new Date(isoDate);
  if (isNaN(dob.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const m = now.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age--;
  return age;
};

const req = (v) => v !== undefined && v !== null && String(v).trim() !== "";
const reqPhone = (p) => p && req(p.number);

// ---- Step validators ----

export const validatePersonal = (d = {}, { isDependent = false } = {}) => {
  const e = {};
  if (!req(d.surname)) e.surname = "Surname is required";
  if (!req(d.givenName)) e.givenName = "Given name is required";
  if (!req(d.gender)) e.gender = "Gender is required";
  if (!req(d.dateOfBirth)) {
    e.dateOfBirth = "Date of birth is required";
  } else {
    const age = getAge(d.dateOfBirth);
    if (age !== null && age < 0) e.dateOfBirth = "Date of birth cannot be in the future";
    else if (!isDependent && age !== null && age < 18)
      e.dateOfBirth = "Applicant must be at least 18 (unless added as a dependent family member)";
  }
  if (!req(d.placeOfBirth)) e.placeOfBirth = "Place of birth is required";
  if (!req(d.countryOfBirth)) e.countryOfBirth = "Country of birth is required";
  if (!req(d.currentNationality)) e.currentNationality = "Current nationality is required";
  if (!req(d.maritalStatus)) e.maritalStatus = "Marital status is required";
  return e;
};

export const validatePassport = (d = {}) => {
  const e = {};
  if (!req(d.passportType)) e.passportType = "Passport type is required";
  if (!req(d.passportNumber)) e.passportNumber = "Passport number is required";
  if (!req(d.dateOfIssue)) e.dateOfIssue = "Date of issue is required";
  if (!req(d.dateOfExpiry)) e.dateOfExpiry = "Date of expiry is required";
  if (req(d.dateOfIssue) && req(d.dateOfExpiry)) {
    if (new Date(d.dateOfExpiry) <= new Date(d.dateOfIssue))
      e.dateOfExpiry = "Expiry date must be after the issue date";
  }
  if (!req(d.issuingCountry)) e.issuingCountry = "Issuing country is required";
  if (d.holdsAnotherPassport === "yes") {
    if (!req(d.secondPassportNumber)) e.secondPassportNumber = "Second passport number is required";
    if (!req(d.secondPassportCountry)) e.secondPassportCountry = "Second passport country is required";
  }
  return e;
};

export const validateContact = (d = {}) => {
  const e = {};
  if (!req(d.email)) e.email = "Email is required";
  else if (!isValidEmail(d.email)) e.email = "Enter a valid email address";
  if (!reqPhone(d.mobile)) e.mobile = "Mobile number is required";
  if (!d.whatsappSameAsMobile && d.whatsapp && !req(d.whatsapp.number)) {
    // optional, only flag if shown and partially filled — leave lenient
  }
  if (!req(d.addressLine1)) e.addressLine1 = "Address Line 1 is required";
  if (!req(d.city)) e.city = "City is required";
  if (!req(d.state)) e.state = "State / Province is required";
  if (!req(d.country)) e.country = "Country is required";
  return e;
};

export const validateUaeResidence = (d = {}) => {
  const e = {};
  if (d.residingInUae === "yes") {
    if (!req(d.emiratesId)) e.emiratesId = "Emirates ID number is required";
    if (!req(d.residenceVisaNumber)) e.residenceVisaNumber = "Residence visa number is required";
    if (!req(d.visaIssueDate)) e.visaIssueDate = "Residence visa issue date is required";
    if (!req(d.visaExpiryDate)) e.visaExpiryDate = "Residence visa expiry date is required";
    if (req(d.visaIssueDate) && req(d.visaExpiryDate)) {
      if (new Date(d.visaExpiryDate) <= new Date(d.visaIssueDate))
        e.visaExpiryDate = "Expiry date must be after the issue date";
    }
    if (!req(d.emirate)) e.emirate = "Emirate is required";
    if (!req(d.sponsorType)) e.sponsorType = "Sponsor type is required";
  }
  return e;
};

export const validateEmployment = (d = {}) => {
  const e = {};
  if (!req(d.currentStatus)) e.currentStatus = "Current status is required";
  // Student & employment sub-fields are optional per spec (no asterisks)
  return e;
};

export const validateEmergency = (d = {}) => {
  const e = {};
  if (!req(d.fullName)) e.fullName = "Full name is required";
  if (!req(d.relationship)) e.relationship = "Relationship is required";
  if (!reqPhone(d.mobile)) e.mobile = "Mobile number is required";
  if (!req(d.address)) e.address = "Address is required";
  if (!req(d.country)) e.country = "Country is required";
  return e;
};

// Map step index (1-based) to its validator + data key
export const STEP_VALIDATORS = {
  1: { key: "personalInformation", fn: validatePersonal },
  2: { key: "passportInformation", fn: validatePassport },
  3: { key: "contactInformation", fn: validateContact },
  4: { key: "uaeResidenceInformation", fn: validateUaeResidence },
  5: { key: "employmentInformation", fn: validateEmployment },
  6: { key: "emergencyContact", fn: validateEmergency }
};

// Validate the entire profile; returns { stepNumber: errorsObject } for steps with errors.
export const validateAllSteps = (profile = {}, opts = {}) => {
  const result = {};
  Object.entries(STEP_VALIDATORS).forEach(([step, { key, fn }]) => {
    const errs = fn(profile[key] || {}, opts);
    if (Object.keys(errs).length > 0) result[step] = errs;
  });
  return result;
};
