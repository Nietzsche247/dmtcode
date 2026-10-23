import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SignInToContribute } from '@/components/SignInToContribute';
import { RecordDrawing } from '@/components/record/RecordDrawing';
import { RecordDetails } from '@/components/record/RecordDetails';
import { RecordVoiceNote } from '@/components/record/RecordVoiceNote';
import { supabase } from '@/integrations/supabase/client';
import { submitObservation } from '@/lib/submitObservation';
import { hasSeenCatalogue } from '@/lib/catalogueExposure';
import { canSealRecord, freshRecordDraft, readRecordDraft, RECORD_DRAFT_KEY, recordPayload, type RecordDraft } from '@/lib/recordDraft';
import { formatSealedAt } from '@/lib/sealFormat';
import { localePath, useLocale } from '@/i18n/LocaleProvider';
import { uiCopy } from '@/i18n/ui-strings';

type SealedRecord = Awaited<ReturnType<typeof submitObservation>>;
const methods = ['650nm_laser', 'closed_eyes', 'other'];
const wavelengths = ['wavelength_650', 'wavelength_red_other', 'wavelength_blue', 'wavelength_green', 'wavelength_white', 'wavelength_other'];

export default function Record() {
  const locale = useLocale();
  const location = useLocation();
  const copy = (key: string) => uiCopy(`record-${key}`, locale).title;
  const [draft, setDraft] = useState(() => readRecordDraft() || freshRecordDraft(location.search, hasSeenCatalogue(location.search)));
  const [userId, setUserId] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [sealed, setSealed] = useState<SealedRecord | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [storageError, setStorageError] = useState(false);
  const sealing = useRef(false);
  const attempted = useRef(false);
  const update = (patch: Partial<RecordDraft>) => setDraft(previous => ({ ...previous, ...patch }));

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => { if (active) { setUserId(data.session?.user.id || null); setAuthReady(true); } });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => { setUserId(session?.user.id || null); setAuthReady(true); });
    return () => { active = false; subscription.unsubscribe(); };
  }, []);
  useEffect(() => {
    if (sealed) return;
    try { localStorage.setItem(RECORD_DRAFT_KEY, JSON.stringify(draft)); setStorageError(false); }
    catch { setStorageError(true); }
  }, [draft, sealed]);

  const seal = async () => {
    if (!userId || sealing.current || !canSealRecord(draft)) return;
    sealing.current = true; setBusy(true); setError('');
    try {
      let protocolId: string | null = null;
      if (draft.kit) {
        const { data, error: protocolError } = await supabase.from('protocols').select('id').eq('slug', draft.kit).single();
        if (protocolError) throw protocolError;
        protocolId = data.id;
      }
      const result = await submitObservation(recordPayload(draft, userId, protocolId));
      setSealed(result);
      localStorage.removeItem(RECORD_DRAFT_KEY);
    } catch { setError(copy('sealError')); }
    finally { sealing.current = false; setBusy(false); }
  };
  useEffect(() => {
    if (authReady && userId && draft.pendingSeal && !sealed && !attempted.current) { attempted.current = true; void seal(); }
  }, [authReady, userId, draft.pendingSeal, sealed]);

  const requestSeal = () => {
    if (!canSealRecord(draft)) return;
    attempted.current = false;
    update({ step: 3, pendingSeal: true });
  };

  return <div className="min-h-screen bg-background text-foreground">
    <Helmet>
      <title>{uiCopy('record', locale).title}</title>
      <meta name="description" content={uiCopy('record', locale).description} />
      <meta name="robots" content="noindex, follow" />
      <link rel="canonical" href={`https://dmtcode.com${localePath(locale, '/record')}`} />
    </Helmet>
    <header className="max-w-xl mx-auto px-6 pt-6 pb-4 border-b border-border"><Link className="text-lg font-semibold" to={localePath(locale, '/')}>DMT Code</Link></header>
    <main id="main-content" className="max-w-xl mx-auto px-6 py-8 space-y-7">
      <h1 className="text-3xl tracking-normal">{copy(sealed ? 'sealed' : draft.step === 1 ? 'draw' : 'questions')}</h1>
      {storageError && !sealed && <p role="alert" className="text-destructive">{copy('storageError')}</p>}
      {!sealed && draft.step === 1 && <>
        {draft.nullReport ? <p>{copy('nullHelp')}</p> : <RecordDrawing draft={draft} label={copy('canvas')} onChange={update} />}
        <Button className="w-full h-14 text-base" disabled={!draft.nullReport && draft.strokes.length === 0} onClick={() => update({ step: 2 })}>{copy('next')}</Button>
        <Button variant="link" className="min-h-12 px-0" onClick={() => update({ nullReport: !draft.nullReport })}>{copy(draft.nullReport ? 'drawInstead' : 'nothing')}</Button>
        <div><Link className="text-sm text-muted-foreground underline py-3 inline-block" to={localePath(locale, '/capture')}>{copy('fullForm')}</Link></div>
      </>}
      {!sealed && draft.step === 2 && <>
        <fieldset className="space-y-3"><legend className="text-lg font-medium mb-3">{copy('substance')}</legend>
          <div className="flex gap-3">{(['yes', 'no'] as const).map(value => <Button className="flex-1 h-14" key={value} variant={draft.substance === value ? 'default' : 'outline'} aria-pressed={draft.substance === value} onClick={() => update({ substance: value })}>{copy(value)}</Button>)}</div>
        </fieldset>
        <fieldset className="space-y-3"><legend className="text-lg font-medium mb-3">{copy(draft.seen ? 'exposureSeen' : 'exposure')}</legend>
          <div className="flex gap-3">{([true, false] as const).map(value => <Button className="flex-1 h-14" key={String(value)} variant={draft.exposed === value ? 'default' : 'outline'} aria-pressed={draft.exposed === value} onClick={() => update({ exposed: value })}>{copy(value ? 'yes' : 'no')}</Button>)}</div>
        </fieldset>
        <details className="border-y border-border py-4"><summary className="cursor-pointer py-2 text-sm">{draft.source === '650nm_laser' && draft.wavelength === 'wavelength_650' ? copy('methodSummary') : `${copy(draft.source)}, ${copy('change')}`}</summary>
          <div className="space-y-4 pt-4"><Label htmlFor="record-method">{copy('method')}</Label>
            <select className="w-full h-12 rounded-md border border-input bg-background px-3" id="record-method" value={draft.source} onChange={e => update({ source: e.target.value })}>{methods.map(value => <option value={value} key={value}>{copy(value)}</option>)}</select>
            <Label htmlFor="record-wavelength">{copy('wavelength')}</Label>
            <select className="w-full h-12 rounded-md border border-input bg-background px-3" id="record-wavelength" value={draft.wavelength} onChange={e => update({ wavelength: e.target.value })}>{wavelengths.map(value => <option value={value} key={value}>{copy(value)}</option>)}</select>
            {draft.wavelength !== 'wavelength_650' && <><Label htmlFor="record-nm">{copy('otherWavelength')}</Label><Input className="h-12" id="record-nm" value={draft.wavelengthOther} onChange={e => update({ wavelengthOther: e.target.value })} /></>}
            {draft.source !== '650nm_laser' && <><Label htmlFor="record-method-detail">{copy('methodDetail')}</Label><Input className="h-12" id="record-method-detail" value={draft.methodOther} onChange={e => update({ methodOther: e.target.value })} /></>}
          </div>
        </details>
        {draft.kit && <p className="text-sm text-muted-foreground">{copy(`kit-${draft.kit}`)}</p>}
        <Button className="h-14 w-full text-base" disabled={!draft.substance} onClick={requestSeal}>{copy('seal')}</Button>
      </>}
      {!sealed && draft.step === 3 && <>
        {authReady && !userId && <SignInToContribute title={copy('account')} body={copy('accountBody')} createLabel={copy('createAccount')} signInLabel={copy('signIn')} authPath={localePath(locale, '/auth')} />}
        {busy && <p role="status">{copy('sealing')}</p>}
        {error && <><p role="alert" className="text-destructive">{error}</p><Button className="h-12 w-full" onClick={seal}>{copy('retry')}</Button></>}
      </>}
      {sealed && <>
        <section className="space-y-3"><p>{sealed.glyph.sealed_at ? formatSealedAt(sealed.glyph.sealed_at) : ''}</p><p className="text-sm text-muted-foreground">{copy('hash')}</p><p className="font-mono text-xs break-all">{sealed.glyph.original_record_hash}</p></section>
        {userId === sealed.glyph.user_id && <>
          <RecordDetails glyphId={sealed.glyph.id} userId={userId} copy={copy} />
          <RecordVoiceNote glyphId={sealed.glyph.id} submissionId={sealed.submission.id} userId={userId} copy={copy} />
        </>}
      </>}
    </main>
  </div>;
}