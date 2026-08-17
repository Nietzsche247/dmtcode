import { Card } from '@/components/ui/card';
import { tagLabel } from '@/lib/tags';
import { AvatarGlyph } from '@/components/AvatarGlyph';
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
    handle: string;
    avatarSeed?: string | null;
  } | null;
  createdAt: string;
  submitterId?: string;
  highlightTerms?: string[];
  similarCount?: number;
  communityTags?: { name: string; count: number }[];
}

export const SymbolCard = ({
  id,
  imageUrl,
  description,
  upvotes,
  validationCount,
  status,
  contributor,
  createdAt,
  submitterId,
  similarCount = 0,
  communityTags = [],
}: SymbolCardProps) => {
  const specimenId = `#${id.replace(/-/g, '').slice(0, 8).toUpperCase()}`;

  const captureDate = (() => {
    const d = new Date(createdAt);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  })();


  return (
    <Card className="group flex h-full flex-col gap-2 rounded-lg border border-border bg-card p-2 transition-all duration-200 hover:border-accent/40 hover:shadow-lg hover:shadow-accent/10 motion-safe:hover:-translate-y-px">
      {/* Specimen plate */}
      <Link
        to={`/registry/${id}`}
        className="block rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <div className="aspect-square flex items-center justify-center bg-white rounded-md border border-border overflow-hidden">
          <img
            src={imageUrl}
            alt={description || 'Symbol submission'}
            className="w-full h-full object-contain p-1"
            loading="lazy"
          />
        </div>
      </Link>

      {/* Specimen metadata */}
      <div className="space-y-2">
        <p className="-mt-1 font-mono text-[9px] font-bold text-muted-foreground tracking-wide">
          {specimenId}
          {captureDate ? <span className="ml-3">{captureDate}</span> : null}
        </p>


        {communityTags.length > 0 && (
          <p
            className="font-mono text-[10px] lowercase leading-relaxed text-foreground/70"
            title="Tags added by readers after publication, ranked by agreement"
          >
            {communityTags.slice(0, 5).map(t => (
              <span key={t.name} className="mr-2.5 whitespace-nowrap">{tagLabel(t.name)}<sup className="ml-px text-[8px] font-bold text-muted-foreground">{t.count}</sup></span>
            ))}
          </p>
        )}
      </div>

      <div className="mt-auto space-y-2">
        {/* Contributor Info */}
        {contributor && (
          <div className="flex items-center gap-2">
            <AvatarGlyph seed={contributor.avatarSeed || contributor.id} handle={contributor.handle} size={20} />
            <span className="font-mono text-[11px] text-muted-foreground truncate">
              {contributor.handle}
            </span>
          </div>
        )}

        {/* Running counts */}
        <div className="flex items-center justify-between gap-2">
          <SaveButton symbolId={id} size="sm" className="shrink-0" />
          <p className="text-right font-mono text-[11px] text-muted-foreground">
            {validationCount > 0 && (
              <span title="These people saw this symbol on this page and then marked that it echoes their memory. That is recognition after exposure to the catalogue, which is not the same as an independent record made before seeing it.">
                {validationCount} seen
              </span>
            )}
            {validationCount > 0 && similarCount > 0 ? '  ' : null}
            {similarCount > 0 && <span>{similarCount} similar</span>}
          </p>
        </div>
      </div>
    </Card>
  );
};
