import { Bookmark } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useSaveSymbol } from '@/hooks/useSaveSymbol';

interface SaveButtonProps {
  symbolId: string;
  size?: 'sm' | 'default';
  className?: string;
}

export const SaveButton = ({ symbolId, size = 'sm', className }: SaveButtonProps) => {
  const { userId, isSaved, loading, toggleSave } = useSaveSymbol(symbolId);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size={size}
            onClick={toggleSave}
            disabled={loading}
            className={cn(
              'transition-all duration-200',
              isSaved && 'text-primary',
              !userId && 'opacity-50',
              className
            )}
            aria-label={isSaved ? 'Remove from saved' : 'Save symbol'}
          >
            <Bookmark 
              className={cn(
                size === 'sm' ? 'w-4 h-4' : 'w-5 h-5',
                isSaved && 'fill-current'
              )} 
            />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {!userId ? 'Log in to save' : isSaved ? 'Remove from saved' : 'Save symbol'}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};