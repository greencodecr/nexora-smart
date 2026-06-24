"use client";

import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      // Update UI notify the user they can install the PWA
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Check if already installed
    window.addEventListener('appinstalled', () => {
      setShowPrompt(false);
      setDeferredPrompt(null);
      console.log('PWA was installed');
    });

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);
    
    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-sm animate-in fade-in slide-in-from-bottom-5">
      <div className="glass-card p-4 rounded-2xl border border-brand-500/30 shadow-2xl flex items-center gap-4">
        <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
          <Download className="w-6 h-6 text-brand-300" />
        </div>
        <div className="flex-1">
          <h4 className="text-white font-medium text-sm">Instalar Nexora Smart</h4>
          <p className="text-muted text-xs">Accede más rápido desde tu inicio</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleInstallClick}
            className="bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            Instalar
          </button>
          <button 
            onClick={() => setShowPrompt(false)}
            className="p-2 text-muted hover:text-white transition-colors rounded-lg bg-white/5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
