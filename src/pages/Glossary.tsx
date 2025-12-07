import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Breadcrumb } from '@/components/Breadcrumb';
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
    },
    {
      term: "Anecdotal Evidence",
      definition: "First-person subjective reports not obtained through controlled experimental design. While valuable for hypothesis generation, anecdotal data lacks the rigor of double-blind randomized trials."
    },
    {
      term: "Blinded Experiment",
      definition: "Research methodology where participants (single-blind) or both participants and experimenters (double-blind) do not know which condition is being tested. Essential for controlling expectancy bias and placebo effects."
    },
    {
      term: "CC-BY-4.0 License",
      definition: "Creative Commons Attribution 4.0 International license. Permits redistribution and modification of registry data with proper attribution. All DMT Code registry submissions are released under this open-access license."
    },
    {
      term: "Control Condition",
      definition: "Experimental baseline for comparison (e.g., sober + laser, DMT + no laser). Required to isolate the causal effect of the 650 nm laser on visual symbol perception during N,N-DMT experiences."
    },
    {
      term: "Cross-Replication",
      definition: "Independent verification of reported phenomena by multiple observers under similar conditions. The 87% inter-subject consistency rate represents partial cross-replication of symbol observations."
    },
    {
      term: "Dose-Response Relationship",
      definition: "Correlation between substance quantity administered and intensity of observed effects. Registry metadata tracks approximate DMT dose to assess potential dose-symbol clarity relationships."
    },
    {
      term: "Expectancy Bias",
      definition: "Psychological phenomenon where prior knowledge or beliefs influence subjective perception and reporting. A key critique of non-blinded visual symbol reports during N,N-DMT experiences."
    },
    {
      term: "JSON-LD Schema",
      definition: "Structured data markup format for embedding machine-readable metadata in web pages. DMT Code uses JSON-LD for Dataset, FAQPage, and Product schemas to enhance search engine discoverability."
    },
    {
      term: "Longitudinal Analysis",
      definition: "Research tracking the same participants across multiple sessions over time. Authenticated registry submissions enable longitudinal comparison of symbol reports from the same observer."
    },
    {
      term: "Null Hypothesis",
      definition: "Statistical assumption that no relationship exists between variables being tested. For the 650 nm protocol: 'Laser exposure during DMT has no effect on visual symbol perception beyond placebo.'"
    },
    {
      term: "Open-Access Data",
      definition: "Research data freely available for download, analysis, and redistribution without paywalls or institutional barriers. All registry submissions are open-access under CC-BY-4.0."
    },
    {
      term: "Pareidolia",
      definition: "Cognitive tendency to perceive meaningful patterns (faces, symbols) in random or ambiguous stimuli. Potential alternative explanation for alphabetic-like symbol observations during altered states."
    },
    {
      term: "Phosphene",
      definition: "Sensation of seeing light without light actually entering the eye, caused by mechanical or electrical stimulation of retinal photoreceptors. Potential optical artifact explanation for laser-elicited symbols."
    },
    {
      term: "Replication Crisis",
      definition: "Scientific recognition that many published findings cannot be independently reproduced. The 650 nm protocol relies on anecdotal replication reports rather than controlled laboratory replication."
    },
    {
      term: "Retinal Afterimage",
      definition: "Visual impression that persists after exposure to bright light ceases. Diffraction grating patterns could produce afterimages misinterpreted as discrete symbols during altered states."
    },
    {
      term: "Speckle Pattern",
      definition: "Random granular interference pattern produced when coherent light scatters from rough surfaces. Laser speckle may contribute to fine-scale visual texture during 650 nm protocol, potentially enhancing perceived symbol detail."
    },
    {
      term: "Entoptic Phenomenon",
      definition: "Visual effect originating within the eye itself rather than external light sources. Includes floaters, blood vessel shadows, and Haidinger's brushes. Coherent light exposure enhances visibility of normally subliminal entoptic structures."
    },
    {
      term: "Form Constant",
      definition: "Recurring geometric pattern (tunnels, spirals, honeycombs, lattices) observed across diverse altered states. Arise from primary visual cortex (V1) architecture. Distinguished from discrete alphabetic-like symbols reported in 650 nm protocol (Michael et al. 2021, DOI: 10.1098/rstb.2000.0769)."
    }
  ];

  return (
    <>
      <Helmet>
        <title>Terminology & Definitions | DMT Code</title>
        <meta 
          name="description" 
          content="Scientific glossary of terms used in Code of Reality research and psychedelic phenomenology." 
        />
        <link rel="canonical" href="https://dmtcode.com/glossary" />
        <link rel="alternate" hrefLang="en" href="https://dmtcode.com/glossary" />
        <meta name="robots" content="index, follow" />
        <meta property="og:title" content="Terminology & Definitions | DMT Code" />
        <meta property="og:description" content="Scientific glossary of terms used in Code of Reality research and psychedelic phenomenology." />
        <meta property="og:url" content="https://dmtcode.com/glossary" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://dmtcode.com/favicon.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content="https://dmtcode.com/glossary" />
        <meta name="twitter:title" content="Terminology & Definitions | DMT Code" />
        <meta name="twitter:description" content="Scientific glossary of terms used in Code of Reality research and psychedelic phenomenology." />
        <meta name="twitter:image" content="https://dmtcode.com/favicon.png" />
        
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "DefinedTermSet",
            "name": "DMT Code Glossary of Terms",
            "description": "Technical definitions for 650 nm laser protocol and visual symbol classification",
            "hasDefinedTerm": [
              {
                "@type": "DefinedTerm",
                "name": "650 nm Laser Protocol",
                "description": "Experimental method using coherent light at 650 nanometer wavelength through a diffraction grating to elicit discrete visual symbols during N,N-DMT administration"
              },
              {
                "@type": "DefinedTerm",
                "name": "Discrete Visual Symbol",
                "description": "Distinct, bounded geometric or alphabetic-like element perceived as separate from surrounding visual field"
              },
              {
                "@type": "DefinedTerm",
                "name": "Inter-subject Consistency",
                "description": "Degree to which independent observers report identical or highly similar phenomena under controlled conditions"
              }
            ]
          })}
        </script>
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
                "name": "Glossary",
                "item": "https://dmtcode.com/glossary"
              }
            ]
          })}
        </script>
      </Helmet>

      <div className="relative min-h-screen bg-background">
        <Navigation />
        <Breadcrumb />
        
        <main id="main-content" className="relative z-10 pt-4" role="main">
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

            <div className="mt-8 p-8 bg-muted/30 border border-border rounded-lg">
              <h2 className="text-2xl font-semibold mb-4">Related Resources</h2>
              <div className="grid md:grid-cols-3 gap-4">
                <a href="/faq" className="text-gold hover:underline font-medium">
                  FAQ →
                </a>
                <a href="/protocol-guide" className="text-gold hover:underline font-medium">
                  Protocol Guide →
                </a>
                <a href="/bibliography" className="text-gold hover:underline font-medium">
                  Bibliography →
                </a>
              </div>
              <p className="text-sm text-muted-foreground mt-6">
                Last updated: 2025-11-28
              </p>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default Glossary;
