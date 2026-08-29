#!/usr/bin/env python3
"""route-parity: diff the netlify.toml prerender route table against the live
sitemap in BOTH directions, then assert head correctness on real pages.

Why this job exists: route-verify derives its work list from sitemap.xml, so it
is structurally blind to routes missing from sitemap.xml. This job derives its
work list from the ROUTE TABLE IN CODE as well, which is what makes the blind
spot visible.
"""
import json, os, re, sys, time, urllib.request, urllib.error
from concurrent.futures import ThreadPoolExecutor

SITE = os.environ.get("SITE", "https://dmtcode.com")
LOCALES = ("es", "de")
FULL = os.environ.get("PARITY_FULL", "0") == "1"

# Literal prerender routes that are deliberately NOT in sitemap.xml.
# Every entry needs a stated reason. An unexplained entry is a bug, not config.
PRERENDERED_NOT_IN_SITEMAP = {
    "/submit-symbol": "server rendered but deliberately noindex (see sitemap.ts comment)",
}
# Sitemap entries that are deliberately NOT literal prerender routes.
SITEMAP_NOT_PRERENDERED = {
    "/agent/": "hand written static file at public/agent/index.html, served by "
               "the CDN and never routed through content-prerender",
}
# Sitemap prefixes holding files rather than pages. A PDF is served straight from
# the CDN, has no head tags, and is never routed through content-prerender, so
# both the route diff and the head checks below have to leave it alone. Same
# rule as the dicts above: every prefix needs a stated reason.
SITEMAP_ASSET_PREFIXES = {
    "/downloads/": "protocol and field sheet PDFs served from public/downloads/",
}

def is_sitemap_asset(p):
    return any(p.startswith(pre) for pre in SITEMAP_ASSET_PREFIXES)

results = []
def check(name, ok, detail=""):
    results.append({"check": name, "ok": bool(ok), "detail": str(detail)[:300]})

def fetch(url, attempts=3):
    """Retry transient failures. A nightly check that flakes is a check people
    learn to ignore, which is worse than no check."""
    req = urllib.request.Request(url, headers={
        "Cache-Control": "no-cache",
        "User-Agent": "geo-drift-route-parity",
    })
    last = (None, "")
    for i in range(attempts):
        try:
            with urllib.request.urlopen(req, timeout=30) as r:
                return r.status, r.read().decode("utf-8", "replace")
        except urllib.error.HTTPError as e:
            if 400 <= e.code < 500:      # a real 404 is a finding, not a flake
                return e.code, ""
            last = (e.code, "")
        except Exception:
            last = (None, "")
        time.sleep(1.5 * (i + 1))
    return last

# ---------- 1. route table from code ----------
toml = open("netlify.toml", encoding="utf-8").read()
blocks = re.findall(
    r'\[\[edge_functions\]\]\s*\n\s*path\s*=\s*"([^"]+)"\s*\n\s*function\s*=\s*"([^"]+)"',
    toml)
prerender = [p for p, f in blocks if f == "content-prerender"]
literal = sorted({p for p in prerender if "*" not in p and not p.startswith(("/es", "/de"))})
wildcard = sorted({p[:-2] for p in prerender if p.endswith("/*") and not p.startswith(("/es", "/de"))})
locale_mirrors = sorted({p for p in prerender if p.startswith(("/es/", "/de/"))})

check("netlify.toml parsed: content-prerender routes found", len(literal) > 0,
      f"{len(literal)} literal, {len(wildcard)} wildcard")
check("locale mirrors /es/* and /de/* are mapped to content-prerender",
      set(locale_mirrors) == {"/es/*", "/de/*"}, locale_mirrors)

# ---------- 2. sitemap from production ----------
status, sm = fetch(f"{SITE}/sitemap.xml")
check("sitemap.xml 200", status == 200, status)
sm_urls = re.findall(r"<loc>([^<]+)</loc>", sm)
sm_paths = [u[len(SITE):] or "/" for u in sm_urls if u.startswith(SITE)]
sm_set = set(sm_paths)
check("sitemap has URLs", len(sm_paths) > 0, len(sm_paths))

def is_locale_path(p):
    """True for the /es and /de mirrors. Written out rather than using
    startswith on a bare prefix, because "/dataset" starts with "/de"."""
    return any(p == f"/{loc}" or p.startswith(f"/{loc}/") for loc in LOCALES)

def covered_by_wildcard(p):
    if is_locale_path(p):
        # A locale URL is served when its mirror wildcard exists AND the English
        # route behind it is itself prerendered. Checking the English route keeps
        # the blind spot visible: /de/nonsense is still reported as uncovered.
        loc = p[1:3]
        if f"/{loc}/*" not in locale_mirrors:
            return False
        rest = p[len(loc) + 1:] or "/"
        if rest == "/" or rest in literal:
            return True
        return any(rest.startswith(w + "/") for w in wildcard)
    return any(p.startswith(w + "/") for w in wildcard)

# ---------- 3. the two-way diff ----------
missing_from_sitemap = [
    p for p in literal
    if p not in sm_set and p not in PRERENDERED_NOT_IN_SITEMAP
]
check("every literal prerender route appears in sitemap.xml",
      not missing_from_sitemap,
      "prerendered but uncrawlable: " + ", ".join(missing_from_sitemap) if missing_from_sitemap else "")

