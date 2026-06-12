import React, { createContext, useContext, useState, useEffect } from "react";
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  signOut,
  createUserWithEmailAndPassword,
  setPersistence,
  browserLocalPersistence
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { Navigate, useLocation } from "react-router-dom";
import { auth, db } from "../lib/firebase";
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

  const login = async (email, password) => {
    setLoading(true);
    try {
      await setPersistence(auth, browserLocalPersistence);
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
      const currentUser = userCredential.user;

      const lastLoginAt = new Date();
      const userDocRef = doc(db, "users", currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      
      let profileData = {};
      const isStaffEmail = currentUser.email?.endsWith("@eshaare.com") || currentUser.email?.endsWith("@eshaareuae.com");
      if (userDoc.exists()) {
        const data = userDoc.data();
        profileData = { ...data, lastLoginAt };
        if (isStaffEmail && (data.role === ROLES.CLIENT || data.role === "admin")) {
          profileData.role = ROLES.SUPER_ADMIN;
          await setDoc(userDocRef, { role: ROLES.SUPER_ADMIN, lastLoginAt }, { merge: true });
        } else {
          await setDoc(userDocRef, { lastLoginAt }, { merge: true });
        }
      } else {
        profileData = {
          uid: currentUser.uid,
          email: currentUser.email,
          name: currentUser.displayName || (isStaffEmail ? "Staff User" : "Client User"),
          role: isStaffEmail ? ROLES.SUPER_ADMIN : ROLES.CLIENT,
          createdAt: new Date(),
          lastLoginAt
        };
        await setDoc(userDocRef, profileData);
      }

      // If they are a client/customer, update the 'customers' collection as well
      if (profileData.role === ROLES.CLIENT || profileData.role === "customer") {
        const customerRef = doc(db, "customers", currentUser.uid);
        const customerDoc = await getDoc(customerRef);
        let name = profileData.name;
        if (customerDoc.exists()) {
          const custData = customerDoc.data();
          if (custData.name && custData.name !== "Client User") {
            name = custData.name;
          }
          profileData = { 
            ...profileData, 
            ...custData,
            phone: custData.phone || profileData.phone || profileData.phoneNumber || "",
            phoneNumber: custData.phone || profileData.phoneNumber || profileData.phone || ""
          };
        } else {
          profileData.phone = profileData.phone || profileData.phoneNumber || "";
          profileData.phoneNumber = profileData.phone;
        }
        await setDoc(customerRef, {
          uid: currentUser.uid,
          name: name || "Client User",
          email: profileData.email || currentUser.email || "",
          phone: profileData.phone || "",
          nationality: profileData.nationality || "",
          createdAt: profileData.createdAt || new Date(),
          lastLoginAt,
          status: "Active"
        }, { merge: true });
        profileData.name = name || "Client User";
      }

      setUserProfile(profileData);
      setUser(currentUser);
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
      await setPersistence(auth, browserLocalPersistence);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      const lastLoginAt = new Date();
      const isStaffEmail = email.trim().endsWith("@eshaare.com") || email.trim().endsWith("@eshaareuae.com");
      const profileData = {
        uid: user.uid,
        email: email.trim(),
        role: isStaffEmail ? ROLES.SUPER_ADMIN : ROLES.CLIENT,
        createdAt: new Date(),
        lastLoginAt,
        name: extraData.name || (isStaffEmail ? "Staff User" : "Client User"),
        ...extraData
      };

      // Save profile to Firestore 'users'
      await setDoc(doc(db, "users", user.uid), profileData);
      
      // Save profile to Firestore 'customers'
      if (!isStaffEmail) {
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
      }
      
      // Set state directly immediately to prevent race condition
      setUserProfile(profileData);
      setUser(user);
      
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
      await signOut(auth);
      setUser(null);
      setUserProfile(null);
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
        try {
          const userDocRef = doc(db, "users", currentUser.uid);
          const userDoc = await getDoc(userDocRef);
          
          let profile = null;
          const isStaffEmail = currentUser.email?.endsWith("@eshaare.com") || currentUser.email?.endsWith("@eshaareuae.com");
          if (userDoc.exists()) {
            profile = userDoc.data();
            if (isStaffEmail && (profile.role === ROLES.CLIENT || profile.role === "admin")) {
              profile.role = ROLES.SUPER_ADMIN;
              await setDoc(userDocRef, { role: ROLES.SUPER_ADMIN }, { merge: true });
            }
          } else {
            profile = {
              uid: currentUser.uid,
              email: currentUser.email,
              name: currentUser.displayName || (isStaffEmail ? "Staff User" : "Client User"),
              role: isStaffEmail ? ROLES.SUPER_ADMIN : ROLES.CLIENT
            };
          }

          if (profile && (profile.role === ROLES.CLIENT || profile.role === "customer")) {
            const customerDoc = await getDoc(doc(db, "customers", currentUser.uid));
            if (customerDoc.exists()) {
              const custData = customerDoc.data();
              profile = { 
                ...profile, 
                ...custData,
                phone: custData.phone || profile.phone || profile.phoneNumber || "",
                phoneNumber: custData.phone || profile.phoneNumber || profile.phone || ""
              };
            } else {
              profile.phone = profile.phone || profile.phoneNumber || "";
              profile.phoneNumber = profile.phone;
            }
          }

          // Enforce 15-day session check
          if (profile && profile.lastLoginAt) {
            const loginDate = profile.lastLoginAt.toDate ? profile.lastLoginAt.toDate() : new Date(profile.lastLoginAt);
            const fifteenDaysAgo = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000);
            if (loginDate < fifteenDaysAgo) {
              toast.error("Session expired (15 days max). Please log in again.");
              await signOut(auth);
              setUser(null);
              setUserProfile(null);
              setLoading(false);
              return;
            }
          }

          setUser(currentUser);
          setUserProfile(profile);
        } catch (error) {
          console.error("Error fetching user profile:", error);
          const isStaffEmail = currentUser.email?.endsWith("@eshaare.com") || currentUser.email?.endsWith("@eshaareuae.com");
          setUser(currentUser);
          setUserProfile({
            uid: currentUser.uid,
            email: currentUser.email,
            name: "User Profile Error",
            role: isStaffEmail ? ROLES.SUPER_ADMIN : ROLES.CLIENT
          });
        }
      } else {
        setUser(null);
        setUserProfile(null);
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
  const isClient = role === ROLES.CLIENT || role === "customer";

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
