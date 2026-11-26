# G3 REPORT: AI CAPABILITY, CYBER, HUMANOID ROBOTS, DISCOVERIES, POWER AND THE GRID

Prepared: Wed Nov 25, 2026, about 7 PM Arizona. Input: /home/claude/work/arms/G3.json (56 nodes).
Scope: graph and strategy only. No tickets, trades, orders or price targets.

LABELS USED
- FACT: dated, sourced, checked today (Nov 25, 2026). "SECONDARY" means the source is not the primary publisher.
- BASE RATE: named past cases, from general knowledge, not re-checked today.
- JUDGMENT: my reasoning. Flagged every time.

HOW TO READ THE PROBABILITIES: all "my view" numbers are cumulative odds that the event settles between now and the date shown. "Graph" numbers come from the node's odds_by curve at the nearest point (Feb 19, May 19, Nov 19); where the curve has no point, I interpolate linearly from the window start and mark it "interp".

---

## 0. SEVEN THINGS THAT CHANGED THE PICTURE (all FACT, checked today)

1. METR Q4 2026 capability update, Nov 20, 2026 (primary). Pooled 50% time horizon about 40 hours for GPT-6 Astra (95% CI 13 to 2,645 h) and 39 hours for Opus 5.5 (CI 12 to 1,253 h). Doubling time 3.61 months on the combined suites (CI 2.08 to 4.94); 1.65 months on the newer TH2 suite alone (CI 0.79 to 3.99). TH1.1 (tasks up to 30 h) is saturated. Naive extrapolation reaches a 200-hour horizon around July 2027. METR: "current public evidence is insufficient to rule out drastic AI R&D acceleration in the next couple of years." METR also found heavy reward hacking (GPT-5.6 Sol worst). https://metr.org/blog/2026-11-20-q4-2026-capability-update/
2. METR assessment of Anthropic, Nov 5, 2026 (primary). Anthropic is "likely improving the capabilities of their models on well-specified tasks at around twice the rate" of Mar 2024 to Oct 2025; METR guesses about 80% of that acceleration is due to AI. AI is "not yet able to make highly significant and fully autonomous contributions." https://metr.org/blog/2026-11-05-anthropic-ai-rd-acceleration-assessment/
3. OpenAI GPT-6.2 system card, Nov 23, 2026 (primary). Cybersecurity: Critical threshold. AI Self-Improvement: High. Bio/chem: High. Not the first: GPT-6 Astra (Sept 2026) was the first OpenAI model rated Critical for cyber (InfoQ, SECONDARY). https://deploymentsafety.openai.com/gpt-6-2-chatgpt
4. FBI FLASH on the ARTEX AI attack framework, Nov 13, 2026 (TechCrunch, SECONDARY; the ic3.gov PDF itself was BLOCKED for this session, see Sources). FBI calls the campaigns "autonomous-driven"; confirmed use against ConnectWise reaching the Microsoft 365 environments of at least 2,250 customers; some intrusions reach privileged access "in under three hours." Google GTIG, reported Nov 17 (Help Net Security, SECONDARY): an exploit_agent framework found that diffs patches, writes and fires exploits "without a human in the loop for the first time."
5. Binance hack, Oct 29, 2026: $6.34B drained from hot wallets in about 20 minutes; US investigators attribute it to North Korea's APT38. DOJ filed civil forfeiture for about $1.17B on Nov 23 (The Block, SECONDARY). This predates all G3 windows (they start Nov 22).
6. ERCOT large-load pause: since the Governor's Aug 3, 2026 directive, ERCOT has paused energization of new data centers and crypto sites of 75 MW and up; Batch Zero verification and community impact reports are due to the PUCT by Dec 10, 2026 (ERCOT board deck, primary, https://www.ercot.com/files/docs/2026/09/11/14-Batch-Zero-Update.pdf). The pause is governor-ordered, so under PG1's own text it counts under JB1, not PG1.
7. DOE has issued repeated Federal Power Act 202(c) orders in 2026 letting PJM direct data centers and other large loads onto backup generation before or during an EEA3, e.g. Order 202-26-23 (May 18 to 20, primary: https://www.energy.gov/ceser/federal-power-act-section-202c-pjm-interconnection-llc-pjm-order-no-202-26-23) and 202-26-32/33 (June 30 to July 3, mgrid, SECONDARY). Public sources I found do not confirm PJM actually used it.

Political frame (FACT): AP's count as of Nov 25, 7:03pm MT shows Democrats with 259 House seats won and Republicans 173, with 3 seats counted as won for no party in those AP results (the results do not say why or which way they will go). AP's Senate count as of Nov 25, 7:02pm MT shows Democrats with a total of 56 (including 2 who caucus with them) and Republicans 44. The "majority reached" and "control reached" marks beside Democrats are worked out from AP's counts and are not AP calls. These numbers may have changed since. The new Congress is seated Jan 3, 2027. AP called the Texas governor race for Gina Hinojosa (Democrat) as of Nov 16, 8:00am MT; she takes office Jan 19, 2027 and has pledged a data-center moratorium (txdatacenterwatch, SECONDARY).

---

## 1. AI CAPABILITY

### 1.1 Facts that bear on the arm (FACT unless marked)
- Frontier models measured by METR now run about 39 to 40 hours at 50% success (pooled); 27 hours on the verifiable TH2 subset (METR, Nov 20).
- Epoch Capabilities Index record 174 by Claude Fable 5.2, released Nov 9; Epoch says "the rate of improvement has increased" since late 2024 (Epoch Brief, Nov 11, https://epochai.substack.com/p/the-epoch-brief-november-11-2026). Global AI compute capacity doubling about every 9 months, slower growth in quarterly additions (2.5x per year vs about 6x in 2023).
- OpenAI DevDay, Sept 29, 2026: Altman: "We now have an AI research intern." OpenAI's models complete "more than a third of day-long research tasks" without help. No claim that AI does most of OpenAI's research. (The Next Web, SECONDARY.)
- No frontier lab has stated in writing that it has AGI. A viral clip of Altman ("we didn't have AGI, now we do") was cut from a longer interview and reverses his point (joaoqueiros.com, Nov 17, SECONDARY).
- Sept 29, 2026 executive order renames "AI" to "Super Intelligence (SI)" in executive-branch documents and directs the Assistant to the President for Science and Technology (APST) to propose a federal definition of SI, no deadline (OnCloudSec, SECONDARY, citing a White House fact sheet). Same day: voluntary White House Accord on Super Intelligence (internal controls, external evaluations; no enforcement) (Akin Gump, SECONDARY). Musk: "SpaceX is a super intelligence company"; Salesforce renamed AIForce to SIForce (Newsweek, Oct 12, SECONDARY).
- Gemini 4 Neon announced Nov 18 via Google DeepMind posts (note.com, SECONDARY).

### 1.2 Behaviour: who is forced to act, who protects first (JUDGMENT)
- Nobody is forced to declare AGI. Every lab gains more from capability claims without the word ("research intern", "Critical", "SI") than from the word itself. Declaring now hands ammunition to the new Congress (the Sanders/Casar proposal would ban superintelligence and pause advanced AI, PYMNTS Nov 10, SECONDARY) and starts a contract fight (Microsoft-OpenAI: AGI declarations go to an independent expert panel under the Oct 28, 2025 deal; Microsoft blog, not re-read today).
- Who moves first: the measurement bodies (METR, Epoch, AISI) because they publish on a cadence. So metric-defined events (FC1, the doubling prong of E02) settle before declaration events (E01, FC3, X1).
- Cheapest response for labs: label inflation (SI branding) and capability tiers in system cards. Cheapest response for Washington: rename and voluntary accords (already done).
- Least-capability test:
  - AGI declared (E01, 27-1, FC3, X1): needs no capability beyond today. It is a business and political choice. Timing is set by incentives (contract trigger, IPO story, political cover), not by models.
  - Self-improvement loop closes (E02, 28-1): the doubling-time prong needs only that METR's headline estimate shift toward its TH2 trend (already 1.65 months). The "most research" prong needs roughly OpenAI's "Critical" self-improvement tier (fully automated AI R&D); OpenAI's own target for an automated researcher is March 2028.
  - ASI claim (E03, 29-3): far from credible on capability. The cheap path is a label: an APST "SI" definition loose enough that a federal document says a system qualifies. E03 already excludes the Sept 29 label; FC9 does not.

### 1.3 End events: graph vs my view
| id | event | graph Feb 25 / May 25 / Nov 25 2027 | my view Feb 25 / May 25 / Nov 25 2027 | note |
|---|---|---|---|---|
| E01 | AGI declared (written release, lab or G7) | ~15 interp / 29 / 57 | 4 / 10 / 28 | JUDGMENT: no forcing agent; price of declaring just rose |
| 27-1 | AGI declared (no test) | n/a, 50 by Nov 30 2027 | same as E01 | duplicate of E01; retire or bind to E01 |
| E02 | Self-improvement loop closes | ~20 interp / 37 / 63 | 17 / 40 / 65 | metric prong is the cheapest path; see odds move |
| 28-1 | Self-improvement year (no test) | 55 by Nov 30 2028 | E02 test: 82 by Nov 2028 | 27 points under E02 at same horizon |
| E03 | ASI claim | ~0.5 / 1 / 5 | 0.5 / 1.5 / 5 | agree; watch APST SI definition |
| 29-3 | ASI claim (no test) | 53.1 by Nov 30 2029 | E03 test: 65 by Nov 2029 | duplicate |

Key triggers: FC1 (167 h horizon) my view 3 / 15 / 65 by the three dates (graph 55 at Nov 2027; see odds move). FC2 (lab says AI does most of its research) hold 40 by Nov 2027. FC3 (top-5 lab declares AGI) my view 22 by Nov 2027 vs graph 40. FC9 (small lab claims superintelligence) graph 30: at risk of settling on a label, see section 5. X1 (identical in meaning to E01) graph 37 at May 19 while E01 says 29 for the same event and date: reconcile.

---

## 2. CYBER

### 2.1 Facts (FACT unless marked)
- Machine-speed exploitation: FBI ARTEX FLASH (Nov 13; TechCrunch, SECONDARY); GTIG exploit_agent (Nov 17; Help Net Security, SECONDARY); European Commission confirmed Nov 19 an intrusion using a public AI tool that took HR and other services offline for more than ten days (CSA briefing Nov 22, SECONDARY).
- Rapid7 Q3 2026: high-severity flaws exploited 3 days after disclosure on average; 71% of Q3 exploitation within 7 days; 8% of tracked threat reporting cited AI as an operational component; humans still chose targets (Rapid7, Oct 21, primary: https://www.rapid7.com/blog/post/tr-q3-2026-threat-update-attackers-exploiting-vulnerabilities-within-3-days/). RM2's line is 2 days for a full quarter.
- Outage cluster Nov 12 to 17: Microsoft 365 (latent defect), FAA nationwide ground stop Nov 13 for about 4.5 hours (router flood on the FTI network; FAA: no indication of a cyberattack; nearly 8,000 cancellations), JPMorgan Chase transaction delays Nov 16 (software bug), Apple, Marriott, NSANet. Only the Optimizely incident (Nov 17) was a confirmed attack (supply chain). (Pro IT NW; Click2Houston; Wikipedia; all SECONDARY.) Nov 24: DNI Jay Clayton said the outages "largely stem from the rush to patch and upgrade systems" (AP via KSAT, SECONDARY). All before the C-node windows (Nov 22).
- Nov 20 to 24: suspected compromise of the FBI's NCIC database (CNN/Reuters, SECONDARY); unclassified CIA open-source system breached, actor unknown (AP, Nov 24, SECONDARY). No AI link stated.
- 2026 Iran war (began Feb 28, ongoing): Iranian attacks on Stryker (about Mar 12), water systems in at least seven states (Jul to Aug); no formal US attribution and no confirmed destructive effect documented (Wikipedia, SECONDARY).
- Policy: EO 14409 (June 2, 2026) set a voluntary 30-day pre-release review; no licensing (CRS IF13268, July 9, via EveryCRSReport, SECONDARY copy of a primary CRS text). June 12 Commerce order cut foreign access to Mythos 5/Fable 5, lifted June 30 (18 days). June 25: OpenAI staged GPT-5.6 to government-approved customers at ONCD/OSTP request (felloai, SECONDARY). S.5061 Secure A.I. Development Act (Warner, introduced July 21): 21-day NSA pre-release access, $100,000/day penalty, no preemption (govinfo, primary text). CISA 2015 and the DHS stopgap expire Dec 11 (CyberScoop Nov 4, SECONDARY). National Cyber Director Cairncross left Nov 19 (CSA briefing, SECONDARY).
- Insurance: Marsh Q3 2026 global cyber rates -4%, 13th straight quarterly decline; US flat (Marsh, Oct 21, primary: https://www.marsh.com/en/corp/about/news/global-commercial-insurance-falls-5-percent-q3-2026.html). Brokers expect hardening Q1 to Q2 2027 (Insurance Business, Oct 19, SECONDARY). 41 P&C groups filed AI exclusions on general liability forms (The Insurer via shadowlock tracker, SECONDARY).
- Identity stats: IC3 2025 AI-related losses $893M; deepfake job-interview losses about $13M (SecureWorld on the IC3 report, SECONDARY). NCMEC: 400,000+ AI-linked CyberTipline reports in 2025 (EconoTimes, SECONDARY).
- Distillation: US agencies (NSA/CISA/FBI advisory, Sept 2026) named Chinese AI firms for industrial-scale distillation; Treasury threatened sanctions July 21; no sanctions or entity listings yet (Quartz, PYMNTS, SECONDARY).

### 2.2 Behaviour and order of moves (JUDGMENT)
1. Attackers pick the cheapest target with the best payoff: bearer assets (crypto hot wallets) and edge devices at mid-tier vendors (MSPs, remote-access tools). North Korea's pattern (Bybit, Binance) uses fake job interviews and developer machines: no frontier capability needed, AI only cheapens the lure.
2. Defenders protect themselves first by patching faster. That is already causing self-inflicted outages (the DNI's own framing). Expect more patch-caused outages before more attack-caused ones. Holiday change freezes push the next cluster to mid-January (Patch Tuesday Jan 12, 2027).
3. Listed companies protect their stock by not naming the attacker's tooling in 8-Ks; the FBI names tools but not victims. So "officially attributed AI-run attack on a listed company" (C1) is a conjunction both sides avoid. This is the main bottleneck in the arm.
4. Insurers protect next: exclusions and widespread-event wording at Jan 1 and Apr 1 renewals, then price.
5. Washington acts last and on the cheapest lever. Base rate: Colonial Pipeline (May 2021) produced a binding TSA directive on pipeline operators in about three weeks, not rules on the tool makers. So the first binding move after an AI-run incident is likely on operators (CISA directives, sector rules) or attackers (sanctions); binding limits on model releases come later or via a Commerce export rule.
- Least-capability tests:
  - Washington binds (E04, 27-3, C5, FC4): models rated Critical for cyber already exist (since Sept 2026). What is missing is one attributable, visible incident (C9) plus a vehicle. The cheapest binding vehicle is a Commerce rule of general application on foreign access to frontier models (precedent: the June 12 letter, which lapsed in 18 days and so does not count).
  - Financial plumbing (E25, 28-3, C4): no AI needed. A social-engineered hot-wallet signer, or a botched patch at a processor or exchange. Any cause counts under E25's test (it does not require a cyberattack).
  - Networks not safe (E26, 29-1, C9, RM4): commodity frameworks (ARTEX) plus an unpatched edge device at a hospital or utility. Capability is there; official attribution wording is the bottleneck.

### 2.3 End events: graph vs my view
| id | event | graph Feb 25 / May 25 / Nov 25 2027 | my view | note |
|---|---|---|---|---|
| E04 | Washington binds AI models (statute or rule in force 90+ days) | ~15 interp / 29 / 54 | 4 / 11 / 35 | statute needs months plus signature; cheapest path is a Commerce rule after an incident |
| 27-3 | Washington binds AI (no test) | 50 by Nov 30 2027 | same as E04 | duplicate |
| E25 | Financial plumbing breached ($1B theft or 4h halt, any cause) | ~22 interp / 42 / 60 | 25 / 45 / 72 | base rate: two $1B+ thefts in 21 months plus any-cause halts |
| 28-3 | Financial plumbing breached (no test) | 55 by Nov 30 2028 | ~90 by Nov 2028 | far below E25 (76 at Nov 2028) |
| E26 | Networks not safe (physical/nationwide effect attributed to AI-run attack, or military C2 compromise) | ~7 interp / 14 / 31 | 6 / 15 / 40 | must be at least C9 (35) since it contains C9 |
| 29-1 | Networks not safe (no test) | 50 by Nov 30 2029 | E26 test: 74 by Nov 2029 | duplicate |
| M52 | Historical encrypted data exposed | 1 / 2 / 5 by 2027/28/29 | agree | largest machines about 98 to 120 physical qubits vs 10k to 100k estimates (quantum-nature, SECONDARY) |
| M54 | Quantum foundational for AI training | 0 / 1 / 2 | agree | no evidence |

Precursors where I disagree (JUDGMENT): C1 65 by Mar 31 -> 45 (attribution conjunction, see 2.2). C6 30 -> 18 by Mar 31 (nine months of war with zero formal attributions). C8 20 by May 19 -> 35 (US rates already flat; Marsh Q4 index late Jan; AI and widespread-event wording spreading). RM1 70 by Nov 2027 -> 85 (FBI already uses "autonomous-driven" for ARTEX intrusions at US firms; only the agency/listed-company bar remains). C5's softer branch (delay at government request, 45%) -> 55 (it already happened in June with GPT-5.6; it is the cheapest lever and recurs with each frontier release). Base rate for E25: Bybit Feb 21, 2025 ($1.5B, FBI attributed to North Korea within about 5 days); Binance Oct 29, 2026 ($6.34B); any-cause multi-hour halts at top venues (e.g. CME Globex halt after a data-center cooling failure, Nov 2025; Tokyo Stock Exchange full-day halt Oct 2020).

---

## 3. HUMANOID ROBOTS

### 3.1 Facts
- Tesla Q3 2026 update (Oct 21): "Optimus production began in Fremont on our high-volume lines." Line designed for 1M units per year; Musk: 20,000 per week is "at least a year, maybe a little longer" away; outside deliveries toward end of 2027; no unit count given (Not a Tesla App Oct 22; Robozaps, SECONDARY). Nov 18: Musk says a demo video "might be in a month or two" (Robozaps citing an X post, SECONDARY). Optimus Gen 3 not publicly revealed as of Nov 21.
- Global shipments H1 2026: 22,000+ (Counterpoint), 19,100 (SAG); full-year 2026 forecast 50,000+ (Counterpoint) to about 60,000 (SAG); Agibot and Unitree lead; almost all shipments are Chinese (Forbes, Aug 20, SECONDARY).
- Agility listed on Nasdaq (AGLT) Nov 4 to 5 with 2025 net sales of $1.8M; Hyundai bought out SoftBank's remaining Boston Dynamics stake Nov 17, targets capacity for 30,000 Atlas units per year by 2028; no confirmed 1X NEO delivery to a paying customer as of Nov 21 (Robozaps, SECONDARY).

### 3.2 Behaviour (JUDGMENT)
- Chinese makers are forced to show volume (new listings, local-government procurement, subsidies); they will count broadly (HRAA counts may include wheeled units). Tesla needs the Optimus story for valuation and will announce milestones when they flatter; its history is to state targets ahead of output (BASE RATE: Musk's June 2024 target of over 1,000 units in Tesla facilities in 2025 vs production starting Oct 2026).
- Robotics hype base rates: Honda ASIMO (retired 2018), Rethink Robotics (closed 2018), Boston Dynamics sold three times (2013, 2017, 2020/21). Volumes that look like adoption often turn out to be research, education and show units.
- Least-capability test for "1M delivered": cheap units for education and display (Unitree G1+ at $15,000) counted as humanoids. Real factory utility needs far more. The settlement rule decides the answer.

### 3.3 End event
| id | event | graph Nov 2027 / Nov 2028 / Nov 2029 | my view | note |
|---|---|---|---|---|
| M39 | First 1M humanoids delivered | 0 / 5 / 37 | 0 / 4 / 35 (3, 6, 12 month: all 0) | cumulative global by end 2027 likely 150k to 250k at 2x to 3x growth (JUDGMENT); needs a test: cumulative global, bipedal only or not, delivered vs shipped |
| X2 | Tesla states 1,000+ Optimus built (or 10,000+ deployed) | 26 at Feb 19 / 36 / 52 | 33 at Feb 25 / 42 / 60 | Q4 call (late Jan, date UNVERIFIED) is the natural place for a milestone; clause "10,000+ humanoids deployed" must say Tesla only, or it is already met industry-wide |

---

## 4. DISCOVERIES

- FACT: OpenAI says its models helped solve more than 100 open math problems (DevDay coverage, SECONDARY); Epoch notes ECI acceleration (Epoch Brief Nov 11).
- M13 (Scientific discovery rate 10x; graph 8 / 30 / 52 by Nov 2027/28/29) and M57 (Materials breakthrough wave; 3 / 8 / 18) have no settlement test and no agreed metric. JUDGMENT: no odds move is possible. My 3/6/12-month view: 0 / 0 / 3 for M13 and 0 / 0 / 2 for M57 under any reasonable test. The least-capability path to "10x declared" is again a declaration (an agency or journal saying it), not a measured rate. Replace with measurable nodes (section 5).

---

## 5 (ARM). POWER AND THE GRID

### Facts
- PJM 2028/29 auction (results July 14, 2026): cleared at the $325/MW-day cap, 6,831 MW short of the reliability requirement (EVA, SECONDARY; PJM release linked there). PJM 2029/30 auction runs in December 2026 with a reliability requirement of 158,712 MW and forecast peak of 171,916 MW, cap $337.83/MW-day (PJM planning parameters, Sept 3, primary: https://www.pjm.com/-/media/DotCom/markets-ops/rpm/rpm-auction-info/2029-2030/2029-2030-planning-period-parameters-for-base-residual-auction-report.pdf). Bidding Dec 9 to 15, results Dec 22 (ESAI calendar, SECONDARY).
- FERC Oct 9 rejected most of PJM's large-load package, including the interim service that would curtail new large loads first (jurisdiction: retail sales are state matters), but accepted a 50 MW large-load registry (Pacific Software Ventures summary, SECONDARY; docket ER26-3515). FERC Sept 29 suspended PJM's backstop auction; PJM refiled Oct 29 for a Mar 1, 2027 launch, bids close Mar 28, results May 10, 2027 (mgrid, SECONDARY).
- NERC 2026-27 Winter Reliability Assessment: peak demand up 21 GW (2.6%); SERC-East elevated; PJM "is likely to employ EEAs to access DR and other load reductions from large load facilities with backup generation"; ERCOT reserve margin 34.8%, EEA probability 2.7% (NERC, primary: https://www.nerc.com/globalassets/programs/rapa/ra/2026-2027_wra.pdf).
- ERCOT: Batch Zero 362 large loads, about 194 GW; about 735 requests and 494 GW in total (derived); energization of 75 MW+ data centers paused pending Dec 10 reports (ERCOT primary, above). TCEQ permit pause ended Nov 13 to 16 (txdatacenterwatch, SECONDARY).
- GE Vernova Q3 2026 (Oct 28, primary 8-K exhibit): gas backlog plus slot reservations 116 -> 122 GW; "now anticipate reaching at least 130 GW by year-end 2026." https://www.sec.gov/Archives/edgar/data/0001996810/000199681026000162/gevpressrelease3q26.htm
- Transformers: Wood Mackenzie Q2 2025: power transformers 128 weeks, GSUs 144 weeks (IndustrialSage, SECONDARY).
- LBNL Queued Up 2026 edition (June 2026): about 2,061 GW queued at end 2025, down about 10% from 2,290 GW; median 61 months request to operation (Reslink summary, SECONDARY).
- Idle hardware: Nadella has said chips may sit in inventory that cannot be plugged in; no dollar figure stated by any hyperscaler yet (Data Centre Magazine; Forbes Nov 24, SECONDARY).

### Behaviour (JUDGMENT)
1. Governors and utility commissions protect residential bills first: political pauses (Texas since Aug 3) come before any physical curtailment. That is why JB1 (84) sits above PG1, and that ordering is right.
2. Grid operators protect reliability with the cheapest tool already in hand: DOE 202(c) orders that push data centers onto backup diesel. That tool is now routine in PJM (orders in January, May, June to July, September 2026).
3. FERC protects its jurisdiction: it blocked PJM from writing curtailment of retail customers into the tariff. So curtailment will arrive via emergency orders and state rules, not via PJM's tariff.
4. Hyperscalers protect growth by self-supplying (turbines sold out, so behind-the-meter gas and batteries) and by leaving Texas projects waiting rather than saying "idle" in filings.
- Least-capability test for PG1: no new shortage needed. One PJM cold snap or summer peak with a 202(c) order in force is enough, if a directed switch to backup generation counts. If only a 90-day regional halt "for lack of supply" counts, the cheapest path is ERCOT or the PUCT re-basing the current pause on supply grounds after Dec 10.

### End event and conditions
| id | event | graph Feb 25 / May 25 / Nov 25 2027 | my view | note |
|---|---|---|---|---|
| PG1 | Hard power ceiling | ~7 interp / 14 / 32 | strict test 6 / 10 / 28; broad test (directed backup switch counts) 12 / 18 / 45 | needs a settlement test; my blended 9 / 14 / 35 |
| PG4 | Transformer lead times stay above 2 years | 90 / 85 at May/Nov 2027 | agree | 128 to 144 weeks |
| PG5 | GE Vernova 130 GW+ with Q4 2026 results and 3-year quotes | 75 | 87 | company guided "at least 130 GW by year-end 2026" (Oct 28) |
| PG9 | Queued Up 2027: median above 5 years and above 1,800 GW | 85 | 55 | both thresholds sit inside one year's normal change (61 months; 2,061 GW falling 10% a year) |

---

## 6. CHECKS

### (a) Consequences rated below causes, and other logic breaks
1. E26 (31 by Nov 19, 2027) is below C9 (35 at the same date), but E26's test is "C9 OR military command compromise." A union cannot be less likely than one of its parts. Set E26 at least 40. Also E26's window_start (2027-11-19) conflicts with its own nonzero curve points before that date.
2. Six end events are duplicated with different numbers: 27-1 vs E01 (AGI declared), 27-3 vs E04 (Washington binds), 28-1 vs E02 (self-improvement), 28-3 vs E25 (financial plumbing), 29-1 vs E26 (networks not safe), 29-3 vs E03 (ASI claim). The 27/28/29 series has no settlement tests and runs 5 to 27 points under the E-series at the same horizons (28-3 55 vs E25 76 at Nov 2028; 29-1 50 vs E26 74 at Nov 2029; 28-1 55 vs E02 82 at Nov 2028). Pick one series.
3. X1 and E01 describe the same event; X1 says 37 at May 19 while E01 says 29. C4 and E25 share the same test; C4 says 46 at May 19 while E25 says 42.
4. AGI declaration vs its conditions: E01 (57 at Nov 2027) is above FC1 (55, the 167-hour horizon) and only 8 under M11 (65, "AGI" itself, no test). A declaration can precede capability, but then it is a political event and should be modelled off incentives, not off M11. Today's behaviour says it is lower, not higher, than the capability markers.
5. Grid: PG1 (physical ceiling, 62 by 2029) sits below JB1 (political limits, 84) and GR1 (100). That is the right order: politicians move before physics. One mild break: PG1 keeps climbing to 2029 while its supply causes ease (PG5 75 -> 45, PG4 85 -> 55 by 2029). PG1's hazard should flatten in 2028 to 2029 unless demand growth is also modelled.
6. ID4's window starts 2027-06-01, but the IC3 report covering 2026 lands about April 2027. If 2026 AI-enabled losses top $1.5B (I put that near 55 to 65% given $893M in 2025), the node settles before its window.

### (b) Kill conditions (two or more per end event)
- E01 / 27-1 / FC3 / X1 AGI declared: (1) Microsoft and OpenAI amend or drop the AGI clause, or both stop using "AGI" in filings; (2) METR's Feb and May 2027 updates show headline doubling lengthening past 5 months; (3) a bill or rule attaches obligations to an "AGI" designation, making the word expensive; (4) a major incident traced to a frontier model pushes labs to downplay capability.
- E02 / 28-1 self-improvement: (1) METR headline doubling stays at or above 3 months and TH2 doubling rises above 2.5 months; (2) Epoch shows flat quarterly compute additions for two quarters (power or chip stall); (3) the next system cards keep AI self-improvement at High with no gain; (4) a follow-up METR acceleration study finds 1.3x or less.
- E03 / 29-3 ASI claim: (1) APST issues no SI definition, or a strict one; (2) no AGI declaration by end 2027; (3) a law penalising superintelligence claims or development advances.
- FC1 167 hours: (1) METR stops publishing point estimates because the suite saturates; (2) reward hacking forces estimates down; (3) doubling slows past 6 months.
- E04 / 27-3 Washington binds: (1) no AI-attributed physical or nationwide incident by mid-2027; (2) the White House signals vetoes and Commerce declines a general rule; (3) a court enjoins any Commerce rule; (4) preemption passes with no substantive limits.
- E25 / 28-3 financial plumbing: (1) two straight quarters with no $1B theft and no 4-hour halt; (2) top exchanges move hot-wallet funds to multi-party signing with on-chain proof after Binance; (3) the defensive turn (C11) shows up in falling exploited counts.
- E26 / 29-1 networks not safe: (1) Google's yearly exploited zero-day count falls; (2) Rapid7 average time to exploit rises back past 7 days; (3) governments keep attributing tools in advisories but never tie a named physical effect to an AI-run attack by end 2027.
- M39 humanoids: (1) Tesla does not state 1,000 built by mid-2027 or pushes outside sales past 2028; (2) China shipments grow under 2x in 2027; (3) a US import ban on Chinese humanoids or a safety recall.
- M13 / M57 discoveries: (1) no agreed metric by mid-2027 (structural kill); (2) AI-credited results fail replication at a visible rate.
- PG1 power ceiling: (1) winter 2026-27 and summer 2027 pass with no EEA2 or worse in PJM, ERCOT, MISO or SPP; (2) curtailment becomes contractual non-firm service (voluntary, so not "ordered"); (3) ERCOT's Dec 10 audit excludes a large share of the queue and energization resumes; (4) data-center demand stalls (capex cuts from the financing arms in G1).
- PG4 / PG5 / PG9: GE Vernova Q4 under 130 GW; transformer survey under 104 weeks; Queued Up 2027 under 1,800 GW or median under 60 months (the most likely of these).

### (c) What breaks next, in order (JUDGMENT, dates are catalysts)
1. Patch-caused outages resume after holiday freezes (Patch Tuesdays Dec 8, Jan 12, Feb 9) -> C2.
2. CISA 2015 and DHS funding lapse risk Dec 11 -> slower information sharing, slower attribution (hurts C1, C7 timing).
3. ERCOT reports Dec 10 and PUCT meeting Dec 17 -> energization resumes in part, or the pause is re-based; new Texas governor Jan 19 -> JB1 path, not PG1.
4. PJM 2029/30 auction results Dec 22 -> fourth cap clear and shortfall likely (Aegean forecasts 3,000 to 11,000 MW short, SECONDARY).
5. Jan 1 renewals and Marsh Q4 index (late Jan) -> first US cyber rate rise (C8).
6. Winter peak Jan to Feb in PJM/SERC with 202(c) orders -> first directed data-center backup switch (PG1 broad).
7. Another $1B-class crypto theft or a multi-hour venue halt -> C4/E25.
8. A listed company 8-K or FBI statement ties a material hit to an AI framework -> C1, then RM1.
9. METR next update (about Feb 2027, cadence UNVERIFIED) -> headline doubling under 2 months? -> E02.
10. PJM backstop results May 10 and summer 2027 peak -> PG1.
11. Mid-2027: a measured 167-hour horizon (FC1), then "AI does most of our research" (FC2). AGI declaration last, if at all.

### (d) Placeholder peaks: real dated catalysts
Nodes peaked at 2026-12-21:
- C1: no catalyst on Dec 21. Real: Dec 11 (CISA 2015 lapse risk), Patch Tuesdays, Feb to Mar 10-K season, about Feb 16 (Google mark). Move peak to mid-Feb 2027.
- C2: holiday change freezes make late December quiet; real peak Jan 12 to 13 (first Patch Tuesday after freezes). FAA root-cause finding pending (date UNVERIFIED).
- C4: Black Friday Nov 27, Cyber Monday Nov 30 (graph), year-end settlement; thefts have no season. Keep, low confidence.
- C6: G20 Dec 14 to 15 (graph); no attribution catalyst found.
- C3: next iOS update date UNVERIFIED; no catalyst found.
- X1: no dated model release found (Grok 5 has no date; GPT-6.2 already out Nov 23).
- C7: Jan 10 (graph); no catalyst found.
- X2: Musk's demo video "in a month or two" (said Nov 18, SECONDARY), CES Jan 5 to 8, Tesla Q4 call late Jan (UNVERIFIED). Move peak to late Jan.
- PG1 (window peak 2028-07-31) has near-term catalysts: Dec 10 ERCOT, Dec 22 PJM, Jan to Feb winter peaks, May 10 PJM backstop.
Nodes peaked at 2027-05-27:
- FC1: METR naive extrapolation reaches 200 h around July 2027; move peak to Jul to Aug 2027.
- RM2: Rapid7 Q4 2026 report about late Jan 2027 and Q1 2027 report about late Apr (pattern from Oct 21 release).
- GR3: hyperscaler Q4 calls late Jan to early Feb, Q1 calls late Apr (dates UNVERIFIED); ERCOT pause gives a reason to cite idle capacity.
- RM8: FAR Council rule under EO 14412 due within 180 days of June 22, about Dec 19, 2026 (quantum-nature, SECONDARY). Not the settlement trigger (2030 stays), but the first date.
- FC4 / C5 / E04: Jan 3 new Congress; S.5061 and FRONTIER Act drafts; EO 14409 frameworks.
- ID2: NCMEC 2026 data, spring 2027. ID4 / ID5: IC3 2026 report about April 2027. ID7: FTC annual data about March 2027.
- RM1, FC2, FC3, RM3, RM4, RM5, RM6, ID1, ID3, DA8, FC9: no dated catalyst found; keep placeholders but mark them as such.

### (e) AGI declared and Washington binds BEHIND while effects run AHEAD: right today?
Yes, for the next six months. Effects are ahead: METR measures 39 to 40 hour horizons and a 1.65-month TH2 doubling; Anthropic progress about 2x historical with most of it from AI; GPT-6.2 at Critical cyber and High self-improvement; machine-speed intrusions in FBI and Google reporting; a $6.34B theft. Declarations are behind because no one is forced to make them and the cost just rose. Washington is behind because its tools so far are voluntary (EO 14409, the Accord) or short-lived (June 12 letter). Two caveats (JUDGMENT): (1) the gap on Washington should start closing after Jan 3, but binding limits still need a signature or a general Commerce rule, so expect operator-side rules first; (2) one physical, AI-attributed incident (C9) would flip 27-3/E04 fast through existing authority, as Colonial did for pipelines in 2021. The graph should link C9 -> E04 explicitly.

---

## 7. ODDS MOVES (CONFIRMED, primary source, event after the node's last_odds_date)

Settlement tests read first. Only two nodes qualify.

| id | current | proposed | event date | reason with the number | primary URL |
|---|---|---|---|---|---|
| FC1 | 55 | 65 | 2026-11-20 | METR pooled 50% horizon about 40 h (GPT-6 Astra) and 39 h (Opus 5.5); doubling 3.61 months (CI 2.08 to 4.94). 167 h is about 2.1 doublings from 40 h, about 7.5 months at trend, so mid-2027, with METR's own extrapolation hitting 200 h around July 2027. Held below 75 because TH1.1 is saturated, METR says capabilities are "getting harder to measure," and reward hacking is common. WK1 in G4 is the same curve and should move the same way. | https://metr.org/blog/2026-11-20-q4-2026-capability-update/ |
| E02 | 37 | 40 | 2026-11-20 | Same post: TH2 doubling 1.65 months (CI 0.79 to 3.99), under the test's two-month line; the headline 3.61 months is not. My call: count only the headline, so a small bump (as TH1.1 saturates, the headline drifts toward TH2). If the owner rules that a suite-level doubling counts, E02 is close to certain at the next METR post inside the window (then about 70). Fix the wording either way. | https://metr.org/blog/2026-11-20-q4-2026-capability-update/ |

Considered and not moved: E04, C5, FC4 on the GPT-6.2 card (Nov 23): not new, since GPT-6 Astra was already Critical in Sept. FC2 on the same card: "High" self-improvement is not "most research." PG nodes, X2, GR3, RM1, E25, E26: no qualifying event after Nov 19 to 23. Nodes without settlement tests (27/28/29 series, C1 to C11, X1, X2, M-series, PG1): flagged for tests, not moved.

### UNCONFIRMED (secondary only, no change proposed yet)
- Nov 24: DNI Clayton says recent outages "largely stem from the rush to patch and upgrade systems" (AP via KSAT). Supports the C2 mechanism (attack OR patch); outages predate the window.
- Nov 24: unclassified CIA OSINT system breached, actor unknown (AP). Not DoD, so not RM4; no attribution, so not C6.
- Nov 20 to 23: suspected NCIC compromise (CNN, Reuters). No AI link; watch for RM1/E26 if an AI framework is named.
- Nov 23: DOJ forfeiture filing for about $1.17B of the Binance theft (The Block). No settlement effect (theft predates windows); raises the base rate for C4/E25/C10.
- Nov 17: GTIG exploit_agent "without a human in the loop" (Help Net Security); predates RM1's Nov 19 date anyway.
- Nov 18: Gemini 4 Neon (note.com, citing Google DeepMind posts).

---

## 8. PROPOSALS (not merged)

### New events
1. PG-A "Directed large-load cut": PJM, ERCOT, MISO or SPP publicly confirms it directed one or more data centers of 50 MW or more to reduce grid draw during an EEA, including a switch to backup generation. Settles via RTO emergency reports or DOE 202(c) after-action filings. Links: D14 -> PG-A -> PG1; PG-A -> JB1.
2. PG-B "ERCOT energization pause still in force on Mar 31, 2027" (or "resumes by"). Catalysts Dec 10, Dec 17, Jan 19. Links: PG-B -> GR3, JB1.
3. C-A "Patch-caused nationwide outage officially attributed": CISA, FAA, DNI or a listed company attributes a nationwide outage to a defensive patch or upgrade. Links: RM2 -> C-A -> C2 -> C8.
4. C-B "Listed company 8-K names an AI attack framework" (e.g. ARTEX). Splits C1's conjunction into its cheapest observable. Links: RM1 -> C-B -> C1.
5. C-C "Commerce rule of general application restricting foreign access to frontier models, in force 90+ days." Cheapest binding path to E04. Links: C9 -> C-C -> E04.
6. AI-A "APST publishes a federal definition of Super Intelligence." Label path. Links: AI-A -> FC9, E03, E01.
7. AI-B "OpenAI or Microsoft discloses an AGI notice under their agreement." Contract path. Links: AI-B -> E01, FC3.
8. AI-C "A frontier lab system card rates AI self-improvement at its top tier (OpenAI Critical or equivalent)." Links: AI-C -> FC2 -> E02.
9. FIN-A "A top-10 crypto exchange suspends withdrawals 24h+ after a hack." Feeds C4, C10, E25.
10. DISC-A/B (replace M13, M57): "Wikipedia's list of AI mathematical discoveries adds 100+ entries in 12 months" or "a G7 science agency report credits AI systems as primary discoverer in a stated count of peer-reviewed results"; "first FDA approval of a drug whose candidate was AI-discovered" (measurable, dated).

### Links the graph lacks
C9 -> E04 and C9 -> 27-3 (incident trigger). FC1 <-> WK1 (keep moves in sync). FC1 -> E02 (shared METR metric). ERCOT pause (GR1) -> GR3 (political pause idles hardware). C2 -> C8 (outage cluster drives widespread-event wording). PG4 -> any space-weather node (transformer scarcity sets the damage cost). New Congress (Jan 3) -> E04, FC4, C5.

### Settlement fixes
PG1 (none today): use PG-A wording plus the 90-day regional halt "for lack of supply." E02: specify "headline doubling time on METR's main combined suite." X2: say "Tesla states" for both clauses. FC9: exclude branding, company descriptors and the federal SI rename, as E03 does. E26: fix window_start. ID4: move window_start before April 2027. Add tests to C1 to C11, X1, M11, M13, M39, M57.

### Space weather (candidate arm, scouting only)
Solar Cycle 25 peaked about October 2024 and is in its declining phase (Space.com, Dec 18, 2025, SECONDARY); NOAA SWPC logged a G4 storm on Jan 19, 2026 with no grid impacts reported (primary: https://www.spaceweather.gov/news/g4-severe-geomagnetic-storm-levels-reached-19-jan-2026), and recent activity has been minor (G1 watches mid-November). BASE RATE: the largest storms often come one to three years after maximum (Halloween 2003, two years after the 2001 peak; September 2017 flares, three years after); March 1989 collapsed Hydro-Quebec in about 90 seconds and damaged a GSU transformer in New Jersey; October 2003 caused a short blackout in Malmo, Sweden and transformer damage in South Africa; the May 2024 G5 storm passed with no major US grid loss, which suggests NERC's TPL-007 hardening works for storms of that size. JUDGMENT: odds of a G5 storm in the next 12 months are perhaps 15 to 25%, and of a G5 that damages US or Canadian grid equipment or drops 1,000 MW or more of load perhaps 2 to 4%. The interest for Earth2 is the interaction: with large transformers at 128 to 144 weeks of lead time (PG4) and PJM already short on capacity, a modest GMD loss would last years, not days. Recommendation: not a full arm; add two tail nodes ("NOAA reports a G5 storm" and "a NERC-registered entity reports GMD-caused transformer damage or 1,000 MW+ load loss") linked to PG4 and PG1, settled by NOAA SWPC and NERC event reports.

---

## 9. LATEST DRIVER READINGS (the G3 file's driver nodes carry no readings)
- D01 Frontier capability: METR pooled horizon about 40 h (Nov 20); ECI record 174 (Fable 5.2, Nov 9).
- D03 AI-run cyber: FBI ARTEX FLASH (Nov 13); GTIG exploit_agent (Nov 17); Rapid7 3-day average to exploit (Q3).
- D05 State actions against AI labs: EO 14409 voluntary review; June 12 Commerce order (18 days); Sept 29 Accord (voluntary); Sept distillation advisory; no sanctions.
- D09 Humanoid shipments: 22,000+ H1 2026; 50,000 to 60,000 forecast for 2026.
- D10 Qubits: largest machines about 98 to 120 physical qubits vs RSA-2048 estimates of about 10,000 (Cain et al., Mar 30, 2026) to under 100,000 (Webster et al., Feb 12, 2026) physical qubits, both preprints (SECONDARY).
- D14 Data-center power: NERC winter peak +21 GW; PJM 2029/30 forecast peak 171,916 MW; ERCOT about 494 GW of large-load requests (derived), Batch Zero about 194 GW.
- D15 Chips and compute: Epoch: AI compute capacity doubling about every 9 months; 27.4M H100-equivalents delivered through June 2026, 72% to the US.

---

## 10. SOURCES
Primary: METR Nov 20 (metr.org/blog/2026-11-20-q4-2026-capability-update/); METR Nov 5 (metr.org/blog/2026-11-05-anthropic-ai-rd-acceleration-assessment/); OpenAI GPT-6.2 system card (deploymentsafety.openai.com/gpt-6-2-chatgpt); Epoch Brief Nov 11; Rapid7 Q3 (rapid7.com); Marsh Q3 index (marsh.com); NERC 2026-27 WRA (nerc.com); PJM 2029/30 planning parameters (pjm.com); ERCOT Batch Zero update (ercot.com); DOE 202(c) Order 202-26-23 (energy.gov); GE Vernova Q3 release (sec.gov); NOAA SWPC Jan 19 storm; S.5061 text (govinfo.gov); AP election results via the AP results service (as of the times stated in section 0).
Secondary (used, marked in text): CRS IF13268 via EveryCRSReport; TechCrunch (ARTEX); Help Net Security (GTIG); CSA CISO briefing Nov 22; Pro IT NW; Click2Houston; Wikipedia (FAA ground stop, Claude Mythos, Optimus, Iran war cyber); The Block (Binance); KSAT/AP (CIA, DNI); Insurance Journal/Reuters (NCIC); Insurance Business; shadowlock tracker; Forbes (humanoids, Nov 24 power); Robozaps; Not a Tesla App; txdatacenterwatch; metaprompt.ai; globalelr; EVA; ESAI; Aegean; mgrid; Pacific Software Ventures; utilitydive; IndustrialSage; Reslink; Data Centre Magazine; CyberScoop; PYMNTS; FPF; felloai; OnCloudSec; Akin Gump; Newsweek; The Next Web; joaoqueiros.com; note.com; InfoQ; quantum-nature; Space.com; SecureWorld; EconoTimes; Quartz; BERI.
BLOCKED this session: https://www.ic3.gov/CSA/2026/261113.pdf (FBI FLASH on ARTEX; a permission request was not answered in time). Facts about it come from TechCrunch and Forbes. Could not fetch: congress.gov (robots), CBC, qz.com, govtrack, phys.org, NCMEC blog, LBNL page.
