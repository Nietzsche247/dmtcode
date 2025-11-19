import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Menu, X, User, LogOut } from 'lucide-react';
import { CartDrawer } from '@/components/CartDrawer';
import { useCartStore } from '@/stores/cartStore';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Session } from '@supabase/supabase-js';
import { toast } from 'sonner';

export const Navigation = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const items = useCartStore(state => state.items);
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setMobileMenuOpen(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
    setMobileMenuOpen(false);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <button 
            onClick={() => scrollToSection('hero')}
            className="text-xl font-bold glow-text cursor-pointer"
          >
            DMT Code
          </button>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <button onClick={() => scrollToSection('explainer')} className="text-sm hover:text-primary transition-colors">
              How It Works
            </button>
            <button onClick={() => scrollToSection('research')} className="text-sm hover:text-primary transition-colors">
              Research
            </button>
            <button onClick={() => scrollToSection('theories')} className="text-sm hover:text-primary transition-colors">
              Theories
            </button>
            <button onClick={() => scrollToSection('codex')} className="text-sm hover:text-primary transition-colors">
              Codex
            </button>
            <button onClick={() => scrollToSection('shop')} className="text-sm hover:text-primary transition-colors">
              Shop
            </button>
            <CartDrawer />
            {session ? (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleLogout}
                className="gap-2"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            ) : (
              <Button 
                variant="default" 
                size="sm" 
                onClick={() => navigate('/auth')}
                className="gap-2"
              >
                <User className="h-4 w-4" />
                Login
              </Button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            <CartDrawer />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden pt-4 pb-2 space-y-2">
            <button onClick={() => scrollToSection('explainer')} className="block w-full text-left py-2 hover:text-primary transition-colors">
              How It Works
            </button>
            <button onClick={() => scrollToSection('research')} className="block w-full text-left py-2 hover:text-primary transition-colors">
              Research
            </button>
            <button onClick={() => scrollToSection('theories')} className="block w-full text-left py-2 hover:text-primary transition-colors">
              Theories
            </button>
            <button onClick={() => scrollToSection('codex')} className="block w-full text-left py-2 hover:text-primary transition-colors">
              Codex
            </button>
            <button onClick={() => scrollToSection('shop')} className="block w-full text-left py-2 hover:text-primary transition-colors">
              Shop
            </button>
            {session ? (
              <button 
                onClick={handleLogout}
                className="block w-full text-left py-2 hover:text-primary transition-colors"
              >
                Logout
              </button>
            ) : (
              <button 
                onClick={() => navigate('/auth')}
                className="block w-full text-left py-2 hover:text-primary transition-colors"
              >
                Login
              </button>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};
