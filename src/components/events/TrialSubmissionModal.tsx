import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TrialSubmissionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TrialSubmissionModal = ({ open, onOpenChange }: TrialSubmissionModalProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [institution, setInstitution] = useState("");
  const [pi, setPi] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [status, setStatus] = useState("planned");
  const [registryId, setRegistryId] = useState("");
  const [doi, setDoi] = useState("");
  const [url, setUrl] = useState("");

  const handleSubmit = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast.error("Please log in to submit trials");
      return;
    }

    if (!title || !institution || !startDate) {
      toast.error("Title, institution, and start date are required");
      return;
    }

    const { error } = await supabase.from("clinical_trials").insert({
      title,
      description: description || null,
      institution,
      principal_investigator: pi || null,
      start_date: startDate,
      end_date: endDate || null,
      status,
      trial_registry_id: registryId || null,
      doi: doi || null,
      url: url || null,
      submitted_by: user.id,
    });

    if (error) {
      toast.error("Failed to submit trial");
      console.error(error);
    } else {
      toast.success("Clinical trial submitted for moderation");
      resetForm();
      onOpenChange(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setInstitution("");
    setPi("");
    setStartDate("");
    setEndDate("");
    setStatus("planned");
    setRegistryId("");
    setDoi("");
    setUrl("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Submit Clinical Trial</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Trial Title*</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Phase II DMT for Treatment-Resistant Depression"
            />
          </div>

          <div>
            <Label htmlFor="description">Study Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the study protocol..."
              rows={4}
            />
          </div>

          <div>
            <Label htmlFor="institution">Institution*</Label>
            <Input
              id="institution"
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
              placeholder="e.g., Johns Hopkins University"
            />
          </div>

          <div>
            <Label htmlFor="pi">Principal Investigator</Label>
            <Input
              id="pi"
              value={pi}
              onChange={(e) => setPi(e.target.value)}
              placeholder="e.g., Dr. Roland Griffiths"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate">Start Date*</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="endDate">End Date (if completed)</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="planned">Planned</SelectItem>
                <SelectItem value="recruiting">Recruiting</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="registryId">Trial Registry ID</Label>
            <Input
              id="registryId"
              value={registryId}
              onChange={(e) => setRegistryId(e.target.value)}
              placeholder="e.g., NCT04433845"
            />
          </div>

          <div>
            <Label htmlFor="doi">DOI (if published)</Label>
            <Input
              id="doi"
              value={doi}
              onChange={(e) => setDoi(e.target.value)}
              placeholder="e.g., 10.1001/jamapsychiatry.2020.0013"
            />
          </div>

          <div>
            <Label htmlFor="url">Trial Website URL</Label>
            <Input
              id="url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button onClick={handleSubmit} className="flex-1">
              Submit for Moderation
            </Button>
            <Button onClick={() => onOpenChange(false)} variant="outline">
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TrialSubmissionModal;
