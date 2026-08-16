import { useState, useEffect } from "react";
import { Menu, X, ChevronDown, FlaskConical, Sparkles, SunMedium, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CartDrawer } from "./CartDrawer";
import { useCartStore } from "@/stores/cartStore";
import { useModeStore } from "@/stores/modeStore";
import { useThemeStore } from "@/stores/themeStore";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useLocation } from "react-router-dom";
import { Logo } from "./Logo";
import { ModeToggle } from "./ModeToggle";
import { ThemeToggle } from "./ThemeToggle";
import { MegaMenu } from "./MegaMenu";
import { UserDropdown } from "./UserDropdown";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuthTracking } from "@/hooks/useAuthTracking";
import { useLocale, localePath } from "@/i18n/LocaleProvider";
import { LanguageSwitcher } from "./LanguageSwitcher";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

export const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userHandle, setUserHandle] = useState<string | null>(null);
  const [avatarSeed, setAvatarSeed] = useState<string | null>(null);
  const [openSection, setOpenSection] = useState<string | null>(null);
  const itemCount = useCartStore((state) => state.items.length);
  const { mode, setMode } = useModeStore();
  const { resolvedTheme, setTheme } = useThemeStore();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const locale = useLocale();
  // Header navigation must keep a visitor inside the locale they arrived in.
  const lp = (path: string) => localePath(locale, path);
  const { trackLogout } = useAuthTracking();

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
        .select('handle, avatar_seed')
        .eq('id', session.user.id)
        .single();
      setUserHandle(profile?.handle || 'Explorer');
      setAvatarSeed(profile?.avatar_seed || session.user.id);
    } else {
      setUserHandle(null);
      setAvatarSeed(null);
    }
  };

  const handleSignOut = async () => {
    trackLogout();
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    setUserHandle(null);
    setAvatarSeed(null);
    navigate(lp('/'));
  };

  const handleNavigation = (path: string) => {
    navigate(lp(path));
    setIsOpen(false);
    setOpenSection(null);
  };

  const goToAuth = () => {
    const here = location.pathname + location.search;
    navigate(
      location.pathname === lp('/auth')
        ? lp('/auth')
        : `${lp('/auth')}?returnTo=${encodeURIComponent(here)}`,
    );
    setIsOpen(false);
    setOpenSection(null);
  };

  const researchItems = [
    { path: '/articles', label: 'Articles' },
    { path: '/registry', label: 'Symbol Registry' },
    { path: '/evidence-map', label: 'Evidence Map' },
    { path: '/timeline', label: 'Chronology' },
    { path: '/trials', label: 'Clinical Trials' },
    { path: '/bibliography', label: 'Bibliography' },
    { path: '/methods', label: 'Methods' },
    { path: '/critiques', label: 'Critiques' },
    { path: '/theories', label: 'Open Theories' },
  ];

  const explorerItems = [
    { path: '/events', label: 'Events & Retreats' },
    { path: '/retreats', label: 'Retreat centers' },
    { path: '/leaderboard', label: 'Community' },
    { path: '/co-witnesses', label: 'Co-witness wall' },
  ];


  const resourceItems = [
    { path: '/prepare', label: 'Kits' },
    { path: '/protocol-guide', label: 'Protocol Guide' },
    { path: '/protocols', label: 'Protocols' },
    { path: '/assess', label: 'Assessment' },
    { path: '/faq', label: 'FAQ' },
    { path: '/glossary', label: 'Glossary' },
    { path: '/null-reports', label: 'Null Reports' },
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
            <div className="flex items-center gap-2 lg:gap-8">
              {/* Logo */}
              <button
                onClick={() => handleNavigation("/")}
                className="cursor-pointer bg-transparent border-none hover:opacity-80 transition-opacity"
                aria-label="DMT Code Project Home"
              >
                <Logo size={isMobile ? "sm" : "md"} />
              </button>
              
              {/* Desktop Mega Menu */}
              <MegaMenu />
            </div>

            <div className="hidden lg:flex items-center gap-3">
              <LanguageSwitcher />
              <ModeToggle />
              <ThemeToggle />
              <CartDrawer />
              {isAuthenticated ? (
                <UserDropdown 
                  handle={userHandle} 
                  avatarSeed={avatarSeed}
                  onSignOut={() => {
                    setIsAuthenticated(false);
                    setUserHandle(null);
                    setAvatarSeed(null);
                  }}
                />
              ) : (
                <Button 
                  onClick={goToAuth} 
                  size="sm"
                  className="rounded-full px-4 hover:shadow-[0_0_15px_rgba(196,30,58,0.3)] transition-all min-h-[44px]"
                >
                  Sign In
                </Button>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="flex items-center gap-1 lg:hidden">
              <ModeToggle />
              <ThemeToggle />
              <CartDrawer />
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
          <div className="lg:hidden bg-background/95 backdrop-blur-xl border-t border-border/50 max-h-[80vh] overflow-y-auto">
            <div className="px-4 pt-2 pb-4 space-y-1">
              <LanguageSwitcher className="px-2 pb-1" />

              {/* Home */}
              <button
                onClick={() => handleNavigation('/')}
                className={`block w-full text-left px-4 py-3 min-h-[44px] text-base rounded-lg transition-colors ${
                  location.pathname === lp('/')
                    ? 'text-primary bg-primary/10'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                }`}
              >
                Home
              </button>

              {/* Research Section */}
              <Collapsible open={openSection === 'research'} onOpenChange={() => setOpenSection(openSection === 'research' ? null : 'research')}>
                <CollapsibleTrigger className="flex items-center justify-between w-full px-4 py-3 min-h-[44px] text-base rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50">
                  <span>Research</span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${openSection === 'research' ? 'rotate-180' : ''}`} />
                </CollapsibleTrigger>
                <CollapsibleContent className="pl-4 space-y-1">
                  {researchItems.map((item) => (
                    <button
                      key={item.path}
                      onClick={() => handleNavigation(item.path)}
                      className={`block w-full text-left px-4 py-2 min-h-[40px] text-sm rounded-lg transition-colors ${
                        location.pathname === lp(item.path)
                          ? 'text-primary bg-primary/10'
                          : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </CollapsibleContent>
              </Collapsible>

              {/* Explorer Section */}
              <Collapsible open={openSection === 'explorer'} onOpenChange={() => setOpenSection(openSection === 'explorer' ? null : 'explorer')}>
                <CollapsibleTrigger className="flex items-center justify-between w-full px-4 py-3 min-h-[44px] text-base rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50">
                  <span>Explorer</span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${openSection === 'explorer' ? 'rotate-180' : ''}`} />
                </CollapsibleTrigger>
                <CollapsibleContent className="pl-4 space-y-1">
                  {explorerItems.map((item) => (
                    <button
                      key={item.path}
                      onClick={() => handleNavigation(item.path)}
                      className={`block w-full text-left px-4 py-2 min-h-[40px] text-sm rounded-lg transition-colors ${
                        location.pathname === lp(item.path)
                          ? 'text-primary bg-primary/10'
                          : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </CollapsibleContent>
              </Collapsible>

              {/* Resources Section */}
              <Collapsible open={openSection === 'resources'} onOpenChange={() => setOpenSection(openSection === 'resources' ? null : 'resources')}>
                <CollapsibleTrigger className="flex items-center justify-between w-full px-4 py-3 min-h-[44px] text-base rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50">
                  <span>Resources</span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${openSection === 'resources' ? 'rotate-180' : ''}`} />
                </CollapsibleTrigger>
                <CollapsibleContent className="pl-4 space-y-1">
                  {resourceItems.map((item) => (
                    <button
                      key={item.path}
                      onClick={() => handleNavigation(item.path)}
                      className={`block w-full text-left px-4 py-2 min-h-[40px] text-sm rounded-lg transition-colors ${
                        location.pathname === lp(item.path)
                          ? 'text-primary bg-primary/10'
                          : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </CollapsibleContent>
              </Collapsible>

              {/* Kits */}
              <button
                onClick={() => handleNavigation('/prepare')}
                className={`block w-full text-left px-4 py-3 min-h-[44px] text-base rounded-lg transition-colors ${
                  location.pathname === lp('/prepare')
                    ? 'text-primary bg-primary/10'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                }`}
              >
                Kits
              </button>

              {/* Text labels for the header icon buttons, which are icon only on mobile */}
              <div className="pt-3 mt-2 border-t border-border/50 space-y-1">
                <p className="px-4 py-1 text-xs uppercase tracking-widest text-muted-foreground/70">
                  Display and cart
                </p>
                <button
                  onClick={() => { setMode('research'); }}
                  className="flex items-center gap-3 w-full text-left px-4 py-3 min-h-[44px] text-base rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                >
                  <FlaskConical className="h-4 w-4" aria-hidden="true" />
                  Research mode
                </button>
                <button
                  onClick={() => { setMode('explorer'); }}
                  className="flex items-center gap-3 w-full text-left px-4 py-3 min-h-[44px] text-base rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                >
                  <Sparkles className="h-4 w-4" aria-hidden="true" />
                  Explorer mode
                </button>
                <button
                  onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
                  disabled={mode === 'research'}
                  className="flex items-center gap-3 w-full text-left px-4 py-3 min-h-[44px] text-base rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 disabled:opacity-50"
                >
                  <SunMedium className="h-4 w-4" aria-hidden="true" />
                  {mode === 'research' ? 'Light mode locked in Research mode' : 'Switch light or dark mode'}
                </button>
                <p className="flex items-center gap-3 px-4 py-2 text-sm text-muted-foreground">
                  <ShoppingCart className="h-4 w-4" aria-hidden="true" />
                  Cart: {itemCount} item{itemCount === 1 ? '' : 's'}
                </p>
              </div>

              {/* About */}
              <button
                onClick={() => handleNavigation('/about')}
                className={`block w-full text-left px-4 py-3 min-h-[44px] text-base rounded-lg transition-colors ${
                  location.pathname === lp('/about')
                    ? 'text-primary bg-primary/10'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                }`}
              >
                About
              </button>

              {/* Auth Section */}
              <div className="pt-4 border-t border-border/50 mt-4">
                {isAuthenticated ? (
                  <>
                    <Button onClick={() => handleNavigation('/dashboard')} variant="ghost" size="sm" className="w-full justify-start min-h-[44px]">Dashboard</Button>
                    <Button onClick={() => handleNavigation('/profile')} variant="ghost" size="sm" className="w-full justify-start min-h-[44px]">Profile</Button>
                    <Button onClick={() => handleNavigation('/my-symbols')} variant="ghost" size="sm" className="w-full justify-start min-h-[44px]">My Symbols</Button>
                    <Button onClick={handleSignOut} variant="outline" size="sm" className="w-full mt-2 min-h-[44px]">Sign Out</Button>
                  </>
                ) : (
                  <Button onClick={goToAuth} className="w-full rounded-full min-h-[44px] hover:shadow-[0_0_15px_rgba(196,30,58,0.3)] transition-all">Sign In</Button>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>
    </>
  );
};
