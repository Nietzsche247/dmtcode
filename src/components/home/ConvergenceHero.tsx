import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { ArrowRight, Eye, PencilLine } from 'lucide-react';
import { tagLabel } from '@/lib/tags';

interface TopSymbol {
  id: string;
  image_url: string;
  tags: string[] | null;
  wavelength: string | null;
  dose_level: string | null;
  surface_type: string | null;
  upvotes: number;
}

export const ConvergenceHero = () => {
  const navigate = useNavigate();
  const [featured, setFeatured] = useState<TopSymbol | null>(null);
  const [recent, setRecent] = useState<TopSymbol[]>([]);
  const [confirmCount, setConfirmCount] = useState<number>(0);
  const [libraryCount, setLibraryCount] = useState<number>(0);
  const [recognizedByThreeCount, setRecognizedByThreeCount] = useState<number>(0);


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
        // Four most recently reviewed entries, newest first.
        const { data: recentData } = await supabase
          .from('symbol_submissions')
          .select('id,image_url,tags,wavelength,dose_level,surface_type,upvotes')
          .eq('status', 'approved')
          .order('created_at', { ascending: false })
          .limit(4);
        if (!cancelled && recentData) setRecent(recentData as TopSymbol[]);


        // One library, one count. Every published symbol is counted the same
        // way; nothing is segregated by how it entered the record.
        const { count: total } = await supabase
          .from('symbol_submissions')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'approved');
        if (!cancelled) setLibraryCount(total ?? 0);

        const { count: verified } = await supabase
          .from('symbol_submissions')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'approved')
          .gte('upvotes', 3);
        if (!cancelled) setRecognizedByThreeCount(verified ?? 0);

      } catch (e) {
        // fail silently - render fallback
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const specimen = featured ?? {
    id: 'placeholder',
    image_url: '/placeholder-symbol-1.svg',
    tags: [],
    dose_level: null,
    surface_type: null,
    upvotes: 0,
  } as unknown as TopSymbol;

  const displayCount = confirmCount || specimen.upvotes || 0;
  const tagLine = (specimen.tags ?? []).slice(0, 3).map(tagLabel).join(' · ');
  const specimenHref = featured ? `/registry/${featured.id}` : '/registry';

  // Four quadrants. If fewer than four entries exist, the remainder fall back to
  // placeholder plates rather than collapsing the grid.
  const quadrants: TopSymbol[] = Array.from({ length: 4 }, (_, i) =>
    recent[i] ?? ({
      id: 'placeholder',
      image_url: `/placeholder-symbol-${(i % 5) + 1}.svg`,
      tags: [],
      wavelength: null,
      dose_level: null,
      surface_type: null,
      upvotes: 0,
    } as TopSymbol),
  );


  // A count of zero renders as nothing at all, never as a printed zero.
  const countSegments: string[] = [];
  if (libraryCount > 0) {
    countSegments.push(`${libraryCount} SYMBOL${libraryCount === 1 ? '' : 'S'} IN THE RECORD`);
  }
  if (recognizedByThreeCount > 0) {
    countSegments.push(`${recognizedByThreeCount} RECOGNIZED BY 3 OR MORE READERS`);
  }

  return (
    <section className="relative px-4 pt-20 pb-10 md:pt-32 md:pb-20 overflow-hidden">
      <div className="max-w-6xl mx-auto grid md:grid-cols-[1.1fr_1fr] gap-10 md:gap-16 items-center">
        {/* Editorial statement */}
        <div className="space-y-6">
          <p className="label-data text-xs text-muted-foreground">
            CONVERGENCE · OPEN RECORD · N,N-DMT
          </p>
          <h1
            className="text-4xl sm:text-5xl md:text-6xl lg:text-[64px] leading-[1.02] tracking-[-0.02em] text-foreground"
            style={{ fontFamily: "'Fraunces', Georgia, serif", fontWeight: 400 }}
          >
            Is there a recurring visual structure people can learn to see?
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-xl"
             style={{ fontFamily: "'Hanken Grotesk', system-ui, sans-serif", fontWeight: 400 }}>
            An open record of the visual forms people report during N,N-DMT experiences. Some of them appear to recur across people who have never met. Whether that recurrence is real, or whether optics, shared neurobiology, expectation and memory explain it, is the open question this record exists to answer.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              size="lg"
              onClick={() => navigate('/capture')}
              className="h-14 px-7 rounded-full text-base font-medium flex-1 sm:flex-initial"
            >
              <PencilLine className="w-4 h-4 mr-2" />
              Record what you saw
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate('/registry')}
              className="h-14 px-7 rounded-full text-base font-medium flex-1 sm:flex-initial border-foreground/20 hover:border-foreground/40"
            >
              <Eye className="w-4 h-4 mr-2" />
              Browse the record
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            Recording first keeps your memory unshaped by the catalogue. Free account, avatar only, your name is never shown.
          </p>

          <p className="label-data text-xs text-muted-foreground pt-4">
            {countSegments.length > 0
              ? countSegments.join(' · ')
              : 'OPEN CATALOGUE · CC-BY-4.0'}
          </p>
        </div>

        {/* Specimen plate: four most recently reviewed entries */}
        <div className="relative rounded-sm border border-border bg-card p-6 md:p-8 shadow-sm">
          {/* corner marks */}
          <span className="absolute top-2 left-2 w-3 h-3 border-l border-t border-foreground/30" aria-hidden />
          <span className="absolute top-2 right-2 w-3 h-3 border-r border-t border-foreground/30" aria-hidden />
          <span className="absolute bottom-2 left-2 w-3 h-3 border-l border-b border-foreground/30" aria-hidden />
          <span className="absolute bottom-2 right-2 w-3 h-3 border-r border-b border-foreground/30" aria-hidden />

          <div className="specimen-breathe grid grid-cols-2 gap-3">
            {quadrants.map((s, i) => (
              <Link
                key={`${s.id}-${i}`}
                to={s.id === 'placeholder' ? '/registry' : `/registry/${s.id}`}
                className="group block rounded-sm border border-border/60 overflow-hidden hover:border-primary/60 transition-colors"
                aria-label={`View specimen ${s.id.slice(0, 8)}`}
              >
                <div className="aspect-square bg-white flex items-center justify-center overflow-hidden">
                  <img
                    src={s.image_url}
                    alt={`Specimen ${s.id.slice(0, 8)}`}
                    className="w-full h-full object-contain p-4"
                    loading={i === 0 ? 'eager' : 'lazy'}
                    onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder-symbol-1.svg'; }}
                  />
                </div>
                <div className="px-2 py-2 border-t border-border/60 bg-card">
                  <p className="label-data text-[9px] text-muted-foreground truncate">
                    {s.id.slice(0, 8)}
                    {s.wavelength ? ` · ${s.wavelength}` : ''}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {(s.tags ?? []).slice(0, 2).map((t) => (
                      <span
                        key={t}
                        className="label-data text-[9px] px-1.5 py-0.5 rounded-sm border border-border text-muted-foreground truncate max-w-[7rem]"
                      >
                        {tagLabel(t)}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {displayCount > 0 && (
            <div className="mt-6 text-center">
              <div
                className="text-5xl md:text-6xl leading-none text-foreground tabular-nums"
                style={{ fontFamily: "'Fraunces', Georgia, serif", fontWeight: 500 }}
              >
                {displayCount}
              </div>
              <p className="label-data text-[11px] text-muted-foreground mt-3 tracking-[0.15em]">
                READERS RECOGNIZED THE LEADING SPECIMEN AFTER SEEING IT HERE
              </p>
            </div>
          )}

          <div className="mt-5 pt-4 border-t border-border/60">
            <p className="label-data text-[10px] text-muted-foreground truncate">
              FOUR MOST RECENTLY REVIEWED ENTRIES
            </p>
          </div>
        </div>

      </div>

      {/* How it works */}
      <div className="max-w-5xl mx-auto mt-10 md:mt-16 grid md:grid-cols-3 gap-6 md:gap-10 border-t border-border/50 pt-8">
        {[
          { n: '01', h: 'Observe', d: 'Notice a discrete visual form during an N,N-DMT experience.' },
          { n: '02', h: 'Draw or Respond', d: 'Reconstruct it on the canvas, or tell us whether one already recorded resembles what you saw.' },
          { n: '03', h: 'It joins the open record', d: 'Openly licensed CC-BY-4.0 and downloadable as data.' },
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

      {/* Sober entry point */}
      <div className="max-w-5xl mx-auto mt-8 md:mt-10">
        <div className="rounded-sm border border-border bg-card p-5 md:p-7">
          <h3
            className="text-2xl text-foreground"
            style={{ fontFamily: "'Fraunces', Georgia, serif", fontWeight: 500 }}
          >
            Never done DMT? Start here.
          </h3>
          <p
            className="text-sm text-muted-foreground leading-relaxed mt-3"
            style={{ fontFamily: "'Hanken Grotesk', system-ui, sans-serif" }}
          >
            You do not need to take anything to contribute. The Sober Baseline Protocol is the same rig, the same field sheet, run sober, and sober records are the ones the registry needs most. Read the Screening Card first, then run a baseline tonight and record it.
          </p>
          <div className="flex flex-wrap gap-3 mt-4">
            <a
              href="/downloads/DMTCode_Screening_Card_v1.pdf"
              className="label-data text-[10px] text-primary hover:underline"
            >
              Screening Card (PDF)
            </a>
            <a
              href="/downloads/DMTCode_Sober_Baseline_Protocol_v1.pdf"
              className="label-data text-[10px] text-primary hover:underline"
            >
              Sober Baseline Protocol (PDF)
            </a>
          </div>
        </div>
      </div>

      {/* The six specimen strip lived here. It duplicated the Recent
          contributions grid further down the page, so the page shows it once. */}

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
