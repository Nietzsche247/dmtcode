import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Copy, Check, Github, ShieldCheck, ShieldAlert, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const STORAGE_KEY = 'admin.repoUrl';

function normalizeRepoUrl(input: string): string {
  const trimmed = input.trim().replace(/\/$/, '');
  if (!trimmed) return '';
  if (trimmed.endsWith('.git')) return trimmed;
  if (/^git@/.test(trimmed)) return trimmed;
  if (/^https?:\/\//.test(trimmed)) return `${trimmed}.git`;
  return trimmed;
}

function parseOwnerRepo(input: string): { owner: string; repo: string } | null {
  const s = input.trim().replace(/\.git$/, '').replace(/\/$/, '');
  const ssh = s.match(/^git@github\.com:([^/]+)\/(.+)$/);
  if (ssh) return { owner: ssh[1], repo: ssh[2] };
  const https = s.match(/^https?:\/\/github\.com\/([^/]+)\/([^/]+)/);
  if (https) return { owner: https[1], repo: https[2] };
  return null;
}

type VerifyState =
  | { status: 'idle' }
  | { status: 'checking' }
  | { status: 'ok'; fullName: string; isPrivate: boolean; defaultBranch: string }
  | { status: 'error'; message: string };

export function RepoCloneButton() {
  const [repoUrl, setRepoUrl] = useState('');
  const [copied, setCopied] = useState<'url' | 'clone' | null>(null);
  const [verify, setVerify] = useState<VerifyState>({ status: 'idle' });

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setRepoUrl(saved);
  }, []);

  const cloneUrl = normalizeRepoUrl(repoUrl);
  const cloneCommand = cloneUrl ? `git clone ${cloneUrl}` : '';

  const save = () => {
    localStorage.setItem(STORAGE_KEY, repoUrl.trim());
    setVerify({ status: 'idle' });
    toast.success('Repository URL saved');
  };

  const copy = async (text: string, kind: 'url' | 'clone') => {
    if (!text) {
      toast.error('Set your repository URL first');
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      toast.success(kind === 'clone' ? 'git clone command copied' : 'Repository URL copied');
      setTimeout(() => setCopied(null), 1500);
    } catch {
      toast.error('Could not access clipboard');
    }
  };

  const runVerify = async () => {
    const parsed = parseOwnerRepo(repoUrl);
    if (!parsed) {
      setVerify({ status: 'error', message: "Couldn't parse owner/repo from URL" });
      return;
    }
    setVerify({ status: 'checking' });
    try {
      const res = await fetch(`https://api.github.com/repos/${parsed.owner}/${parsed.repo}`, {
        headers: { Accept: 'application/vnd.github+json' },
      });
      if (res.status === 200) {
        const data = await res.json();
        setVerify({
          status: 'ok',
          fullName: data.full_name,
          isPrivate: !!data.private,
          defaultBranch: data.default_branch,
        });
        toast.success(`Verified ${data.full_name}`);
      } else if (res.status === 404) {
        setVerify({
          status: 'error',
          message: 'Not found — repo is private or the URL is wrong. (Public repos verify without auth.)',
        });
      } else if (res.status === 403) {
        setVerify({ status: 'error', message: 'GitHub rate limit reached. Try again in a few minutes.' });
      } else {
        setVerify({ status: 'error', message: `GitHub responded ${res.status}` });
      }
    } catch (e) {
      setVerify({ status: 'error', message: e instanceof Error ? e.message : 'Network error' });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Github className="h-5 w-5" />
          Repository Clone
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">GitHub repository URL</label>
          <div className="flex gap-2">
            <Input
              value={repoUrl}
              onChange={(e) => {
                setRepoUrl(e.target.value);
                setVerify({ status: 'idle' });
              }}
              placeholder="https://github.com/your-username/your-repo"
            />
            <Button variant="secondary" onClick={save} disabled={!repoUrl.trim()}>
              Save
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Find this in the top-right of the Lovable editor (GitHub badge). Saved locally in your browser.
          </p>
        </div>

        {cloneCommand && (
          <div className="rounded-md border bg-muted/40 p-3 font-mono text-sm break-all">
            {cloneCommand}
          </div>
        )}

        {verify.status === 'ok' && (
          <div className="flex items-start gap-2 rounded-md border border-green-500/40 bg-green-500/10 p-3 text-sm">
            <ShieldCheck className="mt-0.5 h-4 w-4 text-green-600 dark:text-green-400" />
            <div>
              <div className="font-medium">Verified: {verify.fullName}</div>
              <div className="text-xs text-muted-foreground">
                {verify.isPrivate ? 'Private repo' : 'Public repo'} · default branch{' '}
                <code>{verify.defaultBranch}</code>
              </div>
            </div>
          </div>
        )}

        {verify.status === 'error' && (
          <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm">
            <ShieldAlert className="mt-0.5 h-4 w-4 text-destructive" />
            <div>
              <div className="font-medium">Verification failed</div>
              <div className="text-xs text-muted-foreground">{verify.message}</div>
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={runVerify} disabled={!repoUrl.trim() || verify.status === 'checking'}>
            {verify.status === 'checking' ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <ShieldCheck className="mr-2 h-4 w-4" />
            )}
            Verify Repo
          </Button>
          <Button onClick={() => copy(cloneCommand, 'clone')} disabled={!cloneCommand}>
            {copied === 'clone' ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
            Copy git clone command
          </Button>
          <Button variant="outline" onClick={() => copy(cloneUrl, 'url')} disabled={!cloneUrl}>
            {copied === 'url' ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
            Copy repository URL
          </Button>
          {repoUrl.trim() && (
            <Button variant="ghost" asChild>
              <a href={repoUrl.replace(/\.git$/, '')} target="_blank" rel="noopener noreferrer">
                Open on GitHub
              </a>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
