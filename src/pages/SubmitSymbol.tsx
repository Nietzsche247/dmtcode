import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { supabase } from '@/integrations/supabase/client';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { SubmissionWizard } from '@/components/submission/SubmissionWizard';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const SubmitSymbol = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setIsAuthenticated(!!session);
        setIsLoading(false);
        
        // Auto-redirect unauthenticated users to login
        if (!session) {
          toast.info('Sign in required', {
            description: 'Please sign in to submit symbols to the registry.'
          });
          navigate('/auth?returnTo=/submit-symbol');
        }
      }
    );

    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
      setIsLoading(false);
      
      if (!session) {
        toast.info('Sign in required', {
          description: 'Please sign in to submit symbols to the registry.'
        });
        navigate('/auth?returnTo=/submit-symbol');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Show loading spinner while checking auth
  if (isLoading) {
    return (
      <>
        <Navigation />
        <main id="main-content" role="main" className="min-h-screen pt-24 pb-16">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </main>
        <Footer />
      </>
    );
  }

  // Will redirect if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      <Helmet>
        <title>Submit Symbol | DMT Code</title>
        <meta name="description" content="Draw and submit visual symbols to the DMT Code registry using our multi-step submission wizard." />
        <link rel="canonical" href="https://dmtcode.com/submit-symbol" />
      </Helmet>

      <Navigation />
      
      <main id="main-content" role="main" className="min-h-screen pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4">
          <SubmissionWizard />
        </div>
      </main>

      <Footer />
    </>
  );
};

export default SubmitSymbol;