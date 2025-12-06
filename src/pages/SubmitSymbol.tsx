import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { supabase } from '@/integrations/supabase/client';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { SubmissionWizard } from '@/components/submission/SubmissionWizard';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

const SubmitSymbol = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkAuth();
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setIsAuthenticated(!!session);
    setIsLoading(false);
  };

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
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : isAuthenticated ? (
            <SubmissionWizard />
          ) : (
            <div className="text-center py-20 space-y-6">
              <h1 className="text-3xl font-black tracking-tight">Sign In Required</h1>
              <p className="text-muted-foreground font-light max-w-md mx-auto">
                You need to be signed in to submit symbols to the registry. 
                Create an account to start contributing.
              </p>
              <div className="flex gap-3 justify-center">
                <Button variant="outline" onClick={() => navigate('/registry')}>
                  Browse Registry
                </Button>
                <Button onClick={() => navigate('/auth')}>
                  Sign In
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
};

export default SubmitSymbol;