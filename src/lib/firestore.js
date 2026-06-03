import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  limit,
  serverTimestamp
} from "firebase/firestore";
import { db } from "./firebase";

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
    let q = query(docsRef, orderBy("createdAt", "desc"));
    if (travellerId) {
      q = query(docsRef, where("travellerId", "==", travellerId), orderBy("createdAt", "desc"));
    }
    return onSnapshot(q, (snapshot) => {
      const documents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(documents);
    }, (error) => {
      console.error("Documents listener error:", error);
    });
  } catch (error) {
    handleError(error, "getDocuments");
  }
};
