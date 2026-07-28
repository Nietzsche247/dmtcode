import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, ArrowRight } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface EmailCaptureProps {
  source?: string;
  /**
   * Identifier of the specific product or bundle the visitor asked about,
   * taken from real route context (never invented). When present and it
   * matches a published bundle slug, the signup is recorded against that
   * record instead of the general waitlist.
   */
  productSlug?: string | null;
}

export const EmailCapture = ({ source = 'waitlist', productSlug = null }: EmailCaptureProps) => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const publishedSlugs = useRef<Set<string> | null>(null);

  useEffect(() => {
    if (!productSlug || publishedSlugs.current) return;
    let active = true;
    supabase
      .from('bundles')
      .select('slug')
      .eq('is_published', true)
      .then(({ data }) => {
        if (!active || !data) return;
        publishedSlugs.current = new Set(data.map((b) => b.slug));
      });
    return () => {
      active = false;
    };
  }, [productSlug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;

    setIsSubmitting(true);

    let slugs = publishedSlugs.current;
    if (productSlug && !slugs) {
      const { data } = await supabase.from('bundles').select('slug').eq('is_published', true);
      slugs = new Set((data ?? []).map((b) => b.slug));
      publishedSlugs.current = slugs;
    }

    const validSlug = productSlug && slugs?.has(productSlug) ? productSlug : null;

    const { error } = validSlug
      ? await supabase
          .from('product_signups')
          .insert({ email: trimmed, bundle_slug: validSlug })
      : await supabase
          .from('waitlist')
          .insert({ email: trimmed, source });

    setIsSubmitting(false);


    if (error) {
      if ((error as { code?: string }).code === '23505') {
        toast.success('You are already on the list.');
        setEmail('');
        return;
      }
      toast.error('Something went wrong. Please try again.');
      return;
    }

    toast.success('Thanks, you are on the list.');
    setEmail('');
  };

  return (
    <section className="relative py-24 px-4 border-t border-border/30">
      <div className="max-w-2xl mx-auto text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-primary/10 rounded-2xl mb-6">
          <Mail className="w-7 h-7 text-primary" />
        </div>
        
        <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-4">
          Join the replication effort
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
              maxLength={255}
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
