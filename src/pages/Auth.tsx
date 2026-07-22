import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { z } from "zod";
import { Session } from "@supabase/supabase-js";
import { useAuthTracking, AuthProvider } from "@/hooks/useAuthTracking";
import { Logo } from "@/components/Logo";
import { lovable } from "@/integrations/lovable/index";

const authSchema = z.object({
  email: z.string().trim().email({ message: "Invalid email address" }).max(255, { message: "Email must be less than 255 characters" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }).max(72, { message: "Password must be less than 72 characters" }),
});

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get('mode') === 'signup' ? 'signup' : 'login';
  const returnTo = searchParams.get('returnTo') || '/';
  
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>(defaultTab as 'login' | 'signup');
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  const { trackLogin, trackSignup } = useAuthTracking();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        if (session && event === 'SIGNED_IN') {
          // First-visit avatar toast (queued via sessionStorage so it survives navigate)
          sessionStorage.setItem('showAvatarToast', '1');
          const separator = returnTo.includes('?') ? '&' : '?';
          navigate(`${returnTo}${separator}authenticated=1`);
        } else if (session) {
          const separator = returnTo.includes('?') ? '&' : '?';
          navigate(`${returnTo}${separator}authenticated=1`);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        const separator = returnTo.includes('?') ? '&' : '?';
        navigate(`${returnTo}${separator}authenticated=1`);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, returnTo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const validated = authSchema.parse({ email, password });
      
      if (activeTab === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email: validated.email,
          password: validated.password,
        });

        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            toast.error("Invalid email or password");
          } else if (error.message.includes("Email not confirmed")) {
            toast.error("Please confirm your email before logging in");
          } else {
            toast.error(error.message);
          }
          return;
        }

        trackLogin('email');
        toast.success("Logged in successfully!");
      } else {
        const redirectUrl = `${window.location.origin}${returnTo}`;
        
        const { error } = await supabase.auth.signUp({
          email: validated.email,
          password: validated.password,
          options: {
            emailRedirectTo: redirectUrl,
          },
        });

        if (error) {
          if (error.message.includes("User already registered")) {
            toast.error("This email is already registered. Please login instead.");
          } else {
            toast.error(error.message);
          }
          return;
        }

        trackSignup('email');
        toast.success("Account created! Check your email to confirm.");
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.issues[0].message);
      } else {
        toast.error("An unexpected error occurred");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthLogin = async (provider: 'google' | 'apple') => {
    setIsLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth(provider, {
        redirect_uri: `${window.location.origin}${returnTo}`,
      });
      if (result?.error) {
        toast.error(`Could not continue with ${provider}`, {
          description: 'Please try again or use another method.',
        });
        return;
      }
      if (result?.redirected) {
        return;
      }
      trackLogin(provider as AuthProvider);
    } catch (error) {
      toast.error('An unexpected error occurred', {
        description: 'Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[hsl(var(--background))] p-4">
      {/* Background gradient effect */}
      <div className="fixed inset-0 bg-gradient-to-br from-background via-background to-primary/5 pointer-events-none" />
      
      <div className="relative w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="flex justify-center">
          <button onClick={() => navigate('/')} className="hover:opacity-80 transition-opacity">
            <Logo size="md" />
          </button>
        </div>

        {/* Header */}
        <div className="text-center space-y-3">
          <h1 className="text-3xl md:text-4xl tracking-tight text-foreground" style={{ fontFamily: "'Fraunces', Georgia, serif", fontWeight: 500 }}>
            {activeTab === 'login' ? 'Welcome back' : 'Sign in to take part'}
          </h1>
          <p className="text-muted-foreground text-base leading-relaxed max-w-sm mx-auto" style={{ fontFamily: "'Hanken Grotesk', system-ui, sans-serif" }}>
            We give you an avatar, so your name stays yours. What you add joins everyone else's,
            and together, through a common recollection, we find out what is real.
          </p>
        </div>

        {/* OAuth Buttons */}
        <div className="space-y-3">
          <Button
            type="button"
            onClick={() => handleOAuthLogin('google')}
            disabled={isLoading}
            className="w-full h-12 bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 rounded-full font-medium transition-all hover:shadow-md min-h-[44px]"
          >
            <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </Button>

          <Button
            type="button"
            onClick={() => handleOAuthLogin('apple')}
            disabled={isLoading}
            className="w-full h-12 bg-black hover:bg-black/90 text-white rounded-full font-medium transition-all hover:shadow-md min-h-[44px]"
          >
            <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M16.365 1.43c0 1.14-.417 2.204-1.245 3.052-.831.85-2.06 1.5-3.104 1.42-.11-1.09.436-2.24 1.243-3.06.812-.826 2.108-1.47 3.106-1.412zM20.5 17.286c-.532 1.23-.782 1.78-1.47 2.87-.96 1.523-2.316 3.418-3.996 3.432-1.492.014-1.876-.977-3.902-.966-2.024.012-2.447 1.014-3.94.99-1.68-.03-2.964-1.79-3.924-3.312-2.68-4.243-2.96-9.223-1.308-11.869 1.174-1.88 3.024-2.98 4.766-2.98 1.773 0 2.887.978 4.354.978 1.42 0 2.284-.98 4.335-.98 1.55 0 3.194.848 4.365 2.313-3.837 2.104-3.213 7.6.72 9.524z"/>
            </svg>
            Continue with Apple
          </Button>
        </div>


        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <Separator className="w-full" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-4 text-muted-foreground font-light">
              Or continue with email
            </span>
          </div>
        </div>

        {/* Email Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-foreground">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
              className="h-12 rounded-lg border-border bg-secondary/30 focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium text-foreground">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
              className="h-12 rounded-lg border-border bg-secondary/30 focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            />
            {activeTab === 'signup' && (
              <p className="text-xs text-muted-foreground font-light">
                Password must be at least 6 characters
              </p>
            )}
          </div>
          
          <Button 
            type="submit" 
            disabled={isLoading}
            className="w-full h-12 rounded-full font-medium bg-primary hover:bg-primary/90 text-primary-foreground transition-all hover:shadow-[0_0_20px_rgba(196,30,58,0.3)] min-h-[44px]"
          >
            {isLoading 
              ? (activeTab === 'login' ? "Signing in..." : "Creating account...") 
              : (activeTab === 'login' ? "Sign In" : "Create Account")}
          </Button>
        </form>

        {/* Toggle Login/Signup */}
        <p className="text-center text-sm text-muted-foreground font-light">
          {activeTab === 'login' ? (
            <>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => setActiveTab('signup')}
                className="text-primary hover:underline font-medium"
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => setActiveTab('login')}
                className="text-primary hover:underline font-medium"
              >
                Sign in
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
};

export default Auth;