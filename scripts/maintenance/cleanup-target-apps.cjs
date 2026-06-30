/* eslint-disable */
/**
 * ⚠️ DESTRUCTIVE MAINTENANCE TOOL — READ BEFORE RUNNING ⚠️
 * This script deletes production Firestore documents and Storage files when
 * run with --apply --yes. It has hardcoded target/owner/protected criteria
 * specific to a past one-off cleanup task. Do NOT run against production
 * without re-reading the matching logic below and confirming it still
 * applies to your current intent. Always run without --apply first (dry
 * run) and review the printed deletion plan before ever applying it.
 *
 * One-off maintenance script: identify (and, only with --apply, delete) the two
 * client applications "Schengen Europe Visa" and "Italy Business Visa" owned by
 * Pranav H (adwaithdashpranavam@gmail.com), plus their linked visa_cases,
 * bookings, documents, and Storage files.
 *
 * DRY RUN BY DEFAULT — prints what WOULD be deleted and deletes nothing.
 * Deletion only happens when run with:  node cleanup-target-apps.cjs --apply --yes
 *
 * Auth: uses Application Default Credentials (GOOGLE_APPLICATION_CREDENTIALS or
 * `gcloud auth application-default login`). Project: eshaareuae.
 */
const admin = require("firebase-admin");

const PROJECT_ID = "eshaareuae";
const BUCKET = "eshaareuae.firebasestorage.app";
const OWNER_EMAIL = "adwaithdashpranavam@gmail.com";
const OWNER_NAME_HINT = "pranav";

const APPLY = process.argv.includes("--apply") && process.argv.includes("--yes");

// Display names we must NEVER touch.
const PROTECTED = [
  "france tourist visa",
  "france visiting family or friends",
  "portugal airport transit visa",
  "italy cultural visa",
];

admin.initializeApp({
  projectId: PROJECT_ID,
  storageBucket: BUCKET,
});
const db = admin.firestore();
const bucket = admin.storage().bucket();

const displayName = (a) => {
  const country = (a.destinationCountry || "").trim();
  const type = (a.visaType || "").trim();
  if (country && type) return `${country} ${type}`.replace(/\s+/g, " ").trim();
  return (a.visaName || a.destination || type || country || "Visa Application").trim();
};

const isProtected = (name) => {
  const n = name.toLowerCase();
  return PROTECTED.some((p) => n.includes(p));
};

const isTarget = (a) => {
  const n = displayName(a).toLowerCase();
  const country = (a.destinationCountry || "").toLowerCase();
  const schengenEurope = n.includes("schengen") && n.includes("europe");
  const italyBusiness = (n.includes("italy") || country === "italy") && n.includes("business");
  return schengenEurope || italyBusiness;
};

async function resolveOwnerUids() {
  const uids = new Set();
  for (const coll of ["users", "customers"]) {
    const snap = await db.collection(coll).where("email", "==", OWNER_EMAIL).get().catch(() => null);
    if (snap) snap.forEach((d) => { uids.add(d.id); if (d.data().uid) uids.add(d.data().uid); });
  }
  return uids;
}

const ownsApp = (a, uids) => {
  if (a.customerId && uids.has(a.customerId)) return true;
  const fdEmail = (a.formData && a.formData.email || "").toLowerCase();
  if (fdEmail === OWNER_EMAIL) return true;
  const nm = `${a.customerName || ""} ${a.fullName || ""}`.toLowerCase();
  return nm.includes(OWNER_NAME_HINT);
};

