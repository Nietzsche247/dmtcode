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

// 15 peer-reviewed citations with DOIs
const citations: Citation[] = [
  {
    id: 1,
    authors: "Sirois FM, Pychyl TA",
    title: "Procrastination and the priority of short-term mood regulation: Consequences for future self",
    journal: "Soc Personal Psychol Compass",
    year: 2013,
    doi: "10.1111/spc3.12011",
  },
  {
    id: 2,
    authors: "Shields GS, Sazma MA, Yonelinas AP",
    title: "The effects of acute stress on core executive functions: A meta-analysis and comparison with cortisol",
    journal: "Neurosci Biobehav Rev",
    year: 2016,
    doi: "10.1016/j.neubiorev.2016.06.038",
  },
  {
    id: 3,
    authors: "Sirois FM, Molnar DS, Hirsch JK",
    title: "A meta-analytic and conceptual update on the associations between procrastination and multidimensional perfectionism",
    journal: "Eur J Pers",
    year: 2017,
    doi: "10.1002/per.2098",
  },
  {
    id: 4,
    authors: "Miller EK, Cohen JD",
    title: "An integrative theory of prefrontal cortex function",
    journal: "Annu Rev Neurosci",
    year: 2001,
    doi: "10.1146/annurev.neuro.24.1.167",
  },
  {
    id: 5,
    authors: "Albott CS, Shiroma PR, Cullen KR, et al",
    title: "The antidepressant effect of repeat dose intravenous ketamine is delayed by concurrent benzodiazepine use",
    journal: "J Clin Psychiatry",
    year: 2017,
    doi: "10.4088/JCP.16l11277",
  },
  {
    id: 6,
    authors: "Frye MA, Blier P, Tye SJ",
    title: "Concomitant benzodiazepine use attenuates ketamine response: implications for large scale study design and clinical development",
    journal: "J Clin Psychopharmacol",
    year: 2015,
    doi: "10.1097/JCP.0000000000000316",
  },
  {
    id: 7,
    authors: "Williams NR, Heifets BD, Blasey C, et al",
    title: "Attenuation of antidepressant effects of ketamine by opioid receptor antagonism",
    journal: "Am J Psychiatry",
    year: 2018,
    doi: "10.1176/appi.ajp.2018.18020138",
  },
  {
    id: 8,
    authors: "Fitzgerald PB, Daskalakis ZJ",
    title: "Repetitive transcranial magnetic stimulation treatment for depressive disorders: A practical guide",
    journal: "Springer Nature",
    year: 2022,
    doi: "10.1007/978-3-030-91438-5",
  },
  {
    id: 9,
    authors: "Segrave RA, Arnold S, Hoy K, Fitzgerald PB",
    title: "Concurrent cognitive control training augments the antidepressant efficacy of tDCS: A pilot study",
    journal: "Brain Stimul",
    year: 2014,
    doi: "10.1016/j.brs.2013.12.014",
  },
  {
    id: 10,
    authors: "Deluisi JA, Fani N, Phillips ND, et al",
    title: "Lateral prefrontal stimulation of active cortex with theta burst transcranial magnetic stimulation affects subsequent engagement of the frontoparietal network",
    journal: "Cereb Cortex",
    year: 2024,
    doi: "10.1093/cercor/bhad534",
  },
  {
    id: 11,
    authors: "Duman RS, Aghajanian GK, Sanacora G, Krystal JH",
    title: "Synaptic plasticity and depression: New insights from stress and rapid-acting antidepressants",
    journal: "Nat Med",
    year: 2016,
    doi: "10.1038/nm.4050",
  },
  {
    id: 12,
    authors: "Zanos P, Gould TD",
    title: "Mechanisms of ketamine action as an antidepressant",
    journal: "Mol Psychiatry",
    year: 2018,
    doi: "10.1038/mp.2017.255",
  },
  {
    id: 13,
    authors: "Wilkinson ST, Rhee TG, Joormann J, et al",
    title: "Cognitive behavioral therapy to sustain the antidepressant effects of ketamine in treatment-resistant depression: A randomized clinical trial",
    journal: "Psychother Psychosom",
    year: 2021,
    doi: "10.1159/000517074",
  },
  {
    id: 14,
    authors: "Dore J, Turnipseed B, Dwyer S, et al",
    title: "Ketamine assisted psychotherapy (KAP): Patient demographics, clinical data and outcomes in three large practices administering ketamine with psychotherapy",
    journal: "J Psychoactive Drugs",
    year: 2019,
    doi: "10.1080/02791072.2019.1587556",
  },
  {
    id: 15,
    authors: "Drozdz SJ, Goel A, McGarr MW, et al",
    title: "Ketamine assisted psychotherapy: A systematic narrative review of the literature",
    journal: "J Pain Res",
    year: 2022,
    doi: "10.2147/JPR.S360733",
  },
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
  // Abstract content
  const abstractContent = `This memo presents a transdiagnostic formulation for a patient demonstrating recurrent failures of priority selection and task initiation under time pressure, accompanied by perfectionistic over-preparation and avoidance-maintained interpersonal conflict. The proposed mechanism integrates three processes supported by the literature: stress-potentiated impairment in working memory and cognitive flexibility, procrastination serving short-term emotion regulation, and maladaptive perfectionism that amplifies perceived threat of imperfect action.

The patient is currently receiving ketamine and rTMS. Both interventions create windows of enhanced neuroplasticity that represent time-limited opportunities for accelerated learning. The literature on combined neuromodulation and cognitive training suggests that passive administration without concurrent psychological activation substantially reduces therapeutic yield. This formulation includes recommendations for leveraging the treatment window.`;
  
  // Protocol Addendum content for Read to Me
  const protocolAddendumContent = `Addendum: Session Protocol Recommendations. The following recommendations are offered for integration with the current neuromodulation course. They are based on the formulation above and on literature suggesting that concurrent psychological activation enhances neuromodulation outcomes.

For rTMS Sessions: Before each session, approximately 5-8 minutes: The patient states the single most important goal for the day and the time by which it must be completed. The patient articulates one specific rule for what she will do when she notices optimization behavior after a designated time point. Brief acknowledgment that incomplete or imperfect outcomes are acceptable. After each session, approximately 5-8 minutes: One concrete instance of goal-hierarchy protection is rehearsed. The patient identifies one opportunity for optimization that will be deliberately skipped. The patient articulates why the primary goal matters more than perfection.

For Ketamine Sessions: Before infusion, approximately 10-15 minutes: The patient sets a single intention related to the treatment target. This might be something like releasing the need to optimize, or tolerating the discomfort of incompleteness. A physical gesture or phrase is associated with this intention. During infusion: If verbal communication is possible and feels appropriate, gentle exploration of related themes. What does good enough feel like? What is the optimization protecting against? What matters more than being perfect? After infusion, within 24 hours: Structured review of any insights or experiences. Connection of insights to the behavioral formulation. Commitment to one specific practice for the following 48 hours.

Daily Practice During Treatment Course: The patient should spend 10-15 minutes daily on deliberate practice. Writing the day's primary goal and checking awareness of it three times during the day. Stopping one optimization loop mid-stream and tolerating the incompleteness. Responding to a timer prompt by stepping back and asking what matters most right now.

Outcome Tracking: Weekly assessment of on-time rates, number of subgoal-capture episodes, duration of pre-deadline conflict, and standardized symptom measures.`;

  // Full clinical formulation text for Read to Me functionality
  const clinicalFormulationFullText = `Section 1: Presenting Phenomenology. The patient exhibits a repeatable pattern when objective stakes and external deadlines are present, particularly in situations where lateness carries interpersonal meaning. The primary objective fails to maintain dominance. Subordinate goals acquire equivalent or greater salience, and attention shifts to secondary concerns. This profile is not consistent with apathy. The patient demonstrates substantial distress about consequences and genuine desire for different outcomes.

Section 2: Proposed Mechanism. Procrastination as Affect Regulation. Sirois and Pychyl have articulated the position that procrastination represents the primacy of short-term mood repair over longer-term pursuit of intended actions. Stress Impairs Executive Functions. The meta-analysis by Shields and colleagues examined acute stress effects on executive functions. Working memory showed reliable impairment under acute stress. Perfectionism Amplifies Threat. Perfectionistic concerns showed consistent positive associations with procrastination.

Section 3: Differential Diagnostic Considerations. This presentation can arise from multiple pathways including anxiety disorders, major depression, ADHD, OCD-spectrum presentations, OCPD, and trauma-related freeze.

Section 4: Assessment Recommendations. Structured diagnostic interview, standardized measures, and functional analysis documenting antecedents, behaviors, and consequences.

Section 5: Prognosis. Moderately favorable if treatment explicitly targets stress-reactive executive failure, perfectionism-driven avoidance, and interpersonal demand escalation.

Section 6: Literature on Ketamine Response Factors. Observational studies have examined factors associated with ketamine response variability. Concurrent benzodiazepine use at higher doses was associated with reduced ketamine response.

Section 7: Treatment Targets. The primary target is goal-hierarchy protection under deadline conditions. Process targets include cognitive flexibility, inhibitory control, distress tolerance, and interpersonal sequencing.

Section 8: Neuromodulation and the Treatment Window. The neuromodulation course represents a window of enhanced plasticity. The literature suggests this window should be actively leveraged for new learning. Passive administration without psychological activation leaves potential therapeutic benefit unrealized.

Section 9: Limitations. This formulation is provisional and based primarily on behavioral observation and self-report.`;

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

              {/* Section 2: Clinical Formulation (9 sections) */}
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
                  <div className="border-t border-border/30 pt-4 space-y-8">
                    <div className="flex justify-end mb-4">
                      <ReadToMeButton 
                        text={clinicalFormulationFullText} 
                        sectionId="clinicalFormulation" 
                      />
                    </div>
                    
                    {/* Section 1: Presenting Phenomenology */}
                    <div className="prose prose-invert prose-sm max-w-none">
                      <h3 className="text-lg font-semibold text-foreground mb-4">1. Presenting Phenomenology</h3>
                      <p className="text-foreground/90 leading-relaxed mb-4">
                        The patient exhibits a repeatable pattern when objective stakes and external deadlines are present, particularly in situations where lateness carries interpersonal meaning.
                      </p>
                      <p className="text-foreground/90 leading-relaxed mb-4">
                        The primary objective fails to maintain dominance. Subordinate goals acquire equivalent or greater salience, and attention shifts to secondary concerns such as appearance optimization, completeness checking, or "one more task" that are processed as equivalently urgent despite time constraints.
                      </p>
                      <p className="text-foreground/90 leading-relaxed mb-4">
                        Rather than executing the top-level plan, behavior organizes around resolving or perfecting smaller components. External attempts to impose time structure are experienced as pressure, and interaction frequently escalates into conflict or rationalization, consuming additional time.
                      </p>
                      <p className="text-foreground/90 leading-relaxed">
                        This profile is not consistent with apathy. The patient demonstrates substantial distress about consequences and genuine desire for different outcomes. The pattern is more consistent with threat-sensitive control strategies that sacrifice long-term outcomes for short-term relief from aversive affect.
                      </p>
                    </div>

                    {/* Section 2: Proposed Mechanism */}
                    <div className="prose prose-invert prose-sm max-w-none">
                      <h3 className="text-lg font-semibold text-foreground mb-4">2. Proposed Mechanism</h3>
                      
                      <h4 className="text-base font-medium text-foreground/90 mb-2">2.1 Procrastination as Affect Regulation</h4>
                      <p className="text-foreground/90 leading-relaxed mb-4">
                        Sirois and Pychyl have articulated the position that procrastination represents the primacy of short-term mood repair over longer-term pursuit of intended actions.<CitationLink id={1} /> This reframes delay from a moral deficit to a learned coping strategy. The individual is not failing to work; they are succeeding at avoiding the negative affect associated with the task.
                      </p>
                      <p className="text-foreground/90 leading-relaxed mb-4">
                        The treatment implication is that interventions targeting time management skills alone will be insufficient because they do not address the underlying function.
                      </p>

                      <h4 className="text-base font-medium text-foreground/90 mb-2">2.2 Stress Impairs Executive Functions Required for Deadline Behavior</h4>
                      <p className="text-foreground/90 leading-relaxed mb-4">
                        The meta-analysis by Shields and colleagues examined acute stress effects on executive functions across 51 effect sizes.<CitationLink id={2} /> Working memory showed reliable impairment under acute stress. Cognitive flexibility showed variable effects depending on stress intensity. These are precisely the functions required to maintain a superordinate goal while flexibly disengaging from subgoal pursuit.
                      </p>

                      <h4 className="text-base font-medium text-foreground/90 mb-2">2.3 Perfectionism Amplifies Threat</h4>
                      <p className="text-foreground/90 leading-relaxed mb-4">
                        Sirois, Molnar, and Hirsch conducted a meta-analysis examining procrastination and multidimensional perfectionism.<CitationLink id={3} /> Perfectionistic concerns, including self-criticism and doubts about actions, showed consistent positive associations with procrastination. High standards alone did not drive the association; it was the coupling of standards with evaluative threat.
                      </p>

                      <h4 className="text-base font-medium text-foreground/90 mb-2">2.4 Prefrontal Circuitry</h4>
                      <p className="text-foreground/90 leading-relaxed">
                        The dorsolateral prefrontal cortex supports goal maintenance, inhibitory control, and flexible task-switching.<CitationLink id={4} /> This region shows reduced activation in depression and anxiety, and its function is modulated by neuromodulatory interventions including rTMS and ketamine. The patient is receiving interventions that directly target this circuitry.
                      </p>
                    </div>

                    {/* Section 3: Differential Diagnostic Considerations */}
                    <div className="prose prose-invert prose-sm max-w-none">
                      <h3 className="text-lg font-semibold text-foreground mb-4">3. Differential Diagnostic Considerations</h3>
                      <p className="text-foreground/90 leading-relaxed mb-4">
                        This presentation can arise from multiple pathways. Mechanism-level assessment should precede diagnostic conclusion.
                      </p>
                      <p className="text-foreground/90 leading-relaxed mb-4">
                        Anxiety disorders and performance anxiety involve threat inflation and avoidance as relief. Major depression involves reduced reward anticipation and effort sensitivity that can produce similar initiation problems. ADHD, particularly the inattentive presentation, involves executive dysfunction and time blindness as core features. The key differentiator is that ADHD-related difficulties tend to be context-independent, whereas anxiety-driven patterns often show interpersonal and evaluative specificity.
                      </p>
                      <p className="text-foreground/90 leading-relaxed">
                        OCD-spectrum presentations can produce checking and over-preparation, distinguished by the presence of ego-dystonic intrusions. OCPD involves ego-syntonic rigidity and standards-driven behavior. Trauma-related freeze involves autonomic shutdown in high-demand situations that resembles procrastination but reflects physiological state.
                      </p>
                      <p className="text-foreground/90 leading-relaxed mt-4">
                        The formulation presented here remains applicable regardless of final diagnostic determination; it predicts treatment response at the level of process.
                      </p>
                    </div>

                    {/* Section 4: Assessment Recommendations */}
                    <div className="prose prose-invert prose-sm max-w-none">
                      <h3 className="text-lg font-semibold text-foreground mb-4">4. Assessment Recommendations</h3>
                      <p className="text-foreground/90 leading-relaxed mb-4">
                        Structured diagnostic interview covering onset, course, developmental history, trauma exposure, and prior treatment response. Collateral information from family when available.
                      </p>
                      <p className="text-foreground/90 leading-relaxed">
                        Standardized measures should include depression and anxiety scales, executive function assessment, OCD screening, and a multidimensional perfectionism measure. Functional analysis documenting antecedents, behaviors, and consequences of specific procrastination episodes would clarify maintaining contingencies.
                      </p>
                    </div>

                    {/* Section 5: Prognosis */}
                    <div className="prose prose-invert prose-sm max-w-none">
                      <h3 className="text-lg font-semibold text-foreground mb-4">5. Prognosis</h3>
                      <p className="text-foreground/90 leading-relaxed mb-4">
                        Moderately favorable if treatment explicitly targets stress-reactive executive failure, perfectionism-driven avoidance, and interpersonal demand escalation. Measurement-based care with repeated behavioral practice is essential.
                      </p>
                      <p className="text-foreground/90 leading-relaxed">
                        Risk for persistence increases if care focuses exclusively on mood symptoms without installing deadline-specific behavioral procedures and tolerance for imperfection.
                      </p>
                    </div>

                    {/* Section 6: Literature on Ketamine Response Factors - Medication Considerations */}
                    <div className="mt-8 p-5 bg-destructive/5 border border-destructive/20 rounded-xl">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-1.5 rounded bg-destructive/10 text-destructive">
                          <Pill className="h-4 w-4" />
                        </div>
                        <h3 className="font-semibold text-foreground">6. Literature on Ketamine Response Factors</h3>
                      </div>
                      <div className="prose prose-invert prose-sm max-w-none">
                        <p className="text-foreground/80 leading-relaxed mb-4">
                          The following findings from recent literature may be relevant to the treatment team's consideration. I am not in a position to know whether these apply to this patient's situation, but I include them in the interest of completeness.
                        </p>
                        <p className="text-foreground/80 leading-relaxed mb-4">
                          Observational studies have examined factors associated with ketamine response variability. Albott and colleagues found that concurrent benzodiazepine use at higher doses was associated with reduced ketamine response in their sample.<CitationLink id={5} /> A subsequent analysis by Frye and colleagues proposed a threshold of approximately 8mg lorazepam equivalent daily dose, though this finding requires replication and the clinical significance remains under investigation.<CitationLink id={6} />
                        </p>
                        <p className="text-foreground/80 leading-relaxed mb-4">
                          The proposed mechanism in the literature involves GABA-A receptor activity affecting the glutamatergic signaling that mediates ketamine's effects.
                        </p>
                        <p className="text-foreground/80 leading-relaxed mb-4">
                          Separately, Williams and colleagues reported that opioid receptor antagonism may interact with ketamine's antidepressant mechanism, though this finding remains an area of active research and debate.<CitationLink id={7} />
                        </p>
                        <p className="text-foreground/80 leading-relaxed italic">
                          I raise these studies only to ensure the treatment team is aware of this literature, not to suggest any specific action. The prescribing clinicians are in the best position to evaluate relevance to this patient's care.
                        </p>
                      </div>
                    </div>

                    {/* Section 7: Treatment Targets */}
                    <div className="mt-6 p-5 bg-muted/30 border border-border/50 rounded-xl">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-1.5 rounded bg-muted/50 text-muted-foreground">
                          <Target className="h-4 w-4" />
                        </div>
                        <h3 className="font-semibold text-foreground">7. Treatment Targets</h3>
                      </div>
                      <div className="prose prose-invert prose-sm max-w-none">
                        <h4 className="text-base font-medium text-foreground/90 mb-2">Primary Behavioral Target</h4>
                        <p className="text-foreground/80 leading-relaxed mb-4">
                          The primary target is goal-hierarchy protection under deadline conditions. This involves implementing an externalized protocol with predetermined departure times, explicit drop rules at designated time points, and pre-committed criteria for acceptable completion.
                        </p>
                        <p className="text-foreground/80 leading-relaxed mb-4">
                          Outcome metrics should include on-time rates, number and duration of pre-deadline conflicts, and subjective distress ratings.
                        </p>

                        <h4 className="text-base font-medium text-foreground/90 mb-2">Process Targets</h4>
                        <p className="text-foreground/80 leading-relaxed">
                          Cognitive flexibility involves practicing switching from optimization mode to execution mode on demand. Inhibitory control involves reducing checking loops and implementing single-attempt rules for specific behaviors. Distress tolerance involves replacing avoidance-based relief with acceptance-based strategies. Interpersonal sequencing involves developing autonomy-supportive prompt structures that reduce demand-threat escalation.
                        </p>
                      </div>
                    </div>

                    {/* Section 8: Neuromodulation and the Treatment Window */}
                    <div className="mt-6 p-5 bg-primary/5 border border-primary/20 rounded-xl">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-1.5 rounded bg-primary/10 text-primary">
                          <Brain className="h-4 w-4" />
                        </div>
                        <h3 className="font-semibold text-foreground">8. Neuromodulation and the Treatment Window</h3>
                      </div>
                      <div className="prose prose-invert prose-sm max-w-none">
                        <h4 className="text-base font-medium text-foreground/90 mb-2">8.1 rTMS and Concurrent Cognitive Activation</h4>
                        <p className="text-foreground/80 leading-relaxed mb-4">
                          Standard rTMS protocols for depression target the left dorsolateral prefrontal cortex, a region central to cognitive control.<CitationLink id={8} /> There is a growing literature suggesting that brain state during stimulation influences outcomes.
                        </p>
                        <p className="text-foreground/80 leading-relaxed mb-4">
                          Segrave and colleagues conducted a pilot study comparing tDCS alone, cognitive control training alone, and the combination.<CitationLink id={9} /> All three conditions showed depression reduction immediately after treatment. However, only the combination of stimulation plus cognitive control training showed sustained effects at three-week follow-up.
                        </p>
                        <p className="text-foreground/80 leading-relaxed mb-4">
                          A 2024 neuroimaging study found that stimulating the DLPFC while participants performed a working memory task produced different effects than stimulating at rest. The authors concluded that an active cortex may be more receptive to stimulation-induced changes.<CitationLink id={10} />
                        </p>
                        <p className="text-foreground/80 leading-relaxed mb-4 font-medium">
                          The implication for clinical practice is that rTMS sessions may represent an opportunity for concurrent cognitive activation, not merely passive receipt of stimulation.
                        </p>

                        <h4 className="text-base font-medium text-foreground/90 mb-2 mt-6">8.2 Ketamine and the Plasticity Window</h4>
                        <p className="text-foreground/80 leading-relaxed mb-4">
                          Ketamine's rapid effects involve glutamatergic mechanisms that trigger signaling cascades associated with synaptic plasticity.<CitationLink id={11} /><CitationLink id={12} /> The clinical question is how to leverage the window of enhanced plasticity that follows administration.
                        </p>
                        <p className="text-foreground/80 leading-relaxed mb-4">
                          Wilkinson and colleagues randomized ketamine responders to either CBT or treatment as usual following their infusion series.<CitationLink id={13} /> The CBT group showed significantly longer maintenance of antidepressant gains.
                        </p>
                        <p className="text-foreground/80 leading-relaxed mb-4">
                          Dore and colleagues reported outcomes from three practices delivering ketamine with psychotherapy.<CitationLink id={14} /> The most significant improvements were seen in patients with developmental trauma and those who received more ketamine-assisted sessions.
                        </p>
                        <p className="text-foreground/80 leading-relaxed mb-4">
                          The ketamine-assisted psychotherapy literature proposes that ketamine can reduce defensive rigidity and enhance access to emotionally significant material, creating conditions favorable for therapeutic work.<CitationLink id={15} />
                        </p>

                        <h4 className="text-base font-medium text-foreground/90 mb-2 mt-6">8.3 Specific Recommendations for the Treatment Course</h4>
                        <p className="text-foreground/80 leading-relaxed mb-4">
                          The recommendations below are offered for the treatment team's consideration. They are based on the literature reviewed above and on the specific formulation for this patient.
                        </p>
                        <p className="text-foreground/80 leading-relaxed mb-4">
                          <strong>For rTMS sessions:</strong> Brief cognitive activation immediately before or after stimulation may enhance effects. This could involve 5-10 minutes of structured practice: stating the day's primary goal, articulating an implementation intention, or practicing a working memory task.
                        </p>
                        <p className="text-foreground/80 leading-relaxed mb-4">
                          <strong>For ketamine sessions:</strong> The literature supports preparation and integration. Preparation involves setting a specific intention related to the treatment target. Integration involves structured processing within 24 hours of the session.
                        </p>
                        <p className="text-foreground/80 leading-relaxed mb-4">
                          <strong>For daily practice:</strong> Brief, repeated rehearsal of target skills—holding the superordinate goal in awareness, practicing stopping mid-task when a threshold is reached, and switching from detail-focus to big-picture on demand.
                        </p>
                        <p className="text-foreground/80 leading-relaxed font-medium border-l-2 border-primary pl-4 mt-4">
                          The neuromodulation course represents a window of enhanced plasticity. The literature suggests this window should be actively leveraged for new learning. Passive administration without psychological activation leaves potential therapeutic benefit unrealized.
                        </p>
                      </div>
                    </div>

                    {/* Section 9: Limitations */}
                    <div className="prose prose-invert prose-sm max-w-none mt-6">
                      <h3 className="text-lg font-semibold text-foreground mb-4">9. Limitations</h3>
                      <p className="text-foreground/90 leading-relaxed mb-4">
                        This formulation is provisional and based primarily on behavioral observation and self-report. It has not been validated against structured diagnostic interview, independent collateral sources, or comprehensive neuropsychological assessment.
                      </p>
                      <p className="text-foreground/90 leading-relaxed mb-4">
                        Alternative explanations have not been formally ruled out. ADHD-inattentive presentation shares substantial phenomenological overlap with the described pattern. Formal assessment including developmental history may be warranted.
                      </p>
                      <p className="text-foreground/90 leading-relaxed mb-4">
                        The ketamine response literature cited in Section 6 represents observational findings that may or may not apply to this patient. I have no knowledge of the patient's current treatment regimen and am not in a position to evaluate relevance. I include those citations solely to ensure the treatment team has access to recent literature.
                      </p>
                      <p className="text-foreground/90 leading-relaxed">
                        The recommendations regarding neuromodulation integration are based on emerging literature. The field has not yet established standardized protocols for combined neuromodulation and psychological intervention. The suggestions offered here represent one reasonable interpretation of current evidence.
                      </p>
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
                  <div className="border-t border-border/30 pt-4 space-y-6">
                    <div className="flex justify-end mb-4">
                      <ReadToMeButton text={protocolAddendumContent} sectionId="protocolAddendum" />
                    </div>
                    
                    <div className="prose prose-invert prose-sm max-w-none">
                      <p className="text-foreground/90 leading-relaxed mb-4">
                        The following recommendations are offered for integration with the current neuromodulation course. They are based on the formulation above and on literature suggesting that concurrent psychological activation enhances neuromodulation outcomes.
                      </p>
                    </div>

                    {/* rTMS Sessions */}
                    <div className="p-5 bg-muted/30 border border-border/50 rounded-xl">
                      <h3 className="font-semibold text-foreground mb-4">For rTMS Sessions</h3>
                      
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-sm font-medium text-primary mb-2">Before each session (5-8 minutes)</h4>
                          <ul className="text-foreground/80 text-sm space-y-2 list-disc list-inside">
                            <li>The patient states the single most important goal for the day and the time by which it must be completed.</li>
                            <li>The patient articulates one specific rule for what she will do when she notices optimization behavior after a designated time point.</li>
                            <li>Brief acknowledgment that incomplete or imperfect outcomes are acceptable.</li>
                          </ul>
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-medium text-primary mb-2">After each session (5-8 minutes)</h4>
                          <ul className="text-foreground/80 text-sm space-y-2 list-disc list-inside">
                            <li>One concrete instance of goal-hierarchy protection is rehearsed, such as walking through the next morning's sequence with explicit stopping points.</li>
                            <li>The patient identifies one opportunity for optimization that will be deliberately skipped.</li>
                            <li>The patient articulates why the primary goal matters more than perfection.</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    {/* Ketamine Sessions */}
                    <div className="p-5 bg-primary/5 border border-primary/20 rounded-xl">
                      <h3 className="font-semibold text-foreground mb-4">For Ketamine Sessions</h3>
                      
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-sm font-medium text-primary mb-2">Before infusion (10-15 minutes)</h4>
                          <ul className="text-foreground/80 text-sm space-y-2 list-disc list-inside">
                            <li>The patient sets a single intention related to the treatment target. This might be something like "releasing the need to optimize" or "tolerating the discomfort of incompleteness."</li>
                            <li>A physical gesture or phrase is associated with this intention.</li>
                          </ul>
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-medium text-primary mb-2">During infusion</h4>
                          <ul className="text-foreground/80 text-sm space-y-2 list-disc list-inside">
                            <li>If verbal communication is possible and feels appropriate, gentle exploration of related themes: What does "good enough" feel like? What is the optimization protecting against? What matters more than being perfect?</li>
                            <li>If deeper dissociation occurs, minimal intervention with ambient support only.</li>
                          </ul>
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-medium text-primary mb-2">After infusion (within 24 hours)</h4>
                          <ul className="text-foreground/80 text-sm space-y-2 list-disc list-inside">
                            <li>Structured review of any insights or experiences.</li>
                            <li>Connection of insights to the behavioral formulation.</li>
                            <li>Commitment to one specific practice for the following 48 hours.</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    {/* Daily Practice */}
                    <div className="p-5 bg-muted/30 border border-border/50 rounded-xl">
                      <h3 className="font-semibold text-foreground mb-4">Daily Practice During Treatment Course</h3>
                      <p className="text-foreground/80 text-sm mb-3">The patient should spend 10-15 minutes daily on deliberate practice:</p>
                      <ul className="text-foreground/80 text-sm space-y-2 list-disc list-inside">
                        <li>Writing the day's primary goal and checking awareness of it three times during the day.</li>
                        <li>Stopping one optimization loop mid-stream and tolerating the incompleteness.</li>
                        <li>Responding to a timer prompt by stepping back and asking "what matters most right now?"</li>
                      </ul>
                    </div>

                    {/* Outcome Tracking */}
                    <div className="p-5 bg-muted/20 border border-border/30 rounded-xl">
                      <h3 className="font-semibold text-foreground mb-4">Outcome Tracking</h3>
                      <p className="text-foreground/80 text-sm mb-3">Weekly assessment of:</p>
                      <ul className="text-foreground/80 text-sm space-y-2 list-disc list-inside">
                        <li>On-time rates</li>
                        <li>Number of subgoal-capture episodes</li>
                        <li>Duration of pre-deadline conflict</li>
                        <li>Standardized symptom measures</li>
                      </ul>
                      <p className="text-foreground/80 text-sm mt-4">Each session should include a distress rating before and after, notation of whether behavioral rehearsal was completed, and any relevant observations.</p>
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
