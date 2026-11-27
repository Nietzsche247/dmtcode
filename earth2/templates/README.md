# Earth2 template for a new arm or a new main event

`arm_template.json` is a blank arm: one end event, one precursor, one link, one company and one question. Every required field is there as a placeholder that starts with `FILL IN`, or as `null`.

How to use it
1. Copy `arm_template.json` to `earth2/deepdives/YOUR_NAME_nodes_links.json`.
2. Replace every `FILL IN` and every `null`. Add more nodes, links, companies and questions in the same shapes.
3. `python3 earth2/scorecard.py due` and settle anything it lists.
4. `python3 earth2/deepdives/merge_nodes.py public/future/earth2/graph.json earth2/deepdives/YOUR_NAME_nodes_links.json --dry-run`
5. Fix what it lists, run it again without `--dry-run`, then `python3 earth2/validate_graph.py public/future/earth2/graph.json`.

The blank template is refused on purpose. The merge prints each thing that is still missing, node by node.

## The gate

A main event is a node of type END EVENT, or a board row (`model_layer` "board"). The gate applies to any incoming node with type END EVENT or `model_layer` "board", whether the node carries that `model_layer` itself or the file's `graph` block sets it for every node. A tree trigger that only carries a `board_reference` is not a main event. A new main event cannot enter the graph without all of these:

- `settlement_test`
- `judgment_tags`
- `base_rate` with `value`, `reference_class` and `source`
- `kill_condition`
- `kill_check`
- at least one question, in the file's `questions` list or already in `earth2/scorecard/questions.json`

`merge_nodes.py` checks this before it merges. `validate_graph.py` checks it again on the graph. The 130 main events from before the gate are listed in `earth2/scorecard/legacy_main_events.json` and may keep their old gaps; nothing new may.

## Field by field

### graph (the load)

| Field | What to write |
|---|---|
| `short_name` | A short name for this load. It goes into odds text, the odds history note and the merges log. |
| `origin` | Where the link strengths come from. Written on every link added. |
| `created` | The date of this load, YYYY-MM-DD. |
| `note` | One line on what this adds and why. |
| `model_layer` | Leave as `new arm` for a new arm, or use `deep dive` for more depth on an old one. `board` makes every node in the file a main event, so the gate then applies to each one. |
| `new_arms` | The new arm name in capitals. Delete the list when the arm is already in the graph. |

### End event (a main event, so the gate applies)

| Field | What to write |
|---|---|
| `id` | A new id never used before, short, for example two letters and a number. Never reuse an old id. |
| `label` | The event as one plain sentence with its threshold and date. |
| `arm` | The arm name in capitals, exactly as in the graph or in `new_arms`. |
| `type` | `END EVENT`. |
| `odds_now` | The chance in percent, 1 to 99, that it happens by `window_end`. A first estimate is fine; the scorecard will grade it. |
| `status` | `ON TRACK` for a new event. The engine sets AHEAD, BEHIND and FIRED later. |
| `window_start` | The first day it could happen, YYYY-MM-DD. |
| `window_peak` | The most likely day. It must sit between start and end. |
| `window_end` | The day the odds are measured to. |
| `date_state` | `LOCKED` (fixed by law, contract or exchange calendar), `SCHEDULED` (a known dated release or meeting) or `ESTIMATED` (best guess). |
| `date_catalyst` | The dated catalyst behind the peak. Delete the line if there is none. |
| `peak_placeholder` | `true` when the peak is a filler date with no catalyst behind it, otherwise `false`. |
| `layers_hit` | Any of JOBS, FOOD, SHIPPING, POWER, CREDIT that this event lands on. May be empty. |
| `least_capability` | The least thing that has to be true for this to become easy. |
| `source` | Where the event and its odds come from. |
| `estimated` | `true` when the odds are a first estimate. |
| `next_watch` | The next dated thing to watch. |
| `settlement_test` | The exact, checkable fact that settles the event yes or no. A stranger with the source should reach the same answer. |
| `judgment_tags` | Which kinds of judgment the odds lean on. One or more of: `timing` (a dated step arrives when the graph says), `brakes` (someone steps in to stop or soften it), `actor` (a government or company does the dramatic thing, not the routine thing), `market` (Earth2 differs from a market number), `pace` (it arrives sooner or larger than consensus). These pick which corrections apply to the event. |
| `base_rate.value` | How often events of this kind have happened, in percent, 0 to 100. |
| `base_rate.reference_class` | The group of past cases the event belongs to, for example "G7 central banks cutting at three meetings in a row since 1990". |
| `base_rate.source` | Where the base rate was counted. |
| `kill_condition` | One dated, observable fact that would rule the event out or send it near zero inside its window. A test, not a claim. |
| `kill_check` | The named data series, filing or official source to check for that fact. |

