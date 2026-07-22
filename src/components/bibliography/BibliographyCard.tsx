import { ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { BibliographyRow } from './types';

interface Props {
  row: BibliographyRow;
}

const stanceLabel = (row: BibliographyRow) => {
  if (row.stance_unverified) return { label: 'Unverified', className: 'bg-muted text-muted-foreground' };
  if (row.stance_score == null) return null;
  if (row.stance_score >= 4) return { label: `Supportive (${row.stance_score > 0 ? '+' : ''}${row.stance_score})`, className: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30' };
  if (row.stance_score <= -4) return { label: `Skeptical (${row.stance_score})`, className: 'bg-rose-500/15 text-rose-500 border-rose-500/30' };
  return { label: `Balanced (${row.stance_score > 0 ? '+' : ''}${row.stance_score})`, className: 'bg-amber-500/15 text-amber-600 border-amber-500/30' };
};

const displayDate = (row: BibliographyRow) => {
  if (row.source_date) return row.source_date;
  if (row.publication_date) return new Date(row.publication_date).getFullYear().toString();
  return null;
};

export const BibliographyCard = ({ row }: Props) => {
  const stance = stanceLabel(row);
  const date = displayDate(row);
  const href = row.url || (row.doi ? `https://doi.org/${row.doi}` : null);

  return (
    <Card className="p-5 space-y-3 hover:border-primary/40 transition-colors">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        {row.content_type && <Badge variant="outline">{row.content_type}</Badge>}
        {row.authority_type && <Badge variant="secondary">{row.authority_type}</Badge>}
        {stance && (
          <span className={`inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium ${stance.className}`}>
            {stance.label}
          </span>
        )}
        {date && <span className="text-muted-foreground ml-auto">{date}</span>}
      </div>

      <h3 className="font-semibold leading-snug">
        {href ? (
          <a href={href} target="_blank" rel="noopener noreferrer" className="hover:text-primary inline-flex items-start gap-1">
            {row.title}
            <ExternalLink className="w-3.5 h-3.5 mt-1 flex-shrink-0" />
          </a>
        ) : (
          row.title
        )}
      </h3>

      {row.authors && <p className="text-sm text-muted-foreground">{row.authors}</p>}
      {row.journal && <p className="text-xs text-muted-foreground italic">{row.journal}</p>}
      {row.summary && <p className="text-sm">{row.summary}</p>}

      {row.tags && row.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 pt-1">
          {row.tags.map((t) => (
            <span key={t} className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">
              {t}
            </span>
          ))}
        </div>
      )}

      {row.doi && (
        <div className="text-xs text-muted-foreground pt-1 border-t border-border/40">
          DOI: <a href={`https://doi.org/${row.doi}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{row.doi}</a>
        </div>
      )}
    </Card>
  );
};
