import { ChevronRight } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLocale, localePath } from '@/i18n/LocaleProvider';

export const Breadcrumb = ({ titleOverride }: { titleOverride?: string } = {}) => {
  const location = useLocation();
  const locale = useLocale();
  const { t } = useTranslation();
  const rawSegments = location.pathname.split('/').filter((x) => x);
  // The locale prefix is routing, not a page: it must never become a crumb.
  const pathnames =
    locale !== 'en' && rawSegments[0] === locale ? rawSegments.slice(1) : rawSegments;


  // Crumb labels live in the breadcrumb namespace of the locale bundles so
  // /es/* and /de/* read in their own language. A missing key falls back to
  // the title-cased slug, never to a blank crumb.
  const crumbLabel = (segment: string): string | null => {
    const key = `breadcrumb.${segment}`;
    const label = t(key);
    return label === key ? null : label;
  };

  return (
    <nav aria-label="Breadcrumb" className="container mx-auto px-4 pt-20 pb-4">
      <ol className="flex items-center space-x-2 text-sm">
        <li>
          <Link 
            to={localePath(locale, '/')}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label={t('breadcrumb.home')}
          >
            {t('breadcrumb.home')}
          </Link>
        </li>
        {pathnames.map((value, index) => {
          const to = localePath(locale, `/${pathnames.slice(0, index + 1).join('/')}`);

          const isLast = index === pathnames.length - 1;
          const mapped = crumbLabel(value);
          const fallback = value
            .split('-')
            .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : w))
            .join(' ');
          const label = isLast && titleOverride ? titleOverride : (mapped || fallback);

          return (
            <li key={to} className="flex items-center space-x-2">
              <ChevronRight className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
              {isLast ? (
                <span className="text-foreground font-medium" aria-current="page">
                  {label}
                </span>
              ) : (
                <Link 
                  to={to} 
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
