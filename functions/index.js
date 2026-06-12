const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
admin.initializeApp();

const db = getFirestore();

// Helper to check if caller is super_admin
async function verifySuperAdmin(context) {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Authentication required.");
  }
  const callerUid = context.auth.uid;
  const callerDoc = await db.collection("users").doc(callerUid).get();
  if (!callerDoc.exists || callerDoc.data().role !== "super_admin") {
    throw new functions.https.HttpsError("permission-denied", "Access restricted to super_admin only.");
  }
  return callerUid;
}

// 1. Create Staff
exports.createStaff = functions.https.onCall(async (data, context) => {
  const callerUid = await verifySuperAdmin(context);
  const { name, email, role, password } = data;

  if (!name || !email || !role || !password) {
    throw new functions.https.HttpsError("invalid-argument", "Missing required fields.");
  }

  const allowedRoles = ["admin", "manager", "sales", "visa_ops", "finance", "support"];
  if (!allowedRoles.includes(role)) {
    throw new functions.https.HttpsError("invalid-argument", "Invalid staff role.");
  }

  const emailLower = email.toLowerCase().trim();

  // Create Auth User
  let userRecord;
  try {
    userRecord = await admin.auth().createUser({
      email: emailLower,
      password: password,
      displayName: name,
    });
  } catch (err) {
    throw new functions.https.HttpsError("already-exists", `Error creating Auth user: ${err.message}`);
  }

  // Create Firestore Doc
  const profileData = {
    uid: userRecord.uid,
    name,
    email: emailLower,
    role,
    status: "Active",
    casesHandled: 0,
    createdAt: FieldValue.serverTimestamp(),
    lastLoginAt: null
  };

  await db.collection("users").doc(userRecord.uid).set(profileData);

  // Write Audit Log
  await db.collection("audit_logs").add({
    action: "STAFF_CREATION",
    performedBy: callerUid,
    performedByRole: "super_admin",
    targetId: userRecord.uid,
    timestamp: FieldValue.serverTimestamp(),
    details: { name, email: emailLower, role }
  });

  return { success: true, uid: userRecord.uid };
});

// 2. Update Staff Status (Activate/Suspend/Disable)
exports.updateStaffStatus = functions.https.onCall(async (data, context) => {
  const callerUid = await verifySuperAdmin(context);
  const { uid, status } = data;

  if (!uid || !status) {
    throw new functions.https.HttpsError("invalid-argument", "Missing uid or status.");
  }

  const allowedStatuses = ["Active", "Suspended", "Disabled"];
  if (!allowedStatuses.includes(status)) {
    throw new functions.https.HttpsError("invalid-argument", "Invalid status value.");
  }

  // Update Auth Account status (Disable if Suspended or Disabled)
  const disableAuth = status === "Suspended" || status === "Disabled";
  try {
    await admin.auth().updateUser(uid, { disabled: disableAuth });
    // Revoke all refresh tokens immediately so current sessions are terminated
    if (disableAuth) {
      await admin.auth().revokeRefreshTokens(uid);
    }
  } catch (err) {
    console.error("Auth status sync warning:", err);
  }

  // Update Firestore User doc
  await db.collection("users").doc(uid).update({ status });

  // If customer is linked, update customer status too
  const customerDoc = await db.collection("customers").doc(uid).get();
  if (customerDoc.exists) {
    await db.collection("customers").doc(uid).update({ status });
  }

  // Write Audit Log
  await db.collection("audit_logs").add({
    action: `STAFF_${status.toUpperCase()}`,
    performedBy: callerUid,
    performedByRole: "super_admin",
    targetId: uid,
    timestamp: FieldValue.serverTimestamp(),
    details: { status }
  });

  return { success: true };
});

// 3. Update Staff Role (Promote/Demote)
exports.updateStaffRole = functions.https.onCall(async (data, context) => {
  const callerUid = await verifySuperAdmin(context);
  const { uid, role } = data;

  if (!uid || !role) {
    throw new functions.https.HttpsError("invalid-argument", "Missing uid or role.");
  }

  const allowedRoles = ["super_admin", "admin", "manager", "sales", "visa_ops", "finance", "support", "client"];
  if (!allowedRoles.includes(role)) {
    throw new functions.https.HttpsError("invalid-argument", "Invalid role specified.");
  }

  // Get current role
  const userDoc = await db.collection("users").doc(uid).get();
  if (!userDoc.exists) {
    throw new functions.https.HttpsError("not-found", "User not found.");
  }
  const oldRole = userDoc.data().role;

  // Update Firestore
  await db.collection("users").doc(uid).update({ role });

  // Write Audit Log
  await db.collection("audit_logs").add({
    action: "ROLE_CHANGE",
    performedBy: callerUid,
    performedByRole: "super_admin",
    targetId: uid,
    timestamp: FieldValue.serverTimestamp(),
    details: { oldRole, newRole: role }
  });

  return { success: true };
});

