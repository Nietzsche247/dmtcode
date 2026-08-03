import { HelpCircle } from 'lucide-react';
import { AvatarGlyph } from '@/components/AvatarGlyph';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ProfileHeaderProps {
  userId: string;
  handle: string | null;
  avatarSeed?: string | null;
  reputationScore: number;
}

export const ProfileHeader = ({
  userId,
  handle,
  avatarSeed,
  reputationScore,
}: ProfileHeaderProps) => {
  return (
    <div className="flex flex-col md:flex-row items-center gap-6 mb-8 p-6 bg-card/50 rounded-lg border border-border">
      <AvatarGlyph seed={avatarSeed || userId} handle={handle || undefined} size={80} />

      <div className="flex-1 text-center md:text-left">
        <h1 className="text-2xl font-bold">{handle || 'Explorer'}</h1>

        <div className="flex items-center gap-2 mt-2 justify-center md:justify-start">
          <span className="text-sm text-muted-foreground">Reputation:</span>
          <span className="font-semibold text-primary">{reputationScore}</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button aria-label="Reputation score explanation">
                  <HelpCircle className="w-4 h-4 text-muted-foreground" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-[250px]">
                <p className="text-sm">
                  Your reputation score increases by +1 for each upvote received on your submissions, 
                  and decreases by -1 for each downvote. Higher reputation indicates community trust.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
};
