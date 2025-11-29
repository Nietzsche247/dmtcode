import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { FabricDrawingCanvas } from './FabricCanvas';
import { VoiceNoteRecorder } from './VoiceNoteRecorder';
import { Checkbox } from '@/components/ui/checkbox';

export const RegistrySubmissionForm = () => {
  const [imageData, setImageData] = useState<string>('');
  const [voiceNote, setVoiceNote] = useState<Blob | null>(null);
  const [formData, setFormData] = useState({
    source: '',
    route: '',
    dose: '',
    surface: '',
    color: '',
    depth: '',
    motion: '',
    valence: '',
    intent: '',
    priorExposure: false,
    symmetry: '',
    tags: '',
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!imageData) {
      toast.error('Please draw a symbol first');
      return;
    }

    if (!formData.source) {
      toast.error('Please specify the source');
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: userData } = await supabase.auth.getUser();
      
      // Generate symbol ID with user initials
      const userEmail = userData.user?.email || 'anon';
      const initials = userEmail.split('@')[0].substring(0, 3).toUpperCase();
      const timestamp = Date.now().toString().slice(-4);
      const symbolId = `S${timestamp}-${initials}`;

      // Upload voice note if exists
      let voiceNoteUrl = null;
      if (voiceNote && userData.user?.id) {
        const fileName = `${userData.user.id}/${symbolId}-voice.webm`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('glyphs')
          .upload(fileName, voiceNote);

        if (!uploadError && uploadData) {
          const { data: urlData } = supabase.storage
            .from('glyphs')
            .getPublicUrl(fileName);
          voiceNoteUrl = urlData.publicUrl;
        }
      }
      
      const { error } = await supabase.from('registry_glyphs').insert({
        user_id: userData.user?.id || null,
        image_data: imageData,
        source: formData.source,
        route_of_administration: formData.route || null,
        approximate_dose: formData.dose || null,
        perceived_surface: formData.surface || null,
        depth: formData.depth || null,
        motion: formData.motion || null,
        emotional_valence: formData.valence || null,
        communicative_intent: formData.intent || null,
        prior_exposure: formData.priorExposure,
        symmetry: formData.symmetry || null,
        motif_tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : [],
        free_text_notes: formData.notes || null,
        voice_note_url: voiceNoteUrl
      });

      if (error) throw error;

      toast.success(`Symbol ${symbolId} added—star similar ones in gallery!`);
      
      // Reset form
      setImageData('');
      setVoiceNote(null);
      setFormData({
        source: '',
        route: '',
        dose: '',
        surface: '',
        color: '',
        depth: '',
        motion: '',
        valence: '',
        intent: '',
        priorExposure: false,
        symmetry: '',
        tags: '',
        notes: ''
      });
      
    } catch (error) {
      console.error('Submission error:', error);
      toast.error('Failed to submit symbol');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="submit" className="container mx-auto px-4 py-16">
      <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Submit a New Symbol</h2>
      
      <Card className="max-w-4xl mx-auto p-8 bg-card border-border">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Canvas */}
          <div>
            <Label className="text-lg mb-4 block">Draw Symbol (100 × 100 px)</Label>
            <FabricDrawingCanvas onImageChange={setImageData} />
            <p className="text-sm text-muted-foreground mt-2">
              White background, 3 px brush. Available colors: black · white · red · gold
            </p>
          </div>

          {/* Metadata Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="source">Source *</Label>
              <Select value={formData.source} onValueChange={(val) => setFormData({...formData, source: val})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="650nm-laser">650 nm laser exposure</SelectItem>
                  <SelectItem value="dmt-smoked">N,N-DMT (smoked/vaporised)</SelectItem>
                  <SelectItem value="dmt-injected">N,N-DMT (intramuscular)</SelectItem>
                  <SelectItem value="dmt-other">N,N-DMT (other route)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="route">Route of Administration</Label>
              <Input
                id="route"
                value={formData.route}
                onChange={(e) => setFormData({...formData, route: e.target.value})}
                placeholder="e.g., vaporised, intramuscular"
              />
            </div>

            <div>
              <Label htmlFor="dose">Approximate Dose</Label>
              <Select value={formData.dose} onValueChange={(val) => setFormData({...formData, dose: val})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select dose level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sub-threshold">Sub-threshold</SelectItem>
                  <SelectItem value="breakthrough">Breakthrough</SelectItem>
                  <SelectItem value="megadose">Megadose</SelectItem>
                  <SelectItem value="unknown">Unknown</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="surface">Perceived Surface</Label>
              <Select value={formData.surface} onValueChange={(val) => setFormData({...formData, surface: val})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select surface" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="wall">Wall</SelectItem>
                  <SelectItem value="ceiling">Ceiling</SelectItem>
                  <SelectItem value="eyelids">Eyelids (closed eyes)</SelectItem>
                  <SelectItem value="toilet-bowl">Toilet bowl</SelectItem>
                  <SelectItem value="hand">Hand/skin</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="color">Symbol Color</Label>
              <Select value={formData.color} onValueChange={(val) => setFormData({...formData, color: val})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select color" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="red">Red</SelectItem>
                  <SelectItem value="emerald">Emerald green</SelectItem>
                  <SelectItem value="shifting">Shifting/multi-color</SelectItem>
                  <SelectItem value="sand">Sand/beige</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="depth">Depth Perception</Label>
              <Select value={formData.depth} onValueChange={(val) => setFormData({...formData, depth: val})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select depth" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2d">2D (flat)</SelectItem>
                  <SelectItem value="3d">3D (depth)</SelectItem>
                  <SelectItem value="4d-morph">4D morphing</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="motion">Motion Pattern</Label>
              <Select value={formData.motion} onValueChange={(val) => setFormData({...formData, motion: val})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select motion" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="static">Static</SelectItem>
                  <SelectItem value="pulsing">Pulsing</SelectItem>
                  <SelectItem value="scrolling">Scrolling/moving</SelectItem>
                  <SelectItem value="morphing">Morphing</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="valence">Emotional Tone</Label>
              <Select value={formData.valence} onValueChange={(val) => setFormData({...formData, valence: val})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select emotional tone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="instructional">Instructional</SelectItem>
                  <SelectItem value="benevolent">Benevolent</SelectItem>
                  <SelectItem value="neutral">Neutral</SelectItem>
                  <SelectItem value="unsettling">Unsettling</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="intent">Communicative Intent</Label>
              <Select value={formData.intent} onValueChange={(val) => setFormData({...formData, intent: val})}>
                <SelectTrigger>
                  <SelectValue placeholder="Perceived communication" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes—felt intentional</SelectItem>
                  <SelectItem value="no">No—purely visual</SelectItem>
                  <SelectItem value="uncertain">Uncertain</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="symmetry">Symmetry</Label>
              <Select value={formData.symmetry} onValueChange={(val) => setFormData({...formData, symmetry: val})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select symmetry" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="bilateral">Bilateral</SelectItem>
                  <SelectItem value="radial">Radial</SelectItem>
                  <SelectItem value="perfect">Perfect geometric</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox 
                id="prior" 
                checked={formData.priorExposure}
                onCheckedChange={(checked) => setFormData({...formData, priorExposure: checked as boolean})}
              />
              <Label htmlFor="prior" className="cursor-pointer">Prior exposure to this symbol</Label>
            </div>
          </div>

          <div>
            <Label htmlFor="tags">Motif Tags (comma-separated)</Label>
            <Input
              id="tags"
              value={formData.tags}
              onChange={(e) => setFormData({...formData, tags: e.target.value})}
              placeholder="e.g., alphabetic, geometric, spiral, toilet bowl sand"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Suggested: alphabetic, geometric, spiral, fractal, organic, or custom tags
            </p>
          </div>

          <div>
            <Label>Voice Note (Optional)</Label>
            <VoiceNoteRecorder onRecordingChange={setVoiceNote} />
          </div>

          <div>
            <Label htmlFor="notes">Additional Free-Text Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              placeholder="Any additional context, sensations, or observations"
              rows={4}
            />
          </div>

          <Button 
            type="submit" 
            size="lg" 
            className="w-full" 
            disabled={isSubmitting}
            aria-label="Submit glyph symbol to registry"
          >
            {isSubmitting ? 'Submitting...' : 'Add to Registry'}
          </Button>
        </form>
      </Card>
    </section>
  );
};
