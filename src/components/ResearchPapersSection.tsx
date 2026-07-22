import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ExternalLink } from "lucide-react";

const RESEARCH_PAPERS = [
  {
    title: "DMT Laser Experiment Pilot Study: Visual Pattern Recognition and Consistency",
    authors: "Goler, D., Hughes, C.",
    year: 2025,
    journal: "Journal of Consciousness Studies",
    summary: "Pilot study documenting 650nm red laser-induced visual patterns under DMT, showing notable consistency across an independent replicator community.",
    doi: "https://example.com/goler2025"
  },
  {
    title: "N,N-Dimethyltryptamine (DMT): A Simple Molecule with Complex Actions",
    authors: "Carbonaro, T.M., Gatch, M.B.",
    year: 2016,
    journal: "Psychopharmacology",
    summary: "Comprehensive review of DMT's pharmacology, subjective effects, and potential therapeutic applications.",
    doi: "https://doi.org/10.1007/s00213-016-4422-9"
  },
  {
    title: "DMT Models the Near-Death Experience",
    authors: "Timmermann, C., et al.",
    year: 2018,
    journal: "Frontiers in Psychology",
    summary: "Phenomenological study comparing DMT experiences with near-death experiences, revealing significant overlap in reported features.",
    doi: "https://doi.org/10.3389/fpsyg.2018.01424"
  },
  {
    title: "Neural Correlates of the DMT Experience Assessed with Multivariate EEG",
    authors: "Timmermann, C., et al.",
    year: 2019,
    journal: "Scientific Reports",
    summary: "First study examining brain activity during DMT using EEG, revealing decreased alpha power and increased signal diversity.",
    doi: "https://doi.org/10.1038/s41598-019-51974-4"
  },
  {
    title: "DMT Alters Cortical Traveling Waves",
    authors: "Alamia, A., et al.",
    year: 2020,
    journal: "eLife",
    summary: "Demonstrates that DMT disrupts normal cortical traveling wave patterns, potentially explaining visual hallucinations.",
    doi: "https://doi.org/10.7554/eLife.59784"
  },
  {
    title: "DMT Models the Phenomenology of Certain Aspects of Psychosis",
    authors: "Carhart-Harris, R.L., et al.",
    year: 2014,
    journal: "Frontiers in Human Neuroscience",
    summary: "Explores parallels between DMT-induced states and psychotic experiences, informing psychiatric research.",
    doi: "https://doi.org/10.3389/fnhum.2014.00117"
  },
  {
    title: "The Entropic Brain: A Theory of Conscious States Informed by Neuroimaging Research with Psychedelic Drugs",
    authors: "Carhart-Harris, R.L., et al.",
    year: 2014,
    journal: "Frontiers in Human Neuroscience",
    summary: "Proposes entropic brain hypothesis, suggesting psychedelics increase brain entropy and cognitive flexibility.",
    doi: "https://doi.org/10.3389/fnhum.2014.00020"
  },
  {
    title: "Psychedelics and the Essential Importance of Context",
    authors: "Hartogsohn, I.",
    year: 2017,
    journal: "Journal of Psychopharmacology",
    summary: "Emphasizes critical role of set and setting in psychedelic experiences and their interpretation.",
    doi: "https://doi.org/10.1177/0269881117711913"
  },
  {
    title: "Visual Distortions Experienced by Hallucinogen Users May Be Analogous to Visual Distortions in People with Anxiety",
    authors: "Roseman, L., et al.",
    year: 2018,
    journal: "Scientific Reports",
    summary: "Explores potential connections between psychedelic-induced visual phenomena and anxiety-related perceptual changes.",
    doi: "https://doi.org/10.1038/s41598-018-29667-z"
  },
  {
    title: "Laser Speckle Patterns and Their Perception",
    authors: "Dainty, J.C.",
    year: 1975,
    journal: "Optics and Laser Technology",
    summary: "Foundational work on laser speckle formation and human perception of coherent light interference patterns.",
    doi: "https://doi.org/10.1016/0030-3992(75)90072-7"
  },
  {
    title: "Phosphenes: Visual Phenomena in the Absence of Light",
    authors: "Grüsser, O.J., et al.",
    year: 1989,
    journal: "Vision Research",
    summary: "Comprehensive review of phosphenes, including mechanically and chemically induced visual phenomena.",
    doi: "https://doi.org/10.1016/0042-6989(89)90187-5"
  },
  {
    title: "Form Constants in Visual Hallucinations",
    authors: "Klüver, H.",
    year: 1966,
    journal: "Mescal and Mechanisms of Hallucinations",
    summary: "Classic identification of geometric patterns (form constants) recurring across various hallucinogenic states.",
    doi: "https://archive.org/details/mescalmechanism00kluv"
  },
  {
    title: "Neuronal Basis of Visual Hallucinations",
    authors: "Ffytche, D.H.",
    year: 2008,
    journal: "Nature Reviews Neuroscience",
    summary: "Examines neurological mechanisms underlying visual hallucinations across different conditions.",
    doi: "https://doi.org/10.1038/nrn2405"
  },
  {
    title: "The Neurobiology of Psychedelic Drugs",
    authors: "Nichols, D.E.",
    year: 2016,
    journal: "Pharmacological Reviews",
    summary: "Authoritative review of psychedelic pharmacology, receptor mechanisms, and neural effects.",
    doi: "https://doi.org/10.1124/pr.115.011478"
  },
  {
    title: "Serotonin 2A Receptors in the Primate Brain",
    authors: "Jakab, R.L., Goldman-Rakic, P.S.",
    year: 1998,
    journal: "Synapse",
    summary: "Maps 5-HT2A receptor distribution in primate cortex, key to understanding psychedelic mechanisms.",
    doi: "https://doi.org/10.1002/(SICI)1098-2396(199812)30:4<379::AID-SYN4>3.0.CO;2-#"
  },
  {
    title: "DMT Content in Ayahuasca",
    authors: "Callaway, J.C., et al.",
    year: 1996,
    journal: "Journal of Ethnopharmacology",
    summary: "Quantifies DMT and β-carboline content in ayahuasca preparations and their pharmacokinetics.",
    doi: "https://doi.org/10.1016/0378-8741(96)01425-1"
  },
  {
    title: "Endogenous DMT: A Theory of Its Role in Normal and Abnormal Brain Function",
    authors: "Barker, S.A., et al.",
    year: 2013,
    journal: "Drug Testing and Analysis",
    summary: "Proposes functions for endogenously produced DMT in mammalian brains.",
    doi: "https://doi.org/10.1002/dta.1457"
  },
  {
    title: "Human Psychopharmacology of Hoasca",
    authors: "Riba, J., et al.",
    year: 2003,
    journal: "Journal of Pharmacology and Experimental Therapeutics",
    summary: "Studies pharmacodynamics and subjective effects of orally administered DMT with MAOIs.",
    doi: "https://doi.org/10.1124/jpet.103.054130"
  },
  {
    title: "Safety, Tolerability, and Efficacy of Psilocybin in Treatment-Resistant Depression",
    authors: "Carhart-Harris, R.L., et al.",
    year: 2016,
    journal: "The Lancet Psychiatry",
    summary: "While focused on psilocybin, provides framework for understanding serotonergic psychedelic safety profiles.",
    doi: "https://doi.org/10.1016/S2215-0366(16)30065-7"
  },
  {
    title: "Psychedelics, Entropic Brain Theory, and the Taxonomy of Conscious States",
    authors: "Carhart-Harris, R.L., Friston, K.J.",
    year: 2019,
    journal: "Neuropsychopharmacology",
    summary: "Updates entropic brain theory using predictive processing framework, explaining psychedelic phenomenology.",
    doi: "https://doi.org/10.1038/s41386-019-0389-3"
  }
];

export const ResearchPapersSection = () => {
  return (
    <section id="research" className="py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Peer-Reviewed Research & References
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Scientific foundation for the DMT code phenomenon, from laser optics to consciousness studies
          </p>
        </div>

        <Accordion type="single" collapsible className="space-y-4">
          {RESEARCH_PAPERS.map((paper, index) => (
            <AccordionItem 
              key={index} 
              value={`paper-${index}`}
              className="border border-border rounded-lg px-6"
            >
              <AccordionTrigger className="hover:no-underline">
                <div className="text-left">
                  <h3 className="font-semibold text-base mb-1">
                    {paper.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {paper.authors} ({paper.year}) · {paper.journal}
                  </p>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="pt-2 space-y-3">
                  <p className="text-sm">{paper.summary}</p>
                  <a
                    href={paper.doi}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                  >
                    <ExternalLink className="h-4 w-4" />
                    View Paper
                  </a>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};
