import { useState, useEffect } from "react";
import { Menu, X, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NavLink } from "./NavLink";
import { CartDrawer } from "./CartDrawer";
import { useCartStore } from "@/stores/cartStore";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useLocation } from "react-router-dom";

export const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const itemCount = useCartStore((state) => state.items.length);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
    if (session?.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', session.user.id)
        .single();
      setUserName(profile?.display_name || session.user.email?.split('@')[0] || 'User');
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    setIsOpen(false);
  };

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? "bg-background/95 backdrop-blur-md border-b border-border shadow-lg"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <NavLink to="/" className="text-2xl font-bold glow-text">
                DMT Code
              </NavLink>
              <div className="hidden md:flex items-center space-x-6">
                <button onClick={() => handleNavigation('/')} className={`text-sm hover:text-primary transition-colors ${location.pathname === '/' ? 'text-primary' : ''}`}>Home</button>
                <button onClick={() => handleNavigation('/research')} className={`text-sm hover:text-primary transition-colors ${location.pathname === '/research' ? 'text-primary' : ''}`}>Research</button>
                <button onClick={() => handleNavigation('/tools')} className={`text-sm hover:text-primary transition-colors ${location.pathname === '/tools' ? 'text-primary' : ''}`}>Tools</button>
                <button onClick={() => handleNavigation('/registry')} className={`text-sm hover:text-primary transition-colors ${location.pathname === '/registry' ? 'text-primary' : ''}`}>Glyph Registry</button>
                <button onClick={() => handleNavigation('/waitlist')} className={`text-sm hover:text-primary transition-colors ${location.pathname === '/waitlist' ? 'text-primary' : ''}`}>Join Waitlist</button>
                <button onClick={() => handleNavigation('/evidence-map')} className={`text-sm hover:text-primary transition-colors ${location.pathname === '/evidence-map' ? 'text-primary' : ''}`}>Evidence</button>
                <button onClick={() => handleNavigation('/about')} className={`text-sm hover:text-primary transition-colors ${location.pathname === '/about' ? 'text-primary' : ''}`}>About</button>
              </div>
            </div>

            <div className="hidden md:flex items-center space-x-4">
              <CartDrawer />
              {isAuthenticated ? (
                <>
                  <span className="text-sm text-muted-foreground">Hi, {userName}</span>
                  <Button onClick={() => navigate('/profile')} variant="ghost" size="sm">Profile</Button>
                  <Button onClick={() => navigate('/admin')} variant="ghost" size="sm">Admin</Button>
                  <Button onClick={handleSignOut} variant="outline" size="sm">Sign Out</Button>
                </>
              ) : (
                <NavLink to="/auth"><Button variant="default" size="sm">Sign In</Button></NavLink>
              )}
            </div>

            <div className="md:hidden">
              <button onClick={() => setIsOpen(!isOpen)} className="text-foreground hover:text-primary transition-colors">
                {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {isOpen && (
          <div className="md:hidden bg-background/95 backdrop-blur-md border-t border-border">
            <div className="px-4 pt-2 pb-3 space-y-1">
              <button onClick={() => handleNavigation('/')} className="block w-full text-left px-3 py-2 text-base hover:text-primary transition-colors">Home</button>
              <button onClick={() => handleNavigation('/research')} className="block w-full text-left px-3 py-2 text-base hover:text-primary transition-colors">Research</button>
              <button onClick={() => handleNavigation('/tools')} className="block w-full text-left px-3 py-2 text-base hover:text-primary transition-colors">Tools</button>
              <button onClick={() => handleNavigation('/registry')} className="block w-full text-left px-3 py-2 text-base hover:text-primary transition-colors">Glyph Registry</button>
              <button onClick={() => handleNavigation('/waitlist')} className="block w-full text-left px-3 py-2 text-base hover:text-primary transition-colors">Join Waitlist</button>
              <button onClick={() => handleNavigation('/evidence-map')} className="block w-full text-left px-3 py-2 text-base hover:text-primary transition-colors">Evidence Map</button>
              <button onClick={() => handleNavigation('/methods')} className="block w-full text-left px-3 py-2 text-base hover:text-primary transition-colors">Methods</button>
              <button onClick={() => handleNavigation('/critiques')} className="block w-full text-left px-3 py-2 text-base hover:text-primary transition-colors">Critiques</button>
              <button onClick={() => handleNavigation('/about')} className="block w-full text-left px-3 py-2 text-base hover:text-primary transition-colors">About</button>
              {isAuthenticated ? (
                <>
                  <Button onClick={() => handleNavigation('/profile')} variant="ghost" size="sm" className="w-full mt-2">Profile</Button>
                  <Button onClick={() => handleNavigation('/admin')} variant="ghost" size="sm" className="w-full mt-2">Admin</Button>
                  <Button onClick={handleSignOut} variant="outline" size="sm" className="w-full mt-2">Sign Out</Button>
                </>
              ) : (
                <NavLink to="/auth" className="block mt-2"><Button variant="default" size="sm" className="w-full">Sign In</Button></NavLink>
              )}
            </div>
          </div>
        )}
      </nav>
    </>
  );
};
