import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

export const FilterGuide = () => {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-lg border border-border/60 bg-card/40 p-5 space-y-3">
      <p className="text-sm text-muted-foreground">
        This library combines peer reviewed papers with curated public sources on the Code of Reality
        phenomenon. Use the filters to narrow by content type, authority, stance, tag, or year. Featured
        items appear in the Research Timeline above. Everything else is browsable below.
      </p>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        aria-expanded={open}
      >
        Methodology note
        {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {open && (
        <div className="text-sm text-muted-foreground space-y-2 pt-2 border-t border-border/40">
          <p>
            Stance scores range from -10 to +10 and reflect how the source positions itself relative to
            the Code of Reality hypothesis. Positive values indicate supportive framing, negative values
            indicate skepticism, and values near zero indicate balanced or descriptive coverage. Scores
            are editorial judgments, not measurements.
          </p>
          <p>
            Authority tags describe the source, not the strength of the argument. Academic sources are
            peer reviewed or written by credentialed researchers. Independent covers self published
            researchers and primary data releases. Journalist, Podcaster, and Anonymous are labeled as
            such. Sources marked Unverified have claims we could not confirm at the time of listing.
          </p>
        </div>
      )}
    </div>
  );
};
