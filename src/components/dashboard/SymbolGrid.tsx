import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronUp, Eye, Trash2 } from 'lucide-react';

interface SymbolData {
  id: string;
  image_url: string;
  status?: 'pending' | 'approved' | 'rejected';
  upvotes?: number;
  downvotes?: number;
  description?: string | null;
  tags?: string[] | null;
  created_at?: string;
}

interface SymbolGridProps {
  symbols: SymbolData[];
  emptyMessage: string;
  emptyAction?: {
    label: string;
    href: string;
  };
  showStatus?: boolean;
  showRemove?: boolean;
  onRemove?: (id: string) => void;
  loading?: boolean;
}

export const SymbolGrid = ({
  symbols,
  emptyMessage,
  emptyAction,
  showStatus = false,
  showRemove = false,
  onRemove,
  loading = false,
}: SymbolGridProps) => {
  if (loading) {
    return (
      <div className="text-center text-muted-foreground py-12">
        Loading...
      </div>
    );
  }

  if (symbols.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-12">
        <p>{emptyMessage}</p>
        {emptyAction && (
          <a href={emptyAction.href} className="text-primary underline mt-2 inline-block">
            {emptyAction.label}
          </a>
        )}
      </div>
    );
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'rejected':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'pending':
      default:
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {symbols.map((symbol) => (
        <Card key={symbol.id} className="p-4 bg-card border-border hover:border-primary/50 transition-colors">
          <div className="flex justify-center mb-4 relative">
            <img
              src={symbol.image_url}
              alt={symbol.description || 'Symbol submission'}
              className="w-[180px] h-[180px] border border-border rounded object-contain bg-white"
              loading="lazy"
            />
            {showStatus && symbol.status && (
              <Badge 
                className={`absolute top-2 right-2 ${getStatusColor(symbol.status)}`}
              >
                {symbol.status}
              </Badge>
            )}
          </div>

          <div className="space-y-3">
            {symbol.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {symbol.description}
              </p>
            )}

            {symbol.tags && symbol.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {symbol.tags.slice(0, 3).map((tag, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {symbol.tags.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{symbol.tags.length - 3}
                  </Badge>
                )}
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                {typeof symbol.upvotes === 'number' && (
                  <span className="flex items-center gap-1">
                    <ChevronUp className="w-4 h-4" />
                    {symbol.upvotes}
                  </span>
                )}
                {typeof symbol.downvotes === 'number' && symbol.upvotes !== undefined && (
                  <span className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    {/* Show net validation count */}
                    {symbol.upvotes - symbol.downvotes} net
                  </span>
                )}
              </div>

              {showRemove && onRemove && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemove(symbol.id)}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  aria-label="Remove symbol"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};