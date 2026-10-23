# Run 01 reproduction check

Rebuilt code: `scripts/analysis/` (segmenter.py, analysis.py, run_all.sh). Inputs: `input/data_2026-10-23.json`, `input/symbol_meta_2026-10-23.csv`, remote images cached in `input/images/`. Ground truth: https://dmtcode.com/analysis/run01.json, fetched 2026-10-23. Command: `scripts/analysis/run_all.sh`. Two consecutive runs produce byte-identical outputs.

## Confirmatory numbers (component unit, T = 0.90, no rotation or mirror)

| Measure | Published (run01.json) | Rebuilt (output/summary.json) | Match |
|---|---|---|---|
| Public symbols | 79 | 79 | yes |
| Symbols with no primitive | 2 (single dot, three dots) | 2 (f7eb9976 single dot, a2b641a3 three dots) | yes |
| Primitives | 224 | 224 | yes |
| Primitives per drawing, median / max | 1 / 42 | 1 / 42 | yes |
| Clusters at T 0.85 | 179 | 179 | yes |
| Clusters at T 0.90 | 193 | 193 | yes |
| Clusters at T 0.95 | 208 | 208 | yes |
| Tier none | 93 | 93 | yes |
| Tier candidate | 100 | 100 | yes |
| Tier supported | 0 | 0 | yes |
| Tier replicated | 0 | 0 | yes |
| Clusters with 2 or more contributors | 2 | 2 | yes |
| f1 (singletons) | 182 | 182 | yes |
| f2 (doubletons) | 5 | 5 | yes |
| Chao1 | 3505.4 | 3505.4 | yes |
| Identified contributors | 17 | 17 | yes |
| Naive / exposed / unrecorded contributors | 5 / 8 / 4 | 5 / 8 / 4 | yes |
| Anonymous rows | 18 | 18 | yes |
| Rows naive / exposed / unrecorded | 28 / 10 / 41 | 28 / 10 / 41 | yes |
| Sober baselines | 0 | 0 | yes |
| Null reports | 0 | 0 | yes |
| run_id, extraction_date, unit, threshold, n_submissions | run01, 2026-10-23, connected component, 0.9, 79 | same | yes |

## Saturation curve (79 points)

| Series | Points matching run01.json exactly | Largest difference |
|---|---|---|
| observed | 79 of 79 | 0 |
| lo (2.5th percentile of 1000 random orderings) | 79 of 79 | 0 |
| median | 79 of 79 | 0 |
| hi (97.5th percentile) | 79 of 79 | 0 |

The `curve` array in output/summary.json is identical to the one in run01.json (compared as parsed JSON). The band is reproduced exactly because the random orderings are reproduced exactly: `numpy.random.default_rng(20261023)`, one `permutation(79)` per ordering, over submissions sorted by created_at.

## Sensitivity numbers

| Measure | Published | Rebuilt | Match |
|---|---|---|---|
| Junction cut: primitives | 1,283 | 2,922 | no |
| Junction cut: clusters at 0.90 | 898 | 2,402 | no |
| Junction cut: replicated forms | 4, all elementary strokes | 4, all elementary strokes (two vertical, two horizontal line forms) | yes (count and kind), but on a different fragment set |
| Rotation (0/90/180/270) plus mirror at 0.90 | 695 clusters | 1,979 clusters on the junction unit; 172 on the component unit | no |
| Literal area averaging: empty masks | 124 of 1,283 | 143 of 2,922 (junction unit); 48 of 224 (component unit) | no |

Which unit the rotation-plus-mirror figure belongs to: 695 is more than the 224 component primitives can produce as clusters and less than the 898 junction-cut clusters without invariance, so it is the junction-cut unit. Invariance can only merge clusters, so on the component unit the figure has to be 193 or lower (the rebuild gives 172).

### Measured cause of the junction-cut mismatch

The junction cut is under-specified in the run 01 note (no definition of a junction pixel, of branch length, or of how ink is assigned to branches). The rebuild uses the literal reading: Zhang skeleton, one spur-pruning pass at 8 px, junction = skeleton pixel with 3 or more 8-neighbours, branches under 8 px dropped, ink to the nearest branch.

| Check | Result |
|---|---|
| Where the extra fragments come from | Two dense drawings: 8f9a393e (a perspective grid, 923 fragments) and 921658ba (a scribble, 722 fragments). Together 1,645 of 2,922 |
| The other 77 drawings | 1,277 fragments against the published 1,283 (difference 6), 963 clusters at 0.90 against 898, 118 empty area-averaged masks against 124 |
| Variants tried for the junction rule | Neighbour count or crossing number for junctions, junction dilation, Zhang, Lee or thin() skeletons, spur pruning off or iterated: 1,085 to 3,075 fragments; none gives 1,283 |

Most likely cause: run 01's junction rule collapsed the dense crossings in those two drawings into a handful of fragments, by a rule the note does not record. This cannot be confirmed without the original code. It does not touch any confirmatory number: the component unit has no junction step.

## Differences between published and rebuilt numbers

None in the confirmatory unit. The sensitivity mismatches are listed above with their measured cause.

## Choices that had to be inferred, and whether they were tuned

Every open choice was settled by the published numbers, not by tuning a free parameter: each one is a default or a plain implementation (Otsu, 8-connectivity, Python `round`, `(32 - n) // 2`, scikit-image skeletonize, scipy default blur mode, numpy default sort, seed equal to the extraction date). README.md lists each choice with the alternatives tried and what they gave. Two choices hold for this run but are fragile, and should be fixed in pre-registration v1.1 rather than carried forward silently:

| Choice | Why it matters |
|---|---|
| Submission order uses numpy's default (unstable) sort on the metadata rows | 16 glyph rows share one created_at timestamp. Their order, and so curve points 33 to 35, depends on the sort algorithm and the row order of the export. A stable sort on data.json order matches 76 of 79 points; a (created_at, id) tie-break matches 72. Recommend (created_at, id) from run 02, stated in v1.1 |
| Null-band median is `int(median)`, lo and hi are rounded | With rounding of the median, points 30 and 62 would read 76 and 156 instead of 75 and 155 |

No source image appears to have changed since the run: every confirmatory number and all 316 curve values reproduce from the 2026-10-23 inputs. Note that all 55 data-URL rows in data.json show updated_at 2026-10-23 04:45 UTC, after the run; whatever that update changed, it did not change anything the analysis reads.
