import { useLocation } from 'react-router-dom';
import { SUPPORTED_LOCALES, type AppLocale } from '@/i18n';
import { useLocale, localePath } from '@/i18n/LocaleProvider';
import { cn } from '@/lib/utils';

const LABELS: Record<AppLocale, string> = { en: 'EN', es: 'ES', de: 'DE' };

// Plain crawlable anchors, not router links: each one is a real document at a
// real URL under the other locale prefix, and crawlers must be able to follow
// them without executing JavaScript.
export const LanguageSwitcher = ({ className }: { className?: string }) => {
  const locale = useLocale();
  const location = useLocation();

  const segments = location.pathname.split('/').filter(Boolean);
  if (segments[0] === 'es' || segments[0] === 'de') segments.shift();
  const basePath = `/${segments.join('/')}`;
  const search = location.search || '';

  return (
    <nav aria-label="Language" className={cn('flex items-center', className)}>
      {SUPPORTED_LOCALES.map((code, i) => {
        const active = code === locale;
        return (
          <span key={code} className="flex items-center">
            {i > 0 && (
              <span aria-hidden="true" className="px-1 text-muted-foreground/50 text-xs">
                &middot;
              </span>
            )}
            <a
              href={`${localePath(code, basePath)}${search}`}
              hrefLang={code}
              lang={code}
              rel="alternate"
              aria-current={active ? 'true' : undefined}
              className={cn(
                'inline-flex items-center justify-center min-h-[44px] px-1.5 text-xs uppercase tracking-widest transition-colors',
                active
                  ? 'text-primary font-medium'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {LABELS[code]}
            </a>
          </span>
        );
      })}
    </nav>
  );
};

export default LanguageSwitcher;
