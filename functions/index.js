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
  // Resolve the caller's profile the same way the client (AuthContext) and Firestore
  // rules (getUserData) do: try the UID-keyed doc first, then fall back to the legacy
  // email-keyed doc. Without this fallback a super_admin whose profile is still keyed
  // by email (pre-migration / console-created) would be wrongly denied.
  let callerDoc = await db.collection("users").doc(callerUid).get();
  if (!callerDoc.exists && context.auth.token && context.auth.token.email) {
    callerDoc = await db.collection("users").doc(context.auth.token.email.toLowerCase()).get();
  }
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

  // Outcome flags so the caller can distinguish a full delete from a partial one.
  let authDeleted = false;       // an Auth user existed and was deleted
  let authUserNotFound = false;  // a real Auth account could not be located to delete
  let authSkipped = false;       // no Auth deletion attempted (no resolvable Auth uid)
  let authFailed = false;        // Auth account was found but deletion errored (not "not found")

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
      authUserNotFound = true;
    }
  }

  // Delete the Auth user if we found one. Never let this abort the Firestore cleanup.
  if (authUid) {
    // Revoke refresh tokens BEFORE deleting the Auth user. deleteUser() alone does not
    // invalidate ID tokens already issued to the client — they remain cryptographically
    // valid (and therefore pass Firestore/Storage rules checks like isOwner()) until their
    // natural ~1hr expiry. Revoking forces the client's next token refresh to fail
    // immediately, closing that window. Best-effort: a revoke failure must never block the
    // actual account deletion.
    try {
      await admin.auth().revokeRefreshTokens(authUid);
    } catch (err) {
      console.warn("deleteStaff: revokeRefreshTokens warning:", authUid, err.code || err.message);
    }

    try {
      await admin.auth().deleteUser(authUid);
      authDeleted = true;
    } catch (err) {
      console.warn("Auth user delete warning:", err.code || err.message);
      if (err.code === "auth/user-not-found") {
        authUserNotFound = true;
      } else {
        // A real Auth account exists but deletion errored for some other reason
        // (permissions, transient failure, etc.) — this is a genuine failure, not a no-op.
        authFailed = true;
        console.error(`deleteStaff: FAILED to delete Auth user ${authUid}:`, err.code || err.message);
      }
    }
  } else {
    authSkipped = true;
  }

  // Delete Firestore docs — both the doc id passed in and the resolved Auth UID
  // (these differ for legacy email-keyed records). Each (collection, id) pair is checked
  // and deleted individually and sequentially so we can log exactly which records existed,
  // which were removed, and which delete calls genuinely errored — rather than collapsing
  // everything into one shared boolean that a single successful delete could mask a sibling
  // failure behind (the previous Promise.all + shared-flag implementation had this bug).
  const idsToClean = [...new Set([uid, authUid].filter(Boolean))];
  const firestoreRecords = []; // { collection, id, existed, deleted, error }
  let firestoreFailed = false; // true if any delete call genuinely errored (not just "missing")

  for (const id of idsToClean) {
    for (const collectionName of ["users", "customers"]) {
      const ref = db.collection(collectionName).doc(id);
      let existed = null; // null = existence could not be determined (read failed)
      try {
        const snap = await ref.get();
        existed = snap.exists;
      } catch (err) {
        console.warn(`deleteStaff: failed to check ${collectionName}/${id} before delete:`, err.code || err.message);
      }
      try {
        // Firestore delete() does not throw when the document does not exist — it is
        // idempotent. A caught error here means a genuine failure (permissions, network,
        // etc.), never "there was nothing to delete."
        await ref.delete();
        firestoreRecords.push({ collection: collectionName, id, existed, deleted: true });
      } catch (err) {
        firestoreFailed = true;
        firestoreRecords.push({ collection: collectionName, id, existed, deleted: false, error: err.code || err.message });
        console.error(`deleteStaff: FAILED to delete ${collectionName}/${id}:`, err.code || err.message);
      }
    }
  }

  // Log exactly which records were deleted vs. missing vs. failed, for observability.
  console.log(
    `deleteStaff: uid=${uid} authUid=${authUid || "none"} — ` +
    firestoreRecords.map((r) => `${r.collection}/${r.id}:${r.deleted ? (r.existed ? "deleted" : "no-op(missing)") : `FAILED(${r.error})`}`).join(", ")
  );

  // Preserve the previous field's meaning (at least one real Firestore doc was removed)
  // for callers that only care whether anything happened.
  const firestoreDeleted = firestoreRecords.some((r) => r.existed && r.deleted);

  // Write Audit Log — always, so there is a trace even when we are about to throw below.
  await db.collection("audit_logs").add({
    action: "STAFF_DELETION",
    performedBy: callerUid,
    performedByRole: "super_admin",
    targetId: uid,
    timestamp: FieldValue.serverTimestamp(),
    details: {
      email: email || "unknown",
      name: (userData && userData.name) || "unknown",
      authDeleted,
      firestoreDeleted,
      authUserNotFound,
      authSkipped,
      authFailed,
      firestoreFailed,
      records: firestoreRecords
    }
  });

  // Never report success if a required delete genuinely failed. Missing documents (nothing
  // to delete) are not failures; a delete call that actually errored is.
  if (authFailed || firestoreFailed) {
    throw new functions.https.HttpsError(
      "internal",
      "Staff deletion partially failed — some records could not be removed. Check audit_logs for details."
    );
  }

  return {
    success: authDeleted || firestoreDeleted || authSkipped,
    authDeleted,
    firestoreDeleted,
    authUserNotFound,
    authSkipped,
    authFailed,
    firestoreFailed,
    records: firestoreRecords
  };
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

