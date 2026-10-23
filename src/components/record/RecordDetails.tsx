import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { VisualFieldMap, type FieldPin } from '@/components/registry/VisualFieldMap';
import { ObservationExtras } from '@/components/submission/ObservationExtras';
import { supabase } from '@/integrations/supabase/client';
import { stimulusPhotoError } from '@/lib/observationRules';
import type { Json } from '@/integrations/supabase/types';

interface Props { glyphId: string; userId: string; copy: (key: string) => string }
const fields = ['movement', 'size', 'surface', 'location', 'timeOfDay', 'symmetry', 'colors', 'tags'] as const;
const mapOptions = {
  field_band: ['inside_band', 'on_band', 'outside_band', 'unsure'],
  depth: ['flat', 'shallow', 'deep', 'infinite', 'unsure'],
  field_attachment: ['on_surface', 'floating', 'recessed', 'layered', 'unsure'],
  field_anchoring: ['fixed_in_space', 'moved_with_me', 'unsure'],
  orientation: ['upright', 'inverted', 'rotated', 'no_clear_orientation', 'unsure'],
  field_locations: ['one_place', 'several_places', 'everywhere', 'unsure'],
};

export function RecordDetails({ glyphId, userId, copy }: Props) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [pin, setPin] = useState<FieldPin | null>(null);
  const [photos, setPhotos] = useState<File[]>([]);
  const [savedPhotoPaths, setSavedPhotoPaths] = useState<string[]>([]);
  const [delay, setDelay] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const save = async () => {
    setSaving(true); setMessage('');
    const uploaded: string[] = [];
    try {
      const validation = stimulusPhotoError(photos);
      if (validation || savedPhotoPaths.length + photos.length > 3) throw new Error(validation || 'photoCount');
      for (const [n, photo] of photos.entries()) {
        const extension = photo.type === 'image/jpeg' ? 'jpg' : photo.type === 'image/heic' ? 'heic' : 'png';
        const path = `${userId}/${glyphId}-${Date.now()}-${n}.${extension}`;
        const { error } = await supabase.storage.from('stimulus-photos').upload(path, photo, { contentType: photo.type });
        if (error) throw error;
        uploaded.push(path);
      }
      const { error } = await supabase.from('registry_glyphs').update({ post_seal_details: {
        ...answers, field_x: pin?.x ?? null, field_y: pin?.y ?? null,
        time_since_observation: delay || null, stimulus_photo_paths: [...savedPhotoPaths, ...uploaded],
      } as Json }).eq('id', glyphId).eq('user_id', userId).select('id').single();
      if (error) throw error;
      setSavedPhotoPaths(paths => [...paths, ...uploaded]);
      setMessage(copy('detailsSaved')); setPhotos([]);
    } catch {
      if (uploaded.length) await supabase.storage.from('stimulus-photos').remove(uploaded);
      setMessage(copy('saveError'));
    } finally { setSaving(false); }
  };
  return <details className="border-t border-border py-6">
    <summary className="cursor-pointer py-3 text-xl font-semibold">{copy('addDetail')}</summary>
    <div className="space-y-5 pt-5">
      <p className="text-sm text-muted-foreground">{copy('detailsNote')}</p>
      {fields.map(field => <div key={field} className="space-y-2">
        <Label htmlFor={`record-${field}`}>{copy(field)}</Label>
        <Input id={`record-${field}`} className="h-12" value={answers[field] || ''} onChange={e => setAnswers(a => ({ ...a, [field]: e.target.value }))} />
      </div>)}
      <div className="space-y-2"><Label htmlFor="record-description">{copy('description')}</Label><Textarea id="record-description" value={answers.description || ''} onChange={e => setAnswers(a => ({ ...a, description: e.target.value }))} /></div>
      <Label>{copy('fieldMap')}</Label>
      <VisualFieldMap value={pin} onChange={setPin} label={copy('fieldMap')} bandLabel={copy('diffractionBand')} centreLabel={copy('centre')} clearLabel={copy('clearMarker')} />
      {Object.entries(mapOptions).map(([field, values]) => <div className="space-y-2" key={field}>
        <Label htmlFor={`record-${field}`}>{copy(field)}</Label>
        <select id={`record-${field}`} className="w-full h-12 rounded-md border border-input bg-background px-3" value={answers[field] || ''} onChange={e => setAnswers(a => ({ ...a, [field]: e.target.value }))}>
          <option value="">{copy('optional')}</option>{values.map(value => <option key={value} value={value}>{copy(value)}</option>)}
        </select>
      </div>)}
      <ObservationExtras photos={photos} onPhotosChange={setPhotos} delay={delay} onDelayChange={setDelay} />
      <Button className="h-12 w-full" disabled={saving} onClick={save}>{copy(saving ? 'saving' : 'saveDetail')}</Button>
      {message && <p role="status">{message}</p>}
    </div>
  </details>;
}