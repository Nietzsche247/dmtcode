import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { X, Smartphone } from 'lucide-react';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { toast } from 'sonner';

export const PWAInstallPrompt = () => {
  const { isInstallable, promptInstall } = usePWAInstall();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Show prompt after 5 seconds if installable and not dismissed
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (isInstallable && !dismissed) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isInstallable]);

  const handleInstall = async () => {
    const accepted = await promptInstall();
    if (accepted) {
      toast.success('App installed! Open from your home screen.');
    }
    setIsVisible(false);
  };

  const handleDismiss = () => {
    localStorage.setItem('pwa-install-dismissed', 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-in slide-in-from-bottom-5">
      <Card className="p-4 shadow-lg border-2 border-primary/30 bg-background/95 backdrop-blur-sm">
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
          aria-label="Dismiss install prompt"
        >
          <X className="w-4 h-4" />
        </button>
        
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Smartphone className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1 pr-6">
            <h4 className="font-semibold mb-1">Install DMT Code</h4>
            <p className="text-sm text-muted-foreground mb-3">
              Access offline, faster loading, and home screen icon
            </p>
            <div className="flex gap-2">
              <Button onClick={handleInstall} size="sm">
                Install App
              </Button>
              <Button onClick={handleDismiss} variant="ghost" size="sm">
                Not Now
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