// ===========================================================================
// 9b. Cascade cleanup when an application is deleted
// ---------------------------------------------------------------------------
// Root cause (DATABASE_ROOT_CAUSE_ANALYSIS.md, Issue C/E): deleteApplication
// (src/lib/firestore.js) was a bare deleteDoc() with no cascade, and no
// onDelete trigger existed anywhere in this file — so notifications,
// documents, and visa_cases created for a since-deleted application, plus
// its admin-uploaded Storage files, were left permanently dangling.
//
// SCOPE (intentionally narrow — Phase 3 of DATABASE_FIX_IMPLEMENTATION_PLAN.md):
//   - documents   where applicationId == the deleted applicationId (exact match)
//   - visa_cases  where applicationId == the deleted applicationId (exact match)
//   - notifications where applicationId == the deleted applicationId (exact match)
//   - Storage: the exact `storageKey` recorded on each matched `documents` doc
//     (an exact file path, never a guess), PLUS every object under the
//     `applications/{applicationId}/` prefix (this prefix is namespaced by
//     applicationId, so by construction it cannot contain another
//     application's files — see VisaCheckerCms.jsx's admin-upload path,
//     which writes here without a matching `documents` record).
//
// EXPLICITLY OUT OF SCOPE for this phase (do not add without a separate,
// reviewed change): bookings, payments, other collections, any lookup by
// email or by owner/uid, and any cleanup of orphans that already existed
// before this trigger was deployed (historical orphans are a separate,
// not-yet-implemented sweep).
//
// SAFETY:
//   - Every query below is an EXACT equality filter on `applicationId`
//     (`where("applicationId", "==", applicationId)`) or an exact Storage
//     path — never a partial/prefix string match on user- or email-scoped
//     data, and never a query across all of a user's records. This is what
//     guarantees application B's data can never be touched while deleting
//     application A.
//   - IDEMPOTENT: every delete call here is naturally idempotent —
//     Firestore's `.delete()` is a no-op on an already-missing document, and
//     a missing Storage object is caught and logged as "already gone" rather
//     than treated as an error. If this trigger is redelivered (Cloud
//     Functions triggers are at-least-once, not exactly-once) or partially
//     re-runs after a crash, re-running it again produces the same end state
//     with no errors and no effect on unrelated data.
//   - Every candidate record is logged BEFORE deletion is attempted, and
//     every outcome (deleted / already-missing / failed) is logged
//     individually — failures in one child never abort cleanup of the
//     others, and are never silently swallowed.
// ---------------------------------------------------------------------------
exports.onApplicationDeleted = functions.firestore
  .document("applications/{applicationId}")
  .onDelete(async (snap, context) => {
    const applicationId = context.params.applicationId;
    const summary = { applicationId, documents: [], visaCases: [], notifications: [], storage: [] };

    console.log(`onApplicationDeleted: application ${applicationId} was deleted — starting cascade cleanup.`);

    // ---- 1. documents where applicationId == this application (exact match) ----
    let matchedDocuments = [];
    try {
      const docSnap = await db.collection("documents").where("applicationId", "==", applicationId).get();
      matchedDocuments = docSnap.docs;
      console.log(`onApplicationDeleted[${applicationId}]: found ${matchedDocuments.length} documents doc(s) to remove:`, matchedDocuments.map((d) => d.id));
    } catch (err) {
      console.error(`onApplicationDeleted[${applicationId}]: FAILED to query documents:`, err.code || err.message);
    }
    for (const d of matchedDocuments) {
      try {
        await d.ref.delete();
        summary.documents.push({ id: d.id, deleted: true });
        console.log(`onApplicationDeleted[${applicationId}]: deleted documents/${d.id}`);
      } catch (err) {
        summary.documents.push({ id: d.id, deleted: false, error: err.code || err.message });
        console.error(`onApplicationDeleted[${applicationId}]: FAILED to delete documents/${d.id}:`, err.code || err.message);
      }
    }

    // ---- 2. visa_cases where applicationId == this application (exact match) ----
    let matchedVisaCases = [];
    try {
      const vcSnap = await db.collection("visa_cases").where("applicationId", "==", applicationId).get();
      matchedVisaCases = vcSnap.docs;
      console.log(`onApplicationDeleted[${applicationId}]: found ${matchedVisaCases.length} visa_cases doc(s) to remove:`, matchedVisaCases.map((d) => d.id));
    } catch (err) {
      console.error(`onApplicationDeleted[${applicationId}]: FAILED to query visa_cases:`, err.code || err.message);
    }
    for (const v of matchedVisaCases) {
      try {
        await v.ref.delete();
        summary.visaCases.push({ id: v.id, deleted: true });
        console.log(`onApplicationDeleted[${applicationId}]: deleted visa_cases/${v.id}`);
      } catch (err) {
        summary.visaCases.push({ id: v.id, deleted: false, error: err.code || err.message });
        console.error(`onApplicationDeleted[${applicationId}]: FAILED to delete visa_cases/${v.id}:`, err.code || err.message);
      }
    }

    // ---- 3. notifications where applicationId == this application (exact match) ----
    // Covers both the client notification (appsubmit_{applicationId}_client) and every
    // per-staff notification (appsubmit_{applicationId}_{staffUid}) written by
    // onApplicationSubmitted — all of them carry an `applicationId` field, so a single
    // exact-equality query finds every one without needing to re-enumerate staff.
    let matchedNotifications = [];
    try {
      const notifSnap = await db.collection("notifications").where("applicationId", "==", applicationId).get();
      matchedNotifications = notifSnap.docs;
      console.log(`onApplicationDeleted[${applicationId}]: found ${matchedNotifications.length} notifications doc(s) to remove:`, matchedNotifications.map((d) => d.id));
    } catch (err) {
      console.error(`onApplicationDeleted[${applicationId}]: FAILED to query notifications:`, err.code || err.message);
    }
    for (const n of matchedNotifications) {
      try {
        await n.ref.delete();
        summary.notifications.push({ id: n.id, deleted: true });
        console.log(`onApplicationDeleted[${applicationId}]: deleted notifications/${n.id}`);
      } catch (err) {
        summary.notifications.push({ id: n.id, deleted: false, error: err.code || err.message });
        console.error(`onApplicationDeleted[${applicationId}]: FAILED to delete notifications/${n.id}:`, err.code || err.message);
      }
    }

    // ---- 4. Storage: exact storageKey from each matched document, plus the
    //         applications/{applicationId}/ prefix (application-scoped by construction) ----
    const storagePaths = new Set();
    for (const d of matchedDocuments) {
      const key = d.data() && d.data().storageKey;
      if (key) storagePaths.add(key);
    }
    try {
      const bucket = admin.storage().bucket();
      const [prefixFiles] = await bucket.getFiles({ prefix: `applications/${applicationId}/` });
      prefixFiles.forEach((f) => storagePaths.add(f.name));
    } catch (err) {
      console.error(`onApplicationDeleted[${applicationId}]: FAILED to list Storage prefix applications/${applicationId}/:`, err.code || err.message);
    }

    console.log(`onApplicationDeleted[${applicationId}]: found ${storagePaths.size} Storage object(s) to remove:`, [...storagePaths]);
    for (const path of storagePaths) {
      try {
        await admin.storage().bucket().file(path).delete();
        summary.storage.push({ path, deleted: true });
        console.log(`onApplicationDeleted[${applicationId}]: deleted storage://${path}`);
      } catch (err) {
        // A 404 here just means the file was already gone (idempotent re-run, or it was
        // never actually written) — log it as such rather than a hard failure.
        if (err.code === 404) {
          summary.storage.push({ path, deleted: true, note: "already missing" });
          console.log(`onApplicationDeleted[${applicationId}]: storage://${path} already missing (no-op).`);
        } else {
          summary.storage.push({ path, deleted: false, error: err.code || err.message });
          console.error(`onApplicationDeleted[${applicationId}]: FAILED to delete storage://${path}:`, err.code || err.message);
        }
      }
    }

    const failures = [
      ...summary.documents.filter((r) => r.deleted === false),
      ...summary.visaCases.filter((r) => r.deleted === false),
      ...summary.notifications.filter((r) => r.deleted === false),
      ...summary.storage.filter((r) => r.deleted === false),
    ];
    console.log(
      `onApplicationDeleted[${applicationId}]: cascade cleanup complete — ` +
      `documents=${summary.documents.length} visa_cases=${summary.visaCases.length} ` +
      `notifications=${summary.notifications.length} storage=${summary.storage.length} ` +
      `failures=${failures.length}`
    );
    if (failures.length > 0) {
      console.error(`onApplicationDeleted[${applicationId}]: ${failures.length} child cleanup(s) FAILED:`, JSON.stringify(failures));
    }

    return null;
  });

// ===========================================================================
// 10. AI Document Verification (Google Cloud Vision)
// ---------------------------------------------------------------------------
// Triggered when a client uploads a mandatory document (Passport, Photographs,
// UAE Residence Visa, Emirates ID). The client SDK has already
// stored the file in Firebase Storage and created a documents/{docId} record
// with status "ai_processing". This function:
//   1. OCRs the file with Vision DOCUMENT_TEXT_DETECTION.
//   2. Extracts the expiry date for Passport / UAE Residence Visa / Emirates ID.
//   3. Rejects expired documents; flags passports expiring in < 6 months.
//   4. Scores blur (Vision blur likelihood where available + a Laplacian-variance
//      fallback computed with Jimp).
//   5. Writes aiCheck.{checked,result,reason,extractedText,expiryDate,blurScore,
//      confidence} and sets the document status.
//
// Status rules:
//   verified     = clear OCR, valid expiry (where applicable), readable image
//   rejected     = expired OR clearly blurry
//   needs_review = OCR unclear, expiry date not found, or low confidence
//
// Consultants/admins can always override the status afterwards: this function
// only writes once (onCreate) and never re-runs on later manual status edits.
// ---------------------------------------------------------------------------

// Document-type keyword matcher (mirrors src/utils/mandatoryDocuments.js — kept
// inline because functions are CommonJS and cannot import the frontend ESM util).
// Bank Statements are NOT mandatory and are intentionally excluded here so they
// are uploaded as optional supporting documents without AI verification.
const AI_MANDATORY_CATEGORIES = [
  { key: "passport", match: ["passport"], needsExpiry: true, isPhoto: false },
  { key: "photographs", match: ["photograph", "photo"], needsExpiry: false, isPhoto: true },
  { key: "uae_residence_visa", match: ["uae residence", "residence visa", "residence permit"], needsExpiry: true, isPhoto: false },
  { key: "emirates_id", match: ["emirates"], needsExpiry: true, isPhoto: false },
];

function resolveDocCategory(docData) {
  const haystack = [docData.docType, docData.type, docData.key, docData.fileName, docData.name]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return AI_MANDATORY_CATEGORIES.find((c) => c.match.some((kw) => haystack.includes(kw))) || null;
}

const MONTHS = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

// Parse a wide range of date formats found on travel documents into a Date (UTC).
function parseDateToken(token) {
  if (!token) return null;
  const t = token.trim();

  // DD MMM YYYY  (e.g. "12 JAN 2027", "12-JAN-2027") — common on passports/EID.
  let m = t.match(/(\d{1,2})[\s\-/.]+([A-Za-z]{3,})[\s\-/.]+(\d{4})/);
  if (m) {
    const mon = MONTHS[m[2].slice(0, 3).toLowerCase()];
    if (mon !== undefined) return new Date(Date.UTC(+m[3], mon, +m[1]));
  }
  // YYYY-MM-DD / YYYY.MM.DD / YYYY/MM/DD
  m = t.match(/(\d{4})[\-/.](\d{1,2})[\-/.](\d{1,2})/);
  if (m) return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  // DD/MM/YYYY / DD-MM-YYYY / DD.MM.YYYY  (UAE/EU day-first convention)
  m = t.match(/(\d{1,2})[\-/.](\d{1,2})[\-/.](\d{4})/);
  if (m) return new Date(Date.UTC(+m[3], +m[2] - 1, +m[1]));
  return null;
}

// Collect every date-like substring in the OCR text with its raw match.
function findAllDates(text) {
  const patterns = [
    /\d{1,2}[\s\-/.]+[A-Za-z]{3,}[\s\-/.]+\d{4}/g,
    /\d{4}[\-/.]\d{1,2}[\-/.]\d{1,2}/g,
    /\d{1,2}[\-/.]\d{1,2}[\-/.]\d{4}/g,
  ];
  const out = [];
  for (const re of patterns) {
    let mm;
    while ((mm = re.exec(text)) !== null) {
      const d = parseDateToken(mm[0]);
      if (d && !isNaN(d.getTime())) out.push({ raw: mm[0], date: d, index: mm.index });
    }
  }
  return out;
}

// Extract the expiry date. Prefer a date that sits near an expiry keyword;
// otherwise fall back to the latest date found (expiry is usually the furthest
// out). Returns { date, viaKeyword } or null.
function extractExpiryDate(text) {
  if (!text) return null;
  const lower = text.toLowerCase();
  const all = findAllDates(text);
  if (all.length === 0) return null;

  const keywords = ["expiry", "expire", "expires", "valid until", "date of expiry", "exp ", "exp.", "valid till", "valid thru"];
  let best = null;
  for (const kw of keywords) {
    let from = 0;
    let idx;
    while ((idx = lower.indexOf(kw, from)) !== -1) {
      // Find the date whose position is closest AFTER the keyword (within 40 chars).
      const near = all
        .filter((d) => d.index >= idx && d.index - idx < 40)
        .sort((a, b) => a.index - b.index)[0];
      if (near && (!best || near.index < best.index)) best = near;
      from = idx + kw.length;
    }
  }
  if (best) return { date: best.date, viaKeyword: true };

  // Fallback: latest date in the document.
  const latest = all.sort((a, b) => b.date - a.date)[0];
  return { date: latest.date, viaKeyword: false };
}

