EARTH2 GRAPH v5.1 . README
Built Nov 23, 2026, evening. Odds as of Nov 23, 2026 (board read 2, then the read 3 moves applied through the engine). Not financial advice. Aaron places every order.

WHAT THIS IS
Earth2 is a fixed reference world, not a prophecy. Big end events out to 2030 are traced backwards through necessary conditions and likely precursors. Each read asks where the real world is tracking that world. The edge is collisions: two independent arms pushing the same node, the same layer or the same company inside the same window. The graph is neutral. Companies carry no helped or hurt label; which way a company moves depends on which events fire together, so that call is made fresh each time.

WHAT CHANGED IN v5.1 (use these files; the v5 and RareEarthMerged files are superseded)
. Fixed at the source: the board parser read "by Nov 2027" as Nov 20, 2026, which closed 21 rows (R6, R7, R8, T1, F11, D9, C8 to C11, J6, BB1 to BB3, BB6, BT3, BT4, O6, O7, B4, D8). window_end, window_peak and odds_by are now right on every board row. Only F8 closes Nov 20, because it fired that day.
. Fixed at the source: the horizon table was read two columns off, so odds_by on every board row was shifted. It now reads the 2 mo, 3 mo, 6 mo, 1 yr, 2 yr and 3 yr columns.
. Merged the rare-earth deep dive exactly as merged on Nov 23: 31 nodes (RD01 to RD35; RD27 runs from DA7), 56 links, 21 new companies, 5 extended (MP, UUUU, LYC, ILU, TSLA). 26 links into R6 now carry a move.
. Added P6, the shipping and canals end event (container freight above its Sept 2021 record, 15% by Nov 2029, an estimate). Every arm now has an end event.
. Applied the Nov 23 read 3 board moves through the engine as the second cascade_log entry: D1 94, D2 54, D3 25, D4 37, R1 40, R4 80, R7 25, F10 44, F11 25, BB2 45, X1 38, F6 70, O4 50.5, D5 21, J5 85.

THE FILES (all in the Earth2 Drive folder, nothing older was changed)
1. EARTH2_GENERATED_v5.1_2026-11-23_Graph.json . the data: 713 nodes, 1305 links, 165 companies, 11 compound chains, the cascade log.
2. EARTH2_GENERATED_v5.1_2026-11-23_Prototype.html . the page. It holds no data; it reads the Graph file.
3. EARTH2_GENERATED_v5.1_2026-11-23_cascade.py . the engine (Python 3.8+, standard library only).
   EARTH2_GENERATED_v5.1_2026-11-23_cascade_sample_run.txt . the sample run on one real update (F2 to 42%, Nov 22).
4. EARTH2_GENERATED_v5.1_2026-11-23_Readme.txt . this file.
5. EARTH2_GENERATED_v5.1_2026-11-23_Verification.json . counts, gaps, checks and the top 5 collisions after the sample run.

