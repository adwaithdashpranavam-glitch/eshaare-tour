import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator, doc, getDoc, updateDoc, collection, addDoc, setDoc } from "firebase/firestore";
import { getStorage, connectStorageEmulator, ref, uploadBytes, getBytes } from "firebase/storage";
import { getFunctions, connectFunctionsEmulator, httpsCallable } from "firebase/functions";

import { createRequire } from "module";
const require = createRequire(import.meta.url);
const admin = require("../functions/node_modules/firebase-admin");

// Safety Config Checks
const PROJECT_ID = "eshaareuae";
process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";
process.env.FIREBASE_AUTH_EMULATOR_HOST = "127.0.0.1:9099";
process.env.FIREBASE_STORAGE_EMULATOR_HOST = "127.0.0.1:9199";
process.env.FIREBASE_FUNCTIONS_EMULATOR_HOST = "127.0.0.1:5001";

console.log("================ SAFETY CHECK ================");
console.log(`Targeting Firebase Project ID: ${PROJECT_ID}`);
console.log(`Firestore Emulator Host:     ${process.env.FIRESTORE_EMULATOR_HOST}`);
console.log(`Auth Emulator Host:          ${process.env.FIREBASE_AUTH_EMULATOR_HOST}`);
console.log(`Storage Emulator Host:       ${process.env.FIREBASE_STORAGE_EMULATOR_HOST}`);
console.log(`Functions Emulator Host:     ${process.env.FIREBASE_FUNCTIONS_EMULATOR_HOST}`);
console.log("==============================================");

// Initialize Admin SDK pointed at the Emulator
admin.initializeApp({
  projectId: PROJECT_ID,
});
const adminDb = admin.firestore();
const adminAuth = admin.auth();
const adminStorage = admin.storage().bucket("eshaareuae.appspot.com");

// Initialize Client SDK
const firebaseConfig = {
  apiKey: "fake-api-key",
  authDomain: `${PROJECT_ID}.firebaseapp.com`,
  projectId: PROJECT_ID,
  storageBucket: `${PROJECT_ID}.firebasestorage.app`,
};
const app = initializeApp(firebaseConfig);
const clientAuth = getAuth(app);
const clientDb = getFirestore(app);
const clientStorage = getStorage(app);
const clientFunctions = getFunctions(app);

connectAuthEmulator(clientAuth, "http://127.0.0.1:9099", { disableWarnings: true });
connectFirestoreEmulator(clientDb, "127.0.0.1", 8080);
connectStorageEmulator(clientStorage, "127.0.0.1", 9199);
connectFunctionsEmulator(clientFunctions, "127.0.0.1", 5001);

const results = [];

function recordResult(testNo, scenario, expected, actual, status) {
  results.push({ testNo, scenario, expected, actual, status });
  console.log(`Test #${testNo}: ${scenario} -> ${status} (${actual})`);
}

