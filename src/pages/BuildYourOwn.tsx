import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Breadcrumb } from '@/components/Breadcrumb';
import { SEO } from '@/components/SEO';
import { GolerAttribution } from '@/components/GolerAttribution';
import { LocalizedBody } from '@/components/LocalizedBody';
import { KIT_MIN_PRICE } from '@/data/kits';
import { useLocale, localePath } from '@/i18n/LocaleProvider';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const BUILD_YOUR_OWN_BODY = '{{BUILD_YOUR_OWN_BODY}}';

export default function BuildYourOwn() {
  const locale = useLocale();
  const { t } = useTranslation();
  return (
    <div className="relative min-h-screen bg-background">
      <SEO uiKey="build-your-own" path="/build-your-own" />
      <Navigation />
      <Breadcrumb />
      <main id="main-content" className="relative z-10 pt-4" role="main">
        <div className="container mx-auto px-4 py-12 md:py-16 max-w-4xl space-y-8">
          <LocalizedBody pageId="build-your-own">
            <h1 className="text-4xl md:text-5xl font-bold">Build your own observation rig</h1>
            <p className="text-lg text-muted-foreground">The kits on /prepare are one way to run the observation. This page is for people who would rather assemble the parts themselves. It will list the components, where they come from, and what each one is for. It makes no claim about what you will or will not see.</p>
            <section data-block="build-your-own-body">{BUILD_YOUR_OWN_BODY}</section>
          </LocalizedBody>
          <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm">
            <Link to={localePath(locale, '/prepare')} className="text-primary hover:underline">{t('observationResources.preferKit', { price: `$${KIT_MIN_PRICE.toLocaleString('en-US')}` })}</Link>
            <Link to={localePath(locale, '/protocol-guide')} className="text-primary hover:underline">{t('observationResources.protocol')}</Link>
            <Link to={localePath(locale, '/documents')} className="text-primary hover:underline">{t('observationResources.documents')}</Link>
          </div>
          <GolerAttribution />
        </div>
      </main>
      <Footer />
    </div>
  );
}
