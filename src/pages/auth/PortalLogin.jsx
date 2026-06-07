import React, { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { Compass, UserCheck, Mail, Lock, User, Phone, Globe, LogIn } from "lucide-react";
import toast from "react-hot-toast";

export const PortalLogin = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { login, register } = useAuth();

  const [activeTab, setActiveTab] = useState(location.state?.tab || "login"); // "login" or "signup"

  // Login states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Signup states
  const [name, setName] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [nationality, setNationality] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);

  const redirectUrl = location.state?.from?.pathname || "/portal/dashboard";

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill in all fields.");
      return;
    }

    setLoading(true);
    try {
      await login(email.trim(), password);
      toast.success("Welcome to your Client Portal!");
      navigate(redirectUrl);
    } catch (err) {
      console.error(err);
      toast.error("Login failed. Check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUpSubmit = async (e) => {
    e.preventDefault();
    if (!name || !signUpEmail || !phoneNumber || !nationality || !signUpPassword || !confirmPassword) {
      toast.error("All fields are required.");
      return;
    }

    if (signUpPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    if (signUpPassword.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      await register(signUpEmail.trim(), signUpPassword, {
        name: name.trim(),
        phoneNumber: phoneNumber.trim(),
        nationality: nationality.trim()
      });
      toast.success("Registration successful! Welcome to ESHAAR Tours.");
      navigate(redirectUrl);
    } catch (err) {
      console.error(err);
      toast.error("Sign up failed. " + (err.message || "Please check your inputs."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#071120] px-6 py-12 font-sans relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute -top-40 -left-40 h-96 w-96 bg-[#e68932]/5 blur-3xl rounded-full"></div>
      <div className="absolute -bottom-40 -right-40 h-96 w-96 bg-[#e68932]/5 blur-3xl rounded-full"></div>

      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl relative z-10 space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <div className="p-3 bg-white/5 border border-white/10 text-[#e68932] rounded-full shadow-lg">
              <Compass className="h-8 w-8 animate-spin-slow" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-wide">
            Client Portal
          </h2>
          <p className="text-xs text-gray-400">
            Secure Access & Online Registration
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex rounded-xl bg-black/40 p-1 border border-white/5">
          <button
            onClick={() => setActiveTab("login")}
            className={`flex-1 rounded-lg py-2 text-xs font-semibold uppercase tracking-wider transition-all ${
              activeTab === "login"
                ? "bg-[#e68932] text-white shadow-md"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Login
          </button>
          <button
            onClick={() => setActiveTab("signup")}
            className={`flex-1 rounded-lg py-2 text-xs font-semibold uppercase tracking-wider transition-all ${
              activeTab === "signup"
                ? "bg-[#e68932] text-white shadow-md"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Form area */}
        {activeTab === "login" ? (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider pl-1">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                  <Mail className="h-4 w-4" />
                </span>
                <input
                  type="email"
                  required
                  placeholder="traveller@example.com"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-white/10 bg-black/40 text-white outline-none focus:border-[#e68932]/50 transition-colors text-sm"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider pl-1">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-white/10 bg-black/40 text-white outline-none focus:border-[#e68932]/50 transition-colors text-sm"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#e68932] py-3.5 font-semibold text-white hover:bg-[#cf7726] transition-colors disabled:opacity-50 text-sm mt-6 flex items-center justify-center space-x-2"
            >
              <LogIn className="h-4 w-4" />
              <span>{loading ? "Verifying..." : "Access Portal"}</span>
            </button>
          </form>
        ) : (
          <form onSubmit={handleSignUpSubmit} className="space-y-3.5">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider pl-1">
                Full Name
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                  <User className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  required
                  placeholder="John Doe"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/10 bg-black/40 text-white outline-none focus:border-[#e68932]/50 transition-colors text-sm"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider pl-1">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                  <Mail className="h-4 w-4" />
                </span>
                <input
                  type="email"
                  required
                  placeholder="name@domain.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/10 bg-black/40 text-white outline-none focus:border-[#e68932]/50 transition-colors text-sm"
                  value={signUpEmail}
                  onChange={(e) => setSignUpEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider pl-1">
                Phone Number
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                  <Phone className="h-4 w-4" />
                </span>
                <input
                  type="tel"
                  required
                  placeholder="+971 50 123 4567"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/10 bg-black/40 text-white outline-none focus:border-[#e68932]/50 transition-colors text-sm"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider pl-1">
                Nationality
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                  <Globe className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  required
                  placeholder="UAE / UK / India"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/10 bg-black/40 text-white outline-none focus:border-[#e68932]/50 transition-colors text-sm"
                  value={nationality}
                  onChange={(e) => setNationality(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider pl-1">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  type="password"
                  required
                  placeholder="Min. 6 characters"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/10 bg-black/40 text-white outline-none focus:border-[#e68932]/50 transition-colors text-sm"
                  value={signUpPassword}
                  onChange={(e) => setSignUpPassword(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider pl-1">
                Confirm Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  type="password"
                  required
                  placeholder="Confirm password"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/10 bg-black/40 text-white outline-none focus:border-[#e68932]/50 transition-colors text-sm"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#e68932] py-3.5 font-semibold text-white hover:bg-[#cf7726] transition-colors disabled:opacity-50 text-sm mt-6 flex items-center justify-center space-x-2"
            >
              <span>{loading ? "Registering Account..." : "Create Account & Sign In"}</span>
            </button>
          </form>
        )}

        <div className="text-center pt-3 border-t border-white/10 flex items-center justify-center gap-1.5">
          <Link to="/" className="text-xs text-gray-400 hover:text-[#e68932] transition-colors">
            Back to Home
          </Link>
          <span className="text-gray-600 text-xs">•</span>
          <Link to="/login" className="text-xs text-gray-400 hover:text-[#e68932] transition-colors">
            Staff Login
          </Link>
        </div>
      </div>
    </main>
  );
};

export default PortalLogin;
