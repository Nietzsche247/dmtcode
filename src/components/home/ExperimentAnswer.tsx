import { Link } from 'react-router-dom';
import { useLocale, localePath } from '@/i18n/LocaleProvider';

// Mirrors STATIC_PAGES.home in netlify/edge-functions/content-prerender.ts.
export function ExperimentAnswer() {
  const locale = useLocale();
  return <section className="mx-auto px-4 py-10 md:py-14 max-w-3xl">
    <h2 className="font-display font-medium text-3xl md:text-4xl text-foreground leading-tight mb-5">What is the DMT laser experiment</h2>
    <p className="font-body text-base md:text-lg text-muted-foreground leading-relaxed">The DMT laser experiment is a reported observation, first described by Danny Goler in August 2020, in which people under the influence of N,N-DMT look at a 650 nm red laser diffracted through a grating and report seeing code-like visual forms. A pilot study was published in IPI Letters in 2025 (DOI 10.59973/ipil.158); no controlled study has been run, and whether the reported forms recur across observers is unresolved. This site keeps the written procedure, a sober baseline version of it, the kits and free documents needed to run it, and the open record of what observers drew, with the four explanations that are actively defended held open and tested against that record.</p>
    <div className="flex flex-wrap gap-x-6 gap-y-3 mt-5 text-sm">
      <Link className="text-primary hover:underline" to={localePath(locale, '/protocol-guide')}>The observation protocol</Link>
      <Link className="text-primary hover:underline" to={localePath(locale, '/prepare')}>Prepare to observe</Link>
    </div>
  </section>;
}
