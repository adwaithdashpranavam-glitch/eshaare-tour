// Centralized, user-friendly auth/registration error mapping.
// Never expose raw Firebase codes, permission-denied text, or stack traces to users.

const FRIENDLY = {
  "auth/invalid-email": "Invalid email address.",
  "auth/missing-email": "Please enter your email address.",
  "auth/email-already-in-use": "Email already registered. Try signing in instead.",
  "auth/weak-password": "Weak password — please use at least 6 characters.",
  "auth/missing-password": "Please enter a password.",
  "auth/wrong-password": "Invalid email or password.",
  "auth/user-not-found": "Invalid email or password.",
  "auth/invalid-credential": "Invalid email or password.",
  "auth/user-disabled": "This account has been disabled. Please contact support.",
  "auth/too-many-requests": "Too many attempts. Please wait a moment and try again.",
  "auth/network-request-failed": "Network error. Please check your connection and try again.",
  "auth/requires-recent-login": "Please sign in again to continue.",
  "auth/operation-not-allowed": "Service temporarily unavailable. Please try again later.",
  "auth/popup-closed-by-user": "Sign-in was cancelled."
};

// Anything that smells like a Firestore/permission/internal error must be masked.
const isSensitive = (raw) =>
  /permission|insufficient|firestore|internal|PERMISSION_DENIED|Missing or insufficient/i.test(raw || "");

/**
 * Translate any thrown auth/registration error into a safe, friendly message.
 * @param {unknown} error  the caught error
 * @param {string} fallback  context-appropriate default
 */
export const getAuthErrorMessage = (error, fallback = "Something went wrong. Please try again.") => {
  if (!error) return fallback;

  const code = error.code || "";
  if (code && FRIENDLY[code]) return FRIENDLY[code];

  const raw = error.message || "";

  // Callable Cloud Function errors (e.g. registerClient) surface as "functions/<code>".
  if (code.startsWith("functions/")) {
    if (code === "functions/already-exists") return FRIENDLY["auth/email-already-in-use"];
    // unauthenticated / permission-denied / internal details must never leak.
    if (code === "functions/permission-denied" || code === "functions/unauthenticated") {
      return "Registration failed. Please try again or contact support.";
    }
    // invalid-argument / internal carry server-authored friendly text — surface it if safe.
    if (!isSensitive(raw) && raw) return raw;
    return "Registration failed. Please try again.";
  }

  // Registration that failed at the profile-write stage (rules/permission) — never leak details.
  if (isSensitive(raw) || code === "permission-denied") {
    return "Registration failed. Please try again or contact support.";
  }

  // Some SDK errors put the code inside the message, e.g. "Firebase: Error (auth/invalid-email)."
  const match = raw.match(/auth\/[a-z-]+/);
  if (match && FRIENDLY[match[0]]) return FRIENDLY[match[0]];

  return fallback;
};

export default getAuthErrorMessage;
