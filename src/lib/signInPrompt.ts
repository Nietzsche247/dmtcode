import { toast } from 'sonner';

/**
 * Every write on this site is tied to an account: each contributor gets a
 * public avatar profile name with their email hidden, and their activity feeds
 * the leaderboard. A signed out visitor must never see a bare error when they
 * try to write - they see what an account gives them and a way to get one.
 */
export const promptSignIn = (action = 'record your recognition') => {
  const returnTo =
    typeof window !== 'undefined'
      ? encodeURIComponent(window.location.pathname + window.location.search)
      : '';

  toast('An account is needed to ' + action, {
    description:
      'Accounts keep your email hidden and give you a public avatar profile name, so your contributions are credited to you and counted on the leaderboard.',
    action: {
      label: 'Sign in',
      onClick: () => {
        if (typeof window !== 'undefined') {
          window.location.href = `/auth?returnTo=${returnTo}`;
        }
      },
    },
  });
};
