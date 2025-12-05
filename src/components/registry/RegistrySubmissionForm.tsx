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
import { DuplicateDetection } from './DuplicateDetection';

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
    notes: '',
    timeSinceAppearance: '',
    clarityRating: 3,
    confidenceRating: 3,
    symbolRecurrence: '',
    lightingConditions: '',
    bodyPosition: ''
  });
  const [drawingStartTime, setDrawingStartTime] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDuplicateCheck, setShowDuplicateCheck] = useState(false);
  const [isPreview, setIsPreview] = useState(false);

  const handlePreview = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!imageData) {
      toast.error('Please draw a symbol first');
      return;
    }

    if (!formData.source) {
      toast.error('Please specify the source');
      return;
    }

    setIsPreview(true);
    setShowDuplicateCheck(true);
  };

  const handleDuplicateDecision = async (decision: 'same' | 'similar' | 'unique', matchedId?: string) => {
    if (decision === 'same' && matchedId) {
      // Add validation to existing symbol
      const { data: userData } = await supabase.auth.getUser();
      await supabase.from('registry_confirmations').insert({
        glyph_id: matchedId,
        user_id: userData.user?.id || null,
        session_id: `session_${Date.now()}`,
        confirmation_type: 'exact'
      });
      
      // Update count
      const { data: glyph } = await supabase
        .from('registry_glyphs')
        .select('confirmation_count')
        .eq('id', matchedId)
        .single();
      
      if (glyph) {
        await supabase
          .from('registry_glyphs')
          .update({ confirmation_count: glyph.confirmation_count + 1 })
          .eq('id', matchedId);
      }

      toast.success('Added validation to existing symbol!');
      resetForm();
      return;
    }

    // Continue with submission for unique/similar
    await submitSymbol();
  };

  const submitSymbol = async () => {
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
      
      const drawingDuration = drawingStartTime ? Math.floor((Date.now() - drawingStartTime) / 1000) : null;

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
        voice_note_url: voiceNoteUrl,
        time_since_appearance: formData.timeSinceAppearance || null,
        drawing_duration_seconds: drawingDuration,
        clarity_rating: formData.clarityRating,
        confidence_rating: formData.confidenceRating,
        symbol_recurrence: formData.symbolRecurrence || null,
        lighting_conditions: formData.lightingConditions || null,
        body_position: formData.bodyPosition || null
      });

      if (error) throw error;

      toast.success(`Symbol ${symbolId} added. Star similar ones in gallery!`);
      resetForm();
      
    } catch (error) {
      console.error('Submission error:', error);
      toast.error('Failed to submit symbol');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setImageData('');
    setVoiceNote(null);
    setDrawingStartTime(null);
    setIsPreview(false);
    setShowDuplicateCheck(false);
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
      notes: '',
      timeSinceAppearance: '',
      clarityRating: 3,
      confidenceRating: 3,
      symbolRecurrence: '',
      lightingConditions: '',
      bodyPosition: ''
    });
    localStorage.removeItem('dmtcode-canvas-draft');
  };

  return (
    <section id="submit" className="container mx-auto px-4 py-16">
      <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Submit a New Symbol</h2>
      
      <Card className="max-w-4xl mx-auto p-8 bg-card border-border">
        {showDuplicateCheck ? (
          <DuplicateDetection 
            currentImage={imageData}
            onDecision={handleDuplicateDecision}
          />
        ) : (
        <form onSubmit={handlePreview} className="space-y-8" id="metadata-form">
          {/* Canvas */}
          <div>
            <Label className="text-lg mb-4 block">Draw Symbol (400 × 400 px, exports to 800 × 800 px)</Label>
            <FabricDrawingCanvas
              onImageChange={(data) => {
                setImageData(data);
                if (!drawingStartTime && data) {
                  setDrawingStartTime(Date.now());
                }
              }}
              onFirstStroke={() => {
                if (!drawingStartTime) {
                  setDrawingStartTime(Date.now());
                }
              }}
            />
            <p className="text-sm text-muted-foreground mt-2">
              White background, brush sizes: 1px, 3px, 5px, 8px. Colors: black · white · red · gold. Auto-saves every 30 seconds.
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
                  <SelectItem value="yes">Yes: felt intentional</SelectItem>
                  <SelectItem value="no">No: purely visual</SelectItem>
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

            <div>
              <Label htmlFor="timeSince">Time Since Symbol Appeared</Label>
              <Select value={formData.timeSinceAppearance} onValueChange={(val) => setFormData({...formData, timeSinceAppearance: val})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="<5min">Less than 5 minutes</SelectItem>
                  <SelectItem value="5-15min">5-15 minutes</SelectItem>
                  <SelectItem value="15-30min">15-30 minutes</SelectItem>
                  <SelectItem value="30min-1hr">30 minutes - 1 hour</SelectItem>
                  <SelectItem value="1-6hr">1-6 hours</SelectItem>
                  <SelectItem value="next-day">Next day</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="clarity">How Clearly Did You See This? (1-5)</Label>
              <Input
                id="clarity"
                type="range"
                min="1"
                max="5"
                value={formData.clarityRating}
                onChange={(e) => setFormData({...formData, clarityRating: parseInt(e.target.value)})}
                className="w-full"
              />
              <div className="text-center text-sm text-muted-foreground">{formData.clarityRating}/5</div>
            </div>

            <div>
              <Label htmlFor="confidence">Confidence in This Drawing (1-5)</Label>
              <Input
                id="confidence"
                type="range"
                min="1"
                max="5"
                value={formData.confidenceRating}
                onChange={(e) => setFormData({...formData, confidenceRating: parseInt(e.target.value)})}
                className="w-full"
              />
              <div className="text-center text-sm text-muted-foreground">{formData.confidenceRating}/5</div>
            </div>

            <div>
              <Label htmlFor="recurrence">Symbol Recurrence</Label>
              <Select value={formData.symbolRecurrence} onValueChange={(val) => setFormData({...formData, symbolRecurrence: val})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select recurrence" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="first-time">First time seeing this</SelectItem>
                  <SelectItem value="same-session">Same session</SelectItem>
                  <SelectItem value="previous-sessions">Previous sessions</SelectItem>
                  <SelectItem value="multiple-sessions">Multiple sessions</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="lighting">Lighting Conditions</Label>
              <Select value={formData.lightingConditions} onValueChange={(val) => setFormData({...formData, lightingConditions: val})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select lighting" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="dim">Dim</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="bright">Bright</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="bodyPosition">Body Position</Label>
              <Select value={formData.bodyPosition} onValueChange={(val) => setFormData({...formData, bodyPosition: val})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select position" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lying">Lying down</SelectItem>
                  <SelectItem value="sitting">Sitting</SelectItem>
                  <SelectItem value="reclining">Reclining</SelectItem>
                  <SelectItem value="standing">Standing</SelectItem>
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
            <Label htmlFor="tags">Motif Tags (select all that apply)</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 p-4 border border-border rounded-md max-h-64 overflow-y-auto">
              {[
                'alphabetic', 'numeric', 'geometric', 'organic', 'fractal', 'mandala',
                'spiral', 'grid', 'lattice', 'honeycomb', 'crystalline', 'flowing',
                'angular', 'curved', 'symmetrical', 'asymmetrical', 'repeating', 'unique',
                'pareidolia', 'speckle', 'gematria', 'hieroglyphic', 'runic', 'sanskrit-like',
                'aramaic-like', 'cuneiform-like', 'archetypal', 'abstract', 'instructional', 'decorative'
              ].map((tag) => {
                const isSelected = formData.tags.split(',').map(t => t.trim()).includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => {
                      const currentTags = formData.tags.split(',').map(t => t.trim()).filter(t => t);
                      if (isSelected) {
                        setFormData({
                          ...formData,
                          tags: currentTags.filter(t => t !== tag).join(', ')
                        });
                      } else {
                        setFormData({
                          ...formData,
                          tags: [...currentTags, tag].join(', ')
                        });
                      }
                    }}
                    className={`px-3 py-2 text-sm rounded border transition-all ${
                      isSelected 
                        ? 'bg-primary text-primary-foreground border-primary' 
                        : 'bg-background border-border hover:border-primary/50'
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Select multiple tags that describe the visual motifs in your symbol
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
            aria-label="Preview and check for duplicates"
          >
            Preview & Check Duplicates
          </Button>
        </form>
        )}
      </Card>
    </section>
  );
};
