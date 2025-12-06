import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { Loader2, ArrowLeft, ArrowRight } from 'lucide-react';

const STEPS = [
  { id: 1, name: 'Draw', description: 'Create your symbol' },
  { id: 2, name: 'Details', description: 'Add metadata' },
  { id: 3, name: 'Preview', description: 'Review submission' },
  { id: 4, name: 'Complete', description: 'Confirmation' },
];

export const SubmissionWizard = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [imageData, setImageData] = useState<string>('');
  const [metadata, setMetadata] = useState<SymbolMetadata | null>(null);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [symmetryMode, setSymmetryMode] = useState(false);
  
  const navigate = useNavigate();
  const { trackStepCompleted, trackSubmissionSubmitted, trackSubmissionAbandoned } = useSubmissionTracking();
  const { trackDrawingSaved } = useCanvasTracking();

  // Track abandonment on unmount
  useEffect(() => {
    return () => {
      if (currentStep < 4 && imageData) {
        trackSubmissionAbandoned(currentStep, STEPS[currentStep - 1].name);
      }
    };
  }, [currentStep, imageData, trackSubmissionAbandoned]);

  const handleCanvasSave = () => {
    if (!imageData) {
      toast.error('Please draw something before continuing');
      return;
    }
    trackDrawingSaved(symmetryMode, showGrid);
    trackStepCompleted(1, 'Draw');
    setCurrentStep(2);
  };

  const handleMetadataSubmit = (data: SymbolMetadata) => {
    setMetadata(data);
    trackStepCompleted(2, 'Details');
    setCurrentStep(3);
  };

  const handleFinalSubmit = async () => {
    if (!imageData || !metadata) {
      toast.error('Missing required data');
      return;
    }

    setIsSubmitting(true);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please sign in to submit');
        navigate('/auth');
        return;
      }

      // Convert base64 to blob
      const response = await fetch(imageData);
      const blob = await response.blob();

      // Generate unique filename
      const timestamp = Date.now();
      const filename = `${user.id}/${timestamp}.png`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('symbol-drawings')
        .upload(filename, blob, {
          contentType: 'image/png',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('symbol-drawings')
        .getPublicUrl(filename);

      // Create submission record with metadata
      const { data: submission, error: insertError } = await supabase
        .from('symbol_submissions')
        .insert({
          user_id: user.id,
          image_url: publicUrl,
          status: 'pending',
          description: metadata.description,
          tags: metadata.tags,
          source_method: metadata.sourceMethod,
          surface_type: metadata.surfaceType || null,
          wavelength: metadata.wavelength || null,
          dose_level: metadata.doseLevel || null,
          duration_seconds: metadata.durationSeconds || null,
          recurrence: metadata.recurrence || null,
          emotional_valence: metadata.emotionalValence || null,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Trigger admin notification
      await supabase.functions.invoke('notify-admin', {
        body: { submission },
      }).catch(err => console.error('Notification error:', err));

      // Track success
      trackSubmissionSubmitted({
        source_method: metadata.sourceMethod,
        tags: metadata.tags,
        has_description: !!metadata.description,
        dose_level: metadata.doseLevel,
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
            
            <SymbolCanvas 
              onImageChange={setImageData}
              onSave={handleCanvasSave}
              disabled={isSubmitting}
            />
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
              onBack={handleBack}
            />
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-black tracking-tight">Review & Submit</h2>
              <p className="text-muted-foreground font-light">
                Confirm your submission details before finalizing.
              </p>
            </div>
            
            <SubmissionPreview
              imageData={imageData}
              metadata={metadata!}
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