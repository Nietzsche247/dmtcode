# DMT Code registry analysis, run 01 (rebuilt)

This folder is the code for analysis run 01 (extraction date 2026-10-23), rebuilt after the original code was lost. It reproduces every confirmatory number published at https://dmtcode.com/analysis and in https://dmtcode.com/analysis/run01.json, including all 79 points of the observed saturation curve and all 237 values of the random-order band (lo, median, hi). See ../../REPRODUCTION.md for the number-by-number check.

Method: DMTCODE_ANALYSIS_RUN_01_2026-10-23_0230.md and DMTCODE_PREREGISTRATION_v1_0.md (sections 4 and 5). The similarity metric follows the October 2026 shape comparison contributed by Jan Grube.

## How to run

```
pip install -r scripts/analysis/requirements.txt
scripts/analysis/run_all.sh
```

Inputs are read from `input/` (`data_2026-10-23.json`, `symbol_meta_2026-10-23.csv`). Remote images (21 SVGs from dmtcode.com, 3 storage PNGs) are downloaded once into `input/images/` and reused afterwards. Everything is written to `output/`. A full run takes under a minute on two cores. Two consecutive runs give byte-identical outputs.

## What it does

1. `segmenter.py` turns each of the 79 symbol images into primitives.
   * Decode: PNG data URL, cached storage PNG, or SVG rendered with CairoSVG to 800 x 800.
   * Ink mask: alpha-composite on white, luma (0.299 R + 0.587 G + 0.114 B), Otsu threshold. The ink is the side opposite the background, where the background level is the median of the one pixel border. This handles the five seed SVGs, which are red strokes on a near-black background.
   * Components: 8-connected. Speck rule drops components below 0.2 percent of the image area. Frame removal drops a component that spans at least 80 percent of the image width and height while filling less than 15 percent of its bounding box (removes the decorative border of seed b7c17e05).
   * Unit `component` (confirmatory): one primitive per remaining component.
   * Unit `junction` (sensitivity): Zhang skeleton, one pass of spur pruning (end branches of 8 px or less), junction = skeleton pixel with 3 or more 8-neighbours, junction pixels removed, branches shorter than 8 px dropped, every ink pixel assigned to the nearest kept branch.
