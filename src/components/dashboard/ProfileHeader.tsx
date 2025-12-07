import { useState } from 'react';
import { Check, X, Pencil, HelpCircle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useDashboardTracking } from '@/hooks/useDashboardTracking';

interface ProfileHeaderProps {
  userId: string;
  displayName: string;
  avatarUrl?: string | null;
  reputationScore: number;
  onNameUpdate: (newName: string) => void;
}

export const ProfileHeader = ({
  userId,
  displayName,
  avatarUrl,
  reputationScore,
  onNameUpdate,
}: ProfileHeaderProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(displayName);
  const [saving, setSaving] = useState(false);
  const { trackProfileUpdated } = useDashboardTracking();

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleSave = async () => {
    if (!editValue.trim()) {
      toast.error('Display name cannot be empty');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ display_name: editValue.trim() })
        .eq('id', userId);

      if (error) throw error;

      onNameUpdate(editValue.trim());
      trackProfileUpdated('display_name');
      setIsEditing(false);
      toast.success('Profile updated');
    } catch (error) {
      console.error('Profile update error:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditValue(displayName);
    setIsEditing(false);
  };

  return (
    <div className="flex flex-col md:flex-row items-center gap-6 mb-8 p-6 bg-card/50 rounded-lg border border-border">
      <Avatar className="w-20 h-20">
        <AvatarImage src={avatarUrl || undefined} alt={displayName} />
        <AvatarFallback className="text-xl bg-primary/20 text-primary">
          {getInitials(displayName)}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 text-center md:text-left">
        {isEditing ? (
          <div className="flex items-center gap-2 justify-center md:justify-start">
            <Input
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="max-w-[200px]"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave();
                if (e.key === 'Escape') handleCancel();
              }}
            />
            <Button
              size="sm"
              variant="ghost"
              onClick={handleSave}
              disabled={saving}
              aria-label="Save name"
            >
              <Check className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCancel}
              disabled={saving}
              aria-label="Cancel edit"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="group flex items-center gap-2 hover:text-primary transition-colors"
            aria-label="Edit display name"
          >
            <h1 className="text-2xl font-bold">{displayName}</h1>
            <Pencil className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        )}

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