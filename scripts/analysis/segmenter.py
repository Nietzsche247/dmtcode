#!/usr/bin/env python3
"""DMT Code registry analysis: segmenter.

Turns every approved public symbol image into primitives.

  unit = component  one primitive per connected ink component (confirmatory unit)
  unit = junction   skeleton split at every junction (sensitivity only)

Every parameter is a module constant or a command line flag and is documented
in README.md. Nothing here is random.
"""
import argparse
import base64
import csv
import io
import json
import os
import subprocess
import sys

import numpy as np
from PIL import Image
from scipy import ndimage as ndi
from skimage.filters import threshold_otsu
from skimage.measure import label
from skimage.morphology import skeletonize

# ---------------------------------------------------------------- parameters
SITE = "https://dmtcode.com"      # base for relative SVG paths in image_url
SVG_RENDER_PX = 800               # SVGs rendered to 800 x 800 (same canvas as the PNG submissions)
CONNECTIVITY = 2                  # 8-connected components
SPECK_FRACTION = 0.002            # components smaller than 0.2 percent of image area are dropped
FRAME_MIN_EXTENT = 0.8            # a component spanning >= 80 percent of width and height ...
FRAME_MAX_FILL = 0.15             # ... while filling < 15 percent of its bounding box is a frame
SPUR_PX = 8                       # junction unit: end branches of 8 px or less are pruned
MIN_BRANCH_PX = 8                 # junction unit: branches shorter than 8 px are dropped

K8 = np.ones((3, 3), int)
K8[1, 1] = 0


# ---------------------------------------------------------------- inputs
def load_inputs(input_dir):
    data = json.load(open(os.path.join(input_dir, "data_2026-10-23.json")))
    symbols = data["symbols"]
    meta = list(csv.DictReader(open(os.path.join(input_dir, "symbol_meta_2026-10-23.csv"))))
    return symbols, meta


def submission_order(meta):
    """Run 01 order: metadata rows (as exported) sorted by created_at.

    numpy's default sort (kind='quicksort', not stable) is what run 01 used; it
    fixes the order of the 16 glyph rows that share one created_at timestamp.
    Returns the list of 8 character ids in analysis order.
    """
    created = np.array([r["created_at"] for r in meta])
    idx = np.argsort(created, kind="quicksort")
    return [meta[i]["id8"] for i in idx]


def image_cache_path(images_dir, sym):
    url = sym["image_url"]
    ext = ".svg" if url.lower().endswith(".svg") else ".png"
    return os.path.join(images_dir, sym["id"][:8] + ext)


def fetch_remote_images(symbols, images_dir):
    """Download each non data-URL image once into input/images/."""
    os.makedirs(images_dir, exist_ok=True)
    for s in symbols:
        url = s["image_url"]
        if url.startswith("data:"):
            continue
        out = image_cache_path(images_dir, s)
        if os.path.exists(out) and os.path.getsize(out) > 0:
            continue
        full = SITE + url if url.startswith("/") else url
        subprocess.run(["curl", "-sSf", "-o", out, full], check=True)


def load_rgba(sym, images_dir, svg_px=SVG_RENDER_PX):
    url = sym["image_url"]
    if url.startswith("data:"):
        im = Image.open(io.BytesIO(base64.b64decode(url.split(",", 1)[1])))
    elif url.lower().endswith(".svg"):
        import cairosvg
        png = cairosvg.svg2png(url=image_cache_path(images_dir, sym),
                               output_width=svg_px, output_height=svg_px)
        im = Image.open(io.BytesIO(png))
    else:
        im = Image.open(image_cache_path(images_dir, sym))
    return np.array(im.convert("RGBA"))


# ---------------------------------------------------------------- ink mask
def gray_on_white(rgba):
    """Alpha-composite on white, then ITU-R 601 luma, float 0..255."""
    rgb = rgba[..., :3].astype(float)
    a = rgba[..., 3:4] / 255.0
    c = rgb * a + 255.0 * (1 - a)
    return c[..., 0] * 0.299 + c[..., 1] * 0.587 + c[..., 2] * 0.114


def ink_mask(rgba):
    """Otsu threshold; ink is the side opposite the background.

    Background level = median of the one pixel image border. Light background:
    ink = gray < t. Dark background (the five seed SVGs): ink = gray > t.
    """
    g = gray_on_white(rgba)
    t = threshold_otsu(g)
    border = np.concatenate([g[0], g[-1], g[:, 0], g[:, -1]])
    return (g < t) if np.median(border) >= t else (g > t)


def is_frame(comp):
    ys, xs = np.nonzero(comp)
    h = ys.max() - ys.min() + 1
    w = xs.max() - xs.min() + 1
    H, W = comp.shape
    return h >= FRAME_MIN_EXTENT * H and w >= FRAME_MIN_EXTENT * W and comp.sum() / (h * w) < FRAME_MAX_FILL


