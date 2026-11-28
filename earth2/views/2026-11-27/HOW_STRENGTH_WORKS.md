# How a link strength works in the Earth2 engine

Read from `earth2/cascade.py` (function `cascade`) on Nov 27, 2026. Nothing here is a guess: the two worked examples were checked against the engine's own dry runs.

## The one line

**A strength is a slope: points of change at the target for each point of change at the source.**

```
change at the target (points) = change at the source (points) x strength x sign
```

It is NOT "strength times the gap left at the target". The size of the move does not depend on where the target sits. If a source at S percent goes to certain (100), the target moves `(100 - S) x strength` points.

The exact line in the code:

```
step = du * float(e["strength"]) * int(e.get("sign", 1)) * (fade if hop > 1 else 1.0)
```

`du` is the change at the source in points. `fade` is 0.5. The target's new odds are its old odds plus every step that reaches it in that wave, held between 1 and 99.

## The formula for turning history into a strength

```
sign +1 link:   strength = (B - A) / (100 - S)
sign -1 link:   strength = (A - B) / (100 - S)
```

- `S` = the source's odds now, in percent.
- `A` = the target's odds now, in percent.
- `B` = the percent of past cases in which the target happened inside its window once the source had happened. This is the historical frequency to research.

This is the graph's own rule (`meta.strength_rule`, and "HOW LINK STRENGTHS WERE SET" in `earth2/readme_v5.1.txt`). It makes the target land on B when the source fires.

With both rates in hand there is a second form that gives the same number:

```
sign +1 link:   strength = (B - C) / 100
sign -1 link:   strength = (C - B) / 100
```

- `C` = the percent of comparable past cases in which the target happened when the source had NOT happened.

Allowed range: above 0, up to 1. The apply tool refuses anything else.

## Worked example from a real link (sign +1)

Link `WK2 -> W6`, rank 2 in the ranking. Strength 0.6923, sign +1, delay 30 days, kind LIKELY.

- WK2: "Software loans go bad as lenders price AI disruption". Odds now 35.
- W6: "The credit link fires: software default rate in private credit reaches 3%, or two more $1B+ software firms are handed to lenders". Odds now 34.4.
- The link's own reason text says: A now 35, B now 35, B if A fires 80.

Where 0.6923 came from: `(80 - 35) / (100 - 35) = 45 / 65 = 0.6923`.

What the engine does with it:

| Move at WK2 | Change at WK2 | Change at W6 | W6 after |
|---|---|---|---|
| 35 to 45 | +10 | 10 x 0.6923 = +6.9 | 41.3 |
| 35 to 100 (fires) | +65 | 65 x 0.6923 = +45.0 | 79.4 |
| 35 to 25 | -10 | -10 x 0.6923 = -6.9 | 27.5 |

Checked with `python3 earth2/cascade.py GRAPH --set WK2=100 --date 2026-11-27 --reason "what-if" --dry-run`: the engine printed `W6 34.4 79.4 +45.0`. With `--set WK2=45` it printed `W6 34.4 41.3 +6.9`, and with `--set WK2=25` it printed `W6 34.4 27.5 -6.9`.

Second hop, for scale: W6 feeds B2 at strength 0.3077. When WK2 fires, that path passes `45.0 x 0.3077 x 0.5 (fade) = +6.9` points to B2. Other paths that reach B2 in the same wave are added to it.

How a researcher would redo this link: find the past cases where sponsor-owned software loans went bad in a wave (the WK2 event). Count the share in which the W6 test was met within a window as long as W6's (to Nov 19, 2027). Say that is 6 of 11, about 55 percent, so B = 55. Then `strength = (55 - 34.4) / (100 - 35) = 0.317`. The evidence line is "6 of 11 cases, list them", and the method line is the formula with the numbers in it.

## Worked example from a real link (sign -1)

Link `HP03 -> F2`, rank 1. Strength 0.39, sign -1, delay 0, kind OPPOSES.

- HP03: a stressed neocloud or miner-host closes a lifeline of $1B or more. Odds now 85.
- F2: a neocloud or data-center vehicle defaults, swaps its debt under distress or files for bankruptcy. Odds now 42.1.

If HP03 fires (85 to 100, +15), F2 moves `15 x 0.39 x -1 = -5.85` points, from 42.1 to 36.2. The engine's dry run printed `F2 42.1 36.2 -5.9`.

The link's reason says "41.8 to about 30". That was set when HP03 was first loaded at 70: `(41.8 - 30) / (100 - 70) = 0.39`. HP03 was then moved to 85 by the Nov 25 rebase, which runs with zero hops, so those 15 points were never passed on to F2. Only 15 points of push are left, and firing HP03 now moves F2 by 5.85, not the 11.8 the reason text promises. A strength is a slope, so "A to about B" holds only for the source odds it was worked out at. Always use the odds as they stand on the day of the research, and write them in the method line.

