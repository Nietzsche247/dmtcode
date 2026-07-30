import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Breadcrumb } from '@/components/Breadcrumb';
import { SubmissionWizard } from '@/components/submission/SubmissionWizard';
import { toast } from 'sonner';

/**
 * The drawing tool is open to anyone. No sign in, no account, no email is
 * required to draw a symbol and submit it. A signed in contributor still has
 * the submission attached to their account; a signed out visitor submits with
 * no contributor identity at all.
 */
const SubmitSymbol = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get('authenticated') === '1') {
      toast.success('Welcome back!', {
        description: 'Your submission will be attached to your account.',
      });
      searchParams.delete('authenticated');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  return (
    <>
      <Helmet>
        <title>Submit Symbol | DMT Code</title>
        <meta name="description" content="Draw and submit a visual symbol to the DMT Code registry. The drawing tool is open to anyone, with no account required." />
        <link rel="canonical" href="https://dmtcode.com/submit-symbol" />
        <meta name="robots" content="noindex, follow" />
      </Helmet>

      <Navigation />
      <Breadcrumb />

      <main id="main-content" role="main" className="min-h-screen pt-8 pb-16">
        <div className="max-w-4xl mx-auto px-4">
          <SubmissionWizard />
        </div>
      </main>

      <Footer />
    </>
  );
};

export default SubmitSymbol;
