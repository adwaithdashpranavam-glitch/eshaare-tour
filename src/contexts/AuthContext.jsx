import React, { createContext, useContext, useState, useEffect } from "react";
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  signOut,
  createUserWithEmailAndPassword
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { Navigate, useLocation } from "react-router-dom";
import { auth, db } from "../lib/firebase";
import { ROLES } from "../utils/constants";

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
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
      const currentUser = userCredential.user;

      // Pre-fetch profile immediately to avoid race conditions in ProtectedRoute
      const userDocRef = doc(db, "users", currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        setUserProfile(userDoc.data());
      } else {
        const isStaffEmail = currentUser.email?.endsWith("@eshaare.com") || currentUser.email?.endsWith("@eshaareuae.com");
        setUserProfile({
          uid: currentUser.uid,
          email: currentUser.email,
          name: currentUser.displayName || (isStaffEmail ? "Staff User" : "Client User"),
          role: isStaffEmail ? ROLES.SUPER_ADMIN : ROLES.CLIENT
        });
      }

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
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Save profile to Firestore
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email: email.trim(),
        role: ROLES.CLIENT,
        createdAt: new Date(),
        ...extraData
      });
      
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
        setUser(currentUser);
        try {
          // Fetch additional profile from Firestore 'users' collection
          const userDocRef = doc(db, "users", currentUser.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            setUserProfile(userDoc.data());
          } else {
            // Fallback: Check if they are in 'travellers' or set default client role
            const isStaffEmail = currentUser.email?.endsWith("@eshaare.com") || currentUser.email?.endsWith("@eshaareuae.com");
            setUserProfile({
              uid: currentUser.uid,
              email: currentUser.email,
              name: currentUser.displayName || (isStaffEmail ? "Staff User" : "Client User"),
              role: isStaffEmail ? ROLES.SUPER_ADMIN : ROLES.CLIENT
            });
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
          const isStaffEmail = currentUser.email?.endsWith("@eshaare.com") || currentUser.email?.endsWith("@eshaareuae.com");
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
  const isAdmin = role && role !== ROLES.CLIENT;
  const isClient = role === ROLES.CLIENT;

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
      {!loading && children}
    </AuthContext.Provider>
  );
};

// Protect admin routes (requires staff auth)
export const ProtectedRoute = ({ children }) => {
  const { user, isAdmin, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-primary-container">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-secondary border-t-transparent"></div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    // Redirect to staff login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

// Protect client portal routes (requires client auth)
export const ClientRoute = ({ children }) => {
  const { user, isClient, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-primary-container">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-secondary border-t-transparent"></div>
      </div>
    );
  }

  if (!user || !isClient) {
    // Redirect to client login
    return <Navigate to="/portal/login" state={{ from: location }} replace />;
  }

  return children;
};
