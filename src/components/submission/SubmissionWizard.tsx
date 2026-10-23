import { useState, useEffect, useRef } from 'react';
import type { Canvas as FabricCanvas } from 'fabric';
import { supabase } from '@/integrations/supabase/client';
import { SymbolCanvas } from '@/components/registry/SymbolCanvas';
import { MetadataForm, SymbolMetadata } from './MetadataForm';
import { SubmissionPreview } from './SubmissionPreview';
import { SubmissionConfirmation } from './SubmissionConfirmation';
import { StepIndicator } from './StepIndicator';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useSubmissionTracking } from '@/hooks/useSubmissionTracking';
import { useCanvasTracking } from '@/hooks/useCanvasTracking';
import { useUgcTracking } from '@/hooks/useUgcTracking';
import { CanvasErrorBoundary } from '@/components/registry/CanvasErrorBoundary';
import { Loader2, ArrowLeft, ArrowRight } from 'lucide-react';
import { hasSeenCatalogue, catalogueSeenAt } from '@/lib/catalogueExposure';
import { submitObservation } from '@/lib/submitObservation';
import { exposureFields, wavelengthInteger } from '@/lib/observationRules';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useLocale } from '@/i18n/LocaleProvider';
import { uiCopy } from '@/i18n/ui-strings';

const STEPS = [
  { id: 1, name: 'Draw', description: 'Create your symbol' },
  { id: 2, name: 'Details', description: 'Add metadata' },
  { id: 3, name: 'Preview', description: 'Review submission' },
  { id: 4, name: 'Complete', description: 'Confirmation' },
];

