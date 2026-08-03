import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { FabricDrawingCanvas } from './FabricCanvas';
import { ChevronRight, ChevronLeft, Award, WifiOff, Circle, Eye, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { CanvasExport } from './CanvasExport';
import { usePrimacyCheck } from '@/hooks/usePrimacyCheck';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { AlertTriangle } from 'lucide-react';
import { formatSealedAt } from '@/lib/sealFormat';
import { VisualFieldMap } from './VisualFieldMap';
import { SignInToContribute } from '@/components/SignInToContribute';

type Step = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

interface FormData {
  // Priming control
  primingExposure: 'priming_none' | 'priming_matrix_only' | 'priming_laser_exposed' | '';
  
  // Null report flag
  isNullReport: boolean;
  
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
  orcid: string;
  confidenceRating: number;

  // Visual field map
  fieldBand: string;
  fieldDepth: string;
  fieldAttachment: string;
  fieldAnchoring: string;
  fieldOrientation: string;
  fieldLocations: string;

  // Privacy
  privacyLevel: 'private' | 'anonymous_matchable' | 'public_pseudonym' | 'researcher_available';
  publicationConsent: boolean;
  pseudonym: string;
}

interface LayeredSubmissionFormProps {
  captureRoute?: 'capture_page' | 'registry_page';
}

interface GlyphAnnotation {
  id: string;
  body: string;
  created_at: string;
}

export const LayeredSubmissionForm = ({ captureRoute = 'registry_page' }: LayeredSubmissionFormProps = {}) => {
  const [step, setStep] = useState<Step>(1);
  const [drawingStartTime, setDrawingStartTime] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [totalSymbols, setTotalSymbols] = useState(0);
  const [userStats, setUserStats] = useState<any>(null);
  const [similarSymbols, setSimilarSymbols] = useState<any[]>([]);
  const [newBadges, setNewBadges] = useState<string[]>([]);
  const [isNullReport, setIsNullReport] = useState(false);
  const [svgData, setSvgData] = useState<string>('');
  const [submittedSymbolId, setSubmittedSymbolId] = useState<string>('');
  const [sealedAt, setSealedAt] = useState<string | null>(null);
  const [originalRecordHash, setOriginalRecordHash] = useState<string | null>(null);
  const [annotationDraft, setAnnotationDraft] = useState('');
  const [annotations, setAnnotations] = useState<GlyphAnnotation[]>([]);
  const [isSavingAnnotation, setIsSavingAnnotation] = useState(false);
  const [fieldPin, setFieldPin] = useState<{ x: number; y: number } | null>(null);
  const [cannotPlace, setCannotPlace] = useState(false);
  const [otherPins, setOtherPins] = useState<{ x: number; y: number }[]>([]);
  const [wasOfflineCapture, setWasOfflineCapture] = useState(false);
  const [offlineCapturedAt, setOfflineCapturedAt] = useState<string | null>(null);

  const [formData, setFormData] = useState<FormData>({
    primingExposure: '',
    isNullReport: false,
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
    description: '',
    orcid: '',
    confidenceRating: 3,
    fieldBand: '',
    fieldDepth: '',
    fieldAttachment: '',
    fieldAnchoring: '',
    fieldOrientation: '',
    fieldLocations: '',
    privacyLevel: 'anonymous_matchable',
    publicationConsent: false,
    pseudonym: ''
  });

  // Primacy contamination check (after formData is defined)
  const primacyCheck = usePrimacyCheck(formData.description, formData.primingExposure);
  
  // Offline sync
  const { isOnline, pendingCount, savePendingSubmission, syncPendingSubmissions } = useOfflineSync();

  useEffect(() => {
    checkUser();
    loadTotalSymbols();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null);
      setAuthChecked(true);
    });

    // Check URL for null report mode
    const params = new URLSearchParams(window.location.search);
    if (params.get('null') === 'true') {
      setIsNullReport(true);
      setFormData(prev => ({ ...prev, isNullReport: true }));
    }

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      setUserId(session.user.id);
      loadUserStats(session.user.id);
    } else {
      setUserId(null);
    }
    setAuthChecked(true);
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
    if (step === 1 && !isNullReport && !formData.imageData) {
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
    
    setStep((prev) => Math.min(7, prev + 1) as Step);
  };

  const handleBack = () => {
    setStep((prev) => Math.max(1, prev - 1) as Step);
  };

  const handleSubmit = async () => {
    if (!userId) {
      toast.error('Please sign in first so your record can be stamped to you');
      return;
    }
    if (!formData.primingExposure) {
      toast.error('Please answer the last question above so we can weigh your record');
      return;
    }

    setIsSubmitting(true);

    try {
      const drawingDuration = drawingStartTime ? Math.floor((Date.now() - drawingStartTime) / 1000) : null;
      
      // Build tags from all selections
      const tags = [
        formData.isNullReport ? 'null_report' : null,
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

      const submissionData = {
        user_id: userId,
        image_data: formData.imageData,
        source: formData.observationMethod,
        perceived_surface: formData.surface || null,
        symmetry: formData.symmetry || null,
        motif_tags: tags,
        free_text_notes: formData.description || null,
        drawing_duration_seconds: drawingDuration,
        confidence_rating: formData.confidenceRating,
        orcid: formData.orcid || null,
        prior_exposure: formData.primingExposure === 'priming_none' ? false : true,
        catalog_exposure_before_submission: formData.primingExposure || null,
        capture_route: captureRoute,
        motion: formData.movements.length ? formData.movements.join(', ') : null,
        lighting_conditions: formData.timeOfDay || null,
        privacy_level: formData.privacyLevel,
        publication_consent: formData.publicationConsent,
        pseudonym: formData.privacyLevel === 'public_pseudonym' && formData.pseudonym.trim() ? formData.pseudonym.trim() : null,
        field_x: cannotPlace ? null : (fieldPin ? fieldPin.x : null),
        field_y: cannotPlace ? null : (fieldPin ? fieldPin.y : null),
        field_band: formData.fieldBand || null,
        depth: formData.fieldDepth || null,
        field_attachment: formData.fieldAttachment || null,
        field_anchoring: formData.fieldAnchoring || null,
        orientation: formData.fieldOrientation || null,
        field_locations: formData.fieldLocations || null
      };

      // If offline, save locally and show success
      if (!isOnline) {
        const capturedAt = new Date().toISOString();
        savePendingSubmission({ ...submissionData, offline_captured_at: capturedAt });
        setWasOfflineCapture(true);
        setOfflineCapturedAt(capturedAt);
        setStep(7);
        setIsSubmitting(false);
        return;
      }

      const { data: insertedGlyph, error } = await supabase
        .from('registry_glyphs')
        .insert(submissionData)
        .select()
        .single();

      if (error) throw error;

      // Store submitted symbol ID
      setSubmittedSymbolId(insertedGlyph.id);
      setSealedAt(insertedGlyph.sealed_at ?? null);
      setOriginalRecordHash(insertedGlyph.original_record_hash ?? null);

      // Check for new badges
      await checkBadges();

      // Load similar symbols
      await loadSimilarSymbols(insertedGlyph.id);
      await loadOtherPins(insertedGlyph.id);

      toast.success(`Symbol #${totalSymbols + 1} submitted!`);
      setStep(7);
      
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

    // Award "Skeptic Contributor" badge for null report
    if (formData.isNullReport) {
      const { error } = await supabase
        .from('user_badges')
        .insert({ user_id: userId, badge_name: 'skeptic_contributor' });
      
      if (!error) {
        earnedBadges.push('skeptic_contributor');
      }
      
      // Notify admin of null report
      try {
        await supabase.functions.invoke('notify-admin', {
          body: {
            type: 'null_report',
            symbolId: submittedSymbolId,
            wavelength: formData.wavelength,
            surface: formData.surface
          }
        });
      } catch (error) {
        console.error('Failed to notify admin:', error);
      }
    }

    // Award "Primacy Validated" badge for no priming
    if (formData.primingExposure === 'priming_none') {
      const { error } = await supabase
        .from('user_badges')
        .insert({ user_id: userId, badge_name: 'primacy_validated' });
      
      if (!error) {
        earnedBadges.push('primacy_validated');
      }
    }

    // Award "Spectrum Hunter" badge for non-650nm wavelength
    if (formData.wavelength && formData.wavelength !== 'wavelength_650') {
      const { error } = await supabase
        .from('user_badges')
        .insert({ user_id: userId, badge_name: 'spectrum_hunter' });
      
      if (!error) {
        earnedBadges.push('spectrum_hunter');
      }
      
      // Check if this is the FIRST non-red submission globally
      const { data: existingNonRed } = await supabase
        .from('registry_glyphs')
        .select('id')
        .contains('motif_tags', [formData.wavelength])
        .neq('id', submittedSymbolId)
        .limit(1);

      if (!existingNonRed || existingNonRed.length === 0) {
        // This is the first non-red submission!
        const { triggerConfetti } = await import('@/utils/confetti');
        triggerConfetti();
        
        toast.success('You unlocked Spectrum Hunter badge!', {
          description: 'You submitted the FIRST non-red wavelength symbol!',
          duration: 6000
        });

        // Notify admin
        try {
          await supabase.functions.invoke('notify-admin', {
            body: {
              type: 'first_non_red',
              symbolId: submittedSymbolId,
              wavelength: formData.wavelength.replace('wavelength_', ''),
              metadata: {
                source: formData.observationMethod,
                surface: formData.surface
              }
            }
          });
        } catch (error) {
          console.error('Failed to notify admin:', error);
        }
      }
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

  const loadSimilarSymbols = async (insertedId: string) => {
    // Descriptive features only. Context tags (priming, wavelength, method,
    // location, room, outdoor, surface, time of day) are deliberately excluded.
    const basis = [
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

    if (basis.length < 2) {
      setSimilarSymbols([]);
      return;
    }

    const { data } = await supabase
      .from('registry_glyphs')
      .select('id, image_data, motif_tags, sealed_at, created_at')
      .overlaps('motif_tags', basis)
      .neq('id', insertedId)
      .limit(50);

    const scored = (data || [])
      .map(row => ({
        ...row,
        sharedCount: basis.filter(t => (row.motif_tags || []).includes(t)).length
      }))
      .filter(row => row.sharedCount >= 2)
      .sort((a, b) => b.sharedCount - a.sharedCount)
      .slice(0, 3);

    setSimilarSymbols(scored);
  };

  const loadOtherPins = async (insertedId: string) => {
    const { data } = await supabase
      .from('registry_glyphs')
      .select('id, field_x, field_y')
      .not('field_x', 'is', null)
      .not('field_y', 'is', null)
      .not('sealed_at', 'is', null)
      .neq('id', insertedId)
      .limit(200);
    setOtherPins((data || []).map(r => ({ x: Number(r.field_x), y: Number(r.field_y) })));
  };

  const loadAnnotations = async (glyphId: string) => {
    const { data } = await supabase
      .from('glyph_annotations')
      .select('id, body, created_at')
      .eq('glyph_id', glyphId)
      .order('created_at', { ascending: true });
    setAnnotations(data || []);
  };

  const saveAnnotation = async () => {
    if (!userId || !submittedSymbolId || !annotationDraft.trim()) return;
    setIsSavingAnnotation(true);
    const { error } = await supabase
      .from('glyph_annotations')
      .insert({ glyph_id: submittedSymbolId, user_id: userId, body: annotationDraft.trim() });
    setIsSavingAnnotation(false);
    if (error) {
      toast.error('Could not save the note');
      return;
    }
    setAnnotationDraft('');
    await loadAnnotations(submittedSymbolId);
  };


  const resetForm = () => {
    setFormData({
      primingExposure: '',
      isNullReport: false,
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
    description: '',
    orcid: '',
    confidenceRating: 3,
    fieldBand: '',
    fieldDepth: '',
    fieldAttachment: '',
    fieldAnchoring: '',
    fieldOrientation: '',
    fieldLocations: '',
    privacyLevel: 'anonymous_matchable',
    publicationConsent: false,
    pseudonym: ''
  });
    setStep(1);
    setDrawingStartTime(null);
    setSimilarSymbols([]);
    setNewBadges([]);
    setIsNullReport(false);
    setSealedAt(null);
    setOriginalRecordHash(null);
    setAnnotations([]);
    setAnnotationDraft('');
    setFieldPin(null);
    setCannotPlace(false);
    setOtherPins([]);
    setWasOfflineCapture(false);
    setOfflineCapturedAt(null);
    localStorage.removeItem('dmtcode-canvas-draft');
    loadTotalSymbols();
    if (userId) loadUserStats(userId);
  };

  const toggleArrayItem = (arr: string[], item: string) => {
    return arr.includes(item) ? arr.filter(i => i !== item) : [...arr, item];
  };

    return (
    <section id="submit" className="container mx-auto px-4 py-16">
      <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
        {isNullReport ? 'Report Null Experience' : 'Submit a New Symbol'}
      </h2>
      {isNullReport && (
        <p className="text-center text-muted-foreground mb-8 max-w-2xl mx-auto">
          Your null report is valuable for baseline comparison. Complete the same metadata form to document what you didn't see.
        </p>
      )}

      {!authChecked && (
        <div className="max-w-4xl mx-auto py-12 text-center text-muted-foreground">
          Checking your account…
        </div>
      )}

      {authChecked && !userId && (
        <SignInToContribute
          title="Sign in to add your record"
          body="An account is what makes the record count. It stamps what you describe to you, so if someone else describes the same thing later, the order is on the record and yours came first. It also lets you keep a memory private, follow a symbol, and tell us when one echoes what you saw. We give you an avatar, so your name stays yours."
        />
      )}

      {authChecked && userId && (
      <>
      {/* Offline indicator */}
      {!isOnline && (
        <div className="max-w-4xl mx-auto mb-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-center gap-2 text-amber-500">
          <WifiOff className="w-4 h-4" />
          <span className="text-sm">You're offline. Drawings will be saved locally and synced when reconnected.</span>
        </div>
      )}
      
      {/* Pending submissions indicator */}
      {pendingCount > 0 && isOnline && (
        <div className="max-w-4xl mx-auto mb-4 p-3 bg-primary/10 border border-primary/30 rounded-lg flex items-center justify-between">
          <span className="text-sm">{pendingCount} offline submission(s) pending sync</span>
          <Button variant="outline" size="sm" onClick={syncPendingSubmissions}>
            Sync Now
          </Button>
        </div>
      )}
      
      <Card className="max-w-4xl mx-auto p-8 bg-card border-border">
        {/* Progress indicator */}
        <div className="flex justify-center items-center gap-2 mb-8">
          {[1, 2, 3, 4, 5, 6].map((s) => (
            <div 
              key={s}
              className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${
                s === step ? 'bg-primary text-primary-foreground' :
                s < step ? 'bg-primary/50 text-primary-foreground' :
                'bg-muted text-muted-foreground'
              }`}
            >
              {s}
            </div>
          ))}
        </div>

        {/* Step 1: Draw Symbol (or skip for null reports) */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-4">
                {isNullReport ? 'Step 1: No Symbol Observed' : 'Step 1: Draw Symbol (30 seconds)'}
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                {isNullReport 
                  ? 'Since you saw no symbols, you can skip drawing. We still need your metadata to establish baseline conditions.'
                  : 'Draw the symbol as accurately as you remember it. Take about 30 seconds.'}
              </p>
            </div>
            
            {!isNullReport && (
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
                onSvgExport={(svg) => setSvgData(svg)}
              />
            )}

            {isNullReport && (
              <Card className="p-6 bg-muted/30 border-border text-center">
                <p className="text-lg font-medium mb-2">No visual symbols observed</p>
                <p className="text-sm text-muted-foreground">
                  Your null report helps establish baseline conditions. Continue to provide metadata about your experience.
                </p>
                <div className="flex items-center justify-center gap-2 text-sm text-gold mt-4">
                  <Award className="w-5 h-5" />
                  <span className="font-medium">
                    You'll earn the "Skeptic Contributor" badge for this valuable baseline data!
                  </span>
                </div>
              </Card>
            )}
            
            <div className="flex justify-between">
              <Button variant="outline" onClick={handleBack}>
                <ChevronLeft className="mr-2 w-4 h-4" /> Back
              </Button>
              <Button onClick={handleNext} disabled={!isNullReport && !formData.imageData}>
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
                  <div className="mb-2 flex justify-center"><Circle className="h-7 w-7 text-primary" aria-hidden="true" /></div>
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
                  <div className="mb-2 flex justify-center"><Eye className="h-7 w-7 text-primary" aria-hidden="true" /></div>
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
                  <div className="mb-2 flex justify-center"><Sparkles className="h-7 w-7 text-primary" aria-hidden="true" /></div>
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
                Next: Visual Field Map <ChevronRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 5: Visual Field Map */}
        {step === 5 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-4">Step 5: Where in the field did it appear?</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Place a marker where the form appeared, relative to the centre of what you were looking at. Nobody else's marker is shown to you yet. That is deliberate, because a placement you make after seeing other people's is no longer independent.
              </p>
            </div>

            {!cannotPlace && (
              <VisualFieldMap value={fieldPin} onChange={setFieldPin} />
            )}

            <div className="flex items-start space-x-2">
              <Checkbox
                id="cannotPlace"
                checked={cannotPlace}
                onCheckedChange={(checked) => {
                  const next = checked === true;
                  setCannotPlace(next);
                  if (next) setFieldPin(null);
                }}
                className="mt-1"
              />
              <div>
                <Label htmlFor="cannotPlace" className="font-normal">I cannot place it</Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Some forms have no location, or the memory does not include one. That is a real answer and it is recorded as one.
                </p>
              </div>
            </div>

            <div>
              <Label className="text-base mb-3 block">Relative to the diffraction band</Label>
              <RadioGroup
                value={formData.fieldBand}
                onValueChange={(v) => setFormData(prev => ({ ...prev, fieldBand: v }))}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="inside_band" id="fieldBand_inside_band" />
                  <Label htmlFor="fieldBand_inside_band" className="font-normal">Inside the band</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="on_band" id="fieldBand_on_band" />
                  <Label htmlFor="fieldBand_on_band" className="font-normal">On the band itself</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="outside_band" id="fieldBand_outside_band" />
                  <Label htmlFor="fieldBand_outside_band" className="font-normal">Outside the band</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="unsure" id="fieldBand_unsure" />
                  <Label htmlFor="fieldBand_unsure" className="font-normal">Not sure</Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label className="text-base mb-3 block">How far away did it seem</Label>
              <RadioGroup
                value={formData.fieldDepth}
                onValueChange={(v) => setFormData(prev => ({ ...prev, fieldDepth: v }))}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="near" id="fieldDepth_near" />
                  <Label htmlFor="fieldDepth_near" className="font-normal">Close to me</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="intermediate" id="fieldDepth_intermediate" />
                  <Label htmlFor="fieldDepth_intermediate" className="font-normal">Middle distance</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="far" id="fieldDepth_far" />
                  <Label htmlFor="fieldDepth_far" className="font-normal">Far away</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="unsure" id="fieldDepth_unsure" />
                  <Label htmlFor="fieldDepth_unsure" className="font-normal">Not sure</Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label className="text-base mb-3 block">How was it attached</Label>
              <RadioGroup
                value={formData.fieldAttachment}
                onValueChange={(v) => setFormData(prev => ({ ...prev, fieldAttachment: v }))}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="on_surface" id="fieldAttachment_on_surface" />
                  <Label htmlFor="fieldAttachment_on_surface" className="font-normal">On the surface</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="floating" id="fieldAttachment_floating" />
                  <Label htmlFor="fieldAttachment_floating" className="font-normal">Floating in front of the surface</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="recessed" id="fieldAttachment_recessed" />
                  <Label htmlFor="fieldAttachment_recessed" className="font-normal">Set back behind the surface</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="layered" id="fieldAttachment_layered" />
                  <Label htmlFor="fieldAttachment_layered" className="font-normal">Layered, more than one depth at once</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="unsure" id="fieldAttachment_unsure" />
                  <Label htmlFor="fieldAttachment_unsure" className="font-normal">Not sure</Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label className="text-base mb-3 block">When you moved your head or eyes</Label>
              <RadioGroup
                value={formData.fieldAnchoring}
                onValueChange={(v) => setFormData(prev => ({ ...prev, fieldAnchoring: v }))}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="fixed_in_space" id="fieldAnchoring_fixed_in_space" />
                  <Label htmlFor="fieldAnchoring_fixed_in_space" className="font-normal">It stayed where it was</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="moved_with_me" id="fieldAnchoring_moved_with_me" />
                  <Label htmlFor="fieldAnchoring_moved_with_me" className="font-normal">It moved with me</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="unsure" id="fieldAnchoring_unsure" />
                  <Label htmlFor="fieldAnchoring_unsure" className="font-normal">Not sure</Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label className="text-base mb-3 block">Orientation</Label>
              <RadioGroup
                value={formData.fieldOrientation}
                onValueChange={(v) => setFormData(prev => ({ ...prev, fieldOrientation: v }))}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="upright" id="fieldOrientation_upright" />
                  <Label htmlFor="fieldOrientation_upright" className="font-normal">Upright</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="inverted" id="fieldOrientation_inverted" />
                  <Label htmlFor="fieldOrientation_inverted" className="font-normal">Inverted</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="rotated" id="fieldOrientation_rotated" />
                  <Label htmlFor="fieldOrientation_rotated" className="font-normal">Rotated to one side</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no_clear_orientation" id="fieldOrientation_no_clear_orientation" />
                  <Label htmlFor="fieldOrientation_no_clear_orientation" className="font-normal">No clear orientation</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="unsure" id="fieldOrientation_unsure" />
                  <Label htmlFor="fieldOrientation_unsure" className="font-normal">Not sure</Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label className="text-base mb-3 block">One place or many</Label>
              <RadioGroup
                value={formData.fieldLocations}
                onValueChange={(v) => setFormData(prev => ({ ...prev, fieldLocations: v }))}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="one_place" id="fieldLocations_one_place" />
                  <Label htmlFor="fieldLocations_one_place" className="font-normal">One place only</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="several_places" id="fieldLocations_several_places" />
                  <Label htmlFor="fieldLocations_several_places" className="font-normal">Several distinct places</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="everywhere" id="fieldLocations_everywhere" />
                  <Label htmlFor="fieldLocations_everywhere" className="font-normal">Across the whole field</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="unsure" id="fieldLocations_unsure" />
                  <Label htmlFor="fieldLocations_unsure" className="font-normal">Not sure</Label>
                </div>
              </RadioGroup>
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

        {/* Step 6: Optional Details */}
        {step === 6 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-4">Step 6: Optional Details (20 seconds)</h3>
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

            {/* Confidence Rating Slider */}
            <div>
              <Label className="text-base mb-3 block">
                Confidence Rating: {formData.confidenceRating}/5
              </Label>
              <p className="text-sm text-muted-foreground mb-4">
                How confident are you that this drawing accurately represents what you observed?
              </p>
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">Low</span>
                <Slider
                  value={[formData.confidenceRating]}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, confidenceRating: value[0] }))}
                  min={1}
                  max={5}
                  step={1}
                  className="flex-1"
                  aria-label="Confidence rating from 1 to 5"
                />
                <span className="text-sm text-muted-foreground">High</span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-2 px-1">
                <span>1</span>
                <span>2</span>
                <span>3</span>
                <span>4</span>
                <span>5</span>
              </div>
            </div>

            <div>
              <Label htmlFor="orcid" className="text-base mb-3 block flex items-center gap-2">
                ORCID (optional)
                <a href="https://orcid.org" target="_blank" rel="noopener noreferrer" className="inline-flex">
                  <img 
                    src="https://orcid.org/assets/vectors/orcid.logo.icon.svg" 
                    alt="ORCID" 
                    className="w-4 h-4"
                  />
                </a>
              </Label>
              <Input 
                id="orcid"
                placeholder="e.g., 0000-0002-1825-0097"
                value={formData.orcid}
                onChange={(e) => setFormData(prev => ({ ...prev, orcid: e.target.value }))}
                pattern="\d{4}-\d{4}-\d{4}-\d{3}[\dX]"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Link your academic identity for attribution in published datasets
              </p>
              
              {/* Primacy contamination warning */}
              {formData.primingExposure === 'priming_none' && primacyCheck.isContaminated && (
                <Card className="mt-3 p-4 bg-amber-500/10 border-amber-500/30">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-amber-500 mb-1">Primacy Transparency Notice</h4>
                      <p className="text-sm text-amber-200">
                        Your description mentions terms like "matrix rain," "katakana," or "digital rain" that may indicate prior exposure. 
                        This could affect the Primacy Validated badge, which requires genuinely zero-shot observations.
                      </p>
                      <p className="text-xs text-amber-300/70 mt-2">
                        You can still submit. This is just for transparency. If you saw these symbols without any prior knowledge of the protocol, that's fine.
                      </p>
                    </div>
                  </div>
                </Card>
              )}
            </div>

            <div className="space-y-3 border-t pt-6">
              <Label className="text-base font-medium">
                One last thing, so we can weigh your record properly. Before your experience, had you seen any of this imagery?
              </Label>
              <RadioGroup
                value={formData.primingExposure}
                onValueChange={(value) => setFormData({ ...formData, primingExposure: value as typeof formData.primingExposure })}
                className="grid gap-2 sm:grid-cols-3"
              >
                <div className="flex items-center space-x-2 border rounded-lg px-3 py-2.5 cursor-pointer hover:bg-muted/50">
                  <RadioGroupItem value="priming_none" id="p-none" />
                  <Label htmlFor="p-none" className="cursor-pointer font-normal">No, none of it</Label>
                </div>
                <div className="flex items-center space-x-2 border rounded-lg px-3 py-2.5 cursor-pointer hover:bg-muted/50">
                  <RadioGroupItem value="priming_matrix_only" id="p-matrix" />
                  <Label htmlFor="p-matrix" className="cursor-pointer font-normal">Only Matrix style rain</Label>
                </div>
                <div className="flex items-center space-x-2 border rounded-lg px-3 py-2.5 cursor-pointer hover:bg-muted/50">
                  <RadioGroupItem value="priming_laser_exposed" id="p-laser" />
                  <Label htmlFor="p-laser" className="cursor-pointer font-normal">Yes, Goler or Discovery</Label>
                </div>
              </RadioGroup>
              {formData.primingExposure === 'priming_none' && (
                <p className="text-sm text-gold">Unprimed records carry the most weight. Thank you.</p>
              )}
            </div>

            {/* Privacy */}
            <div>
              <h4 className="text-base font-semibold mb-3">Who can see this memory</h4>
              <RadioGroup
                value={formData.privacyLevel}
                onValueChange={(val) => setFormData(prev => ({ ...prev, privacyLevel: val as FormData['privacyLevel'] }))}
                className="space-y-3"
              >
                {[
                  {
                    value: 'anonymous_matchable',
                    label: 'Anonymous and matchable',
                    help: 'Shown publicly with no name attached. Included in convergence comparisons.'
                  },
                  {
                    value: 'public_pseudonym',
                    label: 'Public under a pseudonym',
                    help: 'Shown publicly with a name you choose.'
                  },
                  {
                    value: 'researcher_available',
                    label: 'Available to researchers',
                    help: 'Shown publicly and flagged as available for formal research contact.'
                  },
                  {
                    value: 'private',
                    label: 'Private to me',
                    help: userId
                      ? 'Visible only to you. Not included in public comparisons.'
                      : 'Sign in to keep a memory private. Without an account there is no way to show it back only to you.'
                  }
                ].map(opt => (
                  <div key={opt.value} className="flex items-start space-x-2">
                    <RadioGroupItem
                      value={opt.value}
                      id={`privacy-${opt.value}`}
                      disabled={opt.value === 'private' && !userId}
                      className="mt-1"
                    />
                    <div>
                      <Label htmlFor={`privacy-${opt.value}`}>{opt.label}</Label>
                      <p className="text-xs text-muted-foreground">{opt.help}</p>
                    </div>
                  </div>
                ))}
              </RadioGroup>

              {formData.privacyLevel === 'public_pseudonym' && (
                <div className="mt-4">
                  <Label htmlFor="pseudonym" className="mb-2 block">Pseudonym</Label>
                  <Input
                    id="pseudonym"
                    maxLength={40}
                    value={formData.pseudonym}
                    onChange={(e) => setFormData(prev => ({ ...prev, pseudonym: e.target.value }))}
                  />
                </div>
              )}

              <div className="flex items-start space-x-2 mt-4">
                <Checkbox
                  id="publicationConsent"
                  checked={formData.publicationConsent}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, publicationConsent: checked === true }))}
                  className="mt-1"
                />
                <Label htmlFor="publicationConsent" className="font-normal">
                  I consent to this record being included in the public CC BY 4.0 data export.
                </Label>
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={handleBack}>
                <ChevronLeft className="mr-2 w-4 h-4" /> Back
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting || !formData.primingExposure}>
                {isSubmitting ? 'Submitting...' : 'Submit Symbol'}
              </Button>
            </div>
          </div>
        )}

        {/* Step 7: Confirmation & Gamification */}
        {step === 7 && (
          <div className="space-y-8 text-center">
            <div className="space-y-2">
              <h3 className="text-2xl font-bold mb-2">
                {wasOfflineCapture ? 'Your memory is saved on this device' : 'Your memory has been sealed'}
              </h3>

              {wasOfflineCapture ? (
                <>
                  <p className="text-sm text-muted-foreground">
                    You were offline when you recorded this, so it is stored on this device and has not been sealed yet.
                    {offlineCapturedAt ? ` Your device reported the time as ${formatSealedAt(offlineCapturedAt)}.` : ''}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    When you are back online it will be sent to us and sealed with a server timestamp, and the server time is the one we can actually vouch for. If you clear this browser's data before that happens, the record is lost.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Once it is sealed the record cannot be edited, by you or by us. If your memory of it changes, you can add a dated note beside it and both versions will be kept.
                  </p>
                </>
              ) : (
                <>
                  {sealedAt && (
                    <p className="text-sm text-muted-foreground">
                      Sealed at {formatSealedAt(sealedAt)}.
                    </p>
                  )}
                  {originalRecordHash && (
                    <p className="text-sm text-muted-foreground font-mono">
                      Fingerprint {originalRecordHash.slice(0, 12)}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    This record cannot be edited, by you or by us. If your memory of it changes, you can add a dated note beside it and both versions will be kept.
                  </p>
                </>
              )}

              <p className="text-sm text-muted-foreground">
                {captureRoute === 'capture_page'
                  ? 'You recorded this before opening the catalogue.'
                  : 'You recorded this from the registry page, so this report is marked as catalogue exposed.'}
              </p>

              {!userId && (
                <p className="text-sm text-muted-foreground">
                  {wasOfflineCapture
                    ? 'You are not signed in, so this memory cannot be added to a private vault. It will be sealed when it reaches us and it counts.'
                    : 'You are not signed in, so this memory cannot be added to a private vault. It is sealed and it counts.'}
                </p>
              )}
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

            {/* Canvas Export Section */}
            {!isNullReport && formData.imageData && (
              <CanvasExport 
                imageData={formData.imageData}
                svgData={svgData}
                symbolId={submittedSymbolId}
              />
            )}

            {!wasOfflineCapture && (
              <div>
                <h4 className="text-lg font-semibold mb-4">Does it echo anyone else's?</h4>
              {similarSymbols.length > 0 ? (
                <>
                  <div className="grid grid-cols-3 gap-4">
                    {similarSymbols.map(sym => (
                      <div key={sym.id} className="border border-border rounded-lg p-4">
                        <img
                          src={sym.image_data}
                          alt="Another sealed report sharing described features with your submission"
                          className="w-full h-auto mb-2"
                          style={{ imageRendering: 'pixelated' }}
                        />
                        <p className="text-xs text-muted-foreground">
                          {sym.sharedCount} features in common
                        </p>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">
                    Shared features are not evidence of a shared source. They are the starting point for a comparison.
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No other sealed report currently shares two or more of the features you described.
                </p>
              )}
              </div>
            )}

            {!wasOfflineCapture && fieldPin && !cannotPlace && (
              <div>
                <h4 className="text-lg font-semibold mb-4">Where others placed theirs</h4>
                <VisualFieldMap value={fieldPin} otherPins={otherPins} readOnly />
                <p className="text-xs text-muted-foreground mt-3">
                  {otherPins.length > 0
                    ? 'Your marker is filled. Every hollow marker is another sealed report.'
                    : 'No other sealed report has placed a marker on the field map yet. Yours is the first.'}
                </p>
              </div>
            )}

            {wasOfflineCapture && (
              <div>
                <h4 className="text-lg font-semibold mb-4">Nothing has been compared yet</h4>
                <p className="text-sm text-muted-foreground">
                  We cannot compare this with other reports until it reaches us. When it syncs it will be sealed first, and the comparison happens after that.
                </p>
              </div>
            )}

            {userId && submittedSymbolId && (
              <div className="text-left">
                <Label htmlFor="annotation" className="text-base mb-2 block">
                  Add a dated note to this memory (optional)
                </Label>
                <Textarea
                  id="annotation"
                  rows={3}
                  value={annotationDraft}
                  onChange={(e) => setAnnotationDraft(e.target.value)}
                />
                <Button
                  className="mt-3"
                  onClick={saveAnnotation}
                  disabled={isSavingAnnotation || !annotationDraft.trim()}
                >
                  {isSavingAnnotation ? 'Saving...' : 'Save note'}
                </Button>

                {annotations.length > 0 && (
                  <ul className="mt-4 space-y-3">
                    {annotations.map(a => (
                      <li key={a.id} className="border border-border rounded-lg p-3">
                        <p className="text-xs text-muted-foreground mb-1">
                          {new Date(a.created_at).toLocaleDateString(undefined, {
                            day: 'numeric', month: 'long', year: 'numeric'
                          })}
                        </p>
                        <p className="text-sm">{a.body}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <div className="flex flex-col gap-3">
              <Button onClick={resetForm} size="lg">
                Capture another memory
              </Button>
              <Button variant="ghost" onClick={() => window.location.href = '/registry#browse'}>
                Explore Registry
              </Button>
            </div>
          </div>
        )}
      </Card>
      </>
      )}
    </section>
  );
};
