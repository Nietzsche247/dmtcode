import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmailCapture } from '@/components/EmailCapture';
import { LocaleProvider } from '@/i18n/LocaleProvider';

const STORAGE_KEY = 'dmtcode.signupBar.dismissed.v1';
const PATHS = new Set(['/', '/prepare', '/protocol-guide', '/registry']);

function SignupBarContent({ path }: { path: string }) {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    try {
      setVisible(!window.localStorage.getItem(STORAGE_KEY));
    } catch {
      setVisible(false);
    }
  }, []);

  const dismiss = () => {
    try {
      window.localStorage.setItem(STORAGE_KEY, '1');
    } catch {
      setVisible(false);
      return;
    }
    setVisible(false);
  };

  if (!visible || !PATHS.has(path)) return null;
  return (
    <div className="md:pt-16">
      <aside data-signup-bar className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background p-3 md:static md:border-b md:border-t-0">
        <div className="max-w-6xl mx-auto flex flex-wrap md:flex-nowrap items-center gap-2 md:gap-4">
          <p className="text-xs text-muted-foreground flex-1 min-w-0">{t('signupBar.text')}</p>
          <Button variant="ghost" size="icon" aria-label="Dismiss" onClick={dismiss} className="h-11 w-11 shrink-0 md:order-last"><X className="h-4 w-4" aria-hidden="true" /></Button>
          <div className="w-full md:w-72 shrink-0"><EmailCapture variant="inline" source="bar" onSuccess={dismiss} /></div>
        </div>
      </aside>
      <style>{`@media (max-width: 767px) { body:has([data-signup-bar]) { padding-bottom: calc(132px + env(safe-area-inset-bottom)); } [data-signup-bar] { padding-bottom: calc(12px + env(safe-area-inset-bottom)); } }`}</style>
    </div>
  );
}

export function SignupBar() {
  const { pathname } = useLocation();
  const match = pathname.match(/^\/(es|de)(?=\/|$)/);
  const locale = match?.[1] === 'es' ? 'es' : match?.[1] === 'de' ? 'de' : 'en';
  const path = pathname.replace(/^\/(es|de)(?=\/|$)/, '') || '/';
  return <LocaleProvider locale={locale}><SignupBarContent path={path} /></LocaleProvider>;
}
