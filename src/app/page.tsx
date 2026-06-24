import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Lock, Smartphone, ShieldCheck } from "lucide-react";

import { LoginForm } from "@/components/LoginForm";

export default function Home() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12">
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-600/20 rounded-full mix-blend-screen filter blur-[100px] animate-pulse" />
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full mix-blend-screen filter blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="max-w-4xl w-full mx-auto text-center space-y-8">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-brand-500/30 text-brand-300 text-sm font-medium mb-4">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500"></span>
            </span>
            Acceso Autorizado Únicamente
          </div>
          
          <Image src="/nexora-logo.webp" alt="Nexora Smart" width={200} height={200} className="mx-auto drop-shadow-2xl" />

          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-white/50">
            Nexora Smart
          </h1>
          <p className="text-base text-muted max-w-2xl mx-auto leading-relaxed">
            Ingresa tus credenciales para continuar.
          </p>
        </div>

        <LoginForm />

      </div>
    </main>
  );
}
