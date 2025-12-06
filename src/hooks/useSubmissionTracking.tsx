import { useCallback } from 'react';

// PostHog tracking hook for submission flow
export const useSubmissionTracking = () => {
  const trackStepCompleted = useCallback((stepNumber: number, stepName: string) => {
    if (typeof window !== 'undefined' && (window as any).posthog) {
      (window as any).posthog.capture('submission_step_completed', {
        step_number: stepNumber,
        step_name: stepName,
      });
    }
    console.log('Submission step completed:', { stepNumber, stepName });
  }, []);

  const trackSubmissionSubmitted = useCallback((metadata: {
    source_method?: string;
    tags?: string[];
    has_description: boolean;
    dose_level?: string;
  }) => {
    if (typeof window !== 'undefined' && (window as any).posthog) {
      (window as any).posthog.capture('submission_submitted', metadata);
    }
    console.log('Submission submitted:', metadata);
  }, []);

  const trackSubmissionAbandoned = useCallback((lastStep: number, stepName: string) => {
    if (typeof window !== 'undefined' && (window as any).posthog) {
      (window as any).posthog.capture('submission_abandoned', {
        last_step: lastStep,
        step_name: stepName,
      });
    }
    console.log('Submission abandoned at step:', { lastStep, stepName });
  }, []);

  return {
    trackStepCompleted,
    trackSubmissionSubmitted,
    trackSubmissionAbandoned,
  };
};