def clean_components(mask):
    """8-connected components after the speck rule and frame removal."""
    lab = label(mask, connectivity=CONNECTIVITY)
    sizes = np.bincount(lab.ravel())
    floor = SPECK_FRACTION * mask.size
    comps = []
    for i in range(1, lab.max() + 1):
        if sizes[i] < floor:
            continue
        c = lab == i
        if is_frame(c):
            continue
        comps.append(c)
    return comps


# ---------------------------------------------------------------- junction unit
def neighbour_count(sk):
    return ndi.convolve(sk.astype(int), K8, mode="constant") * sk


def prune_spurs(sk, max_len=SPUR_PX):
    """Remove end branches (endpoint to junction) of max_len px or less, one pass."""
    sk = sk.copy()
    nb = neighbour_count(sk)
    junc = (nb >= 3) & sk
    ends = (nb == 1) & sk
    lab = label(sk & ~junc, connectivity=2)
    near_j = ndi.binary_dilation(junc, structure=np.ones((3, 3), bool))
    for i, sl in enumerate(ndi.find_objects(lab), 1):
        if sl is None:
            continue
        br = lab[sl] == i
        if br.sum() > max_len:
            continue
        if (ends[sl] & br).any() and (near_j[sl] & br).any():
            sk[sl][br] = False
    return skeletonize(sk)


def junction_fragments(mask, min_branch=MIN_BRANCH_PX, spur=SPUR_PX):
    """Split the skeleton at every junction and give each kept branch its ink.

    Junction = skeleton pixel with 3 or more 8-neighbours. Branches are the
    8-connected pieces left after removing junction pixels; pieces shorter than
    min_branch px are dropped. Every ink pixel goes to the nearest kept branch.
    """
    sk = prune_spurs(skeletonize(mask), spur)
    junc = (neighbour_count(sk) >= 3) & sk
    lab = label(sk & ~junc, connectivity=2)
    sizes = np.bincount(lab.ravel())
    keep = [i for i in range(1, lab.max() + 1) if sizes[i] >= min_branch]
    if not keep:
        return []
    remap = np.zeros(lab.max() + 1, int)
    remap[keep] = np.arange(1, len(keep) + 1)
    lab2 = remap[lab]
    _, ind = ndi.distance_transform_edt(lab2 == 0, return_indices=True)
    owner = lab2[ind[0], ind[1]]
    owner[~mask] = 0
    return [owner == j for j in range(1, len(keep) + 1)]


# ---------------------------------------------------------------- driver
def crop(m):
    ys, xs = np.nonzero(m)
    return m[ys.min():ys.max() + 1, xs.min():xs.max() + 1], (int(ys.min()), int(xs.min()), int(ys.max()), int(xs.max()))


def segment_all(symbols, order_ids, images_dir, unit="component", min_branch=MIN_BRANCH_PX):
    by8 = {s["id"][:8]: s for s in symbols}
    prims = []
    for pos, id8 in enumerate(order_ids):
        s = by8[id8]
        rgba = load_rgba(s, images_dir)
        comps = clean_components(ink_mask(rgba))
        if unit == "component":
            pieces = comps
        else:
            m = np.zeros(rgba.shape[:2], bool)
            for c in comps:
                m |= c
            pieces = junction_fragments(m, min_branch) if m.any() else []
        for j, p in enumerate(pieces):
            c, bbox = crop(p)
            prims.append(dict(symbol_id=s["id"], id8=id8, order=pos, part=j, crop=c,
                              bbox=bbox, ink_px=int(p.sum()), image_hw=rgba.shape[:2]))
    return prims


def save_prims(prims, path):
    np.savez_compressed(path,
                        crops=np.array([p["crop"] for p in prims], dtype=object),
                        meta=json.dumps([{k: v for k, v in p.items() if k != "crop"} for p in prims]))


def load_prims(path):
    z = np.load(path, allow_pickle=True)
    meta = json.loads(str(z["meta"]))
    for m, c in zip(meta, z["crops"]):
        m["crop"] = c
    return meta


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--input", required=True)
    ap.add_argument("--out", required=True, help="npz file for the primitives")
    ap.add_argument("--unit", choices=["component", "junction"], default="component")
    ap.add_argument("--min-branch", type=int, default=MIN_BRANCH_PX)
    a = ap.parse_args()
    symbols, meta = load_inputs(a.input)
    images_dir = os.path.join(a.input, "images")
    fetch_remote_images(symbols, images_dir)
    order = submission_order(meta)
    prims = segment_all(symbols, order, images_dir, a.unit, a.min_branch)
    os.makedirs(os.path.dirname(os.path.abspath(a.out)), exist_ok=True)
    save_prims(prims, a.out)
    print(f"{a.unit}: {len(order)} submissions, {len(prims)} primitives", file=sys.stderr)


if __name__ == "__main__":
    main()
