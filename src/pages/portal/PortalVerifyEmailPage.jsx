import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { MailCheck, RefreshCw, LogOut, Loader2, Send } from "lucide-react";
import foxLogo from "../../assets/fox-logo.webp";
import toast from "react-hot-toast";

const RESEND_COOLDOWN = 45; // seconds

export const PortalVerifyEmailPage = () => {
  const { user, emailVerified, resendVerificationEmail, refreshEmailVerified, logout } = useAuth();
  const navigate = useNavigate();

  const [checking, setChecking] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const pollRef = useRef(null);

  // Already verified (e.g. existing user landed here) -> move on.
  useEffect(() => {
    if (emailVerified) navigate("/portal/dashboard", { replace: true });
  }, [emailVerified, navigate]);

  const checkVerified = useCallback(
    async (silent = false) => {
      if (!silent) setChecking(true);
      try {
        const verified = await refreshEmailVerified();
        if (verified) {
          toast.success("Email verified! Continuing…");
          navigate("/portal/dashboard", { replace: true });
        } else if (!silent) {
          toast.error("Not verified yet. Please click the link in your email, then try again.");
        }
      } catch (e) {
        if (!silent) toast.error("Could not check verification status.");
      } finally {
        if (!silent) setChecking(false);
      }
    },
    [refreshEmailVerified, navigate]
  );

  // Auto-poll every 5s so the page advances automatically once the user verifies.
  useEffect(() => {
    pollRef.current = setInterval(() => checkVerified(true), 5000);
    return () => clearInterval(pollRef.current);
  }, [checkVerified]);

  // Resend cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const handleResend = async () => {
    if (cooldown > 0) return;
    setResending(true);
    try {
      await resendVerificationEmail();
      toast.success("Verification email sent.");
      setCooldown(RESEND_COOLDOWN);
    } catch (e) {
      toast.error("Could not resend right now. Please wait a moment and try again.");
    } finally {
      setResending(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/portal/login", { replace: true });
  };

  return (
    <div className="min-h-screen w-full bg-[#F8F6F2] text-[#1A1A1A] font-sans antialiased flex flex-col">
      {/* Header with logout (top-right) */}
      <header className="h-16 bg-white border-b border-[#E5E7EB] sticky top-0 z-30 flex items-center justify-between px-4 md:px-8">
        <div className="flex items-center gap-2">
          <img src={foxLogo} alt="Eshaare Tour" width="90" height="60" className="h-9 w-auto object-contain" />
          <div className="leading-none">
            <h1 className="text-base md:text-lg text-[#0F3D2E] font-bold" style={{ fontFamily: "'Great Vibes', cursive" }}>
              Eshaare Tour
            </h1>
            <p className="text-[5px] tracking-[0.25em] uppercase text-gray-500 font-semibold">Visa Concierge</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E5E7EB] text-[#6B7280] hover:text-red-600 hover:border-red-200 hover:bg-red-50 text-[11px] font-semibold transition-colors"
        >
          <LogOut className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Log out</span>
        </button>
      </header>

      <main className="flex-1 w-full max-w-lg mx-auto px-4 md:px-6 py-10 flex items-start justify-center">
        <div className="w-full bg-white border border-[#E5E7EB] rounded-[28px] shadow-sm overflow-hidden">
          <div className="bg-gradient-to-br from-[#0F3D2E] to-[#155740] px-6 md:px-10 py-10 text-center">
            <div className="inline-flex h-16 w-16 rounded-2xl bg-white/10 border border-white/20 items-center justify-center mb-4">
              <MailCheck className="h-8 w-8 text-[#C6A969]" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-white">Verify Your Email</h2>
            <p className="text-[#C6A969] text-xs uppercase tracking-[0.2em] font-semibold mt-2">One more step</p>
          </div>

          <div className="px-6 md:px-10 py-8 space-y-5">
            <p className="text-sm text-[#1A1A1A] leading-relaxed">
              We've sent a verification link to
              <span className="font-bold text-[#0F3D2E]"> {user?.email || "your email"}</span>.
              Open it to confirm your address, then return here.
            </p>
            <p className="text-[12px] text-[#6B7280] leading-relaxed">
              This page will continue automatically once you verify. Don't forget to check your spam folder.
            </p>

            <button
              onClick={() => checkVerified(false)}
              disabled={checking}
              className="w-full py-3.5 rounded-xl bg-[#0F3D2E] text-white hover:bg-[#0F3D2E]/90 font-bold uppercase tracking-wider text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
            >
              {checking ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4 text-[#C6A969]" />}
              I've verified — continue
            </button>

            <button
              onClick={handleResend}
              disabled={resending || cooldown > 0}
              className="w-full py-3 rounded-xl border border-[#E5E7EB] bg-white text-[#6B7280] hover:text-[#0F3D2E] hover:border-[#0F3D2E]/40 font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
            >
              {resending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend verification email"}
            </button>

            <div className="pt-2 text-center">
              <button
                onClick={handleLogout}
                className="text-[11px] text-gray-400 hover:text-red-600 font-medium underline-offset-2 hover:underline transition-colors"
              >
                Use a different account / log out
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PortalVerifyEmailPage;
