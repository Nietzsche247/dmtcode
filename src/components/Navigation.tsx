import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Menu, X } from 'lucide-react';
import { CartDrawer } from '@/components/CartDrawer';
import { useCartStore } from '@/stores/cartStore';

export const Navigation = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const items = useCartStore(state => state.items);
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setMobileMenuOpen(false);
    }
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
          </div>
        )}
      </div>
    </nav>
  );
};
