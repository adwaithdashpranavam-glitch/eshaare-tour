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

// 1b. Register Client (public, atomic self-signup)
// Creates the Auth account + users/customers docs in one authoritative place. On ANY
// failure after the Auth user exists, it rolls back via Admin SDK (deleteUser + doc
// deletes, which bypass security rules) so no partial registration can survive.
// NOTE: this writes Firestore via the Admin SDK and therefore requires the functions
// runtime service account to hold roles/datastore.user.
// Email verification is intentionally NOT sent here — account creation is the atomic
// core; the verification email is best-effort and handled client-side (interim).
exports.registerClient = functions.https.onCall(async (data) => {
  const { email, password, name, phoneNumber, nationality } = data || {};

  // ---- Validation ----
  if (!email || !password || !name) {
    throw new functions.https.HttpsError("invalid-argument", "Please fill in all required fields.");
  }
  const emailLower = String(email).toLowerCase().trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(emailLower)) {
    throw new functions.https.HttpsError("invalid-argument", "Invalid email address.");
  }
  const passwordPolicy = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;
  if (typeof password !== "string" || !passwordPolicy.test(password)) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Weak password — please use at least 8 characters, including uppercase, lowercase, a number, and a symbol."
    );
  }

  // ---- Create Auth user ----
  let userRecord;
  try {
    userRecord = await admin.auth().createUser({
      email: emailLower,
      password,
      displayName: name
    });
  } catch (err) {
    if (err.code === "auth/email-already-exists") {
      throw new functions.https.HttpsError("already-exists", "Email already registered.");
    }
    if (err.code === "auth/invalid-password") {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Weak password — please use at least 8 characters, including uppercase, lowercase, a number, and a symbol."
      );
    }
    if (err.code === "auth/invalid-email") {
      throw new functions.https.HttpsError("invalid-argument", "Invalid email address.");
    }
    console.error("registerClient createUser failed:", err);
    throw new functions.https.HttpsError("internal", "Registration failed. Please try again.");
  }

  const uid = userRecord.uid;

  // ---- Write profile docs; roll back authoritatively on failure ----
  try {
    const now = FieldValue.serverTimestamp();
    await db.collection("users").doc(uid).set({
      uid,
      email: emailLower,
      role: "client",
      status: "Active",
      name,
      phone: phoneNumber || "",
      phoneNumber: phoneNumber || "",
      nationality: nationality || "",
      createdAt: now,
      lastLoginAt: null
    });
    await db.collection("customers").doc(uid).set({
      uid,
      name,
      email: emailLower,
      phone: phoneNumber || "",
      nationality: nationality || "",
      createdAt: now,
      status: "Active"
    });
  } catch (err) {
    console.error("registerClient profile write failed — rolling back:", err);
    // Authoritative rollback (Admin SDK bypasses rules): remove the Auth user and any partial docs.
    await admin.auth().deleteUser(uid).catch((e) => console.error("Rollback deleteUser failed:", e));
    await db.collection("users").doc(uid).delete().catch(() => {});
    await db.collection("customers").doc(uid).delete().catch(() => {});
    throw new functions.https.HttpsError("internal", "Registration failed. Please try again.");
  }

  return { success: true, uid };
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
  // `uid` is the Firestore document id of the staff record. For legacy/pre-created
  // staff it may be the email address rather than a real Auth UID.
  const { uid } = data;

  if (!uid) {
    throw new functions.https.HttpsError("invalid-argument", "Missing uid.");
  }

  if (uid === callerUid) {
    throw new functions.https.HttpsError("failed-precondition", "You cannot delete your own account.");
  }

  // Read the Firestore record first so we know the email even if the doc id is a UID.
  const userDoc = await db.collection("users").doc(uid).get();
  const userData = userDoc.exists ? userDoc.data() : null;
  const email = (userData && userData.email) ? userData.email : (uid.includes("@") ? uid : null);

  // Resolve the real Auth UID. The doc id might be an email (legacy) or a real UID.
  let authUid = null;
  if (!uid.includes("@")) {
    authUid = uid; // doc id already looks like a UID
  } else if (email) {
    // doc id is an email — find the matching Auth account, if any
    try {
      const userRecord = await admin.auth().getUserByEmail(email);
      authUid = userRecord.uid;
    } catch (err) {
      console.warn("No Auth account for email", email, err.code || err.message);
    }
  }

  // Delete the Auth user if we found one. Never let this abort the Firestore cleanup.
  if (authUid) {
    try {
      await admin.auth().deleteUser(authUid);
    } catch (err) {
      console.warn("Auth user delete warning:", err.code || err.message);
    }
  }

  // Delete Firestore docs — both the doc id passed in and the resolved Auth UID
  // (these differ for legacy email-keyed records). Best-effort on each.
  const idsToClean = [...new Set([uid, authUid].filter(Boolean))];
  await Promise.all(
    idsToClean.flatMap((id) => [
      db.collection("users").doc(id).delete().catch(() => {}),
      db.collection("customers").doc(id).delete().catch(() => {})
    ])
  );

  // Write Audit Log
  await db.collection("audit_logs").add({
    action: "STAFF_DELETION",
    performedBy: callerUid,
    performedByRole: "super_admin",
    targetId: uid,
    timestamp: FieldValue.serverTimestamp(),
    details: { email: email || "unknown", name: (userData && userData.name) || "unknown" }
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
  const callerIp = context.rawRequest?.ip || context.rawRequest?.headers?.["x-forwarded-for"] || null;

  // Rate Limiting (Max 3 submissions per hour per email)
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const recentLeads = await db.collection("leads")
    .where("contactEmail", "==", emailLower)
    .where("createdAt", ">=", oneHourAgo)
    .get();

  if (recentLeads.size >= 3) {
    throw new functions.https.HttpsError("resource-exhausted", "Rate limit exceeded. Please try again later.");
  }

  // Rate Limiting by IP (Max 5 submissions per hour per IP)
  if (callerIp) {
    const recentLeadsByIp = await db.collection("leads")
      .where("submitterIp", "==", callerIp)
      .where("createdAt", ">=", oneHourAgo)
      .get();
    if (recentLeadsByIp.size >= 5) {
      throw new functions.https.HttpsError("resource-exhausted", "Rate limit exceeded. Please try again later.");
    }
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
    submitterIp: callerIp,
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

// 8. Notify ops/admin staff when a client submits an application.
//
// Triggered on every applications/{applicationId} update, but only acts on the
// Draft -> Submitted transition. Notifications are written server-side via the
// Admin SDK (clients are blocked from the notifications collection by rules).
//
// Duplicate-safety: one notification per staff recipient is written with a
// DETERMINISTIC document id ("appsubmit_<appId>_<staffUid>") using set(). If the
// event is redelivered or the function re-runs, the same ids are overwritten in
// place instead of producing duplicates. The transition guard (before != Submitted
// && after == Submitted) is the first line of defence; the deterministic id is the
// second.
exports.onApplicationSubmitted = functions.firestore
  .document("applications/{applicationId}")
  .onUpdate(async (change, context) => {
    const before = change.before.data() || {};
    const after = change.after.data() || {};

    // Only fire on the Draft -> Submitted transition.
    if (before.status === "Submitted" || after.status !== "Submitted") {
      return null;
    }

    const applicationId = context.params.applicationId;

    try {
      // Build the dynamic application name: "{Destination Country} {Visa Type}".
      const country = (after.destinationCountry || "").trim();
      const visaType = (after.visaType || "").trim();
      const displayName = (country && visaType)
        ? `${country} ${visaType}`
        : (after.visaName || visaType || country || "Visa Application");

      const clientName = (after.formData && after.formData.name) || after.customerName || "A client";

      // Resolve the submission timestamp to an ISO string for the message.
      let submittedAtIso;
      const submittedAt = after.submittedAt;
      if (submittedAt && typeof submittedAt.toDate === "function") {
        submittedAtIso = submittedAt.toDate().toISOString();
      } else if (submittedAt) {
        submittedAtIso = new Date(submittedAt).toISOString();
      } else {
        submittedAtIso = new Date().toISOString();
      }

      const title = "New application submitted";
      const message =
        `New application submitted by ${clientName} — ${displayName} ` +
        `(${country || "N/A"} · ${visaType || "N/A"}). Application ID: ${applicationId}.`;

      const batch = db.batch();

      // Client-facing notification: the client portal dashboard reads
      // `notifications where userId == auth.currentUser.uid`, so the notification
      // must be addressed to the application owner's uid (customerId). This is a
      // separate doc from the staff notifications and never replaces them.
      // Firestore rules forbid client SDK writes to notifications; the Admin SDK
      // here bypasses those rules so this is the only place a client notification
      // can be produced.
      const clientUid = after.customerId;
      if (clientUid) {
        const clientNotifRef = db
          .collection("notifications")
          .doc(`appsubmit_${applicationId}_client`);
        batch.set(clientNotifRef, {
          userId: clientUid,
          title: "Payment confirmed — application submitted",
          message:
            `Your payment has been confirmed and your ${displayName} visa application ` +
            `has been submitted. Our team will now begin processing your file.`,
          type: "application_submitted",
          read: false,
          applicationId,
          clientName,
          destinationCountry: country,
          visaType,
          submittedAt: submittedAtIso,
          createdAt: FieldValue.serverTimestamp()
        });
      }

      // Recipients: all active ops/admin staff.
      const opsRoles = ["super_admin", "admin", "manager", "visa_ops"];
      const staffSnap = await db
        .collection("users")
        .where("role", "in", opsRoles)
        .get();

      if (staffSnap.empty) {
        console.warn("onApplicationSubmitted: no ops/admin staff to notify.");
      }

      staffSnap.forEach((staffDoc) => {
        const staffUid = staffDoc.id;
        const notifRef = db
          .collection("notifications")
          .doc(`appsubmit_${applicationId}_${staffUid}`);
        batch.set(notifRef, {
          userId: staffUid,
          title,
          message,
          type: "application_submitted",
          read: false,
          // Structured metadata for ops tooling (Admin SDK bypasses client schema rules).
          applicationId,
          clientName,
          destinationCountry: country,
          visaType,
          submittedAt: submittedAtIso,
          createdAt: FieldValue.serverTimestamp()
        });
      });

      await batch.commit();
      console.log(`onApplicationSubmitted: notified ${staffSnap.size} staff + client for ${applicationId}.`);
    } catch (err) {
      console.error("onApplicationSubmitted error:", err);
    }

    return null;
  });

// 9. Safety net: enforce "payment === submission" for Schengen applications.
//
// The primary path writes paymentStatus="paid" AND status="Submitted" atomically
// (client/staff batch, or future Stripe webhook). This trigger is a defense-in-depth
// reconciler: if ANY writer ever sets paymentStatus="paid" on a Schengen application
// without also flipping it to Submitted, this function finalizes it — flips status,
// stamps submittedAt, and creates the visa_case if one does not already exist. The
// subsequent status -> "Submitted" change is what fires onApplicationSubmitted (the
// notification), so notifications are not duplicated here.
//
// Idempotent: it no-ops when already Submitted, and it skips visa_case creation when
// a case already references this applicationId.
exports.onApplicationPaid = functions.firestore
  .document("applications/{applicationId}")
  .onUpdate(async (change, context) => {
    const before = change.before.data() || {};
    const after = change.after.data() || {};

    // Only act on the unpaid -> paid transition for Schengen applications that are
    // not already Submitted.
    const becamePaid = before.paymentStatus !== "paid" && after.paymentStatus === "paid";
    const isSchengen = (after.applicationType || "") === "schengen";
    if (!becamePaid || !isSchengen || after.status === "Submitted") {
      return null;
    }

    const applicationId = context.params.applicationId;

    try {
      const now = new Date();

      // Flip the application to Submitted (this is what makes the invariant hold and
      // what triggers the submission notification via onApplicationSubmitted).
      await change.after.ref.update({
        status: "Submitted",
        submittedAt: after.submittedAt || now,
        updatedAt: FieldValue.serverTimestamp()
      });

      // Create the visa_case only if one does not already exist for this application.
      const existing = await db
        .collection("visa_cases")
        .where("applicationId", "==", applicationId)
        .limit(1)
        .get();

      if (!existing.empty) {
        console.log(`onApplicationPaid: visa_case already exists for ${applicationId}; skipped creation.`);
        return null;
      }

      const country = (after.destinationCountry || "").trim();
      const visaType = (after.visaType || "").trim();
      const displayName = (country && visaType)
        ? `${country} ${visaType}`
        : (after.visaName || visaType || country || "Visa Application");
      const fd = after.formData || {};

      // Reuse the same daily counter scheme as the client (VC-YYYYMMDD-###). A small
      // race is acceptable here since this path is only a fallback; the caseNo is not a
      // uniqueness key.
      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, "0");
      const dd = String(now.getDate()).padStart(2, "0");
      const todayStr = `${yyyy}${mm}${dd}`;
      let nextCounter = 1;
      try {
        const latest = await db
          .collection("visa_cases")
          .where("caseNo", ">=", `VC-${todayStr}-000`)
          .where("caseNo", "<=", `VC-${todayStr}-999`)
          .orderBy("caseNo", "desc")
          .limit(1)
          .get();
        if (!latest.empty) {
          const parts = (latest.docs[0].data().caseNo || "").split("-");
          const seq = parseInt(parts[2], 10);
          if (!isNaN(seq)) nextCounter = seq + 1;
        }
      } catch (e) {
        nextCounter = Math.floor(100 + Math.random() * 900);
      }
      const caseNo = `VC-${todayStr}-${String(nextCounter).padStart(3, "0")}`;

      await db.collection("visa_cases").add({
        caseNo,
        applicationId,
        travellerName: fd.name || after.customerName || "",
        travellerPhone: fd.phone || "",
        travellerEmail: (fd.email || "").toLowerCase(),
        nationality: fd.nationality || after.nationality || "",
        destination: country,
        destinationCountry: country,
        visaType,
        displayName,
        applicationType: "schengen",
        paymentStatus: "paid",
        stage: "Docs Pending",
        assignedOfficer: "Visa Ops Officer",
        isDeleted: false,
        isActive: true,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      });

      console.log(`onApplicationPaid: reconciled ${applicationId} to Submitted + created visa_case ${caseNo}.`);
    } catch (err) {
      console.error("onApplicationPaid error:", err);
    }

    return null;
  });
