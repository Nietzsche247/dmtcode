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
  const [organizerLead, setOrganizerLead] = useState("");
  const [institution, setInstitution] = useState("");
  const [pi, setPi] = useState("");
  const [trialType, setTrialType] = useState("Citizen-Science Experiment");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [status, setStatus] = useState("planned");
  const [confirmedStatus, setConfirmedStatus] = useState("Partially");
  const [location, setLocation] = useState("");
  const [eligibility, setEligibility] = useState("");
  const [registryId, setRegistryId] = useState("");
  const [doi, setDoi] = useState("");
  const [url, setUrl] = useState("");
  const [applicationUrl, setApplicationUrl] = useState("");
  const [source, setSource] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      toast.error("Please log in to submit trials");
      return;
    }

    if (!title || !organizerLead || !startDate) {
      toast.error("Title, organizer/lead, and start date are required");
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from("clinical_trials").insert({
      title,
      description: description || null,
      institution: institution || organizerLead,
      principal_investigator: pi || null,
      organizer_lead: organizerLead,
      trial_type: trialType,
      status,
      confirmed_status: confirmedStatus,
      start_date: startDate,
      end_date: endDate || null,
      location: location || null,
      eligibility: eligibility || null,
      trial_registry_id: registryId || null,
      doi: doi || null,
      url: url || null,
      application_url: applicationUrl || null,
      source: source || null,
      notes: notes || null,
      submitted_by: user.id,
      is_approved: false,
    });
    setSubmitting(false);

    if (error) {
      toast.error("Failed to submit trial");
      console.error(error);
    } else {
      toast.success("Submitted for moderation. Thank you.");
      resetForm();
      onOpenChange(false);
    }
  };

  const resetForm = () => {
    setTitle(""); setDescription(""); setOrganizerLead(""); setInstitution(""); setPi("");
    setTrialType("Citizen-Science Experiment"); setStartDate(""); setEndDate("");
    setStatus("planned"); setConfirmedStatus("Partially"); setLocation("");
    setEligibility(""); setRegistryId(""); setDoi(""); setUrl(""); setApplicationUrl("");
    setSource(""); setNotes("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Suggest a Trial or Experiment</DialogTitle>
        </DialogHeader>

        <p className="text-xs text-muted-foreground">
          Submissions are moderated before appearing publicly. Please distinguish clearly
          between formal IRB-approved trials and citizen-science / retreat-based work.
        </p>

        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Trial / Experiment Name*</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={300} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="type">Type*</Label>
              <Select value={trialType} onValueChange={setTrialType}>
                <SelectTrigger id="type"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Formal Clinical Trial">Formal Clinical Trial</SelectItem>
                  <SelectItem value="Citizen-Science Experiment">Citizen-Science Experiment</SelectItem>
                  <SelectItem value="Retreat-Based Experiment">Retreat-Based Experiment</SelectItem>
                  <SelectItem value="Podcast-Mentioned">Podcast-Mentioned</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="confirmed">Confirmed?</Label>
              <Select value={confirmedStatus} onValueChange={setConfirmedStatus}>
                <SelectTrigger id="confirmed"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Confirmed">Yes — Confirmed</SelectItem>
                  <SelectItem value="Partially">Partially confirmed</SelectItem>
                  <SelectItem value="Rumored">Rumored only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="organizer">Organizer / Lead*</Label>
            <Input id="organizer" value={organizerLead} onChange={(e) => setOrganizerLead(e.target.value)} placeholder="Person, group, or institution running it" maxLength={200} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="institution">Institution (if different)</Label>
              <Input id="institution" value={institution} onChange={(e) => setInstitution(e.target.value)} maxLength={200} />
            </div>
            <div>
              <Label htmlFor="pi">Principal Investigator</Label>
              <Input id="pi" value={pi} onChange={(e) => setPi(e.target.value)} maxLength={200} />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} maxLength={2000} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate">Start Date*</Label>
              <Input id="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input id="endDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger id="status"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="planned">Planned</SelectItem>
                  <SelectItem value="recruiting">Recruiting</SelectItem>
                  <SelectItem value="active">Active / Full</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="unknown">Unknown</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="location">Location</Label>
              <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="City, country, or 'Online'" maxLength={200} />
            </div>
          </div>

          <div>
            <Label htmlFor="eligibility">Eligibility / Requirements</Label>
            <Textarea id="eligibility" value={eligibility} onChange={(e) => setEligibility(e.target.value)} rows={2} maxLength={1000} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="url">Main Information URL</Label>
              <Input id="url" type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" maxLength={500} />
            </div>
            <div>
              <Label htmlFor="applicationUrl">Application / Registration URL</Label>
              <Input id="applicationUrl" type="url" value={applicationUrl} onChange={(e) => setApplicationUrl(e.target.value)} placeholder="https://…" maxLength={500} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="registryId">Trial Registry ID</Label>
              <Input id="registryId" value={registryId} onChange={(e) => setRegistryId(e.target.value)} placeholder="e.g. NCT04433845" maxLength={100} />
            </div>
            <div>
              <Label htmlFor="doi">DOI</Label>
              <Input id="doi" value={doi} onChange={(e) => setDoi(e.target.value)} maxLength={200} />
            </div>
          </div>

          <div>
            <Label htmlFor="source">Source*</Label>
            <Input id="source" value={source} onChange={(e) => setSource(e.target.value)} placeholder="Where did you first hear of this? Podcast, forum, paper…" maxLength={300} />
          </div>

          <div>
            <Label htmlFor="notes">Notes (costs, red flags, context)</Label>
            <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} maxLength={2000} />
          </div>

          <div className="flex gap-2 pt-4">
            <Button onClick={handleSubmit} disabled={submitting} className="flex-1">
              {submitting ? "Submitting…" : "Submit for Moderation"}
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
