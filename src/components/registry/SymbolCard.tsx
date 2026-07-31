import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Eye } from 'lucide-react';
import { SeenItButton } from './SeenItButton';
import { SaveButton } from '@/components/dashboard/SaveButton';
import { Link } from 'react-router-dom';

interface SymbolCardProps {
  id: string;
  imageUrl: string;
  description?: string | null;
  tags?: string[] | null;
  upvotes: number;
  validationCount: number;
  status?: 'pending' | 'approved' | 'rejected';
  contributor?: {
    id: string;
    displayName: string;
    avatarUrl?: string | null;
  } | null;
  createdAt: string;
  submitterId?: string;
  highlightTerms?: string[];
}

export const SymbolCard = ({
  id,
  imageUrl,
  description,
  tags,
  upvotes,
  validationCount,
  status,
  contributor,
  createdAt,
  submitterId,
  highlightTerms = [],
}: SymbolCardProps) => {
  const highlightText = (text: string) => {
    if (!highlightTerms.length || !text) return text;

    const regex = new RegExp(`(${highlightTerms.join('|')})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, i) =>
      highlightTerms.some(term => part.toLowerCase() === term.toLowerCase())
        ? <mark key={i} className="bg-primary/30 text-foreground rounded px-0.5">{part}</mark>
        : part
    );
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const specimenId = `#${id.replace(/-/g, '').slice(0, 8).toUpperCase()}`;

  const captureDate = (() => {
    const d = new Date(createdAt);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  })();

  const tagLine = tags && tags.length > 0
    ? tags.slice(0, 3).map(t => t.toLowerCase()).join(', ')
    : null;

  return (
    <Card className="group flex h-full flex-col gap-3 rounded-lg border border-border bg-card p-3 transition-all duration-200 hover:border-accent/40 hover:shadow-lg hover:shadow-accent/10 motion-safe:hover:-translate-y-px">
      {/* Specimen plate */}
      <Link
        to={`/registry/${id}`}
        className="block rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <div className="aspect-square flex items-center justify-center bg-white rounded-md border border-border overflow-hidden">
          <img
            src={imageUrl}
            alt={description || 'Symbol submission'}
            className="w-full h-full object-contain p-2"
            loading="lazy"
          />
        </div>
      </Link>

      {/* Specimen metadata */}
      <div className="space-y-2">
        <p className="font-mono text-[11px] text-muted-foreground">
          {specimenId}
          {captureDate ? <span className="ml-3">{captureDate}</span> : null}
        </p>

        {description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {highlightText(description)}
          </p>
        )}

        {tagLine && (
          <p className="font-mono text-[11px] lowercase text-muted-foreground/80">
            {highlightTerms.length ? highlightText(tagLine) : tagLine}
          </p>
        )}
      </div>

      <div className="mt-auto space-y-2">
        {/* Stats Row */}
        <div className="flex items-center justify-between gap-2 font-mono text-[11px] text-muted-foreground">
          {validationCount > 0 ? (
            <span
              className="flex items-center gap-1.5 leading-tight"
              title="These people saw this symbol on this page and then marked that it echoes their memory. That is recognition after exposure to the catalogue, which is not the same as an independent record made before seeing it."
            >
              <Eye className="w-3.5 h-3.5 shrink-0" />
              {validationCount} recognized this after seeing it here
            </span>
          ) : (
            <span />
          )}
          <SaveButton symbolId={id} size="sm" className="shrink-0" />
        </div>

        {/* Contributor Info */}
        {contributor && (
          <div className="flex items-center gap-2">
            <Avatar className="w-5 h-5">
              <AvatarImage src={contributor.avatarUrl || undefined} />
              <AvatarFallback className="text-[9px] bg-primary/10 text-primary">
                {getInitials(contributor.displayName)}
              </AvatarFallback>
            </Avatar>
            <span className="font-mono text-[11px] text-muted-foreground truncate">
              {contributor.displayName}
            </span>
          </div>
        )}

        {/* Prominent one-tap confirmation */}
        <SeenItButton symbolId={id} submitterId={submitterId} size="sm" className="w-full justify-center" imageUrl={imageUrl} />
      </div>
    </Card>
  );
};
