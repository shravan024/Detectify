"use client";

import { useState, useEffect } from "react";
import { signIn, useSession, getCsrfToken } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { data: session } = useSession();

  // Redirect if session is active (e.g., popup closed after successful login)
  useEffect(() => {
    if (session) {
      router.push("/");
      router.refresh();
    }
  }, [session, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (res?.error) {
        toast.error("Invalid credentials", { description: "Please check your email and password." });
      } else {
        toast.success("Authentication successful", { description: "Redirecting to console..." });
        router.push("/");
        router.refresh();
      }
    } catch {
      toast.error("Authentication failed", { description: "An error occurred during sign in." });
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider: string) => {
    setLoading(true);
    const providerId = provider.toLowerCase() === 'microsoft' ? 'azure-ad' : provider.toLowerCase();
    
    try {
      const csrfToken = await getCsrfToken();
      
      const width = 500;
      const height = 600;
      const left = (window.innerWidth / 2) - (width / 2);
      const top = (window.innerHeight / 2) - (height / 2);
      
      const popup = window.open(
        "",
        "OAuthLoginPopup",
        `width=${width},height=${height},top=${top},left=${left},toolbar=no,menubar=no,scrollbars=yes,resizable=yes`
      );

      if (!popup) {
        toast.error("Popup blocked", { description: "Please allow popups for this site to sign in." });
        setLoading(false);
        return;
      }

      // Create a form to POST to NextAuth's signin endpoint
      const form = document.createElement("form");
      form.method = "POST";
      form.action = `/api/auth/signin/${providerId}`;
      form.target = "OAuthLoginPopup";

      // Add CSRF token
      const csrfInput = document.createElement("input");
      csrfInput.type = "hidden";
      csrfInput.name = "csrfToken";
      csrfInput.value = csrfToken || "";
      form.appendChild(csrfInput);

      // Add Callback URL (redirects here after successful authorization)
      const callbackInput = document.createElement("input");
      callbackInput.type = "hidden";
      callbackInput.name = "callbackUrl";
      callbackInput.value = window.location.href;
      form.appendChild(callbackInput);

      document.body.appendChild(form);
      form.submit();
      document.body.removeChild(form);

      // Poll to see if the popup closed
      const timer = setInterval(() => {
        if (popup.closed) {
          clearInterval(timer);
          setLoading(false);
          // Reload to register the newly created session
          window.location.reload(); 
        }
      }, 500);
      
    } catch {
      toast.error("OAuth Initialization Failed", { description: "Unable to start the authentication flow." });
      setLoading(false);
    }
  };

  // Close popup automatically if it landed back on the login page after success
  useEffect(() => {
    if (window.opener && window.opener !== window) {
      window.close();
    }
  }, []);

  return (
    <div className="min-h-[calc(100vh-80px)] flex bg-[#030712] relative overflow-hidden">
      
      {/* Left Panel - Visuals/Branding (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 bg-black border-r border-white/5">
        
        {/* Abstract Background Effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-blue-600/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[100px]" />
          <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay" />
        </div>

        {/* Top Content */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-white tracking-tight">Detectify</span>
        </div>

        {/* Center Content */}
        <div className="relative z-10 max-w-lg mt-20">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            <span className="text-xs font-semibold text-white/70 uppercase tracking-widest font-sans">System Status: Secure</span>
          </div>
          
          <h1 className="text-6xl font-bold text-white leading-[1.1] tracking-tight mb-6 font-space-grotesk">
            Authenticate
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">
              to continue.
            </span>
          </h1>
          
          <p className="text-lg text-white/50 leading-relaxed max-w-md">
            Access enterprise-grade client-side Neural Networks. Verify image authenticity securely within your browser environment.
          </p>
        </div>

        {/* Bottom Content / Copyright */}
        <div className="relative z-10 mt-auto">
          <p className="text-sm text-white/30 font-medium">© 2026 AI Detector Systems. All rights reserved.</p>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative">
        <div className="w-full max-w-md">
          
          {/* Mobile Header (Only visible on small screens) */}
          <div className="flex lg:hidden items-center gap-3 mb-10 justify-center">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-white tracking-tight">Detectify</span>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <div className="mb-10 text-center lg:text-left">
              <h2 className="text-3xl font-bold text-white tracking-tight font-space-grotesk">Log in to your account</h2>
              <p className="text-white/40 mt-3 text-sm">Enter your credentials to access the console</p>
            </div>

            {/* Removed inline error rendering */}

            {/* Social Logins */}
            <div className="space-y-4 mb-8">
              <button 
                onClick={() => handleSocialLogin('Google')}
                type="button" 
                className="w-full flex items-center justify-center gap-3 px-5 py-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all group"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <span className="text-sm font-semibold text-white/90 group-hover:text-white">Continue with Google</span>
              </button>
              
              <button 
                onClick={() => handleSocialLogin('Microsoft')}
                type="button" 
                className="w-full flex items-center justify-center gap-3 px-5 py-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all group"
              >
                <svg className="w-5 h-5" viewBox="0 0 21 21">
                  <path fill="#f25022" d="M1 1h9v9H1z"/>
                  <path fill="#00a4ef" d="M1 11h9v9H1z"/>
                  <path fill="#7fba00" d="M11 1h9v9h-9z"/>
                  <path fill="#ffb900" d="M11 11h9v9h-9z"/>
                </svg>
                <span className="text-sm font-semibold text-white/90 group-hover:text-white">Continue with Microsoft</span>
              </button>
            </div>

            <div className="flex items-center gap-4 mb-8">
              <div className="h-px flex-1 bg-white/10" />
              <span className="text-xs font-semibold text-white/30 uppercase tracking-widest">OR</span>
              <div className="h-px flex-1 bg-white/10" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-white/80">Email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-5 py-3.5 rounded-xl bg-white/5 border border-white/10 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 text-white placeholder-white/20 transition-all hover:bg-white/[0.07]"
                  placeholder="name@company.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-white/80">Password</label>
                  <Link href="#" className="text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors">
                    Forgot password?
                  </Link>
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-5 py-3.5 rounded-xl bg-white/5 border border-white/10 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 text-white placeholder-white/20 transition-all hover:bg-white/[0.07]"
                  placeholder="••••••••"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 mt-4 rounded-xl font-bold bg-white text-black hover:bg-white/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </>
                ) : (
                  "Continue"
                )}
              </button>
            </form>

            <div className="mt-8 text-center lg:text-left">
              <p className="text-sm text-white/50">
                Don&apos;t have an account?{" "}
                <Link href="/register" className="text-white hover:text-blue-400 transition-colors font-medium underline underline-offset-4">
                  Sign up
                </Link>
              </p>
            </div>

          </motion.div>
        </div>
      </div>
    </div>
  );
}
