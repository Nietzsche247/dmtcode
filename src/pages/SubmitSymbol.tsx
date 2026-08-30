import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Breadcrumb } from '@/components/Breadcrumb';
import { SubmissionWizard } from '@/components/submission/SubmissionWizard';
import { SignInToContribute } from '@/components/SignInToContribute';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  markCatalogueSeen,
  CATALOGUE_QUERY_FLAG,
  CATALOGUE_QUERY_VALUE,
} from '@/lib/catalogueExposure';

/**
 * Reading is open to everyone. Writing is not. Submitting a symbol requires an
 * account, because every submission carries a public avatar profile name, keeps
 * the contributor's email hidden, and feeds the leaderboard. An anonymous
 * submission could do none of those things.
 */
const SubmitSymbol = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [userId, setUserId] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  // Absorb the catalogue flag HERE, before the auth gate, not in the wizard.
  // Someone arriving from the symbol catalogue without an account is sent to
  // sign in and comes back on a fresh URL, so a flag that lived only in the
  // query string would be gone by the time the wizard mounts, and the exposure
  // it records is exactly the kind that must not be quietly lost. Persisting it
  // on this render means the round trip through /auth cannot erase it.
  useEffect(() => {
    if (searchParams.get(CATALOGUE_QUERY_FLAG) === CATALOGUE_QUERY_VALUE) {
      markCatalogueSeen();
    }
  }, [searchParams]);

  useEffect(() => {
    let cancelled = false;

    supabase.auth.getUser().then(({ data }) => {
      if (cancelled) return;
      setUserId(data.user?.id ?? null);
      setChecking(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null);
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

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
        <meta name="description" content="Draw and submit a visual symbol to the DMT Code registry. Browsing is open to everyone; submitting requires a free account so your work is credited to your profile." />
        <link rel="canonical" href="https://dmtcode.com/submit-symbol" />
        <meta name="robots" content="noindex, follow" />
      </Helmet>

      <Navigation />
      <Breadcrumb />

      <main id="main-content" role="main" className="min-h-screen pt-8 pb-16">
        <div className="max-w-4xl mx-auto px-4">
          {checking ? (
            <div className="flex justify-center py-24">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : userId ? (
            <SubmissionWizard />
          ) : (
            <SignInToContribute
              title="An account is needed to submit a symbol"
              body="Browsing the whole library is open to everyone. Submitting requires a free account: your email stays hidden, you get a public avatar profile name, and everything you contribute is credited to you and counted in the record."
            />
          )}
        </div>
      </main>

      <Footer />
    </>
  );
};

export default SubmitSymbol;
