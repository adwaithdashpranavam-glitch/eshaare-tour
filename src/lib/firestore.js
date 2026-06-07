import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  setDoc,
  deleteDoc,
  writeBatch,
  query,
  where,
  orderBy,
  onSnapshot,
  limit,
  serverTimestamp
} from "firebase/firestore";
import { db, auth } from "./firebase";
import toast from "react-hot-toast";

// Helper for error logging
const handleError = (error, context) => {
  console.error(`Firestore Error in [${context}]:`, error);
  throw new Error(error.message || `An error occurred while database operations in ${context}.`);
};

// ==========================================
// LEADS COLLECTION SERVICES
// ==========================================

export const createLead = async (data) => {
  try {
    const leadsRef = collection(db, "leads");
    const docRef = await addDoc(leadsRef, {
      ...data,
      isDeleted: false,
      isActive: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    handleError(error, "createLead");
  }
};

export const getLeads = (filters = {}, callback) => {
  try {
    const leadsRef = collection(db, "leads");
    let q = query(leadsRef, where("isDeleted", "==", false), orderBy("createdAt", "desc"));

    if (filters.stage && filters.stage !== "All") {
      q = query(leadsRef, where("isDeleted", "==", false), where("stage", "==", filters.stage), orderBy("createdAt", "desc"));
    }
    if (filters.source && filters.source !== "All") {
      q = query(leadsRef, where("isDeleted", "==", false), where("source", "==", filters.source), orderBy("createdAt", "desc"));
    }
    if (filters.assignedTo && filters.assignedTo !== "All") {
      q = query(leadsRef, where("isDeleted", "==", false), where("assignedTo", "==", filters.assignedTo), orderBy("createdAt", "desc"));
    }

    return onSnapshot(q, (snapshot) => {
      const leads = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(leads);
    }, (error) => {
      console.error("Leads listener error:", error);
    });
  } catch (error) {
    handleError(error, "getLeads");
  }
};

export const updateLead = async (id, data) => {
  try {
    const docRef = doc(db, "leads", id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    handleError(error, "updateLead");
  }
};

export const deleteLead = async (id) => {
  try {
    // Soft delete as requested: isDeleted: true, isActive: false
    await updateLead(id, { isDeleted: true, isActive: false });
  } catch (error) {
    handleError(error, "deleteLead");
  }
};

// ==========================================
// VISA CASES COLLECTION SERVICES
// ==========================================

export const createCase = async (data) => {
  try {
    const casesRef = collection(db, "visa_cases");
    const docRef = await addDoc(casesRef, {
      ...data,
      isDeleted: false,
      isActive: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    handleError(error, "createCase");
  }
};

export const getCases = (filters = {}, callback) => {
  try {
    const casesRef = collection(db, "visa_cases");
    let q = query(casesRef, where("isDeleted", "==", false), orderBy("createdAt", "desc"));

    if (filters.stage && filters.stage !== "All") {
      q = query(casesRef, where("isDeleted", "==", false), where("stage", "==", filters.stage), orderBy("createdAt", "desc"));
    }
    if (filters.assignedOfficer && filters.assignedOfficer !== "All") {
      q = query(casesRef, where("isDeleted", "==", false), where("assignedOfficer", "==", filters.assignedOfficer), orderBy("createdAt", "desc"));
    }

    return onSnapshot(q, (snapshot) => {
      const cases = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(cases);
    }, (error) => {
      console.error("Cases listener error:", error);
    });
  } catch (error) {
    handleError(error, "getCases");
  }
};

export const updateCase = async (id, data) => {
  try {
    const docRef = doc(db, "visa_cases", id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    handleError(error, "updateCase");
  }
};

// ==========================================
// USERS COLLECTION SERVICES
// ==========================================

export const getUsers = async () => {
  try {
    const usersRef = collection(db, "users");
    const snapshot = await getDocs(usersRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    handleError(error, "getUsers");
  }
};

export const updateUser = async (id, data) => {
  try {
    const docRef = doc(db, "users", id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    handleError(error, "updateUser");
  }
};

// ==========================================
// PAYMENTS COLLECTION SERVICES
// ==========================================

export const createPayment = async (data) => {
  try {
    const paymentsRef = collection(db, "payments");
    const docRef = await addDoc(paymentsRef, {
      ...data,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    handleError(error, "createPayment");
  }
};

export const getPayments = (orderId, callback) => {
  try {
    const paymentsRef = collection(db, "payments");
    let q = query(paymentsRef, orderBy("createdAt", "desc"));
    if (orderId) {
      q = query(paymentsRef, where("orderId", "==", orderId), orderBy("createdAt", "desc"));
    }
    return onSnapshot(q, (snapshot) => {
      const payments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(payments);
    }, (error) => {
      console.error("Payments listener error:", error);
    });
  } catch (error) {
    handleError(error, "getPayments");
  }
};

// ==========================================
// TASKS COLLECTION SERVICES
// ==========================================

export const createTask = async (data) => {
  try {
    const tasksRef = collection(db, "tasks");
    const docRef = await addDoc(tasksRef, {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    handleError(error, "createTask");
  }
};

export const getTasks = (assignedTo, callback) => {
  try {
    const tasksRef = collection(db, "tasks");
    let q = query(tasksRef, orderBy("createdAt", "desc"));
    if (assignedTo && assignedTo !== "All") {
      q = query(tasksRef, where("assignedTo", "==", assignedTo), orderBy("createdAt", "desc"));
    }
    return onSnapshot(q, (snapshot) => {
      const tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(tasks);
    }, (error) => {
      console.error("Tasks listener error:", error);
    });
  } catch (error) {
    handleError(error, "getTasks");
  }
};

// ==========================================
// DOCUMENTS COLLECTION SERVICES
// ==========================================

export const createDocument = async (data) => {
  try {
    const docsRef = collection(db, "documents");
    const docRef = await addDoc(docsRef, {
      ...data,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    handleError(error, "createDocument");
  }
};

export const getDocuments = (travellerId, callback) => {
  try {
    const docsRef = collection(db, "documents");
    let q = query(docsRef);
    if (travellerId) {
      q = query(docsRef, where("travellerId", "==", travellerId));
    }
    return onSnapshot(q, (snapshot) => {
      const documents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      documents.sort((a, b) => {
        const dateA = a.createdAt?.seconds ? new Date(a.createdAt.seconds * 1000) : new Date(a.createdAt || 0);
        const dateB = b.createdAt?.seconds ? new Date(b.createdAt.seconds * 1000) : new Date(b.createdAt || 0);
        return dateB - dateA;
      });
      callback(documents);
    }, (error) => {
      console.error("Documents listener error:", error);
    });
  } catch (error) {
    handleError(error, "getDocuments");
  }
};

// ==========================================
// VISA TYPES CMS COLLECTION SERVICES
// ==========================================

export function getVisaTypes(callback, onlyPublished = false, errorCallback = null) {
  try {
    const collRef = collection(db, "visa_types");
    let q;
    if (onlyPublished) {
      q = query(collRef, where("isPublished", "==", true));
    } else {
      q = query(collRef);
    }
    return onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sort items client-side by sortOrder ascending
      items.sort((a, b) => {
        const orderA = a.sortOrder !== undefined ? Number(a.sortOrder) : 999;
        const orderB = b.sortOrder !== undefined ? Number(b.sortOrder) : 999;
        return orderA - orderB;
      });
      callback(items);
    }, (error) => {
      console.error("Visa Types listener error:", error);
      if (errorCallback) {
        errorCallback(error);
      }
    });
  } catch (error) {
    handleError(error, "getVisaTypes");
  }
}

export async function getVisaTypeBySlug(slug) {
  try {
    const docRef = doc(db, "visa_types", slug);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() };
    }

    // Try fallback suffix (e.g. "uk" -> "uk-visa")
    const fallbackSlug = `${slug}-visa`;
    const fallbackDocRef = doc(db, "visa_types", fallbackSlug);
    const fallbackSnap = await getDoc(fallbackDocRef);
    if (fallbackSnap.exists()) {
      return { id: fallbackSnap.id, ...fallbackSnap.data() };
    }

    // Try fallback prefix (e.g. "uk-visa" -> "uk")
    if (slug.endsWith("-visa")) {
      const baseSlug = slug.replace("-visa", "");
      const baseDocRef = doc(db, "visa_types", baseSlug);
      const baseSnap = await getDoc(baseDocRef);
      if (baseSnap.exists()) {
        return { id: baseSnap.id, ...baseSnap.data() };
      }
    }

    return null;
  } catch (error) {
    handleError(error, "getVisaTypeBySlug");
  }
}

export async function saveVisaType(id, data) {
  try {
    const docRef = doc(db, "visa_types", id);
    const uid = auth.currentUser?.uid || "system";
    await setDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
      updatedBy: uid
    }, { merge: true });
  } catch (error) {
    handleError(error, "saveVisaType");
  }
}

export async function deleteVisaType(id) {
  try {
    const docRef = doc(db, "visa_types", id);
    await deleteDoc(docRef);
  } catch (error) {
    handleError(error, "deleteVisaType");
  }
}

export async function updateVisaTypeSortOrders(updates) {
  try {
    const batch = writeBatch(db);
    updates.forEach(update => {
      const docRef = doc(db, "visa_types", update.id);
      batch.update(docRef, { 
        sortOrder: update.sortOrder, 
        updatedAt: serverTimestamp() 
      });
    });
    await batch.commit();
  } catch (error) {
    handleError(error, "updateVisaTypeSortOrders");
  }
}

const SEED_VISA_TYPES = [
  {
    slug: "schengen",
    imageUrl: "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=800&q=80",
    name: "Schengen Europe Visa",
    tagline: "Travel freely across 27 European member states with expert support",
    isPublished: true,
    sortOrder: 1,
    heroStats: [
      { label: "Processing Time", value: "5-10 Days", icon: "Clock" },
      { label: "Success Rate", value: "98.2%", icon: "TrendingUp" },
      { label: "Required Documents", value: "4 Core Docs", icon: "FileText" },
      { label: "Embassy Appointments", value: "Express Slots", icon: "Calendar" }
    ],
    overviewText: "The Schengen Visa allows short-term stays in any of the 27 member states for up to 90 days within any 180-day period. Navigating biometrics slots and document compliance at VFS Global in Dubai or Abu Dhabi can be challenging. Eshaare Tours takes care of your entire application flow, ensuring you get compliant flight bookings, hotel vouchers, NOC evaluation check-sheets, and an early biometrics appointment.",
    requiredDocuments: [
      "A passport valid for at least 6 months with two blank pages",
      "A valid UAE residency visa (valid for at least 3 months from the date of return)",
      "Passport-sized photographs (white background, taken within 6 months)",
      "3-6 months bank statements showing sufficient funds",
      "No Objection Certificate (NOC) from employer",
      "Confirmed flight reservation (return ticket)",
      "Hotel booking confirmation for entire stay"
    ],
    processSteps: [
      {
        stepNumber: 1,
        title: "Submit Details & NOC Checklist",
        description: "Fill in your travel information on our site. We generate custom NOC templates matching your specific UAE employer."
      },
      {
        stepNumber: 2,
        title: "Compliance Audit Check",
        description: "Our senior visa executives verify bank statement transactions, passport validity, photo dimensions, and itinerary matches."
      },
      {
        stepNumber: 3,
        title: "VFS Slot Booking & Submission",
        description: "We secure and schedule an appointment slot at VFS Dubai/Abu Dhabi, compile your complete document dossier, and accompany you through submission."
      },
      {
        stepNumber: 4,
        title: "Visa Approved & Delivery",
        description: "Track passport return in real-time inside our portal. Receive your passport back with your approved Schengen sticker."
      }
    ],
    feeStructure: [
      { applicantType: "Adult (12+ years)", embassyFee: "320 AED (€80)", serviceFee: "280 AED" },
      { applicantType: "Child (6-12 years)", embassyFee: "160 AED (€40)", serviceFee: "280 AED" },
      { applicantType: "Infant (under 6 years)", embassyFee: "Free", serviceFee: "200 AED" }
    ],
    faqs: [
      {
        question: "What documents are required for a Schengen visa?",
        answer: "Standard requirements include a valid passport, UAE residence visa, NOC from employer, 3-6 months bank statements, travel insurance, and flight/hotel bookings."
      },
      {
        question: "Can you guarantee my Schengen visa approval?",
        answer: "No agency can guarantee a visa as the decision rests solely with the embassy. However, we maximize your chances by ensuring 100% documentation compliance."
      },
      {
        question: "How long does Schengen processing take?",
        answer: "Schengen visas usually take 15 working days post-submission. We recommend starting at least 6-8 weeks before travel."
      },
      {
        question: "Which countries can I visit with a Schengen visa?",
        answer: "You can visit all 27 Schengen member states including France, Germany, Italy, Spain, Switzerland, Netherlands, Austria, and more."
      }
    ],
    metaTitle: "Schengen Visa Dubai | Eshaare Tours",
    metaDescription: "Apply for Schengen visa in Dubai with expert support. VFS slot booking, document audit, and 98% success rate. Contact Eshaare Tours today."
  },
  {
    slug: "uk-visa",
    imageUrl: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=800&q=80",
    name: "United Kingdom Visa",
    tagline: "Standard and priority UK visa processing from Dubai",
    isPublished: true,
    sortOrder: 2,
    heroStats: [
      { label: "Processing Time", value: "15 Working Days", icon: "Clock" },
      { label: "Success Rate", value: "96%", icon: "TrendingUp" },
      { label: "Required Documents", value: "6 Core Docs", icon: "FileText" },
      { label: "Appointment Type", value: "VFS Dubai", icon: "Calendar" }
    ],
    overviewText: "The UK Standard Visitor Visa allows you to visit the United Kingdom for tourism, business meetings, family visits, or short-term study. Applications are submitted through VFS Global in Dubai and processed by UK Visas and Immigration. Eshaare Tours handles your complete application including the online form, financial evidence review, and biometric appointment booking.",
    requiredDocuments: [
      "Valid passport with at least 6 months validity",
      "UAE residence visa valid for at least 6 months",
      "6 months bank statements showing regular income",
      "Employer NOC or business ownership documents",
      "Proof of property ownership or tenancy in UAE",
      "Invitation letter if visiting family or friends in UK"
    ],
    processSteps: [
      {
        stepNumber: 1,
        title: "Online Application Form",
        description: "We complete your UK online visa application form accurately, avoiding common errors that lead to refusals."
      },
      {
        stepNumber: 2,
        title: "Document Preparation",
        description: "Full document audit including financial evidence review, employment verification, and travel history assessment."
      },
      {
        stepNumber: 3,
        title: "VFS Appointment & Biometrics",
        description: "We book your VFS appointment for biometric enrollment and guide you through what to expect on the day."
      },
      {
        stepNumber: 4,
        title: "Decision & Passport Return",
        description: "UK visa decisions typically take 15 working days. We track your application and notify you immediately on decision."
      }
    ],
    feeStructure: [
      { applicantType: "Standard Visitor (Adult)", embassyFee: "470 AED (£115)", serviceFee: "350 AED" },
      { applicantType: "Standard Visitor (Child under 18)", embassyFee: "470 AED (£115)", serviceFee: "350 AED" },
      { applicantType: "Priority Service (add-on)", embassyFee: "1,320 AED (£250)", serviceFee: "150 AED" }
    ],
    faqs: [
      {
        question: "How long can I stay in the UK on a visitor visa?",
        answer: "You can stay up to 6 months per visit on a Standard Visitor Visa."
      },
      {
        question: "Can I work in the UK on a visitor visa?",
        answer: "No. The Standard Visitor Visa does not permit paid employment in the UK."
      },
      {
        question: "What is the UK visa success rate for UAE residents?",
        answer: "UAE residents with strong financial ties and a clear travel purpose typically enjoy a high approval rate. Our compliance audit significantly improves your file strength."
      }
    ],
    metaTitle: "UK Visa Dubai | Eshaare Tours",
    metaDescription: "Apply for UK Standard Visitor Visa from Dubai. Expert document preparation, VFS appointment booking, and 96% success rate."
  },
  {
    slug: "usa-visa",
    imageUrl: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?auto=format&fit=crop&w=800&q=80",
    name: "United States Visa (B1/B2)",
    tagline: "Tourist and business visa with interview preparation",
    isPublished: true,
    sortOrder: 3,
    heroStats: [
      { label: "Processing Time", value: "4-8 Weeks", icon: "Clock" },
      { label: "Success Rate", value: "91%", icon: "TrendingUp" },
      { label: "Required Documents", value: "8 Core Docs", icon: "FileText" },
      { label: "Interview Type", value: "Embassy Dubai", icon: "Calendar" }
    ],
    overviewText: "The B1/B2 US Visitor Visa covers both tourism (B2) and business activities (B1). The process requires completing the DS-160 online form, paying the MRV fee, scheduling an interview at the US Embassy in Dubai, and attending your biometric and interview appointment. Eshaare Tours guides you through every step including mock interview preparation.",
    requiredDocuments: [
      "Valid passport (must be valid for at least 6 months beyond intended stay)",
      "Current UAE residence visa",
      "DS-160 confirmation page (we complete this for you)",
      "MRV fee payment receipt",
      "Passport-sized photographs (US specification)",
      "Proof of strong ties to UAE (property, family, employment)",
      "Bank statements and financial evidence",
      "Travel itinerary and purpose of visit letter"
    ],
    processSteps: [
      {
        stepNumber: 1,
        title: "DS-160 Form Completion",
        description: "We complete your DS-160 nonimmigrant visa application accurately. Errors on this form are a leading cause of refusals."
      },
      {
        stepNumber: 2,
        title: "MRV Fee & Interview Scheduling",
        description: "We assist with MRV fee payment and schedule the earliest available interview slot at the US Embassy Abu Dhabi or Dubai."
      },
      {
        stepNumber: 3,
        title: "Document Preparation & Mock Interview",
        description: "Full document review plus a mock interview session to prepare you for common consular questions."
      },
      {
        stepNumber: 4,
        title: "Interview Day & Visa Collection",
        description: "We brief you on interview day protocol. Approved passports are returned via courier within 3-5 business days."
      }
    ],
    feeStructure: [
      { applicantType: "B1/B2 Tourist/Business (Adult)", embassyFee: "565 AED ($160)", serviceFee: "450 AED" },
      { applicantType: "B1/B2 Tourist/Business (Child)", embassyFee: "565 AED ($160)", serviceFee: "450 AED" },
      { applicantType: "Mock Interview Preparation", embassyFee: "N/A", serviceFee: "200 AED" }
    ],
    faqs: [
      {
        question: "How long is the US B1/B2 visa valid?",
        answer: "Most UAE applicants receive a 10-year multiple entry B1/B2 visa, allowing stays of up to 6 months per visit."
      },
      {
        question: "Do I need to attend an interview?",
        answer: "Most applicants are required to attend an in-person interview at the US Embassy. We prepare you thoroughly for this."
      },
      {
        question: "How far in advance should I apply?",
        answer: "We recommend applying at least 8-12 weeks before travel, as interview slots can be limited."
      }
    ],
    metaTitle: "US Visa Dubai | B1/B2 Visa Application | Eshaare Tours",
    metaDescription: "Apply for US tourist and business visa from Dubai. DS-160 form, interview preparation, and expert support. Eshaare Tours."
  },
  {
    slug: "uae-visa",
    imageUrl: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=800&q=80",
    name: "UAE Tourist & Transit Visa",
    tagline: "Invite your family and friends to the UAE",
    isPublished: true,
    sortOrder: 4,
    heroStats: [
      { label: "Processing Time", value: "3-5 Working Days", icon: "Clock" },
      { label: "Success Rate", value: "99%", icon: "TrendingUp" },
      { label: "Visa Types", value: "30/60/90 Day", icon: "FileText" },
      { label: "Application Type", value: "Online/ICP", icon: "Calendar" }
    ],
    overviewText: "UAE Tourist Visas allow visitors to enter the UAE for leisure, family visits, or business meetings. Available as 30-day single entry, 60-day single entry, or 90-day multiple entry. Applications are submitted through ICP (Federal Authority for Identity and Citizenship) or via airline sponsorship. Eshaare Tours processes UAE visas on behalf of residents sponsoring family members.",
    requiredDocuments: [
      "Passport copy of the visitor (valid for at least 6 months)",
      "Recent passport-sized photograph",
      "Copy of sponsor's UAE residence visa",
      "Copy of sponsor's Emirates ID",
      "Copy of sponsor's passport",
      "Return flight ticket confirmation"
    ],
    processSteps: [
      {
        stepNumber: 1,
        title: "Submit Visitor & Sponsor Details",
        description: "Provide passport copies for the visitor and sponsor. We verify all documents for ICP compliance."
      },
      {
        stepNumber: 2,
        title: "Online Application Submission",
        description: "We submit the application through the official ICP portal on your behalf, selecting the correct visa category and duration."
      },
      {
        stepNumber: 3,
        title: "Payment & Processing",
        description: "Government fees are paid and the application is processed. Standard processing takes 3-5 working days."
      },
      {
        stepNumber: 4,
        title: "Visa Delivery",
        description: "Approved e-visa is delivered to your email. The visitor presents this at UAE port of entry."
      }
    ],
    feeStructure: [
      { applicantType: "30-Day Single Entry", embassyFee: "185 AED", serviceFee: "120 AED" },
      { applicantType: "60-Day Single Entry", embassyFee: "370 AED", serviceFee: "150 AED" },
      { applicantType: "90-Day Multiple Entry", embassyFee: "650 AED", serviceFee: "200 AED" },
      { applicantType: "Transit Visa (48 hours)", embassyFee: "50 AED", serviceFee: "80 AED" }
    ],
    faqs: [
      {
        question: "Who can apply for a UAE tourist visa?",
        answer: "Any UAE resident can sponsor a visit visa for a family member or friend. Some nationalities receive visa on arrival free of charge."
      },
      {
        question: "Can the visa be extended?",
        answer: "Yes, UAE tourist visas can be extended once for the same duration, subject to approval."
      },
      {
        question: "Can visitors work on a UAE tourist visa?",
        answer: "No. A tourist visa strictly prohibits any form of employment in the UAE."
      }
    ],
    metaTitle: "UAE Tourist Visa Dubai | Visit Visa | Eshaare Tours",
    metaDescription: "UAE tourist and transit visa services in Dubai. 30, 60, and 90-day options. Fast processing in 3-5 days."
  },
  {
    slug: "saudi-visa",
    imageUrl: "https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=800&q=80",
    name: "Saudi Arabia Visa",
    tagline: "Umrah, tourist, and business visa for the Kingdom",
    isPublished: true,
    sortOrder: 5,
    heroStats: [
      { label: "Processing Time", value: "5-7 Working Days", icon: "Clock" },
      { label: "Success Rate", value: "97%", icon: "TrendingUp" },
      { label: "Visa Types", value: "Umrah/Tourist/Business", icon: "FileText" },
      { label: "Application", value: "Online eVisa", icon: "Calendar" }
    ],
    overviewText: "Saudi Arabia has opened its borders significantly for tourism and spiritual travel. The Umrah visa allows Muslims to perform Umrah any time of year, while the Tourist eVisa is available to over 50 nationalities. Business visas require a Saudi sponsor letter. Eshaare Tours processes all Saudi visa types with dedicated Umrah package options.",
    requiredDocuments: [
      "Passport valid for at least 6 months",
      "Recent passport photograph",
      "For Umrah: proof of Muslim faith (may be required)",
      "For business visa: invitation letter from Saudi company",
      "UAE residence visa copy",
      "Travel insurance"
    ],
    processSteps: [
      {
        stepNumber: 1,
        title: "Select Visa Type",
        description: "Choose between Umrah, Tourist, or Business visa. We confirm the correct category based on your travel purpose."
      },
      {
        stepNumber: 2,
        title: "Document Collection",
        description: "We collect all required documents and verify compliance with Saudi embassy requirements."
      },
      {
        stepNumber: 3,
        title: "eVisa Application Submission",
        description: "Application submitted through the official Saudi eVisa portal. Most nationalities receive instant or 24-hour approval."
      },
      {
        stepNumber: 4,
        title: "eVisa Delivery",
        description: "Approved eVisa delivered to email. Valid for 1 year multiple entry with 90-day stays (tourist)."
      }
    ],
    feeStructure: [
      { applicantType: "Tourist eVisa (eligible nationalities)", embassyFee: "535 AED", serviceFee: "150 AED" },
      { applicantType: "Umrah Visa (with package)", embassyFee: "Included in package", serviceFee: "200 AED" },
      { applicantType: "Business Visa", embassyFee: "750 AED", serviceFee: "350 AED" }
    ],
    faqs: [
      {
        question: "Which nationalities can get Saudi tourist eVisa?",
        answer: "Over 50 nationalities including most Western countries, GCC residents, and many Asian nationalities are eligible. Contact us to confirm yours."
      },
      {
        question: "Is Umrah visa included in travel packages?",
        answer: "Yes, our Umrah packages include the visa, accommodation in Makkah and Madinah, and transportation."
      }
    ],
    metaTitle: "Saudi Visa Dubai | Umrah & Tourist Visa | Eshaare Tours",
    metaDescription: "Saudi Arabia visa services in Dubai. Umrah, tourist, and business visa processing with expert support."
  }
];

export async function seedVisaTypes() {
  try {
    const batch = writeBatch(db);
    const uid = auth.currentUser?.uid || "system";

    SEED_VISA_TYPES.forEach(item => {
      const itemRef = doc(db, "visa_types", item.slug);
      
      const defaultSupportPackages = {
        showSupportPackages: item.slug === "schengen",
        supportPackages: {
          standard: {
            title: item.slug === "schengen" ? "Standard Schengen Support" : `${item.name} Standard Support`,
            subtitle: "Ideal for travelers who already have an appointment slot.",
            price: "299",
            features: [
              { text: "Document Checklist", included: true },
              { text: "Form Filling (Online)", included: true },
              { text: "Cover Letter Drafting", included: true },
              { text: "Slot Tracking", included: false }
            ]
          },
          premium: {
            title: item.slug === "schengen" ? "Premium Fast-Track Appointment Booking" : `${item.name} Premium Fast-Track`,
            subtitle: "Comprehensive end-to-end management with appointment tracking.",
            price: "549",
            recommended: true,
            features: [
              { text: "All Standard Features", included: true },
              { text: "Appointment Slot Tracking", included: true, highlighted: true },
              { text: "Travel Insurance", included: true },
              { text: "Flight & Hotel Vouchers", included: true },
              { text: "In-person Document Pickup", included: true }
            ]
          }
        }
      };

      batch.set(itemRef, {
        ...defaultSupportPackages,
        ...item,
        createdAt: new Date(),
        updatedAt: new Date(),
        updatedBy: uid
      });
    });

    await batch.commit();
    toast.success("5 visa types created successfully");
    return true;
  } catch (error) {
    handleError(error, "seedVisaTypes");
  }
}

// ==========================================
// CLIENT APPLICATIONS & NOTIFICATIONS SERVICES
// ==========================================

import { generateCaseNo } from "../utils/helpers";

export const createApplicationDraft = async (customerId, visaId, visaName, userProfile, packageType = "standard", amount = 299) => {
  try {
    const appRef = collection(db, "applications");
    const docRef = await addDoc(appRef, {
      customerId,
      visaId,
      visaName,
      status: "Draft",
      paymentStatus: "Unpaid",
      packageType,
      amount: Number(amount) || 0,
      createdAt: new Date(),
      submittedAt: null,
      formData: {
        name: userProfile?.name || "",
        phone: userProfile?.phone || "",
        email: userProfile?.email || "",
        nationality: userProfile?.nationality || "",
        travelDate: "",
        message: ""
      }
    });
    return docRef.id;
  } catch (error) {
    handleError(error, "createApplicationDraft");
  }
};

export const getApplicationsForCustomer = (customerId, callback) => {
  try {
    const appRef = collection(db, "applications");
    const q = query(appRef, where("customerId", "==", customerId));
    return onSnapshot(q, (snapshot) => {
      const apps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      apps.sort((a, b) => {
        const dateA = a.createdAt?.seconds ? new Date(a.createdAt.seconds * 1000) : new Date(a.createdAt || 0);
        const dateB = b.createdAt?.seconds ? new Date(b.createdAt.seconds * 1000) : new Date(b.createdAt || 0);
        return dateB - dateA;
      });
      callback(apps);
    }, (error) => {
      console.error("Applications listener error:", error);
    });
  } catch (error) {
    handleError(error, "getApplicationsForCustomer");
  }
};

export const updateApplication = async (appId, data) => {
  try {
    const docRef = doc(db, "applications", appId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: new Date()
    });
  } catch (error) {
    handleError(error, "updateApplication");
  }
};

export const submitApplication = async (appId, formData, visaName) => {
  try {
    const appRef = doc(db, "applications", appId);
    await updateDoc(appRef, {
      status: "Submitted",
      submittedAt: new Date(),
      formData
    });

    // Create corresponding CRM case
    const caseNumber = await generateCaseNo();
    const casesRef = collection(db, "visa_cases");
    await addDoc(casesRef, {
      caseNo: caseNumber,
      travellerName: formData.name,
      travellerPhone: formData.phone,
      travellerEmail: formData.email,
      nationality: formData.nationality || "",
      destination: visaName,
      visaType: visaName,
      stage: "Docs Pending",
      assignedOfficer: "Visa Ops Officer",
      isDeleted: false,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Create notification
    const notificationsRef = collection(db, "notifications");
    await addDoc(notificationsRef, {
      userId: auth.currentUser?.uid || "",
      title: "Application Submitted Successfully",
      message: `Your visa application for ${visaName} has been submitted successfully (Case No: ${caseNumber}).`,
      read: false,
      createdAt: new Date()
    });
  } catch (error) {
    handleError(error, "submitApplication");
  }
};

export const createNotification = async (userId, title, message) => {
  try {
    const notifRef = collection(db, "notifications");
    await addDoc(notifRef, {
      userId,
      title,
      message,
      read: false,
      createdAt: new Date()
    });
  } catch (error) {
    handleError(error, "createNotification");
  }
};

export const getNotifications = (userId, callback) => {
  try {
    const notifRef = collection(db, "notifications");
    const q = query(notifRef, where("userId", "==", userId));
    return onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      list.sort((a, b) => {
        const dateA = a.createdAt?.seconds ? new Date(a.createdAt.seconds * 1000) : new Date(a.createdAt || 0);
        const dateB = b.createdAt?.seconds ? new Date(b.createdAt.seconds * 1000) : new Date(b.createdAt || 0);
        return dateB - dateA;
      });
      callback(list);
    }, (error) => {
      console.error("Notifications listener error:", error);
    });
  } catch (error) {
    handleError(error, "getNotifications");
  }
};

export const markNotificationRead = async (id) => {
  try {
    const docRef = doc(db, "notifications", id);
    await updateDoc(docRef, { read: true });
  } catch (error) {
    handleError(error, "markNotificationRead");
  }
};

export const markAllNotificationsRead = async (userId) => {
  try {
    const notifRef = collection(db, "notifications");
    const q = query(notifRef, where("userId", "==", userId), where("read", "==", false));
    const snapshot = await getDocs(q);
    const batch = writeBatch(db);
    snapshot.docs.forEach(doc => {
      batch.update(doc.ref, { read: true });
    });
    await batch.commit();
  } catch (error) {
    handleError(error, "markAllNotificationsRead");
  }
};

