import { Helmet } from 'react-helmet';
import { useLocale, localePath } from '@/i18n/LocaleProvider';
import { uiCopy } from '@/i18n/ui-strings';

const SITE = 'https://dmtcode.com';

// One locale-aware head block for the index pages that the prerender also
// renders. The strings come from the same dictionary the edge function uses
// (src/i18n/ui-strings.ts mirrors netlify/lib/ui-strings.ts), so the hydrated
// title cannot disagree with the crawler title in any locale.
export const SEO = ({
  uiKey,
  path,
  vars,
}: {
  uiKey: string;
  path: string;
  vars?: Record<string, string | number>;
}) => {
  const locale = useLocale();
  const copy = uiCopy(uiKey, locale, vars);
  const url = `${SITE}${localePath(locale, path)}`;

  return (
    <Helmet>
      <title>{copy.title}</title>
      <meta name="description" content={copy.description} />
      <link rel="canonical" href={url} />
      <meta property="og:title" content={copy.title} />
      <meta property="og:description" content={copy.description} />
      <meta property="og:url" content={url} />
    </Helmet>
  );
};

export default SEO;