// Average OCR confidence from the Vision fullTextAnnotation page/block tree.
function computeOcrConfidence(fullTextAnnotation) {
  if (!fullTextAnnotation || !Array.isArray(fullTextAnnotation.pages)) return null;
  const confs = [];
  for (const page of fullTextAnnotation.pages) {
    if (typeof page.confidence === "number") confs.push(page.confidence);
    for (const block of page.blocks || []) {
      if (typeof block.confidence === "number") confs.push(block.confidence);
    }
  }
  if (confs.length === 0) return null;
  return confs.reduce((a, b) => a + b, 0) / confs.length;
}

// Laplacian-variance blur score via Jimp (pure-JS OpenCV-style fallback). Higher
// variance = sharper image; low variance = blurry. Returns null if Jimp is not
// available or the buffer can't be decoded (e.g. PDFs).
async function computeLaplacianBlurScore(buffer) {
  let Jimp;
  try {
    // Lazy-require so a missing/optional dependency never breaks the deploy or the
    // other functions in this file at module load.
    Jimp = require("jimp");
  } catch (e) {
    console.warn("aiVerifyDocument: jimp not installed; skipping Laplacian blur fallback.");
    return null;
  }
  try {
    const image = await Jimp.read(buffer);
    image.grayscale();
    const { width, height, data } = image.bitmap;
    // Convolve with the Laplacian kernel and accumulate variance of the response.
    let sum = 0;
    let sumSq = 0;
    let count = 0;
    const lum = (x, y) => data[(y * width + x) * 4]; // grayscale → R channel
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const l =
          -4 * lum(x, y) +
          lum(x - 1, y) + lum(x + 1, y) + lum(x, y - 1) + lum(x, y + 1);
        sum += l;
        sumSq += l * l;
        count++;
      }
    }
    if (count === 0) return null;
    const mean = sum / count;
    const variance = sumSq / count - mean * mean;
    return Math.round(variance * 100) / 100;
  } catch (e) {
    console.warn("aiVerifyDocument: Laplacian blur computation failed:", e.message);
    return null;
  }
}

const VISION_BLUR_LIKELIHOOD_BLURRY = ["LIKELY", "VERY_LIKELY"];
// Laplacian-variance thresholds (tuned for typical phone scans of documents).
const BLUR_HARD_REJECT = 50;   // below this → clearly blurry → reject
const BLUR_SOFT_REVIEW = 120;  // 50–120 → borderline → needs_review
const OCR_CONFIDENCE_MIN = 0.6;
const PASSPORT_MIN_MONTHS = 6;

// ===========================================================================
// Structured field extraction + profile matching (non-blocking flagging)
// ---------------------------------------------------------------------------
// After OCR we extract identity fields from the document text and compare them
// to the client's saved profile (user_profiles/{uid}). This is FLAGGING ONLY:
// nothing here changes the document's verified/rejected/needs_review status or
// blocks the application. Results are written to aiCheck.extractedFields and a
// separate profileMatch block for consultants to review.
// ---------------------------------------------------------------------------

const ISO = (d) => (d instanceof Date && !isNaN(d.getTime()) ? d.toISOString().slice(0, 10) : "");

// Return the text on/after a labelled keyword (same line), e.g. "Nationality: INDIAN".
function valueAfterLabel(text, labels) {
  const lines = text.split(/\n+/);
  for (const raw of lines) {
    const line = raw.trim();
    const lower = line.toLowerCase();
    for (const label of labels) {
      const idx = lower.indexOf(label);
      if (idx !== -1) {
        const after = line.slice(idx + label.length).replace(/^[\s:.\-]+/, "").trim();
        if (after) return after;
      }
    }
  }
  return "";
}

// Parse the two-line passport MRZ (TD3). Line 1: P<ISSUER<SURNAME<<GIVEN<NAMES.
// Line 2: PASSPORTNO(9) checkdigit NATIONALITY(3) YYMMDD(birth) ... YYMMDD(expiry).
function parseMrz(text) {
  const lines = text.split(/\n+/).map((l) => l.replace(/\s+/g, "").trim());
  const l1 = lines.find((l) => /^P[<A-Z0-9]/.test(l) && l.includes("<<"));
  const l2 = lines.find((l) => /^[A-Z0-9<]{30,}$/.test(l) && l !== l1 && /\d/.test(l));
  const out = {};
  if (l1) {
    const body = l1.replace(/^P[A-Z<]?/, "");
    const parts = body.split("<<");
    if (parts.length >= 2) {
      const surname = (parts[0] || "").replace(/^[A-Z]{3}/, "").replace(/</g, " ").trim();
      const given = (parts[1] || "").replace(/</g, " ").trim();
      const full = `${given} ${surname}`.replace(/\s+/g, " ").trim();
      if (full) out.fullName = full;
    }
  }
  if (l2) {
    const passportNo = l2.slice(0, 9).replace(/</g, "").trim();
    if (passportNo && /[A-Z0-9]/.test(passportNo)) out.passportNumber = passportNo;
    const nat = l2.slice(10, 13).replace(/</g, "").trim();
    if (/^[A-Z]{3}$/.test(nat)) out.nationalityCode = nat;
    const yymmdd = (s) => {
      if (!/^\d{6}$/.test(s)) return null;
      let yy = +s.slice(0, 2);
      const mm = +s.slice(2, 4);
      const dd = +s.slice(4, 6);
      if (mm < 1 || mm > 12 || dd < 1 || dd > 31) return null;
      const year = yy <= 30 ? 2000 + yy : 1900 + yy;
      return new Date(Date.UTC(year, mm - 1, dd));
    };
    const dob = yymmdd(l2.slice(13, 19));
    if (dob) out.dateOfBirth = ISO(dob);
    const exp = yymmdd(l2.slice(21, 27));
    if (exp) out.passportExpiryDate = ISO(exp);
    const sex = l2.charAt(20);
    if (sex === "M" || sex === "F") out.gender = sex === "M" ? "male" : "female";
  }
  return out;
}

// ISO-3 country code → country name (only the variants common to UAE residents;
// extend as needed). Used to resolve MRZ nationality codes.
const COUNTRY_CODES = {
  IND: "India", PAK: "Pakistan", BGD: "Bangladesh", LKA: "Sri Lanka", NPL: "Nepal",
  PHL: "Philippines", EGY: "Egypt", JOR: "Jordan", SYR: "Syria", LBN: "Lebanon",
  GBR: "United Kingdom", USA: "United States", ARE: "United Arab Emirates",
  SAU: "Saudi Arabia", NGA: "Nigeria", KEN: "Kenya", ZAF: "South Africa",
  CHN: "China", RUS: "Russia", FRA: "France", DEU: "Germany", ITA: "Italy",
};

// Extract structured identity fields for the given document category. Only
// confidently-parsed values are returned; unclear fields are simply omitted so
// the comparison treats them as "missing" rather than inventing a value.
function extractStructuredFields(text, category, expiryDate) {
  if (!text) return {};
  const fields = {};
  const mrz = category.key === "passport" ? parseMrz(text) : {};

  // Names (passport relies on MRZ; otherwise a labelled "name" line).
  if (mrz.fullName) {
    fields.fullName = mrz.fullName;
  } else {
    const n = valueAfterLabel(text, ["full name", "name"]);
    if (n && /[a-z]/i.test(n) && n.length >= 3 && n.length <= 60) fields.fullName = n;
  }

  // Date of birth.
  if (mrz.dateOfBirth) {
    fields.dateOfBirth = mrz.dateOfBirth;
  } else {
    const dobRaw = valueAfterLabel(text, ["date of birth", "birth date", "dob"]);
    const dob = dobRaw ? parseDateToken(dobRaw) : null;
    if (dob) fields.dateOfBirth = ISO(dob);
  }

  // Nationality.
  if (mrz.nationalityCode && COUNTRY_CODES[mrz.nationalityCode]) {
    fields.nationality = COUNTRY_CODES[mrz.nationalityCode];
  } else {
    const nat = valueAfterLabel(text, ["nationality"]);
    if (nat && /[a-z]/i.test(nat) && nat.length <= 40) fields.nationality = nat.split(/\s{2,}|\|/)[0].trim();
  }

  // Gender.
  if (mrz.gender) {
    fields.gender = mrz.gender;
  } else {
    const sx = valueAfterLabel(text, ["sex", "gender"]).toLowerCase();
    if (/^m\b|male/.test(sx)) fields.gender = "male";
    else if (/^f\b|female/.test(sx)) fields.gender = "female";
  }

  if (category.key === "passport") {
    if (mrz.passportNumber) {
      fields.passportNumber = mrz.passportNumber;
    } else {
      const pn = valueAfterLabel(text, ["passport no", "passport number", "document no"]);
      const m = pn.match(/[A-Z0-9]{6,9}/i);
      if (m) fields.passportNumber = m[0].toUpperCase();
    }
    if (mrz.passportExpiryDate) fields.passportExpiryDate = mrz.passportExpiryDate;
    else if (expiryDate) fields.passportExpiryDate = ISO(expiryDate);
  }

  if (category.key === "emirates_id") {
    const m = text.match(/784[-\s]?\d{4}[-\s]?\d{7}[-\s]?\d/);
    if (m) fields.emiratesIdNumber = m[0];
  }

  if (category.key === "uae_residence_visa") {
    // UAE residence visa "file number" — digit groups separated by slashes,
    // or a labelled file/U.I.D number.
    const labelled = valueAfterLabel(text, ["file no", "file number", "u.i.d", "uid no", "visa no", "visa number"]);
    const slashed = text.match(/\b\d{2,4}\/\d{2,4}\/\d{4,8}\b/);
    if (labelled) {
      const m = labelled.match(/[0-9/\-]{6,}/);
      if (m) fields.residenceVisaNumber = m[0];
    }
    if (!fields.residenceVisaNumber && slashed) fields.residenceVisaNumber = slashed[0];
    if (expiryDate) fields.residenceVisaExpiryDate = ISO(expiryDate);
  }

  return fields;
}

