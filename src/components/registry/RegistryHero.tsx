import { Button } from '@/components/ui/button';

export const RegistryHero = () => {
  const scrollToSubmit = () => {
    document.getElementById('submit')?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToNullReport = () => {
    // Set null report mode and scroll to submit
    window.location.href = '/registry?null=true#submit';
  };

  const scrollToBrowse = () => {
    document.getElementById('browse')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="container mx-auto px-4 py-16 md:py-24 text-center">
      <h1 className="text-4xl md:text-6xl font-bold mb-6 text-foreground">
        DMT Code Glyph Registry
      </h1>
      
      <p className="text-lg md:text-xl text-gold max-w-4xl mx-auto mb-12 leading-relaxed">
        An open, community-maintained catalogue of discrete 100 × 100 px visual symbols reported during 650 nm laser exposure and N,N-DMT experiences.
      </p>

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button 
          onClick={scrollToSubmit}
          variant="default"
          size="lg"
          className="text-lg"
        >
          Submit a Symbol
        </Button>
        <Button 
          onClick={scrollToNullReport}
          variant="secondary"
          size="lg"
          className="text-lg border border-border"
        >
          I Saw Nothing
        </Button>
        <Button 
          onClick={scrollToBrowse}
          variant="outline"
          size="lg"
          className="text-lg"
        >
          Browse the Registry
        </Button>
      </div>
      
      <p className="text-sm text-muted-foreground mt-6 max-w-2xl mx-auto">
        Null reports establish valuable baseline data for comparison
      </p>
    </section>
  );
};
