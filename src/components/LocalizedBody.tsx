import { type ReactNode, useMemo } from 'react';
import DOMPurify from 'dompurify';
import { useLocalizedBody } from '@/hooks/useLocalizedBody';

/**
 * Renders the prerendered translated body for a static page id when one
 * exists for the active locale, otherwise the English children unchanged.
 * The markup comes from our own prerender + translation pipeline, but it is
 * sanitized anyway before it is injected.
 */
export const LocalizedBody = ({
  pageId,
  children,
  className,
  html,
}: {
  pageId: string;
  children: ReactNode;
  className?: string;
  html?: string | null;
}) => {
  return html !== undefined
    ? <LocalizedMarkup html={html} className={className}>{children}</LocalizedMarkup>
    : <LocalizedFromQuery pageId={pageId} className={className}>{children}</LocalizedFromQuery>;
};

function LocalizedFromQuery({ pageId, children, className }: { pageId: string; children: ReactNode; className?: string }) {
  const html = useLocalizedBody(pageId);
  return <LocalizedMarkup html={html} className={className}>{children}</LocalizedMarkup>;
}

function LocalizedMarkup({ html, children, className }: { html: string | null; children: ReactNode; className?: string }) {

  const clean = useMemo(
    () =>
      html
        ? DOMPurify.sanitize(html, {
            USE_PROFILES: { html: true },
            ADD_ATTR: ['target', 'rel'],
          })
        : null,
    [html],
  );

  if (!clean) return <>{children}</>;

  return (
    <div
      className={
        className ??
        'prose prose-invert dark:prose-invert max-w-none prose-headings:font-bold prose-a:text-primary'
      }
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}

export default LocalizedBody;