2. `analysis.py` normalises, compares, clusters and counts.
   * Normalise each primitive: tight crop; target size so the longer side is 32 px (Python `round`); ink-presence pooling (source row y goes to cell y * th // h, column x to x * tw // w; a cell is ink if any source ink pixel lands in it); centre on a 32 x 32 grid with offset (32 - size) // 2; skeletonize (Zhang); 3 x 3 dilation (3 px strokes); Gaussian blur sigma 1 (`scipy.ndimage.gaussian_filter`, default mode `reflect`); re-binarise at 0.5 (`>=`).
   * Similarity: Dice coefficient as a percentage, no rotation or mirror.
   * Clusters: single linkage at T, that is connected components of the graph Dice >= 100 T, for T = 0.85, 0.90, 0.95.
   * Replication tiers at 0.90: distinct naive contributors per cluster (0 none, 1 candidate, 2 supported, 3 or more replicated).
   * f1, f2 = clusters of size 1 and 2 (primitives); Chao1 = S + f1^2 / (2 f2).
   * Contributors: a distinct `uid`; anonymous rows count as symbols only. A row is naive when prior exposure is naive/false and catalog exposure is `priming_none`; the submission-side fields are used, and the glyph-side fields when the submission side is blank; no record at all is unrecorded. A contributor is naive only when every row is naive, exposed when any row is exposed, otherwise unrecorded (treated as exposed in confirmatory tests).
   * Saturation curve: submissions in created_at order; for k = 1..79, the number of distinct T = 0.90 clusters (labels from the full run) that the first k submissions touch. Null band: 1000 random orderings, `numpy.random.default_rng(20261023).permutation(79)` each; lo and hi = `round(numpy.percentile(..., 2.5 / 97.5))` (linear method), median = `int(numpy.median(...))`.
   * Sensitivity runs: junction unit; junction unit with literal area averaging (PIL BOX resampling to the same target size, then the same blur and 0.5 threshold, no skeleton or dilation); rotation (0, 90, 180, 270) plus mirror, max Dice over the 8 transforms applied to the crop before normalising, on both units.

## Outputs (`output/`)

| File | Content |
|---|---|
| primitives.csv | One row per primitive: symbol, order, bbox, ink pixels, contributor, exposure class, cluster id at each T |
| clusters_T085.csv, clusters_T090.csv, clusters_T095.csv | One row per cluster: size, submissions, contributors, naive contributors, tier, members (`id8#part`) |
| pairs_ge080.csv | Every primitive pair with Dice >= 80 |
| saturation_curve.csv, saturation_curve.png | Observed curve with the random-order median and 95 percent band |
| summary.json | Same schema as run01.json (the junction-cut block holds this code's junction-cut result) |
| sensitivity/ | junction_cut (full output set incl. curve), junction_cut_area, junction_cut_rotation_mirror, component_rotation_mirror, and sensitivity_summary.json with empty-mask counts |
| work/ | Primitive crops as .npz (intermediate) |

## Parameters

| Parameter | Value | Where |
|---|---|---|
| SVG render size | 800 x 800 | segmenter.SVG_RENDER_PX |
| Gray conversion | composite on white, ITU-R 601 luma, float | segmenter.gray_on_white |
| Binarisation | Otsu (scikit-image, 256 bins), polarity from border median | segmenter.ink_mask |
| Connectivity | 8 | segmenter.CONNECTIVITY |
| Speck rule | 0.2 percent of image area | segmenter.SPECK_FRACTION |
| Frame rule | span >= 0.8 of both sides and fill < 0.15 | segmenter.FRAME_MIN_EXTENT, FRAME_MAX_FILL |
| Spur pruning (junction unit) | 8 px, one pass | segmenter.SPUR_PX |
| Minimum branch (junction unit) | 8 px (flag `--min-branch`, 32 for the mb32 variant) | segmenter.MIN_BRANCH_PX |
| Grid | 32, longer side, centred | analysis.GRID |
| Stroke normalisation | Zhang skeleton then 3 x 3 dilation, after pooling | analysis.normalise |
| Blur | sigma 1, mode reflect | analysis.BLUR_SIGMA, BLUR_MODE |
| Re-binarise | >= 0.5 | analysis.REBINARISE |
| Thresholds | 0.85, 0.90 (main), 0.95; compared as Dice >= 100 T | analysis.THRESHOLDS |
| Submission order | metadata CSV rows sorted by created_at with numpy's default sort | segmenter.submission_order |
| Null curve | 1000 orderings, seed 20261023 | analysis.NULL_REPS, NULL_SEED |

## Open choices: what was tried, what was chosen, why

The run 01 note leaves these open. Each choice below is the one that reproduces the published numbers; the alternatives are listed with the result they gave, so a reader can see that the published numbers pin the choice down.

| Choice | Chosen | Alternatives tried and what they gave |
|---|---|---|
| Binarisation | Otsu per image, ink opposite the background | Fixed threshold 128 turns every seed into a solid square: 223 primitives, 175 / 189 / 203 clusters, curve matches at 1 of 79 points. Absolute difference from the background colour either keeps the border on all five seeds or loses the seeds. Otsu at 800 px keeps the border on exactly one seed (b7c17e05), which is what the run 01 note describes |
| SVG render size | 800 px | 700 to 1024 give identical results. Native size (100 px seeds) gives 10, 6, 8, 12 components on the seeds; 512 gives 234 primitives; 640 gives 194 clusters at 0.90 |
| Working resolution of PNGs | native (800, 600, 512) | Downscaling to 256 to 600 px gives 226 to 239 primitives instead of 224 |
| Connectivity | 8 | 4-connected gives 226 primitives |
| Frame removal in the component unit | applied | Without it b7c17e05 has 2 primitives, total 225 and the curve starts at 2 |
| Gray conversion and alpha | float luma after compositing on white | Ignoring alpha, or rounding gray to uint8, gives identical results (224, 179 / 193 / 208, curve 79 of 79); compositing is kept as the safe default |
| Pooling bins | non-overlapping (y * th // h) | Overlapping bins (any partial overlap): 176 / 194 / 207, curve 61 of 79. PIL BOX presence: 175 / 194 / 211. OpenCV INTER_AREA presence: 176 / 194 / 208 |
| Order of skeleton, pool, dilate | pool, then skeleton on the 32 grid, then dilate | Skeleton at full resolution then pool then dilate: 177 / 195 / 212. No stroke normalisation: 189 / 205 / 216. Literal area averaging: 199 / 210 / 220 with 48 empty masks |
| Skeleton algorithm | Zhang (scikit-image default) | Lee: 181 / 194 / 211. thin(): 180 / 195 / 208 |
| Blur boundary mode | reflect (scipy default) | constant: 178 / 194 / 208; mirror: 178 / 194 / 206; nearest: identical to reflect |
| Threshold comparison | Dice >= 100 T | Strict > gives the same results (one pair sits at exactly 90.0, inside a cluster that is linked anyway) |
| Curve linkage | labels from the full run, counted per prefix | Re-running single linkage on each prefix matches only 64 of 79 points (later drawings bridge earlier clusters) |
| Tie order | numpy default (unstable) sort of the metadata rows by created_at | 16 glyph rows share created_at 2026-07-31 08:25:17.349827. Stable sort on data.json order: 76 of 79 points (33 to 35 off by one); tie-break by id: 72 of 79; by image URL: 72 of 79. numpy `argsort(kind='quicksort')` or pandas `sort_values` on the metadata rows: 79 of 79 |
| Null RNG and summary | default_rng(20261023).permutation; percentile rounded; median truncated | 28 seeds (0, 1, 42, 123, 2026, 20261023 and others) times 7 generator recipes (default_rng permutation or shuffle, RandomState, legacy np.random.seed, Python random shuffle or sample, argsort of uniforms) times 3 indexings were tried; only default_rng(20261023), the extraction date, permuting the created_at-sorted submissions comes close. With banker's rounding of the median two points differ (n = 30 and 62, where the median is 75.5 and 155.5); `int()` of the median matches all 79 |

### Notes for v1.1 of the pre-registration

* The submission order depends on an unstable sort for tied timestamps. It is reproducible with this code and this metadata row order, but it is fragile. Recommend an explicit tie-break (created_at, then id) from run 02 on, stated in the pre-registration.
* The median of the null band is truncated, not rounded. Harmless, but should be stated or changed.
* The speck rule (0.2 percent of image area) drops the single dot (f7eb9976) and the three dots (a2b641a3); the run 01 note already flags this.
* Presence pooling leaves gaps when a crop is smaller than the grid. No component is (the smallest is 47 px), but about half of the junction fragments are. This code fills such cells from the nearest source pixel; it changes nothing in the confirmatory unit.
* The junction-cut sensitivity run does not reproduce run 01 (see REPRODUCTION.md). It is sensitivity only and is reported as such.

## Licence and credit

Code for the metric and the tests is to be published under an open licence with the run (pre-registration section 9). The similarity metric and the Unicode comparison method were contributed by Jan Grube.

## Inputs in this folder

`input/symbol_meta_2026-10-23.csv` is the per-symbol metadata the run joins on (contributor, exposure, created_at). Contributor ids are replaced by c01 to c17 in order of first appearance; the run only uses them to group rows, and the anonymised file reproduces run 01 exactly. `input/data_2026-10-23.json` is not committed; fetch https://dmtcode.com/data.json and save it under that name (the Oct 23 snapshot is archived with the dataset DOI).

## Reproduction status

The confirmatory numbers and all 79 saturation-curve points in public/analysis/run01.json reproduce exactly from this code. The junction-cut sensitivity figures in run01.json (1,283 fragments, 898 clusters) do not; see REPRODUCTION_RUN01.md. This code is the reference from run 02 onward.
