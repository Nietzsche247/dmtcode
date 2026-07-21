import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Copy, Check, Github } from 'lucide-react';
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

export function RepoCloneButton() {
  const [repoUrl, setRepoUrl] = useState('');
  const [copied, setCopied] = useState<'url' | 'clone' | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setRepoUrl(saved);
  }, []);

  const cloneUrl = normalizeRepoUrl(repoUrl);
  const cloneCommand = cloneUrl ? `git clone ${cloneUrl}` : '';

  const save = () => {
    localStorage.setItem(STORAGE_KEY, repoUrl.trim());
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
              onChange={(e) => setRepoUrl(e.target.value)}
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

        <div className="flex flex-wrap gap-2">
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
              <a
                href={repoUrl.replace(/\.git$/, '')}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open on GitHub
              </a>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