// ---- Normalizers ----
const normName = (s) => String(s || "").toLowerCase().replace(/[^a-z\s]/g, " ").replace(/\s+/g, " ").trim();
const normId = (s) => String(s || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
const normGender = (s) => {
  const t = String(s || "").toLowerCase().trim();
  if (t.startsWith("m")) return "male";
  if (t.startsWith("f")) return "female";
  return "";
};
function normDate(s) {
  if (!s) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const d = parseDateToken(String(s));
  return d ? ISO(d) : "";
}
// Name match: tolerant of word order and extra middle names. True when the
// smaller token set is fully contained in the larger.
function namesMatch(a, b) {
  const ta = normName(a).split(" ").filter(Boolean);
  const tb = normName(b).split(" ").filter(Boolean);
  if (ta.length === 0 || tb.length === 0) return null;
  const [small, large] = ta.length <= tb.length ? [ta, tb] : [tb, ta];
  const set = new Set(large);
  return small.every((tok) => set.has(tok));
}
// Nationality match: equal, demonym/country variants (India/Indian), or shared
// 4-letter stem. Leans toward match to avoid false mismatches (non-blocking).
function nationalityMatch(a, b) {
  const na = String(a || "").toLowerCase().trim();
  const nb = String(b || "").toLowerCase().trim();
  if (!na || !nb) return null;
  if (na === nb) return true;
  const stem = (s) => s.replace(/(ian|ese|ish|i|n)$/, "");
  if (stem(na) === stem(nb)) return true;
  if (na.slice(0, 4) === nb.slice(0, 4) && na.length >= 4 && nb.length >= 4) return true;
  return false;
}

// Field-level comparison config per category. severity: high = identity-defining.
const PROFILE_FIELD_MAP = {
  fullName: { severity: "medium", get: (p) => [p?.personalInformation?.givenName, p?.personalInformation?.middleName, p?.personalInformation?.surname].filter(Boolean).join(" ").trim(), cmp: "name", reason: "Name does not match client profile" },
  dateOfBirth: { severity: "high", get: (p) => p?.personalInformation?.dateOfBirth, cmp: "date", reason: "Date of birth does not match client profile" },
  nationality: { severity: "medium", get: (p) => p?.personalInformation?.currentNationality, cmp: "nationality", reason: "Nationality does not match client profile" },
  gender: { severity: "low", get: (p) => p?.personalInformation?.gender, cmp: "gender", reason: "Gender does not match client profile" },
  passportNumber: { severity: "high", get: (p) => p?.passportInformation?.passportNumber, cmp: "id", reason: "Passport number does not match client profile" },
  passportExpiryDate: { severity: "medium", get: (p) => p?.passportInformation?.dateOfExpiry, cmp: "date", reason: "Passport expiry date does not match client profile" },
  emiratesIdNumber: { severity: "high", get: (p) => p?.uaeResidenceInformation?.emiratesId, cmp: "id", reason: "Emirates ID number does not match client profile" },
  residenceVisaNumber: { severity: "high", get: (p) => p?.uaeResidenceInformation?.residenceVisaNumber || p?.uaeResidenceInformation?.unifiedNumber, cmp: "id", reason: "Residence visa number does not match client profile" },
  residenceVisaExpiryDate: { severity: "medium", get: (p) => p?.uaeResidenceInformation?.visaExpiryDate, cmp: "date", reason: "Residence visa expiry date does not match client profile" },
};

const CATEGORY_FIELDS = {
  passport: ["fullName", "dateOfBirth", "nationality", "passportNumber", "passportExpiryDate", "gender"],
  emirates_id: ["fullName", "dateOfBirth", "nationality", "emiratesIdNumber", "gender"],
  uae_residence_visa: ["fullName", "nationality", "residenceVisaNumber", "residenceVisaExpiryDate"],
};

function compareOne(cmp, profileVal, docVal) {
  switch (cmp) {
    case "name": return namesMatch(profileVal, docVal);
    case "date": {
      const a = normDate(profileVal); const b = normDate(docVal);
      if (!a || !b) return null;
      return a === b;
    }
    case "id": {
      const a = normId(profileVal); const b = normId(docVal);
      if (!a || !b) return null;
      return a === b;
    }
    case "nationality": return nationalityMatch(profileVal, docVal);
    case "gender": {
      const a = normGender(profileVal); const b = normGender(docVal);
      if (!a || !b) return null;
      return a === b;
    }
    default: return null;
  }
}

// Build the profileMatch result. Returns { status, mismatches, matchedFields,
// missingFields }. needs_review when no profile, low confidence, or nothing
// could be compared.
function compareProfile(extractedFields, profile, category, confidence) {
  const base = { mismatches: [], matchedFields: [], missingFields: [] };
  if (!profile) return { ...base, status: "needs_review" };
  if (confidence !== null && confidence < OCR_CONFIDENCE_MIN) return { ...base, status: "needs_review" };

  const fieldsForCat = CATEGORY_FIELDS[category.key] || [];
  let comparedCount = 0;

  for (const field of fieldsForCat) {
    const cfg = PROFILE_FIELD_MAP[field];
    if (!cfg) continue;
    const profileVal = cfg.get(profile);
    const docVal = extractedFields[field];

    if (!docVal || !profileVal) {
      // Missing/unclear on either side → never a mismatch; flag for review.
      base.missingFields.push(field);
      continue;
    }
    const res = compareOne(cfg.cmp, profileVal, docVal);
    if (res === null) {
      base.missingFields.push(field);
      continue;
    }
    comparedCount++;
    if (res) {
      base.matchedFields.push(field);
    } else {
      base.mismatches.push({
        field,
        profileValue: String(profileVal),
        documentValue: String(docVal),
        severity: cfg.severity,
        reason: cfg.reason,
      });
    }
  }

  let status;
  if (comparedCount === 0) status = "needs_review";
  else if (base.mismatches.length > 0) status = "mismatch";
  else if (base.missingFields.length > 0) status = "partial";
  else status = "matched";

  return { ...base, status };
}

// Core verification routine, shared by the onCreate trigger and the manual
// reprocess callable. `opts.force` re-runs even if aiCheck.checked is already set.
async function verifyDocumentAi(docRef, data, docId, opts = {}) {
    // Only process the four mandatory document categories.
    const category = resolveDocCategory(data);
    if (!category) {
      return null;
    }
    // Safety: never reprocess if a result already exists (e.g. backfills),
    // unless an admin explicitly forces a re-run.
    if (!opts.force && data.aiCheck && data.aiCheck.checked) {
      return null;
    }
    if (!data.storageKey) {
      await docRef.update({
        status: "needs_review",
        verificationStatus: "Needs Review",
        aiCheck: {
          checked: true,
          result: "needs_review",
          reason: "No stored file reference (storageKey) to analyze.",
          reasonCode: "manual_review_required",
          extractedText: "",
          extractedFields: {},
          expiryDate: null,
          blurScore: null,
          confidence: null,
          category: category.key,
          checkedAt: FieldValue.serverTimestamp(),
        },
        profileMatch: { checked: true, status: "needs_review", mismatches: [], matchedFields: [], missingFields: [], checkedAt: FieldValue.serverTimestamp() },
        requiresManualReview: true,
      });
      return null;
    }

    // Lazy-require Vision so the rest of the functions load even before
    // `npm install` adds the dependency.
    let vision;
    try {
      vision = require("@google-cloud/vision");
    } catch (e) {
      console.error("aiVerifyDocument: @google-cloud/vision not installed.", e.message);
      await docRef.update({
        status: "needs_review",
        verificationStatus: "Needs Review",
        aiCheck: {
          checked: true,
          result: "needs_review",
          reason: "AI verification dependency unavailable; manual review required.",
          reasonCode: "manual_review_required",
          extractedText: "",
          extractedFields: {},
          expiryDate: null,
          blurScore: null,
          confidence: null,
          category: category.key,
          checkedAt: FieldValue.serverTimestamp(),
        },
        profileMatch: { checked: true, status: "needs_review", mismatches: [], matchedFields: [], missingFields: [], checkedAt: FieldValue.serverTimestamp() },
        requiresManualReview: true,
      });
      return null;
    }

    const client = new vision.ImageAnnotatorClient();
    const mime = (data.mimeType || "").toLowerCase();
    const isPdf = mime.includes("pdf") || (data.fileName || "").toLowerCase().endsWith(".pdf");

    try {
      // ---- Download the uploaded file from Storage ----
      const bucket = admin.storage().bucket();
      const [buffer] = await bucket.file(data.storageKey).download();

      // ---- OCR (DOCUMENT_TEXT_DETECTION) ----
      let fullText = "";
      let fullTextAnnotation = null;
      let faceAnnotations = [];

      if (isPdf) {
        // PDFs go through batchAnnotateFiles with inline content.
        const [result] = await client.batchAnnotateFiles({
          requests: [
            {
              inputConfig: { content: buffer, mimeType: "application/pdf" },
              features: [{ type: "DOCUMENT_TEXT_DETECTION" }],
              pages: [1, 2, 3, 4, 5],
            },
          ],
        });
        const responses = result.responses?.[0]?.responses || [];
        fullText = responses.map((r) => r.fullTextAnnotation?.text || "").join("\n");
        fullTextAnnotation = responses[0]?.fullTextAnnotation || null;
      } else {
        const [result] = await client.documentTextDetection({ image: { content: buffer } });
        fullTextAnnotation = result.fullTextAnnotation || null;
        fullText = (fullTextAnnotation && fullTextAnnotation.text) || "";
        // Face blur likelihood is only meaningful for photographs.
        if (category.isPhoto) {
          const [faceResult] = await client.faceDetection({ image: { content: buffer } });
          faceAnnotations = faceResult.faceAnnotations || [];
        }
      }

      const extractedText = (fullText || "").slice(0, 5000);
      const confidence = computeOcrConfidence(fullTextAnnotation);

      // ---- Blur detection ----
      // Vision blur likelihood (faces) where available + Laplacian fallback.
      let visionBlurry = false;
      if (faceAnnotations.length > 0) {
        visionBlurry = faceAnnotations.some((f) =>
          VISION_BLUR_LIKELIHOOD_BLURRY.includes(f.blurredLikelihood)
        );
      }
      const blurScore = isPdf ? null : await computeLaplacianBlurScore(buffer);

      // ---- Expiry extraction & validation ----
      const now = new Date();
      let expiryDate = null;
      let expiryFound = false;
      let expiryViaKeyword = false;
      let expired = false;
      let passportExpiringSoon = false;

      if (category.needsExpiry) {
        const exp = extractExpiryDate(fullText);
        if (exp) {
          expiryDate = exp.date;
          expiryFound = true;
          expiryViaKeyword = exp.viaKeyword;
          expired = expiryDate.getTime() < now.getTime();
          if (category.key === "passport" && !expired) {
            const sixMonths = new Date(now);
            sixMonths.setMonth(sixMonths.getMonth() + PASSPORT_MIN_MONTHS);
            passportExpiringSoon = expiryDate.getTime() < sixMonths.getTime();
          }
        }
      }

      // ---- Decision ----
      let result = "verified";
      const reasons = [];
      // Stable, internal reason code for the outcome. Never shown to clients
      // directly — the client portal translates it to a friendly message via the
      // central mapping (src/utils/documentStatusMessages.js). Admins see the raw
      // aiCheck details unchanged.
      let reasonCode = null;
      const expiredCode = category.key === "passport" ? "expired_passport"
        : category.key === "emirates_id" ? "expired_emirates_id"
        : category.key === "uae_residence_visa" ? "expired_residence_visa"
        : "expired_document";

      const hasText = extractedText.trim().length > 0;
      const lowConfidence = confidence !== null && confidence < OCR_CONFIDENCE_MIN;
      const clearlyBlurry =
        visionBlurry || (blurScore !== null && blurScore < BLUR_HARD_REJECT);
      const borderlineBlurry =
        blurScore !== null && blurScore >= BLUR_HARD_REJECT && blurScore < BLUR_SOFT_REVIEW;

      if (category.needsExpiry && expired) {
        result = "rejected";
        reasonCode = expiredCode;
        reasons.push(`Document expired on ${expiryDate.toISOString().slice(0, 10)}.`);
      } else if (clearlyBlurry) {
        result = "rejected";
        reasonCode = "blurry_document";
        reasons.push("Image is too blurry to read clearly.");
      } else if (!hasText && !category.isPhoto) {
        result = "needs_review";
        reasonCode = "unreadable_document";
        reasons.push("No readable text could be extracted.");
      } else if (category.needsExpiry && !expiryFound) {
        result = "needs_review";
        reasonCode = "manual_review_required";
        reasons.push("Expiry date could not be found.");
      } else if (lowConfidence) {
        result = "needs_review";
        reasonCode = "manual_review_required";
        reasons.push("OCR confidence is low; manual review recommended.");
      } else if (passportExpiringSoon) {
        result = "needs_review";
        reasonCode = "passport_expiring_soon";
        reasons.push(`Passport expires in less than ${PASSPORT_MIN_MONTHS} months.`);
      } else if (borderlineBlurry) {
        result = "needs_review";
        reasonCode = "manual_review_required";
        reasons.push("Image sharpness is borderline; please verify legibility.");
      } else if (category.needsExpiry && !expiryViaKeyword) {
        // Expiry was guessed (latest date) rather than read next to a keyword.
        result = "needs_review";
        reasonCode = "manual_review_required";
        reasons.push("Expiry date inferred without a clear label; please confirm.");
      }

      if (result === "verified") {
        reasons.push("Clear OCR, readable image, and valid expiry where applicable.");
      }

      // Map the AI result to the document status. "verified"/"rejected"/
      // "needs_review" are consumed by the portal Documents checklist.
      const verificationStatusLabel =
        result === "verified" ? "Verified" : result === "rejected" ? "Rejected" : "Needs Review";

      // ---- Structured extraction + profile matching (non-blocking flagging) ----
      // Only the three identity documents are compared against the profile.
      let extractedFields = {};
      let profileMatch = { checked: true, status: "needs_review", mismatches: [], matchedFields: [], missingFields: [], checkedAt: FieldValue.serverTimestamp() };
      const comparesToProfile = ["passport", "emirates_id", "uae_residence_visa"].includes(category.key);

      if (comparesToProfile) {
        extractedFields = extractStructuredFields(fullText, category, expiryDate);
        // Resolve the client profile (user_profiles/{uid}); travellerId is the uid.
        let profile = null;
        try {
          const profileId = data.travellerId || data.uploadedBy;
          if (profileId) {
            const profileSnap = await db.collection("user_profiles").doc(profileId).get();
            if (profileSnap.exists) profile = profileSnap.data();
          }
        } catch (profileErr) {
          console.warn(`aiVerifyDocument: profile fetch failed for ${docId}:`, profileErr.message);
        }
        const cmp = compareProfile(extractedFields, profile, category, confidence);
        profileMatch = { checked: true, ...cmp, checkedAt: FieldValue.serverTimestamp() };
      }

      // Mismatch (or any non-clean match) flags the document for manual consultant
      // review. This NEVER changes the verified/rejected AI status or blocks anything.
      const requiresManualReview =
        comparesToProfile && profileMatch.status !== "matched";

      await docRef.update({
        status: result,
        verificationStatus: verificationStatusLabel,
        requiresManualReview,
        rejectionReasonCode: result === "rejected" ? reasonCode : null,
        aiCheck: {
          checked: true,
          result,
          reason: reasons.join(" "),
          reasonCode,
          extractedText,
          extractedFields,
          expiryDate: expiryDate ? admin.firestore.Timestamp.fromDate(expiryDate) : null,
          blurScore,
          confidence,
          category: category.key,
          expiringSoon: passportExpiringSoon,
          visionBlurry,
          checkedAt: FieldValue.serverTimestamp(),
        },
        profileMatch,
      });

      console.log(`aiVerifyDocument: ${docId} (${category.key}) → ${result}; profileMatch=${profileMatch.status}. ${reasons.join(" ")}`);
    } catch (err) {
      console.error(`aiVerifyDocument: error processing ${docId}:`, err);
      // Fail to needs_review so a human checks it; never leave it stuck in ai_processing.
      try {
        await docRef.update({
          status: "needs_review",
          verificationStatus: "Needs Review",
          aiCheck: {
            checked: true,
            result: "needs_review",
            reason: `Automated verification failed: ${err.message}. Manual review required.`,
            reasonCode: "manual_review_required",
            extractedText: "",
            extractedFields: {},
            expiryDate: null,
            blurScore: null,
            confidence: null,
            category: category.key,
            checkedAt: FieldValue.serverTimestamp(),
          },
          profileMatch: { checked: true, status: "needs_review", mismatches: [], matchedFields: [], missingFields: [], checkedAt: FieldValue.serverTimestamp() },
          requiresManualReview: true,
        });
      } catch (updateErr) {
        console.error("aiVerifyDocument: failed to write error state:", updateErr);
      }
    }

    return null;
}

// Firestore onCreate trigger — runs verification when a document is uploaded.
exports.aiVerifyDocument = functions
  .runWith({ timeoutSeconds: 120, memory: "1GB" })
  .firestore.document("documents/{docId}")
  .onCreate(async (snap, context) => {
    return verifyDocumentAi(snap.ref, snap.data() || {}, context.params.docId);
  });

// ---------------------------------------------------------------------------
// 10b. Manual reprocess (admin/manager callable)
// ---------------------------------------------------------------------------
// Re-runs AI verification for a single stuck/failed document. Used by the admin
// "Re-run AI" button. Forces a re-run even if aiCheck.checked is already set.
// Falls back to marking the document needs_review if verification throws, so a
// document is never left stuck in ai_processing.
exports.reprocessDocument = functions
  .runWith({ timeoutSeconds: 120, memory: "1GB" })
  .https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError("unauthenticated", "Authentication required.");
    }
    // Manager-level (super_admin/admin/manager) or visa_ops may reprocess.
    let callerDoc = await db.collection("users").doc(context.auth.uid).get();
    if (!callerDoc.exists && context.auth.token && context.auth.token.email) {
      callerDoc = await db.collection("users").doc(context.auth.token.email.toLowerCase()).get();
    }
    const role = callerDoc.exists ? callerDoc.data().role : null;
    if (!["super_admin", "admin", "manager", "visa_ops"].includes(role)) {
      throw new functions.https.HttpsError("permission-denied", "Staff access required.");
    }

    const docId = data && data.docId;
    if (!docId) {
      throw new functions.https.HttpsError("invalid-argument", "Missing docId.");
    }
    const docRef = db.collection("documents").doc(docId);
    const snap = await docRef.get();
    if (!snap.exists) {
      throw new functions.https.HttpsError("not-found", "Document not found.");
    }

    try {
      await verifyDocumentAi(docRef, snap.data() || {}, docId, { force: true });
      const after = await docRef.get();
      return { success: true, status: after.data()?.status || null };
    } catch (err) {
      console.error(`reprocessDocument: ${docId} failed:`, err);
      // Never leave it stuck — fall back to needs_review.
      await docRef.update({
        status: "needs_review",
        verificationStatus: "Needs Review",
        requiresManualReview: true,
      }).catch(() => {});
      return { success: false, status: "needs_review", error: err.message };
    }
  });

