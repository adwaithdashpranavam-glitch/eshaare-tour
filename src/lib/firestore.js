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
import { db, auth, functions, httpsCallable } from "./firebase";
export { db, auth };
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
    const submitLeadFn = httpsCallable(functions, "submitLead");
    const result = await submitLeadFn({
      contactName: data.contactName || data.name || "",
      contactEmail: data.contactEmail || data.email || "",
      contactPhone: data.contactPhone || data.phone || "",
      destinationCountry: data.destinationCountry || data.country || "",
      serviceType: data.serviceType || "Visa",
      notes: data.notes || data.message || "",
      honeypot: data.honeypot || ""
    });
    return result.data.id;
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
    metaDescription: "Apply for Schengen visa in Dubai with expert support. VFS slot booking, document audit, and 98% success rate. Contact Eshaare Tours today.",
    popularDestinations: [
      { name: "France", slug: "france", imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuDmYNWDGDWMTVATuipLHpe97IxxUEIo_YwDJHHHFhud_XEn_m8ODtErhTGfUXyFNh5bEW8EGM8u10CesgxBUAXdMc2z5mlY0KsS4OO6ckjXgMHnkQ6E9THR-gSTbBwtK8FYm0s8n4156PFfIonOtcbp3uUlAhzvlpwnlbhJkydBoKJ0WvIlu7-Y_R0CiTsCnlsTgkf5rh5mQSxHAs83pmsBEu_fb3XRWt4LJXIrDKFGshMc4XxsZ7FqXG8LNBtsOZGHYbdphAeKhbA" },
      { name: "Italy", slug: "italy", imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuDzAOi0Aj0u8aY4kBNSMthGU5SsqvcU6B0rLy2Ms8-Bz0JMpSOmUUFjbRe1s_L_7RGIOPq0ZaM7IIk8iZeSOzMiMFxKaqGrolpVbnXXRzBhcFpG9X8q4robImyaXDJnu4Zt4-7Dlut0js2t5T0msX96LXXkQ5RH4LbkyJ5IhOqodY7bJkuzR1AGErX51s1svodAznliewfQ5AZTt89eDLlKiEPDRhFvsktc8W_YcT_bASCC2DkwuhO3Dcyl9ziRxFdJKWZGDWwpVh4" },
      { name: "Switzerland", slug: "switzerland", imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuBu9KB76iwfBlS5Bij8R9O-skh7Ql5QOc3PZRGu_C0Cyrc8HlWudemG6hHFtDp9wElyBCxdmFpse9B1mk-s7ackGGJnH9lbYTNr_DfEZJdAsQ4OBTdh-T-4v-CiJvxBvbUXafq95fmCUdrgwAeMlDhVx6u0ZRqMgwGxZA6Y2WrOPA_F1sD9SmP962oZQm1-eMEGUzhVgtPHl4UWB2KEFlxSF-ou1t7y6j2bm4SWbzuOnKRUAGVSHWvZpVIrumvssEW9QhmgU2uZiyI" },
      { name: "Germany", slug: "germany", imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuAEKbJi_fvHz3xNsLEWUDIBE6FSTnachmrBgRTsQlXg01noaPfxRtoxCi2bVbM4EmMaCTBq5uJvgbaw7aKu8MwDcWyFBReE_Z0tWJiru-nRImPxSq-JdrnpahzFKqqFbw32rZ9WIZbC6pTRmOfxIPL3C93N-8uWX5bqfd5CxaxguecE1djT2NJCjJszjcoGjFhzKg9k95zz1XVg6phjIIIywBHZvnshG8Oh8Lv1vAnrKhT68yRXtejp3NGCbyVIfIw_EWO9L7BlVdI" }
    ]
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
  },
  {
    slug: "france",
    imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuDmYNWDGDWMTVATuipLHpe97IxxUEIo_YwDJHHHFhud_XEn_m8ODtErhTGfUXyFNh5bEW8EGM8u10CesgxBUAXdMc2z5mlY0KsS4OO6ckjXgMHnkQ6E9THR-gSTbBwtK8FYm0s8n4156PFfIonOtcbp3uUlAhzvlpwnlbhJkydBoKJ0WvIlu7-Y_R0CiTsCnlsTgkf5rh5mQSxHAs83pmsBEu_fb3XRWt4LJXIrDKFGshMc4XxsZ7FqXG8LNBtsOZGHYbdphAeKhbA",
    name: "France Schengen Visa",
    tagline: "Expert document preparation and VFS slot assistance for France",
    isPublished: true,
    sortOrder: 6,
    heroStats: [
      { label: "Processing Time", value: "10-15 Days", icon: "Clock" },
      { label: "Success Rate", value: "98.9%", icon: "TrendingUp" },
      { label: "Required Documents", value: "5 Core Docs", icon: "FileText" },
      { label: "Embassy Appointment", value: "VFS Global Dubai", icon: "Calendar" }
    ],
    overviewText: "Apply for your France tourist or business visa with Eshaare Tours. As one of the most popular Schengen destinations, securing appointments at the French consulate in WAFI Mall Dubai requires diligent slot tracking. We audit your employment contracts, bank transactions, and construct compliant itineraries for your French journey.",
    suitableFor: ["Tourism", "Family Visit", "Business", "Trade Shows", "Training", "Medical"],
    visaSpecs: {
      visaType: "Tourist Visa",
      validity: "Up to 90 Days",
      entryType: "Single / Multiple",
      processingTime: "10–15 Working Days",
      biometrics: "Required",
      insurance: "Mandatory",
      category: "Schengen Visa"
    },
    groupedDocuments: {
      personal: [
        "Original Passport",
        "Passport Copy",
        "UAE Residence Visa Copy",
        "Emirates ID Copy"
      ],
      financial: [
        "6 Months Bank Statement",
        "Salary Certificate / NOC"
      ],
      travel: [
        "Flight & Hotel Reservation",
        "Mandatory Travel Insurance",
        "Detailed Itinerary"
      ]
    },
    popularLocations: [
      { name: "Paris", imageUrl: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=500&q=80" },
      { name: "Nice", imageUrl: "https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=500&q=80" },
      { name: "Lyon", imageUrl: "https://images.unsplash.com/photo-1509840841025-9088ba78a826?auto=format&fit=crop&w=500&q=80" }
    ],
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
      { stepNumber: 1, title: "Submit Details & NOC Checklist", description: "Provide passport copy and complete travel questionnaire." },
      { stepNumber: 2, title: "Compliance Audit Check", description: "Our senior visa executives verify bank statement transactions, passport validity, and photo dimensions." },
      { stepNumber: 3, title: "VFS Slot Booking & Submission", description: "We secure an appointment slot at VFS Dubai/Abu Dhabi, compile your document dossier, and accompany you." },
      { stepNumber: 4, title: "Visa Approved & Delivery", description: "Receive your passport back with your approved French Schengen sticker." }
    ],
    feeStructure: [
      { applicantType: "Adult (12+ years)", embassyFee: "320 AED (€80)", serviceFee: "280 AED" },
      { applicantType: "Child (6-12 years)", embassyFee: "160 AED (€40)", serviceFee: "280 AED" }
    ],
    faqs: [
      { question: "How long does French processing take?", answer: "Typically 10-15 working days post-submission." }
    ],
    metaTitle: "France Visa Dubai | Schengen Visa Specialists | Eshaare Tours",
    metaDescription: "Apply for France Schengen visa in Dubai with expert support. VFS slot booking and document compliance audits."
  },
  {
    slug: "italy",
    imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuB7k3xVjDUTCz1ZQqypUZEBJaosXgXI7xD4SonoP-9ruQzxuDUI41TdwEpEZnrKEPSa2z1aQisaYk6t8rTtnvHxy6IsViNu6yzyIDihv-UcrI3YXLm4NpkuzmNDqWmzq5JbfIT-ySPk1Kr3U4cy2Qk41JvuCtpg3YasivtKKvgnwyl64cH9F03hy678mFIG17as2c9T7L5ntCw7i-U_XQ2RZ989WhMR_TpgyJhTXXQ8iiDM0b8Esa0WwDj6EqScS0_PYwaMJW7WMF0",
    name: "Italy Schengen Visa",
    tagline: "Fast-track Schengen visa processing for Italy from Dubai",
    isPublished: true,
    sortOrder: 7,
    heroStats: [
      { label: "Processing Time", value: "15-30 Days", icon: "Clock" },
      { label: "Success Rate", value: "98.5%", icon: "TrendingUp" },
      { label: "Required Documents", value: "5 Core Docs", icon: "FileText" },
      { label: "Embassy Appointment", value: "VFS Global Dubai", icon: "Calendar" }
    ],
    overviewText: "Travel to Rome, Milan, Venice, or the Amalfi coast. Applying for an Italian Schengen visa involves submitting your biometrics at VFS Global in Dubai or Abu Dhabi. Eshaare Tours ensures that your medical insurance, flight bookings, and hotel vouchers are embassy-compliant.",
    suitableFor: ["Tourism", "Family Visit", "Business", "Trade Shows", "Training", "Medical"],
    visaSpecs: {
      visaType: "Tourist Visa",
      validity: "Up to 90 Days",
      entryType: "Single / Multiple",
      processingTime: "15–30 Working Days",
      biometrics: "Required",
      insurance: "Mandatory",
      category: "Schengen Visa"
    },
    groupedDocuments: {
      personal: [
        "Original Passport",
        "Passport Copy",
        "UAE Residence Visa Copy",
        "Emirates ID Copy"
      ],
      financial: [
        "6 Months Bank Statement",
        "Salary Certificate / NOC"
      ],
      travel: [
        "Flight & Hotel Reservation",
        "Mandatory Travel Insurance",
        "Detailed Itinerary"
      ]
    },
    popularLocations: [
      { name: "Venice", imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuDh4a9KR0hn2bOKJkxHmx_li3Hp_xX6s-jC9aqI7iENk_W5M5xrWyrQlF3Xc2I19To0GdBmmB0k6UJvyqg5104ODakqmc3Al8MxTZUvyXLI9s94ce5J9J7FEFtFlesllp9HP2NVFbKAkmvD-PTn_dMC58Z_6TVYdklXdF3wY5ZzLDIlqQ-erHw5B85wlEc4J0eYZ4Km7tA3Svfjh4HWgxnPt3b8TsLe2_UQFpnixWQiBOKqQR1veTxadJ_HwnMyoPBtxB9eDUuRSUo" },
      { name: "Milan", imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuCb-r56Z2q2SN8CWdddakMDEUsMQOzNYmLY61lLMZc32les1yUFERaDVI4fldc6NVcOO8OoYwLcsK8T9foobWy31sJ-lKcx-d9Vd2PhLExIxqLCqnOpL_DWyJbsMfBF1M-NXWGnDOGWDrV4HjlA99Ytjqc8_XagDnugh5tCxhX1qkinsKmws0w3jt1F7van49WxAkcDIbsK4fKjH1Nyqjk8YIiQRIXcrnWESZqjdLDOmBv8NVTdtuUluHOJJinJ337zv1ncu-JS0no" },
      { name: "Florence", imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuAcjduxh2RMLt2MYONAc8jYJknUY9sy2mxB0_a4XncZkVFrQz2ClzKqLQlztPVzl7TE5NBbRUr_cyJaoaY5pllP5sYi2BwTTXBPGy3jk8oCtPqgfPeajTBO4jEyAqHZdDIOeQckNwnjqegcWpELK7vkqgq_AR6EIOUMGuHr1M-9uNrhN78AXdSvwCKRmGSHjCkD7Bp4R_9nNa5EPy35bWmySMvvoMWQjiMuxMWxeAVTQWvVii5uTvnz_BegOO_Eh5zcbE0eXamzdaM" }
    ],
    requiredDocuments: [
      "Passport valid for at least 6 months",
      "UAE residence visa copy",
      "Passport photos",
      "3-6 months bank statements showing regular income",
      "Employer NOC or business setup papers",
      "Travel insurance compliant with Schengen rules"
    ],
    processSteps: [
      { stepNumber: 1, title: "Submit Details & NOC Checklist", description: "Provide passport copy and complete travel questionnaire." },
      { stepNumber: 2, title: "Compliance Audit Check", description: "Our senior visa executives verify bank statement transactions, passport validity, and photo dimensions." },
      { stepNumber: 3, title: "VFS Slot Booking & Submission", description: "We secure an appointment slot at VFS Dubai/Abu Dhabi, compile your document dossier, and accompany you." },
      { stepNumber: 4, title: "Visa Approved & Delivery", description: "Receive your passport back with your approved Italian Schengen sticker." }
    ],
    feeStructure: [
      { applicantType: "Adult (12+ years)", embassyFee: "320 AED (€80)", serviceFee: "280 AED" },
      { applicantType: "Child (6-12 years)", embassyFee: "160 AED (€40)", serviceFee: "280 AED" }
    ],
    faqs: [
      { question: "How long does Italian processing take?", answer: "Typically 12-15 working days post-submission." }
    ],
    metaTitle: "Italy Visa Dubai | Schengen Visa Specialists | Eshaare Tours",
    metaDescription: "Apply for Italy Schengen visa in Dubai with expert support. VFS slot booking and document compliance audits."
  },
  {
    slug: "switzerland",
    imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuBu9KB76iwfBlS5Bij8R9O-skh7Ql5QOc3PZRGu_C0Cyrc8HlWudemG6hHFtDp9wElyBCxdmFpse9B1mk-s7ackGGJnH9lbYTNr_DfEZJdAsQ4OBTdh-T-4v-CiJvxBvbUXafq95fmCUdrgwAeMlDhVx6u0ZRqMgwGxZA6Y2WrOPA_F1sD9SmP962oZQm1-eMEGUzhVgtPHl4UWB2KEFlxSF-ou1t7y6j2bm4SWbzuOnKRUAGVSHWvZpVIrumvssEW9QhmgU2uZiyI",
    name: "Switzerland Schengen Visa",
    tagline: "Complete Swiss visa application and document guidance from Dubai",
    isPublished: true,
    sortOrder: 8,
    heroStats: [
      { label: "Processing Time", value: "10-15 Days", icon: "Clock" },
      { label: "Success Rate", value: "99.1%", icon: "TrendingUp" },
      { label: "Required Documents", value: "5 Core Docs", icon: "FileText" },
      { label: "Embassy Appointment", value: "VFS Global Dubai", icon: "Calendar" }
    ],
    overviewText: "Securing a Swiss tourist visa requires precise proof of itinerary and accommodation across the Alps. Eshaare Tours coordinates your flight vouchers, hotel bookings, and NOC employer letters, submitting to VFS Global for rapid Swiss embassy approvals.",
    suitableFor: ["Tourism", "Family Visit", "Business", "Trade Shows", "Training", "Medical"],
    visaSpecs: {
      visaType: "Tourist Visa",
      validity: "Up to 90 Days",
      entryType: "Single / Multiple",
      processingTime: "10–15 Working Days",
      biometrics: "Required",
      insurance: "Mandatory",
      category: "Schengen Visa"
    },
    groupedDocuments: {
      personal: [
        "Original Passport",
        "Passport Copy",
        "UAE Residence Visa Copy",
        "Emirates ID Copy"
      ],
      financial: [
        "6 Months Bank Statement",
        "Salary Certificate / NOC"
      ],
      travel: [
        "Flight & Hotel Reservation",
        "Mandatory Travel Insurance",
        "Detailed Itinerary"
      ]
    },
    popularLocations: [
      { name: "Zurich", imageUrl: "https://images.unsplash.com/photo-1515488042361-404e9250afef?auto=format&fit=crop&w=500&q=80" },
      { name: "Geneva", imageUrl: "https://images.unsplash.com/photo-1581084282500-1c09930f7850?auto=format&fit=crop&w=500&q=80" },
      { name: "Interlaken", imageUrl: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=500&q=80" }
    ],
    requiredDocuments: [
      "Passport valid for at least 6 months",
      "UAE residence visa copy",
      "Passport photos",
      "3-6 months bank statements showing regular income",
      "Employer NOC or business setup papers",
      "Travel insurance compliant with Schengen rules"
    ],
    processSteps: [
      { stepNumber: 1, title: "Submit Details & NOC Checklist", description: "Provide passport copy and complete travel questionnaire." },
      { stepNumber: 2, title: "Compliance Audit Check", description: "Our senior visa executives verify bank statement transactions, passport validity, and photo dimensions." },
      { stepNumber: 3, title: "VFS Slot Booking & Submission", description: "We secure an appointment slot at VFS Dubai/Abu Dhabi, compile your document dossier, and accompany you." },
      { stepNumber: 4, title: "Visa Approved & Delivery", description: "Receive your passport back with your approved Swiss Schengen sticker." }
    ],
    feeStructure: [
      { applicantType: "Adult (12+ years)", embassyFee: "320 AED (€80)", serviceFee: "280 AED" },
      { applicantType: "Child (6-12 years)", embassyFee: "160 AED (€40)", serviceFee: "280 AED" }
    ],
    faqs: [
      { question: "How long does Swiss processing take?", answer: "Typically 8-12 working days post-submission." }
    ],
    metaTitle: "Switzerland Visa Dubai | Schengen Visa Specialists | Eshaare Tours",
    metaDescription: "Apply for Swiss Schengen visa in Dubai with expert support. VFS slot booking and document compliance audits."
  },
  {
    slug: "germany",
    imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuAEKbJi_fvHz3xNsLEWUDIBE6FSTnachmrBgRTsQlXg01noaPfxRtoxCi2bVbM4EmMaCTBq5uJvgbaw7aKu8MwDcWyFBReE_Z0tWJiru-nRImPxSq-JdrnpahzFKqqFbw32rZ9WIZbC6pTRmOfxIPL3C93N-8uWX5bqfd5CxaxguecE1djT2NJCjJszjcoGjFhzKg9k95zz1XVg6phjIIIywBHZvnshG8Oh8Lv1vAnrKhT68yRXtejp3NGCbyVIfIw_EWO9L7BlVdI",
    name: "Germany Schengen Visa",
    tagline: "Expert document check and appointment assistance for Germany",
    isPublished: true,
    sortOrder: 9,
    heroStats: [
      { label: "Processing Time", value: "15-20 Days", icon: "Clock" },
      { label: "Success Rate", value: "98.0%", icon: "TrendingUp" },
      { label: "Required Documents", value: "5 Core Docs", icon: "FileText" },
      { label: "Embassy Appointment", value: "VFS Global Dubai", icon: "Calendar" }
    ],
    overviewText: "Applying for a German Schengen Visa is a highly structured process. The German Consulate in Dubai maintains strict document audit guidelines. Eshaare Tours verifies that your travel history, bank statements, and cover letters are perfect before submission.",
    suitableFor: ["Tourism", "Family Visit", "Business", "Trade Shows", "Training", "Medical"],
    visaSpecs: {
      visaType: "Tourist Visa",
      validity: "Up to 90 Days",
      entryType: "Single / Multiple",
      processingTime: "15–20 Working Days",
      biometrics: "Required",
      insurance: "Mandatory",
      category: "Schengen Visa"
    },
    groupedDocuments: {
      personal: [
        "Original Passport",
        "Passport Copy",
        "UAE Residence Visa Copy",
        "Emirates ID Copy"
      ],
      financial: [
        "6 Months Bank Statement",
        "Salary Certificate / NOC"
      ],
      travel: [
        "Flight & Hotel Reservation",
        "Mandatory Travel Insurance",
        "Detailed Itinerary"
      ]
    },
    popularLocations: [
      { name: "Berlin", imageUrl: "https://images.unsplash.com/photo-1599946347371-68eb71b16afc?auto=format&fit=crop&w=500&q=80" },
      { name: "Munich", imageUrl: "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&w=500&q=80" },
      { name: "Frankfurt", imageUrl: "https://images.unsplash.com/photo-1541746972996-4e0b0f43e01a?auto=format&fit=crop&w=500&q=80" }
    ],
    requiredDocuments: [
      "Passport valid for at least 6 months",
      "UAE residence visa copy",
      "Passport photos",
      "3-6 months bank statements showing regular income",
      "Employer NOC or business setup papers",
      "Travel insurance compliant with Schengen rules"
    ],
    processSteps: [
      { stepNumber: 1, title: "Submit Details & NOC Checklist", description: "Provide passport copy and complete travel questionnaire." },
      { stepNumber: 2, title: "Compliance Audit Check", description: "Our senior visa executives verify bank statement transactions, passport validity, and photo dimensions." },
      { stepNumber: 3, title: "VFS Slot Booking & Submission", description: "We secure an appointment slot at VFS Dubai/Abu Dhabi, compile your document dossier, and accompany you." },
      { stepNumber: 4, title: "Visa Approved & Delivery", description: "Receive your passport back with your approved German Schengen sticker." }
    ],
    feeStructure: [
      { applicantType: "Adult (12+ years)", embassyFee: "320 AED (€80)", serviceFee: "280 AED" },
      { applicantType: "Child (6-12 years)", embassyFee: "160 AED (€40)", serviceFee: "280 AED" }
    ],
    faqs: [
      { question: "How long does German processing take?", answer: "Typically 10-15 working days post-submission." }
    ],
    metaTitle: "Germany Visa Dubai | Schengen Visa Specialists | Eshaare Tours",
    metaDescription: "Apply for Germany Schengen visa in Dubai with expert support. VFS slot booking and document compliance audits."
  },
  {
    slug: "oman",
    imageUrl: "https://images.unsplash.com/photo-1621680696874-edd80ce57b72?auto=format&fit=crop&w=800&q=80",
    name: "Oman Visa",
    tagline: "Transit and tourist eVisas for road or air travelers from the UAE",
    isPublished: true,
    sortOrder: 10,
    heroStats: [
      { label: "Processing Time", value: "1-2 Days", icon: "Clock" },
      { label: "Success Rate", value: "99.8%", icon: "TrendingUp" },
      { label: "Required Documents", value: "3 Core Docs", icon: "FileText" },
      { label: "Submission Type", value: "100% Online", icon: "Globe" }
    ],
    overviewText: "Apply for your Oman tourist eVisa with Eshaare Tours. For UAE residents traveling to Muscat, Salalah, or driving through the Hatta border, we handle the entire eVisa application. We ensure your passport copies, residency cards, and personal photographs meet the Royal Oman Police requirements for instant approval.",
    suitableFor: ["Tourism", "Family Visit", "Business"],
    visaSpecs: {
      visaType: "eVisa / Tourist",
      validity: "10 or 30 Days",
      entryType: "Single Entry",
      processingTime: "1–2 Days",
      biometrics: "Not Required",
      insurance: "Recommended",
      category: "GCC / Middle East Visa"
    },
    groupedDocuments: {
      personal: [
        "Passport Scan (Bio page)",
        "UAE Residency Copy",
        "Emirates ID Copy"
      ],
      financial: [
        "Not Required for eVisa"
      ],
      travel: [
        "Passport Photo (White background)",
        "Border Crossing Details (if driving)"
      ]
    },
    popularLocations: [
      { name: "Muscat", imageUrl: "https://images.unsplash.com/photo-1609137144813-881c1c1f4640?auto=format&fit=crop&w=500&q=80" },
      { name: "Salalah", imageUrl: "https://images.unsplash.com/photo-1601919051950-bb9f3ff4dfee?auto=format&fit=crop&w=500&q=80" },
      { name: "Nizwa", imageUrl: "https://images.unsplash.com/photo-1549880338-65ddcdfd017b?auto=format&fit=crop&w=500&q=80" }
    ],
    requiredDocuments: [
      "Passport copy (minimum 6 months validity)",
      "UAE residency visa page copy (minimum 3 months validity)",
      "Passport-sized photograph with white background"
    ],
    processSteps: [
      { stepNumber: 1, title: "Submit Details & Photos", description: "Provide passport copy and personal photo through our secure client dashboard." },
      { stepNumber: 2, title: "Expert Document Audit", description: "Our team verifies photo dimensions, background specifications, and residency validity." },
      { stepNumber: 3, title: "Royal Oman Police Portal Submission", description: "We execute your eVisa submission directly through the official immigration gateway." },
      { stepNumber: 4, title: "eVisa Approved & Sent", description: "Track return updates. Your approved PDF eVisa is sent straight to your email or WhatsApp." }
    ],
    feeStructure: [
      { applicantType: "10-Day Single Entry", embassyFee: "100 AED", serviceFee: "100 AED" },
      { applicantType: "30-Day Single Entry", embassyFee: "250 AED", serviceFee: "100 AED" }
    ],
    faqs: [
      { question: "Do UAE residents get visa on arrival in Oman?", answer: "While some professions get visa on arrival, it is highly recommended to apply for an eVisa in advance to avoid long border queues or boarding issues." },
      { question: "How long does Oman eVisa take?", answer: "Oman eVisas are usually approved within 24 to 48 hours." }
    ],
    metaTitle: "Oman eVisa Dubai | Eshaare Tours",
    metaDescription: "Apply for Oman tourist visa in Dubai. 24-48 hour fast processing and 99.8% success rate."
  },
  {
    slug: "japan",
    imageUrl: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80",
    name: "Japan Visa",
    tagline: "Short-stay tourist visa assistance including travel plan and reservation compliance",
    isPublished: true,
    sortOrder: 11,
    heroStats: [
      { label: "Processing Time", value: "5-7 Days", icon: "Clock" },
      { label: "Success Rate", value: "98.7%", icon: "TrendingUp" },
      { label: "Required Documents", value: "5 Core Docs", icon: "FileText" },
      { label: "Submission Type", value: "eVisa / VFS", icon: "Calendar" }
    ],
    overviewText: "Apply for your Japan tourist or business visa with Eshaare Tours. Japan offers either electronic eVisa or standard sticker visas depending on applicant nationality and UAE residency profile. We prepare a detailed day-by-day travel itinerary (Schedule of Stay), confirm compliant bookings, and manage the submission to ensure a successful outcome.",
    suitableFor: ["Tourism", "Business", "Family Visit"],
    visaSpecs: {
      visaType: "Tourist / Short Stay",
      validity: "Up to 90 Days",
      entryType: "Single or Multiple",
      processingTime: "5–7 Working Days",
      biometrics: "Required for Sticker",
      insurance: "Recommended",
      category: "Asia Visa"
    },
    groupedDocuments: {
      personal: [
        "Original Passport",
        "Emirates ID Copy",
        "UAE Residency Copy",
        "Passport Photo (2x2 inches)"
      ],
      financial: [
        "3 Months Bank Statement (Stamped)",
        "NOC from Employer (Salary, Job Title)"
      ],
      travel: [
        "Flight Reservation (Return)",
        "Hotel Booking Confirmation",
        "Day-by-Day Travel Plan (Schedule of Stay)"
      ]
    },
    popularLocations: [
      { name: "Tokyo", imageUrl: "https://images.unsplash.com/photo-1540959733332-eab4deceeaf7?auto=format&fit=crop&w=500&q=80" },
      { name: "Kyoto", imageUrl: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=500&q=80" },
      { name: "Osaka", imageUrl: "https://images.unsplash.com/photo-1590253509399-00550f588523?auto=format&fit=crop&w=500&q=80" }
    ],
    requiredDocuments: [
      "Original Passport valid for at least 6 months",
      "Copy of UAE Residency Visa and Emirates ID",
      "3 months bank statement with original bank stamp",
      "No Objection Certificate (NOC) from UAE employer",
      "Detailed travel itinerary (Schedule of Stay)"
    ],
    processSteps: [
      { stepNumber: 1, title: "Intake & Profile Audit", description: "Review passenger background, passport validity, and financial transaction sheets." },
      { stepNumber: 2, title: "Drafting 'Schedule of Stay'", description: "Create a detailed day-by-day activity itinerary, required by the Japanese embassy." },
      { stepNumber: 3, title: "VFS / eVisa Submission", description: "Manage official submission and book biometrics appointment at VFS Dubai if needed." },
      { stepNumber: 4, title: "Approved Sticker/eVisa Delivery", description: "Receive passport back with approved Japanese visa or download approved eVisa PDF." }
    ],
    feeStructure: [
      { applicantType: "Single Entry Tourist", embassyFee: "100 AED", serviceFee: "200 AED" },
      { applicantType: "Multiple Entry Tourist", embassyFee: "200 AED", serviceFee: "250 AED" }
    ],
    faqs: [
      { question: "Can Indian nationals in UAE apply for Japan eVisa?", answer: "Yes, Indian nationals holding valid UAE residency can apply for the Japan eVisa online through our guided portal." },
      { question: "What is a 'Schedule of Stay' for Japan?", answer: "A mandatory document listing your day-by-day activities, accommodation details, and contact numbers in Japan. We draft this for you." }
    ],
    metaTitle: "Japan Tourist Visa Dubai | Eshaare Tours",
    metaDescription: "Apply for Japan tourist visa in Dubai. eVisa or VFS processing with detailed Schedule of Stay auditing."
  },
  {
    slug: "korea",
    imageUrl: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=800&q=80",
    name: "South Korea Visa",
    tagline: "Tourist visas and K-ETA application check-ins for UAE residents",
    isPublished: true,
    sortOrder: 12,
    heroStats: [
      { label: "Processing Time", value: "7-10 Days", icon: "Clock" },
      { label: "Success Rate", value: "96.2%", icon: "TrendingUp" },
      { label: "Required Documents", value: "5 Core Docs", icon: "FileText" },
      { label: "Submission Type", value: "KVAC Dubai / eVisa", icon: "Calendar" }
    ],
    overviewText: "Apply for your South Korea visitor visa with Eshaare Tours. Visas for South Korea are processed via the Korea Visa Application Center (KVAC) in Dubai. We audit your employment verification, salary history, bank statements, and complete the detailed K-ETA or visa application forms to meet the Korean consulate's strict standards.",
    suitableFor: ["Tourism", "Business", "Family Visit"],
    visaSpecs: {
      visaType: "Visitor / Tourist",
      validity: "Up to 90 Days",
      entryType: "Single Entry",
      processingTime: "7–10 Days",
      biometrics: "Not Required",
      insurance: "Recommended",
      category: "Asia Visa"
    },
    groupedDocuments: {
      personal: [
        "Original passport",
        "UAE Residency copy",
        "Emirates ID copy",
        "Passport Photo (3.5x4.5cm)"
      ],
      financial: [
        "3-6 Months bank statement (Stamped)",
        "NOC from Employer"
      ],
      travel: [
        "Hotel booking confirmation",
        "Flight Reservation (Return)",
        "Daily Travel Itinerary"
      ]
    },
    popularLocations: [
      { name: "Seoul", imageUrl: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=500&q=80" },
      { name: "Busan", imageUrl: "https://images.unsplash.com/photo-1608670868840-7e44ab6708f5?auto=format&fit=crop&w=500&q=80" },
      { name: "Jeju Island", imageUrl: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=500&q=80" }
    ],
    requiredDocuments: [
      "Original passport with 6 months validity",
      "UAE residency visa and Emirates ID copy",
      "Certificate of Employment / NOC stating job title and salary",
      "3-6 months bank statement (original bank stamp)",
      "Hotel booking confirmation and daily travel plan"
    ],
    processSteps: [
      { stepNumber: 1, title: "Profile Screening", description: "Review applicant nationality, UAE visa details, and bank statements." },
      { stepNumber: 2, title: "Korea Visa Form Preparation", description: "Complete the comprehensive multi-page KVAC application form." },
      { stepNumber: 3, title: "KVAC Dossier Submission", description: "Submit documents to KVAC Dubai and pay the administrative fees." },
      { stepNumber: 4, title: "Visa Grant Notification", description: "Receive passport with Korea entry visa sticker." }
    ],
    feeStructure: [
      { applicantType: "Short Term Single Entry (under 90 days)", embassyFee: "150 AED", serviceFee: "250 AED" },
      { applicantType: "KVAC Handling Fee", embassyFee: "60 AED", serviceFee: "0 AED" }
    ],
    faqs: [
      { question: "Do I need a K-ETA or a regular Visa?", answer: "Passport holders of visa-exempt countries need a K-ETA. Other nationalities must apply for a regular tourist visa at KVAC. We assist with both." }
    ],
    metaTitle: "South Korea Visa Dubai | KVAC Specialists | Eshaare Tours",
    metaDescription: "Apply for South Korea tourist visa in Dubai via KVAC or K-ETA with expert document auditing."
  },
  {
    slug: "vietnam",
    imageUrl: "https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=800&q=80",
    name: "Vietnam Visa",
    tagline: "Fast-track approval letters and tourist eVisas handled within 72 hours",
    isPublished: true,
    sortOrder: 13,
    heroStats: [
      { label: "Processing Time", value: "3-4 Days", icon: "Clock" },
      { label: "Success Rate", value: "99.0%", icon: "TrendingUp" },
      { label: "Required Documents", value: "3 Core Docs", icon: "FileText" },
      { label: "Submission Type", value: "100% Online", icon: "Globe" }
    ],
    overviewText: "Apply for your Vietnam tourist eVisa with Eshaare Tours. Vietnam has expanded its online eVisa facility to all nationalities, allowing up to 90 days stay. We audit your passport details, photo dimensions, entry/exit ports, and process the visa through the immigration department to ensure complete accuracy.",
    suitableFor: ["Tourism", "Business"],
    visaSpecs: {
      visaType: "eVisa / Tourist",
      validity: "30 or 90 Days",
      entryType: "Single / Multiple",
      processingTime: "3–4 Working Days",
      biometrics: "Not Required",
      insurance: "Recommended",
      category: "Asia Visa"
    },
    groupedDocuments: {
      personal: [
        "Passport Bio Page Photo",
        "Portrait Photo (4x6 cm)"
      ],
      financial: [
        "Not Required for eVisa"
      ],
      travel: [
        "Entry Port details (Airport/Land)",
        "Exit Port details"
      ]
    },
    popularLocations: [
      { name: "Hanoi", imageUrl: "https://images.unsplash.com/photo-1509060464153-44667396260f?auto=format&fit=crop&w=500&q=80" },
      { name: "Halong Bay", imageUrl: "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=500&q=80" },
      { name: "Ho Chi Minh", imageUrl: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=500&q=80" }
    ],
    requiredDocuments: [
      "High-quality passport bio page photo (valid for 6+ months)",
      "Portrait photo (4x6 cm, white background, no glasses)",
      "Proposed entry and exit ports in Vietnam"
    ],
    processSteps: [
      { stepNumber: 1, title: "Submit Digital Files", description: "Upload a clean scan of your passport bio page and passport photograph." },
      { stepNumber: 2, title: "Port & Itinerary Check", description: "Audit chosen land border checkpoints or airports to prevent entry refusal." },
      { stepNumber: 3, title: "Vietnam Immigration Submission", description: "File the eVisa request on the Vietnam immigration platform." },
      { stepNumber: 4, title: "eVisa Receipt", description: "Receive your approved Vietnam eVisa PDF to print for immigration clearance." }
    ],
    feeStructure: [
      { applicantType: "30-Day Single Entry eVisa", embassyFee: "100 AED", serviceFee: "120 AED" },
      { applicantType: "90-Day Multiple Entry eVisa", embassyFee: "200 AED", serviceFee: "150 AED" }
    ],
    faqs: [
      { question: "How long does a Vietnam eVisa take?", answer: "Normally 3-4 working days. Express service is available for urgent travel." }
    ],
    metaTitle: "Vietnam eVisa Dubai | Eshaare Tours",
    metaDescription: "Apply for Vietnam eVisa online from Dubai. Express service options and 99% approval rating."
  },
  {
    slug: "australia",
    imageUrl: "https://images.unsplash.com/photo-1524413840807-0c3cb6fa808d?auto=format&fit=crop&w=800&q=80",
    name: "Australia Visa",
    tagline: "Visitor Visa (Subclass 600) audits for multi-entry tourism or business trips",
    isPublished: true,
    sortOrder: 14,
    heroStats: [
      { label: "Processing Time", value: "15-20 Days", icon: "Clock" },
      { label: "Success Rate", value: "95.5%", icon: "TrendingUp" },
      { label: "Required Documents", value: "6 Core Docs", icon: "FileText" },
      { label: "Submission Type", value: "ImmiAccount Online", icon: "Globe" }
    ],
    overviewText: "Apply for your Australia Subclass 600 Visitor Visa with Eshaare Tours. Australia requires a highly detailed online submission through the Department of Home Affairs ImmiAccount portal. We audit and translate your financial holdings, employment history, assets, and tie-backs to the UAE to build a robust visa application.",
    suitableFor: ["Tourism", "Business", "Family Visit"],
    visaSpecs: {
      visaType: "Visitor (Subclass 600)",
      validity: "Up to 12 Months",
      entryType: "Single or Multiple",
      processingTime: "15–20 Days",
      biometrics: "Required at VFS",
      insurance: "Recommended",
      category: "Oceania Visa"
    },
    groupedDocuments: {
      personal: [
        "Passport Color Scan (All pages)",
        "UAE Residency & Emirates ID",
        "Family Registration documents (if any)"
      ],
      financial: [
        "6 Months bank statement showing regular income",
        "NOC from employer / Business License",
        "Proof of Assets or Properties (optional)"
      ],
      travel: [
        "Detailed Day-by-Day Itinerary",
        "Flight/Hotel Vouchers"
      ]
    },
    popularLocations: [
      { name: "Sydney", imageUrl: "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=500&q=80" },
      { name: "Melbourne", imageUrl: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=500&q=80" },
      { name: "Brisbane", imageUrl: "https://images.unsplash.com/photo-1554797078-97a366e25757?auto=format&fit=crop&w=500&q=80" }
    ],
    requiredDocuments: [
      "Scan of passport bio-page and all stamped pages",
      "UAE residency visa and Emirates ID scans",
      "NOC from employer showing salary, designation, and approved leave",
      "6 months personal bank statements with solid credit profile",
      "Detailed itinerary and flight details"
    ],
    processSteps: [
      { stepNumber: 1, title: "Dossier Screening", description: "Gather comprehensive financial, employment, and personal ties documentation." },
      { stepNumber: 2, title: "ImmiAccount File Creation", description: "Formulate the extensive Australian visitor visa profile questionnaire." },
      { stepNumber: 3, title: "Biometrics Appointment", description: "Book and complete biometrics capture at VFS Global Dubai/Abu Dhabi." },
      { stepNumber: 4, title: "E-Visa Grant Letter", description: "Your approved Australian Visitor Visa grant is delivered electronically." }
    ],
    feeStructure: [
      { applicantType: "Visitor Visa (Subclass 600)", embassyFee: "620 AED", serviceFee: "300 AED" }
    ],
    faqs: [
      { question: "Do I need to submit my physical passport for Australia Visa?", answer: "No, Australia visas are completely label-free/electronic. You only submit biometrics at VFS Global." }
    ],
    metaTitle: "Australia Visa Dubai | Subclass 600 | Eshaare Tours",
    metaDescription: "Apply for Australia Subclass 600 tourist visa in Dubai. Complete ImmiAccount documentation audits."
  },
  {
    slug: "new-zealand",
    imageUrl: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=800&q=80",
    name: "New Zealand Visa",
    tagline: "Visitor Visa and NZeTA document verification for smooth travel entries",
    isPublished: true,
    sortOrder: 15,
    heroStats: [
      { label: "Processing Time", value: "15-25 Days", icon: "Clock" },
      { label: "Success Rate", value: "94.8%", icon: "TrendingUp" },
      { label: "Required Documents", value: "6 Core Docs", icon: "FileText" },
      { label: "Submission Type", value: "RealMe Portal Online", icon: "Globe" }
    ],
    overviewText: "Apply for your New Zealand Visitor Visa with Eshaare Tours. Navigating the RealMe immigration portal can be intricate. We verify your funds, employer details, flight itineraries, and complete the detailed declaration files to ensure compliance with Immigration New Zealand standards.",
    suitableFor: ["Tourism", "Business", "Family Visit"],
    visaSpecs: {
      visaType: "Visitor / Short Stay",
      validity: "Up to 9 Months",
      entryType: "Single / Multiple",
      processingTime: "15–25 Days",
      biometrics: "Not Required",
      insurance: "Recommended",
      category: "Oceania Visa"
    },
    groupedDocuments: {
      personal: [
        "Passport Bio-data page scan (color)",
        "UAE Residency & Emirates ID copies",
        "Passport digital photograph (NZ Specs)"
      ],
      financial: [
        "6 Months original bank statements",
        "Employment verification letter / NOC"
      ],
      travel: [
        "Flight bookings",
        "Hotel reservations / Accommodation plan",
        "Daily travel schedule"
      ]
    },
    popularLocations: [
      { name: "Auckland", imageUrl: "https://images.unsplash.com/photo-1507699622108-4be3a09551ff?auto=format&fit=crop&w=500&q=80" },
      { name: "Queenstown", imageUrl: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=500&q=80" },
      { name: "Wellington", imageUrl: "https://images.unsplash.com/photo-1589871181831-a0808ee85c15?auto=format&fit=crop&w=500&q=80" }
    ],
    requiredDocuments: [
      "Passport bio-data page color scan",
      "UAE residency visa and Emirates ID copy",
      "No Objection Certificate (NOC) from employer",
      "6 months original bank statements",
      "Passport-sized digital photograph matching NZ specifications"
    ],
    processSteps: [
      { stepNumber: 1, title: "Profile Screening", description: "Examine applicant profile, residency history, and bank balances." },
      { stepNumber: 2, title: "RealMe Portal Upload", description: "Submit details and digital dossiers via the New Zealand Immigration system." },
      { stepNumber: 3, title: "Immigration Case Monitoring", description: "Liaise with immigration officers for any additional information requests." },
      { stepNumber: 4, title: "Electronic Visa Issuance", description: "Receive NZ Visitor Visa approval directly via email." }
    ],
    feeStructure: [
      { applicantType: "Visitor Visa", embassyFee: "550 AED", serviceFee: "300 AED" },
      { applicantType: "NZeTA (Visa-Exempt)", embassyFee: "130 AED", serviceFee: "80 AED" }
    ],
    faqs: [
      { question: "How long does a New Zealand tourist visa take?", answer: "Most tourist applications are processed in 3 to 4 weeks. Early planning is recommended." }
    ],
    metaTitle: "New Zealand Visa Dubai | Eshaare Tours",
    metaDescription: "Apply for New Zealand visitor visa in Dubai. Complete RealMe application and document compliance checks."
  },
  {
    slug: "spain",
    imageUrl: "https://images.unsplash.com/photo-1509840841025-9088ba78a826?auto=format&fit=crop&w=800&q=80",
    name: "Spain Schengen Visa",
    tagline: "Explore Madrid, Barcelona, and Andalucia with expert BLS Spain booking support",
    isPublished: true,
    sortOrder: 16,
    heroStats: [
      { label: "Processing Time", value: "10-15 Days", icon: "Clock" },
      { label: "Success Rate", value: "97.0%", icon: "TrendingUp" },
      { label: "Required Documents", value: "5 Core Docs", icon: "FileText" },
      { label: "Embassy Appointment", value: "BLS International Dubai", icon: "Calendar" }
    ],
    overviewText: "Apply for your Spain tourist or business visa with Eshaare Tours. Spain visa submissions from Dubai are managed by BLS International. Securing a BLS appointment slot requires constant monitoring. We assist you with document compilation, travel insurance, flight itineraries, and hotel bookings to ensure BLS compliance.",
    suitableFor: ["Tourism", "Family Visit", "Business", "Trade Shows", "Training", "Medical"],
    visaSpecs: {
      visaType: "Tourist Visa",
      validity: "Up to 90 Days",
      entryType: "Single / Multiple",
      processingTime: "10–15 Working Days",
      biometrics: "Required",
      insurance: "Mandatory",
      category: "Schengen Visa"
    },
    groupedDocuments: {
      personal: [
        "Original Passport",
        "Passport Copy",
        "UAE Residence Visa Copy",
        "Emirates ID Copy"
      ],
      financial: [
        "6 Months Bank Statement",
        "Salary Certificate / NOC"
      ],
      travel: [
        "Flight & Hotel Reservation",
        "Mandatory Travel Insurance",
        "Detailed Itinerary"
      ]
    },
    popularLocations: [
      { name: "Madrid", imageUrl: "https://images.unsplash.com/photo-1539650116574-8efeb43e2750?auto=format&fit=crop&w=500&q=80" },
      { name: "Barcelona", imageUrl: "https://images.unsplash.com/photo-1583422409516-2895a77efedd?auto=format&fit=crop&w=500&q=80" },
      { name: "Seville", imageUrl: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=500&q=80" }
    ],
    requiredDocuments: [
      "Passport valid for at least 6 months",
      "UAE residence visa copy",
      "Passport photos",
      "3-6 months bank statements showing regular income",
      "Employer NOC or business setup papers",
      "Travel insurance compliant with Schengen rules"
    ],
    processSteps: [
      { stepNumber: 1, title: "Submit Details & NOC Checklist", description: "Provide passport copy and complete travel questionnaire." },
      { stepNumber: 2, title: "Compliance Audit Check", description: "Our senior visa executives verify bank statement transactions, passport validity, and photo dimensions." },
      { stepNumber: 3, title: "BLS Slot Booking & Submission", description: "We secure an appointment slot at BLS Dubai, compile your document dossier, and assist you with submission." },
      { stepNumber: 4, title: "Visa Approved & Delivery", description: "Receive your passport back with your approved Spanish Schengen sticker." }
    ],
    feeStructure: [
      { applicantType: "Adult (12+ years)", embassyFee: "320 AED (€80)", serviceFee: "280 AED" },
      { applicantType: "Child (6-12 years)", embassyFee: "160 AED (€40)", serviceFee: "280 AED" }
    ],
    faqs: [
      { question: "How long does Spanish processing take?", answer: "Typically 10-15 working days post-submission." }
    ],
    metaTitle: "Spain Visa Dubai | BLS Spain Specialists | Eshaare Tours",
    metaDescription: "Apply for Spain Schengen visa in Dubai with expert support. BLS slot booking and document compliance audits."
  },
  {
    slug: "netherlands",
    imageUrl: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80",
    name: "Netherlands Schengen Visa",
    tagline: "Audit your financial statement & employment files for Dutch Schengen entry",
    isPublished: true,
    sortOrder: 17,
    heroStats: [
      { label: "Processing Time", value: "7-12 Days", icon: "Clock" },
      { label: "Success Rate", value: "98.0%", icon: "TrendingUp" },
      { label: "Required Documents", value: "5 Core Docs", icon: "FileText" },
      { label: "Embassy Appointment", value: "VFS Global Dubai", icon: "Calendar" }
    ],
    overviewText: "Apply for your Netherlands tourist or business visa with Eshaare Tours. Navigating the Dutch embassy rules and biometrics slots at VFS Global Dubai is simple with our documentation team. We review your financial statements, employment letters, and prepare compliant travel details.",
    suitableFor: ["Tourism", "Family Visit", "Business", "Trade Shows", "Training", "Medical"],
    visaSpecs: {
      visaType: "Tourist Visa",
      validity: "Up to 90 Days",
      entryType: "Single / Multiple",
      processingTime: "7–12 Working Days",
      biometrics: "Required",
      insurance: "Mandatory",
      category: "Schengen Visa"
    },
    groupedDocuments: {
      personal: [
        "Original Passport",
        "Passport Copy",
        "UAE Residence Visa Copy",
        "Emirates ID Copy"
      ],
      financial: [
        "6 Months Bank Statement",
        "Salary Certificate / NOC"
      ],
      travel: [
        "Flight & Hotel Reservation",
        "Mandatory Travel Insurance",
        "Detailed Itinerary"
      ]
    },
    popularLocations: [
      { name: "Amsterdam", imageUrl: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=500&q=80" },
      { name: "Rotterdam", imageUrl: "https://images.unsplash.com/photo-1473976377429-97fb3c634024?auto=format&fit=crop&w=500&q=80" },
      { name: "The Hague", imageUrl: "https://images.unsplash.com/photo-1581084282500-1c09930f7850?auto=format&fit=crop&w=500&q=80" }
    ],
    requiredDocuments: [
      "Passport valid for at least 6 months",
      "UAE residence visa copy",
      "Passport photos",
      "3-6 months bank statements showing regular income",
      "Employer NOC or business setup papers",
      "Travel insurance compliant with Schengen rules"
    ],
    processSteps: [
      { stepNumber: 1, title: "Submit Details & NOC Checklist", description: "Provide passport copy and complete travel questionnaire." },
      { stepNumber: 2, title: "Compliance Audit Check", description: "Our senior visa executives verify bank statement transactions, passport validity, and photo dimensions." },
      { stepNumber: 3, title: "VFS Slot Booking & Submission", description: "We secure an appointment slot at VFS Dubai, compile your document dossier, and assist you with submission." },
      { stepNumber: 4, title: "Visa Approved & Delivery", description: "Receive your passport back with your approved Dutch Schengen sticker." }
    ],
    feeStructure: [
      { applicantType: "Adult (12+ years)", embassyFee: "320 AED (€80)", serviceFee: "280 AED" },
      { applicantType: "Child (6-12 years)", embassyFee: "160 AED (€40)", serviceFee: "280 AED" }
    ],
    faqs: [
      { question: "How long does Netherlands processing take?", answer: "Typically 7-12 working days post-submission." }
    ],
    metaTitle: "Netherlands Visa Dubai | VFS Dutch Specialists | Eshaare Tours",
    metaDescription: "Apply for Netherlands Schengen visa in Dubai with expert support. VFS slot booking and document compliance audits."
  }
];

export async function seedVisaTypes() {
  try {
    const batch = writeBatch(db);
    const uid = auth.currentUser?.uid || "system";

    SEED_VISA_TYPES.forEach(item => {
      const itemRef = doc(db, "visa_types", item.slug);
      
      const defaultSupportPackages = {
        showSupportPackages: item.slug === "schengen" || item.slug === "france" || item.slug === "italy" || item.slug === "switzerland" || item.slug === "germany" || item.slug === "spain" || item.slug === "netherlands",
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
    toast.success("17 visa types created successfully");
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

// ==========================================
// APP PACKAGES & VISAS COLLECTION SERVICES
// ==========================================

export function getPackages(callback, errorCallback = null) {
  try {
    const collRef = collection(db, "packages");
    return onSnapshot(collRef, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(items);
    }, (error) => {
      console.error("Packages listener error:", error);
      if (errorCallback) errorCallback(error);
    });
  } catch (error) {
    handleError(error, "getPackages");
  }
}

export async function savePackage(id, data) {
  try {
    const docRef = doc(db, "packages", id);
    const uid = auth.currentUser?.uid || "system";
    await setDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
      updatedBy: uid
    }, { merge: true });
  } catch (error) {
    handleError(error, "savePackage");
  }
}

export async function deletePackage(id) {
  try {
    const docRef = doc(db, "packages", id);
    await deleteDoc(docRef);
  } catch (error) {
    handleError(error, "deletePackage");
  }
}

export function getVisas(callback, errorCallback = null) {
  try {
    const collRef = collection(db, "visas");
    return onSnapshot(collRef, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(items);
    }, (error) => {
      console.error("Visas listener error:", error);
      if (errorCallback) errorCallback(error);
    });
  } catch (error) {
    handleError(error, "getVisas");
  }
}

export async function saveVisa(id, data) {
  try {
    const docRef = doc(db, "visas", id);
    const uid = auth.currentUser?.uid || "system";
    await setDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
      updatedBy: uid
    }, { merge: true });
  } catch (error) {
    handleError(error, "saveVisa");
  }
}

export async function deleteVisa(id) {
  try {
    const docRef = doc(db, "visas", id);
    await deleteDoc(docRef);
  } catch (error) {
    handleError(error, "deleteVisa");
  }
}


