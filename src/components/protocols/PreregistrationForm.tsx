import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

// Intake for the pre-registration open call on the physiological
// instrumentation protocol. A pre-registration is a hypothesis and a method,
// so it does not belong in the symbol wizard. Rows are readable by
// administrators only.

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export const PreregistrationForm = () => {
  const [title, setTitle] = useState('');
  const [hypothesis, setHypothesis] = useState('');
  const [methodSummary, setMethodSummary] = useState('');
  const [instruments, setInstruments] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [orcid, setOrcid] = useState('');
  const [affiliation, setAffiliation] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (title.trim().length < 3) {
      toast.error('Add a title of at least three characters.');
      return;
    }
    if (hypothesis.trim().length < 10 || methodSummary.trim().length < 10) {
      toast.error('The hypothesis and the method summary each need at least ten characters.');
      return;
    }
    if (!EMAIL_RE.test(contactEmail.trim())) {
      toast.error('Enter a contact email we can reply to.');
      return;
    }

    setSubmitting(true);
    const { data, error } = await supabase
      .from('research_preregistrations')
      .insert({
        title: title.trim(),
        hypothesis: hypothesis.trim(),
        method_summary: methodSummary.trim(),
        instruments: instruments.trim() || null,
        contact_email: contactEmail.trim(),
        orcid: orcid.trim() || null,
        affiliation: affiliation.trim() || null,
      })
      .select('id')
      .maybeSingle();
    setSubmitting(false);

    if (error) {
      console.error('Pre-registration insert failed:', error);
      toast.error('The pre-registration was not recorded. Please try again.');
      return;
    }

    supabase.functions
      .invoke('notify-admin', {
        body: { type: 'preregistration', preregistrationId: data?.id ?? null },
      })
      .catch(console.error);

    setSubmitted(true);
    toast.success('Pre-registration recorded.');
  };

  if (submitted) {
    return (
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-3">Pre-registration recorded</h2>
        <p className="text-muted-foreground text-sm">
          Your pre-registration is stored and an administrator has been notified. It sits at status
          "submitted" until a person reads it. We cannot promise a review date. If it is taken
          further you will hear from the contact address you gave. If you hear nothing, the record
          still exists and is still readable by the reviewers.
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-2">Pre-register a planned instrumented arm</h2>
      <p className="text-muted-foreground text-sm mb-6">
        State the hypothesis and the method before you collect data. Nothing here is published
        automatically. Only administrators can read what you submit.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="prereg-title">Title</Label>
          <Input
            id="prereg-title"
            value={title}
            maxLength={300}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div>
          <Label htmlFor="prereg-hypothesis">Hypothesis</Label>
          <Textarea
            id="prereg-hypothesis"
            value={hypothesis}
            maxLength={4000}
            rows={4}
            onChange={(e) => setHypothesis(e.target.value)}
            required
          />
        </div>

        <div>
          <Label htmlFor="prereg-method">Method summary</Label>
          <Textarea
            id="prereg-method"
            value={methodSummary}
            maxLength={6000}
            rows={5}
            onChange={(e) => setMethodSummary(e.target.value)}
            required
          />
        </div>

        <div>
          <Label htmlFor="prereg-instruments">Instruments</Label>
          <Textarea
            id="prereg-instruments"
            value={instruments}
            maxLength={2000}
            rows={3}
            onChange={(e) => setInstruments(e.target.value)}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="prereg-email">Contact email</Label>
            <Input
              id="prereg-email"
              type="email"
              value={contactEmail}
              maxLength={254}
              onChange={(e) => setContactEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="prereg-orcid">ORCID</Label>
            <Input
              id="prereg-orcid"
              value={orcid}
              maxLength={100}
              onChange={(e) => setOrcid(e.target.value)}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="prereg-affiliation">Affiliation</Label>
          <Input
            id="prereg-affiliation"
            value={affiliation}
            maxLength={300}
            onChange={(e) => setAffiliation(e.target.value)}
          />
        </div>

        <Button type="submit" disabled={submitting}>
          {submitting ? 'Submitting...' : 'Submit pre-registration'}
        </Button>
      </form>
    </Card>
  );
};
