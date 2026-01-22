import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download, X, Smartphone } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [showIOSPrompt, setShowIOSPrompt] = useState(false);
  const isMobile = useIsMobile();

  // Check if running as standalone PWA
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
    || (window.navigator as any).standalone === true;

  useEffect(() => {
    // Don't show if already installed as PWA
    if (isStandalone) return;

    // Handle Android/Chrome install prompt - show every time
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Always show prompt after short delay
      setTimeout(() => setShowPrompt(true), 1500);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Handle iOS - show custom prompt for Safari - always show
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
    
    if (isIOS && isSafari && isMobile) {
      setTimeout(() => setShowIOSPrompt(true), 1500);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, [isStandalone, isMobile]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowPrompt(false);
      localStorage.removeItem('pwa-install-dismissed');
      localStorage.removeItem('pwa-install-dismissed-time');
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setShowIOSPrompt(false);
    // No longer persist dismissal - will show again on next visit
  };

  // iOS-specific install instructions
  if (showIOSPrompt) {
    return (
      <div className="fixed bottom-20 left-4 right-4 z-50 bg-card border border-border rounded-xl p-4 shadow-xl animate-slide-up">
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 p-1 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="flex items-start gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Smartphone className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-foreground">Install KSL Translator</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Tap the <span className="inline-flex items-center px-1 bg-muted rounded">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13"/>
                </svg>
              </span> share button, then <strong>"Add to Home Screen"</strong>
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 bg-card border border-border rounded-xl p-4 shadow-xl animate-slide-up md:left-auto md:right-4 md:max-w-sm">
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 p-1 text-muted-foreground hover:text-foreground"
      >
        <X className="h-4 w-4" />
      </button>
      <div className="flex items-start gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Download className="h-6 w-6 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-foreground">Install KSL Translator</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Add to home screen for quick access and offline use
          </p>
          <Button onClick={handleInstall} size="sm" className="mt-3">
            Install App
          </Button>
        </div>
      </div>
    </div>
  );
};
