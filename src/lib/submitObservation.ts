import { supabase } from '@/integrations/supabase/client';
import type { TablesInsert } from '@/integrations/supabase/types';
import { stimulusPhotoError } from './observationRules';

export interface StoredStimulusPhoto { name: string; type: string; data: string }
export interface ObservationAssets {
  stimulusPhotos?: (File | StoredStimulusPhoto)[];
  uploadDrawing?: boolean;
}

export async function serializeStimulusPhotos(files: File[]): Promise<StoredStimulusPhoto[]> {
  return Promise.all(files.map(file => new Promise<StoredStimulusPhoto>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => resolve({ name: file.name, type: file.type, data: String(reader.result) });
    reader.readAsDataURL(file);
  })));
}

// Insert only the glyph. Its existing AFTER INSERT trigger owns the atomic pair.
export async function submitObservation(glyph: TablesInsert<'registry_glyphs'>, assets: ObservationAssets = {}) {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (!user || glyph.user_id !== user.id) throw new Error('Sign in to submit your own observation.');
  const id = glyph.id || crypto.randomUUID();
  const uploaded: { bucket: string; path: string }[] = [];
  let persisted = false;
  let drawingPath: string | null = null;
  const { data: existing, error: existingError } = await supabase.from('registry_glyphs').select('*').eq('id', id).maybeSingle();
  if (existingError) throw existingError;
  let insertedGlyph = existing;
  try {
    if (!insertedGlyph) {
      const photos = await Promise.all((assets.stimulusPhotos || []).map(async photo => {
        const blob = photo instanceof File ? photo : await (await fetch(photo.data)).blob();
        return { blob, type: photo.type };
      }));
      const validation = stimulusPhotoError(photos.map(photo => ({ size: photo.blob.size, type: photo.type })));
      if (validation) throw new Error(validation);
      const paths = [...(glyph.stimulus_photo_paths || [])];
      const timestamp = Date.now();
      for (const [n, photo] of photos.entries()) {
        const extension = photo.type === 'image/jpeg' ? 'jpg' : photo.type === 'image/heic' ? 'heic' : 'png';
        const path = `${user.id}/${timestamp}-${n}.${extension}`;
        const { error } = await supabase.storage.from('stimulus-photos').upload(path, photo.blob, { contentType: photo.type });
        if (error) throw error;
        uploaded.push({ bucket: 'stimulus-photos', path });
        paths.push(path);
      }
      if (assets.uploadDrawing && glyph.image_data) {
        const blob = await (await fetch(glyph.image_data)).blob();
        drawingPath = `${user.id}/${id}.png`;
        const { error } = await supabase.storage.from('symbol-drawings').upload(drawingPath, blob, { contentType: 'image/png', upsert: true });
        if (error) throw error;
        uploaded.push({ bucket: 'symbol-drawings', path: drawingPath });
      }
      const { data, error } = await supabase.from('registry_glyphs')
        .insert({ ...glyph, id, stimulus_photo_paths: paths }).select().single();
      if (error) throw error;
      insertedGlyph = data;
    }
    persisted = true;
    if (!insertedGlyph) throw new Error('The observation was not returned.');
    if (assets.uploadDrawing && insertedGlyph.image_data) {
      drawingPath = drawingPath || `${user.id}/${id}.png`;
      const { data: { publicUrl } } = supabase.storage.from('symbol-drawings').getPublicUrl(drawingPath);
      const { data, error } = await supabase.from('symbol_submissions').update({ image_url: publicUrl })
        .eq('registry_glyph_id', id).eq('user_id', user.id).select('id').single();
      if (error || !data) throw error || new Error('The paired drawing was not saved.');
    }
    const { data: submission, error } = await supabase.from('symbol_submissions').select('*').eq('registry_glyph_id', id).single();
    if (error || !submission) throw error || new Error('The paired submission was not returned.');
    return { glyph: insertedGlyph, submission };
  } catch (error) {
    if (!persisted) await Promise.all(uploaded.map(file => supabase.storage.from(file.bucket).remove([file.path])));
    throw error;
  }
}
