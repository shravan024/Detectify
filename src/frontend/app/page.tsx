'use client';

import dynamic from 'next/dynamic';
import { ShieldCheck, Search, Cpu } from 'lucide-react';

import Footer from '@/components/Footer';

// Avoid SSR for TF.js code
const ImageDetector = dynamic(() => import('@/components/ImageDetector'), {
  ssr: false,
  loading: () => (
    <div className="flex justify-center items-center h-64 border border-white/5 rounded-3xl bg-white/[0.02] backdrop-blur-sm">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
    </div>
  ),
});

export default function Home() {
  return (
    <div className="flex flex-col min-h-[calc(100vh-80px)]">
      <div className="flex-grow py-8 sm:py-16 px-4 flex flex-col items-center">
        <div className="container mx-auto max-w-5xl">
        
        {/* Hero Section */}
        <div className="text-center mb-10 sm:mb-16 relative">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 mb-6 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-xs font-semibold text-white/70 uppercase tracking-widest">v2.0 Neural Engine Active</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold text-white mb-4 sm:mb-6 tracking-tight leading-[1.1]">
            Identify AI Content
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">
              with Absolute Certainty.
            </span>
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-white/50 max-w-2xl mx-auto leading-relaxed px-2">
            Upload an image to our local client-side Convolutional Neural Network. All inference is processed directly in your browser ensuring complete privacy and zero data retention.
          </p>
        </div>

        {/* Main Detector Component */}
        <div className="mb-12 sm:mb-20">
          <ImageDetector />
        </div>

        {/* Info Grid */}
        <div className="grid md:grid-cols-3 gap-6 pt-12 border-t border-white/5">
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors">
            <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mb-6 border border-blue-500/20">
              <Search className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-3">1. Secure Preprocessing</h3>
            <p className="text-sm text-white/50 leading-relaxed">
              Images are securely resized and normalized inside your browser exactly matching the (256x256) input shape. No visual data is ever transmitted to an external server.
            </p>
          </div>
          
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors">
            <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center mb-6 border border-purple-500/20">
              <Cpu className="w-6 h-6 text-purple-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-3">2. Neural Inference</h3>
            <p className="text-sm text-white/50 leading-relaxed">
              Powered by TensorFlow.js, our multi-layer Convolutional Neural Network extracts granular artifacts indicative of diffusion or GAN-based AI generation natively.
            </p>
          </div>
          
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors">
            <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center mb-6 border border-green-500/20">
              <ShieldCheck className="w-6 h-6 text-green-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-3">3. Rapid Output</h3>
            <p className="text-sm text-white/50 leading-relaxed">
              The dense classification layers output a highly accurate confidence score instantly. Verify the authenticity of digital photographs within seconds.
            </p>
          </div>
        </div>

      </div>
    </div>
    <Footer />
    </div>
  );
}
