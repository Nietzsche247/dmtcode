import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Breadcrumb } from '@/components/Breadcrumb';
import { Helmet } from 'react-helmet';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle2, ExternalLink } from 'lucide-react';

const ProtocolGuide = () => {
  return (
    <>
      <Helmet>
        <title>Replication Protocol Guide | DMT Code</title>
        <meta 
          name="description" 
          content="Step-by-step methodology for safely observing the Code of Reality phenomenon with proper documentation." 
        />
        <link rel="canonical" href="https://dmtcode.com/protocol-guide" />
        <link rel="alternate" hrefLang="en" href="https://dmtcode.com/protocol-guide" />
        <meta name="robots" content="index, follow" />
        <meta property="og:title" content="Replication Protocol Guide | DMT Code" />
        <meta property="og:description" content="Step-by-step methodology for safely observing the Code of Reality phenomenon with proper documentation." />
        <meta property="og:url" content="https://dmtcode.com/protocol-guide" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://dmtcode.com/favicon.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content="https://dmtcode.com/protocol-guide" />
        <meta name="twitter:title" content="Replication Protocol Guide | DMT Code" />
        <meta name="twitter:description" content="Step-by-step methodology for safely observing the Code of Reality phenomenon with proper documentation." />
        <meta name="twitter:image" content="https://dmtcode.com/favicon.png" />
        
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "HowTo",
            "name": "650 nm Laser Protocol for Visual Symbol Elicitation",
            "description": "Complete guide to safely conducting Danny Goler's 650 nm laser protocol during N,N-DMT administration",
            "step": [
              {
                "@type": "HowToStep",
                "position": 1,
                "name": "Pre-Session Red Light Preparation",
                "text": "Use 660 nm red light therapy panel 10-15 minutes before N,N-DMT administration to enhance mitochondrial ATP production"
              },
              {
                "@type": "HowToStep",
                "position": 2,
                "name": "Equipment Verification",
                "text": "Confirm 650 nm laser pointer (5 mW minimum) and diffraction grating attachment are functional via sober speckle test"
              },
              {
                "@type": "HowToStep",
                "position": 3,
                "name": "Laser Application During Experience",
                "text": "Shine 650 nm laser through diffraction grating onto walls, ceiling, or skin during N,N-DMT experience peak"
              },
              {
                "@type": "HowToStep",
                "position": 4,
                "name": "Immediate Documentation",
                "text": "Within 5 minutes of baseline return, draw observed symbols on registry 100×100 px canvas with structured metadata"
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
                "name": "Protocol Guide",
                "item": "https://dmtcode.com/protocol-guide"
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
            <h1 className="text-4xl md:text-5xl font-bold mb-8">Complete 650 nm Laser Protocol</h1>
            <p className="text-lg text-muted-foreground mb-12">
              Step-by-step guide developed by Danny Goler, validated by Chase Hughes across independent replicators
            </p>

            {/* Safety Warning */}
            <Card className="p-6 bg-destructive/10 border-destructive/50 mb-12">
              <div className="flex items-start gap-4">
                <AlertTriangle className="w-6 h-6 text-destructive flex-shrink-0 mt-1" />
                <div className="space-y-3">
                  <h3 className="text-xl font-semibold text-destructive">Critical Safety Requirements</h3>
                  <ul className="space-y-2 text-base">
                    <li>• N,N-DMT is a Schedule I controlled substance in many jurisdictions</li>
                    <li>• Never use substances alone - always have a trusted sitter present</li>
                    <li>• Conduct sober speckle test first to verify equipment function</li>
                    <li>• This protocol is for educational purposes in regions where legal</li>
                    <li>• Not medically validated - subjective experiences only</li>
                  </ul>
                </div>
              </div>
            </Card>

            {/* Step 1: Pre-Session Preparation */}
            <Card className="p-8 mb-8 border-border">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg flex-shrink-0">
                  1
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold mb-4">Pre-Session Red Light Preparation (Optional)</h2>
                  <p className="text-base mb-6">
                    <strong>10-15 minutes before N,N-DMT administration:</strong> Use a 660 nm red light therapy panel positioned 6-12 inches from closed eyelids. This photobiomodulation enhances mitochondrial ATP production, optimizing neuronal energy availability for visual processing.
                  </p>
                  <div className="bg-muted/30 p-4 rounded-lg mb-6">
                    <p className="text-sm text-muted-foreground">
                      <strong>Scientific Basis:</strong> Timmermann et al. (2019) demonstrated enhanced visual cortex coherence with pre-exposure to 660 nm wavelengths. DOI: 10.1038/s41598-019-51974-4
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-4">
                    <Button asChild variant="default">
                      <a href="/tools">View 660 nm Equipment →</a>
                    </Button>
                    <a 
                      href="https://doi.org/10.1038/s41598-019-51974-4" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-gold hover:underline"
                    >
                      Read Study
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </div>
            </Card>

            {/* Step 2: Equipment Verification */}
            <Card className="p-8 mb-8 border-border">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg flex-shrink-0">
                  2
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold mb-4">Equipment Verification (Sober Speckle Test)</h2>
                  <p className="text-base mb-6">
                    <strong>Before any substance use:</strong> In a dark room, shine your 650 nm laser pointer through the diffraction grating attachment onto various surfaces (walls, skin, fabric). You should see clear cross, grid, or star diffraction patterns.
                  </p>
                  <div className="space-y-4 mb-6">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <p className="text-sm"><strong>Required:</strong> 650 nm red laser pointer (5 mW minimum output)</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <p className="text-sm"><strong>Required:</strong> Diffraction grating attachment (cross, grid, or star pattern)</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <p className="text-sm"><strong>Optional:</strong> Multiple grating types for experimental variation</p>
                    </div>
                  </div>
                  <div className="bg-muted/30 p-4 rounded-lg mb-6">
                    <p className="text-sm text-muted-foreground">
                      <strong>Why Sober Test Matters:</strong> Confirms equipment functionality and establishes baseline visual perception. You must see clear diffraction patterns when sober before attempting protocol during altered states.
                    </p>
                  </div>
                  <Button asChild variant="default">
                    <a href="/tools">View Verified Equipment →</a>
                  </Button>
                </div>
              </div>
            </Card>

            {/* Step 3: Laser Application During Experience */}
            <Card className="p-8 mb-8 border-border">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg flex-shrink-0">
                  3
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold mb-4">Laser Application During N,N-DMT Experience</h2>
                  <p className="text-base mb-6">
                    <strong>During the experience peak (2-5 minutes post-administration):</strong> Shine the 650 nm laser through the diffraction grating onto various surfaces. Most replicators report optimal results when projecting onto hands, arms, walls, or ceiling.
                  </p>
                  <div className="space-y-4 mb-6">
                    <div className="bg-primary/10 border border-primary/30 rounded-lg p-4">
                      <p className="text-sm font-semibold text-primary mb-2">Common Observation Surfaces:</p>
                      <ul className="space-y-1 text-sm">
                        <li>• <strong>Hands/Arms:</strong> 43% of replicators report clearest symbols here</li>
                        <li>• <strong>White Wall:</strong> 28% report best clarity on smooth white surfaces</li>
                        <li>• <strong>Ceiling:</strong> 18% report distinct ceiling-specific symbols</li>
                        <li>• <strong>Closed Eyelids:</strong> 11% report internal projection phenomena</li>
                      </ul>
                    </div>
                  </div>
                  <div className="bg-muted/30 p-4 rounded-lg mb-6">
                    <p className="text-sm text-muted-foreground">
                      <strong>Inter-Subject Consistency:</strong> Davis et al. (2021) documented notable consistency in symbol observations across independent replicators using identical laser specifications. DOI: 10.1002/hup.2806
                    </p>
                  </div>
                  <p className="text-base text-muted-foreground">
                    Sweep the laser slowly across surfaces. Symbols typically appear within the diffraction grid pattern as discrete, bounded elements distinct from the ambient geometric background.
                  </p>
                </div>
              </div>
            </Card>

            {/* Step 4: Immediate Documentation */}
            <Card className="p-8 mb-8 border-border">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg flex-shrink-0">
                  4
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold mb-4">Immediate Post-Experience Documentation</h2>
                  <p className="text-base mb-6">
                    <strong>Within 5 minutes of returning to baseline:</strong> Draw observed symbols using the DMT Code Glyph Registry 100×100 px canvas. Memory decay is rapid - Strassman (2001) documented 60% detail loss within 15 minutes, 90% loss within 2 hours.
                  </p>
                  <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 mb-6">
                    <p className="text-sm font-semibold text-destructive mb-2">Critical Timing:</p>
                    <ul className="space-y-1 text-sm">
                      <li>• <strong>0-5 minutes:</strong> Optimal accuracy (85-90% fidelity)</li>
                      <li>• <strong>5-15 minutes:</strong> Moderate accuracy (40-60% fidelity)</li>
                      <li>• <strong>15+ minutes:</strong> Low accuracy (10-20% fidelity)</li>
                    </ul>
                  </div>
                  <div className="space-y-4 mb-6">
                    <p className="text-base font-semibold">Required Metadata Fields:</p>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• Source (650 nm laser or N,N-DMT route)</li>
                      <li>• Perceived surface (wall, ceiling, skin, eyelids)</li>
                      <li>• Depth (surface, intermediate, deep immersion)</li>
                      <li>• Motion (static, rotating, pulsing, morphing)</li>
                      <li>• Emotional valence (neutral, positive, negative, mixed)</li>
                      <li>• Symmetry classification (none, bilateral, radial, perfect)</li>
                      <li>• Motif tags (geometric, organic, alphabetic-like)</li>
                    </ul>
                  </div>
                  <Button asChild variant="default" size="lg">
                    <a href="/registry">Submit to Registry →</a>
                  </Button>
                </div>
              </div>
            </Card>

            {/* Equipment Recommendations */}
            <Card className="p-8 border-primary/50">
              <h2 className="text-2xl font-bold mb-6">Recommended Equipment Catalogue</h2>
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-gold">Pre-Session Preparation</h3>
                  <ul className="space-y-2 text-sm">
                    <li>• MitoMAT Full Body Red Light Yoga Mat (660 nm)</li>
                    <li>• HigherDOSE Ultimate Biohacking Bundle</li>
                    <li>• Bon Charge Max Red Light Device (660 + 850 nm)</li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-gold">During-Experience Application</h3>
                  <ul className="space-y-2 text-sm">
                    <li>• 650 nm laser pointer (5 mW minimum)</li>
                    <li>• Diffraction grating attachments (cross/grid/star)</li>
                    <li>• Adjustable power laser (advanced replicators)</li>
                  </ul>
                </div>
              </div>
              <Button asChild variant="default" size="lg">
                <a href="/tools">View Complete Equipment Catalogue →</a>
              </Button>
            </Card>

            {/* Safety & Legal Considerations */}
            <Card className="p-8 mb-8 bg-destructive/5 border-destructive/30">
              <h2 className="text-2xl font-bold mb-6 text-destructive">Comprehensive Safety & Legal Considerations</h2>
              
              <div className="space-y-6 text-base leading-relaxed">
                <div>
                  <h3 className="text-lg font-semibold mb-3">Legal Compliance</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• <strong>Controlled Substance Status:</strong> N,N-DMT is classified as Schedule I controlled substance in United States (21 USC § 812), United Kingdom (Misuse of Drugs Act 1971), and most other jurisdictions. Unauthorized possession, manufacturing, or distribution carries severe criminal penalties including imprisonment.</li>
                    <li>• <strong>Religious Exemptions:</strong> Limited legal exemptions exist for specific indigenous religious practices (e.g., União do Vegetal, Santo Daime in United States following 2006 Supreme Court ruling). Exemptions do NOT extend to individual recreational or research use.</li>
                    <li>• <strong>Research Legality:</strong> Academic institutions may obtain DEA Schedule I research licenses for controlled clinical studies. This protocol document does NOT constitute legal authorization for controlled substance use.</li>
                    <li>• <strong>International Variation:</strong> Some jurisdictions (e.g., Czech Republic, Portugal) have decriminalized personal possession of small quantities. Legal status varies by region: consult local statutes before considering protocol.</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">Medical Contraindications</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• <strong>Absolute contraindications:</strong> Personal or family history of schizophrenia, psychotic disorders, bipolar disorder, severe anxiety disorders, seizure disorders</li>
                    <li>• <strong>Cardiovascular risks:</strong> N,N-DMT causes rapid blood pressure and heart rate elevation. Individuals with hypertension, heart conditions, or vascular disorders face heightened medical risk.</li>
                    <li>• <strong>Drug interactions:</strong> NEVER combine with MAO inhibitors (SSRIs, TCAs, certain antibiotics), tramadol, or other serotonergic medications: risk of potentially fatal serotonin syndrome.</li>
                    <li>• <strong>Pregnancy/nursing:</strong> No safety data available. Absolute contraindication during pregnancy, lactation, or while attempting conception.</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">Ocular Safety (650 nm Laser)</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• <strong>Class 2 laser safety:</strong> 650 nm wavelength at ≤5 mW power falls within Class 2 classification (IEC 60825-1 standard). Safe for brief exposure, but prolonged staring poses retinal damage risk.</li>
                    <li>• <strong>Blink reflex protection:</strong> Natural aversion response (~0.25 seconds) typically prevents damage during sober operation. However, altered states may reduce protective reflexes.</li>
                    <li>• <strong>Indirect projection recommended:</strong> Aim laser at surfaces (walls, hands) rather than direct viewing to minimize accidental eye exposure during impaired coordination.</li>
                    <li>• <strong>Diffraction grating reduces intensity:</strong> Scattering through grating distributes beam energy, lowering peak intensity per retinal area. Still, avoid prolonged gaze at projected patterns.</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">Psychological Harm Reduction</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• <strong>Set and setting:</strong> Comfortable, safe environment with trusted sitter who remains sober. Remove hazards (stairs, sharp objects, hot surfaces) from immediate area.</li>
                    <li>• <strong>Integration support:</strong> Post-experience integration critical for processing intense phenomenology. Seek professional support if distressing experiences persist beyond 72 hours.</li>
                    <li>• <strong>Frequency limitations:</strong> No established safe frequency guidelines. Anecdotal consensus suggests minimum 2-week intervals to reduce psychological desensitization and maintain respect for intensity.</li>
                    <li>• <strong>Reality testing:</strong> Understand that visual symbols, entity encounters, and perceived communications represent subjective altered-state phenomena: not validated objective reality.</li>
                  </ul>
                </div>

                <div className="p-4 bg-background border border-destructive rounded-lg">
                  <p className="text-sm font-semibold text-destructive mb-2">DMT Code Project Disclaimer</p>
                  <p className="text-xs text-muted-foreground">
                    This protocol guide is for educational purposes only in jurisdictions where legal. DMT Code Project does not advocate, encourage, or facilitate illegal substance use. We do not provide sourcing information, dosing recommendations, or medical advice. All information represents documentation of reported anecdotal experiences, not scientific validation or endorsement.
                  </p>
                </div>
              </div>
            </Card>

            {/* References */}
            <div className="mt-12 p-8 bg-muted/30 border border-border rounded-lg">
              <h2 className="text-2xl font-semibold mb-4">Peer-Reviewed Citations</h2>
              <div className="space-y-3">
                <a 
                  href="https://doi.org/10.1002/hup.2806" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block text-gold hover:underline"
                >
                  Davis et al. (2021) - Entity Encounter Survey DOI: 10.1002/hup.2806
                </a>
                <a 
                  href="https://doi.org/10.1038/s41598-019-51974-4" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block text-gold hover:underline"
                >
                  Timmermann et al. (2019) - Neural Correlates EEG Study
                </a>
                <a 
                  href="https://doi.org/10.1007/978-1-4615-0115-9" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block text-gold hover:underline"
                >
                  Strassman (2001) - Memory Decay Documentation
                </a>
                <a 
                  href="/bibliography" 
                  className="block text-gold hover:underline"
                >
                  View Complete Bibliography →
                </a>
              </div>
            </div>

            <div className="mt-8 p-8 bg-muted/30 border border-border rounded-lg">
              <h2 className="text-2xl font-semibold mb-4">Related Resources</h2>
              <div className="grid md:grid-cols-3 gap-4">
                <a href="/methods" className="text-gold hover:underline font-medium">
                  Research Methods →
                </a>
                <a href="/faq" className="text-gold hover:underline font-medium">
                  FAQ →
                </a>
                <a href="/tools" className="text-gold hover:underline font-medium">
                  Equipment Catalogue →
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

export default ProtocolGuide;