export const SubmissionWizard = () => {
  const locale = useLocale();
  const copy = (key: string) => uiCopy(`observation-${key}`, locale).title;
  const [isNullReport, setIsNullReport] = useState(false);
  const [stimulusPhotos, setStimulusPhotos] = useState<File[]>([]);
  const [observationId] = useState(() => crypto.randomUUID());
  const [currentStep, setCurrentStep] = useState(1);
  const [priorExposure, setPriorExposure] = useState<'naive' | 'exposed' | ''>('');
  // The browser knows something the contributor may not think to mention: it
  // served them the catalogue. Pre-fill from that, then tell them it was
  // pre-filled and why. Captured once on mount so that changing the answer
  // does not make the explanation disappear, and so the explanation keeps
  // standing next to an answer the contributor has overridden.
  const [prefilledFromCatalogue, setPrefilledFromCatalogue] = useState(false);
  const [catalogueSeenOn, setCatalogueSeenOn] = useState<string | null>(null);
  useEffect(() => {
    if (!hasSeenCatalogue()) return;
    setPrefilledFromCatalogue(true);
    setCatalogueSeenOn(catalogueSeenAt());
    setPriorExposure((current) => (current === '' ? 'exposed' : current));
  }, []);
  const [imageData, setImageData] = useState<string>('');
  const [metadata, setMetadata] = useState<SymbolMetadata | null>(null);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [symmetryMode, setSymmetryMode] = useState(false);
  const fabricCanvasRef = useRef<FabricCanvas | null>(null);
  
  const { trackStepCompleted, trackSubmissionSubmitted, trackSubmissionAbandoned } = useSubmissionTracking();
  const { trackDrawingSaved } = useCanvasTracking();
  const { trackSymbolDrawn, trackSymbolSubmitted } = useUgcTracking();

  // Track abandonment on unmount
  useEffect(() => {
    return () => {
      if (currentStep < 4 && imageData) {
        trackSubmissionAbandoned(currentStep, STEPS[currentStep - 1].name);
      }
    };
  }, [currentStep, imageData, trackSubmissionAbandoned]);

  const handleCanvasSave = () => {
    if (!priorExposure) {
      toast.error('Please answer the prior exposure question before continuing');
      return;
    }
    if (!isNullReport && !imageData) {
      toast.error('Please draw something before continuing');
      return;
    }
    trackDrawingSaved(symmetryMode, showGrid);
    trackSymbolDrawn({ has_symmetry: symmetryMode, has_grid: showGrid });
    trackStepCompleted(1, 'Draw');
    setCurrentStep(2);
  };

  const handleMetadataSubmit = (data: SymbolMetadata) => {
    setMetadata(data);
    trackStepCompleted(2, 'Details');
    setCurrentStep(3);
  };

  const handleFinalSubmit = async () => {
    if ((!isNullReport && !imageData) || !metadata) {
      toast.error('Missing required data');
      return;
    }

    setIsSubmitting(true);

    try {
      // Submitting requires an account. Every submission is credited to a
      // public avatar profile name, so there is no anonymous write path.
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('An account is needed to submit a symbol', {
          description: 'Sign in and your drawing is credited to your profile.',
        });
        setIsSubmitting(false);
        return;
      }

      // Capture vector representations from the live Fabric canvas.
      // Additive: only populated for NEW submissions.
      let svgData: string | null = null;
      let vectorJson: any | null = null;
      try {
        const canvas = fabricCanvasRef.current;
        if (canvas) {
          // Temporarily hide grid overlay lines during export
          const gridLines = canvas.getObjects().filter((o: any) => o.isGridLine);
          gridLines.forEach((l: any) => { l.visible = false; });
          svgData = canvas.toSVG();
          const json = canvas.toJSON() as any;
          if (json?.objects) {
            json.objects = json.objects.filter((o: any) => !o.isGridLine);
          }
          vectorJson = json;
          gridLines.forEach((l: any) => { l.visible = true; });
        }
      } catch (e) {
        console.warn('Vector capture failed, continuing with PNG only', e);
      }

      // Preserve wizard metadata on the glyph; the trigger creates its pair.
      const { submission } = await submitObservation({
        id: observationId,
        user_id: user.id,
        image_data: isNullReport ? '' : imageData,
        source: metadata.sourceMethod === 'laser_650nm' ? '650nm_laser'
          : metadata.sourceMethod === 'closed_eye' ? 'closed_eyes'
          : metadata.sourceMethod === 'open_eye' ? 'open_eyes' : 'other',
        free_text_notes: metadata.description,
        motif_tags: isNullReport ? [...new Set([...metadata.tags, 'null_report'])] : metadata.tags,
        perceived_surface: metadata.surfaceType || null,
        context_note: metadata.contextNote || null,
        wavelength_nm: wavelengthInteger(metadata.wavelength || ''),
        wavelength_text: metadata.wavelength || null,
        approximate_dose: metadata.doseLevel || null,
        observation_duration_seconds: metadata.durationSeconds || null,
        symbol_recurrence: metadata.recurrence || null,
        emotional_valence: metadata.emotionalValence || null,
        svg_data: isNullReport ? null : svgData,
        vector_json: isNullReport ? null : vectorJson,
        is_sober_baseline: metadata.isSoberBaseline ?? false,
        is_null_report: isNullReport,
        time_since_observation: metadata.timeSinceObservation || null,
        publication_consent: true,
        ...exposureFields(priorExposure),
      }, { stimulusPhotos, uploadDrawing: !isNullReport });

      // Trigger admin notification
      await supabase.functions.invoke('notify-admin', {
        body: { submission },
      }).catch(err => console.error('Notification error:', err));

      // Track success with both hooks
      trackSubmissionSubmitted({
        source_method: metadata.sourceMethod,
        tags: metadata.tags,
        has_description: !!metadata.description,
        dose_level: metadata.doseLevel,
      });
      
      trackSymbolSubmitted({
        submission_id: submission.id,
        source_method: metadata.sourceMethod,
        tags: metadata.tags,
        has_description: !!metadata.description,
      });

      setSubmissionId(submission.id);
      trackStepCompleted(3, 'Preview');
      setCurrentStep(4);
      toast.success('Symbol submitted successfully!');

    } catch (error: any) {
      console.error('Submission error:', error);
      toast.error(error.message || 'Failed to submit symbol');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleEditFromPreview = (step: 'draw' | 'metadata') => {
    setCurrentStep(step === 'draw' ? 1 : 2);
  };

  return (
    <div className="space-y-8">
      {/* Step Indicator */}
      <StepIndicator steps={STEPS} currentStep={currentStep} />

      {/* Step Content */}
      <div className="min-h-[500px]">
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-black tracking-tight">Draw Your Symbol</h2>
              <p className="text-muted-foreground font-light">
                Create a visual representation of the symbol you observed.
              </p>
            </div>

            {/* Prior exposure question: required, shown before any symbol imagery. */}
            <fieldset className="rounded-lg border border-border bg-card p-5 text-left">
              <legend className="px-1 text-sm font-semibold text-foreground">
                Before this observation, had you already looked at symbols in this registry?
              </legend>
              <div className="mt-3 space-y-2">
                <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                  <input
                    type="radio"
                    name="prior-exposure"
                    value="naive"
                    checked={priorExposure === 'naive'}
                    onChange={() => setPriorExposure('naive')}
                    className="accent-current"
                  />
                  No, I had not seen them
                </label>
                <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                  <input
                    type="radio"
                    name="prior-exposure"
                    value="exposed"
                    checked={priorExposure === 'exposed'}
                    onChange={() => setPriorExposure('exposed')}
                    className="accent-current"
                  />
                  Yes, I had already seen them
                </label>
              </div>
              {prefilledFromCatalogue && (
                <p className="mt-3 rounded border border-primary/30 bg-primary/5 p-3 text-xs text-foreground">
                  We filled this in as <strong>yes</strong> because this browser opened the
                  symbol catalogue
                  {catalogueSeenOn ? ` on ${new Date(catalogueSeenOn).toLocaleDateString()}` : ''}.
                  Change it if that is wrong. You know what you read; the site only knows what
                  it served you.
                </p>
              )}
              <p className="mt-3 text-xs text-muted-foreground">
                Either answer is fine. Naive here means not previously exposed to the thing being tested. It is recorded so naive and exposed reports can be compared later. It changes nothing about your submission.
              </p>
            </fieldset>

            <div className="flex items-center gap-2">
              <Checkbox id="wizard-null-report" checked={isNullReport} onCheckedChange={value => setIsNullReport(value === true)} />
              <Label htmlFor="wizard-null-report">{copy('nullReport')}</Label>
            </div>
            {isNullReport ? <div className="space-y-4">
              <p className="text-sm text-muted-foreground">{copy('nullHelp')}</p>
              <Button onClick={handleCanvasSave} disabled={!priorExposure}>{copy('continue')}</Button>
            </div> : (
            <CanvasErrorBoundary fallbackMessage="Canvas loading failed, please retry">
              <SymbolCanvas 
                onImageChange={setImageData}
                onSave={handleCanvasSave}
                disabled={isSubmitting}
                onCanvasReady={(c) => { fabricCanvasRef.current = c; }}
              />
            </CanvasErrorBoundary>
            )}
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-black tracking-tight">Add Details</h2>
              <p className="text-muted-foreground font-light">
                Provide context about when and how you observed this symbol.
              </p>
            </div>
            
            <MetadataForm 
              onSubmit={handleMetadataSubmit}
              initialData={metadata}
              stimulusPhotos={stimulusPhotos}
              onStimulusPhotosChange={setStimulusPhotos}
              onBack={handleBack}
            />
          </div>
        )}

        {currentStep === 3 && metadata && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-black tracking-tight">Review & Submit</h2>
              <p className="text-muted-foreground font-light">
                Confirm your submission details before finalizing.
              </p>
            </div>
            
            <SubmissionPreview
              imageData={imageData}
              metadata={metadata}
              isNullReport={isNullReport}
              onEdit={handleEditFromPreview}
              onSubmit={handleFinalSubmit}
              onBack={handleBack}
              isSubmitting={isSubmitting}
            />
          </div>
        )}

        {currentStep === 4 && (
          <SubmissionConfirmation submissionId={submissionId} />
        )}
      </div>
    </div>
  );
};