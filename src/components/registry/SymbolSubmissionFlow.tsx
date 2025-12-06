import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { SymbolCanvas } from './SymbolCanvas';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useCanvasTracking } from '@/hooks/useCanvasTracking';
import { Loader2, CheckCircle2 } from 'lucide-react';

interface SymbolSubmissionFlowProps {
  onSuccess?: () => void;
}

export const SymbolSubmissionFlow = ({ onSuccess }: SymbolSubmissionFlowProps) => {
  const [imageData, setImageData] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [symmetryMode, setSymmetryMode] = useState(false);
  const navigate = useNavigate();
  const { trackDrawingSaved } = useCanvasTracking();

  const handleSave = async () => {
    if (!imageData) {
      toast.error('Please draw something before saving');
      return;
    }

    setIsSubmitting(true);

    try {
      // Check authentication
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('Please sign in to submit symbols', {
          action: {
            label: 'Sign In',
            onClick: () => navigate('/auth'),
          },
        });
        setIsSubmitting(false);
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

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('symbol-drawings')
        .getPublicUrl(filename);

      // Create submission record
      const { error: insertError } = await supabase
        .from('symbol_submissions')
        .insert({
          user_id: user.id,
          image_url: publicUrl,
          status: 'pending',
        });

      if (insertError) {
        throw insertError;
      }

      // Track successful save
      trackDrawingSaved(symmetryMode, showGrid);

      setIsComplete(true);
      toast.success('Symbol submitted successfully!');
      onSuccess?.();

    } catch (error: any) {
      console.error('Submission error:', error);
      toast.error(error.message || 'Failed to submit symbol');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isComplete) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-6 text-center">
        <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center">
          <CheckCircle2 className="w-10 h-10 text-green-500" />
        </div>
        <div className="space-y-2">
          <h3 className="text-2xl font-bold">Symbol Submitted!</h3>
          <p className="text-muted-foreground max-w-md">
            Your symbol has been submitted for review. Once approved, it will be visible in the registry.
          </p>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={() => {
              setIsComplete(false);
              setImageData('');
            }}
          >
            Submit Another
          </Button>
          <Button onClick={() => navigate('/registry')}>
            View Registry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Draw Your Symbol</h2>
        <p className="text-muted-foreground">
          Use the canvas below to draw a symbol you've observed. Black on white only.
        </p>
      </div>

      <SymbolCanvas 
        onImageChange={setImageData}
        onSave={handleSave}
        disabled={isSubmitting}
      />

      {isSubmitting && (
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Uploading symbol...</span>
        </div>
      )}
    </div>
  );
};