import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import PwaRegister from "@/components/PwaRegister";
import InstallPrompt from "@/components/InstallPrompt";

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  themeColor: "#0b0e14",
};

export const metadata: Metadata = {
  title: "Nexora Smart",
  description: "Control de acceso inteligente",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Nexora Smart",
  },
  icons: {
    apple: "/icon-192.png",
    icon: "/icon-512.png",
  },
};

import Image from "next/image";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${inter.className} min-h-[100dvh] flex flex-col bg-[#0b0e14]`}>
        <PwaRegister />
        <InstallPrompt />
        <main className="flex-1 flex flex-col">
          {children}
        </main>
        <footer className="py-8 border-t border-white/5 mt-auto bg-[#0b0e14] z-50">
          <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-center gap-3 md:gap-4 text-sm text-gray-400 font-medium">
            <span>© 2026 Nexora Smart. All rights reserved.</span>
            <span className="hidden md:inline text-gray-600">|</span>
            <div className="flex items-center gap-2">
              <span>Web design by</span>
              <a 
                href="https://www.greencodecr.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="opacity-80 hover:opacity-100 transition-all transform hover:scale-105 inline-flex"
              >
                <Image 
                  src="/greencode-logo.webp" 
                  alt="Greencode" 
                  width={350} 
                  height={100} 
                  className="h-20 w-auto object-contain -ml-1" 
                />
              </a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