// ---------------------------------------------------------------------------
// 10c. Scheduled sweeper — timeout fallback for stuck ai_processing documents
// ---------------------------------------------------------------------------
// Safety net: if the onCreate trigger ever fails to run, times out, or the
// document is otherwise left in "ai_processing" for more than 10 minutes, this
// scheduled job flips it to "needs_review" so a consultant reviews it manually.
// A document is never left stuck. This does NOT block applying.
const STUCK_THRESHOLD_MINUTES = 10;
exports.sweepStuckAiDocuments = functions.pubsub
  .schedule("every 10 minutes")
  .onRun(async () => {
    const cutoff = new Date(Date.now() - STUCK_THRESHOLD_MINUTES * 60 * 1000);
    try {
      const snap = await db
        .collection("documents")
        .where("status", "==", "ai_processing")
        .get();
      if (snap.empty) return null;

      const batch = db.batch();
      let count = 0;
      snap.forEach((d) => {
        const data = d.data() || {};
        const created = data.createdAt && typeof data.createdAt.toDate === "function"
          ? data.createdAt.toDate()
          : (data.createdAt ? new Date(data.createdAt) : null);
        // Only sweep documents that have been stuck longer than the threshold.
        if (created && created > cutoff) return;
        batch.update(d.ref, {
          status: "needs_review",
          verificationStatus: "Needs Review",
          requiresManualReview: true,
          aiCheck: Object.assign({}, data.aiCheck || {}, {
            checked: true,
            result: "needs_review",
            reason: "AI verification did not complete in time; flagged for manual review.",
            reasonCode: "manual_review_required",
            checkedAt: FieldValue.serverTimestamp(),
          }),
        });
        count++;
      });
      if (count > 0) {
        await batch.commit();
        console.log(`sweepStuckAiDocuments: flipped ${count} stuck document(s) to needs_review.`);
      }
    } catch (err) {
      console.error("sweepStuckAiDocuments error:", err);
    }
    return null;
  });