HOW THE PAGE FINDS ITS DATA FILE
. By default it loads EARTH2_GENERATED_v5.1_2026-11-23_Graph.json from the same folder as the page.
. To point it at another file, add ?data= to the address, for example Prototype.html?data=EARTH2_GRAPH_LATEST.json
. Browsers block a page opened straight from disk (file://) from reading files next to it. In that case the page shows a "Choose data file" button: pick the Graph file, or drag it onto the page. Nothing is uploaded anywhere; the file is read inside the browser.
. Google Drive will not run the page. To use it, download both files to one folder and open the page, or host both files on any static host (GitHub Pages, a private web page). A daily update then only replaces the Graph file; the page never changes.
. The drawing libraries load from unpkg.com (force-graph 1.47.4 and 3d-force-graph 1.76.0), so the 2D and 3D views need internet. The List view works without it.

WHAT THE PAGE DOES
. 2D and 3D views. In 2D, "Timeline lanes" puts every node at its window peak on a time axis, one lane per arm, with year lines and a blue line for the timeline date.
. Timeline slider, Nov 2026 to Dec 2030: nodes whose window is open on that date are bright, the rest fade ("show only open windows" hides them).
. Heat view: nodes colored by how much their odds moved in the last cascade (red rose, blue fell), sized by the move.
. Collisions tab: THE NEXT COLLISIONS QUEUE, every collision from the last run, standing layer collisions, compound chains and the collision-candidate companies.
. Filters by arm, layer and type. Toggles for sparks, companies, display-only links, drivers.
. Click a node: odds, window, layers, least capability, status, odds history chart, every link in and out with strength, delay and kind, and the companies on it with listed options and verified flags.
. Set new odds on a node (date and what happened are required) and the page runs the same rule as the engine, live: the chain moves, heat and the queue update, and the run is added to the log. Changes stay in the browser until you press Save data, which downloads the updated Graph file.
. Find box: a node ID, a ticker or words from a label.

HOW TO RUN THE ENGINE (the daily routine)
One update:
  python3 EARTH2_GENERATED_v5.1_2026-11-23_cascade.py EARTH2_GENERATED_v5.1_2026-11-23_Graph.json --set O1=100 --date 2026-12-01 --reason "Brent settled $101.20" --source "ICE settlement"
Several updates from a file:
  python3 EARTH2_GENERATED_v5.1_2026-11-23_cascade.py EARTH2_GENERATED_v5.1_2026-11-23_Graph.json --updates updates.json
  updates.json: [{"id": "O1", "new_odds": 100, "date": "2026-12-01", "reason": "Brent settled $101.20", "source": "ICE"}]
Options: --dry-run (print only), --out NEW.json (write elsewhere), --report run.json (save the log entry alone), --max-hops 4, --fade 0.5, --collision-days 120.
Rules the engine enforces:
. Odds move on real, dated events only (rule 10). Every update needs a date and a reason; a price swing by itself is not an update.
. new_odds 100 means the event FIRED. The node's status becomes FIRED with the date and it is pinned at 100 from then on.
. The graph file is rewritten in place (safely, through a temp file) and one cascade_log entry is appended: date, trigger, every node that moved with before and after and its top paths, nodes skipped because their window had closed, counts, the collisions and the queue.

THE CASCADE RULE (same in the engine and the page)
. A node set by hand moves by d = new odds minus old odds (percentage points).
. The move travels along every outgoing link that has a strength: change at the target = d x strength x sign on hop 1; each further hop is multiplied by 0.5.
. At most 4 hops. Each node is visited once per run (the first wave that reaches it), so loops cannot run forever. Moves that reach a node in the same wave are added.
. Odds are held between 1% and 99%. FIRED nodes are pinned at 100 and a cascade never moves them. Nodes set by hand are pinned for that run.
. A move that would land (run date plus the summed delay_days) after the target's window_end is dropped: a closed window cannot move.
. Display-only links carry no strength and never move anything.

COLLISIONS AND THE QUEUE (rule 8)
After every run the engine lists: (a) nodes that rose this run pushed by two or more different arms; (b) pairs of risen nodes from different arms whose windows overlap or sit within 120 days (the same layer is flagged, rule 6); (c) companies sitting on two or more risen nodes. Each is scored as joint odds x number of arms pushing; ties go to the window that closes first. The top 5 is THE NEXT COLLISIONS QUEUE. The page also lists standing layer collisions: two arms on the same layer, windows within 120 days, both between 25% and 90% (near-certain and priced events are left out). Rule 6 example: El Nino crops, Gulf fertilizer cut off behind Hormuz, and Russian grain all land on FOOD in the first half of 2027, converging on WF8, the world food shock.

THE SAMPLE RUN (F2 to 42%, Nov 22, 2026)
  F2     AI FINANCING AND BANKS    39.0 to  42.0  (+3.0)  set by hand
  27-4   AI FINANCING AND BANKS    55.0 to  57.3  (+2.3)  F2 > 27-4
  B2     AI FINANCING AND BANKS    60.0 to  60.8  (+0.8)  F2 > B2
  B1     AI FINANCING AND BANKS    33.0 to  33.6  (+0.6)  F2 > B1
  28-2   AI FINANCING AND BANKS    58.0 to  58.5  (+0.5)  F2 > 27-4 > 28-2
  F9     AI FINANCING AND BANKS    33.0 to  33.5  (+0.5)  F2 > F9
  29-6   AI FINANCING AND BANKS    45.0 to  45.3  (+0.3)  F2 > 27-4 > 29-6
  27-1   AI CAPABILITY             65.0 to  64.9  (-0.1)  F2 > 27-4 > 27-1
  F7     AI FINANCING AND BANKS    55.0 to  55.1  (+0.1)  F2 > 27-4 > F7
  28-1   AI CAPABILITY             55.0 to  54.9  (-0.1)  F2 > 27-4 > 28-1
  F1     AI FINANCING AND BANKS    85.0 to  85.1  (+0.1)  F2 > B2 > F1
  J3     FED RATES AND JAPAN       15.0 to  15.1  (+0.1)  F2 > F9 > J3
  F11    AI FINANCING AND BANKS    20.0 to  20.1  (+0.1)  F2 > 27-4 > F11
Top 5 collisions after the run:
  1. OWL sits on 2 risen nodes: B2, F1 . arms: AI FINANCING AND BANKS . joint odds 51.7% . window ends 2027-05-31
  2. CRWV sits on 2 risen nodes: F1, F2 . arms: AI FINANCING AND BANKS . joint odds 35.7% . window ends 2027-05-31
  3. F1 (+0.1) x J3 (+0.1), same layer: CREDIT . arms: AI FINANCING AND BANKS, FED RATES AND JAPAN . joint odds 12.9% . window ends 2027-03-31
  4. B2 (+0.8) x J3 (+0.1), same layer: CREDIT . arms: AI FINANCING AND BANKS, FED RATES AND JAPAN . joint odds 9.2% . window ends 2027-03-31
  5. 28-2 (+0.5) x J3 (+0.1), same layer: CREDIT . arms: AI FINANCING AND BANKS, FED RATES AND JAPAN . joint odds 8.8% . window ends 2027-03-31
THE READ 3 RUN (15 board moves, Nov 23, 2026)
  Set by hand: D1 94, D2 54, D3 25, D4 37, R1 40, R4 80, R7 25, F10 44, F11 25, BB2 45, X1 38, F6 70, O4 50.5, D5 21, J5 85
  Largest knock-on moves:
  27-1   AI CAPABILITY             64.9 to  60.4  (-4.5)
  J1     FED RATES AND JAPAN       35.0 to  33.0  (-2.0)
  B3     AI FINANCING AND BANKS    30.0 to  28.1  (-1.9)
  R5     RARE EARTHS CHINA AND TA  45.0 to  46.5  (+1.5)
  R6     RARE EARTHS CHINA AND TA  70.0 to  71.5  (+1.5)
  F1     AI FINANCING AND BANKS    85.1 to  84.0  (-1.1)
  F7     AI FINANCING AND BANKS    55.1 to  56.1  (+1.0)
  27-5   FED RATES AND JAPAN       45.0 to  44.0  (-1.0)
  29-6   AI FINANCING AND BANKS    45.3 to  46.3  (+1.0)
  27-6   RARE EARTHS CHINA AND TA  70.0 to  70.7  (+0.7)
  28-1   AI CAPABILITY             54.9 to  54.2  (-0.7)
  O1     OIL AND GULF              60.0 to  59.4  (-0.6)
  C5     CYBER                     25.0 to  24.4  (-0.6)
  R2     RARE EARTHS CHINA AND TA  45.0 to  45.5  (+0.5)
Top 5 collisions after read 3:
  1. 27-4 rose +0.1, pushed by 3 arms . arms: AI CAPABILITY, AI FINANCING AND BANKS, FED RATES AND JAPAN . joint odds 57.4% . window ends 2027-11-30
  2. F7 rose +1.0, pushed by 2 arms . arms: AI CAPABILITY, AI FINANCING AND BANKS . joint odds 56.1% . window ends 2027-05-31
  3. F6 (+5.0) x R4 (+10.0) . arms: AI FINANCING AND BANKS, RARE EARTHS CHINA AND TAIWAN . joint odds 56.0% . window ends 2027-03-31
  4. F6 (+5.0) x R6 (+1.5) . arms: AI FINANCING AND BANKS, RARE EARTHS CHINA AND TAIWAN . joint odds 50.0% . window ends 2027-03-31
  5. 27-6 (+0.7) x F6 (+5.0) . arms: AI FINANCING AND BANKS, RARE EARTHS CHINA AND TAIWAN . joint odds 49.5% . window ends 2027-03-31
Read it plainly: read 3 opens the first cross-arm collisions. Anthropic under its IPO price (F6) now sits beside the rare-earth squeeze (R4, R6, 27-6), all closing by Mar 31; the debt break (27-4) is pushed from three arms at once; and the lower AGI odds (X1) lift the capex-cut node (F7).

About the first run: a 3-point move on the neocloud default node mostly stays inside the financing arm (the debt break major, private credit, lender losses). The cross-arm items come from the S&P 20% node pushing the yen-jump node, both on the CREDIT layer. One small move does not open a big collision; the queue is built to show when several do.

SCHEMA
Top level: meta, nodes, links, companies, chains, discoveries_pace, cascade_log, build_notes (and new_arms_notes).
Event node: id, label, arm, type, odds_now (percent, chance by window_end), odds_text, odds_by (horizon odds where the source has them), odds_history (date, odds, note), window_start, window_peak, window_end, layers_hit (JOBS, FOOD, SHIPPING, POWER, CREDIT), least_capability, status (FIRED with date, AHEAD, ON TRACK, BEHIND, TOO EARLY, QUIET), source, model_layer (board, majors, tree, driver, 62, discoveries, new arm), plus extras where the source has them: hit, next_watch, what_changed, if_it_fires, priced, side, settlement_test, model_number, card_median, now_reads, unlocks, belief_line, current_fact.
Types: END EVENT, NECESSARY CONDITION, LIKELY PRECURSOR, TRIGGER, SPARK. A sixth type, DRIVER, holds the 15 measured curves of the driver model; they are curves, not events, so they carry no odds.
Link: source, target, sign (+1 raises, -1 lowers), strength 0 to 1, delay_days, kind (NECESSARY, LIKELY, MAGNIFIES, OPPOSES), reason, estimated (true when the strength is our estimate), delay_estimated, origin, display_only (true for links that never carry a move).
Company: id (CO:TICKER), ticker, name, exchange, listed_options (yes or no), listed_options_basis, verified, verified_source, sits_on (node, materiality, horizon, context_only, source), event_nodes, context_nodes, arms, collision_candidate. No direction field, by design.

HOW LINK STRENGTHS WERE SET
. Board "A to about B" (the "if it fires" column): strength = (B - A) / (100 - source odds). Example: Brent above $100 is 60%; if it fires, a January hike goes 60 to about 70, so strength = 10 / 40 = 0.25. 77 links.
. Trigger tree lift points ("+12 points on the major if the trigger fires"): strength = lift / (100 - trigger odds in the major's year). 220 links.
. New-arm research agent "A to about B": the same formula. 129 links.
. Everything else is an estimate and carries estimated: true (684 links): board marks such as "+" and "++" (about 0.05 and 0.10 to 0.15), majors to their seconds and thirds (about 0.15 and 0.08), the 62 model's own logic, sparks to their trigger (0.08 upcoming, 0.04 sealed), and the discoveries ladder.
. Delays are estimates throughout: about 7 days for market to market, 14 to 45 for credit, 60 to 120 for policy, 90 to 365 for physical supply and long-lens majors.
Links missing strength: 0. Links missing delay: 0. Display-only links (no strength by design): 195.

CALLS MADE IN THIS BUILD (so you can overrule any of them)
1. One number per two-leg major: when both legs are needed the lower leg is used (27-5 money gets dearer 45%, 28-1 55%, 29-4 60%); the reason is on each major as one_number_rule. STILL OPEN: the Nov 23 check proposes 27-1 at 50 (not 65) and 27-3 at 50 (not 55); this file keeps 65 and 55 until Aaron replies ACCEPT ALL or names changes (claude/MASTER_SUMMARY_1900_23_11_2026.md, section e).
2. F2 is loaded at its Nov 19 value (39%) and the sample run applies the real Nov 22 update (42%) through the engine. All other read 2 carry-ins are loaded as the board has them: F8 FIRED Nov 20 at 6,910.39, F5 60%, F10 40%, F6 65%, F9 33%, O2 33% with "market above Earth2", the two new chains, MR1 FIRED Oct 28 and GR1 FIRED Jul 14.
3. The 62 model events use IDs M1 to M62 (M plus the model number) so they read clearly next to board rows. All tree, spark, driver, effect, call and major IDs from EARTH2_ATLAS_IDS.csv are kept as they are.
4. The driver model's 34 effects are kept as challenger nodes. Their link to the matching major is display only, so the two models are not counted twice in a cascade.
5. The exposure layer's direction column and mechanism text are left out to keep the graph neutral. The exposure ID and its source IDs are kept so every attachment can be traced.
6. listed_options is "yes" for a US listing (where listed options are the norm) and "no" for listings outside the US or over the counter; it was not checked name by name. verified is true only where the event's own test names the company (Nvidia, Oracle, Anthropic, SoftBank, Tesla, Moderna, Lilly).
7. odds_now always means "chance by window_end". Where a source gives odds for several years, the window is the year with the biggest jump.
8. White-collar rows W1 to W8 and bio rows BT6 and BT6a come from the board additions file (not yet merged into the board). The arm's end events are the majors 27-2, 28-4 and 29-5.
9. Arms: BIO THREAT and BIO BREAKTHROUGH form one arm (BIO) with a side field. RUSSIA AND EUROPE carries a side field (clash, settlement, debt).

WHAT IS NOT VERIFIED
. 684 link strengths and every delay are estimates (flagged in the file).
. The five new arms (power and the grid, jobs and the backlash, weather and food, Russia and Europe, shipping support) were researched by an agent on Nov 22 with dated sources; their odds are first estimates.
. The discoveries ladder and its pace were researched by an agent from the Erdos problems database and Tao's AI-contributions log. Several rows are claims not yet accepted by experts (the Navier-Stokes blowup claim is the big one); each row says what could not be checked.
. Companies: 158 of 165 are unverified. Listed options were not checked one by one.
. Horizon odds (odds_by) are the read's snapshot; the cascade moves odds_now only.

SOURCES
EARTH2_EVENT_BOARD_read2_2026-11-22.md; EARTH2_BRIEF.md; EARTH2_GENERATED_v1_2026-11-20_Graph.json (tree v2: 18 majors, 81 triggers, 312 sparks, 15 drivers); EARTH2_GENERATED_v4_2026-11-20_Driver_Layer.json (34 effects, 20 sealed calls); EARTH2_ATLAS_IDS.csv; EARTH2_EXPOSURE_LAYER_v1_2026-11-20; EARTH2 1 MAJORS; EARTH2 9 THE 62 SCORECARD; claude/EARTH2_BOARD_ADDITIONS_20_11_2026.md; build/discoveries.json and build/new_arms.json (research agents, Nov 22).
