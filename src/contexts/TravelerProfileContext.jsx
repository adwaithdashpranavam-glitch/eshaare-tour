import React, { createContext, useContext, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { subscribeToUserProfile } from "../lib/firestore";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";

const TravelerProfileContext = createContext(null);

export const useTravelerProfile = () => {
  const ctx = useContext(TravelerProfileContext);
  if (!ctx) {
    throw new Error("useTravelerProfile must be used within a TravelerProfileProvider");
  }
  return ctx;
};

/**
 * Subscribes to the signed-in user's traveler profile document and exposes
 * { profile, profileCompleted, loading } to the portal subtree.
 */
export const TravelerProfileProvider = ({ children }) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) {
      setProfile(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsub = subscribeToUserProfile(
      user.uid,
      (data) => {
        setProfile(data);
        setLoading(false);
      },
      () => setLoading(false)
    );
    return () => unsub && unsub();
  }, [user?.uid]);

  const value = {
    profile,
    profileCompleted: !!profile?.profileCompleted,
    loading
  };

  return (
    <TravelerProfileContext.Provider value={value}>
      {children}
    </TravelerProfileContext.Provider>
  );
};

/**
 * Route guard: blocks all portal features until the traveler profile is complete.
 * Redirects to the verification flow while profileCompleted === false.
 */
export const ProfileCompleteGuard = ({ children }) => {
  const { loading, profileCompleted } = useTravelerProfile();
  const location = useLocation();

  if (loading) {
    return <LoadingSpinner message="Loading your profile..." fullScreen={true} />;
  }

  if (!profileCompleted) {
    return <Navigate to="/portal/verify-profile" state={{ from: location }} replace />;
  }

  return children;
};

export default TravelerProfileContext;
