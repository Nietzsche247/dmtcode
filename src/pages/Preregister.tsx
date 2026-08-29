import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { PreregistrationForm } from '@/components/protocols/PreregistrationForm';
import { SEO } from '@/components/SEO';

const Preregister = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEO uiKey="preregister" path="/preregister" />

      <Navigation />
      <main id="main-content" className="container mx-auto max-w-4xl px-4 py-12 md:py-16">
        <header className="mb-8 space-y-4">
          <h1 className="font-display text-4xl tracking-tight md:text-5xl">Research pre-registration</h1>
          <p className="max-w-3xl text-lg leading-relaxed text-muted-foreground">
            A pre-registration records a study’s hypothesis and methods before data collection. This open call is for researchers with ethics approval or access to physiological instrumentation who are planning relevant EEG, ECG, eye-tracking, or imaging work.
          </p>
        </header>
        <PreregistrationForm />
      </main>
      <Footer />
    </div>
  );
};

export default Preregister;