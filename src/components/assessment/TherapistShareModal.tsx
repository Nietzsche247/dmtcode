import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Copy, Check, AlertCircle, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TherapistShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  assessmentId: string;
}

export function TherapistShareModal({ isOpen, onClose, assessmentId }: TherapistShareModalProps) {
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const generateShareLink = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('share-assessment', {
        body: {
          action: 'generate_link',
          assessment_id: assessmentId
        }
      });

      if (error) throw error;
      setShareUrl(data.share_url);
      toast.success('Share link generated');
    } catch (error) {
      console.error('Failed to generate share link:', error);
      toast.error('Failed to generate share link');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async () => {
    if (shareUrl) {
      await navigator.clipboard.writeText(shareUrl);
      setIsCopied(true);
      toast.success('Link copied to clipboard');
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const revokeLink = async () => {
    try {
      const { error } = await supabase.functions.invoke('share-assessment', {
        body: {
          action: 'revoke_link',
          assessment_id: assessmentId
        }
      });

      if (error) throw error;
      setShareUrl(null);
      toast.success('Share link revoked');
    } catch (error) {
      console.error('Failed to revoke share link:', error);
      toast.error('Failed to revoke share link');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Share with Therapist
          </DialogTitle>
          <DialogDescription>
            Generate a secure, de-identified link for your therapist or healthcare provider.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Privacy Notice */}
          <div className="flex gap-3 p-3 bg-muted/50 rounded-lg">
            <AlertCircle className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
            <div className="text-sm text-muted-foreground">
              <p className="font-medium text-foreground">Privacy Protected</p>
              <p>The shared report contains your assessment scores and reflections, but excludes personally identifying information.</p>
            </div>
          </div>

          {!shareUrl ? (
            <Button 
              onClick={generateShareLink} 
              disabled={isGenerating}
              className="w-full bg-primary hover:bg-primary/90"
            >
              {isGenerating ? 'Generating...' : 'Generate Secure Link'}
            </Button>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Share Link</Label>
                <div className="flex gap-2">
                  <Input 
                    value={shareUrl} 
                    readOnly 
                    className="font-mono text-xs"
                  />
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={copyToClipboard}
                  >
                    {isCopied ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={revokeLink}
                  className="flex-1"
                >
                  Revoke Access
                </Button>
                <Button 
                  onClick={copyToClipboard}
                  className="flex-1"
                >
                  {isCopied ? 'Copied!' : 'Copy Link'}
                </Button>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="text-xs text-muted-foreground space-y-1">
            <p>• Link expires after 30 days or when revoked</p>
            <p>• Only assessment data is shared, not your account</p>
            <p>• You can revoke access at any time</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