// ===========================================================================
// 11. Read-Only Database Integrity Audit
// ---------------------------------------------------------------------------
// Detects orphan records, broken references, duplicate emails/applications,
// and orphaned Storage files — the same categories investigated in
// DATABASE_ROOT_CAUSE_ANALYSIS.md. Ported from the read-only
// scripts/maintenance/audit-database.cjs CLI tool so both entry points share
// one definition of "what counts as an issue."
//
// STRICTLY READ-ONLY: every call in `computeIntegrityAudit` is a `.get()`,
// `listUsers()`, or `bucket.getFiles()` read. It never calls `.set()`,
// `.update()`, `.delete()`, or any Storage write/delete. The only output is a
// structured object that both callers below log via `console.log` — nothing
// is written back to Firestore or Storage. This is intentionally a stricter
// posture than DATABASE_FIX_IMPLEMENTATION_PLAN.md's "Minimal fix" (which
// proposed persisting a summary to an `integrity_reports` collection); that
// persistence step is deliberately deferred to a later phase so this pass
// makes zero writes of any kind.
//
// It does NOT delete, flag, or modify any orphaned/broken record it finds —
// it only reports. Cascading cleanup remains a separate, not-yet-implemented
// phase (see DATABASE_FIX_IMPLEMENTATION_PLAN.md Items 3/4).
// ---------------------------------------------------------------------------

const INTEGRITY_AUDIT_COLLECTIONS = [
  "users", "customers", "user_profiles", "applications", "visa_cases",
  "documents", "payments", "bookings", "appointments", "notifications",
  "audit_logs", "chats", "leads",
];

// Storage prefixes that hold public/system assets rather than user-owned
// uploads — excluded from the orphan-file list (mirrors audit-database.cjs).
const INTEGRITY_AUDIT_PUBLIC_STORAGE_PREFIXES = [
  "system-documents/", "visa_banners/", "staff_pics/", "expert_pics/",
];

function integrityAuditNormEmail(e) {
  return e ? String(e).trim().toLowerCase() : "";
}

// Caps how many example IDs are kept per issue category in the returned
// summary, so a badly-orphaned project still produces a log-sized report.
const INTEGRITY_AUDIT_SAMPLE_LIMIT = 25;
function capSample(arr) {
  return arr.slice(0, INTEGRITY_AUDIT_SAMPLE_LIMIT);
}