### Precursor (a step on the way)

Same fields as the end event, with `type` set to `LIKELY PRECURSOR` or `NECESSARY CONDITION`. The gate does not apply unless its `model_layer` is "board", but write a `settlement_test` anyway so questions can point at it through `path_node`.

### Company

| Field | What to write |
|---|---|
| `id` | `CO:` and the ticker, for example `CO:XYZ`. |
| `type` | `COMPANY`. |
| `ticker` | The ticker. |
| `name` | The company name. |
| `exchange` | The exchange it trades on. |
| `listed_options` | `yes` or `no`. |
| `listed_options_basis` | Where and when listed options were checked. |
| `nodes_on` | The ids of the event nodes this company sits on. For a weighted exposure, add a link from the event node to the company id instead. |
| `other_listings` | Other tickers for the same company. May be empty. |

No direction is stored for a company. Which way it moves depends on which events fire together.

### Link

| Field | What to write |
|---|---|
| `source` | The id of the cause. |
| `target` | The id of the effect. |
| `sign` | `1` when the source raises the target, `-1` when it lowers it. |
| `strength` | 0 to 1. Rule: (odds of B if A fires minus odds of B now) divided by (100 minus odds of A now), absolute value, capped at 1. |
| `delay_days` | Days from the source moving to the effect landing. A whole number. |
| `kind` | `NECESSARY`, `LIKELY`, `MAGNIFIES` or `OPPOSES`. A necessary condition is at least as likely as what it precedes. |
| `reason` | Why the source moves the target, with the three numbers behind the strength. |
| `estimated` | `true` when the strength is an estimate. |
| `delay_estimated` | `true` when the delay is an estimate. |

### Question

Questions are how the graph gets graded. They are added through the same code as `python3 earth2/scorecard.py add`, so the same rules apply. The CLI gives the id, the lock and the status; do not write those.

| Field | What to write |
|---|---|
| `event_id` | The main event the question belongs to. |
| `path_node` | The step on the path the question is about, or `null` when it is about the main event itself. |
| `text` | A yes or no question about a dated step, answerable from one source. |
| `test` | The exact rule that makes the answer YES. Anything else is NO. |
| `source` | The named primary source the answer will be read from. |
| `tags` | One or two of `timing`, `brakes`, `actor`, `market`, `pace`: the kind of judgment the question tests. |
| `script_side` | `YES` or `NO`: the answer that moves toward the main event, that is, follows the Earth2 script. |
| `due` | The day the answer can be read, YYYY-MM-DD. It never changes. A question can be deferred 2 times at most, 21 days each, and every deferral is logged. |
| `odds_locked` | Earth2's odds of YES, a whole percent from 1 to 99. Locked the day the question is written. |
| `odds_basis` | Where those odds come from. |
| `market` | `null`, or `{"odds": 31, "source": "...", "as_of": "YYYY-MM-DD"}`: the market's odds of YES. Required when the tags include `market`. |
| `consensus` | `null`, or `{"value": "...", "source": "...", "as_of": "YYYY-MM-DD"}`: the analyst estimate, agency forecast or market-implied date. Required when the tags include `pace`. Write a pace question so that YES means sooner or larger than the consensus. |
