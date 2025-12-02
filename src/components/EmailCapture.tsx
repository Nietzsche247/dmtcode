import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export const EmailCapture = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast.success('Welcome to the community!');
    setEmail('');
    setIsSubmitting(false);
  };

  return (
    <section className="relative py-24 px-4 border-t border-border/30">
      <div className="max-w-2xl mx-auto text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-primary/10 rounded-2xl mb-6">
          <Mail className="w-7 h-7 text-primary" />
        </div>
        
        <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-4">
          Join 2,000+ Replicators
        </h2>
        
        <p className="text-muted-foreground font-light mb-8 max-w-lg mx-auto">
          Get protocol updates, new glyph discoveries, and research announcements.
        </p>

        <form onSubmit={handleSubmit} className="max-w-md mx-auto">
          <div className="flex gap-3">
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="flex-1 h-12 rounded-xl bg-secondary/30 border-border/50 focus:border-primary"
            />
            <Button 
              type="submit" 
              size="lg"
              disabled={isSubmitting}
              className="h-12 px-6 rounded-xl btn-lickable"
            >
              {isSubmitting ? '...' : <ArrowRight className="w-5 h-5" />}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            No spam. Unsubscribe anytime.
          </p>
        </form>
      </div>
    </section>
  );
};
