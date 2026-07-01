import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  setPersistence,
  browserLocalPersistence,
  sendEmailVerification
} from "firebase/auth";
import { doc, getDoc, setDoc, deleteDoc, collection } from "firebase/firestore";
import { Navigate, useLocation } from "react-router-dom";
import { auth, db, functions, httpsCallable } from "../lib/firebase";
import { ROLES } from "../utils/constants";
import toast from "react-hot-toast";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import { getAuthErrorMessage } from "../utils/authErrors";

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [emailVerified, setEmailVerified] = useState(false);

  // Refs to avoid stale closures and duplicate concurrent fetching/writes in auth listeners
  const userProfileRef = useRef(null);
  const userRef = useRef(null);
  // True while register() is mid-flight, so the auth listener does not race-create a
  // default profile or react to the transient sign-in before registration finishes.
  const registeringRef = useRef(false);

  const setUserProfileAndRef = (profile) => {
    userProfileRef.current = profile;
    setUserProfile(profile);
  };

  const setUserAndRef = (currentUser) => {
    userRef.current = currentUser;
    setUser(currentUser);
  };

  // Set persistence once at application mount to avoid blocking logins
  useEffect(() => {
    setPersistence(auth, browserLocalPersistence).catch((err) => {
      console.warn("Error setting auth persistence:", err);
    });
  }, []);

  const fetchAndLinkProfile = async (currentUser, skipUpdate = false) => {
    const userDocRef = doc(db, "users", currentUser.uid);
    const userDoc = await getDoc(userDocRef);
    const lastLoginAt = new Date();
    
    if (userDoc.exists()) {
      const data = userDoc.data();
      // Only update lastLoginAt - don't change role/status/uid so we don't violate update rules
      if (!skipUpdate) {
        try {
          await setDoc(userDocRef, { lastLoginAt }, { merge: true });
        } catch (e) {
          console.warn("Could not update lastLoginAt:", e);
        }
      }
      return { ...data, lastLoginAt: data.lastLoginAt || lastLoginAt };
    }
    
    // If UID doc does not exist, check if there's a pre-created staff profile using lowercase email as ID
    if (currentUser.email) {
      const emailDocRef = doc(db, "users", currentUser.email.toLowerCase().trim());
      const emailDoc = await getDoc(emailDocRef);
      if (emailDoc.exists()) {
        const staffData = emailDoc.data();
        const profileData = {
          ...staffData,
          uid: currentUser.uid,
          email: currentUser.email.toLowerCase().trim(),
          status: staffData.status || 'Active',   // Default missing status to Active
          lastLoginAt
        };
        // Link it to the UID document
        await setDoc(userDocRef, profileData);
        // Delete the email-based document to clean up
        try {
          await deleteDoc(emailDocRef);
        } catch (e) {
          console.warn("Clean up of email doc failed:", e);
        }
        return profileData;
      }
    }
    
    // No UID doc and no legacy email-keyed staff doc to link. Do NOT auto-create a
    // profile here — accounts are created atomically via the registerClient Cloud
    // Function. Returning null lets callers treat this as an invalid/incomplete session
    // instead of silently materializing an orphaned client doc.
    return null;
  };

  // Developer Portal Access Restriction (for testing security concerns / maintenance)
  const checkDevRestriction = (targetEmail) => {
    if (import.meta.env.VITE_DEV_LOGIN_ENABLED === "true") {
      const allowedEmails = (import.meta.env.VITE_DEV_EMAILS || "")
        .split(",")
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean);
      if (allowedEmails.length > 0 && !allowedEmails.includes(targetEmail.trim().toLowerCase())) {
        throw new Error("Client Portal is currently under security testing and maintenance. Access is restricted to authorized developer and QA accounts.");
      }
    }
  };

  const login = async (email, password) => {
    setLoading(true);
    try {
      checkDevRestriction(email);
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
      const currentUser = userCredential.user;

      // Check if profile was already fetched by onAuthStateChanged listener to avoid duplicate read
      let profileData = userProfileRef.current;
      if (!profileData || userRef.current?.uid !== currentUser.uid) {
        // Fetch profile data without blocking on the write
        profileData = await fetchAndLinkProfile(currentUser, true);
      }

      // No profile doc (and no legacy doc to link) = invalid/incomplete account.
      // Don't leave a half-authenticated session.
      if (!profileData) {
        await signOut(auth);
        throw new Error("No account profile found. Please sign up or contact support.");
      }

      if (profileData.status === "Suspended" || profileData.status === "Disabled") {
        toast.error("Your account has been suspended. Please contact support.");
        await signOut(auth);
        throw new Error("Your account has been suspended.");
      }

      // Log login action (in background)
      const logAuthEventFn = httpsCallable(functions, "logAuthEvent");
      logAuthEventFn({ action: "USER_LOGIN" }).catch((err) => {
        console.warn("Audit logging failed:", err);
      });

      // Update lastLoginAt in users collection (in background)
      const userDocRef = doc(db, "users", currentUser.uid);
      setDoc(userDocRef, { lastLoginAt: new Date() }, { merge: true }).catch((e) => {
        console.warn("Could not update lastLoginAt in background:", e);
      });
      // If they are a client/customer, update the 'customers' collection as well (in background)
      if (profileData.role && (profileData.role.toLowerCase() === ROLES.CLIENT || profileData.role.toLowerCase() === "customer")) {
        const customerRef = doc(db, "customers", currentUser.uid);
        const originalProfile = { ...profileData };
        
        // Run customer document check, merge, and write completely asynchronously
        (async () => {
          const customerDoc = await getDoc(customerRef);
          let name = originalProfile.name;
          let mergedData = {};
          if (customerDoc.exists()) {
            const custData = customerDoc.data();
            if (custData.name && custData.name !== "Client User") {
              name = custData.name;
            }
            mergedData = {
              ...custData,
              phone: custData.phone || originalProfile.phone || originalProfile.phoneNumber || "",
              phoneNumber: custData.phone || originalProfile.phoneNumber || originalProfile.phone || "",
              name: name || "Client User"
            };
          } else {
            mergedData = {
              phone: originalProfile.phone || originalProfile.phoneNumber || "",
              phoneNumber: originalProfile.phone || originalProfile.phoneNumber || "",
              name: name || "Client User"
            };
          }

          // Update state and ref in the background so the user gets the merged data
          if (userProfileRef.current && userProfileRef.current.uid === currentUser.uid) {
            setUserProfileAndRef({
              ...userProfileRef.current,
              ...mergedData
            });
          }

          await setDoc(customerRef, {
            uid: currentUser.uid,
            name: name || "Client User",
            email: originalProfile.email || currentUser.email || "",
            phone: mergedData.phone || "",
            nationality: originalProfile.nationality || mergedData.nationality || "",
            createdAt: originalProfile.createdAt || mergedData.createdAt || new Date(),
            lastLoginAt: new Date(),
            status: "Active"
          }, { merge: true });
        })().catch((err) => {
          console.warn("Background customer sync failed:", err);
        });
      }
      setUserProfileAndRef(profileData);
      setUserAndRef(currentUser);
      setEmailVerified(!!currentUser.emailVerified);
      return currentUser;
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Interim verification-email config: plain web continueUrl (no Firebase Dynamic Links —
  // FDL was shut down Aug 2025). eshaareuae.com must be in Firebase Auth → Authorized domains.
  const VERIFICATION_EMAIL_SETTINGS = {
    url: "https://eshaareuae.com/portal/verify-email",
    handleCodeInApp: false
  };

  // Single, swappable email-send step. Best-effort: never throws.
  // TODO(Track B): replace this built-in send with a server-side Resend branded send.
  const sendVerificationEmailInterim = async (firebaseUser) => {
    if (!firebaseUser) return;
    try {
      await sendEmailVerification(firebaseUser, VERIFICATION_EMAIL_SETTINGS);
    } catch (verifyErr) {
      // Account already exists; user can resend later. Do not fail the calling flow.
      console.warn("Verification email send failed (non-fatal):", verifyErr);
    }
  };

  const register = async (email, password, extraData) => {
    setLoading(true);
    registeringRef.current = true;
    try {
      checkDevRestriction(email);
      // Atomic account creation happens server-side (Admin SDK). The callable creates the
      // Auth user + users/customers docs and rolls everything back on any failure, so the
      // client never has to manage partial-registration cleanup.
      const registerClientFn = httpsCallable(functions, "registerClient");
      await registerClientFn({
        email: email.trim(),
        password,
        name: extraData.name,
        phoneNumber: extraData.phoneNumber,
        nationality: extraData.nationality
      });

      // Account exists and is consistent — now establish the client session.
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
      const currentUser = userCredential.user;

      // INTERIM verification email (best-effort, swappable — see sendVerificationEmailInterim).
      await sendVerificationEmailInterim(currentUser);

      // Load the profile the callable just created (no auto-create — it already exists).
      const profile = await fetchAndLinkProfile(currentUser, true);
      setUserProfileAndRef(profile || null);
      setUserAndRef(currentUser);
      setEmailVerified(!!currentUser.emailVerified);

      return currentUser;
    } catch (error) {
      console.error("Registration failed:", error);

      // No client-side rollback needed — the callable is authoritative. Just ensure no
      // partial client session lingers, then surface a sanitized, friendly message.
      try { await signOut(auth); } catch (_) { /* noop */ }
      setUserAndRef(null);
      setUserProfileAndRef(null);
      setEmailVerified(false);

      const friendly = new Error(getAuthErrorMessage(error, "Registration failed. Please try again."));
      friendly.code = error.code;
      throw friendly;
    } finally {
      registeringRef.current = false;
      setLoading(false);
    }
  };

  // Resend the verification email to the currently signed-in (unverified) user.
  // Uses the same interim send so behaviour matches signup.
  // TODO(Track B): this resends via the same swappable step — will use Resend in Track B.
  const resendVerificationEmail = async () => {
    if (!auth.currentUser) throw new Error("You are not signed in.");
    await sendEmailVerification(auth.currentUser, VERIFICATION_EMAIL_SETTINGS);
  };

  // Reload the Auth user and refresh the cached email-verified flag + ID token.
  // Returns the up-to-date verified boolean.
  const refreshEmailVerified = async () => {
    if (!auth.currentUser) return false;
    await auth.currentUser.reload();
    // Force a token refresh so downstream Firestore rules see the new email_verified claim.
    await auth.currentUser.getIdToken(true);
    const verified = !!auth.currentUser.emailVerified;
    setEmailVerified(verified);
    setUserAndRef(auth.currentUser);
    return verified;
  };

  const logout = async () => {
    setLoading(true);
    try {
      if (userRef.current) {
        const logAuthEventFn = httpsCallable(functions, "logAuthEvent");
        logAuthEventFn({ action: "USER_LOGOUT" }).catch((err) => {
          console.warn("Audit logging failed:", err);
        });
      }
      await signOut(auth);
      setUserAndRef(null);
      setUserProfileAndRef(null);
      setEmailVerified(false);
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      // While register() is running, ignore the transient sign-in event it triggers —
      // register() owns the profile writes and final state for this flow.
      if (registeringRef.current) {
        return;
      }
      setLoading(true);
      if (currentUser) {
        try {
          checkDevRestriction(currentUser.email);
        } catch (devErr) {
          console.warn("Session terminated by dev maintenance mode:", devErr.message);
          toast.error("Portal under maintenance: Access is limited to authorized QA accounts.");
          await signOut(auth);
          setUserAndRef(null);
          setUserProfileAndRef(null);
          setEmailVerified(false);
          setLoading(false);
          return;
        }
        setEmailVerified(!!currentUser.emailVerified);
        // Skip re-fetching if login() already set the profile for this user (avoids race condition)
        if (userProfileRef.current && userRef.current?.uid === currentUser.uid) {
          setLoading(false);
          return;
        }
        try {
          const profile = await fetchAndLinkProfile(currentUser, true);

          // Authenticated session with no profile doc = invalid/incomplete account.
          // Sign out rather than leaving a half-authenticated state (no auto-create).
          if (!profile) {
            await signOut(auth);
            setUserAndRef(null);
            setUserProfileAndRef(null);
            setEmailVerified(false);
            setLoading(false);
            return;
          }

          let updatedProfile = { ...profile };

          if (updatedProfile && (updatedProfile.status === "Suspended" || updatedProfile.status === "Disabled")) {
            toast.error("Your account has been suspended. Please contact support.");
            await signOut(auth);
            setUserAndRef(null);
            setUserProfileAndRef(null);
            setLoading(false);
            return;
          }

          if (profile && profile.role && (profile.role.toLowerCase() === ROLES.CLIENT || profile.role.toLowerCase() === "customer")) {
            const customerDoc = await getDoc(doc(db, "customers", currentUser.uid));
            if (customerDoc.exists()) {
              const custData = customerDoc.data();
              updatedProfile = { 
                ...profile, 
                ...custData,
                phone: custData.phone || profile.phone || profile.phoneNumber || "",
                phoneNumber: custData.phone || profile.phoneNumber || profile.phone || ""
              };
            } else {
              updatedProfile.phone = profile.phone || profile.phoneNumber || "";
              updatedProfile.phoneNumber = profile.phone;
            }
          }

          // Enforce 15-day session check
          if (updatedProfile && updatedProfile.lastLoginAt) {
            const loginDate = updatedProfile.lastLoginAt.toDate ? updatedProfile.lastLoginAt.toDate() : new Date(updatedProfile.lastLoginAt);
            const fifteenDaysAgo = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000);
            if (loginDate < fifteenDaysAgo) {
              toast.error("Session expired (15 days max). Please log in again.");
              await signOut(auth);
              setUserAndRef(null);
              setUserProfileAndRef(null);
              setLoading(false);
              return;
            }
          }

          setUserAndRef(currentUser);
          setUserProfileAndRef(updatedProfile);
        } catch (error) {
          console.error("Error fetching user profile:", error);
          setUserAndRef(currentUser);
          setUserProfileAndRef({
            uid: currentUser.uid,
            email: currentUser.email,
            name: "User Profile Error",
            role: ROLES.CLIENT
          });
        }
      } else {
        setUserAndRef(null);
        setUserProfileAndRef(null);
        setEmailVerified(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const role = userProfile?.role;
  const isAdmin = role && [
    ROLES.SUPER_ADMIN,
    "admin",
    ROLES.MANAGER,
    ROLES.SALES,
    ROLES.VISA_OPS,
    ROLES.FINANCE,
    ROLES.SUPPORT
  ].includes(role);
  const isClient = role && (role.toLowerCase() === ROLES.CLIENT || role.toLowerCase() === "customer");

  const value = {
    user,
    userProfile,
    loading,
    login,
    register,
    logout,
    isAdmin,
    isClient,
    role,
    emailVerified,
    resendVerificationEmail,
    refreshEmailVerified
  };

  const isPrerendering = typeof window !== 'undefined' && window.navigator.userAgent.includes('ReactSnap');

  return (
    <AuthContext.Provider value={value}>
      {children}
      {loading && !isPrerendering && <LoadingSpinner message="Securing Connection..." fullScreen={true} />}
    </AuthContext.Provider>
  );
};

// Protect admin routes (requires staff auth). Optionally restrict to specific roles:
// pass `roles` (array of role strings) to gate a route. If the signed-in staff member's
// role is not included, they are redirected to the admin dashboard. This makes direct-URL
// access match the sidebar visibility in AdminLayout (defense-in-depth on top of Firestore rules).
export const ProtectedRoute = ({ children, roles }) => {
  const { user, isAdmin, loading, role } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingSpinner message="Authenticating..." fullScreen={true} />;
  }

  if (!user || !isAdmin) {
    console.log("ProtectedRoute - Access Denied:", {
      hasUser: !!user,
      isAdmin,
      userRole: role,
      userEmail: user?.email
    });
    // Redirect to staff login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Role-restricted route: authenticated staff but role not permitted for this page.
  if (roles && !roles.includes(role)) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return children;
};

// Protect client portal routes (requires client auth)
export const ClientRoute = ({ children }) => {
  const { user, isAdmin, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingSpinner message="Loading client portal..." fullScreen={true} />;
  }

  if (!user) {
    // Redirect to client login
    return <Navigate to="/portal/login" state={{ from: location }} replace />;
  }

  if (isAdmin) {
    // Redirect admin to admin dashboard
    return <Navigate to="/admin/dashboard" replace />;
  }

  return children;
};

// Require a verified email for client portal access (excluding the verify-email screen).
// Routing ladder: unauthenticated -> login; authenticated+unverified -> verify-email;
// verified+incomplete profile -> verify-profile; verified+complete -> dashboard.
export const RequireVerifiedEmail = ({ children }) => {
  const { user, loading, emailVerified } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingSpinner message="Loading client portal..." fullScreen={true} />;
  }

  if (!user) {
    return <Navigate to="/portal/login" state={{ from: location }} replace />;
  }

  if (!emailVerified) {
    return <Navigate to="/portal/verify-email" replace />;
  }

  return children;
};
