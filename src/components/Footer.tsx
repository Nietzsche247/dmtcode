import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Separator } from '@/components/ui/separator';
import { ExternalLink } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { ZENODO_DOI, CITATION_APA } from '@/lib/constants';
import { useLocale, localePath } from '@/i18n/LocaleProvider';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

export const Footer = () => {
  const locale = useLocale();
  const { t } = useTranslation();
  // Every internal footer link stays inside the visitor's locale.
  const to = (path: string) => localePath(locale, path);

  return (
    <footer className="relative py-16 px-4 bg-background border-t border-border/50 transition-theme">
      <div className="max-w-6xl mx-auto space-y-12">
        <div className="grid md:grid-cols-4 gap-8">
          <div className="space-y-4 md:col-span-2">
            <Logo size="sm" />
            <p className="text-sm text-muted-foreground font-light leading-relaxed max-w-sm">
              Open catalogue of discrete visual symbols reported during 650 nm laser exposure and N,N-DMT experiences. Equipment resources and research references for independent replication.
            </p>
            {/* Zenodo DOI Badge */}
            <div className="pt-2">
              <a 
                href={`https://doi.org/${ZENODO_DOI}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 hover:opacity-80 transition-opacity"
                aria-label="View dataset on Zenodo"
              >
                <img 
                  src={`https://zenodo.org/badge/DOI/${ZENODO_DOI}.svg`} 
                  alt="Zenodo DOI Badge"
                  className="h-5"
                />
              </a>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">{t('footer.resourcesHeading')}</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link to={to('/articles')} className="text-muted-foreground hover:text-primary transition-colors">
                  {t('footer.articles')}
                </Link>
              </li>
              <li>
                <Link to={to('/guides')} className="text-muted-foreground hover:text-primary transition-colors">
                  {t('footer.guides')}
                </Link>
              </li>
              <li>
                <Link to={to('/capture')} className="text-muted-foreground hover:text-primary transition-colors">
                  {t('footer.capture')}
                </Link>
              </li>
              <li>
                <Link to={to('/submit-symbol')} className="text-muted-foreground hover:text-primary transition-colors">
                  {t('nav.contribute')}
                </Link>
              </li>
              <li>
                <Link to={to('/registry')} className="text-muted-foreground hover:text-primary transition-colors">
                  {t('footer.glyphRegistry')}
                </Link>
              </li>
              <li>
                <Link to={to('/dataset')} className="text-muted-foreground hover:text-primary transition-colors">
                  {t('footer.datasetDoi')}
                </Link>
              </li>
              <li>
                <Link to={to('/prepare')} className="text-muted-foreground hover:text-primary transition-colors">
                  {t('footer.kits')}
                </Link>
              </li>
              <li>
                <Link to={to('/documents')} className="text-muted-foreground hover:text-primary transition-colors">
                  {t('footer.documents')}
                </Link>
              </li>
              <li>
                <Link to={to('/answers')} className="text-muted-foreground hover:text-primary transition-colors">
                  {t('footer.answers')}
                </Link>
              </li>
              <li>
                <Link to={to('/bibliography')} className="text-muted-foreground hover:text-primary transition-colors">
                  {t('footer.bibliography')}
                </Link>
              </li>
              <li>
                <Link to={to('/correlations')} className="text-muted-foreground hover:text-primary transition-colors">
                  {t('footer.correlations')}
                </Link>
              </li>
              <li>
                <Link to={to('/timeline')} className="text-muted-foreground hover:text-primary transition-colors">
                  {t('footer.chronology')}
                </Link>
              </li>


              <li>
                <Link to={to('/trials')} className="text-muted-foreground hover:text-primary transition-colors">
                  {t('footer.clinicalTrials')}
                </Link>
              </li>
              <li>
                <Link to={to('/events')} className="text-muted-foreground hover:text-primary transition-colors">
                  {t('footer.events')}
                </Link>
              </li>
              <li>
                <Link to={to('/retreats')} className="text-muted-foreground hover:text-primary transition-colors">
                  {t('footer.retreatCenters')}
                </Link>
              </li>
              <li>
                <Link to={to('/protocols')} className="text-muted-foreground hover:text-primary transition-colors">
                  {t('footer.protocols')}
                </Link>
              </li>
              <li>
                <Link to={to('/research')} className="text-muted-foreground hover:text-primary transition-colors">
                  {t('footer.researchLibrary')}
                </Link>
              </li>
              <li>
                <Link to={to('/protocol-guide')} className="text-muted-foreground hover:text-primary transition-colors">
                  {t('footer.protocolGuide')}
                </Link>
              </li>
              <li>
                <Link to={to('/co-witnesses')} className="text-muted-foreground hover:text-primary transition-colors">
                  {t('footer.coWitnessWall')}
                </Link>
              </li>
              <li>
                <Link to={to('/theories')} className="text-muted-foreground hover:text-primary transition-colors">
                  {t('footer.openTheories')}
                </Link>
              </li>
              <li>
                <Link to={to('/faq')} className="text-muted-foreground hover:text-primary transition-colors">
                  {t('footer.faq')}
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">{t('footer.projectHeading')}</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link to={to('/about')} className="text-muted-foreground hover:text-primary transition-colors">
                  {t('footer.about')}
                </Link>
              </li>
              <li>
                <Link to={to('/critiques')} className="text-muted-foreground hover:text-primary transition-colors">
                  {t('footer.critiques')}
                </Link>
              </li>
              <li>
                <Link to={to('/methods')} className="text-muted-foreground hover:text-primary transition-colors">
                  {t('footer.methods')}
                </Link>
              </li>
              <li>
                <Link to={to('/null-reports')} className="text-muted-foreground hover:text-primary transition-colors">
                  {t('footer.nullReports')}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <Separator className="bg-border/30" />

        {/* Citation Block */}
        <div className="bg-card/30 border border-border/30 rounded-2xl p-6 space-y-3 transition-theme">
          <p className="text-sm font-semibold text-foreground">Cite This Dataset</p>
          <p className="text-xs text-muted-foreground font-mono leading-relaxed">
            {CITATION_APA}
          </p>
        </div>

        <div className="bg-card/30 border border-border/30 rounded-2xl p-6 space-y-4 transition-theme">
          <p className="text-sm font-semibold text-primary">Important Legal Disclaimer</p>
          <div className="text-xs text-muted-foreground font-light space-y-2 leading-relaxed">
            <p>
              <span className="text-foreground font-medium">Not Medical Advice:</span> The information on this site is for educational and research purposes only. DMT is a Schedule I controlled substance in many jurisdictions.
            </p>
            <p>
              <span className="text-foreground font-medium">No Scientific Validation:</span> The DMT code phenomenon described represents subjective experiences and has not been scientifically validated through peer-reviewed research.
            </p>
            <p>
              <span className="text-foreground font-medium">Commercial Disclosure:</span> Kits are sold by Meridian Optics Lab, operated by the same owner as DMT Code Project. This site does not currently carry affiliate links. See the{' '}
              <Link to={to('/disclosure')} className="underline hover:text-foreground">Disclosure page</Link>.
            </p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>{t('footer.copyright', { year: new Date().getFullYear() })}</p>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
            <LanguageSwitcher />
            <a 
              href="https://creativecommons.org/licenses/by/4.0/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 whitespace-nowrap hover:text-primary transition-colors"
            >
              CC-BY-4.0
              <ExternalLink className="w-3 h-3" />
            </a>
            <a 
              href="/data.json" 
              className="hover:text-primary transition-colors"
            >
              data.json
            </a>
            <Link to={to('/privacy')} className="hover:text-primary transition-colors">
              {t('footer.privacy')}
            </Link>
            <Link to={to('/terms')} className="hover:text-primary transition-colors">
              {t('footer.terms')}
            </Link>
            <Link to={to('/disclosure')} className="hover:text-primary transition-colors">
              {t('footer.disclosure')}
            </Link>
            <Link to={to('/shipping')} className="hover:text-primary transition-colors">
              {t('footer.shipping')}
            </Link>
            <Link to={to('/returns')} className="hover:text-primary transition-colors">
              {t('footer.returns')}
            </Link>
            <a 
              href={`https://doi.org/${ZENODO_DOI}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary transition-colors"
            >
              DOI
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
