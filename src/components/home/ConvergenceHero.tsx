import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { ArrowRight, Eye, PencilLine } from 'lucide-react';

interface TopSymbol {
  id: string;
  image_url: string;
  tags: string[] | null;
  wavelength: string | null;
  dose_level: string | null;
  surface_type: string | null;
  upvotes: number;
}

interface TopStrip {
  id: string;
  image_url: string;
  upvotes: number;
}

export const ConvergenceHero = () => {
  const navigate = useNavigate();
  const [featured, setFeatured] = useState<TopSymbol | null>(null);
  const [confirmCount, setConfirmCount] = useState<number>(0);
  const [totalApproved, setTotalApproved] = useState<number>(0);
  const [verifiedCount, setVerifiedCount] = useState<number>(0);
  const [strip, setStrip] = useState<TopStrip[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data: top } = await supabase
          .from('symbol_submissions')
          .select('id,image_url,tags,wavelength,dose_level,surface_type,upvotes')
          .eq('status', 'approved')
          .order('upvotes', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!cancelled && top) {
          setFeatured(top as TopSymbol);
          const { count } = await supabase
            .from('symbol_votes')
            .select('*', { count: 'exact', head: true })
            .eq('symbol_id', top.id)
            .eq('vote_type', 'seen_it');
          setConfirmCount(count ?? top.upvotes ?? 0);
        }

        const { count: total } = await supabase
          .from('symbol_submissions')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'approved');
        if (!cancelled) setTotalApproved(total ?? 0);

        const { count: verified } = await supabase
          .from('symbol_submissions')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'approved')
          .gte('upvotes', 3);
        if (!cancelled) setVerifiedCount(verified ?? 0);

        const { data: stripData } = await supabase
          .from('symbol_submissions')
          .select('id,image_url,upvotes')
          .eq('status', 'approved')
          .order('upvotes', { ascending: false })
          .limit(6);
        if (!cancelled && stripData) setStrip(stripData as TopStrip[]);
      } catch (e) {
        // fail silently — render fallback
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const specimen = featured ?? {
    id: 'placeholder',
    image_url: '/placeholder-symbol-1.svg',
    tags: ['katakana-like', 'shifting', 'grid'],
    wavelength: '650nm',
    dose_level: null,
    surface_type: null,
    upvotes: 0,
  };

  const displayCount = confirmCount || specimen.upvotes || 0;
  const tagLine = (specimen.tags ?? []).slice(0, 3).join(' · ').toUpperCase();
  const specimenHref = featured ? `/registry/${featured.id}` : '/registry';

  return (
    <section className="relative px-4 pt-28 pb-20 md:pt-36 md:pb-28 overflow-hidden">
      <div className="max-w-6xl mx-auto grid md:grid-cols-[1.1fr_1fr] gap-14 md:gap-16 items-center">
        {/* Editorial statement */}
        <div className="space-y-7">
          <p className="label-data text-xs text-muted-foreground">
            CONVERGENCE · OPEN RECORD · N,N-DMT
          </p>
          <h1
            className="text-4xl sm:text-5xl md:text-6xl lg:text-[64px] leading-[1.02] tracking-[-0.02em] text-foreground"
            style={{ fontFamily: "'Fraunces', Georgia, serif", fontWeight: 400 }}
          >
            People who never met keep drawing the same shapes.
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-xl"
             style={{ fontFamily: "'Hanken Grotesk', system-ui, sans-serif", fontWeight: 400 }}>
            An open record of the visual symbols independently reported during N,N-DMT experiences.
            Browse them. Confirm the ones you've seen. Help decode a shared perception.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              size="lg"
              onClick={() => navigate('/registry')}
              className="h-14 px-7 rounded-full text-base font-medium flex-1 sm:flex-initial"
            >
              <Eye className="w-4 h-4 mr-2" />
              I saw this too
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate('/submit-symbol')}
              className="h-14 px-7 rounded-full text-base font-medium flex-1 sm:flex-initial border-foreground/20 hover:border-foreground/40"
            >
              <PencilLine className="w-4 h-4 mr-2" />
              Record what you saw
            </Button>
          </div>

          <p className="label-data text-xs text-muted-foreground pt-4">
            {totalApproved > 0
              ? `${totalApproved} FORMS CATALOGUED${verifiedCount > 0 ? ` · ${verifiedCount} INDEPENDENTLY VERIFIED` : ''}`
              : 'OPEN CATALOGUE · CC-BY-4.0'}
          </p>
        </div>

        {/* Specimen plate */}
        <Link
          to={specimenHref}
          className="group block"
          aria-label={`View specimen ${specimen.id.slice(0, 8)}`}
        >
          <div className="relative rounded-sm border border-border bg-card p-6 md:p-8 shadow-sm hover:shadow-md transition-shadow">
            {/* corner marks */}
            <span className="absolute top-2 left-2 w-3 h-3 border-l border-t border-foreground/30" aria-hidden />
            <span className="absolute top-2 right-2 w-3 h-3 border-r border-t border-foreground/30" aria-hidden />
            <span className="absolute bottom-2 left-2 w-3 h-3 border-l border-b border-foreground/30" aria-hidden />
            <span className="absolute bottom-2 right-2 w-3 h-3 border-r border-b border-foreground/30" aria-hidden />

            <div className="specimen-breathe aspect-square bg-white rounded-sm flex items-center justify-center overflow-hidden border border-border/60">
              <img
                src={specimen.image_url}
                alt={`Specimen ${specimen.id.slice(0, 8)}`}
                className="w-full h-full object-contain p-6"
                loading="eager"
                onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder-symbol-1.svg'; }}
              />
            </div>

            <div className="mt-6 text-center">
              <div
                className="text-6xl md:text-7xl lg:text-8xl leading-none text-primary tabular-nums"
                style={{ fontFamily: "'Fraunces', Georgia, serif", fontWeight: 500 }}
              >
                {displayCount}
              </div>
              <p className="label-data text-[11px] text-muted-foreground mt-3 tracking-[0.15em]">
                {displayCount === 1 ? 'PERSON' : 'PEOPLE'} INDEPENDENTLY REPORTED THIS FORM
              </p>
            </div>

            <div className="mt-5 pt-4 border-t border-border/60">
              <p className="label-data text-[10px] text-muted-foreground truncate">
                SPECIMEN {specimen.id.slice(0, 8)}
                {specimen.wavelength ? ` · ${specimen.wavelength}` : ' · 650 NM'}
                {tagLine ? ` · ${tagLine}` : ''}
              </p>
            </div>
          </div>
        </Link>
      </div>

      {/* How it works */}
      <div className="max-w-5xl mx-auto mt-24 md:mt-32 grid md:grid-cols-3 gap-8 md:gap-12 border-t border-border/50 pt-14">
        {[
          { n: '01', h: 'Observe', d: 'Notice a discrete visual form during an N,N-DMT experience.' },
          { n: '02', h: 'Draw or Confirm', d: 'Reconstruct it on the canvas — or confirm one already reported.' },
          { n: '03', h: 'It joins the open record', d: 'Peer-reviewed, CC-BY-4.0, downloadable as data.' },
        ].map((step) => (
          <div key={step.n} className="space-y-3">
            <p className="label-data text-xs text-primary">{step.n}</p>
            <h3
              className="text-2xl text-foreground"
              style={{ fontFamily: "'Fraunces', Georgia, serif", fontWeight: 500 }}
            >
              {step.h}
            </h3>
            <p className="text-muted-foreground leading-relaxed"
               style={{ fontFamily: "'Hanken Grotesk', system-ui, sans-serif" }}>
              {step.d}
            </p>
          </div>
        ))}
      </div>

      {/* Convergence strip */}
      {strip.length > 0 && (
        <div className="max-w-6xl mx-auto mt-24 border-t border-border/50 pt-10">
          <div className="flex items-baseline justify-between mb-6">
            <p className="label-data text-xs text-muted-foreground">
              MOST CONFIRMED SPECIMENS
            </p>
            <Link to="/registry" className="label-data text-xs text-primary hover:underline">
              BROWSE ALL →
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {strip.map((s) => (
              <Link
                key={s.id}
                to={`/registry/${s.id}`}
                className="group block relative rounded-sm border border-border bg-card p-2 hover:border-primary/60 transition-colors"
              >
                <div className="aspect-square bg-white rounded-sm flex items-center justify-center overflow-hidden">
                  <img
                    src={s.image_url}
                    alt={`Specimen ${s.id.slice(0, 8)}`}
                    className="w-full h-full object-contain p-2"
                    loading="lazy"
                    onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder-symbol-1.svg'; }}
                  />
                </div>
                <p className="label-data text-[10px] text-muted-foreground mt-2 text-center">
                  {s.upvotes} CONFIRMED
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}

      <style>{`
        @keyframes specimen-breathe {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.88; }
        }
        .dark .specimen-breathe {
          animation: specimen-breathe 6s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .specimen-breathe { animation: none !important; }
        }
      `}</style>
    </section>
  );
};
