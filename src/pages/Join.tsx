import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { AvatarGlyph } from '@/components/AvatarGlyph';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const ROLE_OPTIONS = [
  { id: 'test_subject', label: 'Test Subject (blinded study)' },
  { id: 'recorder', label: 'Recorder' },
  { id: 'translator', label: 'Translator' },
  { id: 'moderator', label: 'Moderator' },
  { id: 'analyst', label: 'Analyst' },
  { id: 'developer', label: 'Developer' },
  { id: 'outreach', label: 'Outreach' },
  { id: 'peer_support', label: 'Peer Support' },
];

const schema = z.object({
  email: z.string().trim().email('Enter a valid email').max(255),
  roles: z.array(z.string()).min(1, 'Choose at least one role'),
  experience_level: z.string().max(80).optional(),
  languages: z.string().max(300).optional(),
  skills: z.string().max(1000).optional(),
  why: z.string().max(2000).optional(),
  consent_contact: z.boolean(),
});

const Join = () => {
  const navigate = useNavigate();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [profile, setProfile] = useState<{ handle: string; avatar_seed: string; id: string; email?: string } | null>(null);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);

  const [email, setEmail] = useState('');
  const [roles, setRoles] = useState<string[]>([]);
  const [experience, setExperience] = useState('');
  const [languages, setLanguages] = useState('');
  const [skills, setSkills] = useState('');
  const [why, setWhy] = useState('');
  const [consent, setConsent] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        navigate(`/auth?returnTo=${encodeURIComponent('/join')}`);
        return;
      }
      const { data: prof } = await supabase
        .from('profiles')
        .select('id, handle, avatar_seed')
        .eq('id', session.user.id)
        .maybeSingle();
      if (prof) {
        setProfile({ ...prof, email: session.user.email ?? '' });
        setEmail(session.user.email ?? '');
      }
      const { data: existing } = await supabase
        .from('volunteers')
        .select('id')
        .eq('user_id', session.user.id)
        .limit(1)
        .maybeSingle();
      if (existing) setAlreadySubmitted(true);
      setCheckingAuth(false);
    })();
  }, [navigate]);

  const toggleRole = (id: string) => {
    setRoles((prev) => (prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSubmitting(true);
    try {
      const parsed = schema.parse({
        email,
        roles,
        experience_level: experience || undefined,
        languages: languages || undefined,
        skills: skills || undefined,
        why: why || undefined,
        consent_contact: consent,
      });

      const { error } = await supabase.from('volunteers').insert({
        user_id: profile.id,
        handle: profile.handle,
        email: parsed.email,
        roles: parsed.roles,
        experience_level: parsed.experience_level ?? null,
        languages: parsed.languages ? parsed.languages.split(',').map((s) => s.trim()).filter(Boolean) : null,
        skills: parsed.skills ?? null,
        why: parsed.why ?? null,
        consent_contact: parsed.consent_contact,
      });

      if (error) {
        toast.error('Could not submit', { description: error.message });
        return;
      }

      toast.success('Thank you. Your interest has been recorded.', {
        description: 'We will reach out when a role matches.',
      });
      setAlreadySubmitted(true);
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast.error(err.issues[0].message);
      } else {
        toast.error('Unexpected error. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Help build it — DMT Code</title>
        <meta name="description" content="Volunteer to help run a real experiment into a shared visual world. Recorders, translators, analysts, developers, and test subjects welcome." />
        <link rel="canonical" href="https://dmtcode.com/join" />
      </Helmet>

      <Navigation />

      <main className="min-h-screen">
        <section className="container mx-auto px-4 pt-28 pb-16 max-w-3xl">
          <p className="label-data text-xs text-primary mb-4">HELP BUILD IT</p>
          <h1
            className="text-4xl md:text-5xl leading-tight text-foreground"
            style={{ fontFamily: "'Fraunces', Georgia, serif", fontWeight: 500 }}
          >
            A real experiment with an unknown answer.
          </h1>
          <div
            className="mt-6 space-y-5 text-lg text-muted-foreground leading-relaxed"
            style={{ fontFamily: "'Hanken Grotesk', system-ui, sans-serif" }}
          >
            <p>
              Thousands of strangers keep seeing the same hidden world. We are testing that
              honestly, together, until we know what is real.
            </p>
            <p>
              You do not need credentials to help. You need care, honesty, and time. Tell us how you
              can contribute and we will match you to a role.
            </p>
          </div>

          {profile && (
            <div className="mt-8 flex items-center gap-3 rounded-sm border border-border bg-card px-4 py-3">
              <AvatarGlyph seed={profile.avatar_seed} handle={profile.handle} size={44} />
              <div>
                <p className="text-sm text-foreground">Signed in as <span className="font-medium">{profile.handle}</span></p>
                <p className="text-xs text-muted-foreground">Your real name stays private.</p>
              </div>
            </div>
          )}
        </section>

        <section className="container mx-auto px-4 pb-24 max-w-3xl">
          {alreadySubmitted ? (
            <div className="rounded-sm border border-border bg-card p-8 text-center space-y-3">
              <h2
                className="text-2xl text-foreground"
                style={{ fontFamily: "'Fraunces', Georgia, serif", fontWeight: 500 }}
              >
                You are on the list.
              </h2>
              <p className="text-muted-foreground">
                We have your volunteer entry. Thank you for helping us find out honestly.
              </p>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-8 rounded-sm border border-border bg-card p-6 md:p-8">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11"
                />
                <p className="text-xs text-muted-foreground">Only used to reach you about a role.</p>
              </div>

              <div className="space-y-3">
                <Label>Roles you can help with</Label>
                <div className="grid sm:grid-cols-2 gap-2">
                  {ROLE_OPTIONS.map((r) => (
                    <label
                      key={r.id}
                      className="flex items-center gap-3 rounded-sm border border-border p-3 cursor-pointer hover:border-foreground/40 transition-colors"
                    >
                      <Checkbox
                        checked={roles.includes(r.id)}
                        onCheckedChange={() => toggleRole(r.id)}
                      />
                      <span className="text-sm">{r.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="experience">Experience level (optional)</Label>
                  <Input
                    id="experience"
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                    placeholder="Curious, experienced, professional…"
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="languages">Languages (optional)</Label>
                  <Input
                    id="languages"
                    value={languages}
                    onChange={(e) => setLanguages(e.target.value)}
                    placeholder="English, Portuguese, Japanese…"
                    className="h-11"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="skills">Skills or background (optional)</Label>
                <Textarea
                  id="skills"
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  placeholder="Statistics, design, moderation, nursing, translation, video, etc."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="why">Why do you want to help? (optional)</Label>
                <Textarea
                  id="why"
                  value={why}
                  onChange={(e) => setWhy(e.target.value)}
                  rows={4}
                />
              </div>

              <label className="flex items-start gap-3 text-sm text-muted-foreground">
                <Checkbox
                  checked={consent}
                  onCheckedChange={(v) => setConsent(!!v)}
                  className="mt-1"
                />
                <span>Yes, you can contact me about volunteer roles and study invitations.</span>
              </label>

              <Button
                type="submit"
                disabled={submitting || roles.length === 0}
                className="w-full h-12 rounded-full text-base"
              >
                {submitting ? 'Submitting…' : 'Add me to the team'}
              </Button>
            </form>
          )}

          <div className="mt-10 rounded-sm border-l-2 border-primary/60 pl-5 py-3">
            <p
              className="text-base md:text-lg text-foreground/80 leading-relaxed"
              style={{ fontFamily: "'Hanken Grotesk', system-ui, sans-serif" }}
            >
              This is a real experiment with an unknown answer. We may confirm something
              extraordinary, or we may find it was the mind all along. Both results matter. Thank
              you for helping us find out honestly.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
};

export default Join;
