import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Helmet } from 'react-helmet';
import { Breadcrumb } from '@/components/Breadcrumb';
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { 
  BookOpen, 
  FileText, 
  Pill, 
  Target, 
  Brain, 
  Calendar, 
  BookMarked,
  Volume2,
  VolumeX,
  Loader2
} from 'lucide-react';
import { useState, useRef, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

// Citation type for structured references
interface Citation {
  id: number;
  authors: string;
  title: string;
  journal: string;
  year: number;
  doi?: string;
  url?: string;
}

// Placeholder citations - will be replaced with actual content
const citations: Citation[] = [
  // Will be populated with 15 peer-reviewed citations
];

// Text-to-speech hook
const useTextToSpeech = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const { toast } = useToast();

  const speak = useCallback((text: string) => {
    if (!('speechSynthesis' in window)) {
      toast({
        title: "Text-to-Speech Unavailable",
        description: "Your browser does not support text-to-speech.",
        variant: "destructive"
      });
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    setIsLoading(true);
    
    // Clean HTML tags from text
    const cleanText = text.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    
    utterance.onstart = () => {
      setIsLoading(false);
      setIsSpeaking(true);
    };
    
    utterance.onend = () => {
      setIsSpeaking(false);
    };
    
    utterance.onerror = () => {
      setIsLoading(false);
      setIsSpeaking(false);
      toast({
        title: "Speech Error",
        description: "An error occurred while reading the text.",
        variant: "destructive"
      });
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [toast]);

  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsLoading(false);
  }, []);

  return { speak, stop, isSpeaking, isLoading };
};

// Read to Me button component
const ReadToMeButton = ({ 
  text, 
  sectionId 
}: { 
  text: string; 
  sectionId: string;
}) => {
  const { speak, stop, isSpeaking, isLoading } = useTextToSpeech();
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const handleClick = () => {
    if (isSpeaking && activeSection === sectionId) {
      stop();
      setActiveSection(null);
    } else {
      setActiveSection(sectionId);
      speak(text);
    }
  };

  const isActive = isSpeaking && activeSection === sectionId;

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      className="gap-2 text-xs"
      aria-label={isActive ? "Stop reading" : "Read this section aloud"}
    >
      {isLoading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : isActive ? (
        <VolumeX className="h-3.5 w-3.5" />
      ) : (
        <Volume2 className="h-3.5 w-3.5" />
      )}
      {isActive ? 'Stop Reading' : 'Read to Me'}
    </Button>
  );
};

