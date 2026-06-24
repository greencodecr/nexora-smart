import Link from "next/link";
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
          
          <h1 className="text-5xl sm:text-7xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-white/50">
            Arroyo App
          </h1>
          <p className="text-xl sm:text-2xl text-muted max-w-2xl mx-auto leading-relaxed">
            Ingresa tus credenciales de Supabase para continuar.
          </p>
        </div>

        <LoginForm />

        <div className="grid sm:grid-cols-3 gap-6 pt-16">
          {[
            {
              icon: <Lock className="w-6 h-6 text-brand-400" />,
              title: "Seguro",
              description: "Autenticación OAuth 2.0 segura directamente con los servidores de eWeLink."
            },
            {
              icon: <Smartphone className="w-6 h-6 text-brand-400" />,
              title: "Control Remoto",
              description: "Abre y cierra tus portones estés donde estés, en tiempo real."
            },
            {
              icon: <ShieldCheck className="w-6 h-6 text-brand-400" />,
              title: "Confiable",
              description: "Diseñado para alta disponibilidad e integración perfecta."
            }
          ].map((feature, i) => (
            <div key={i} className="glass-card p-6 text-left space-y-4">
              <div className="w-12 h-12 rounded-xl bg-brand-500/10 flex items-center justify-center border border-brand-500/20">
                {feature.icon}
              </div>
              <h3 className="text-lg font-semibold text-white">{feature.title}</h3>
              <p className="text-muted leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
