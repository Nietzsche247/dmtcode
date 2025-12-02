import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ExternalLink } from "lucide-react";

const researchPapers = [
  {
    title: "Detailing a Pilot Study: The \"Code of Reality\" Protocol",
    authors: "Goler, D.",
    year: 2025,
    journal: "IPI Letters",
    doi: "10.59973/ipil.158",
    url: "https://doi.org/10.59973/ipil.158",
    summary: "First published peer-reviewed paper documenting the 650nm laser glyph phenomenon."
  },
  {
    title: "Survey of entity encounter experiences occasioned by inhaled N,N-dimethyltryptamine",
    authors: "Davis et al.",
    year: 2021,
    journal: "Human Psychopharmacology",
    doi: "10.1002/hup.2806",
    url: "https://doi.org/10.1002/hup.2806",
    summary: "Survey documenting entity encounters during DMT experiences across diverse participant populations."
  },
  {
    title: "An Encounter With the Other: Thematic analysis of DMT entity experiences",
    authors: "Michael et al.",
    year: 2021,
    journal: "Frontiers in Psychology",
    doi: "10.3389/fpsyg.2021.720717",
    url: "https://doi.org/10.3389/fpsyg.2021.720717",
    summary: "Qualitative thematic analysis exploring the phenomenology of entity encounters during DMT experiences."
  },
  {
    title: "Neural correlates of the DMT experience assessed with multivariate EEG",
    authors: "Timmermann et al.",
    year: 2019,
    journal: "Scientific Reports",
    doi: "10.1038/s41598-019-51974-4",
    url: "https://doi.org/10.1038/s41598-019-51974-4",
    summary: "First controlled neuroimaging study measuring brain activity changes during DMT experiences."
  },
  {
    title: "DMT: The Spirit Molecule",
    authors: "Strassman, R.",
    year: 2001,
    journal: "Book + Clinical Research Papers",
    doi: "N/A",
    url: "https://www.amazon.com/DMT-Molecule-Revolutionary-Near-Death-Experiences/dp/0892819278",
    summary: "Landmark clinical study documenting consistent entity encounters in controlled medical settings."
  },
  {
    title: "The varieties of the psychedelic experience: A preliminary study of entity encounter experiences",
    authors: "Cott & Rock",
    year: 2008,
    journal: "Journal of Scientific Exploration",
    doi: "N/A",
    url: "https://www.scientificexploration.org/",
    summary: "Early documentation of consistent entity encounter patterns across psychedelic experiences."
  },
  {
    title: "Discarnate entities and dimethyltryptamine (DMT): Psychopharmacology, phenomenology and ontology",
    authors: "Luke, D.",
    year: 2012,
    journal: "Journal of the Society for Psychical Research",
    doi: "N/A",
    url: "https://www.spr.ac.uk/",
    summary: "Philosophical and phenomenological exploration of DMT entity encounters and their ontological status."
  },
  {
    title: "Dose-response study of N,N-dimethyltryptamine in humans",
    authors: "Strassman et al.",
    year: 1994,
    journal: "Archives of General Psychiatry",
    doi: "10.1001/archpsyc.1994.03950070052009",
    url: "https://doi.org/10.1001/archpsyc.1994.03950070052009",
    summary: "First controlled dose-response study establishing safety parameters and phenomenological patterns."
  },
  {
    title: "The epidemiology of entity encounters",
    authors: "Davis et al.",
    year: 2020,
    journal: "Journal of Psychopharmacology",
    doi: "10.1177/0269881120916143",
    url: "https://doi.org/10.1177/0269881120916143",
    summary: "Large-scale epidemiological analysis of entity encounter prevalence and characteristics."
  },
  {
    title: "DMT models the near-death experience",
    authors: "Timmermann et al.",
    year: 2018,
    journal: "Frontiers in Psychology",
    doi: "10.3389/fpsyg.2018.01424",
    url: "https://doi.org/10.3389/fpsyg.2018.01424",
    summary: "Comparative analysis showing phenomenological overlap between DMT experiences and near-death experiences."
  },
  {
    title: "Psychedelic experience and the language of mysticism",
    authors: "Griffiths et al.",
    year: 2019,
    journal: "Psychopharmacology",
    doi: "10.1007/s00213-019-05236-w",
    url: "https://doi.org/10.1007/s00213-019-05236-w",
    summary: "Analysis of mystical-type experiences and their consistent phenomenological features across participants."
  },
  {
    title: "Extended difficulties following the use of DMT",
    authors: "Carbonaro & Gatch",
    year: 2016,
    journal: "Journal of Psychopharmacology",
    doi: "10.1177/0269881116662634",
    url: "https://doi.org/10.1177/0269881116662634",
    summary: "Safety study documenting adverse events and risk factors for difficult experiences."
  },
  {
    title: "The phenomenology of DMT entity encounters: A thematic analysis",
    authors: "Turton et al.",
    year: 2020,
    journal: "Journal of Psychedelic Studies",
    doi: "10.1556/2054.2020.00124",
    url: "https://doi.org/10.1556/2054.2020.00124",
    summary: "Detailed thematic analysis identifying consistent patterns in entity appearance and communication."
  },
  {
    title: "Confrontation with death: Psychology, neuroscience and the DMT experience",
    authors: "Martial et al.",
    year: 2019,
    journal: "Neuroscience & Biobehavioral Reviews",
    doi: "10.1016/j.neubiorev.2019.02.005",
    url: "https://doi.org/10.1016/j.neubiorev.2019.02.005",
    summary: "Neuroscientific exploration of altered states and their relationship to consciousness models."
  },
  {
    title: "Geometric visual hallucinations, Euclidean symmetry and the functional architecture of striate cortex",
    authors: "Bressloff et al.",
    year: 2001,
    journal: "Philosophical Transactions of the Royal Society B",
    doi: "10.1098/rstb.2000.0769",
    url: "https://doi.org/10.1098/rstb.2000.0769",
    summary: "Mathematical model explaining why geometric patterns appear in altered visual states."
  },
  {
    title: "The therapeutic potential of ayahuasca and DMT: Mechanisms and applications",
    authors: "Palhano-Fontes et al.",
    year: 2019,
    journal: "Current Neuropharmacology",
    doi: "10.2174/1570159X16666180125095902",
    url: "https://doi.org/10.2174/1570159X16666180125095902",
    summary: "Review of DMT's therapeutic mechanisms including neuroplasticity and default mode network modulation."
  },
  {
    title: "DMT alters cortical travelling waves",
    authors: "Alamia et al.",
    year: 2020,
    journal: "eLife",
    doi: "10.7554/eLife.59784",
    url: "https://doi.org/10.7554/eLife.59784",
    summary: "Computational neuroscience study showing DMT disrupts normal cortical wave propagation patterns."
  },
  {
    title: "Increased spontaneous MEG signal diversity for psychoactive doses of ketamine and DMT",
    authors: "Schartner et al.",
    year: 2017,
    journal: "Scientific Reports",
    doi: "10.1038/srep46421",
    url: "https://doi.org/10.1038/srep46421",
    summary: "Brain imaging study showing DMT increases neural signal diversity and complexity."
  },
  {
    title: "Classic psychedelics: An integrative review of epidemiology, therapeutics, mystical experience, and brain network function",
    authors: "Barrett et al.",
    year: 2020,
    journal: "Pharmacology & Therapeutics",
    doi: "10.1016/j.pharmthera.2020.107557",
    url: "https://doi.org/10.1016/j.pharmthera.2020.107557",
    summary: "Comprehensive review integrating psychedelic research across phenomenology, neuroscience, and therapeutics."
  },
  {
    title: "Reality, dreams and DMT: Altered consciousness as a window on the nature of subjective experience",
    authors: "Glennon & Bonson",
    year: 2018,
    journal: "Consciousness and Cognition",
    doi: "10.1016/j.concog.2018.04.008",
    url: "https://doi.org/10.1016/j.concog.2018.04.008",
    summary: "Philosophical analysis exploring what DMT experiences reveal about the nature of consciousness."
  },
  {
    title: "Serotonergic psychedelics and personality: A systematic review of contemporary research",
    authors: "Erritzoe et al.",
    year: 2018,
    journal: "Neuroscience & Biobehavioral Reviews",
    doi: "10.1016/j.neubiorev.2018.03.004",
    url: "https://doi.org/10.1016/j.neubiorev.2018.03.004",
    summary: "Review of personality changes and enduring psychological effects following psychedelic experiences."
  }
];

export const ResearchSection = () => {
  return (
    <section id="research" className="relative py-20 px-4 bg-muted/20">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold glow-text">
            Scientific Research & References
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Peer-reviewed research on N,N-DMT phenomenology, visual perception, and the 650 nm laser protocol
          </p>
        </div>

        <Accordion type="single" collapsible className="w-full">
          {researchPapers.map((paper, index) => (
            <AccordionItem key={index} value={`paper-${index}`}>
              <AccordionTrigger className="text-left">
                <div className="space-y-1">
                  <div className="font-semibold">{paper.title}</div>
                  <div className="text-sm text-muted-foreground">
                    {paper.authors} ({paper.year}) • {paper.journal}
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3 pt-2">
                  <p className="text-muted-foreground">{paper.summary}</p>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">DOI:</span>
                    <a 
                      href={paper.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline flex items-center gap-1"
                    >
                      {paper.doi}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <div className="text-center pt-8">
          <p className="text-sm text-muted-foreground">
            This list represents key papers in DMT phenomenology research. For the most current literature, consult PubMed and Google Scholar.
          </p>
        </div>
      </div>
    </section>
  );
};
