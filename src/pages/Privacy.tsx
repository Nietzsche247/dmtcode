import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Helmet } from 'react-helmet';
import { Breadcrumb } from '@/components/Breadcrumb';

const Privacy = () => {
  return (
    <>
      <Helmet>
        <title>Privacy | DMT Code</title>
        <meta name="description" content="What DMT Code collects, who processes it, and what becomes public." />
        <link rel="canonical" href="https://dmtcode.com/privacy" />
        <meta name="robots" content="index, follow" />
        <meta property="og:title" content="Privacy | DMT Code" />
        <meta property="og:description" content="What DMT Code collects, who processes it, and what becomes public." />
        <meta property="og:url" content="https://dmtcode.com/privacy" />
        <meta property="og:type" content="website" />
      </Helmet>

      <div className="relative min-h-screen bg-background">
        <Navigation />
        <Breadcrumb />

        <main id="main-content" className="relative z-10 pt-4" role="main">
          <section className="container mx-auto px-4 py-16 max-w-4xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Privacy</h1>
            <p className="text-lg text-muted-foreground mb-10">Effective 28 August 2026.</p>

            <div className="space-y-6 text-base leading-relaxed">
              <p>This page describes what this site collects, where it goes, and what becomes public. It was written by reading our own code and database rather than from a template, so it describes what actually happens here.</p>

              <h2 className="text-2xl font-semibold mt-8">The short version</h2>
              <p>You can read almost everything on this site without an account and without telling us anything. An account is not needed to browse. It is needed to seal a memory or submit a record. If you make an account and contribute, the content you contribute is meant to become public, because a convergence dataset that nobody can check is worth nothing. Your identity is not part of what becomes public.</p>

              <h2 className="text-2xl font-semibold mt-8">What we collect</h2>
              <p><strong>If you create an account.</strong> Your email address and a password, or a Google or Apple sign in if you choose that instead. Passwords are handled by our authentication provider and never reach us in readable form. On sign up we generate a pseudonym for you automatically, in the form of a two word handle. You can change the display name attached to it. We do not ask for your real name at any point, except at checkout, where Meridian Optics Lab receives the shipping details you enter.</p>
              <p><strong>If you submit a symbol.</strong> The image you draw or upload, your written description, the tags you choose, and, if you fill them in, the route of administration and approximate dose. If you record a voice note, we store the audio, and today it is published with the symbol. A voice can identify a person in a way a drawing cannot, so raw audio is moving to private by default with a separate, off by default option to publish it. Until that ships, treat a voice note as public.</p>
              <p><strong>If you complete an assessment.</strong> Your responses to the PHQ-9, GAD-7, MEQ-4 and CEQ-7 questionnaires, and your before and after mood ratings. These are mental health questions and we treat the answers accordingly. They are stored in a private area that is not readable by other visitors. If you upload imaging, that is stored in the same private area.</p>
              <p><strong>If you join a list.</strong> For the general waiting list and for the clinical trial watch list, your email address, and nothing else.</p>
              <p><strong>If you volunteer.</strong> The email address, handle, roles, experience level, languages, skills and motivation you enter on the volunteer form, and whether you consented to being contacted.</p>
              <p><strong>If you buy something.</strong> Nothing about the payment. Checkout happens on Shopify's own systems. Card numbers never touch this site or our database. Kits are sold and shipped by Meridian Optics Lab, the store of record operated by the same owner as DMT Code Project; its refund, shipping and terms policies govern purchases.</p>

              <h2 className="text-2xl font-semibold mt-8">What we deliberately do not collect</h2>
              <p>We do not log the IP addresses of visitors. Our server side logging records only automated crawlers, and for those it records only the page requested, the crawler's name, and its user agent string. There is no visitor identifier, no fingerprint and no IP address in that log.</p>
              <p>We do not ask for your real name, your date of birth, your address or your phone number anywhere on this site, except at checkout, where Meridian Optics Lab receives the shipping details you enter.</p>

              <h2 className="text-2xl font-semibold mt-8">Who processes data for us</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Supabase, for the database, sign in and file storage.</li>
                <li>Netlify, for hosting and for the code that runs at the edge.</li>
                <li>Resend, for the emails we send you.</li>
                <li>Shopify, for the shop and for checkout.</li>
                <li>Google Analytics, for measuring which pages get read.</li>
                <li>Google Fonts and Zenodo, which see a request from your browser when a page loads a font or the citation badge in our footer.</li>
              </ul>

              <h2 className="text-2xl font-semibold mt-8">What becomes public</h2>
              <p>Handles and display names are readable by anyone. That is deliberate, because contributions are attributed to a handle.</p>
              <p>A symbol you submit is published immediately, before any review: the image, the description, the tags, the conditions you chose to record, and the recognition and non-match counts. Administrators have 72 hours to review it and can hide it. Theories, events, retreats and trial records you submit are reviewed first and become public once approved, in full.</p>
              <p>Your email address never becomes public. Your assessment answers never become public. Your account identifier is not displayed anywhere on the site.</p>

              <h2 className="text-2xl font-semibold mt-8">The open data export</h2>
              <p>We publish an export of the site at /data.json under a Creative Commons Attribution 4.0 licence, and we explicitly invite AI crawlers to read it. This is the point of the project. Data that cannot be independently checked is not evidence.</p>
              <p>The export includes every published symbol submission whose contributor granted publication consent, carrying its visibility, moderation and evidence status fields, plus approved theories and approved events. For a symbol that means the description, the tags, the recognition and non-match counts, the date and the web address of the image. It does not include your email address, and it does not include raw voice audio.</p>
              <p>If you would rather your contribution were not in that export, tell us and we will take it out of the next one. We cannot recall copies that other people have already downloaded, which is what a Creative Commons licence means in practice, so please decide before you submit rather than after.</p>

              <h2 className="text-2xl font-semibold mt-8">Cookies and analytics</h2>
              <p>Google Analytics loads on every page of this site and sets cookies in your browser. We see aggregate reports: which pages were read, roughly where in the world readers were, which pages were read next. We do not use it to build a profile of you and we do not sell anything to advertisers.</p>
              <p>It currently loads without asking you first. If you would rather not be measured, you can install Google's own opt out browser add on, or block analytics cookies in your browser settings, or use a browser that blocks them by default. Both work on this site and neither breaks anything.</p>

              <h2 className="text-2xl font-semibold mt-8">Where things are stored</h2>
              <p>Assessment responses and any imaging you upload are held in a private store that requires authentication to read. Symbol images and drawings are held in a public store, because they are published on the site. Voice notes are currently in the same public store; see the voice note paragraph above for where that is going.</p>

              <h2 className="text-2xl font-semibold mt-8">Getting your data, or getting rid of it</h2>
              <p>Write to info@dmtcode.com and ask. You can ask us for a copy of what we hold about you, for a correction, or for deletion. If you ask us to delete your account we will remove the account and the personal details attached to it.</p>
              <p>For a published contribution, tell us whether you want it removed entirely or kept and detached from your account. We will do either. Where we remove a research record rather than delete it, we hide it from the site rather than destroying it, and we will tell you which we did.</p>

              <h2 className="text-2xl font-semibold mt-8">Children</h2>
              <p>This site is for adults. It is not intended for anyone under 18 and we do not knowingly collect anything from anyone under 18.</p>

              <h2 className="text-2xl font-semibold mt-8">Changes</h2>
              <p>If we change this page we will change the date at the top. Material changes will be noted on the page rather than made quietly.</p>

              <p>Questions: info@dmtcode.com</p>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default Privacy;
