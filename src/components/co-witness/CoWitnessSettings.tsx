import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

type Visibility = 'private' | 'pairs_only' | 'wall';

interface Prefs {
  visibility: Visibility;
  allow_high_five: boolean;
}

/**
 * Co-witness settings card. Default private: user appears nowhere until they opt in.
 * Writes only to co_witness_prefs. Never touches symbol_votes or submission counts.
 */
export const CoWitnessSettings = ({ userId }: { userId: string }) => {
  const [prefs, setPrefs] = useState<Prefs>({ visibility: 'private', allow_high_five: true });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await (supabase as any)
        .from('co_witness_prefs')
        .select('visibility,allow_high_five')
        .eq('user_id', userId)
        .maybeSingle();
      if (data) setPrefs({ visibility: data.visibility, allow_high_five: data.allow_high_five });
      setLoading(false);
    })();
  }, [userId]);

  const save = async () => {
    setSaving(true);
    const { error } = await (supabase as any)
      .from('co_witness_prefs')
      .upsert({ user_id: userId, ...prefs }, { onConflict: 'user_id' });
    setSaving(false);
    if (error) {
      toast.error('Could not save preferences');
      return;
    }
    toast.success('Preferences saved');
  };

  if (loading) {
    return <Card className="p-6"><p className="text-sm text-muted-foreground">Loading co-witness settings.</p></Card>;
  }

  return (
    <Card className="p-6 space-y-5">
      <div>
        <h3 className="font-medium text-base">Co-witness settings</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Strictly opt-in. When set to private, you appear nowhere and no one can see that you recognized a symbol.
        </p>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">Visibility</Label>
        <RadioGroup
          value={prefs.visibility}
          onValueChange={(v) => setPrefs((p) => ({ ...p, visibility: v as Visibility }))}
          className="space-y-2"
        >
          <div className="flex items-start gap-3">
            <RadioGroupItem value="private" id="v-private" className="mt-1" />
            <Label htmlFor="v-private" className="font-normal cursor-pointer">
              <div className="font-medium text-sm">Private</div>
              <div className="text-xs text-muted-foreground">You appear nowhere. Default.</div>
            </Label>
          </div>
          <div className="flex items-start gap-3">
            <RadioGroupItem value="pairs_only" id="v-pairs" className="mt-1" />
            <Label htmlFor="v-pairs" className="font-normal cursor-pointer">
              <div className="font-medium text-sm">Pairs only</div>
              <div className="text-xs text-muted-foreground">
                Other people who marked the same symbol can see your handle and avatar next to theirs.
              </div>
            </Label>
          </div>
          <div className="flex items-start gap-3">
            <RadioGroupItem value="wall" id="v-wall" className="mt-1" />
            <Label htmlFor="v-wall" className="font-normal cursor-pointer">
              <div className="font-medium text-sm">Wall</div>
              <div className="text-xs text-muted-foreground">
                Same as pairs, plus your recollections appear on the public co-witness wall.
              </div>
            </Label>
          </div>
        </RadioGroup>
      </div>

      <div className="flex items-center justify-between border-t border-border pt-4">
        <div>
          <Label className="text-sm font-medium">Accept high-fives</Label>
          <p className="text-xs text-muted-foreground">Others can tap a one-time "I believe you" toward you.</p>
        </div>
        <Switch
          checked={prefs.allow_high_five}
          onCheckedChange={(v) => setPrefs((p) => ({ ...p, allow_high_five: v }))}
        />
      </div>

      <Button onClick={save} disabled={saving} className="w-full sm:w-auto">
        {saving ? 'Saving.' : 'Save preferences'}
      </Button>
    </Card>
  );
};
