import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { FabricDrawingCanvas } from './FabricCanvas';
import { ChevronRight, ChevronLeft, Award } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

type Step = 0 | 1 | 2 | 3 | 4 | 5 | 6;

interface FormData {
  // Priming control
  primingExposure: 'priming_none' | 'priming_matrix_only' | 'priming_laser_exposed' | '';
  
  imageData: string;
  observationMethod: '650nm_laser' | 'closed_eyes' | 'other' | '';

  // 650nm Laser fields
  wavelength: 'wavelength_650' | 'wavelength_red_other' | 'wavelength_blue' | 'wavelength_green' | 'wavelength_white' | 'wavelength_other' | '';
  wavelengthOther: string;
  locationType: 'indoor' | 'outdoor' | '';
  roomTypes: string[];
  outdoorSettings: string[];
  roomTypeOther: string;
  outdoorSettingOther: string;
  surface: string;
  timeOfDay: string;

  // Closed eyes fields
  closedEyesMethod: string;
  eyesState: string;

  // Other method
  otherMethodText: string;

  // Symbol description
  formTypes: string[];
  geometricShapes: string[];
  letterLikeStyles: string[];
  culturalStyles: string[];
  symmetry: string;
  colors: string[];

  // Optional details
  movements: string[];
  sizeImpression: string;
  customTags: string;
  description: string;
}

