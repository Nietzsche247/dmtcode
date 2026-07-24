import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ArrowRight } from 'lucide-react';

type LatestArticle = {
  slug: string;
  title: string;
  dek: string;
};

// Compact home section. Renders nothing when no published article exists.
export const LatestArticle = () => {
  const [article, setArticle] = useState<LatestArticle | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('articles')
        .select('slug,title,dek')
        .eq('is_published', true)
        .order('published_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (cancelled) return;
      if (data && data.slug) setArticle(data as LatestArticle);
      setReady(true);
    })();
    return () => { cancelled = true; };
  }, []);

  if (!ready || !article) return null;

  return (
    <section className="container mx-auto px-4 py-16 max-w-4xl border-t border-border/20">
      <p className="font-montserrat font-light italic text-muted-foreground text-lg tracking-wide mb-4">
        Latest article
      </p>
      <div className="p-6 md:p-8 rounded-2xl bg-card/50 border border-border/40">
        <h2 className="text-2xl md:text-3xl font-bold mb-3">
          <Link
            to={`/articles/${article.slug}`}
            className="text-foreground hover:text-primary transition-colors"
          >
            {article.title}
          </Link>
        </h2>
        <p className="text-muted-foreground leading-relaxed mb-4">{article.dek}</p>
        <Link
          to="/articles"
          className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
        >
          Read all articles
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
};
