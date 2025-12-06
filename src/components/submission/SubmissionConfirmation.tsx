import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CheckCircle2, ExternalLink, Plus } from 'lucide-react';

interface SubmissionConfirmationProps {
  submissionId: string | null;
}

export const SubmissionConfirmation = ({ submissionId }: SubmissionConfirmationProps) => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-8 text-center">
      {/* Success Icon */}
      <div className="relative">
        <div className="w-24 h-24 rounded-full bg-green-500/10 flex items-center justify-center animate-in zoom-in-50 duration-500">
          <CheckCircle2 className="w-12 h-12 text-green-500" />
        </div>
        {/* Glow effect */}
        <div className="absolute inset-0 rounded-full bg-green-500/20 blur-xl -z-10" />
      </div>

      {/* Message */}
      <div className="space-y-3 max-w-md">
        <h3 className="text-3xl font-black tracking-tight">Symbol Submitted!</h3>
        <p className="text-muted-foreground font-light leading-relaxed">
          Your symbol has been added to the registry and is now pending review. 
          Once approved, it will be visible in the public catalogue for correlation analysis.
        </p>
      </div>

      {/* Submission ID */}
      {submissionId && (
        <div className="bg-secondary/30 border border-border rounded-lg px-4 py-2">
          <p className="text-xs text-muted-foreground mb-1">Submission ID</p>
          <p className="font-mono text-sm">{submissionId.slice(0, 8)}...</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <Button 
          variant="outline" 
          onClick={() => navigate('/submit-symbol')}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          Submit Another
        </Button>
        <Button 
          onClick={() => navigate('/registry')}
          className="gap-2"
        >
          <ExternalLink className="w-4 h-4" />
          View Registry
        </Button>
      </div>

      {/* Next Steps */}
      <div className="pt-8 border-t border-border w-full max-w-md">
        <h4 className="text-sm font-medium mb-4">What happens next?</h4>
        <ol className="text-left text-sm text-muted-foreground space-y-2">
          <li className="flex gap-3">
            <span className="text-primary font-medium">1.</span>
            Your submission enters the moderation queue
          </li>
          <li className="flex gap-3">
            <span className="text-primary font-medium">2.</span>
            A reviewer checks for quality and compliance
          </li>
          <li className="flex gap-3">
            <span className="text-primary font-medium">3.</span>
            Once approved, your symbol joins the public registry
          </li>
          <li className="flex gap-3">
            <span className="text-primary font-medium">4.</span>
            Community members can validate and add tags
          </li>
        </ol>
      </div>
    </div>
  );
};