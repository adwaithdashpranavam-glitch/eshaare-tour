import React, { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { Compass, UserCheck, Mail, Lock, User, Phone, Globe, LogIn } from "lucide-react";
import toast from "react-hot-toast";
import { getAuthErrorMessage } from "../../utils/authErrors";

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
      toast.error(getAuthErrorMessage(err, "Login failed. Please check your credentials."));
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

    const passwordPolicy = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;
    if (!passwordPolicy.test(signUpPassword)) {
      toast.error("Password must be at least 8 characters, including uppercase, lowercase, a number, and a symbol.");
      return;
    }

    setLoading(true);
    try {
      await register(signUpEmail.trim(), signUpPassword, {
        name: name.trim(),
        phoneNumber: phoneNumber.trim(),
        nationality: nationality.trim()
      });
      toast.success("Account created! Please verify your email to continue.");
      navigate("/portal/verify-email", { replace: true });
    } catch (err) {
      console.error(err);
      toast.error(getAuthErrorMessage(err, "Sign up failed. Please check your inputs."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F5F1E8] px-6 py-12 font-sans relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute -top-40 -left-40 h-96 w-96 bg-[#C6A969]/10 blur-3xl rounded-full"></div>
      <div className="absolute -bottom-40 -right-40 h-96 w-96 bg-[#C6A969]/10 blur-3xl rounded-full"></div>

      <div className="w-full max-w-md rounded-3xl border border-[#0F3D2E]/10 bg-white p-8 shadow-xl relative z-10 space-y-6">

        {/* Header */}
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <div className="p-3 bg-[#F5F1E8] border border-[#0F3D2E]/10 text-[#0F3D2E] rounded-full shadow-md">
              <Compass className="h-8 w-8 animate-spin-slow" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-[#0F3D2E] tracking-wide">
            Client Portal
          </h2>
          <p className="text-xs text-gray-500">
            Secure Access & Online Registration
          </p>
        </div>

        {/* Developer / Maintenance Notice */}
        {import.meta.env.VITE_DEV_LOGIN_ENABLED === "true" && (
          <div className="p-3.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl text-xs space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-amber-900">
              <span className="inline-block w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
              Maintenance &amp; Security Testing Mode
            </div>
            <p className="text-amber-700/90 leading-relaxed">
              Public registration and login are temporarily disabled. Access is currently restricted to whitelisted development and QA accounts.
            </p>
          </div>
        )}

        {/* Tab Switcher */}
        <div className="flex rounded-xl bg-[#F5F1E8] p-1 border border-[#0F3D2E]/10">
          <button
            onClick={() => setActiveTab("login")}
            className={`flex-1 rounded-lg py-2 text-xs font-bold uppercase tracking-wider transition-all ${activeTab === "login"
              ? "bg-gradient-to-r from-[#C6A969] to-[#D4AF37] text-white shadow-sm"
              : "text-gray-500 hover:text-[#0F3D2E]"
              }`}
          >
            Login
          </button>
          <button
            onClick={() => setActiveTab("signup")}
            className={`flex-1 rounded-lg py-2 text-xs font-bold uppercase tracking-wider transition-all ${activeTab === "signup"
              ? "bg-gradient-to-r from-[#C6A969] to-[#D4AF37] text-white shadow-sm"
              : "text-gray-500 hover:text-[#0F3D2E]"
              }`}
          >
            Sign Up
          </button>
        </div>

        {/* Form area */}
        {activeTab === "login" ? (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-[#0F3D2E] uppercase tracking-wider pl-1">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#0F3D2E]">
                  <Mail className="h-4 w-4" />
                </span>
                <input
                  type="email"
                  required
                  placeholder="traveller@example.com"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#0F3D2E]/20 bg-[#FAF8F5] text-gray-800 outline-none focus:border-[#0F3D2E] focus:ring-1 focus:ring-[#0F3D2E] transition-colors text-sm"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-[#0F3D2E] uppercase tracking-wider pl-1">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#0F3D2E]">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#0F3D2E]/20 bg-[#FAF8F5] text-gray-800 outline-none focus:border-[#0F3D2E] focus:ring-1 focus:ring-[#0F3D2E] transition-colors text-sm"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-[#C6A969] to-[#D4AF37] py-3.5 font-bold text-white hover:from-[#B59858] hover:to-[#C6A969] transition-all duration-300 disabled:opacity-50 text-sm mt-6 flex items-center justify-center space-x-2 shadow-md shadow-[#C6A969]/25"
            >
              <LogIn className="h-4 w-4 text-white" />
              <span>{loading ? "Verifying..." : "Access Portal"}</span>
            </button>
          </form>
        ) : (
          <form onSubmit={handleSignUpSubmit} className="space-y-3.5">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-[#0F3D2E] uppercase tracking-wider pl-1">
                Full Name
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#0F3D2E]">
                  <User className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  required
                  placeholder="John Doe"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#0F3D2E]/20 bg-[#FAF8F5] text-gray-800 outline-none focus:border-[#0F3D2E] focus:ring-1 focus:ring-[#0F3D2E] transition-colors text-sm"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-[#0F3D2E] uppercase tracking-wider pl-1">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#0F3D2E]">
                  <Mail className="h-4 w-4" />
                </span>
                <input
                  type="email"
                  required
                  placeholder="name@domain.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#0F3D2E]/20 bg-[#FAF8F5] text-gray-800 outline-none focus:border-[#0F3D2E] focus:ring-1 focus:ring-[#0F3D2E] transition-colors text-sm"
                  value={signUpEmail}
                  onChange={(e) => setSignUpEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-[#0F3D2E] uppercase tracking-wider pl-1">
                Phone Number
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#0F3D2E]">
                  <Phone className="h-4 w-4" />
                </span>
                <input
                  type="tel"
                  required
                  placeholder="+971 50 123 4567"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#0F3D2E]/20 bg-[#FAF8F5] text-gray-800 outline-none focus:border-[#0F3D2E] focus:ring-1 focus:ring-[#0F3D2E] transition-colors text-sm"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-[#0F3D2E] uppercase tracking-wider pl-1">
                Nationality
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#0F3D2E]">
                  <Globe className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  required
                  placeholder="UAE / UK / India"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#0F3D2E]/20 bg-[#FAF8F5] text-gray-800 outline-none focus:border-[#0F3D2E] focus:ring-1 focus:ring-[#0F3D2E] transition-colors text-sm"
                  value={nationality}
                  onChange={(e) => setNationality(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-[#0F3D2E] uppercase tracking-wider pl-1">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#0F3D2E]">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  type="password"
                  required
                  placeholder="Min. 8 characters (mixed case + symbol)"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#0F3D2E]/20 bg-[#FAF8F5] text-gray-800 outline-none focus:border-[#0F3D2E] focus:ring-1 focus:ring-[#0F3D2E] transition-colors text-sm"
                  value={signUpPassword}
                  onChange={(e) => setSignUpPassword(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-[#0F3D2E] uppercase tracking-wider pl-1">
                Confirm Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#0F3D2E]">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  type="password"
                  required
                  placeholder="Confirm password"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#0F3D2E]/20 bg-[#FAF8F5] text-gray-800 outline-none focus:border-[#0F3D2E] focus:ring-1 focus:ring-[#0F3D2E] transition-colors text-sm"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-[#C6A969] to-[#D4AF37] py-3.5 font-bold text-white hover:from-[#B59858] hover:to-[#C6A969] transition-all duration-300 disabled:opacity-50 text-sm mt-6 flex items-center justify-center space-x-2 shadow-md shadow-[#C6A969]/25"
            >
              <span>{loading ? "Registering Account..." : "Create Account & Sign In"}</span>
            </button>
          </form>
        )}

        <div className="text-center pt-3 border-t border-gray-200 flex items-center justify-center gap-1.5">
          <Link to="/" className="text-xs text-gray-500 hover:text-[#0F3D2E] transition-colors">
            Back to Home
          </Link>
          <span className="text-gray-300 text-xs">•</span>
          <Link to="/login" className="text-xs text-gray-500 hover:text-[#0F3D2E] transition-colors">
            Staff Login
          </Link>
        </div>
      </div>
    </main>
  );
};

export default PortalLogin;