async function runTests() {
  console.log("\nStarting Test Execution...");

  let customerUid = null;
  let customerEmail = "test-client@test.com";
  let secondCustomerUid = null;
  let secondCustomerEmail = "test-client2@test.com";

  // SCENARIO 1: CUSTOMER SIGNUP
  try {
    const registerFn = httpsCallable(clientFunctions, "registerClient");

    // A. Weak password sign-up (should fail)
    try {
      await registerFn({ email: customerEmail, password: "abc" });
      recordResult(1, "Customer Signup (Weak Password)", "REJECTED (Weak Password)", "ALLOWED", "FAIL");
    } catch (err) {
      if (err.message.includes("Weak password")) {
        recordResult(1, "Customer Signup (Weak Password)", "REJECTED (Weak Password)", "REJECTED (" + err.message + ")", "PASS");
      } else {
        recordResult(1, "Customer Signup (Weak Password)", "REJECTED (Weak Password)", "REJECTED (Other error: " + err.message + ")", "FAIL");
      }
    }

    // B. Strong password sign-up (should succeed)
    try {
      const res = await registerFn({ email: customerEmail, password: "StrongPassword123!" });
      customerUid = res.data.uid;

      // Check if user doc exists under /users/{uid} with role client
      const userSnap = await adminDb.collection("users").doc(customerUid).get();
      if (userSnap.exists && userSnap.data().role === "client") {
        recordResult(1, "Customer Signup (Strong Password)", "ALLOWED & User Document Created", "ALLOWED & role is 'client'", "PASS");
      } else {
        recordResult(1, "Customer Signup (Strong Password)", "ALLOWED & User Document Created", "Doc not found or incorrect role", "FAIL");
      }
    } catch (err) {
      recordResult(1, "Customer Signup (Strong Password)", "ALLOWED", "REJECTED (" + err.message + ")", "FAIL");
    }

    // C. Create second customer account for access control checks
    try {
      const res2 = await registerFn({ email: secondCustomerEmail, password: "StrongPassword123!" });
      secondCustomerUid = res2.data.uid;
    } catch (err) {
      console.error("Failed to set up second customer:", err);
    }
  } catch (err) {
    console.error("General Scenario 1 error:", err);
  }

  // SCENARIO 2: CUSTOMER LOGIN
  try {
    const credential = await signInWithEmailAndPassword(clientAuth, customerEmail, "StrongPassword123!");
    if (credential.user && credential.user.uid === customerUid) {
      recordResult(2, "Customer Login", "Login Successful", "Login Successful", "PASS");
    } else {
      recordResult(2, "Customer Login", "Login Successful", "Incorrect User Session", "FAIL");
    }
  } catch (err) {
    recordResult(2, "Customer Login", "Login Successful", "FAILED: " + err.message, "FAIL");
  }

  // SCENARIO 3: PRIVILEGE ESCALATION ATTEMPT
  try {
    // Attempt directly writing self doc with admin role and victim email
    try {
      await setDoc(doc(clientDb, "users", customerUid), {
        email: "victim_admin@eshaareuae.com",
        role: "admin"
      });
      recordResult(3, "Privilege Escalation Attempt", "REJECTED (Permission Denied)", "ALLOWED", "FAIL");
    } catch (err) {
      if (err.code === "permission-denied") {
        recordResult(3, "Privilege Escalation Attempt", "REJECTED (Permission Denied)", "REJECTED (permission-denied)", "PASS");
      } else {
        recordResult(3, "Privilege Escalation Attempt", "REJECTED", "FAILED with code: " + err.code, "FAIL");
      }
    }
  } catch (err) {
    console.error("General Scenario 3 error:", err);
  }

  // SCENARIO 4: VISA CASE ACCESS CONTROL
  try {
    // Create sample case via Admin SDK
    await adminDb.collection("visa_cases").doc("test_case_1").set({
      travellerEmail: customerEmail,
      status: "In Progress",
      assignedOfficer: "Officer Test"
    });

    // A. Read as Unauthenticated
    const tempApp = initializeApp(firebaseConfig, "unauthApp");
    const unauthDb = getFirestore(tempApp);
    connectFirestoreEmulator(unauthDb, "127.0.0.1", 8080);
    try {
      await getDoc(doc(unauthDb, "visa_cases", "test_case_1"));
      recordResult(4, "Visa Case - Unauthenticated Read", "REJECTED", "ALLOWED", "FAIL");
    } catch (err) {
      if (err.code === "permission-denied") {
        recordResult(4, "Visa Case - Unauthenticated Read", "REJECTED", "REJECTED (permission-denied)", "PASS");
      } else {
        recordResult(4, "Visa Case - Unauthenticated Read", "REJECTED", "FAILED: " + err.code, "FAIL");
      }
    }

    // B. Read as Authorized Customer
    try {
      const snap = await getDoc(doc(clientDb, "visa_cases", "test_case_1"));
      if (snap.exists()) {
        recordResult(4, "Visa Case - Authorized Owner Read", "ALLOWED", "ALLOWED", "PASS");
      } else {
        recordResult(4, "Visa Case - Authorized Owner Read", "ALLOWED", "Not found", "FAIL");
      }
    } catch (err) {
      recordResult(4, "Visa Case - Authorized Owner Read", "ALLOWED", "REJECTED: " + err.code, "FAIL");
    }

    // C. Read as Unauthorized Customer (test-client2)
    const clientAuth2 = getAuth(tempApp);
    connectAuthEmulator(clientAuth2, "http://127.0.0.1:9099", { disableWarnings: true });
    await signInWithEmailAndPassword(clientAuth2, secondCustomerEmail, "StrongPassword123!");
    try {
      await getDoc(doc(unauthDb, "visa_cases", "test_case_1"));
      recordResult(4, "Visa Case - Unauthorized Client Read", "REJECTED", "ALLOWED", "FAIL");
    } catch (err) {
      if (err.code === "permission-denied") {
        recordResult(4, "Visa Case - Unauthorized Client Read", "REJECTED", "REJECTED (permission-denied)", "PASS");
      } else {
        recordResult(4, "Visa Case - Unauthorized Client Read", "REJECTED", "FAILED: " + err.code, "FAIL");
      }
    }
  } catch (err) {
    console.error("General Scenario 4 error:", err);
  }

  // SCENARIO 5: APPLICATION DOCUMENT / STORAGE ACCESS CONTROL
  try {
    // Setup application in Firestore
    await adminDb.collection("applications").doc("test_app_1").set({
      customerId: customerUid,
      status: "Draft",
      visaName: "France Schengen"
    });

    // Setup Storage file via Admin SDK
    await adminStorage.file("applications/test_app_1/test.pdf").save("Dummy PDF Content");

    // A. Read as Owner
    try {
      const storageRef = ref(clientStorage, "applications/test_app_1/test.pdf");
      const bytes = await getBytes(storageRef);
      if (bytes && bytes.byteLength > 0) {
        recordResult(5, "Storage - Authorized Owner Read", "ALLOWED", "ALLOWED", "PASS");
      } else {
        recordResult(5, "Storage - Authorized Owner Read", "ALLOWED", "No content", "FAIL");
      }
    } catch (err) {
      recordResult(5, "Storage - Authorized Owner Read", "ALLOWED", "FAILED: " + err.code, "FAIL");
    }

    // B. Read as Unauthorized Client (using client2 app clientDb / clientStorage)
    const tempApp2 = initializeApp(firebaseConfig, "client2App");
    const clientAuth2 = getAuth(tempApp2);
    const clientStorage2 = getStorage(tempApp2);
    connectAuthEmulator(clientAuth2, "http://127.0.0.1:9099", { disableWarnings: true });
    connectStorageEmulator(clientStorage2, "127.0.0.1", 9199);
    await signInWithEmailAndPassword(clientAuth2, secondCustomerEmail, "StrongPassword123!");

    try {
      const storageRef2 = ref(clientStorage2, "applications/test_app_1/test.pdf");
      await getBytes(storageRef2);
      recordResult(5, "Storage - Unauthorized Client Read", "REJECTED", "ALLOWED", "FAIL");
    } catch (err) {
      // Storage rules returns 'storage/unauthorized'
      if (err.code === "storage/unauthorized" || err.code === "permission-denied") {
        recordResult(5, "Storage - Unauthorized Client Read", "REJECTED", "REJECTED (" + err.code + ")", "PASS");
      } else {
        recordResult(5, "Storage - Unauthorized Client Read", "REJECTED", "FAILED: " + err.code, "FAIL");
      }
    }
  } catch (err) {
    console.error("General Scenario 5 error:", err);
  }

  // SCENARIO 6: PAYMENT STATUS TAMPERING
  try {
    try {
      await updateDoc(doc(clientDb, "applications", "test_app_1"), {
        paymentStatus: "confirmed",
        amount: 0
      });
      recordResult(6, "Application Payment status tampering", "REJECTED", "ALLOWED", "FAIL");
    } catch (err) {
      if (err.code === "permission-denied") {
        recordResult(6, "Application Payment status tampering", "REJECTED", "REJECTED (permission-denied)", "PASS");
      } else {
        recordResult(6, "Application Payment status tampering", "REJECTED", "FAILED: " + err.code, "FAIL");
      }
    }
  } catch (err) {
    console.error("General Scenario 6 error:", err);
  }

  // SCENARIO 7: BOOKING TAMPERING
  try {
    // Create booking doc owned by user
    await adminDb.collection("bookings").doc("test_booking_1").set({
      clientUid: customerUid,
      clientEmail: customerEmail,
      price: 150,
      status: "Pending",
      notes: "Initial note"
    });

    // A. Tampering price (should fail)
    try {
      await updateDoc(doc(clientDb, "bookings", "test_booking_1"), { price: 50 });
      recordResult(7, "Booking Tampering - Price", "REJECTED", "ALLOWED", "FAIL");
    } catch (err) {
      if (err.code === "permission-denied") {
        recordResult(7, "Booking Tampering - Price", "REJECTED", "REJECTED (permission-denied)", "PASS");
      } else {
        recordResult(7, "Booking Tampering - Price", "REJECTED", "FAILED: " + err.code, "FAIL");
      }
    }

    // B. Tampering status (should fail)
    try {
      await updateDoc(doc(clientDb, "bookings", "test_booking_1"), { status: "Confirmed" });
      recordResult(7, "Booking Tampering - Status", "REJECTED", "ALLOWED", "FAIL");
    } catch (err) {
      if (err.code === "permission-denied") {
        recordResult(7, "Booking Tampering - Status", "REJECTED", "REJECTED (permission-denied)", "PASS");
      } else {
        recordResult(7, "Booking Tampering - Status", "REJECTED", "FAILED: " + err.code, "FAIL");
      }
    }

    // C. Tampering clientUid (should fail)
    try {
      await updateDoc(doc(clientDb, "bookings", "test_booking_1"), { clientUid: "different-uid" });
      recordResult(7, "Booking Tampering - clientUid", "REJECTED", "ALLOWED", "FAIL");
    } catch (err) {
      if (err.code === "permission-denied") {
        recordResult(7, "Booking Tampering - clientUid", "REJECTED", "REJECTED (permission-denied)", "PASS");
      } else {
        recordResult(7, "Booking Tampering - clientUid", "REJECTED", "FAILED: " + err.code, "FAIL");
      }
    }

    // D. Modify notes (should be ALLOWED)
    try {
      await updateDoc(doc(clientDb, "bookings", "test_booking_1"), { notes: "Updated notes" });
      recordResult(7, "Booking Modify Allowed Field (notes)", "ALLOWED", "ALLOWED", "PASS");
    } catch (err) {
      recordResult(7, "Booking Modify Allowed Field (notes)", "ALLOWED", "FAILED: " + err.code, "FAIL");
    }
  } catch (err) {
    console.error("General Scenario 7 error:", err);
  }

  // SCENARIO 8: LEAD SUBMISSION + RATE LIMITING
  try {
    const submitLeadFn = httpsCallable(clientFunctions, "submitLead");

    // A. Submit valid lead (first attempt)
    let firstLeadId = null;
    try {
      const payload = {
        contactName: "Lead Tester",
        contactEmail: "lead-unique-1@test.com",
        contactPhone: "+971501234567",
        destination: "France",
        message: "Hello"
      };
      const res = await submitLeadFn(payload);
      firstLeadId = res.data.leadId;

      // Verify lead doc has submitterIp
      const leadSnap = await adminDb.collection("leads").doc(firstLeadId).get();
      if (leadSnap.exists && leadSnap.data().submitterIp) {
        recordResult(8, "Lead Submission - Success & IP Saved", "ALLOWED & submitterIp exists", "ALLOWED & submitterIp exists", "PASS");
      } else {
        recordResult(8, "Lead Submission - Success & IP Saved", "ALLOWED & submitterIp exists", "IP field missing or doc not created", "FAIL");
      }
    } catch (err) {
      recordResult(8, "Lead Submission - Success & IP Saved", "ALLOWED", "FAILED: " + err.message, "FAIL");
    }

    // B. Flood 5 more leads from the same context (IP 127.0.0.1 inside emulator)
    let floodSucceeded = 0;
    let rateLimitHit = false;

    for (let i = 2; i <= 7; i++) {
      try {
        await submitLeadFn({
          contactName: "Lead Tester " + i,
          contactEmail: `lead-unique-${i}@test.com`,
          contactPhone: "+971501234567",
          destination: "France",
          message: "Spam message " + i
        });
        floodSucceeded++;
      } catch (err) {
        if (err.code === "resource-exhausted" || err.message.includes("Rate limit exceeded")) {
          rateLimitHit = true;
          break;
        }
      }
    }

    if (rateLimitHit) {
      recordResult(8, "Lead Flooding - Rate Limiting", "REJECTED (resource-exhausted)", "REJECTED (Rate limit exceeded)", "PASS");
    } else {
      recordResult(8, "Lead Flooding - Rate Limiting", "REJECTED (resource-exhausted)", `Bypassed! Succeeded ${floodSucceeded} additional times`, "FAIL");
    }
  } catch (err) {
    console.error("General Scenario 8 error:", err);
  }

  // SCENARIO 9: LEAD ACTIVITY LOGGING (CRM)
  try {
    // Create manager/staff user in Auth & Firestore users
    const managerEmail = "manager-crm@test.com";
    let managerUid = null;
    try {
      const managerUser = await adminAuth.createUser({
        email: managerEmail,
        password: "ManagerPassword123!"
      });
      managerUid = managerUser.uid;
      await adminDb.collection("users").doc(managerUid).set({
        email: managerEmail,
        role: "manager",
        status: "Active"
      });
    } catch (err) {
      // Ignore if user already exists
      const user = await adminAuth.getUserByEmail(managerEmail);
      managerUid = user.uid;
    }

    // Create lead doc owned/assigned to manager (or manager logs in)
    await adminDb.collection("leads").doc("test_lead_1").set({
      contactName: "CRM Lead Test",
      contactEmail: "crm-lead@test.com",
      ownerId: managerUid
    });

    // Log in as manager
    const tempApp3 = initializeApp(firebaseConfig, "managerApp");
    const managerAuth = getAuth(tempApp3);
    const managerDb = getFirestore(tempApp3);
    connectAuthEmulator(managerAuth, "http://127.0.0.1:9099", { disableWarnings: true });
    connectFirestoreEmulator(managerDb, "127.0.0.1", 8080);
    await signInWithEmailAndPassword(managerAuth, managerEmail, "ManagerPassword123!");

    // A. Write lead activity
    try {
      await setDoc(doc(managerDb, "leads", "test_lead_1", "activities", "activity_1"), {
        type: "call",
        notes: "Called customer, interested.",
        createdAt: new Date().toISOString()
      });
      
      // B. Read lead activity
      const activitySnap = await getDoc(doc(managerDb, "leads", "test_lead_1", "activities", "activity_1"));
      if (activitySnap.exists()) {
        recordResult(9, "Lead Activity Logging (CRM)", "ALLOWED (Read/Write)", "ALLOWED (Read/Write)", "PASS");
      } else {
        recordResult(9, "Lead Activity Logging (CRM)", "ALLOWED (Read/Write)", "Allowed write but document read returned empty", "FAIL");
      }
    } catch (err) {
      recordResult(9, "Lead Activity Logging (CRM)", "ALLOWED (Read/Write)", "FAILED: " + err.code, "FAIL");
    }
  } catch (err) {
    console.error("General Scenario 9 error:", err);
  }

  // SCENARIO 10: DEBUG ENDPOINT REMOVED
  try {
    // We check code/exports for tempDumpPackages
    const fs = require("fs");
    const code = fs.readFileSync("../functions/index.js", "utf8");
    if (!code.includes("tempDumpPackages")) {
      recordResult(10, "Debug Endpoint Removed", "Function tempDumpPackages does not exist", "Function does not exist (validated via code inspection)", "PASS");
    } else {
      recordResult(10, "Debug Endpoint Removed", "Function tempDumpPackages does not exist", "Vulnerable code block found in index.js", "FAIL");
    }
  } catch (err) {
    recordResult(10, "Debug Endpoint Removed", "Function tempDumpPackages does not exist", "FAILED: " + err.message, "FAIL");
  }

  console.log("\n================ TEST SUMMARY =================\n");
  console.table(results);
}

runTests().catch(console.error);
