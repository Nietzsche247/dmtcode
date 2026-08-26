import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { SEO } from '@/components/SEO';
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
  const [signedIn, setSignedIn] = useState(false);
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
        setSignedIn(false);
        setCheckingAuth(false);
        return;
      }
      setSignedIn(true);
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
    if (!signedIn || !profile) return;
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
      <SEO uiKey="join" path="/join" />
      <Helmet>
        <title>Help build it | DMT Code</title>
        <meta name="description" content="Volunteer to help test whether independent reports of visual symbols actually converge. Recorders, translators, analysts, and developers welcome." />
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
              Thousands of people report vivid, structured experiences. We are testing whether those
              reports truly converge, or whether optics, shared neurobiology, expectation, and
              memory explain the apparent overlap.
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
          {!signedIn ? (
            <div className="space-y-10">
              <div className="grid sm:grid-cols-2 gap-6">
                {[
                  {
                    title: 'Recorder',
                    body: "Recorders run the observation protocol and write down what they saw on the field sheet, in their own words. Nothing is required beyond care, honesty, and a completed record.",
                  },
                  {
                    title: 'Translator',
                    body: "Translators carry records, protocol documents, and site pages into Spanish, German, and other languages. Accuracy matters more than fluency, because a mistranslated report is worse than no translation.",
                  },
                  {
                    title: 'Analyst',
                    body: "Analysts look at the registry as data and test whether the reported forms actually converge or only appear to. Every submission carries a prior exposure flag, naive or exposed, recording whether the contributor had already seen symbols here before writing their own. The first real analyst job is splitting the submissions on that flag and reporting whether the split changes anything. That includes arguing against the claim when the numbers do not support it.",
                  },
                  {
                    title: 'Developer',
                    body: "Developers work on the site, the registry, and the export pipeline that keeps the data open. Most of the work is small, careful, and public.",
                  },
                ].map((role) => (
                  <div key={role.title} className="rounded-sm border border-border bg-card p-6 space-y-2">
                    <h2
                      className="text-xl text-foreground"
                      style={{ fontFamily: "'Fraunces', Georgia, serif", fontWeight: 500 }}
                    >
                      {role.title}
                    </h2>
                    <p
                      className="text-sm text-muted-foreground leading-relaxed"
                      style={{ fontFamily: "'Hanken Grotesk', system-ui, sans-serif" }}
                    >
                      {role.body}
                    </p>
                  </div>
                ))}
              </div>

              <div className="rounded-sm border border-border bg-card p-8 text-center space-y-4">
                <p
                  className="text-muted-foreground"
                  style={{ fontFamily: "'Hanken Grotesk', system-ui, sans-serif" }}
                >
                  Sign in to tell us which role fits you and join the team.
                </p>
                <Button asChild className="h-12 rounded-full text-base px-8">
                  <a href={`/auth?returnTo=${encodeURIComponent('/join')}`}>Sign in to volunteer</a>
                </Button>
              </div>
            </div>
          ) : alreadySubmitted ? (
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