export const LayeredSubmissionForm = () => {
  const [step, setStep] = useState<Step>(0);
  const [drawingStartTime, setDrawingStartTime] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [totalSymbols, setTotalSymbols] = useState(0);
  const [userStats, setUserStats] = useState<any>(null);
  const [similarSymbols, setSimilarSymbols] = useState<any[]>([]);
  const [newBadges, setNewBadges] = useState<string[]>([]);

  const [formData, setFormData] = useState<FormData>({
    primingExposure: '',
    imageData: '',
    observationMethod: '',
    wavelength: '',
    wavelengthOther: '',
    locationType: '',
    roomTypes: [],
    outdoorSettings: [],
    roomTypeOther: '',
    outdoorSettingOther: '',
    surface: '',
    timeOfDay: '',
    closedEyesMethod: '',
    eyesState: '',
    otherMethodText: '',
    formTypes: [],
    geometricShapes: [],
    letterLikeStyles: [],
    culturalStyles: [],
    symmetry: '',
    colors: [],
    movements: [],
    sizeImpression: '',
    customTags: '',
    description: ''
  });

  useEffect(() => {
    checkUser();
    loadTotalSymbols();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUserId(user.id);
      loadUserStats(user.id);
    }
  };

  const loadUserStats = async (uid: string) => {
    const { data } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', uid)
      .single();
    setUserStats(data);
  };

  const loadTotalSymbols = async () => {
    const { count } = await supabase
      .from('registry_glyphs')
      .select('*', { count: 'exact', head: true });
    setTotalSymbols(count || 0);
  };

  const handleNext = () => {
    if (step === 0 && !formData.primingExposure) {
      toast.error('Please answer the priming question');
      return;
    }
    if (step === 1 && !formData.imageData) {
      toast.error('Please draw a symbol first');
      return;
    }
    if (step === 2 && !formData.observationMethod) {
      toast.error('Please select an observation method');
      return;
    }
    if (step === 3) {
      // Validate context fields
      if (formData.observationMethod === '650nm_laser') {
        if (!formData.wavelength) {
          toast.error('Please select a wavelength');
          return;
        }
        if (!formData.surface) {
          toast.error('Please specify the projection surface');
          return;
        }
      }
      if (formData.observationMethod === 'closed_eyes' && !formData.closedEyesMethod) {
        toast.error('Please specify the method');
        return;
      }
      if (formData.observationMethod === 'other' && !formData.otherMethodText) {
        toast.error('Please describe your observation method');
        return;
      }
    }
    if (step === 4 && formData.formTypes.length === 0) {
      toast.error('Please select at least one form type');
      return;
    }
    
    setStep((prev) => Math.min(6, prev + 1) as Step);
  };

  const handleBack = () => {
    setStep((prev) => Math.max(0, prev - 1) as Step);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      const drawingDuration = drawingStartTime ? Math.floor((Date.now() - drawingStartTime) / 1000) : null;
      
      // Build tags from all selections
      const tags = [
        formData.primingExposure,
        formData.observationMethod,
        formData.wavelength,
        formData.wavelengthOther ? `wavelength_${formData.wavelengthOther}nm` : null,
        formData.locationType,
        ...formData.roomTypes,
        formData.roomTypeOther ? `room_${formData.roomTypeOther}` : null,
        ...formData.outdoorSettings,
        formData.outdoorSettingOther ? `outdoor_${formData.outdoorSettingOther}` : null,
        formData.surface,
        formData.timeOfDay,
        formData.closedEyesMethod,
        formData.eyesState,
        ...formData.formTypes,
        ...formData.geometricShapes,
        ...formData.letterLikeStyles,
        ...formData.culturalStyles,
        formData.symmetry,
        ...formData.colors,
        ...formData.movements,
        formData.sizeImpression,
        ...formData.customTags.split(',').map(t => t.trim())
      ].filter(Boolean);

      const { data: insertedGlyph, error } = await supabase
        .from('registry_glyphs')
        .insert({
          user_id: userId,
          image_data: formData.imageData,
          source: formData.observationMethod,
          perceived_surface: formData.surface || null,
          symmetry: formData.symmetry || null,
          motif_tags: tags,
          free_text_notes: formData.description || null,
          drawing_duration_seconds: drawingDuration
        })
        .select()
        .single();

      if (error) throw error;

      // Check for new badges
      await checkBadges();

      // Load similar symbols
      await loadSimilarSymbols(tags.slice(0, 5));

      toast.success(`Symbol #${totalSymbols + 1} submitted!`);
      setStep(6);
      
    } catch (error) {
      console.error('Submission error:', error);
      toast.error('Failed to submit symbol');
    } finally {
      setIsSubmitting(false);
    }
  };

  const checkBadges = async () => {
    if (!userId || !userStats) return;

    const newSubmissions = (userStats?.total_submissions || 0) + 1;
    const earnedBadges: string[] = [];

    // Award "Primacy Validated" badge for no priming
    if (formData.primingExposure === 'priming_none') {
      earnedBadges.push('primacy_validated');
    }

    // Award "Spectrum Hunter" badge for non-650nm wavelength
    if (formData.wavelength && formData.wavelength !== 'wavelength_650') {
      earnedBadges.push('spectrum_hunter');
    }

    const badgeThresholds = [
      { name: 'first_symbol', threshold: 1 },
      { name: 'contributor', threshold: 5 },
      { name: 'researcher', threshold: 10 },
      { name: 'data_scientist', threshold: 25 },
      { name: 'archive_builder', threshold: 50 },
      { name: 'pattern_master', threshold: 100 }
    ];

    for (const badge of badgeThresholds) {
      if (newSubmissions === badge.threshold) {
        const { error } = await supabase
          .from('user_badges')
          .insert({
            user_id: userId,
            badge_name: badge.name
          });
        
        if (!error) {
          earnedBadges.push(badge.name);
        }
      }
    }

    setNewBadges(earnedBadges);
  };

  const loadSimilarSymbols = async (tags: string[]) => {
    const { data } = await supabase
      .from('registry_glyphs')
      .select('id, image_data, confirmation_count, motif_tags')
      .order('confirmation_count', { ascending: false })
      .limit(3);
    
    if (data) {
      setSimilarSymbols(data);
    }
  };

  const resetForm = () => {
    setFormData({
      primingExposure: '',
      imageData: '',
      observationMethod: '',
      wavelength: '',
      wavelengthOther: '',
      locationType: '',
      roomTypes: [],
      outdoorSettings: [],
      roomTypeOther: '',
      outdoorSettingOther: '',
      surface: '',
      timeOfDay: '',
      closedEyesMethod: '',
      eyesState: '',
      otherMethodText: '',
      formTypes: [],
      geometricShapes: [],
      letterLikeStyles: [],
      culturalStyles: [],
      symmetry: '',
      colors: [],
      movements: [],
      sizeImpression: '',
      customTags: '',
      description: ''
    });
    setStep(0);
    setDrawingStartTime(null);
    setSimilarSymbols([]);
    setNewBadges([]);
    localStorage.removeItem('dmtcode-canvas-draft');
    loadTotalSymbols();
    if (userId) loadUserStats(userId);
  };

  const toggleArrayItem = (arr: string[], item: string) => {
    return arr.includes(item) ? arr.filter(i => i !== item) : [...arr, item];
  };

  return (
    <section id="submit" className="container mx-auto px-4 py-16">
      <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Submit a New Symbol</h2>
      
      <Card className="max-w-4xl mx-auto p-8 bg-card border-border">
        {/* Progress indicator */}
        <div className="flex justify-center items-center gap-2 mb-8">
          {[0, 1, 2, 3, 4, 5].map((s) => (
            <div 
              key={s}
              className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${
                s === step ? 'bg-primary text-primary-foreground' :
                s < step ? 'bg-primary/50 text-primary-foreground' :
                'bg-muted text-muted-foreground'
              }`}
            >
              {s === 0 ? '?' : s}
            </div>
          ))}
        </div>

        {/* Step 0: Priming Control */}
        {step === 0 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-4">Before You Begin: Priming Control</h3>
              <p className="text-sm text-muted-foreground mb-6">
                This question helps us understand whether your experience was influenced by prior exposure to similar visual content.
              </p>
            </div>
            
            <div className="space-y-4">
              <Label className="text-base font-medium">
                Before your experience, had you ever seen Danny Goler videos, The Discovery trailer, or Matrix-style digital rain? *
              </Label>
              <RadioGroup
                value={formData.primingExposure}
                onValueChange={(value) => setFormData(prev => ({ 
                  ...prev, 
                  primingExposure: value as FormData['primingExposure']
                }))}
              >
                <div className="flex items-center space-x-2 p-4 border border-border rounded-lg hover:border-primary/50 transition-colors">
                  <RadioGroupItem value="priming_none" id="priming_none" />
                  <Label htmlFor="priming_none" className="flex-1 cursor-pointer">
                    <span className="font-medium block mb-1">No – I had never seen any of it</span>
                    <span className="text-sm text-muted-foreground">No prior exposure to laser protocol videos or Matrix-style rain</span>
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2 p-4 border border-border rounded-lg hover:border-primary/50 transition-colors">
                  <RadioGroupItem value="priming_matrix_only" id="priming_matrix_only" />
                  <Label htmlFor="priming_matrix_only" className="flex-1 cursor-pointer">
                    <span className="font-medium block mb-1">Yes – but only Matrix-style rain, not laser-specific</span>
                    <span className="text-sm text-muted-foreground">Seen Matrix digital rain effect but no DMT laser protocol content</span>
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2 p-4 border border-border rounded-lg hover:border-primary/50 transition-colors">
                  <RadioGroupItem value="priming_laser_exposed" id="priming_laser_exposed" />
                  <Label htmlFor="priming_laser_exposed" className="flex-1 cursor-pointer">
                    <span className="font-medium block mb-1">Yes – I had watched Goler or Discovery trailer content</span>
                    <span className="text-sm text-muted-foreground">Seen Danny Goler videos or The Discovery trailer before my experience</span>
                  </Label>
                </div>
              </RadioGroup>

              {formData.primingExposure === 'priming_none' && (
                <Card className="p-4 bg-primary/5 border-primary/20">
                  <div className="flex items-center gap-2 text-sm text-gold">
                    <Award className="w-5 h-5" />
                    <span className="font-medium">
                      You'll earn the "Primacy Validated" badge for contributing a baseline observation!
                    </span>
                  </div>
                </Card>
              )}
            </div>
            
            <div className="flex justify-end">
              <Button onClick={handleNext} disabled={!formData.primingExposure}>
                Next: Draw Symbol <ChevronRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 1: Draw Symbol */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-4">Step 1: Draw Symbol (30 seconds)</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Draw the symbol as accurately as you remember it. Take about 30 seconds.
              </p>
            </div>
            
            <FabricDrawingCanvas
              onImageChange={(data) => {
                setFormData(prev => ({ ...prev, imageData: data }));
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
            
            <div className="flex justify-between">
              <Button variant="outline" onClick={handleBack}>
                <ChevronLeft className="mr-2 w-4 h-4" /> Back
              </Button>
              <Button onClick={handleNext} disabled={!formData.imageData}>
                Next: Observation Method <ChevronRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Observation Method */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-4">Step 2: Observation Method (10 seconds)</h3>
              <p className="text-sm text-muted-foreground mb-6">
                How did you observe this symbol?
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card 
                className={`p-6 cursor-pointer transition-all hover:border-primary ${
                  formData.observationMethod === '650nm_laser' ? 'border-primary bg-primary/5' : ''
                }`}
                onClick={() => setFormData(prev => ({ ...prev, observationMethod: '650nm_laser' }))}
              >
                <div className="text-center">
                  <div className="text-3xl mb-2">🔴</div>
                  <h4 className="font-semibold mb-2">650nm Laser Protocol</h4>
                  <p className="text-xs text-muted-foreground">During laser exposure</p>
                </div>
              </Card>

              <Card 
                className={`p-6 cursor-pointer transition-all hover:border-primary ${
                  formData.observationMethod === 'closed_eyes' ? 'border-primary bg-primary/5' : ''
                }`}
                onClick={() => setFormData(prev => ({ ...prev, observationMethod: 'closed_eyes' }))}
              >
                <div className="text-center">
                  <div className="text-3xl mb-2">👁️</div>
                  <h4 className="font-semibold mb-2">Closed Eyes</h4>
                  <p className="text-xs text-muted-foreground">During altered state</p>
                </div>
              </Card>

              <Card 
                className={`p-6 cursor-pointer transition-all hover:border-primary ${
                  formData.observationMethod === 'other' ? 'border-primary bg-primary/5' : ''
                }`}
                onClick={() => setFormData(prev => ({ ...prev, observationMethod: 'other' }))}
              >
                <div className="text-center">
                  <div className="text-3xl mb-2">✨</div>
                  <h4 className="font-semibold mb-2">Other</h4>
                  <p className="text-xs text-muted-foreground">Different method</p>
                </div>
              </Card>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={handleBack}>
                <ChevronLeft className="mr-2 w-4 h-4" /> Back
              </Button>
              <Button onClick={handleNext} disabled={!formData.observationMethod}>
                Next: Context <ChevronRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Context (conditional based on method) */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-4">Step 3: Context & Location</h3>
            </div>

            {/* 650nm Laser Context */}
            {formData.observationMethod === '650nm_laser' && (
              <div className="space-y-6">
                <div>
                  <Label className="text-base mb-3 block font-medium">Wavelength *</Label>
                  <RadioGroup 
                    value={formData.wavelength} 
                    onValueChange={(val: any) => setFormData(prev => ({ ...prev, wavelength: val }))}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2 p-3 border border-border rounded-lg hover:border-primary/50 transition-colors">
                        <RadioGroupItem value="wavelength_650" id="wavelength_650" />
                        <Label htmlFor="wavelength_650" className="flex-1 cursor-pointer">
                          <span className="font-medium">650 nm red (classic protocol)</span>
                        </Label>
                      </div>
                      
                      <div className="flex items-center space-x-2 p-3 border border-border rounded-lg hover:border-primary/50 transition-colors">
                        <RadioGroupItem value="wavelength_red_other" id="wavelength_red_other" />
                        <Label htmlFor="wavelength_red_other" className="flex-1 cursor-pointer">
                          <span className="font-medium">630–670 nm (other red)</span>
                        </Label>
                      </div>
                      
                      <div className="flex items-center space-x-2 p-3 border border-border rounded-lg hover:border-primary/50 transition-colors">
                        <RadioGroupItem value="wavelength_blue" id="wavelength_blue" />
                        <Label htmlFor="wavelength_blue" className="flex-1 cursor-pointer">
                          <span className="font-medium">Blue laser</span>
                        </Label>
                      </div>
                      
                      <div className="flex items-center space-x-2 p-3 border border-border rounded-lg hover:border-primary/50 transition-colors">
                        <RadioGroupItem value="wavelength_green" id="wavelength_green" />
                        <Label htmlFor="wavelength_green" className="flex-1 cursor-pointer">
                          <span className="font-medium">Green laser</span>
                        </Label>
                      </div>
                      
                      <div className="flex items-center space-x-2 p-3 border border-border rounded-lg hover:border-primary/50 transition-colors">
                        <RadioGroupItem value="wavelength_white" id="wavelength_white" />
                        <Label htmlFor="wavelength_white" className="flex-1 cursor-pointer">
                          <span className="font-medium">White light / LED panel</span>
                        </Label>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2 p-3 border border-border rounded-lg hover:border-primary/50 transition-colors">
                          <RadioGroupItem value="wavelength_other" id="wavelength_other" />
                          <Label htmlFor="wavelength_other" className="flex-1 cursor-pointer">
                            <span className="font-medium">Other wavelength</span>
                          </Label>
                        </div>
                        {formData.wavelength === 'wavelength_other' && (
                          <Input 
                            placeholder="Specify wavelength in nm (e.g., 532)"
                            value={formData.wavelengthOther}
                            onChange={(e) => setFormData(prev => ({ ...prev, wavelengthOther: e.target.value }))}
                            className="ml-6"
                          />
                        )}
                      </div>
                    </div>
                  </RadioGroup>

                  {formData.wavelength && formData.wavelength !== 'wavelength_650' && (
                    <Card className="p-4 bg-primary/5 border-primary/20 mt-4">
                      <div className="flex items-center gap-2 text-sm text-gold">
                        <Award className="w-5 h-5" />
                        <span className="font-medium">
                          You'll earn the "Spectrum Hunter" badge for testing non-standard wavelengths!
                        </span>
                      </div>
                    </Card>
                  )}
                </div>

                <div>
                  <Label className="text-base mb-3 block">Location Type</Label>
                  <RadioGroup 
                    value={formData.locationType} 
                    onValueChange={(val: any) => setFormData(prev => ({ ...prev, locationType: val }))}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="indoor" id="indoor" />
                      <Label htmlFor="indoor">Indoor</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="outdoor" id="outdoor" />
                      <Label htmlFor="outdoor">Outdoor</Label>
                    </div>
                  </RadioGroup>
                </div>

                {formData.locationType === 'indoor' && (
                  <div>
                    <Label className="text-base mb-3 block">Room Type (select all that apply)</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {['Living Room', 'Bedroom', 'Bathroom', 'Kitchen', 'Office', 'Basement'].map(room => (
                        <div key={room} className="flex items-center space-x-2">
                          <Checkbox 
                            id={room}
                            checked={formData.roomTypes.includes(room.toLowerCase().replace(' ', '_'))}
                            onCheckedChange={() => setFormData(prev => ({
                              ...prev,
                              roomTypes: toggleArrayItem(prev.roomTypes, room.toLowerCase().replace(' ', '_'))
                            }))}
                          />
                          <Label htmlFor={room}>{room}</Label>
                        </div>
                      ))}
                      <div className="col-span-2">
                        <Input 
                          placeholder="Other (specify)"
                          value={formData.roomTypeOther}
                          onChange={(e) => setFormData(prev => ({ ...prev, roomTypeOther: e.target.value }))}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {formData.locationType === 'outdoor' && (
                  <div>
                    <Label className="text-base mb-3 block">Outdoor Setting (select all that apply)</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {['Backyard', 'Park', 'Street', 'Forest', 'Beach'].map(setting => (
                        <div key={setting} className="flex items-center space-x-2">
                          <Checkbox 
                            id={setting}
                            checked={formData.outdoorSettings.includes(setting.toLowerCase())}
                            onCheckedChange={() => setFormData(prev => ({
                              ...prev,
                              outdoorSettings: toggleArrayItem(prev.outdoorSettings, setting.toLowerCase())
                            }))}
                          />
                          <Label htmlFor={setting}>{setting}</Label>
                        </div>
                      ))}
                      <div className="col-span-2">
                        <Input 
                          placeholder="Other (specify)"
                          value={formData.outdoorSettingOther}
                          onChange={(e) => setFormData(prev => ({ ...prev, outdoorSettingOther: e.target.value }))}
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <Label htmlFor="surface" className="text-base mb-3 block">Projection Surface *</Label>
                  <Input 
                    id="surface"
                    placeholder="e.g., wall, ceiling, hand, fabric"
                    value={formData.surface}
                    onChange={(e) => setFormData(prev => ({ ...prev, surface: e.target.value }))}
                  />
                </div>

                <div>
                  <Label className="text-base mb-3 block">Time of Day (optional)</Label>
                  <RadioGroup 
                    value={formData.timeOfDay} 
                    onValueChange={(val) => setFormData(prev => ({ ...prev, timeOfDay: val }))}
                  >
                    {['Daytime', 'Nighttime', 'Dawn', 'Dusk'].map(time => (
                      <div key={time} className="flex items-center space-x-2">
                        <RadioGroupItem value={time.toLowerCase()} id={time} />
                        <Label htmlFor={time}>{time}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              </div>
            )}

            {/* Closed Eyes Context */}
            {formData.observationMethod === 'closed_eyes' && (
              <div className="space-y-6">
                <div>
                  <Label htmlFor="method" className="text-base mb-3 block">Method</Label>
                  <select 
                    id="method"
                    className="w-full p-2 rounded-md border border-input bg-background"
                    value={formData.closedEyesMethod}
                    onChange={(e) => setFormData(prev => ({ ...prev, closedEyesMethod: e.target.value }))}
                  >
                    <option value="">Select method...</option>
                    <option value="dmt">N,N-DMT</option>
                    <option value="psilocybin">Psilocybin</option>
                    <option value="lsd">LSD</option>
                    <option value="meditation">Meditation</option>
                    <option value="hypnagogic">Hypnagogic state</option>
                    <option value="other_psychedelic">Other psychedelic</option>
                  </select>
                </div>

                <div>
                  <Label className="text-base mb-3 block">Eyes State</Label>
                  <RadioGroup 
                    value={formData.eyesState} 
                    onValueChange={(val) => setFormData(prev => ({ ...prev, eyesState: val }))}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="closed" id="closed" />
                      <Label htmlFor="closed">Closed</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="open_darkness" id="open_darkness" />
                      <Label htmlFor="open_darkness">Open in darkness</Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
            )}

            {/* Other Method Context */}
            {formData.observationMethod === 'other' && (
              <div>
                <Label htmlFor="otherMethod" className="text-base mb-3 block">Describe Your Observation Method</Label>
                <Textarea 
                  id="otherMethod"
                  placeholder='e.g., "Red light therapy 660nm" / "Prism refraction" / "Phosphene pressure"'
                  value={formData.otherMethodText}
                  onChange={(e) => setFormData(prev => ({ ...prev, otherMethodText: e.target.value }))}
                  rows={3}
                />
              </div>
            )}

            <div className="flex justify-between">
              <Button variant="outline" onClick={handleBack}>
                <ChevronLeft className="mr-2 w-4 h-4" /> Back
              </Button>
              <Button onClick={handleNext}>
                Next: Symbol Description <ChevronRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Symbol Description */}
        {step === 4 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-4">Step 4: Symbol Description (30 seconds)</h3>
            </div>

            <div>
              <Label className="text-base mb-3 block">Form Type (select all that apply)</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {['Geometric', 'Letter-like', 'Organic', 'Cultural', 'Abstract', 'Numeric'].map(type => (
                  <div key={type} className="flex items-center space-x-2">
                    <Checkbox 
                      id={type}
                      checked={formData.formTypes.includes(type.toLowerCase())}
                      onCheckedChange={() => setFormData(prev => ({
                        ...prev,
                        formTypes: toggleArrayItem(prev.formTypes, type.toLowerCase())
                      }))}
                    />
                    <Label htmlFor={type}>{type}</Label>
                  </div>
                ))}
              </div>
            </div>

            {formData.formTypes.includes('geometric') && (
              <div>
                <Label className="text-base mb-3 block">Specific Geometric Shapes</Label>
                <div className="grid grid-cols-3 gap-2">
                  {['Circle', 'Square', 'Triangle', 'Hexagon', 'Spiral', 'Cross', 'Line', 'Grid', 'Star', 'Wave', 'Chevron', 'Diamond', 'Arc', 'Dot Array', 'Pentagon', 'Octagon'].map(shape => (
                    <div key={shape} className="flex items-center space-x-2">
                      <Checkbox 
                        id={shape}
                        checked={formData.geometricShapes.includes(shape.toLowerCase())}
                        onCheckedChange={() => setFormData(prev => ({
                          ...prev,
                          geometricShapes: toggleArrayItem(prev.geometricShapes, shape.toLowerCase())
                        }))}
                      />
                      <Label htmlFor={shape} className="text-sm">{shape}</Label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {formData.formTypes.includes('letter-like') && (
              <div>
                <Label className="text-base mb-3 block">Resembles Which Script?</Label>
                <div className="grid grid-cols-2 gap-3">
                  {['Latin', 'Katakana', 'Cyrillic', 'Hebrew', 'Arabic', 'Runic', 'Sanskrit', 'Unknown'].map(script => (
                    <div key={script} className="flex items-center space-x-2">
                      <Checkbox 
                        id={script}
                        checked={formData.letterLikeStyles.includes(script.toLowerCase())}
                        onCheckedChange={() => setFormData(prev => ({
                          ...prev,
                          letterLikeStyles: toggleArrayItem(prev.letterLikeStyles, script.toLowerCase())
                        }))}
                      />
                      <Label htmlFor={script}>{script}</Label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {formData.formTypes.includes('cultural') && (
              <div>
                <Label className="text-base mb-3 block">Cultural Style</Label>
                <div className="grid grid-cols-2 gap-3">
                  {['Celtic Knot', 'Mandala', 'Lotus', 'Eye', 'Yin Yang', 'Flower', 'Gear', 'Other'].map(style => (
                    <div key={style} className="flex items-center space-x-2">
                      <Checkbox 
                        id={style}
                        checked={formData.culturalStyles.includes(style.toLowerCase().replace(' ', '_'))}
                        onCheckedChange={() => setFormData(prev => ({
                          ...prev,
                          culturalStyles: toggleArrayItem(prev.culturalStyles, style.toLowerCase().replace(' ', '_'))
                        }))}
                      />
                      <Label htmlFor={style}>{style}</Label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <Label className="text-base mb-3 block">Symmetry</Label>
              <RadioGroup 
                value={formData.symmetry} 
                onValueChange={(val) => setFormData(prev => ({ ...prev, symmetry: val }))}
              >
                {['Bilateral', 'Radial', 'Perfect', 'Asymmetric'].map(sym => (
                  <div key={sym} className="flex items-center space-x-2">
                    <RadioGroupItem value={sym.toLowerCase()} id={sym} />
                    <Label htmlFor={sym}>{sym}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div>
              <Label className="text-base mb-3 block">Colors (select all that apply)</Label>
              <div className="grid grid-cols-3 gap-3">
                {['Red', 'Orange', 'Yellow', 'Green', 'Teal', 'Blue', 'Purple', 'White', 'Black', 'Multicolor', 'Monochrome'].map(color => (
                  <div key={color} className="flex items-center space-x-2">
                    <Checkbox 
                      id={color}
                      checked={formData.colors.includes(color.toLowerCase())}
                      onCheckedChange={() => setFormData(prev => ({
                        ...prev,
                        colors: toggleArrayItem(prev.colors, color.toLowerCase())
                      }))}
                    />
                    <Label htmlFor={color}>{color}</Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={handleBack}>
                <ChevronLeft className="mr-2 w-4 h-4" /> Back
              </Button>
              <Button onClick={handleNext}>
                Next: Optional Details <ChevronRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 5: Optional Details */}
        {step === 5 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-4">Step 5: Optional Details (20 seconds)</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Add any additional details about the symbol.
              </p>
            </div>

            <div>
              <Label className="text-base mb-3 block">Movement (select all that apply)</Label>
              <div className="grid grid-cols-2 gap-3">
                {['Static', 'Pulsing', 'Rotating', 'Flowing', 'Morphing', 'Flickering'].map(movement => (
                  <div key={movement} className="flex items-center space-x-2">
                    <Checkbox 
                      id={movement}
                      checked={formData.movements.includes(movement.toLowerCase())}
                      onCheckedChange={() => setFormData(prev => ({
                        ...prev,
                        movements: toggleArrayItem(prev.movements, movement.toLowerCase())
                      }))}
                    />
                    <Label htmlFor={movement}>{movement}</Label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-base mb-3 block">Size Impression</Label>
              <RadioGroup 
                value={formData.sizeImpression} 
                onValueChange={(val) => setFormData(prev => ({ ...prev, sizeImpression: val }))}
              >
                {['Very Small', 'Medium', 'Large', 'Immense'].map(size => (
                  <div key={size} className="flex items-center space-x-2">
                    <RadioGroupItem value={size.toLowerCase().replace(' ', '_')} id={size} />
                    <Label htmlFor={size}>{size}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div>
              <Label htmlFor="customTags" className="text-base mb-3 block">Custom Tags (comma-separated)</Label>
              <Input 
                id="customTags"
                placeholder='e.g., "iridescent, fractal, tunnel, nested, DNA"'
                value={formData.customTags}
                onChange={(e) => setFormData(prev => ({ ...prev, customTags: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="description" className="text-base mb-3 block">Additional Description (1-2 sentences, optional)</Label>
              <Textarea 
                id="description"
                placeholder="Any additional details or context..."
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={handleBack}>
                <ChevronLeft className="mr-2 w-4 h-4" /> Back
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Submit Symbol'}
              </Button>
            </div>
          </div>
        )}

        {/* Step 6: Confirmation & Gamification */}
        {step === 6 && (
          <div className="space-y-8 text-center">
            <div>
              <div className="text-5xl mb-4">🎉</div>
              <h3 className="text-2xl font-bold mb-2">Symbol #{totalSymbols + 1} Submitted!</h3>
              <p className="text-muted-foreground">Thank you for contributing to the registry</p>
            </div>

            {newBadges.length > 0 && (
              <div className="bg-primary/10 p-6 rounded-lg">
                <h4 className="text-lg font-semibold mb-4 flex items-center justify-center gap-2">
                  <Award className="w-5 h-5" /> New Badges Unlocked!
                </h4>
                <div className="flex flex-wrap justify-center gap-2">
                  {newBadges.map(badge => (
                    <Badge key={badge} variant="default" className="text-sm py-2 px-3">
                      {badge.replace(/_/g, ' ').toUpperCase()}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {similarSymbols.length > 0 && (
              <div>
                <h4 className="text-lg font-semibold mb-4">Similar Symbols</h4>
                <div className="grid grid-cols-3 gap-4">
                  {similarSymbols.map(sym => (
                    <div key={sym.id} className="border border-border rounded-lg p-4">
                      <img 
                        src={sym.image_data} 
                        alt="Similar symbol" 
                        className="w-full h-auto mb-2"
                        style={{ imageRendering: 'pixelated' }}
                      />
                      <p className="text-xs text-muted-foreground">
                        {sym.confirmation_count} reports
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {userStats && (
              <div className="bg-muted/50 p-6 rounded-lg">
                <h4 className="text-lg font-semibold mb-4">Your Stats</h4>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-primary">{(userStats.total_submissions || 0) + 1}</div>
                    <div className="text-sm text-muted-foreground">Total Submissions</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-primary">{totalSymbols + 1}</div>
                    <div className="text-sm text-muted-foreground">Registry Size</div>
                  </div>
                </div>
                {(userStats.total_submissions || 0) + 1 < 5 && (
                  <p className="text-sm text-muted-foreground mt-4">
                    Submit {5 - ((userStats.total_submissions || 0) + 1)} more for Contributor badge
                  </p>
                )}
              </div>
            )}

            <div className="flex flex-col gap-3">
              <Button onClick={resetForm} size="lg">
                Submit Another Symbol
              </Button>
              <Button variant="outline" onClick={() => window.location.href = '/my-symbols'}>
                View My Symbols
              </Button>
              <Button variant="ghost" onClick={() => window.location.href = '/registry#browse'}>
                Explore Registry
              </Button>
            </div>
          </div>
        )}
      </Card>
    </section>
  );
};
