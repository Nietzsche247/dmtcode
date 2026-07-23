import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Breadcrumb } from '@/components/Breadcrumb';
import { Helmet } from 'react-helmet';
import { Card } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const FAQ_GROUPS: Array<{ heading: string; items: Array<{ q: string; a: string }> }> = [
  {
    heading: 'The project',
    items: [
      {
        q: 'What is the "DMT code"?',
        a: 'People who take N,N-DMT often report seeing structured visual forms, grids, glyphs, geometric symbols, and a smaller group describes something that reads almost like written characters. The DMT Code project collects those reports in one place so the overlaps can actually be measured instead of argued about. We are not claiming the forms are a message. We are asking a narrower question: do independent people, who have never spoken, keep drawing the same shapes?',
      },
      {
        q: 'Is the code real? Are you saying reality is made of code?',
        a: 'No. We hold that question open on purpose. Our job is to gather the observations, keep the method honest, and publish everything so anyone can judge for themselves. If the overlaps turn out to be coincidence or shared cultural imagery, the data should show that too. A result that cannot fail is not worth much, so we built this to be able to fail.',
      },
      {
        q: 'Is this a religion, or are you telling people what to believe?',
        a: 'Neither. Nobody here is asking you to believe anything. Plenty of people who take this seriously think it will turn out to be pattern-matching or shared imagery, and that is a fine place to stand. We care about the observations and the method. What you conclude from them is yours.',
      },
      {
        q: 'What will I actually see? Does everyone see the same thing?',
        a: 'We cannot promise you will see anything in particular, and honesty matters more than hype. Reports vary a lot. Some people describe grids or geometric forms, some describe symbols, and some see nothing they would call structured. The registry exists to find where those experiences genuinely overlap and where they do not, not to tell you what to expect.',
      },
      {
        q: 'Who is behind this and why should I trust it?',
        a: 'Trust the method, not us. The reason to take this seriously is that it is open, it is falsifiable, and the confirmations are public, not that anyone here says so. We keep a neutral position, we never seed or fake a count, and we publish the parts that would let you prove us wrong.',
      },
    ],
  },
  {
    heading: 'Safety and law',
    items: [
      {
        q: 'How do I do this safely?',
        a: 'Start with the screening card. Before you consider anything, talk with a qualified prescriber about MAOIs, SSRIs and related medications, any cardiac history, and any personal or family history of psychosis. We deliberately do not publish medication timing windows. The sources disagree and getting it wrong can be dangerous, so that decision belongs with a clinician who knows your history. This is for adults 18 and older.',
      },
      {
        q: 'Is this legal?',
        a: 'The equipment we discuss is ordinary optical gear. We do not sell, source, or explain how to obtain any controlled substance, and nothing here is legal advice. Laws differ by country and state and they change. For your own situation, check your local law or a qualified professional.',
      },
      {
        q: 'Is the laser safe for my eyes?',
        a: 'A laser is not a toy. The kits include the right optical density and eyewear for how the protocol uses the light, and everything should be used exactly as described and kept away from children. If you are unsure how to handle optical equipment safely, do not improvise with it.',
      },
    ],
  },
  {
    heading: 'The method and the data',
    items: [
      {
        q: "How do you stop people from just copying each other's answers?",
        a: 'That is the whole design problem, and it is why the flagship is a blinded comparison. Wherever we can, people record what they saw before they see the existing catalogue, so a match means two strangers landed on the same form independently rather than one person nodding along to another. Convergence only counts when it is earned that way.',
      },
      {
        q: 'What actually counts as a match?',
        a: 'A symbol is not called a match because it looks vaguely similar. People compare specific forms, and a confirmation is recorded when someone recognizes a form they saw independently. Every symbol shows how many people have recognized it, so you can weigh each one yourself.',
      },
      {
        q: 'Can I see the raw data?',
        a: 'Yes, all of it. The registry is public, the machine-readable corpus is at /dataset and /data.json, and it is all CC-BY-4.0, free to read, quote, and check. Every symbol shows how many people have recognized it. If something looks off, we would rather you find it.',
      },
      {
        q: 'Can I add a symbol I saw myself?',
        a: 'Yes. The registry is built from contributions. You can submit what you saw, add context to symbols others have logged, and take part in the comparison. That is how the dataset grows, and it is free to do.',
      },
      {
        q: 'Can I download the whole dataset?',
        a: 'Yes. The full corpus is at /data.json and /dataset under CC-BY-4.0, with an archived, citable version by DOI. Read it, quote it, run your own analysis, and tell us if we got something wrong.',
      },
    ],
  },
  {
    heading: 'Taking part and kits',
    items: [
      {
        q: 'What do I need to get started?',
        a: 'Everything is laid out on the prepare page, from a single-instrument Observer kit up to a full Complete kit. The core is a verified 650nm laser and the right optical density, plus an observation journal and a screening card. You can also source every part yourself. We show the do-it-yourself total next to each kit so you know exactly what you are paying for.',
      },
      {
        q: 'Why a 650nm laser?',
        a: 'It is the specific red wavelength the observation protocol is built around, paired with the right optical density so it is used the same way each time. Consistent equipment is what lets one person\u2019s observation be compared against another\u2019s instead of guessing at the differences.',
      },
      {
        q: 'Do I have to use DMT to take part?',
        a: 'No. A lot of the work here is observation and comparison. You can browse the registry, add context to symbols other people have logged, and help judge where the forms actually converge without taking anything. The dataset gets stronger every time someone compares carefully.',
      },
      {
        q: 'Do I have to buy a kit to take part?',
        a: 'No. A kit gets you the equipment to run a careful observation of your own, but you can browse, contribute, and help judge convergence without spending anything. The kits make doing it well easier; they do not gate the project.',
      },
      {
        q: 'Can my friends and I do this together?',
        a: 'Yes, and it is often better that way. The group bundles on the prepare page share the costly instruments across two, three, or five people, so the per-person cost drops as the circle grows. Three and five also include a facilitator guide and a group agreements card, because doing this with other people asks for a little more structure.',
      },
      {
        q: 'What are your shipping and refund terms?',
        a: 'Every item shows its ship window before you pay, and if a date slips you hear it from us first. Preorder items are not charged until there is a confirmed source and date. If a component arrives not as described, we replace it and cover it.',
      },
    ],
  },
];