// 4. Delete Staff Account
exports.deleteStaff = functions.https.onCall(async (data, context) => {
  const callerUid = await verifySuperAdmin(context);
  const { uid } = data;

  if (!uid) {
    throw new functions.https.HttpsError("invalid-argument", "Missing uid.");
  }

  // Delete Auth User
  try {
    await admin.auth().deleteUser(uid);
  } catch (err) {
    console.error("Auth user delete warning:", err);
  }

  // Get User Details for Audit
  const userDoc = await db.collection("users").doc(uid).get();
  const userData = userDoc.exists ? userDoc.data() : { email: "unknown", name: "unknown" };

  // Delete Firestore doc
  await db.collection("users").doc(uid).delete();
  await db.collection("customers").doc(uid).delete().catch(() => {});

  // Write Audit Log
  await db.collection("audit_logs").add({
    action: "STAFF_DELETION",
    performedBy: callerUid,
    performedByRole: "super_admin",
    targetId: uid,
    timestamp: FieldValue.serverTimestamp(),
    details: { email: userData.email, name: userData.name }
  });

  return { success: true };
});

// 5. Submit Lead (Public Form) with rate limiting, duplicate protection, and spam checking
exports.submitLead = functions.https.onCall(async (data, context) => {
  const { contactName, contactEmail, contactPhone, destinationCountry, serviceType, notes, captchaToken, honeypot } = data;

  // Honeypot check (spam bot check)
  if (honeypot) {
    throw new functions.https.HttpsError("invalid-argument", "Spam detected.");
  }

  // Server-side validation
  if (!contactName || !contactEmail || !contactPhone) {
    throw new functions.https.HttpsError("invalid-argument", "Name, email, and phone are required.");
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(contactEmail)) {
    throw new functions.https.HttpsError("invalid-argument", "Invalid email format.");
  }

  const emailLower = contactEmail.toLowerCase().trim();

  // Rate Limiting (Max 3 submissions per hour per email)
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const recentLeads = await db.collection("leads")
    .where("contactEmail", "==", emailLower)
    .where("createdAt", ">=", oneHourAgo)
    .get();

  if (recentLeads.size >= 3) {
    throw new functions.https.HttpsError("resource-exhausted", "Rate limit exceeded. Please try again later.");
  }

  // Duplicate submission check (same email/phone/country in last 10 minutes)
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
  const duplicateLeads = await db.collection("leads")
    .where("contactEmail", "==", emailLower)
    .where("contactPhone", "==", contactPhone)
    .where("createdAt", ">=", tenMinutesAgo)
    .get();

  if (!duplicateLeads.empty) {
    throw new functions.https.HttpsError("already-exists", "A duplicate inquiry was submitted recently. We are processing it.");
  }

  // Create Lead doc
  const leadData = {
    contactName,
    contactEmail: emailLower,
    contactPhone,
    destinationCountry: destinationCountry || "General Inquiry",
    serviceType: serviceType || "Visa",
    notes: notes || "",
    stage: "New",
    priority: "Medium",
    ownerId: null,
    isDeleted: false,
    isActive: true,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp()
  };

  const docRef = await db.collection("leads").add(leadData);

  // Write audit log
  await db.collection("audit_logs").add({
    action: "LEAD_CREATION",
    performedBy: "Anonymous",
    performedByRole: "client",
    targetId: docRef.id,
    timestamp: FieldValue.serverTimestamp(),
    details: { email: emailLower, country: destinationCountry }
  });

  return { success: true, id: docRef.id };
});

// 6. Auth User Created Trigger (Audit USER_REGISTER)
exports.onUserCreated = functions.auth.user().onCreate(async (user) => {
  try {
    await db.collection("audit_logs").add({
      action: "USER_REGISTER",
      performedBy: user.uid,
      performedByRole: "client",
      targetId: user.uid,
      timestamp: FieldValue.serverTimestamp(),
      details: { email: user.email }
    });
  } catch (err) {
    console.error("onUserCreated audit error:", err);
  }
});

// 7. Callable logAuthEvent for login/logout audits
exports.logAuthEvent = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Authentication required.");
  }
  const { action } = data;
  if (!["USER_LOGIN", "USER_LOGOUT"].includes(action)) {
    throw new functions.https.HttpsError("invalid-argument", "Invalid auth action.");
  }

  const callerUid = context.auth.uid;
  const callerDoc = await db.collection("users").doc(callerUid).get();
  const role = callerDoc.exists ? callerDoc.data().role : "client";

  await db.collection("audit_logs").add({
    action: action,
    performedBy: callerUid,
    performedByRole: role,
    targetId: callerUid,
    timestamp: FieldValue.serverTimestamp(),
    details: { email: context.auth.token.email || "" }
  });

  return { success: true };
});

