import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { CheckCircle2, ExternalLink, Copy, RotateCcw, PartyPopper } from 'lucide-react';
import { toast } from 'sonner';

const STORAGE_KEY = 'ga4_key_event_checklist_v1';
const EVENT_NAME = 'bundle_cta_click';

const STEPS: { title: string; body: React.ReactNode; link?: { href: string; label: string }; copy?: string }[] = [
  {
    title: 'Fire a test event first',
    body: <>Use the <strong>Fire Test Event</strong> button above. GA4 needs to have seen the event at least once before it appears in the Key events picker.</>,
  },
  {
    title: 'Open GA4 Admin → Key events',
    body: <>Make sure you're in the correct property (<code className="text-xs bg-muted px-1.5 py-0.5 rounded">G-CWVKJBDG7L</code>).</>,
    link: { href: 'https://analytics.google.com/analytics/web/#/a/admin/key-events', label: 'Open Key events admin' },
  },
  {
    title: 'Click "New key event"',
    body: <>Top right of the Key events table. A side panel will slide in.</>,
  },
  {
    title: 'Enter the event name',
    body: <>Paste exactly — names are case-sensitive.</>,
    copy: EVENT_NAME,
  },
  {
    title: 'Click "Save"',
    body: <>The new key event appears in the table with a toggle already enabled. Optionally mark it as a "Default conversion event" if you also want Google Ads to import it.</>,
  },
  {
    title: 'Verify it shows up',
    body: <>Refresh the Key events page. <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{EVENT_NAME}</code> should now be listed with status <strong>On</strong>. Future fires will be counted as key events (may take up to 24h to appear in standard reports — DebugView is instant).</>,
  },
];

export const GA4KeyEventChecklist = () => {
  const [checked, setChecked] = useState<boolean[]>(() => STEPS.map(() => false));
  const [completedAt, setCompletedAt] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.checked) && parsed.checked.length === STEPS.length) {
          setChecked(parsed.checked);
        }
        if (parsed.completedAt) setCompletedAt(parsed.completedAt);
      }
    } catch { /* noop */ }
  }, []);

  const persist = (next: boolean[], completed?: string | null) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ checked: next, completedAt: completed ?? completedAt }));
  };

  const toggle = (i: number) => {
    const next = [...checked];
    next[i] = !next[i];
    setChecked(next);
    persist(next);
  };

  const allDone = checked.every(Boolean);
  const doneCount = checked.filter(Boolean).length;

  const markComplete = () => {
    const ts = new Date().toISOString();
    setCompletedAt(ts);
    persist(checked, ts);
    toast.success('Key event registration confirmed', {
      description: `bundle_cta_click marked as a GA4 key event on ${new Date(ts).toLocaleString()}`,
    });
  };

  const reset = () => {
    const next = STEPS.map(() => false);
    setChecked(next);
    setCompletedAt(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`Copied "${text}"`);
  };

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h3 className="text-lg font-black tracking-tight">Register as GA4 Key Event</h3>
          <p className="text-sm text-muted-foreground font-light mt-1">
            Guided checklist for marking <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{EVENT_NAME}</code> as a conversion.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {completedAt ? (
            <Badge className="font-black bg-emerald-600 hover:bg-emerald-600 text-white">
              <CheckCircle2 className="w-3 h-3 mr-1" /> Done
            </Badge>
          ) : (
            <Badge variant="secondary" className="font-black">{doneCount} / {STEPS.length}</Badge>
          )}
          <Button variant="ghost" size="sm" onClick={reset} title="Reset checklist">
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${(doneCount / STEPS.length) * 100}%` }}
        />
      </div>

      <ol className="space-y-3">
        {STEPS.map((step, i) => {
          const isChecked = checked[i];
          const isCurrent = !isChecked && checked.slice(0, i).every(Boolean);
          return (
            <li
              key={i}
              className={`flex gap-3 p-4 rounded-lg border transition-colors ${
                isChecked
                  ? 'border-emerald-500/30 bg-emerald-500/5'
                  : isCurrent
                  ? 'border-primary/50 bg-primary/5'
                  : 'border-border bg-card'
              }`}
            >
              <Checkbox
                checked={isChecked}
                onCheckedChange={() => toggle(i)}
                className="mt-1"
                id={`ga4-step-${i}`}
              />
              <div className="flex-1 space-y-2">
                <label htmlFor={`ga4-step-${i}`} className="block cursor-pointer">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-muted-foreground">STEP {i + 1}</span>
                    {isCurrent && !isChecked && (
                      <Badge variant="outline" className="text-[10px] font-black uppercase">Next</Badge>
                    )}
                  </div>
                  <div className={`font-bold text-sm mt-0.5 ${isChecked ? 'line-through text-muted-foreground' : ''}`}>
                    {step.title}
                  </div>
                  <div className="text-sm text-muted-foreground font-light mt-1 leading-relaxed">
                    {step.body}
                  </div>
                </label>

                <div className="flex flex-wrap gap-2">
                  {step.link && (
                    <Button asChild variant="outline" size="sm" className="font-bold">
                      <a href={step.link.href} target="_blank" rel="noreferrer">
                        {step.link.label} <ExternalLink className="w-3 h-3 ml-1" />
                      </a>
                    </Button>
                  )}
                  {step.copy && (
                    <Button variant="outline" size="sm" onClick={() => copy(step.copy!)} className="font-bold">
                      <Copy className="w-3 h-3 mr-1" /> Copy "{step.copy}"
                    </Button>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      <div className="pt-2 border-t border-border">
        {completedAt ? (
          <div className="flex items-center gap-2 text-sm">
            <PartyPopper className="w-4 h-4 text-emerald-500" />
            <span className="font-bold">Confirmed key event</span>
            <span className="text-muted-foreground font-light">
              · {new Date(completedAt).toLocaleString()}
            </span>
          </div>
        ) : (
          <Button
            onClick={markComplete}
            disabled={!allDone}
            className="w-full font-black"
            size="lg"
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            {allDone ? 'Confirm: bundle_cta_click is registered' : `Complete all ${STEPS.length} steps to confirm`}
          </Button>
        )}
      </div>
    </Card>
  );
};