const ALL_ITEMS = FAQ_GROUPS.flatMap((g) => g.items);

const FAQ = () => {
  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: ALL_ITEMS.map((it) => ({
      '@type': 'Question',
      name: it.q,
      acceptedAnswer: { '@type': 'Answer', text: it.a },
    })),
  };

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://dmtcode.com/' },
      { '@type': 'ListItem', position: 2, name: 'FAQ', item: 'https://dmtcode.com/faq' },
    ],
  };

  return (
    <>
      <Helmet>
        <title>Questions about the DMT Code project and preparing to observe | DMT Code</title>
        <meta
          name="description"
          content="Answers to common questions about the DMT Code project: what it is, how to prepare safely, why the data is open, and how convergence is measured."
        />
        <link rel="canonical" href="https://dmtcode.com/faq" />
        <meta name="robots" content="index, follow" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://dmtcode.com/faq" />
        <meta property="og:title" content="Questions about the DMT Code project and preparing to observe | DMT Code" />
        <meta property="og:description" content="Answers to common questions about the DMT Code project: what it is, how to prepare safely, why the data is open, and how convergence is measured." />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="Questions about the DMT Code project and preparing to observe | DMT Code" />
        <meta name="twitter:description" content="Answers to common questions about the DMT Code project: what it is, how to prepare safely, why the data is open, and how convergence is measured." />
        <script type="application/ld+json">{JSON.stringify(faqLd)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumbLd)}</script>
      </Helmet>

      <div className="relative min-h-screen bg-background">
        <Navigation />

        <main id="main-content" className="relative z-10 pt-20" role="main">
          <section className="relative px-4 py-16 md:py-24">
            <div className="max-w-4xl mx-auto text-center space-y-4">
              <p className="text-muted-foreground text-xs font-medium tracking-[0.2em] uppercase">
                Frequently asked
              </p>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-[-0.03em] leading-[0.95]">
                Questions about the project
              </h1>
              <p className="text-base md:text-lg font-light text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                What the DMT Code project is, how to prepare, and how the data stays honest.
              </p>
            </div>
          </section>

          <Breadcrumb />

          <section className="container mx-auto px-4 py-8 max-w-3xl space-y-10">
            {FAQ_GROUPS.map((group, gi) => (
              <div key={gi} className="space-y-4">
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
                  {group.heading}
                </h2>
                <Card className="p-4 md:p-6 rounded-2xl border-border/60">
                  <Accordion type="single" collapsible className="space-y-2">
                    {group.items.map((item, i) => (
                      <AccordionItem
                        key={i}
                        value={`g${gi}-item-${i}`}
                        className="border border-border/50 rounded-xl px-5 bg-card/30"
                      >
                        <AccordionTrigger className="text-left text-base md:text-lg font-semibold">
                          {item.q}
                        </AccordionTrigger>
                        <AccordionContent className="text-sm md:text-base text-muted-foreground leading-relaxed pt-2 pb-4 whitespace-pre-line">
                          {item.a}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </Card>
              </div>
            ))}

            <p className="text-xs text-muted-foreground mt-6 text-center">
              See the open data at <a href="/registry" className="underline hover:text-foreground">/registry</a>,{' '}
              <a href="/dataset" className="underline hover:text-foreground">/dataset</a>, and{' '}
              <a href="/data.json" className="underline hover:text-foreground">/data.json</a>. CC-BY-4.0.
            </p>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default FAQ;
