import { useMemo } from 'react';
import type { BibliographyRow } from './types';

interface Props {
  rows: BibliographyRow[];
}

export const StanceDistribution = ({ rows }: Props) => {
  const counts = useMemo(() => {
    let supportive = 0;
    let skeptical = 0;
    let balanced = 0;
    let unscored = 0;
    for (const r of rows) {
      const s = r.stance_score;
      if (s == null) unscored += 1;
      else if (s >= 4) supportive += 1;
      else if (s <= -4) skeptical += 1;
      else balanced += 1;
    }
    return { supportive, skeptical, balanced, unscored };
  }, [rows]);

  const scored = counts.supportive + counts.skeptical + counts.balanced;
  const pct = (n: number) => (scored > 0 ? (n / scored) * 100 : 0);

  const summary = `Skeptical ${counts.skeptical}, Balanced ${counts.balanced}, Supportive ${counts.supportive}, Unscored ${counts.unscored}.`;

  const legend: { label: string; count: number; swatch: string }[] = [
    { label: 'Skeptical', count: counts.skeptical, swatch: 'bg-stance-skeptical' },
    { label: 'Balanced', count: counts.balanced, swatch: 'bg-stance-neutral' },
    { label: 'Supportive', count: counts.supportive, swatch: 'bg-stance-supportive' },
    { label: 'Unscored', count: counts.unscored, swatch: 'bg-muted' },
  ];

  return (
    <div className="w-full space-y-3">
      <div
        role="img"
        aria-label={`Stance distribution. ${summary}`}
        className="flex w-full h-10 rounded-md overflow-hidden gap-[2px] bg-background"
      >
        {scored > 0 ? (
          <>
            <div className="bg-stance-skeptical h-full" style={{ width: `${pct(counts.skeptical)}%` }} />
            <div className="bg-stance-neutral h-full" style={{ width: `${pct(counts.balanced)}%` }} />
            <div className="bg-stance-supportive h-full" style={{ width: `${pct(counts.supportive)}%` }} />
          </>
        ) : (
          <div className="bg-muted h-full w-full" />
        )}
      </div>

      <p className="sr-only">{summary}</p>

      <div className="flex flex-wrap gap-x-4 gap-y-2">
        {legend.map((l) => (
          <span key={l.label} className="inline-flex items-center gap-2 text-xs text-muted-foreground">
            <span className={`inline-block w-3 h-3 rounded-sm ${l.swatch}`} aria-hidden="true" />
            {l.label} {l.count}
          </span>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        Stance across {scored} scored entries, on a −9 to +9 scale. {counts.unscored} not yet scored.
      </p>
    </div>
  );
};
