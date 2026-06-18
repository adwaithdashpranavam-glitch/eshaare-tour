import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  signOut,
  createUserWithEmailAndPassword,
  setPersistence,
  browserLocalPersistence
} from "firebase/auth";
import { doc, getDoc, setDoc, deleteDoc, collection } from "firebase/firestore";
import { Navigate, useLocation } from "react-router-dom";
import { auth, db, functions, httpsCallable } from "../lib/firebase";
import { ROLES } from "../utils/constants";
import toast from "react-hot-toast";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";

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

  // Refs to avoid stale closures and duplicate concurrent fetching/writes in auth listeners
  const userProfileRef = useRef(null);
  const userRef = useRef(null);

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
    
    // Default fallback: Create a client profile
    const profileData = {
      uid: currentUser.uid,
      email: currentUser.email || "",
      name: currentUser.displayName || "Client User",
      role: ROLES.CLIENT,
      status: 'Active',
      createdAt: new Date(),
      lastLoginAt
    };
    await setDoc(userDocRef, profileData);
    return profileData;
  };

  const login = async (email, password) => {
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
      const currentUser = userCredential.user;

      // Check if profile was already fetched by onAuthStateChanged listener to avoid duplicate read
      let profileData = userProfileRef.current;
      if (!profileData || userRef.current?.uid !== currentUser.uid) {
        // Fetch profile data without blocking on the write
        profileData = await fetchAndLinkProfile(currentUser, true);
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
      return currentUser;
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (email, password, extraData) => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      const lastLoginAt = new Date();
      const profileData = {
        uid: user.uid,
        email: email.trim(),
        role: ROLES.CLIENT, // Default to client role, no auto-elevation
        createdAt: new Date(),
        lastLoginAt,
        name: extraData.name || "Client User",
        ...extraData
      };

      // Save profile to Firestore 'users' and 'customers' (await them during registration)
      await setDoc(doc(db, "users", user.uid), profileData);
      await setDoc(doc(db, "customers", user.uid), {
        uid: user.uid,
        name: extraData.name || "Client User",
        email: email.trim(),
        phone: extraData.phoneNumber || extraData.phone || "",
        nationality: extraData.nationality || "",
        createdAt: new Date(),
        lastLoginAt,
        status: "Active"
      });
      
      // Set state directly immediately to prevent race condition
      setUserProfileAndRef(profileData);
      setUserAndRef(user);

      return user;
    } catch (error) {
      console.error("Registration failed:", error);
      throw error;
    } finally {
      setLoading(false);
    }
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
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setLoading(true);
      if (currentUser) {
        // Skip re-fetching if login() already set the profile for this user (avoids race condition)
        if (userProfileRef.current && userRef.current?.uid === currentUser.uid) {
          setLoading(false);
          return;
        }
        try {
          const profile = await fetchAndLinkProfile(currentUser, true);
          
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
    role
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
      {loading && <LoadingSpinner message="Securing Connection..." fullScreen={true} />}
    </AuthContext.Provider>
  );
};

// Protect admin routes (requires staff auth)
export const ProtectedRoute = ({ children }) => {
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