// Citation link component - scrolls to reference
const CitationLink = ({ id }: { id: number }) => {
  const scrollToRef = () => {
    const element = document.getElementById(`citation-${id}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.classList.add('bg-primary/20');
      setTimeout(() => element.classList.remove('bg-primary/20'), 2000);
    }
  };

  return (
    <button
      onClick={scrollToRef}
      className="text-primary hover:underline font-mono text-xs align-super cursor-pointer"
      aria-label={`Go to citation ${id}`}
    >
      [{id}]
    </button>
  );
};

// Section configuration
const sectionConfig = {
  abstract: {
    title: 'Abstract',
    icon: <BookOpen className="h-4 w-4" />,
  },
  clinicalFormulation: {
    title: 'Clinical Formulation',
    icon: <FileText className="h-4 w-4" />,
    subsections: [
      { id: 'medication', title: 'Medication Considerations', icon: <Pill className="h-4 w-4" /> },
      { id: 'targets', title: 'Treatment Targets', icon: <Target className="h-4 w-4" /> },
      { id: 'neuromodulation', title: 'Section 8: Neuromodulation Integration', icon: <Brain className="h-4 w-4" /> },
    ]
  },
  protocolAddendum: {
    title: 'Protocol Addendum',
    icon: <Calendar className="h-4 w-4" />,
  },
  citations: {
    title: 'Citations',
    icon: <BookMarked className="h-4 w-4" />,
  }
};

const ElizabethBaker = () => {
  // Placeholder content - will be replaced with actual content
  const abstractContent = `{Abstract content placeholder - will be replaced with your content}`;
  
  const clinicalFormulationContent = `{8-section clinical formulation placeholder - will be replaced with your content}`;
  
  const medicationContent = `{Medication considerations placeholder including critical benzo-ketamine interaction warning - will be replaced with your content}`;
  
  const treatmentTargetsContent = `{Treatment targets placeholder - will be replaced with your content}`;
  
  const neuromodulationContent = `{Section 8: Neuromodulation Integration placeholder - explicitly calls out passive administration as treatment failure - will be replaced with your content}`;
  
  const protocolAddendumContent = `{Protocol Addendum with specific session-by-session recommendations placeholder - will be replaced with your content}`;

  return (
    <>
      <Helmet>
        <title>Elizabeth Baker | DMT Code</title>
        <meta 
          name="description" 
          content="Elizabeth Baker - Clinical formulation, prognosis, and treatment protocol with peer-reviewed citations." 
        />
        <link rel="canonical" href="https://dmtcode.com/Elizabeth_Baker" />
        <link rel="alternate" hrefLang="en" href="https://dmtcode.com/Elizabeth_Baker" />
        <meta name="robots" content="index, follow" />
        <meta property="og:title" content="Elizabeth Baker | DMT Code" />
        <meta property="og:description" content="Elizabeth Baker - Clinical formulation, prognosis, and treatment protocol." />
        <meta property="og:url" content="https://dmtcode.com/Elizabeth_Baker" />
        <meta property="og:type" content="article" />
        <meta property="og:image" content="https://dmtcode.com/favicon.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content="https://dmtcode.com/Elizabeth_Baker" />
        <meta name="twitter:title" content="Elizabeth Baker | DMT Code" />
        <meta name="twitter:description" content="Elizabeth Baker - Clinical formulation, prognosis, and treatment protocol." />
        <meta name="twitter:image" content="https://dmtcode.com/favicon.png" />
        
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": "https://dmtcode.com/"
              },
              {
                "@type": "ListItem",
                "position": 2,
                "name": "Elizabeth Baker",
                "item": "https://dmtcode.com/Elizabeth_Baker"
              }
            ]
          })}
        </script>
        
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "MedicalWebPage",
            "name": "Elizabeth Baker - Clinical Formulation",
            "description": "Clinical formulation and treatment protocol with peer-reviewed citations",
            "url": "https://dmtcode.com/Elizabeth_Baker",
            "lastReviewed": new Date().toISOString().split('T')[0]
          })}
        </script>
      </Helmet>

      <div className="relative min-h-screen bg-background">
        <Navigation />
        
        <main id="main-content" className="relative z-10 pt-20" role="main">
          {/* Hero Section */}
          <section className="relative px-4 py-20 md:py-28 overflow-hidden">
            <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
              <div className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/10 to-transparent" style={{ top: '30%' }} />
            </div>
            
            <div className="relative z-10 max-w-4xl mx-auto text-center space-y-6">
              <p className="text-muted-foreground text-xs font-medium tracking-[0.2em] uppercase animate-blur-in-up" style={{ animationFillMode: 'forwards' }}>
                Clinical Formulation
              </p>
              
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-[-0.03em] leading-[0.9] animate-blur-in-up animation-delay-100" style={{ animationFillMode: 'forwards' }}>
                Elizabeth
                <span className="block text-primary mt-2">Baker</span>
              </h1>
              
              <p className="text-lg md:text-xl font-light text-muted-foreground max-w-2xl mx-auto leading-relaxed animate-blur-in-up animation-delay-200" style={{ animationFillMode: 'forwards' }}>
                Comprehensive clinical formulation with evidence-based treatment recommendations
              </p>
            </div>
          </section>
          
          <Breadcrumb />

          <section className="container mx-auto px-4 py-16 max-w-4xl">
            <Accordion 
              type="multiple" 
              defaultValue={["abstract"]} 
              className="space-y-4"
            >
              {/* Section 1: Abstract - Open by default */}
              <AccordionItem 
                value="abstract" 
                className="border border-border/50 rounded-2xl px-6 bg-card/30 backdrop-blur-sm"
              >
                <AccordionTrigger className="text-lg font-semibold hover:no-underline py-5">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      {sectionConfig.abstract.icon}
                    </div>
                    <span>{sectionConfig.abstract.title}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-6">
                  <div className="border-t border-border/30 pt-4">
                    <div className="flex justify-end mb-4">
                      <ReadToMeButton text={abstractContent} sectionId="abstract" />
                    </div>
                    <div className="prose prose-invert prose-sm max-w-none">
                      <p className="text-foreground/90 leading-relaxed">
                        {abstractContent}
                      </p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Section 2: Clinical Formulation (8 sections) */}
              <AccordionItem 
                value="clinicalFormulation" 
                className="border border-border/50 rounded-2xl px-6 bg-card/30 backdrop-blur-sm"
              >
                <AccordionTrigger className="text-lg font-semibold hover:no-underline py-5">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      {sectionConfig.clinicalFormulation.icon}
                    </div>
                    <span>{sectionConfig.clinicalFormulation.title}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-6">
                  <div className="border-t border-border/30 pt-4 space-y-6">
                    <div className="flex justify-end mb-4">
                      <ReadToMeButton 
                        text={`${clinicalFormulationContent} ${medicationContent} ${treatmentTargetsContent} ${neuromodulationContent}`} 
                        sectionId="clinicalFormulation" 
                      />
                    </div>
                    
                    {/* Main Clinical Formulation Content */}
                    <div className="prose prose-invert prose-sm max-w-none">
                      <p className="text-foreground/90 leading-relaxed">
                        {clinicalFormulationContent}
                      </p>
                    </div>

                    {/* Medication Considerations Subsection */}
                    <div className="mt-8 p-5 bg-destructive/5 border border-destructive/20 rounded-xl">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-1.5 rounded bg-destructive/10 text-destructive">
                          <Pill className="h-4 w-4" />
                        </div>
                        <h3 className="font-semibold text-foreground">Medication Considerations</h3>
                      </div>
                      <div className="prose prose-invert prose-sm max-w-none">
                        <p className="text-foreground/80 leading-relaxed">
                          {medicationContent}
                        </p>
                      </div>
                    </div>

                    {/* Treatment Targets Subsection */}
                    <div className="mt-6 p-5 bg-muted/30 border border-border/50 rounded-xl">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-1.5 rounded bg-muted/50 text-muted-foreground">
                          <Target className="h-4 w-4" />
                        </div>
                        <h3 className="font-semibold text-foreground">Treatment Targets</h3>
                      </div>
                      <div className="prose prose-invert prose-sm max-w-none">
                        <p className="text-foreground/80 leading-relaxed">
                          {treatmentTargetsContent}
                        </p>
                      </div>
                    </div>

                    {/* Section 8: Neuromodulation Integration */}
                    <div className="mt-6 p-5 bg-primary/5 border border-primary/20 rounded-xl">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-1.5 rounded bg-primary/10 text-primary">
                          <Brain className="h-4 w-4" />
                        </div>
                        <h3 className="font-semibold text-foreground">Section 8: Neuromodulation Integration</h3>
                      </div>
                      <div className="prose prose-invert prose-sm max-w-none">
                        <p className="text-foreground/80 leading-relaxed">
                          {neuromodulationContent}
                        </p>
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Section 3: Protocol Addendum */}
              <AccordionItem 
                value="protocolAddendum" 
                className="border border-border/50 rounded-2xl px-6 bg-card/30 backdrop-blur-sm"
              >
                <AccordionTrigger className="text-lg font-semibold hover:no-underline py-5">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      {sectionConfig.protocolAddendum.icon}
                    </div>
                    <span>{sectionConfig.protocolAddendum.title}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-6">
                  <div className="border-t border-border/30 pt-4">
                    <div className="flex justify-end mb-4">
                      <ReadToMeButton text={protocolAddendumContent} sectionId="protocolAddendum" />
                    </div>
                    <div className="prose prose-invert prose-sm max-w-none">
                      <p className="text-foreground/90 leading-relaxed">
                        {protocolAddendumContent}
                      </p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Section 4: Citations */}
              <AccordionItem 
                value="citations" 
                className="border border-border/50 rounded-2xl px-6 bg-card/30 backdrop-blur-sm"
              >
                <AccordionTrigger className="text-lg font-semibold hover:no-underline py-5">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      {sectionConfig.citations.icon}
                    </div>
                    <span>{sectionConfig.citations.title}</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      ({citations.length > 0 ? citations.length : '15'} references)
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-6">
                  <div className="border-t border-border/30 pt-4">
                    {citations.length > 0 ? (
                      <ol className="space-y-4 list-none">
                        {citations.map((citation) => (
                          <li 
                            key={citation.id}
                            id={`citation-${citation.id}`}
                            className="p-4 bg-muted/20 rounded-lg border border-border/30 transition-colors duration-500"
                          >
                            <div className="flex gap-3">
                              <span className="text-primary font-mono text-sm font-semibold">
                                [{citation.id}]
                              </span>
                              <div className="space-y-1">
                                <p className="text-foreground/90 text-sm">
                                  {citation.authors} ({citation.year}). {citation.title}. 
                                  <em className="text-muted-foreground"> {citation.journal}</em>.
                                </p>
                                {citation.doi && (
                                  <a 
                                    href={`https://doi.org/${citation.doi}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary hover:underline text-xs font-mono"
                                  >
                                    DOI: {citation.doi}
                                  </a>
                                )}
                              </div>
                            </div>
                          </li>
                        ))}
                      </ol>
                    ) : (
                      <p className="text-muted-foreground text-sm italic">
                        15 peer-reviewed citations with DOIs will be displayed here
                      </p>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            {/* Footer Note */}
            <div className="mt-12 p-6 bg-muted/20 border border-border/30 rounded-xl text-center">
              <p className="text-xs text-muted-foreground">
                This clinical formulation is provided for informational purposes only. 
                All treatment recommendations should be reviewed by qualified healthcare professionals.
              </p>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default ElizabethBaker;
