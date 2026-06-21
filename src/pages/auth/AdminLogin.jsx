import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { signOut } from "firebase/auth";
import { auth } from "../../lib/firebase";
import toast from "react-hot-toast";
import { ArrowLeft } from "lucide-react";

export const AdminLogin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  useEffect(() => {
    // Automatically sign out any existing session on mount so that the user sees a fresh login page
    signOut(auth).catch((err) => {
      console.error("Error signing out existing session on mount:", err);
    });
  }, []);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const redirectUrl = location.state?.from?.pathname || "/admin/dashboard";

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill in all fields.");
      return;
    }

    setLoading(true);
    try {
      await login(email.trim(), password);
      toast.success("Welcome to ESHAARE CRM!");
      navigate(redirectUrl);
    } catch (err) {
      console.error(err);
      toast.error("Invalid credentials. Please verify your email and password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F5F1E8] px-6 font-sans relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute -top-40 -left-40 h-96 w-96 bg-[#C6A969]/10 blur-3xl rounded-full"></div>
      <div className="absolute -bottom-40 -right-40 h-96 w-96 bg-[#C6A969]/10 blur-3xl rounded-full"></div>

      <div className="w-full max-w-md rounded-3xl border border-[#0F3D2E]/10 bg-white p-8 shadow-xl relative z-10">
        {/* Navigation */}
        <div className="flex items-center justify-between mb-6">
          <Link
            to="/"
            className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-[#0F3D2E] transition-colors group"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            <span>Back to Home</span>
          </Link>
          <Link
            to="/portal/login"
            className="text-xs font-semibold text-[#0F3D2E] hover:text-[#C6A969] transition-colors"
          >
            Client Portal
          </Link>
        </div>

        <h1 className="text-3xl font-bold text-[#0F3D2E]">Admin Login</h1>
        <p className="mt-2 text-gray-500">Sign in to Tourism CRM</p>

        <form onSubmit={handleLoginSubmit} className="mt-8 space-y-5">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-[#0F3D2E] uppercase tracking-wider pl-1">
              Admin Email
            </label>
            <input
              type="email"
              placeholder="admin@eshaareuae.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-xl border border-[#0F3D2E]/20 bg-[#FAF8F5] px-4 py-3 text-gray-800 outline-none focus:border-[#0F3D2E] focus:ring-1 focus:ring-[#0F3D2E] transition-colors text-sm"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-[#0F3D2E] uppercase tracking-wider pl-1">
              Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-xl border border-[#0F3D2E]/20 bg-[#FAF8F5] px-4 py-3 text-gray-800 outline-none focus:border-[#0F3D2E] focus:ring-1 focus:ring-[#0F3D2E] transition-colors text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-[#C6A969] to-[#D4AF37] py-3.5 font-bold text-white hover:from-[#B59858] hover:to-[#C6A969] transition-all duration-300 disabled:opacity-50 text-sm mt-2 shadow-md shadow-[#C6A969]/25"
          >
            {loading ? "Signing In..." : "Login"}
          </button>
        </form>
      </div>
    </main>
  );
};

export default AdminLogin;
