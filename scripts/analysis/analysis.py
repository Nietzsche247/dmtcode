#!/usr/bin/env python3
"""DMT Code registry analysis: similarity, clusters, tiers, saturation curve.

Reads the primitives written by segmenter.py plus the metadata CSV and writes
the run outputs (CSV, JSON, PNG). Deterministic: the only randomness is the
null curve, drawn from numpy default_rng with a fixed seed.
"""
import argparse
import collections
import csv
import json
import os
import sys

import numpy as np
from scipy import ndimage as ndi
from scipy.sparse.csgraph import connected_components
from skimage.morphology import skeletonize

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import segmenter  # noqa: E402

# ---------------------------------------------------------------- parameters
GRID = 32                     # longer side of the normalised mask, centred on GRID x GRID
DILATE = np.ones((3, 3), bool)  # stroke width normalisation: skeleton then 3 x 3 dilation (3 px strokes)
BLUR_SIGMA = 1.0              # Gaussian blur sigma in grid pixels
BLUR_MODE = "reflect"         # scipy.ndimage default boundary mode
REBINARISE = 0.5              # blurred value >= 0.5 is ink
THRESHOLDS = (0.85, 0.90, 0.95)
T_MAIN = 0.90
NULL_REPS = 1000
NULL_SEED = 20261023          # extraction date
CHAO_NOTE = "not meaningful while nearly everything is a singleton"


# ---------------------------------------------------------------- normalisation
def target_size(h, w):
    s = GRID / max(h, w)
    return max(1, min(GRID, int(round(h * s)))), max(1, min(GRID, int(round(w * s))))


def place(small):
    th, tw = small.shape
    g = np.zeros((GRID, GRID), small.dtype)
    oy, ox = (GRID - th) // 2, (GRID - tw) // 2
    g[oy:oy + th, ox:ox + tw] = small
    return g


