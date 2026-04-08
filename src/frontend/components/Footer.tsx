import Link from "next/link";
import { ShieldCheck, Github, Twitter, Linkedin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="w-full border-t border-white/5 bg-[#030712] pt-16 pb-8 relative z-10">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          
          {/* Brand Column */}
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-3 group mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/40 transition-all">
                <ShieldCheck className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-bold text-white tracking-tight font-space-grotesk">Detectify</span>
            </Link>
            <p className="text-white/40 text-sm leading-relaxed max-w-sm mb-6">
              Empowering users to verify digital authenticity natively within the browser using advanced Convolutional Neural Networks.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors">
                <Github size={18} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors">
                <Twitter size={18} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors">
                <Linkedin size={18} />
              </a>
            </div>
          </div>

          {/* Links Column */}
          <div>
            <h3 className="text-white font-semibold mb-4 font-space-grotesk">Technology</h3>
            <ul className="space-y-3">
              <li><Link href="#" className="text-sm text-white/50 hover:text-blue-400 transition-colors">Neural Engine</Link></li>
              <li><Link href="#" className="text-sm text-white/50 hover:text-blue-400 transition-colors">TF.js Architecture</Link></li>
              <li><Link href="#" className="text-sm text-white/50 hover:text-blue-400 transition-colors">API Documentation</Link></li>
              <li><Link href="#" className="text-sm text-white/50 hover:text-blue-400 transition-colors">System Status</Link></li>
            </ul>
          </div>

          {/* Legal Column */}
          <div>
            <h3 className="text-white font-semibold mb-4 font-space-grotesk">Legal & Trust</h3>
            <ul className="space-y-3">
              <li><Link href="#" className="text-sm text-white/50 hover:text-blue-400 transition-colors">Privacy Policy</Link></li>
              <li><Link href="#" className="text-sm text-white/50 hover:text-blue-400 transition-colors">Terms of Service</Link></li>
              <li><Link href="#" className="text-sm text-white/50 hover:text-blue-400 transition-colors">Data Ethics</Link></li>
              <li><Link href="#" className="text-sm text-white/50 hover:text-blue-400 transition-colors">Contact Security</Link></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-white/30 text-xs text-center md:text-left">
            © 2026 AI Detector Systems. All rights reserved. Not for medical or critical diagnostic use.
          </p>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-white/50 font-mono">All Systems Operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
