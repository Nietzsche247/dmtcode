import { useId } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLocale } from '@/i18n/LocaleProvider';
import { uiCopy } from '@/i18n/ui-strings';
import { stimulusPhotoError } from '@/lib/observationRules';
import { toast } from 'sonner';

interface Props {
  photos: File[];
  onPhotosChange: (files: File[]) => void;
  delay: string;
  onDelayChange: (value: string) => void;
}

export function ObservationExtras({ photos, onPhotosChange, delay, onDelayChange }: Props) {
  const id = useId();
  const locale = useLocale();
  const copy = (key: string) => uiCopy(`observation-${key}`, locale).title;
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor={`${id}-photos`}>{copy('photoTitle')}</Label>
        <p id={`${id}-help`} className="text-sm text-muted-foreground">{copy('photoHelp')}</p>
        <Input id={`${id}-photos`} type="file" accept="image/jpeg,image/png,image/heic" multiple aria-describedby={`${id}-help`}
          onChange={event => {
            const files = Array.from(event.target.files || []);
            const error = stimulusPhotoError(files);
            if (error) { toast.error(copy(error)); event.target.value = ''; return; }
            onPhotosChange(files);
          }} />
        <p className="text-xs text-muted-foreground">{copy('photoLimits')}</p>
        {photos.length > 0 && <ul className="text-sm text-muted-foreground break-all">{photos.map((photo, n) => <li key={n}>{photo.name}</li>)}</ul>}
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${id}-delay`}>{copy('delayQuestion')}</Label>
        <Select value={delay} onValueChange={onDelayChange}>
          <SelectTrigger id={`${id}-delay`}><SelectValue placeholder={copy('optional')} /></SelectTrigger>
          <SelectContent>{['within_hour', 'same_day', 'within_week', 'longer_week'].map(value => <SelectItem key={value} value={value}>{copy(value)}</SelectItem>)}</SelectContent>
        </Select>
      </div>
    </div>
  );
}
