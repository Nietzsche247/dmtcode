import { useCallback, useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useRoles } from "@/hooks/useRoles";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

type YesNo = "yes" | "no";
interface Call { id: string; num: number; name: string; question: string; pick: YesNo }
interface Ruling { call_id: string; answer: string; answered_at: string }

const CALLS: Call[] = [
  { id: "call-1", num: 1, name: "Nepal halt", question: "Should a small market's trading halt, like Nepal's, count toward the 2028 exchange halt leg?", pick: "no" },
  { id: "call-5", num: 5, name: "JPMorgan, Nov 16", question: "Should JPMorgan's 8.6 hour outage on Nov 16, which the bank called a bug, count as a payments halt?", pick: "no" },
  { id: "call-6", num: 6, name: "SMFG lending rule", question: "Should SMFG's rule to lend for data centers only to the largest cloud companies count as a megabank cap?", pick: "no" },
  { id: "call-7", num: 7, name: "OpenAI, Sep 3", question: "Should OpenAI calling Sep 3 the start of the AGI era count as AGI declared?", pick: "no" },
  { id: "call-8", num: 8, name: "Binance withdrawals", question: "Should Binance's withdrawal stop that ran for days count as an exchange halt?", pick: "yes" },
];

const SETTLED = [
  "Call 2, AGI wording: 2027 major 1 already counts only OpenAI, Google DeepMind, Anthropic, Meta or xAI saying so in an official release.",
  "Call 3, R5: already counts only a new US price floor, tariff or stockpile purchase after Nov 19 (board read 3, Nov 23).",
  "Call 4, R7: already ruled not fired; the Japan halt is de facto (board read 3, Nov 23).",
];

const AdminEarth2Calls = () => {
  const { loading, isAdmin } = useRoles();
  const [rulings, setRulings] = useState<Record<string, Ruling>>({});
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data, error } = await supabase.from("earth2_scoring_rulings").select("call_id, answer, answered_at");
    if (error) { toast.error(error.message); return; }
    const map: Record<string, Ruling> = {};
    (data ?? []).forEach((r) => { map[r.call_id] = r; });
    setRulings(map);
  }, []);

  useEffect(() => { if (isAdmin) load(); }, [isAdmin, load]);

  const save = async (calls: Call[], answerFor: (c: Call) => YesNo, key: string) => {
    setBusy(key);
    const now = new Date().toISOString();
    const rows = calls.map((c) => ({ call_id: c.id, question: c.question, pick: c.pick, answer: answerFor(c), answered_at: now }));
    const { error } = await supabase.from("earth2_scoring_rulings").upsert(rows, { onConflict: "call_id" });
    if (error) toast.error(error.message);
    await load();
    setBusy(null);
  };

  const head = (
    <Helmet>
      <title>Earth 2 scoring calls</title>
      <meta name="robots" content="noindex, nofollow" />
    </Helmet>
  );

  if (loading) {
    return (<div className="flex min-h-[50vh] items-center justify-center">{head}<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>);
  }
  if (!isAdmin) {
    return (<div className="px-4 py-16 text-center">{head}<p>Admin only.</p></div>);
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8 sm:py-12">
      {head}
      <h1 className="text-2xl font-semibold sm:text-3xl">Earth 2 scoring calls</h1>
      <p className="mt-2 text-muted-foreground">Five open calls. Tap Yes or No. Each answer saves right away and goes into the next read.</p>
      <Button className="mt-6 w-full sm:w-auto" disabled={busy !== null} onClick={() => save(CALLS, (c) => c.pick, "all")}>
        {busy === "all" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Take all suggestions
      </Button>
      <div className="mt-6 space-y-4">
        {CALLS.map((c) => {
          const r = rulings[c.id];
          return (
            <Card key={c.id}>
              <CardHeader className="pb-3">
                <p className="text-sm text-muted-foreground">Call {c.num}</p>
                <CardTitle className="text-lg">{c.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>{c.question}</p>
                <p className="text-sm text-muted-foreground">Suggested: {c.pick === "yes" ? "Yes" : "No"}</p>
                <div className="grid grid-cols-2 gap-3">
                  {(["yes", "no"] as YesNo[]).map((v) => {
                    const chosen = r?.answer === v;
                    const suggested = c.pick === v;
                    return (
                      <Button key={v} size="lg" variant={chosen ? "default" : "outline"}
                        className={`h-12 ${suggested && !chosen ? "border-2 border-primary" : ""}`}
                        disabled={busy !== null} onClick={() => save([c], () => v, c.id)}>
                        {v === "yes" ? "Yes" : "No"}
                        {suggested && <Badge variant="secondary" className="ml-2">Suggested</Badge>}
                      </Button>
                    );
                  })}
                </div>
                {r && <p className="text-sm text-muted-foreground">Saved {new Date(r.answered_at).toLocaleString()}</p>}
              </CardContent>
            </Card>
          );
        })}
      </div>
      <section className="mt-10 space-y-2 text-sm text-muted-foreground">
        <h2 className="font-medium">Already settled in the graph</h2>
        {SETTLED.map((s) => <p key={s}>{s}</p>)}
      </section>
    </main>
  );
};

export default AdminEarth2Calls;
