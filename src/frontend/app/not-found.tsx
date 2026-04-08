import Link from 'next/link';
import { ShieldCheck, House } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center p-6 bg-[#030712] relative overflow-hidden text-white">
      {/* Background radial effects */}
      <div className="absolute top-[10%] left-[10%] w-[400px] h-[400px] bg-blue-600/5 rounded-full blur-[100px]" />
      <div className="absolute bottom-[10%] right-[10%] w-[400px] h-[400px] bg-purple-600/5 rounded-full blur-[100px]" />
      
      <div className="text-center relative z-10 max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-8 shadow-inner">
          <ShieldCheck className="w-8 h-8 text-blue-400 opacity-50" />
        </div>
        
        <h1 className="text-6xl font-black mb-4 font-space-grotesk tracking-tighter">404</h1>
        <h2 className="text-2xl font-bold mb-4 text-white/90">Path Not Recognized</h2>
        <p className="text-white/40 mb-10 leading-relaxed">
          The requested coordinate is not registered within the Detectify network. 
          Please return to the main interface to begin analysis.
        </p>
        
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-white text-black font-bold hover:bg-white/90 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)]"
        >
          <House className="w-4 h-4" />
          Retrace Steps
        </Link>
      </div>
    </div>
  );
}