async function computeIntegrityAudit() {
  const startedAt = Date.now();

  // ---- Reads only ----
  const authUsers = [];
  {
    let pageToken;
    do {
      const res = await admin.auth().listUsers(1000, pageToken);
      authUsers.push(...res.users);
      pageToken = res.pageToken;
    } while (pageToken);
  }

  const data = {};
  for (const c of INTEGRITY_AUDIT_COLLECTIONS) {
    const snap = await db.collection(c).get().catch((err) => {
      console.warn(`computeIntegrityAudit: failed to read collection ${c}:`, err.message);
      return null;
    });
    data[c] = snap ? snap.docs.map((d) => ({ id: d.id, ref: `${c}/${d.id}`, data: d.data() })) : [];
  }

  const bucket = admin.storage().bucket();
  const [storageFiles] = await bucket.getFiles().catch((err) => {
    console.warn("computeIntegrityAudit: failed to list Storage files:", err.message);
    return [[]];
  });

  // ---- Indexes ----
  const authById = new Map(authUsers.map((u) => [u.uid, u]));
  const authByEmail = new Map();
  authUsers.forEach((u) => {
    if (!u.email) return;
    const e = integrityAuditNormEmail(u.email);
    if (!authByEmail.has(e)) authByEmail.set(e, []);
    authByEmail.get(e).push(u);
  });

  const usersById = new Map(data.users.map((d) => [d.id, d]));
  const customersById = new Map(data.customers.map((d) => [d.id, d]));
  const profilesById = new Map(data.user_profiles.map((d) => [d.id, d]));
  const applicationsById = new Map(data.applications.map((d) => [d.id, d]));
  const visaCasesById = new Map(data.visa_cases.map((d) => [d.id, d]));
  const storageByName = new Map(storageFiles.map((f) => [f.name, f]));

  const allKnownUids = new Set([
    ...authUsers.map((u) => u.uid),
    ...data.users.map((d) => d.id),
    ...data.customers.map((d) => d.id),
    ...data.user_profiles.map((d) => d.id),
  ]);

  // ---- Orphans & broken references ----
  const orphans = []; // { collection, id, reason }
  const brokenRefs = []; // { source, destination, issue }

  for (const a of data.applications) {
    const cid = a.data.customerId;
    if (!cid) {
      orphans.push({ collection: "applications", id: a.id, reason: "Missing customerId (no owner UID)" });
    } else if (!allKnownUids.has(cid)) {
      brokenRefs.push({ source: a.ref, destination: `users|customers/${cid}`, issue: "customerId does not resolve to any known user/customer/profile/Auth record" });
    }
  }

  for (const v of data.visa_cases) {
    const appId = v.data.applicationId;
    if (!appId) {
      orphans.push({ collection: "visa_cases", id: v.id, reason: "Missing applicationId (may be a valid lead-conversion case — see DATABASE_ROOT_CAUSE_ANALYSIS.md Issue D)" });
    } else if (!applicationsById.has(appId)) {
      orphans.push({ collection: "visa_cases", id: v.id, reason: `applicationId ${appId} does not exist` });
      brokenRefs.push({ source: v.ref, destination: `applications/${appId}`, issue: "Referenced application does not exist" });
    }
  }

  for (const d of data.documents) {
    const appId = d.data.applicationId;
    const vcId = d.data.visaCaseId;
    const travellerId = d.data.travellerId;
    if (!appId && !vcId && !travellerId && !d.data.travellerEmail) {
      orphans.push({ collection: "documents", id: d.id, reason: "No owner reference at all" });
    }
    if (appId && !applicationsById.has(appId)) {
      orphans.push({ collection: "documents", id: d.id, reason: `applicationId ${appId} does not exist` });
      brokenRefs.push({ source: d.ref, destination: `applications/${appId}`, issue: "Referenced application does not exist" });
    }
    if (vcId && !visaCasesById.has(vcId)) {
      orphans.push({ collection: "documents", id: d.id, reason: `visaCaseId ${vcId} does not exist` });
      brokenRefs.push({ source: d.ref, destination: `visa_cases/${vcId}`, issue: "Referenced visa case does not exist" });
    }
    if (d.data.storageKey && !storageByName.has(d.data.storageKey)) {
      brokenRefs.push({ source: d.ref, destination: `storage://${d.data.storageKey}`, issue: "storageKey points to a Storage file that does not exist" });
    }
  }

  for (const p of data.payments) {
    const appId = p.data.applicationId;
    if (appId && !applicationsById.has(appId)) {
      orphans.push({ collection: "payments", id: p.id, reason: `applicationId ${appId} does not exist` });
      brokenRefs.push({ source: p.ref, destination: `applications/${appId}`, issue: "Referenced application does not exist" });
    }
  }

  for (const b of data.bookings) {
    const appId = b.data.applicationId;
    if (appId && !applicationsById.has(appId)) {
      orphans.push({ collection: "bookings", id: b.id, reason: `applicationId ${appId} does not exist` });
      brokenRefs.push({ source: b.ref, destination: `applications/${appId}`, issue: "Referenced application does not exist" });
    }
  }

  for (const n of data.notifications) {
    const appId = n.data.applicationId || (n.id.match(/^appsubmit_([^_]+)_/) || [])[1];
    if (appId && !applicationsById.has(appId)) {
      orphans.push({ collection: "notifications", id: n.id, reason: `References deleted/missing application ${appId}` });
      brokenRefs.push({ source: n.ref, destination: `applications/${appId}`, issue: "Referenced application does not exist" });
    }
    if (n.data.userId && !allKnownUids.has(n.data.userId)) {
      orphans.push({ collection: "notifications", id: n.id, reason: `userId ${n.data.userId} does not resolve to any known user` });
    }
  }

  for (const c of data.chats) {
    const participants = Array.isArray(c.data.participants) ? c.data.participants : [];
    for (const p of participants) {
      if (!allKnownUids.has(p)) {
        brokenRefs.push({ source: c.ref, destination: `(uid) ${p}`, issue: "Chat participant does not resolve to any known user" });
      }
    }
  }

  for (const l of data.audit_logs) {
    if (l.data.performedBy && !allKnownUids.has(l.data.performedBy)) {
      brokenRefs.push({ source: l.ref, destination: `(uid) ${l.data.performedBy}`, issue: "performedBy does not resolve to any known user (expected for an audit trail — see RCA Issue G)" });
    }
  }

  for (const p of data.user_profiles) {
    if (!usersById.has(p.id) && !customersById.has(p.id) && !authById.has(p.id)) {
      orphans.push({ collection: "user_profiles", id: p.id, reason: "No matching users doc, customers doc, or Auth user for this UID" });
    }
  }

  for (const c of data.customers) {
    if (!usersById.has(c.id)) orphans.push({ collection: "customers", id: c.id, reason: "No matching users doc for this UID" });
    if (!authById.has(c.id)) orphans.push({ collection: "customers", id: c.id, reason: "No matching Firebase Auth user for this UID" });
  }

  const uidLike = (id) => /^[A-Za-z0-9]{20,36}$/.test(id);
  for (const u of data.users) {
    if (uidLike(u.id) && !authById.has(u.id)) {
      orphans.push({ collection: "users", id: u.id, reason: "No matching Firebase Auth user for this UID (uid-shaped doc id)" });
    }
  }

  for (const au of authUsers) {
    if (!usersById.has(au.uid) && !customersById.has(au.uid) && !profilesById.has(au.uid)) {
      orphans.push({ collection: "Firebase Auth", id: au.uid, reason: `Auth user (${au.email || "no email"}) has no users/customers/user_profiles doc` });
    }
  }

  // ---- Duplicates ----
  const dupEmails = [];
  for (const [email, list] of authByEmail.entries()) {
    if (list.length > 1) dupEmails.push({ email, uids: list.map((u) => u.uid) });
  }
  const emailToUidsFromDocs = new Map();
  for (const d of [...data.users, ...data.customers]) {
    const e = integrityAuditNormEmail(d.data.email);
    if (!e) continue;
    if (!emailToUidsFromDocs.has(e)) emailToUidsFromDocs.set(e, new Set());
    emailToUidsFromDocs.get(e).add(d.id);
  }
  for (const [email, uidSet] of emailToUidsFromDocs.entries()) {
    if (uidSet.size > 1 && !dupEmails.find((x) => x.email === email)) {
      dupEmails.push({ email, uids: [...uidSet] });
    }
  }

  const appSignature = new Map();
  const dupApplications = [];
  for (const a of data.applications) {
    const sig = `${a.data.customerId || ""}|${integrityAuditNormEmail(a.data.destinationCountry)}|${integrityAuditNormEmail(a.data.visaType)}`;
    if (!sig.replace(/\|/g, "")) continue;
    if (!appSignature.has(sig)) appSignature.set(sig, []);
    appSignature.get(sig).push(a.id);
  }
  for (const [sig, ids] of appSignature.entries()) {
    if (ids.length > 1) dupApplications.push({ signature: sig, ids });
  }

  // ---- Storage orphans ----
  const allStorageKeys = new Set(data.documents.map((d) => d.data.storageKey).filter(Boolean));
  const storageOrphanFiles = storageFiles.filter((f) =>
    !allStorageKeys.has(f.name) &&
    !INTEGRITY_AUDIT_PUBLIC_STORAGE_PREFIXES.some((p) => f.name.startsWith(p))
  );

  // ---- Summary ----
  const counts = { authUsers: authUsers.length, storageObjects: storageFiles.length };
  for (const c of INTEGRITY_AUDIT_COLLECTIONS) counts[c] = data[c].length;

  const totalIssues = orphans.length + brokenRefs.length + dupEmails.length + dupApplications.length + storageOrphanFiles.length;
  const durationMs = Date.now() - startedAt;

  return {
    generatedAt: new Date().toISOString(),
    durationMs,
    counts,
    totals: {
      orphans: orphans.length,
      brokenReferences: brokenRefs.length,
      duplicateEmails: dupEmails.length,
      duplicateApplications: dupApplications.length,
      orphanedStorageFiles: storageOrphanFiles.length,
      totalIssues,
    },
    // Sampled (capped) detail so a badly-orphaned project doesn't blow up log size.
    orphans: capSample(orphans),
    brokenReferences: capSample(brokenRefs),
    duplicateEmails: capSample(dupEmails),
    duplicateApplications: capSample(dupApplications),
    orphanedStorageFiles: capSample(storageOrphanFiles.map((f) => ({ path: f.name, size: Number(f.metadata.size || 0) }))),
  };
}

function logIntegrityAuditSummary(summary) {
  console.log(
    `integrityAudit: ${summary.totals.totalIssues} issue(s) in ${summary.durationMs}ms — ` +
    `orphans=${summary.totals.orphans} brokenRefs=${summary.totals.brokenReferences} ` +
    `dupEmails=${summary.totals.duplicateEmails} dupApplications=${summary.totals.duplicateApplications} ` +
    `orphanedStorageFiles=${summary.totals.orphanedStorageFiles}`
  );
  console.log("integrityAudit: counts by collection:", JSON.stringify(summary.counts));
  if (summary.totals.totalIssues > 0) {
    console.log("integrityAudit: full summary (sampled):", JSON.stringify(summary));
  }
}

// ---------------------------------------------------------------------------
// 11a. Scheduled read-only audit (logs only — see header comment above).
// Mirrors the sweepStuckAiDocuments schedule pattern. Runs daily; makes no
// writes anywhere. Safe to leave enabled once deployed — it cannot alter data.
// ---------------------------------------------------------------------------
exports.scheduledIntegrityAudit = functions.pubsub
  .schedule("every 24 hours")
  .onRun(async () => {
    try {
      const summary = await computeIntegrityAudit();
      logIntegrityAuditSummary(summary);
    } catch (err) {
      console.error("scheduledIntegrityAudit error:", err);
    }
    return null;
  });

// ---------------------------------------------------------------------------
// 11b. Manual on-demand trigger (super_admin only) — same read-only audit,
// callable immediately instead of waiting for the daily schedule. Returns the
// full summary to the caller in addition to logging it. Still makes zero
// writes to Firestore or Storage.
// ---------------------------------------------------------------------------
exports.runIntegrityAuditNow = functions.https.onCall(async (data, context) => {
  await verifySuperAdmin(context);
  const summary = await computeIntegrityAudit();
  logIntegrityAuditSummary(summary);
  return summary;
});

