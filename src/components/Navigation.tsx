import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NavLink } from "./NavLink";
import { CartDrawer } from "./CartDrawer";
import { useCartStore } from "@/stores/cartStore";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useLocation } from "react-router-dom";
import { Logo } from "./Logo";
import { useIsMobile } from "@/hooks/use-mobile";

export const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const itemCount = useCartStore((state) => state.items.length);
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();

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

  const navItems = [
    { path: '/', label: 'Home' },
    { path: '/research', label: 'Research' },
    { path: '/tools', label: 'Tools' },
    { path: '/registry', label: 'Registry' },
    { path: '/events', label: 'Events' },
    { path: '/evidence-map', label: 'Evidence' },
    { path: '/about', label: 'About' },
  ];

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? "bg-background/80 backdrop-blur-xl border-b border-border/50"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              {/* Logo */}
              <button
                onClick={() => handleNavigation("/")}
                className="cursor-pointer bg-transparent border-none hover:opacity-80 transition-opacity"
                aria-label="DMT Code Project Home"
              >
                <Logo size={isMobile ? "sm" : "md"} />
              </button>
              
              {/* Desktop nav links */}
              <div className="hidden md:flex items-center gap-1">
                {navItems.map((item) => (
                  <button
                    key={item.path}
                    onClick={() => handleNavigation(item.path)}
                    className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      location.pathname === item.path
                        ? 'text-primary bg-primary/10'
                        : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="hidden md:flex items-center gap-3">
              <CartDrawer />
              {isAuthenticated ? (
                <>
                  <span className="text-sm text-muted-foreground">Hi, {userName}</span>
                  <Button onClick={() => navigate('/profile')} variant="ghost" size="sm">Profile</Button>
                  <Button onClick={() => navigate('/admin')} variant="ghost" size="sm">Admin</Button>
                  <Button onClick={handleSignOut} variant="outline" size="sm">Sign Out</Button>
                </>
              ) : (
                <Button 
                  onClick={() => navigate('/auth')} 
                  size="sm"
                  className="rounded-full px-4"
                >
                  Sign In
                </Button>
              )}
            </div>

            <div className="md:hidden">
              <button 
                onClick={() => setIsOpen(!isOpen)} 
                className="text-foreground hover:text-primary transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="Toggle navigation menu"
                aria-expanded={isOpen}
              >
                {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {isOpen && (
          <div className="md:hidden bg-background/95 backdrop-blur-xl border-t border-border/50">
            <div className="px-4 pt-2 pb-4 space-y-1">
              {navItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => handleNavigation(item.path)}
                  className={`block w-full text-left px-4 py-3 min-h-[44px] min-w-[44px] text-base rounded-lg transition-colors ${
                    location.pathname === item.path
                      ? 'text-primary bg-primary/10'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                  }`}
                >
                  {item.label}
                </button>
              ))}
              {/* Primary CTAs at end of group */}
              <div className="pt-4 border-t border-border/50 mt-4 space-y-2">
                <Button 
                  onClick={() => handleNavigation('/registry')} 
                  className="w-full rounded-full min-h-[44px] btn-lickable border-beam"
                >
                  Browse Registry
                </Button>
                <Button 
                  onClick={() => handleNavigation('/tools')} 
                  variant="outline"
                  className="w-full rounded-full min-h-[44px]"
                >
                  View Tools
                </Button>
              </div>
              <div className="pt-4 border-t border-border/50 mt-4">
                {isAuthenticated ? (
                  <>
                    <Button onClick={() => handleNavigation('/profile')} variant="ghost" size="sm" className="w-full justify-start min-h-[44px]">Profile</Button>
                    <Button onClick={() => handleNavigation('/admin')} variant="ghost" size="sm" className="w-full justify-start min-h-[44px]">Admin</Button>
                    <Button onClick={handleSignOut} variant="outline" size="sm" className="w-full mt-2 min-h-[44px]">Sign Out</Button>
                  </>
                ) : (
                  <Button onClick={() => handleNavigation('/auth')} className="w-full rounded-full min-h-[44px]">Sign In</Button>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>
    </>
  );
};
