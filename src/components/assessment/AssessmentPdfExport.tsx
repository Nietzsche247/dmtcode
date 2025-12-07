import { Button } from '@/components/ui/button';
import { FileDown, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface AssessmentScores {
  phq9_score: number | null;
  gad7_score: number | null;
  meq4_score: number | null;
  ceq7_score: number | null;
  mood_pre: number | null;
  mood_post: number | null;
  created_at: string;
}

interface AssessmentPdfExportProps {
  scores: AssessmentScores;
  assessmentId?: string;
}

const getPhq9Interpretation = (score: number | null): string => {
  if (score === null) return "Not assessed";
  if (score <= 4) return "Minimal depression";
  if (score <= 9) return "Mild depression";
  if (score <= 14) return "Moderate depression";
  if (score <= 19) return "Moderately severe depression";
  return "Severe depression";
};

const getGad7Interpretation = (score: number | null): string => {
  if (score === null) return "Not assessed";
  if (score <= 4) return "Minimal anxiety";
  if (score <= 9) return "Mild anxiety";
  if (score <= 14) return "Moderate anxiety";
  return "Severe anxiety";
};

const getMeq4Interpretation = (score: number | null): string => {
  if (score === null) return "Not assessed";
  if (score <= 4) return "Minimal";
  if (score <= 8) return "Low";
  if (score <= 12) return "Moderate";
  if (score <= 16) return "Strong";
  return "Complete";
};

const getCeq7Interpretation = (score: number | null): string => {
  if (score === null) return "Not assessed";
  if (score <= 7) return "Minimal";
  if (score <= 14) return "Mild";
  if (score <= 21) return "Moderate";
  return "Intense";
};

export const AssessmentPdfExport = ({ scores, assessmentId }: AssessmentPdfExportProps) => {
  const [isExporting, setIsExporting] = useState(false);

  const exportToPdf = async () => {
    setIsExporting(true);
    
    try {
      // Track export event
      if (typeof window !== 'undefined' && (window as any).posthog) {
        (window as any).posthog.capture('assessment_pdf_exported', {
          assessment_id: assessmentId,
          phq9_score: scores.phq9_score,
          gad7_score: scores.gad7_score,
        });
      }

      const moodDelta = scores.mood_post !== null && scores.mood_pre !== null 
        ? scores.mood_post - scores.mood_pre 
        : null;

      // Generate HTML content for PDF
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Psychedelic Experience Assessment Report</title>
          <style>
            body { font-family: 'Helvetica Neue', Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; color: #111; }
            h1 { font-size: 24px; margin-bottom: 8px; }
            h2 { font-size: 18px; margin-top: 24px; margin-bottom: 12px; border-bottom: 2px solid #C41E3A; padding-bottom: 4px; }
            .meta { color: #666; font-size: 12px; margin-bottom: 24px; }
            .score-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 24px; }
            .score-card { background: #f5f5f5; padding: 16px; border-radius: 8px; }
            .score-label { font-size: 12px; color: #666; margin-bottom: 4px; }
            .score-value { font-size: 28px; font-weight: bold; color: #C41E3A; }
            .score-interp { font-size: 14px; color: #333; margin-top: 4px; }
            .mood-section { display: flex; gap: 24px; margin-bottom: 24px; }
            .mood-box { flex: 1; background: #f5f5f5; padding: 16px; border-radius: 8px; text-align: center; }
            .mood-value { font-size: 32px; font-weight: bold; }
            .delta-positive { color: #22c55e; }
            .delta-negative { color: #ef4444; }
            .disclaimer { font-size: 11px; color: #999; margin-top: 32px; padding-top: 16px; border-top: 1px solid #ddd; }
            @media print { body { padding: 20px; } }
          </style>
        </head>
        <body>
          <h1>Psychedelic Experience Assessment Report</h1>
          <div class="meta">
            Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            ${assessmentId ? ` | ID: ${assessmentId.slice(0, 8)}` : ''}
          </div>

          <h2>Mood Change</h2>
          <div class="mood-section">
            <div class="mood-box">
              <div class="score-label">Pre-Session</div>
              <div class="mood-value">${scores.mood_pre ?? '—'}/10</div>
            </div>
            <div class="mood-box">
              <div class="score-label">Post-Session</div>
              <div class="mood-value">${scores.mood_post ?? '—'}/10</div>
            </div>
            <div class="mood-box">
              <div class="score-label">Change</div>
              <div class="mood-value ${moodDelta !== null && moodDelta > 0 ? 'delta-positive' : moodDelta !== null && moodDelta < 0 ? 'delta-negative' : ''}">
                ${moodDelta !== null ? (moodDelta > 0 ? '+' : '') + moodDelta : '—'}
              </div>
            </div>
          </div>

          <h2>Clinical Scales</h2>
          <div class="score-grid">
            <div class="score-card">
              <div class="score-label">PHQ-9 (Depression)</div>
              <div class="score-value">${scores.phq9_score ?? '—'}/27</div>
              <div class="score-interp">${getPhq9Interpretation(scores.phq9_score)}</div>
            </div>
            <div class="score-card">
              <div class="score-label">GAD-7 (Anxiety)</div>
              <div class="score-value">${scores.gad7_score ?? '—'}/21</div>
              <div class="score-interp">${getGad7Interpretation(scores.gad7_score)}</div>
            </div>
            <div class="score-card">
              <div class="score-label">MEQ-4 (Mystical Experience)</div>
              <div class="score-value">${scores.meq4_score ?? '—'}/20</div>
              <div class="score-interp">${getMeq4Interpretation(scores.meq4_score)}</div>
            </div>
            <div class="score-card">
              <div class="score-label">CEQ-7 (Challenging Experience)</div>
              <div class="score-value">${scores.ceq7_score ?? '—'}/28</div>
              <div class="score-interp">${getCeq7Interpretation(scores.ceq7_score)}</div>
            </div>
          </div>

          <div class="disclaimer">
            <strong>Disclaimer:</strong> This assessment is for personal tracking purposes only and does not constitute medical advice or diagnosis. 
            PHQ-9 and GAD-7 are validated screening tools but should be interpreted by a qualified healthcare professional. 
            If you are experiencing distress, please consult a mental health professional.
            <br><br>
            Generated by DMT Code Project | dmtcode.com
          </div>
        </body>
        </html>
      `;

      // Create a blob and open in new window for printing
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const printWindow = window.open(url, '_blank');
      
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
        toast.success('PDF export ready', { description: 'Use the print dialog to save as PDF' });
      } else {
        // Fallback: download HTML file
        const link = document.createElement('a');
        link.href = url;
        link.download = `assessment-report-${assessmentId?.slice(0, 8) || 'export'}.html`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('Report downloaded', { description: 'Open in browser and print to PDF' });
      }
      
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('PDF export error:', error);
      toast.error('Failed to export PDF');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button 
      onClick={exportToPdf} 
      disabled={isExporting}
      variant="outline"
      className="gap-2"
    >
      {isExporting ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <FileDown className="h-4 w-4" />
      )}
      Export PDF Report
    </Button>
  );
};
