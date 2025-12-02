import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Calendar, Building2, User, ExternalLink, FileText } from "lucide-react";
import CommunityNotes from "./CommunityNotes";
import NotifyMeForm from "./NotifyMeForm";
import ICalExport from "./ICalExport";

interface ClinicalTrial {
  id: string;
  title: string;
  description: string | null;
  institution: string;
  principal_investigator: string | null;
  start_date: string;
  end_date: string | null;
  status: string;
  trial_registry_id: string | null;
  doi: string | null;
  url: string | null;
}

interface TrialDetailModalProps {
  trial: ClinicalTrial | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const statusColors: Record<string, string> = {
  planned: 'bg-gray-500',
  recruiting: 'bg-blue-500',
  active: 'bg-blue-700',
  completed: 'bg-green-600',
};

const TrialDetailModal = ({ trial, open, onOpenChange }: TrialDetailModalProps) => {
  if (!trial) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{trial.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Badge className={`${statusColors[trial.status]} text-white capitalize`}>
            {trial.status}
          </Badge>

          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              <span>{trial.institution}</span>
            </div>
            {trial.principal_investigator && (
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span>PI: {trial.principal_investigator}</span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>Start: {new Date(trial.start_date).toLocaleDateString()}</span>
            </div>
            {trial.end_date && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>End: {new Date(trial.end_date).toLocaleDateString()}</span>
              </div>
            )}
          </div>

          {trial.trial_registry_id && (
            <div className="flex items-center gap-2 text-sm">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Registry ID:</span>
              <code className="text-xs bg-muted px-2 py-1 rounded">{trial.trial_registry_id}</code>
            </div>
          )}

          {trial.description && (
            <div>
              <h3 className="font-semibold mb-2">Study Description</h3>
              <p className="text-muted-foreground">{trial.description}</p>
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            {trial.doi && (
              <a
                href={`https://doi.org/${trial.doi}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-primary hover:underline text-sm"
              >
                DOI Link <ExternalLink className="w-4 h-4" />
              </a>
            )}
            {trial.url && (
              <a
                href={trial.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-primary hover:underline text-sm"
              >
                Trial Website <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>

          <div className="border-t pt-4 space-y-3">
            <ICalExport
              title={trial.title}
              description={trial.description || undefined}
              startDate={trial.start_date}
              endDate={trial.end_date || undefined}
              location={trial.institution}
              url={trial.url || undefined}
            />
            <NotifyMeForm
              entityType="trial"
              entityName={trial.title}
              entityDate={trial.start_date}
            />
          </div>

          <CommunityNotes entityType="trial" entityId={trial.id} />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TrialDetailModal;