missing_from_routes = [
    p for p in sm_paths
    if p not in literal
    and not covered_by_wildcard(p)
    and p not in SITEMAP_NOT_PRERENDERED
    and not is_sitemap_asset(p)
]
check("every sitemap URL is served by the prerender route table",
      not missing_from_routes,
      "in sitemap but serves the raw SPA shell: " + ", ".join(sorted(set(missing_from_routes))[:15])
      if missing_from_routes else "")

for p, reason in PRERENDERED_NOT_IN_SITEMAP.items():
    check(f"documented exclusion still applies: {p} is a prerender route", p in literal, reason)
for p, reason in SITEMAP_NOT_PRERENDERED.items():
    check(f"documented exclusion still applies: {p} is in the sitemap", p in sm_set, reason)
for pre, reason in SITEMAP_ASSET_PREFIXES.items():
    check(f"documented exclusion still applies: {pre} holds sitemap entries",
          any(p.startswith(pre) for p in sm_paths), reason)

# ---------- 4. head correctness on real pages ----------
# FULL (schedule / manual): every English sitemap URL, plus locale variants for
# the index routes. Detail-page locale variants are deliberately not swept — the
# title check excludes them anyway, and they triple the run for no new signal.
# SAMPLE (push): the index routes plus a slice of detail pages, ~40s.
# The locale mirrors are probed by prefixing an English route below, so they are
# excluded from the English work list. Leaving them in probed /es/es/ and
# asserted lang="en" on a Spanish page: two failures that were artefacts of the
# work list, not defects on the site.
en_sm_paths = [p for p in sm_paths if not is_locale_path(p) and not is_sitemap_asset(p)]
targets = en_sm_paths if FULL else literal + [p for p in en_sm_paths if p.count("/") > 1][:12]
# /agent/ and friends are static files, not prerendered pages. They are covered
# by the diff above; asserting prerender head tags on them is a false positive.
targets = [t for t in dict.fromkeys(targets) if t not in SITEMAP_NOT_PRERENDERED]
pairs = [(p, "en") for p in targets]
for p in (literal if FULL else targets):
    for loc in LOCALES:
        pairs.append((f"/{loc}{p}" if p != "/" else f"/{loc}/", loc))

RE_CANON = re.compile(r'<link[^>]+rel="canonical"[^>]+href="([^"]+)"', re.I)
RE_LANG = re.compile(r'<html[^>]*\blang="([^"]+)"', re.I)
RE_TITLE = re.compile(r"<title[^>]*>(.*?)</title>", re.I | re.S)
RE_ALT = re.compile(r'<link[^>]+rel="alternate"[^>]+hreflang="([^"]+)"', re.I)

def probe(item):
    path, loc = item
    st, html = fetch(SITE + path)
    canon = RE_CANON.search(html)
    lang = RE_LANG.search(html)
    title = RE_TITLE.search(html)
    return {
        "path": path, "loc": loc, "status": st,
        "canonical": canon.group(1) if canon else None,
        "lang": lang.group(1) if lang else None,
        "title": re.sub(r"\s+", " ", title.group(1)).strip() if title else None,
        "hreflang": set(a.lower() for a in RE_ALT.findall(html)),
    }

with ThreadPoolExecutor(max_workers=16 if FULL else 8) as ex:
    probes = list(ex.map(probe, pairs))

by_path = {p["path"]: p for p in probes}
bad_status = [p["path"] for p in probes if p["status"] != 200]
check("every probed route returns 200", not bad_status, bad_status[:10])

bad_canon = [p["path"] for p in probes
             if p["status"] == 200 and (p["canonical"] or "").rstrip("/") != (SITE + p["path"]).rstrip("/")]
check("canonical is present and self-referential", not bad_canon, bad_canon[:10])

bad_lang = [f"{p['path']}={p['lang']}" for p in probes
            if p["status"] == 200 and not (p["lang"] or "").lower().startswith(p["loc"])]
check("html lang matches the locale prefix", not bad_lang, bad_lang[:10])

WANT = {"en", "es", "de", "x-default"}
bad_alt = [p["path"] for p in probes if p["status"] == 200 and not WANT <= p["hreflang"]]
check("hreflang set is complete (en, es, de, x-default)", not bad_alt, bad_alt[:10])

# Index routes only. Detail pages translate through content_translations, keyed
# (table_name, record_id, field); a record with no translation row falls back to
# English by design, so asserting on them would fail forever on non-defects.
untranslated = []
for p in probes:
    if p["loc"] == "en" or p["status"] != 200:
        continue
    src = p["path"][3:] or "/"
    if src not in literal:
        continue
    en = by_path.get(src)
    if en and en["title"] and en["title"] == p["title"]:
        untranslated.append(p["path"])
check("locale index-page titles differ from their English source (ui-strings coverage)",
      not untranslated, untranslated[:10])

fails = [r for r in results if not r["ok"]]
json.dump({"job": "route-parity", "results": results}, open("parity_report.json", "w"), indent=1)
for r in results:
    print(("PASS " if r["ok"] else "FAIL ") + r["check"] + (f" — {r['detail']}" if r["detail"] else ""))
print(f"\nmode={'FULL' if FULL else 'SAMPLE'}  probed={len(pairs)}  {len(results)} checks, {len(fails)} failed")
sys.exit(1 if fails else 0)
