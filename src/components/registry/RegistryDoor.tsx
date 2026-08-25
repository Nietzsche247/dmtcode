import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { getSessionId } from '@/lib/anonSession';

// Segmentation door for /registry. Asks the visitor where they are with the
// phenomenon once, remembers the answer in localStorage, and points them at
// the right thing. No option is gated and no option is a dead end.

export type DoorSegment =
  | 'ran_protocol_saw_symbols'
  | 'met_entity_on_dmt'
  | 'dmt_no_protocol'
  | 'planning_protocol'
  | 'reading_researching';

const STORAGE_KEY = 'dmtcode_door_segment';

const OPTIONS: { segment: DoorSegment; label: string }[] = [
  { segment: 'ran_protocol_saw_symbols', label: 'Ran the laser protocol and saw symbols' },
  { segment: 'met_entity_on_dmt', label: 'Have met something on DMT' },
  { segment: 'dmt_no_protocol', label: 'Used DMT, not the laser protocol' },
  { segment: 'planning_protocol', label: 'Planning to try the protocol' },
  { segment: 'reading_researching', label: 'Reading and researching' },
];

const labelFor = (segment: DoorSegment): string =>
  OPTIONS.find((o) => o.segment === segment)?.label ?? segment;

const isDoorSegment = (value: string): value is DoorSegment =>
  OPTIONS.some((o) => o.segment === value);

const readStoredSegment = (): DoorSegment | null => {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored && isDoorSegment(stored)) return stored;
  } catch {
    // Private browsing or blocked site data: ask the question again.
  }
  return null;
};

const writeStoredSegment = (segment: DoorSegment): void => {
  try {
    window.localStorage.setItem(STORAGE_KEY, segment);
  } catch {
    // Storage unavailable: the door simply asks again next visit.
  }
};

// Navigation first, telemetry second. The insert runs in the background and
// any failure is swallowed silently so it can never delay or block the route.
const logTap = (segment: DoorSegment): void => {
  void (async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      await supabase.from('door_taps').insert({
        segment,
        session_id: getSessionId(),
        user_id: session?.user?.id ?? null,
      });
    } catch {
      // Telemetry must never surface an error.
    }
  })();
};

interface RegistryDoorProps {
  children: React.ReactNode;
}

export const RegistryDoor = ({ children }: RegistryDoorProps) => {
  const navigate = useNavigate();
  const [segment, setSegment] = useState<DoorSegment | null>(() => readStoredSegment());
  const [doorOpen, setDoorOpen] = useState<boolean>(() => readStoredSegment() === null);

  const handleTap = (next: DoorSegment) => {
    // Route immediately. The write happens in the background.
    writeStoredSegment(next);
    setSegment(next);
    logTap(next);

    if (next === 'ran_protocol_saw_symbols') {
      navigate('/submit-symbol');
      return;
    }
    if (next === 'planning_protocol') {
      navigate('/prepare');
      return;
    }
    // Remaining options land on the registry browse view below.
    setDoorOpen(false);
  };

  if (doorOpen) {
    return (
      <div className="max-w-xl mx-auto px-1">
        <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
          Where are you with this?
        </h3>
        <p className="text-sm text-muted-foreground mb-6">So we point you at the right thing.</p>

        <div className="flex flex-col gap-3">
          {OPTIONS.map((option) => (
            <button
              key={option.segment}
              type="button"
              onClick={() => handleTap(option.segment)}
              className="w-full min-h-[44px] px-4 py-3 rounded-lg border border-border bg-card text-left text-base text-foreground transition-colors hover:border-primary hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {option.label}
            </button>
          ))}
        </div>

        <p className="mt-6 text-xs text-muted-foreground">
          Every option leads somewhere. There is no wrong answer.
        </p>
      </div>
    );
  }

  return (
    <div>
      {segment ? (
        <div className="mb-8 flex flex-col gap-2">
          <p className="text-sm text-muted-foreground">
            You said: <span className="text-foreground">{labelFor(segment)}</span>
            {' - '}
            <button
              type="button"
              onClick={() => setDoorOpen(true)}
              className="underline text-primary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
            >
              change
            </button>
          </p>

          {segment === 'dmt_no_protocol' && (
            <p className="text-sm text-muted-foreground">
              The 650nm laser protocol is documented step by step in the{' '}
              <a href="/protocol-guide" className="underline text-primary hover:text-foreground">
                protocol guide
              </a>
              .
            </p>
          )}

          {segment === 'reading_researching' && (
            <p className="text-sm text-muted-foreground">
              Start with the{' '}
              <a href="/dataset" className="underline text-primary hover:text-foreground">
                open dataset
              </a>{' '}
              and the{' '}
              <a href="/bibliography" className="underline text-primary hover:text-foreground">
                research bibliography
              </a>
              .
            </p>
          )}
        </div>
      ) : null}

      {children}
    </div>
  );
};