def presence_pool(c):
    """Ink-presence pooling: grid cell (i, j) is ink if any source ink pixel maps to it.

    Source row y maps to y * th // h, column x to x * tw // w (non-overlapping bins).
    When a crop is smaller than the grid (only junction fragments; every component
    is at least 47 px), cells that no source pixel maps to take the nearest source
    pixel, so upscaled strokes stay continuous. For downscaling this adds nothing.
    """
    h, w = c.shape
    th, tw = target_size(h, w)
    ys, xs = np.nonzero(c)
    out = np.zeros((th, tw), bool)
    out[ys * th // h, xs * tw // w] = True
    if th > h or tw > w:
        out |= c[(np.arange(th) * h // th)[:, None], (np.arange(tw) * w // tw)[None, :]]
    return place(out)


def area_pool(c):
    """Literal area averaging (sensitivity variant): exact pixel-area weighted mean (PIL BOX filter, float)."""
    from PIL import Image
    h, w = c.shape
    th, tw = target_size(h, w)
    im = Image.fromarray(c.astype(np.float32), mode="F").resize((tw, th), Image.BOX)
    return place(np.array(im, dtype=float))


def blur_binarise(g):
    return ndi.gaussian_filter(g.astype(float), BLUR_SIGMA, mode=BLUR_MODE) >= REBINARISE


def normalise(c, method="presence"):
    if method == "area":
        return blur_binarise(area_pool(c))
    g = presence_pool(c)
    g = ndi.binary_dilation(skeletonize(g), structure=DILATE)
    return blur_binarise(g)


DIHEDRAL = [lambda a: a, lambda a: np.rot90(a, 1), lambda a: np.rot90(a, 2), lambda a: np.rot90(a, 3),
            lambda a: np.fliplr(a), lambda a: np.rot90(np.fliplr(a), 1),
            lambda a: np.rot90(np.fliplr(a), 2), lambda a: np.rot90(np.fliplr(a), 3)]


# ---------------------------------------------------------------- similarity
def dice_matrix(masks, masks_b=None):
    X = np.array([m.ravel() for m in masks], dtype=np.float64)
    Y = X if masks_b is None else np.array([m.ravel() for m in masks_b], dtype=np.float64)
    inter = X @ Y.T
    den = X.sum(1)[:, None] + Y.sum(1)[None, :]
    with np.errstate(divide="ignore", invalid="ignore"):
        D = np.where(den > 0, 200.0 * inter / den, 0.0)
    return D


def dice_invariant(crops, method="presence"):
    """Max Dice over rotation 0/90/180/270 and mirror, transform applied to the crop before normalising."""
    base = [normalise(c, method) for c in crops]
    D = dice_matrix(base)
    for f in DIHEDRAL[1:]:
        D = np.maximum(D, dice_matrix(base, [normalise(np.ascontiguousarray(f(c)), method) for c in crops]))
    return np.maximum(D, D.T)


def single_linkage(D, T):
    """Single linkage at threshold T = connected components of the graph Dice >= 100 T."""
    return connected_components(D >= 100 * T - 1e-9, directed=False)[1]


# ---------------------------------------------------------------- contributors
def row_status(r):
    """naive / exposed / unrecorded for one submission row (glyph side when submission side is blank)."""
    prior, cat = r["s_prior"] or None, r["s_cat"] or None
    if prior is None and cat is None:
        prior = {"false": "naive", "true": "exposed"}.get(r["g_prior"], r["g_prior"] or None)
        cat = r["g_cat"] or None
    if prior is None:
        return "unrecorded"
    return "naive" if (prior == "naive" and cat == "priming_none") else "exposed"


def contributor_table(meta):
    rows = {r["id8"]: r for r in meta}
    status = {k: row_status(r) for k, r in rows.items()}
    by = collections.defaultdict(list)
    for k, r in rows.items():
        if r["uid"]:
            by[r["uid"]].append(status[k])
    cstat = {}
    for u, st in by.items():
        if all(s == "naive" for s in st):
            cstat[u] = "naive"
        elif any(s == "exposed" for s in st):
            cstat[u] = "exposed"
        else:
            cstat[u] = "unrecorded"   # unrecorded counts as exposed in every confirmatory test
    return rows, status, cstat


# ---------------------------------------------------------------- outputs
def tier_of(n_naive):
    return "none" if n_naive == 0 else "candidate" if n_naive == 1 else "supported" if n_naive == 2 else "replicated"


def cluster_rows(prims, lab, rows, cstat):
    cl = collections.defaultdict(list)
    for i, l in enumerate(lab):
        cl[l].append(i)
    out = []
    # stable cluster numbering: by first member in analysis order
    for cid, (l, mem) in enumerate(sorted(cl.items(), key=lambda kv: min(kv[1]))):
        uids = sorted({rows[prims[i]["id8"]]["uid"] for i in mem} - {""})
        naive = [u for u in uids if cstat.get(u) == "naive"]
        out.append(dict(cluster=cid, size=len(mem), n_submissions=len({prims[i]["id8"] for i in mem}),
                        n_contributors=len(uids), n_naive_contributors=len(naive), tier=tier_of(len(naive)),
                        members=";".join(f"{prims[i]['id8']}#{prims[i]['part']}" for i in mem)))
    return out


def summarise_clusters(crows):
    sizes = collections.Counter(r["size"] for r in crows)
    tiers = collections.Counter(r["tier"] for r in crows)
    f1, f2 = sizes.get(1, 0), sizes.get(2, 0)
    n = len(crows)
    chao1 = n + f1 * f1 / (2 * f2) if f2 > 0 else n + f1 * (f1 - 1) / 2
    return dict(n=n, f1=f1, f2=f2, chao1=round(chao1, 1),
                tiers={k: tiers.get(k, 0) for k in ("none", "candidate", "supported", "replicated")},
                two_plus=sum(1 for r in crows if r["n_contributors"] >= 2))


def submission_cluster_sets(prims, lab, n_sub):
    sets = [set() for _ in range(n_sub)]
    for i, p in enumerate(prims):
        sets[p["order"]].add(int(lab[i]))
    return sets


def prefix_counts(sets, order):
    seen, out = set(), []
    for s in order:
        seen |= sets[s]
        out.append(len(seen))
    return out


def saturation(prims, lab, n_sub):
    """Observed curve: distinct clusters (labels from the full run) among the first k submissions."""
    sets = submission_cluster_sets(prims, lab, n_sub)
    observed = prefix_counts(sets, range(n_sub))
    rng = np.random.default_rng(NULL_SEED)
    null = np.array([prefix_counts(sets, rng.permutation(n_sub)) for _ in range(NULL_REPS)])
    lo = np.round(np.percentile(null, 2.5, axis=0)).astype(int)
    hi = np.round(np.percentile(null, 97.5, axis=0)).astype(int)
    med = np.median(null, axis=0).astype(int)   # int() of the median, as in run 01
    return [dict(n=k + 1, observed=int(observed[k]), lo=int(lo[k]), median=int(med[k]), hi=int(hi[k]))
            for k in range(n_sub)]


def write_csv(path, rows, fields=None):
    fields = fields or list(rows[0].keys())
    with open(path, "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader()
        for r in rows:
            w.writerow(r)


def plot_curve(curve, path, title):
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    n = [c["n"] for c in curve]
    fig, ax = plt.subplots(figsize=(7, 4.2), dpi=150)
    ax.fill_between(n, [c["lo"] for c in curve], [c["hi"] for c in curve], color="#9bb7d4", alpha=0.45,
                    linewidth=0, label="random order, 95 percent band")
    ax.plot(n, [c["median"] for c in curve], color="#4a6f96", linewidth=1.2, linestyle="--", label="random order, median")
    ax.plot(n, [c["observed"] for c in curve], color="#1f2a36", linewidth=2.0, label="observed (submission order)")
    ax.set_xlabel("submissions")
    ax.set_ylabel("distinct forms (clusters)")
    ax.set_title(title, fontsize=10)
    ax.grid(alpha=0.25)
    ax.legend(frameon=False, fontsize=8, loc="upper left")
    fig.tight_layout()
    fig.savefig(path)
    plt.close(fig)


def run(prims, meta, outdir, unit_label, method="presence", invariant=False, write_curve=True):
    os.makedirs(outdir, exist_ok=True)
    rows, rstat, cstat = contributor_table(meta)
    n_sub = len(meta)
    crops = [p["crop"] for p in prims]
    masks = [normalise(c, method) for c in crops]
    empty = sum(1 for m in masks if not m.any())
    D = dice_invariant(crops, method) if invariant else dice_matrix(masks)

    # primitives table
    order_ids = segmenter.submission_order(meta)
    per_sub = collections.Counter(p["id8"] for p in prims)
    labs = {T: single_linkage(D, T) for T in THRESHOLDS}
    prow = []
    for i, p in enumerate(prims):
        r = rows[p["id8"]]
        prow.append(dict(primitive=i, symbol_id=p["symbol_id"], id8=p["id8"], order=p["order"] + 1, part=p["part"],
                         bbox_y0=p["bbox"][0], bbox_x0=p["bbox"][1], bbox_y1=p["bbox"][2], bbox_x1=p["bbox"][3],
                         ink_px=p["ink_px"], mask_px=int(masks[i].sum()), contributor=r["uid"] or "",
                         row_exposure=rstat[p["id8"]], contributor_class=cstat.get(r["uid"], "anonymous"),
                         created_at=r["created_at"], cluster_T085=int(labs[0.85][i]), cluster_T090=int(labs[0.90][i]),
                         cluster_T095=int(labs[0.95][i])))
    write_csv(os.path.join(outdir, "primitives.csv"), prow)

    summ = {}
    for T in THRESHOLDS:
        crows = cluster_rows(prims, labs[T], rows, cstat)
        write_csv(os.path.join(outdir, f"clusters_T{int(round(T * 100)):03d}.csv"), crows)
        summ[T] = summarise_clusters(crows)

    # pairs at Dice >= 80 for inspection
    iu = np.triu_indices(len(prims), 1)
    sel = D[iu] >= 80
    write_csv(os.path.join(outdir, "pairs_ge080.csv"),
              [dict(a=int(a), b=int(b), a_id8=prims[a]["id8"], b_id8=prims[b]["id8"], dice=round(float(D[a, b]), 3))
               for a, b in zip(iu[0][sel], iu[1][sel])], ["a", "b", "a_id8", "b_id8", "dice"])

    curve = saturation(prims, labs[T_MAIN], n_sub) if write_curve else []
    if write_curve:
        write_csv(os.path.join(outdir, "saturation_curve.csv"), curve)
        plot_curve(curve, os.path.join(outdir, "saturation_curve.png"),
                   f"Saturation curve, {unit_label}, T = {T_MAIN:.2f}")

    contrib = collections.Counter(cstat.values())
    rowc = collections.Counter(rstat.values())
    counts = [per_sub.get(i, 0) for i in order_ids]
    m = summ[T_MAIN]
    summary = {
        "run_id": "run01",
        "extraction_date": "2026-10-23",
        "unit": unit_label,
        "threshold": T_MAIN,
        "n_submissions": n_sub,
        "n_primitives": len(prims),
        "n_clusters": {str(T): summ[T]["n"] for T in THRESHOLDS},
        "tiers": m["tiers"],
        "clusters_2plus_contributors": m["two_plus"],
        "f1": m["f1"],
        "f2": m["f2"],
        "chao1": m["chao1"],
        "contributors": {"identified": len(cstat), "naive": contrib["naive"], "exposed": contrib["exposed"],
                         "unrecorded": contrib["unrecorded"], "anonymous_rows": sum(1 for r in meta if not r["uid"])},
        "rows": {"naive": rowc["naive"], "exposed": rowc["exposed"], "unrecorded": rowc["unrecorded"]},
        "sober_baseline": sum(1 for r in meta if r["sober"] == "true"),
        "null_reports": 0,
    }
    extra = dict(empty_masks=empty, submissions_without_primitive=sum(1 for c in counts if c == 0),
                 median_primitives_per_submission=float(np.median(counts)), max_primitives_per_submission=max(counts),
                 method=method, rotation_mirror=invariant)
    return summary, curve, extra


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--input", required=True)
    ap.add_argument("--component", required=True, help="component unit primitives (npz)")
    ap.add_argument("--junction", help="junction unit primitives (npz), for the sensitivity runs")
    ap.add_argument("--out", required=True)
    a = ap.parse_args()
    _, meta = segmenter.load_inputs(a.input)
    comp = segmenter.load_prims(a.component)

    summary, curve, extra = run(comp, meta, a.out, "connected component")
    report = {"confirmatory": extra}
    sens = os.path.join(a.out, "sensitivity")
    if a.junction:
        junc = segmenter.load_prims(a.junction)
        js, _, jx = run(junc, meta, os.path.join(sens, "junction_cut"), "junction cut")
        summary["sensitivity_junction_cut"] = {
            "n_primitives": js["n_primitives"], "n_clusters_090": js["n_clusters"]["0.9"],
            "replicated": js["tiers"]["replicated"],
            "note": "replicated forms are elementary strokes; artefact of the cut rule"}
        report["junction_cut"] = dict(summary=js, **jx)
        ja, _, jax = run(junc, meta, os.path.join(sens, "junction_cut_area"), "junction cut, literal area averaging",
                         method="area", write_curve=False)
        report["junction_cut_area"] = dict(summary=ja, **jax)
        jr, _, jrx = run(junc, meta, os.path.join(sens, "junction_cut_rotation_mirror"),
                         "junction cut, rotation and mirror", invariant=True, write_curve=False)
        report["junction_cut_rotation_mirror"] = dict(summary=jr, **jrx)
    cr, _, crx = run(comp, meta, os.path.join(sens, "component_rotation_mirror"),
                     "connected component, rotation and mirror", invariant=True, write_curve=False)
    report["component_rotation_mirror"] = dict(summary=cr, **crx)
    summary["curve"] = curve
    json.dump(summary, open(os.path.join(a.out, "summary.json"), "w"), separators=(",", ":"))
    json.dump(report, open(os.path.join(sens, "sensitivity_summary.json"), "w"), indent=1)
    print(json.dumps({k: v for k, v in summary.items() if k != "curve"}), file=sys.stderr)


if __name__ == "__main__":
    main()