## Rules for the researcher

1. Count the target only when it happens inside its own window, after the source. Use a window as long as the target's (from now to its `window_end`).
2. Write the count, not just the percent: "6 of 11 cases since 1990", with the cases listed or linked. That goes in `evidence`.
3. If both forms can be worked out and they differ by more than about 0.1, say so in `evidence`. It means the target's odds now (A) are out of line with its history. That is a level problem for a calibration move, not something to hide inside a strength.
4. If the result is 0 or below, do not force it. History says the source does not push the target the way the link's sign says. Report the link as "sign or link in question" and leave it out of the apply file.
5. If the result is above 1, the source is already likely and the target's odds do not show it. Report that too. The tool will not take more than 1.
6. For a NECESSARY link the target cannot happen without the source, so C = 0 and the second form is simply `strength = B / 100`.
7. `delay_days` is the usual number of days from the source happening to the target happening in those past cases (the median is a good choice). Give null to keep the current delay.
8. Many of the top 50 are not two separate events. In 22 of them the reason text says the source "is the event under major X" or is "the tree's own guess at the matching board row", and several more are a leg or a stricter version of the target. For those, B is not a historical frequency. B is the chance the target's settlement test is met given the source's test is met, read from the two tests side by side (thresholds, dates, what counts). Say in `method` that the number comes from comparing the tests.

## What else the engine does with a link

- **Kind does not enter the arithmetic.** NECESSARY, LIKELY, MAGNIFIES and OPPOSES all pass a move the same way. Only `strength`, `sign` and `delay_days` matter to a cascade. The sign does the lowering: all 120 OPPOSES links carry sign -1. Kind is read elsewhere: the contradictions list checks that a NECESSARY source is at least as likely as its target, and the shared driver check leaves OPPOSES links out.
- **Falls work the same as rises.** A source that drops 10 points lowers a sign +1 target by `10 x strength`.
- **Hops.** Full size on the first hop. Each hop after it is multiplied by 0.5. At most 4 hops. Each node is moved once per run, by the first wave that reaches it; pushes that arrive in the same wave are added together.
- **Limits.** Odds are held between 1 and 99. A step smaller than 0.01 points is dropped. A final move smaller than 0.05 points is not recorded. Odds are stored to one decimal.
- **FIRED.** A FIRED target (status FIRED or odds 100) is never moved and a path stops there.
- **Delay.** `delay_days` adds up along a path. If the run date plus the summed delay lands after the target's `window_end`, that effect is dropped. Delay does nothing else.
- **Display only.** A link with `display_only: true` has no strength and never carries a move.
- **Pushes add up.** Two sources that both push one target are simply added. The rule has no ceiling other than 99, so a set of strong links into one target can overshoot what history supports for all of them together. Worth a line in `evidence` when a target has several strong feeders.
- **Changing a strength moves no odds.** Odds move only in a real cascade run. A new strength takes effect from the next run.

## The estimate flag and the range

- A link whose strength is still an estimate carries `"estimated": true`. The page shows "estimate" beside it and `validate_graph.py` counts it. Today: 752 of the 1,178 links that carry a move.
- Allowed strength: above 0, up to 1 (`validate_graph.py` checks every link that carries a move; `cascade.py` refuses to load a strength above 1).

## What to send back

One JSON list, one row per link, for `python3 earth2/link_strengths.py apply GRAPH FILE`:

```json
[
 {"source": "WK2", "target": "W6", "strength": 0.317, "delay_days": null,
  "evidence": "6 of 11 past cases since 1990 in which ... (cases listed)",
  "source_note": "Fitch Ratings, US Private Credit Default Rate report, https://...",
  "method": "(B - A) / (100 - S) = (55 - 34.4) / (100 - 35), odds as of 2026-11-27",
  "date": "2026-11-28"}
]
```

All of `evidence`, `source_note` and `method` are required. One bad row refuses the whole file. The date cannot be after today.

## How the ranking scores a link

For each estimated link the tool runs a what-if through the engine's own cascade function, in memory: the link's source goes up 10 points (or to 99 if nearer), 4 hops, fade 0.5, once with the strength halved and once doubled (capped at 1), all other links unchanged. Score = the sum, over the 119 live main events, of the gap between the two results, in points. On Nov 27, 2026: 752 estimates, 17 skipped (12 with a FIRED source, 5 with a source settled at 1), 735 ranked, total score 992.8. The top 50 hold 36.3% of it, the top 100 hold 59.1%, the top 200 hold 81.8%. So 50 links is a start, not the job: about 190 links carry 80% of the weight.
