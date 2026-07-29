import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Eye } from 'lucide-react';
import { SeenItButton } from './SeenItButton';
import { SaveButton } from '@/components/dashboard/SaveButton';
import { Link } from 'react-router-dom';
import { isCuratedExample, CURATED_EXAMPLE_NOTICE } from '@/lib/submissionStatus';

interface SymbolCardProps {
  id: string;
  imageUrl: string;
  description?: string | null;
  tags?: string[] | null;
  upvotes: number;
  validationCount: number;
  status?: 'pending' | 'approved' | 'rejected';
  curated?: boolean | null;
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
  curated,
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

  // The is_curated_example column is authoritative. The image_url prefix is a
  // fallback so the original starter rows stay labelled even where the caller
  // has not passed the column through.
  const isCurated = isCuratedExample({ image_url: imageUrl, is_curated_example: curated });

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card className="group p-4 bg-card/50 border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5">
      {/* Image */}
      <Link to={`/registry/${id}`} className="block mb-4 relative">
        <div className="aspect-square flex items-center justify-center bg-white rounded-lg border border-border overflow-hidden">
          <img
            src={imageUrl}
            alt={description || 'Symbol submission'}
            className="w-full h-full object-contain p-2"
            loading="lazy"
          />
        </div>
        
        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
          <span className="text-sm font-medium text-primary bg-background/90 px-3 py-1 rounded-full">
            View Details
          </span>
        </div>
      </Link>

      {/* Content */}
      <div className="space-y-3">
        {isCurated && (
          <div className="space-y-1">
            <Badge variant="secondary" className="text-xs">Curated example</Badge>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {CURATED_EXAMPLE_NOTICE}
            </p>
          </div>
        )}

        {/* Description */}

        {description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {highlightText(description)}
          </p>
        )}

        {/* Tags */}
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {tags.slice(0, 3).map((tag, idx) => (
              <Badge 
                key={idx} 
                variant="outline" 
                className="text-xs"
              >
                {highlightTerms.length ? highlightText(tag) : tag}
              </Badge>
            ))}
            {tags.length > 3 && (
              <Badge variant="outline" className="text-xs text-muted-foreground">
                +{tags.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Stats Row */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          {validationCount > 0 ? (
            <span
              className="flex items-center gap-1"
              title="These people saw this symbol on this page and then marked that it echoes their memory. That is recognition after exposure to the catalogue, which is not the same as an independent record made before seeing it."
            >
              <Eye className="w-4 h-4" />
              {validationCount} recognized this after seeing it here
            </span>
          ) : (
            <span />
          )}
          <SaveButton symbolId={id} size="sm" />
        </div>

        {/* Contributor Info */}
        {contributor && (
          <div className="flex items-center gap-2 pt-2 border-t border-border/50">
            <Avatar className="w-6 h-6">
              <AvatarImage src={contributor.avatarUrl || undefined} />
              <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                {getInitials(contributor.displayName)}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground truncate">
              {contributor.displayName}
            </span>
          </div>
        )}

        {/* Prominent one-tap confirmation */}
        <div className="pt-2">
          <SeenItButton symbolId={id} submitterId={submitterId} size="sm" className="w-full justify-center" imageUrl={imageUrl} />
        </div>
      </div>
    </Card>
  );
};
