import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google"; // Import Space Grotesk
import "./globals.css";
import AuthProvider from "@/components/AuthProvider";
import Navbar from "@/components/Navbar";
import { Toaster } from "sonner"; // Import Sonner

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});

export const metadata: Metadata = {
  title: "AI Image Detector | Real vs AI-Generated Images",
  description: "Advanced technology to identify and differentiate between authentic photographs and AI-generated imagery.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${spaceGrotesk.variable} font-sans antialiased bg-[#030712] min-h-screen text-white relative`}>
        {/* Global Abstract Background Effects */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-blue-600/5 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-purple-600/5 rounded-full blur-[100px]" />
          <div className="absolute inset-0 bg-white/5 opacity-[0.02] mix-blend-overlay" />
        </div>

        <div className="relative z-10 flex flex-col min-h-screen">
          <AuthProvider>
            <Navbar />
            <main className="flex-grow">
              {children}
            </main>
          </AuthProvider>
        </div>
        
        {/* Sonner Toaster */}
        <Toaster 
          theme="dark" 
          position="bottom-right" 
          toastOptions={{
            className: "bg-[#0a0f1a] border border-white/10 text-white shadow-2xl backdrop-blur-xl font-sans"
          }}
        />
      </body>
    </html>
  );
}
