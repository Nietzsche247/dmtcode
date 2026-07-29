import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Helmet } from 'react-helmet';
import { Breadcrumb } from '@/components/Breadcrumb';

const Terms = () => {
  return (
    <>
      <Helmet>
        <title>Terms | DMT Code</title>
        <meta name="description" content="The terms you agree to when you use DMT Code or contribute to it." />
        <link rel="canonical" href="https://dmtcode.com/terms" />
        <meta name="robots" content="index, follow" />
        <meta property="og:title" content="Terms | DMT Code" />
        <meta property="og:description" content="The terms you agree to when you use DMT Code or contribute to it." />
        <meta property="og:url" content="https://dmtcode.com/terms" />
        <meta property="og:type" content="website" />
      </Helmet>

      <div className="relative min-h-screen bg-background">
        <Navigation />
        <Breadcrumb />

        <main id="main-content" className="relative z-10 pt-4" role="main">
          <section className="container mx-auto px-4 py-16 max-w-4xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Terms</h1>
            <p className="text-lg text-muted-foreground mb-10">Effective 24 July 2026.</p>

            <div className="space-y-6 text-base leading-relaxed">
              <h2 className="text-2xl font-semibold mt-8">What this site is</h2>
              <p>DMT Code is a research project that collects and publishes reports of a visual phenomenon, alongside clinical trial records, a bibliography, and competing explanations for what the phenomenon might be. It takes no position on whether the phenomenon is real. Nothing here asserts that it is, and nothing here asserts that it is not.</p>

              <h2 className="text-2xl font-semibold mt-8">This is not medical advice</h2>
              <p>Nothing on this site is medical advice, therapeutic advice or legal advice. It is not intended to diagnose, treat, cure or prevent anything. DMT is a controlled substance in many countries. This site does not encourage or condone the use of any illegal substance, does not provide sourcing information, and does not provide dosing guidance. Requests for any of those will not receive a reply. Speak to a qualified clinician about anything to do with your health, and check your own local law.</p>
              <p>You must be 18 or older to use this site.</p>

              <h2 className="text-2xl font-semibold mt-8">Your account</h2>
              <p>An account is optional. You get an automatically generated pseudonym, and you are welcome to keep it. Keep your password to yourself. Tell us at info@dmtcode.com if you think someone else is using your account.</p>

              <h2 className="text-2xl font-semibold mt-8">What you contribute, and how it is licensed</h2>
              <p>This is the most important section on this page, so it is written plainly.</p>
              <p>When you submit a symbol, a theory or an event, and it is published on this site, you are giving us permission to publish it on this site and to include it in our open data export at /data.json. That export is licensed under Creative Commons Attribution 4.0. In practice this means that anyone, including companies that train AI systems, may copy and reuse the content you contributed as long as they credit DMT Code.</p>
              <p>This is deliberate rather than incidental. The only thing that makes a convergence dataset worth anything is that other people can check it, and that requires them to be able to hold a copy.</p>
              <p>What this does not include: your email address, and your assessment responses, neither of which are ever published or exported.</p>
              <p>You keep ownership of what you contribute. You are giving us a licence, not signing it away.</p>
              <p>You can ask us to withdraw a contribution at any time by writing to info@dmtcode.com. We will remove it from the site and from the next export. We cannot retrieve copies that other people have already taken, which is the nature of an open licence.</p>
              <p>Only submit material that is yours to submit.</p>

              <h2 className="text-2xl font-semibold mt-8">Moderation</h2>
              <p>Symbols you draw and submit appear in the public registry immediately. There is no queue in front of them. Administrators then have 72 hours from publication to review a submission and deny it. A denied submission is hidden rather than deleted, so a record of what was submitted survives. After that window it stands, unless it is later reported and found to break the rules below.</p>
              <p>Events, retreats, clinical trial records and theories work the other way around. Those are reviewed before they appear.</p>
              <p>Placement in the registry is set by readers, not by us. Anyone signed in can mark a symbol as not matching what they saw. When a symbol carries more of those marks than recognitions, it sorts to the bottom of the browse list. Voting moves a symbol. It never removes one.</p>
              <p>We remove: requests for sourcing, dosing instructions, anything that identifies another person without their consent, spam, and reports we have reason to believe were invented. That last one matters more here than it would elsewhere. A dataset of reported experiences is only worth reading if the reports are real. Submitting one that is not is the one thing that damages this project irreparably.</p>

              <h2 className="text-2xl font-semibold mt-8">Buying equipment</h2>
              <p>Equipment is sold through our Shopify store, and Shopify's own terms and refund handling apply to the purchase itself. Some links to third party products are affiliate links. Our /disclosure page names them.</p>
              <p>Equipment listed here is ordinary optical and wellness gear. We do not sell, source or explain how to obtain any controlled substance.</p>

              <h2 className="text-2xl font-semibold mt-8">Accuracy</h2>
              <p>We correct errors publicly rather than quietly. Where a record turns out to be wrong or unverifiable, we hide it and say so. Where a citation is wrong, we fix it. If you find something wrong, tell us at info@dmtcode.com and we would rather hear it than not.</p>

              <h2 className="text-2xl font-semibold mt-8">No warranty</h2>
              <p>This site is provided as it is. We do not promise it will be available, complete or free of errors. We do not promise that the phenomenon described here is real, and we say so throughout the site. Decisions you make about your own health and your own conduct are yours.</p>

              <h2 className="text-2xl font-semibold mt-8">Changes</h2>
              <p>If we change these terms we will change the date at the top.</p>

              <p>Questions: info@dmtcode.com</p>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default Terms;