async function main() {
  console.log(`\n=== ${APPLY ? "APPLY (DESTRUCTIVE)" : "DRY RUN (read-only)"} — project ${PROJECT_ID} ===\n`);

  const uids = await resolveOwnerUids();
  console.log("Resolved owner uids:", [...uids]);

  // 1) Find matching applications owned by the client
  const appsSnap = await db.collection("applications").get();
  const targetApps = [];
  appsSnap.forEach((doc) => {
    const a = { id: doc.id, ...doc.data() };
    const name = displayName(a);
    if (isProtected(name)) return;
    if (!isTarget(a)) return;
    if (!ownsApp(a, uids)) return;
    targetApps.push(a);
  });

  if (targetApps.length === 0) {
    console.log("No matching applications found. Nothing to do.");
    return;
  }

  const plan = { applications: [], visa_cases: [], bookings: [], documents: [], storage: [] };

  for (const a of targetApps) {
    plan.applications.push({ id: a.id, name: displayName(a), status: a.status, paymentStatus: a.paymentStatus });

    // visa_cases linked by applicationId
    const vcByApp = await db.collection("visa_cases").where("applicationId", "==", a.id).get();
    vcByApp.forEach((d) => plan.visa_cases.push({ id: d.id, via: "applicationId", caseNo: d.data().caseNo, name: displayName(d.data()) }));

    // bookings linked by applicationId (best-effort; field may not exist)
    const bkByApp = await db.collection("bookings").where("applicationId", "==", a.id).get().catch(() => null);
    if (bkByApp) bkByApp.forEach((d) => plan.bookings.push({ id: d.id, via: "applicationId" }));

    // documents linked by applicationId
    const docByApp = await db.collection("documents").where("applicationId", "==", a.id).get().catch(() => null);
    if (docByApp) docByApp.forEach((d) => plan.documents.push({ id: d.id, via: "applicationId" }));

    // documents linked by visaCaseId for each linked case
    for (const vc of vcByApp.docs) {
      const docByCase = await db.collection("documents").where("visaCaseId", "==", vc.id).get().catch(() => null);
      if (docByCase) docByCase.forEach((d) => plan.documents.push({ id: d.id, via: `visaCaseId:${vc.id}` }));
    }

    // Storage files under applications/{appId}/
    const [files] = await bucket.getFiles({ prefix: `applications/${a.id}/` }).catch(() => [[]]);
    files.forEach((f) => plan.storage.push(f.name));
  }

  // De-dup
  const uniqBy = (arr, key) => Array.from(new Map(arr.map((x) => [key(x), x])).values());
  plan.visa_cases = uniqBy(plan.visa_cases, (x) => x.id);
  plan.bookings = uniqBy(plan.bookings, (x) => x.id);
  plan.documents = uniqBy(plan.documents, (x) => x.id);
  plan.storage = [...new Set(plan.storage)];

  console.log("\n----- DELETION PLAN -----");
  console.log("\napplications:");
  plan.applications.forEach((x) => console.log(`  - ${x.id}  "${x.name}"  status=${x.status} paymentStatus=${x.paymentStatus}`));
  console.log("\nvisa_cases:");
  plan.visa_cases.forEach((x) => console.log(`  - ${x.id}  caseNo=${x.caseNo}  "${x.name}"  (${x.via})`));
  console.log("\nbookings:");
  plan.bookings.forEach((x) => console.log(`  - ${x.id}  (${x.via})`));
  console.log("\ndocuments:");
  plan.documents.forEach((x) => console.log(`  - ${x.id}  (${x.via})`));
  console.log("\nstorage files:");
  plan.storage.forEach((p) => console.log(`  - ${p}`));
  console.log("\n-------------------------\n");

  console.log("SAFETY CHECK — protected names that will NOT be touched:", PROTECTED.join(", "));

  if (!APPLY) {
    console.log("\nDRY RUN complete. Nothing deleted. Re-run with `--apply --yes` to delete.\n");
    return;
  }

  console.log("\n*** APPLYING DELETION ***\n");
  for (const d of plan.documents) { await db.collection("documents").doc(d.id).delete(); console.log("deleted documents/" + d.id); }
  for (const b of plan.bookings) { await db.collection("bookings").doc(b.id).delete(); console.log("deleted bookings/" + b.id); }
  for (const v of plan.visa_cases) { await db.collection("visa_cases").doc(v.id).delete(); console.log("deleted visa_cases/" + v.id); }
  for (const a of plan.applications) { await db.collection("applications").doc(a.id).delete(); console.log("deleted applications/" + a.id); }
  for (const p of plan.storage) { await bucket.file(p).delete().catch((e) => console.warn("storage delete skipped", p, e.message)); console.log("deleted storage " + p); }
  console.log("\n*** DELETION COMPLETE ***\n");
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
