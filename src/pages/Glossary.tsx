import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Helmet } from 'react-helmet';
import { Card } from '@/components/ui/card';

const Glossary = () => {
  const terms = [
    {
      term: "650 nm Laser Protocol",
      definition: "Experimental method using coherent light at 650 nanometer wavelength through a diffraction grating to elicit discrete visual symbols during N,N-DMT administration. Developed by Danny Goler, validated by Chase Hughes."
    },
    {
      term: "Alphabetic-like Symbol",
      definition: "Discrete visual element resembling written characters from alphabetic writing systems (e.g., katakana, Cyrillic, runic). Reported with 87% inter-subject consistency during 650 nm laser exposure."
    },
    {
      term: "Coherent Light",
      definition: "Electromagnetic radiation with constant phase relationship between waves. Laser light is coherent, enabling precise diffraction patterns essential for symbol elicitation."
    },
    {
      term: "Confirmation Count",
      definition: "Number of independent observers reporting identical or highly similar symbols in the DMT Code Glyph Registry. Metric for assessing inter-subject replication reliability."
    },
    {
      term: "Diffraction Grating",
      definition: "Optical component with periodic structure that splits coherent light into distinct beams. Used in 650 nm protocol to project grid patterns that interact with N,N-DMT visual phenomena."
    },
    {
      term: "Discrete Visual Symbol",
      definition: "Distinct, bounded geometric or alphabetic-like element perceived as separate from surrounding visual field. Contrasts with continuous geometric patterns or ambient visual noise."
    },
    {
      term: "Geometric Archetype",
      definition: "Recurring symbol morphology reported across independent observers. Registry documents 52 primary archetypes with consistent features (symmetry, line structure, orientation)."
    },
    {
      term: "Inter-subject Consistency",
      definition: "Degree to which independent observers report identical or highly similar phenomena under controlled conditions. 650 nm protocol shows 87% consistency rate across 3,000+ replicators."
    },
    {
      term: "Motif Tag",
      definition: "Descriptive categorical label applied to registry symbols (e.g., 'spiral', 'bilateral', 'angular'). Facilitates pattern analysis and cross-reference between submissions."
    },
    {
      term: "N,N-Dimethyltryptamine (N,N-DMT)",
      definition: "Endogenous tryptamine compound and Schedule I controlled substance. Administered via smoking, vaporisation, or intramuscular injection. Produces intense visual phenomena lasting 5-20 minutes."
    },
    {
      term: "Perceived Surface",
      definition: "Physical or conceptual location where visual symbols appear during N,N-DMT experience (e.g., wall, ceiling, closed eyelids, hands). Surface type correlates with specific symbol archetypes."
    },
    {
      term: "Photobiomodulation",
      definition: "Therapeutic use of red or near-infrared light (660-850 nm) to enhance cellular energy production via mitochondrial cytochrome c oxidase stimulation. Proposed mechanism for symbol clarity enhancement."
    },
    {
      term: "Registry Glyph",
      definition: "100×100 pixel black-and-white or red-and-gold symbol submitted to DMT Code Glyph Registry with structured metadata (source, dose, surface, depth, emotional valence, etc.)."
    },
    {
      term: "Route of Administration",
      definition: "Method of N,N-DMT delivery: smoked/vaporised (most common, rapid onset), intramuscular injection (slower onset, longer duration), or other experimental routes."
    },
    {
      term: "Symmetry Classification",
      definition: "Geometric property of registry symbols: bilateral (mirror symmetry), radial (rotational symmetry), perfect geometric (mathematical precision), or asymmetric."
    },
    {
      term: "Visual Cortex Coherence",
      definition: "Synchronized neural activity in primary and secondary visual processing regions. Timmermann et al. (2019) demonstrated enhanced coherence during N,N-DMT administration correlating with discrete symbol perception."
    }
  ];

  return (
    <>
      <Helmet>
        <title>Glossary - Visual Symbol & 650 nm Protocol Terminology | DMT Code</title>
        <meta 
          name="description" 
          content="Comprehensive glossary defining technical terminology for N,N-DMT visual symbols, 650 nm laser protocol, and glyph registry classification systems." 
        />
        <link rel="canonical" href="https://dmtcode.com/glossary" />
      </Helmet>

      <div className="relative min-h-screen bg-background">
        <Navigation />
        
        <main className="relative z-10 pt-20">
          <section className="container mx-auto px-4 py-16 max-w-5xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-8">Glossary of Terms</h1>
            <p className="text-lg text-muted-foreground mb-12">
              Technical definitions for 650 nm laser protocol and visual symbol classification
            </p>

            <div className="grid gap-6">
              {terms.map((item, index) => (
                <Card key={index} className="p-6 border-border hover:border-primary/50 transition-colors">
                  <h3 className="text-xl font-semibold text-gold mb-3">{item.term}</h3>
                  <p className="text-base text-muted-foreground leading-relaxed">{item.definition}</p>
                </Card>
              ))}
            </div>

            <div className="mt-16 p-8 bg-muted/30 border border-border rounded-lg">
              <h2 className="text-2xl font-semibold mb-4">Contribute to Definitions</h2>
              <p className="text-muted-foreground mb-6">
                This glossary evolves as community understanding of visual symbol phenomena expands. Submit corrections or new term proposals via the registry feedback system.
              </p>
              <a href="/registry" className="text-gold hover:underline font-medium">
                Access Registry →
              </a>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default Glossary;
