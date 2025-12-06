import { SymbolMetadata } from './MetadataForm';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Edit2, Send, Loader2 } from 'lucide-react';

interface SubmissionPreviewProps {
  imageData: string;
  metadata: SymbolMetadata;
  onEdit: (step: 'draw' | 'metadata') => void;
  onSubmit: () => void;
  onBack: () => void;
  isSubmitting: boolean;
}

const SOURCE_METHOD_LABELS: Record<string, string> = {
  laser_650nm: '650nm Laser Protocol',
  closed_eye: 'Closed Eye Visuals',
  open_eye: 'Open Eye Visuals',
  other: 'Other Method',
};

const DOSE_LEVEL_LABELS: Record<string, string> = {
  threshold: 'Threshold',
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  heroic: 'Heroic',
};

const RECURRENCE_LABELS: Record<string, string> = {
  once: 'Seen Once',
  multiple: 'Multiple Times',
  persistent: 'Persistent/Ongoing',
};

const VALENCE_LABELS: Record<string, string> = {
  positive: 'Positive',
  neutral: 'Neutral',
  negative: 'Negative',
  mixed: 'Mixed',
};

export const SubmissionPreview = ({
  imageData,
  metadata,
  onEdit,
  onSubmit,
  onBack,
  isSubmitting,
}: SubmissionPreviewProps) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Symbol Preview */}
        <Card className="overflow-hidden">
          <CardContent className="p-4">
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-medium">Symbol Drawing</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit('draw')}
                className="gap-1 text-muted-foreground hover:text-foreground"
              >
                <Edit2 className="w-3 h-3" />
                Edit
              </Button>
            </div>
            <div className="bg-white rounded-lg p-2 flex items-center justify-center">
              <img
                src={imageData}
                alt="Your symbol drawing"
                className="max-w-full max-h-[300px] object-contain"
              />
            </div>
          </CardContent>
        </Card>

        {/* Metadata Preview */}
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-medium">Details</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit('metadata')}
                className="gap-1 text-muted-foreground hover:text-foreground"
              >
                <Edit2 className="w-3 h-3" />
                Edit
              </Button>
            </div>
            
            <div className="space-y-4">
              {/* Description */}
              <div>
                <p className="text-sm text-muted-foreground mb-1">Description</p>
                <p className="text-sm">{metadata.description}</p>
              </div>

              {/* Tags */}
              <div>
                <p className="text-sm text-muted-foreground mb-1">Tags</p>
                <div className="flex flex-wrap gap-1.5">
                  {metadata.tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Source Method */}
              <div>
                <p className="text-sm text-muted-foreground mb-1">Source Method</p>
                <p className="text-sm">{SOURCE_METHOD_LABELS[metadata.sourceMethod]}</p>
              </div>

              {/* Optional Fields */}
              <div className="grid grid-cols-2 gap-3">
                {metadata.surfaceType && (
                  <div>
                    <p className="text-xs text-muted-foreground">Surface</p>
                    <p className="text-sm">{metadata.surfaceType}</p>
                  </div>
                )}
                {metadata.wavelength && (
                  <div>
                    <p className="text-xs text-muted-foreground">Wavelength</p>
                    <p className="text-sm">{metadata.wavelength}</p>
                  </div>
                )}
                {metadata.doseLevel && (
                  <div>
                    <p className="text-xs text-muted-foreground">Dose Level</p>
                    <p className="text-sm">{DOSE_LEVEL_LABELS[metadata.doseLevel]}</p>
                  </div>
                )}
                {metadata.durationSeconds && (
                  <div>
                    <p className="text-xs text-muted-foreground">Duration</p>
                    <p className="text-sm">{metadata.durationSeconds}s</p>
                  </div>
                )}
                {metadata.recurrence && (
                  <div>
                    <p className="text-xs text-muted-foreground">Recurrence</p>
                    <p className="text-sm">{RECURRENCE_LABELS[metadata.recurrence]}</p>
                  </div>
                )}
                {metadata.emotionalValence && (
                  <div>
                    <p className="text-xs text-muted-foreground">Emotional Valence</p>
                    <p className="text-sm">{VALENCE_LABELS[metadata.emotionalValence]}</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Submission Notice */}
      <div className="bg-secondary/30 border border-border rounded-lg p-4 text-center">
        <p className="text-sm text-muted-foreground">
          By submitting, you agree that your symbol and metadata will be added to the 
          public registry under CC-BY-4.0 license for research purposes.
        </p>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={isSubmitting}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        
        <Button 
          onClick={onSubmit} 
          disabled={isSubmitting}
          className="gap-2 min-w-[160px] bg-primary hover:bg-primary/90 transition-all hover:shadow-[0_0_20px_rgba(196,30,58,0.3)]"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Submit Symbol
            </>
          )}
        </Button>
      </div>
    </div>
  );
};