// ===========================================================================
// 12. Secure Document Access (short-lived signed URLs)
// ---------------------------------------------------------------------------
// Replaces direct Firebase Storage download URLs (getDownloadURL(), which
// produce a permanent, unauthenticated token embedded in the URL itself) with
// a Cloud Function that: authenticates the caller, verifies they own (or are
// staff for) the specific document, generates a Storage V4 signed URL with a
// short expiry, logs the access, and returns only that temporary URL. The
// client never sees or stores a permanent Storage URL/token.
//
// SUPPORTED LOOKUP MODES (caller passes exactly one "shape"):
//   1. { documentId }                — a documents/{docId} record (identity
//      documents: Passport, Photo, Emirates ID, Bank Statements, Residence
//      Visa). Ownership: travellerId/travellerEmail match, or staff.
//   2. { applicationId, storageKey } — a consultant deliverable living in
//      applications/{id}.documents[] (Appointment Letter, Hotel, Flight,
//      Travel Insurance, Itinerary, Visa Application Form). Ownership:
//      applications.customerId match, or staff. The storageKey must appear
//      on that application's own documents[] array (storagePath field) —
//      a caller cannot substitute an arbitrary path.
//   3. { storageKey } only           — a record with no per-user Firestore
//      ownership to check (e.g. an admin-managed system template). Staff
//      only.
//   4. { systemDocumentKey }         — a shared system document with NO
//      per-user owner but that every authenticated user (client or staff)
//      may fetch, e.g. the universal NOC template. `systemDocumentKey` must
//      be one of the fixed keys in SYSTEM_DOCUMENT_REGISTRY below — there is
//      no client-supplied path or storageKey in this mode at all. The
//      backend resolves the Storage path itself from the registry + the
//      corresponding systemDocuments/{id} Firestore doc's own trusted
//      fields, so a caller can never substitute an arbitrary Storage object.
//
// PERMISSION MATRIX (see DATABASE_ROOT_CAUSE_ANALYSIS.md-style honesty note:
// the schema has no per-application "assigned consultant" UID field — only a
// display-only assignedConsultant.name/whatsapp object — so "consultant" and
// "admin"/"super_admin" cannot be distinguished at the data level today. This
// function therefore grants any staff role in DOCUMENT_STAFF_ROLES the same
// access a truly "assigned" consultant would have. Tightening this further
// would require a schema change (a real assignedConsultantUid field) that is
// out of scope here — flagged, not silently assumed.):
//   - Client:      only their own documents (mode 1 travellerId/Email match,
//                  mode 2 customerId match), plus any allowlisted system
//                  document (mode 4 — any authenticated user).
//   - Staff        (super_admin/admin/manager/visa_ops): any document, any
//                  mode.
//   - Everyone else: permission-denied.
// ---------------------------------------------------------------------------

const DOCUMENT_STAFF_ROLES = ["super_admin", "admin", "manager", "visa_ops"];
// Plan requires 60-120s; using the upper bound to reduce the chance a native
// PDF viewer's follow-up range requests outlive the URL while a user is still
// actively viewing a large multi-page document.
const SIGNED_URL_TTL_MS = 120 * 1000;

// Fixed allowlist of shared, per-user-ownerless system documents. Each entry
// controls its own Firestore source doc and derives the Storage path from
// that doc's OWN trusted fields — never from anything the client sends.
// Adding a new key here is the only way to expose a new system document
// through this mode; there is no generic/dynamic path.
const SYSTEM_DOCUMENT_REGISTRY = {
  noc: {
    firestorePath: ["systemDocuments", "universal_noc_template"],
    // Mirrors the exact deterministic path AdminDocumentsPage.jsx uploads to
    // (system-documents/noc/Eshaare_NOC_Template.{extension}) — the
    // extension comes from the Firestore doc's own `fileType` field, set
    // only by the admin upload flow, never by this function's caller.
    resolveStorageKey: (docData) => {
      const ext = String(docData.fileType || "pdf").toLowerCase().replace(/[^a-z0-9]/g, "");
      return `system-documents/noc/Eshaare_NOC_Template.${ext || "pdf"}`;
    },
  },
};

async function resolveCallerRoleForDocs(uid, tokenEmail) {
  let doc = await db.collection("users").doc(uid).get();
  if (!doc.exists && tokenEmail) {
    doc = await db.collection("users").doc(tokenEmail.toLowerCase()).get();
  }
  return doc.exists ? (doc.data().role || null) : null;
}

exports.generateSecureDocumentAccess = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Authentication required.");
  }
  const callerUid = context.auth.uid;
  const callerEmail = ((context.auth.token && context.auth.token.email) || "").toLowerCase();
  const intent = data && data.intent === "download" ? "download" : "preview";

  const documentId = data && data.documentId ? String(data.documentId) : null;
  const applicationId = data && data.applicationId ? String(data.applicationId) : null;
  const requestedStorageKey = data && data.storageKey ? String(data.storageKey) : null;
  const systemDocumentKey = data && data.systemDocumentKey ? String(data.systemDocumentKey) : null;

  if (!documentId && !applicationId && !requestedStorageKey && !systemDocumentKey) {
    throw new functions.https.HttpsError("invalid-argument", "One of documentId, applicationId, storageKey, or systemDocumentKey is required.");
  }

  const role = await resolveCallerRoleForDocs(callerUid, callerEmail);
  const isStaff = DOCUMENT_STAFF_ROLES.includes(role);

  let storageKey = null;
  let authorized = false;
  let auditTarget = { collection: null, id: null };

  if (documentId) {
    // Mode 1: documents/{docId} — identity documents.
    const snap = await db.collection("documents").doc(documentId).get();
    if (!snap.exists) {
      throw new functions.https.HttpsError("not-found", "Document not found.");
    }
    const d = snap.data();
    storageKey = d.storageKey || null;
    const ownsIt = d.travellerId === callerUid || (d.travellerEmail && d.travellerEmail.toLowerCase() === callerEmail);
    authorized = isStaff || ownsIt;
    auditTarget = { collection: "documents", id: documentId };
  } else if (applicationId) {
    // Mode 2: a consultant deliverable inside applications/{id}.documents[].
    if (!requestedStorageKey) {
      throw new functions.https.HttpsError("invalid-argument", "storageKey is required alongside applicationId.");
    }
    const snap = await db.collection("applications").doc(applicationId).get();
    if (!snap.exists) {
      throw new functions.https.HttpsError("not-found", "Application not found.");
    }
    const a = snap.data();
    const list = Array.isArray(a.documents) ? a.documents : [];
    const match = list.find((x) => x && (x.storagePath === requestedStorageKey || x.fileUrl === requestedStorageKey));
    if (!match) {
      // The requested path isn't actually attached to this application — refuse
      // rather than trust a caller-supplied path blindly.
      throw new functions.https.HttpsError("permission-denied", "This file is not attached to the specified application.");
    }
    storageKey = requestedStorageKey;
    const ownsIt = a.customerId === callerUid;
    authorized = isStaff || ownsIt;
    auditTarget = { collection: "applications", id: applicationId };
  } else if (systemDocumentKey) {
    // Mode 4: a fixed, allowlisted system document (e.g. the universal NOC
    // template) — no per-user owner, but any authenticated user may fetch it.
    // The registry entry controls the ONLY code path that can turn this key
    // into a Storage object; there is no way for the caller to influence the
    // resulting path.
    const entry = SYSTEM_DOCUMENT_REGISTRY[systemDocumentKey];
    if (!entry) {
      throw new functions.https.HttpsError("invalid-argument", "Unknown or disallowed system document.");
    }
    const snap = await db.collection(entry.firestorePath[0]).doc(entry.firestorePath[1]).get();
    if (!snap.exists) {
      throw new functions.https.HttpsError("not-found", "This system document has not been uploaded yet.");
    }
    const docData = snap.data();
    if (docData.active === false) {
      throw new functions.https.HttpsError("not-found", "This system document is not currently active.");
    }
    storageKey = entry.resolveStorageKey(docData);
    authorized = true; // any authenticated caller — validated by `if (!context.auth)` above
    auditTarget = { collection: entry.firestorePath[0], id: systemDocumentKey };
  } else {
    // Mode 3: a bare storageKey with no per-user Firestore ownership to check
    // (e.g. an admin-managed system template). Staff only.
    storageKey = requestedStorageKey;
    authorized = isStaff;
    auditTarget = { collection: null, id: storageKey };
  }

  if (!storageKey) {
    throw new functions.https.HttpsError("not-found", "This record has no associated file.");
  }
  if (!authorized) {
    // Do not reveal whether the record exists to an unauthorized caller beyond
    // this generic denial.
    throw new functions.https.HttpsError("permission-denied", "You do not have access to this document.");
  }

  let signedUrl;
  const expiresAt = Date.now() + SIGNED_URL_TTL_MS;
  try {
    const bucket = admin.storage().bucket();
    const file = bucket.file(storageKey);
    const [exists] = await file.exists();
    if (!exists) {
      throw new functions.https.HttpsError("not-found", "The file could not be found in storage.");
    }
    const [url] = await file.getSignedUrl({ action: "read", expires: expiresAt });
    signedUrl = url;
  } catch (err) {
    if (err instanceof functions.https.HttpsError) throw err;
    console.error("generateSecureDocumentAccess: signing failed for", storageKey, ":", err.message);
    throw new functions.https.HttpsError("internal", "Failed to generate document access. Please try again.");
  }

  // Audit every grant (preview and download), same posture as every other
  // sensitive action in this file. Best-effort — a logging failure must never
  // block a legitimate, already-authorized access.
  db.collection("audit_logs").add({
    action: intent === "download" ? "DOCUMENT_DOWNLOAD" : "DOCUMENT_PREVIEW",
    performedBy: callerUid,
    performedByRole: role || (isStaff ? "staff" : "client"),
    targetId: auditTarget.id,
    timestamp: FieldValue.serverTimestamp(),
    details: {
      storageKey,
      collection: auditTarget.collection,
      intent,
      email: callerEmail || null,
      ip: (context.rawRequest && (context.rawRequest.headers["x-forwarded-for"] || context.rawRequest.ip)) || null,
    },
  }).catch((err) => console.error("generateSecureDocumentAccess: audit log write failed:", err.message));

  return { url: signedUrl, expiresAt, ttlSeconds: SIGNED_URL_TTL_MS / 1000 };
});
