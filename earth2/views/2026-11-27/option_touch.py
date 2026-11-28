#!/usr/bin/env python3
"""touch.py: market-implied odds from listed option quotes for the Earth2 price-threshold events.

Run:  python3 -I /home/claude/work/p2/opt/touch.py
Reads:  raw/opc_<SYM>_options.json, raw/opc_<SYM>_price.json   (delayed listed option quotes, Nov 27, 2026 close)
        raw/treasury_par_yields_2026.csv                       (Treasury daily par yield curve)
        raw/tv_scan_2026-11-27.json, raw/tv_scan_2026-11-27_b.json   (ICE Brent futures curve, USD/JPY, Japan 3-month yield)
        raw/source_facts.json                                  (fund page facts: IEF duration, KRE yield)
        the Earth2 graph (read only) for each event's test text and our odds
Writes: seed_markets.json (stored odds), seed_markets_plain_formula.json (the brief's plain formula, same rows),
        NOTES.txt, results.json, raw/used_rows.json

FORMULAS (risk-neutral lognormal model, constant volatility s, drift m, time T in years = calendar days / 365)
  n  = m - s*s/2
  finish below H:  N( (ln(H/S) - n*T) / (s*sqrt(T)) )          finish above H:  N( (ln(S/H) + n*T) / (s*sqrt(T)) )
  touch a lower level H < S at any time up to T (one-touch, barrier hit):
      N( (ln(H/S) - n*T) / (s*sqrt(T)) ) + (H/S)**(2*n/(s*s)) * N( (ln(H/S) + n*T) / (s*sqrt(T)) )
  touch an upper level H > S at any time up to T:
      N( (ln(S/H) + n*T) / (s*sqrt(T)) ) + (H/S)**(2*n/(s*s)) * N( (ln(S/H) - n*T) / (s*sqrt(T)) )
  closes only (Broadie, Glasserman, Kou 1997): the same formula with the level moved away from spot by
      exp(0.5826 * s * sqrt(T / number of closes)), because the tests read closing prices only.
  two expiries around a deadline: total variance w = s*s*T is interpolated in a straight line in T.

TWO VOLS ARE USED AND BOTH RESULTS ARE PRINTED
  strike vol: the option mid at the level's strike, inverted (American binomial tree for puts, Black-Scholes for calls).
  spread vol: the vol at which the model's FINISH odds equal the market's own finish odds, read from the price of
      the tight put or call spreads around the level (spread price / width, early exercise value removed,
      grossed up for interest). Where puts are dearer at lower strikes (skew), the strike vol overstates how
      often the level is reached; the spread vol does not.
  Stored odds = one-touch formula, closes only, spread vol. The plain formula (strike vol, watched all day) is
  printed beside it in every block and written to seed_markets_plain_formula.json.
"""
import csv
import datetime as dt
import json
import math
import os

import numpy as np
from scipy.optimize import brentq

HERE = os.path.dirname(os.path.abspath(__file__))
RAW = os.path.join(HERE, "raw")
GRAPH = "/home/claude/dmtcode/public/future/earth2/graph.json"
QUOTE_DATE = dt.date(2026, 11, 27)
AS_OF = QUOTE_DATE.isoformat()
OI_MIN = 50          # open interest under this counts as "near zero"
SPREAD_MAX = 0.5     # bid-ask spread wider than half the mid is refused
BGK = 0.5826
PATHS = 400000
SEED = 20261127
VENUE = "Listed options (US option exchanges, 15 to 30 minute delayed quotes via optionsprofitcalculator.com)"
FEED = "https://www.optionsprofitcalculator.com/ajax/getOptions?stock={}&reqId=1"
BIAS = ("Biases: risk-neutral (carries a risk premium, so it usually runs above real-world odds for crash-side "
        "levels); constant vol; delayed closing quotes.")

USED_ROWS = []   # every quote row that fed a number, saved to raw/used_rows.json


# ---------------------------------------------------------------- basics
def N(x):
    return 0.5 * (1.0 + math.erf(x / math.sqrt(2.0)))


def days(d):
    return (d - QUOTE_DATE).days


def yrs(d):
    return days(d) / 365.0


def d_(s):
    return dt.date.fromisoformat(s)


def finish_below(S, H, T, m, s):
    n = m - 0.5 * s * s
    return N((math.log(H / S) - n * T) / (s * math.sqrt(T)))


def finish_above(S, H, T, m, s):
    n = m - 0.5 * s * s
    return N((math.log(S / H) + n * T) / (s * math.sqrt(T)))


def touch_down(S, H, T, m, s):
    if H >= S:
        return 1.0
    n = m - 0.5 * s * s
    b = math.log(H / S)
    v = s * math.sqrt(T)
    return N((b - n * T) / v) + math.exp(2 * n * b / (s * s)) * N((b + n * T) / v)


def touch_up(S, H, T, m, s):
    if H <= S:
        return 1.0
    n = m - 0.5 * s * s
    b = math.log(H / S)
    v = s * math.sqrt(T)
    return N((-b + n * T) / v) + math.exp(2 * n * b / (s * s)) * N((-b - n * T) / v)


def touch_down_closes(S, H, T, m, s, nd):
    return touch_down(S, H * math.exp(-BGK * s * math.sqrt(T / nd)), T, m, s)


def touch_up_closes(S, H, T, m, s, nd):
    return touch_up(S, H * math.exp(BGK * s * math.sqrt(T / nd)), T, m, s)


def mc_down(S, H, T, m, s, nd):
    """Daily-close simulation check: nd equal steps, hit if any close is under H."""
    rng = np.random.default_rng(SEED)
    h = T / nd
    x = np.zeros(PATHS)
    low = np.zeros(PATHS)
    for _ in range(nd):
        z = rng.standard_normal(PATHS // 2)
        x += (m - 0.5 * s * s) * h + s * math.sqrt(h) * np.concatenate([z, -z])
        np.minimum(low, x, out=low)
    return float((low < math.log(H / S)).mean())


def bs(S, K, T, r, q, s, cp):
    d1 = (math.log(S / K) + (r - q + 0.5 * s * s) * T) / (s * math.sqrt(T))
    d2 = d1 - s * math.sqrt(T)
    if cp == "c":
        return S * math.exp(-q * T) * N(d1) - K * math.exp(-r * T) * N(d2)
    return K * math.exp(-r * T) * N(-d2) - S * math.exp(-q * T) * N(-d1)


def crr_american(S, K, T, r, q, s, cp, n=400):
    """Cox-Ross-Rubinstein tree, early exercise allowed, continuous yield q."""
    h = T / n
    u = math.exp(s * math.sqrt(h))
    d = 1.0 / u
    disc = math.exp(-r * h)
    p = (math.exp((r - q) * h) - d) / (u - d)
    j = np.arange(n + 1)
    st = S * u ** (2.0 * j - n)
    v = np.maximum(K - st, 0.0) if cp == "p" else np.maximum(st - K, 0.0)
    for _ in range(n):
        st = st[1:] * d
        v = disc * (p * v[1:] + (1.0 - p) * v[:-1])
        v = np.maximum(v, (K - st) if cp == "p" else (st - K))
    return float(v[0])


def implied_vol(price, S, K, T, r, q, cp, american):
    f = (lambda s: crr_american(S, K, T, r, q, s, cp) - price) if american else \
        (lambda s: bs(S, K, T, r, q, s, cp) - price)
    lo, hi = 0.005, 4.0
    if f(lo) > 0 or f(hi) < 0:
        return None
    return brentq(f, lo, hi, xtol=1e-7)


# ---------------------------------------------------------------- calendars
NYSE_HOLIDAYS = {dt.date(2026, 12, 25), dt.date(2027, 1, 1), dt.date(2027, 1, 18), dt.date(2027, 2, 15),
                 dt.date(2027, 3, 26), dt.date(2027, 5, 31)}
ICE_HOLIDAYS = {dt.date(2026, 12, 25), dt.date(2027, 1, 1), dt.date(2027, 3, 26)}


def trading_days(first, last, holidays):
    out, d = [], first
    while d <= last:
        if d.weekday() < 5 and d not in holidays:
            out.append(d)
        d += dt.timedelta(days=1)
    return out


def n_closes(last):
    return len(trading_days(QUOTE_DATE + dt.timedelta(days=1), last, NYSE_HOLIDAYS))


# ---------------------------------------------------------------- data
def load_chain(sym):
    return json.load(open(os.path.join(RAW, f"opc_{sym}_options.json")))["options"]


def load_close(sym):
    return float(json.load(open(os.path.join(RAW, f"opc_{sym}_price.json")))["price"]["close"])


CHAINS = {s: load_chain(s) for s in ("NVDA", "KRE", "SPY", "IEF", "BNO", "FXY")}
CLOSE = {s: load_close(s) for s in ("NVDA", "KRE", "SPY", "IEF", "BNO", "FXY", "SPX")}
FACTS = json.load(open(os.path.join(RAW, "source_facts.json")))
TV = {r["s"]: r["d"] for r in json.load(open(os.path.join(RAW, "tv_scan_2026-11-27.json")))["data"]}
TV.update({r["s"]: r["d"] for r in json.load(open(os.path.join(RAW, "tv_scan_2026-11-27_b.json")))["data"]})

# the option feed's close must agree with the second source for the same session
for _s, _t in (("NVDA", "NASDAQ:NVDA"), ("KRE", "AMEX:KRE"), ("IEF", "NASDAQ:IEF"), ("BNO", "AMEX:BNO"),
               ("FXY", "AMEX:FXY"), ("SPX", "SP:SPX")):
    assert abs(CLOSE[_s] - TV[_t][0]) < 0.02, (_s, CLOSE[_s], TV[_t][0])

TSY_ROWS = list(csv.DictReader(open(os.path.join(RAW, "treasury_par_yields_2026.csv"))))
TSY_ROW = next(r for r in TSY_ROWS if r["Date"] == QUOTE_DATE.strftime("%m/%d/%Y"))
_TENOR = {"1 Mo": 30, "1.5 Month": 45, "2 Mo": 60, "3 Mo": 91, "4 Mo": 122, "6 Mo": 182, "1 Yr": 365, "2 Yr": 730}
TSY_PTS = sorted((d, float(TSY_ROW[k]) / 100.0) for k, d in _TENOR.items())
TEN_YEAR = float(TSY_ROW["10 Yr"])


def rate(T):
    """Treasury par yield at the horizon (straight line between tenors), turned into a continuous rate."""
    dd = T * 365.0
    pts = TSY_PTS
    if dd <= pts[0][0]:
        y = pts[0][1]
    elif dd >= pts[-1][0]:
        y = pts[-1][1]
    else:
        for (d0, y0), (d1, y1) in zip(pts, pts[1:]):
            if d0 <= dd <= d1:
                y = y0 + (y1 - y0) * (dd - d0) / (d1 - d0)
                break
    return math.log(1.0 + y * T) / T if T <= 1 else 2.0 * math.log(1.0 + y / 2.0)


def quote(sym, exp, cp, K):
    """One option row with its liquidity screen."""
    row = CHAINS[sym][exp][cp].get(f"{K:.2f}")
    if row is None:
        return None
    b, a = float(row["b"]), float(row["a"])
    mid = (b + a) / 2.0
    why = []
    if b <= 0:
        why.append("no bid")
    if row["oi"] < OI_MIN:
        why.append(f"open interest {row['oi']}")
    if mid > 0 and (a - b) > SPREAD_MAX * mid:
        why.append(f"spread {100 * (a - b) / mid:.0f}% of mid")
    return {"symbol": sym, "expiry": exp, "type": "put" if cp == "p" else "call", "strike": K, "bid": b, "ask": a,
            "mid": mid, "last": row["l"], "open_interest": row["oi"], "volume": row["v"],
            "ok": not why, "why": ", ".join(why)}


def use(q):
    if q and not any(u["symbol"] == q["symbol"] and u["expiry"] == q["expiry"] and u["type"] == q["type"]
                     and u["strike"] == q["strike"] for u in USED_ROWS):
        USED_ROWS.append(q)
    return q


def strikes(sym, exp, cp):
    return sorted(float(k) for k in CHAINS[sym][exp][cp])


def parity_q(sym, exp, S, T, r):
    """Carry (dividend) yield from put-call parity at the strike nearest spot, corrected once for the
    American put's early exercise value: F = K + (C - P + eep) * exp(rT), q = r - ln(F/S)/T."""
    for tol in (0.25, 0.5):
        for K in sorted(strikes(sym, exp, "c"), key=lambda k: abs(k - S)):
            c, p = quote(sym, exp, "c", K), quote(sym, exp, "p", K)
            if not c or not p or c["bid"] <= 0 or p["bid"] <= 0:
                continue
            if (c["ask"] - c["bid"]) > tol * c["mid"] or (p["ask"] - p["bid"]) > tol * p["mid"]:
                continue
            f0 = K + (c["mid"] - p["mid"]) * math.exp(r * T)
            q0 = r - math.log(f0 / S) / T
            ivp = implied_vol(p["mid"], S, K, T, r, q0, "p", True)
            eep = crr_american(S, K, T, r, q0, ivp, "p") - bs(S, K, T, r, q0, ivp, "p") if ivp else 0.0
            f1 = K + (c["mid"] - p["mid"] + eep) * math.exp(r * T)
            use(c), use(p)
            return {"q": r - math.log(f1 / S) / T, "K": K, "F": f1, "eep": eep, "call_mid": c["mid"], "put_mid": p["mid"]}
    return None


def iv_at(sym, exp, cp, H, S, T, r, q):
    """STRIKE VOL at level H: the listed strikes on each side of H, straight line in strike.
    Returns mid, bid and ask vols and whether every row used passes the liquidity screen."""
    american = cp == "p"
    ks = strikes(sym, exp, cp)
    below = [k for k in ks if k <= H + 1e-9]
    above = [k for k in ks if k >= H - 1e-9]
    if not below or not above:
        return None
    k1, k2 = below[-1], above[0]
    rows = [use(quote(sym, exp, cp, k)) for k in sorted({k1, k2})]
    out = {"rows": rows, "ok": all(x["ok"] for x in rows), "why": "; ".join(
        f"{x['strike']:g} {x['type']}: {x['why']}" for x in rows if not x["ok"])}
    for side in ("mid", "bid", "ask"):
        vols = [implied_vol(x[side], S, x["strike"], T, r, q, cp, american) if x[side] > 0 else None for x in rows]
        for x, v in zip(rows, vols):
            x[f"iv_{side}"] = v
        if any(v is None for v in vols):
            out[side] = None
        elif len(rows) == 1:
            out[side] = vols[0]
        else:
            out[side] = vols[0] + (vols[1] - vols[0]) * (H - k1) / (k2 - k1)
    return out


def spread_vol(sym, exp, cp, H, S, T, r, q, max_width=0.12, side="mid"):
    """SPREAD VOL at level H. For each pair of neighbouring strikes that pass the screen near H:
       market finish odds at the pair's midpoint = spread price / width, where each leg is first turned into
       its European value (early exercise value removed with the leg's own implied vol), grossed up for interest;
       then the vol s* that makes the lognormal finish odds equal that number at the midpoint.
    s* is then joined by a straight line between the two midpoints around H (or taken from the nearest one)."""
    american = cp == "p"
    ks = [k for k in strikes(sym, exp, cp) if abs(k / H - 1.0) <= 0.2]
    rows = {k: quote(sym, exp, cp, k) for k in ks}
    ok = [k for k in ks if rows[k]["ok"]]
    pts = []
    for a, b in zip(ok, ok[1:]):
        if (b - a) > max_width * H:
            continue
        eu = []
        for k in (a, b):
            iv = implied_vol(rows[k][side], S, k, T, r, q, cp, american)
            if iv is None:
                break
            eu.append(bs(S, k, T, r, q, iv, cp))
        if len(eu) < 2:
            continue
        km = 0.5 * (a + b)
        dgt = ((eu[1] - eu[0]) if cp == "p" else (eu[0] - eu[1])) / (b - a) * math.exp(r * T)
        if not 0.002 < dgt < 0.998:
            continue
        m = r - q
        if cp == "p":
            f = lambda s: finish_below(S, km, T, m, s) - dgt
            lo, hi = 0.005, 4.0
        else:
            f = lambda s: finish_above(S, km, T, m, s) - dgt
            lo = 0.005
            a_ = math.log(km / (S * math.exp(m * T)))
            hi = math.sqrt(2.0 * a_ / T) if a_ > 0 else 4.0   # finish-above odds peak here for a strike over the forward
        if f(lo) * f(hi) > 0:
            continue
        pts.append({"a": a, "b": b, "mid": km, "digital": dgt, "vol": brentq(f, lo, hi, xtol=1e-7)})
    if not pts:
        return None
    lower = [p for p in pts if p["mid"] <= H + 1e-9]
    upper = [p for p in pts if p["mid"] >= H - 1e-9]
    if lower and upper:
        p1, p2 = lower[-1], upper[0]
        if p1 is p2:
            vol, dg, used, how = p1["vol"], p1["digital"], [p1], "one spread centred on the level"
        else:
            w = (H - p1["mid"]) / (p2["mid"] - p1["mid"])
            vol = p1["vol"] + (p2["vol"] - p1["vol"]) * w
            dg = p1["digital"] + (p2["digital"] - p1["digital"]) * w
            used, how = [p1, p2], "two spreads either side of the level, joined by a straight line"
    else:
        p1 = min(pts, key=lambda p: abs(p["mid"] - H))
        vol, dg, used = p1["vol"], None, [p1]
        how = f"nearest spread only, centred at {p1['mid']:g}; the level is outside it"
    if side == "mid":
        for p in used:
            use(rows[p["a"]]), use(rows[p["b"]])
    return {"vol": vol, "digital_at_level": dg, "used": used, "how": how}


def spread_vol_band(sym, exp, cp, H, S, T, r, q):
    """The same spread vol with every leg at its bid, and with every leg at its ask."""
    out = []
    for side in ("bid", "ask"):
        try:
            sv = spread_vol(sym, exp, cp, H, S, T, r, q, side=side)
        except ValueError:
            sv = None
        out.append(sv["vol"] if sv else None)
    return out


def interp_var(T1, s1, T2, s2, T):
    w = s1 * s1 * T1 + (s2 * s2 * T2 - s1 * s1 * T1) * (T - T1) / (T2 - T1)
    return math.sqrt(w / T)


def pct(x):
    return f"{100 * x:.1f}%"


def p0(x):
    return f"{100 * x:.0f}%"


def row_text(x):
    iv = f", implied vol {100 * x['iv_mid']:.1f}% (bid {100 * x['iv_bid']:.1f}%, ask {100 * x['iv_ask']:.1f}%)" \
        if x.get("iv_mid") and x.get("iv_bid") and x.get("iv_ask") else \
        (f", implied vol {100 * x['iv_mid']:.1f}%" if x.get("iv_mid") else "")
    flag = "" if x["ok"] else f"  [FAILS SCREEN: {x['why']}]"
    return (f"    {x['symbol']} {x['expiry']} {x['strike']:g} {x['type']}: bid {x['bid']:g}, ask {x['ask']:g}, "
            f"mid {x['mid']:.3f}, last {x['last']:g}, open interest {x['open_interest']}, volume {x['volume']}{iv}{flag}")


GRAPH_NODES = {n["id"]: n for n in json.load(open(GRAPH))["nodes"]}


def ours(eid):
    return float(GRAPH_NODES[eid]["odds_now"])


RESULTS = {}
NOTES = []


def block(title):
    NOTES.extend(["", "=" * 100, title, "=" * 100])


def note(s=""):
    NOTES.append(s)


def test_lines(eid):
    n = GRAPH_NODES[eid]
    note(f"  Label: {n['label']}")
    note(f"  Test (exact): {n['settlement_test']}")
    note(f"  Our odds_now: {n['odds_now']}%   window_end: {n['window_end']}   status: {n['status']}")


def spread_lines(sv, what):
    for p in sv["used"]:
        note(f"    {what} spread {p['a']:g}/{p['b']:g}: market finish odds beyond {p['mid']:g} = {pct(p['digital'])}; "
             f"vol that reprices it {pct(p['vol'])}")


# ---------------------------------------------------------------- generic down-touch on a stock or fund
def down_event(eid, sym, level, deadline, last_day, exps, S, q_fixed=None, q_label=None, level_text=None,
               drift_override=None, drift_label=None, extra_lines=()):
    """exps: expiries around the deadline. Both are used when both pass the screen (total variance interpolated),
    else the one that passes, with its vol held flat to the deadline."""
    Td = yrs(last_day)
    nd = n_closes(last_day)
    rd = rate(Td)
    legs = []
    for e in exps:
        T = yrs(d_(e))
        r = rate(T)
        pq = parity_q(sym, e, S, T, r) if q_fixed is None else None
        q = pq["q"] if pq else q_fixed
        iv = iv_at(sym, e, "p", level, S, T, r, q)
        sv = spread_vol(sym, e, "p", level, S, T, r, q) if iv and iv["ok"] else None
        band = spread_vol_band(sym, e, "p", level, S, T, r, q) if sv else [None, None]
        legs.append({"exp": e, "T": T, "r": r, "q": q, "pq": pq, "iv": iv, "sv": sv, "band": band})
    block(f"{eid}  ({sym} options)")
    test_lines(eid)
    for ln in extra_lines:
        note(ln)
    note(f"  Underlying: {sym} close {S:g} on {AS_OF}. Level: {level_text or f'{level:g}'}. Deadline {deadline} "
         f"(last close in the window {last_day}: {days(last_day)} calendar days, {nd} closes).")
    for g in legs:
        note(f"  Expiry {g['exp']} ({days(d_(g['exp']))} days): Treasury rate {pct(g['r'])}, carry yield "
             f"{pct(g['q'])}" + (f" (put-call parity at strike {g['pq']['K']:g}: call {g['pq']['call_mid']:.3f}, put "
                                 f"{g['pq']['put_mid']:.3f}, early exercise value {g['pq']['eep']:.3f})" if g["pq"]
                                 else f" ({q_label})"))
        for x in g["iv"]["rows"]:
            note(row_text(x))
        note(f"    strike vol at the level: {pct(g['iv']['mid']) if g['iv']['mid'] else 'none'}"
             + ("" if g["iv"]["ok"] else f"   REFUSED: {g['iv']['why']}"))
        if g["sv"]:
            spread_lines(g["sv"], "put")
            note(f"    spread vol at the level: {pct(g['sv']['vol'])} ({g['sv']['how']})")
    good = [g for g in legs if g["iv"] and g["iv"]["ok"] and g["iv"]["mid"] and g["sv"]]
    if not good:
        note("  RESULT: no expiry passes the liquidity screen. No row.")
        RESULTS[eid] = {"emit": False, "reject": "options too thin at the needed strikes"}
        return None
    if len(good) == 2 and good[0]["T"] <= Td <= good[1]["T"]:
        a, b = good
        s_k = interp_var(a["T"], a["iv"]["mid"], b["T"], b["iv"]["mid"], Td)
        s_kb = interp_var(a["T"], a["iv"]["bid"], b["T"], b["iv"]["bid"], Td)
        s_ka = interp_var(a["T"], a["iv"]["ask"], b["T"], b["iv"]["ask"], Td)
        s_s = interp_var(a["T"], a["sv"]["vol"], b["T"], b["sv"]["vol"], Td)
        s_band = [interp_var(a["T"], a["band"][i], b["T"], b["band"][i], Td)
                  if a["band"][i] and b["band"][i] else None for i in (0, 1)]
        q = a["q"] + (b["q"] - a["q"]) * (Td - a["T"]) / (b["T"] - a["T"])
        how = (f"total variance interpolated between the {a['exp']} and {b['exp']} expiries "
               f"({days(d_(a['exp']))} and {days(d_(b['exp']))} days)")
        expiry_used, gap = f"{a['exp']} and {b['exp']}", "deadline sits between the two expiries"
    else:
        g = min(good, key=lambda z: abs(z["T"] - Td))
        s_k, s_kb, s_ka, s_s, q = g["iv"]["mid"], g["iv"]["bid"], g["iv"]["ask"], g["sv"]["vol"], g["q"]
        s_band = g["band"]
        gapd = days(last_day) - days(d_(g["exp"]))
        how = (f"vol of the {g['exp']} expiry held flat to the deadline (expiry is {abs(gapd)} days "
               f"{'before' if gapd > 0 else 'after'} it; the other expiry failed the screen)")
        expiry_used, gap = g["exp"], f"expiry {abs(gapd)} days {'before' if gapd > 0 else 'after'} the deadline"
    m = (rd - q) if drift_override is None else drift_override
    plain = touch_down(S, level, Td, m, s_k)                 # the plain formula: strike vol, watched all day
    plain_lo, plain_hi = touch_down(S, level, Td, m, s_kb), touch_down(S, level, Td, m, s_ka)
    plain_closes = touch_down_closes(S, level, Td, m, s_k, nd)
    plain_fin = finish_below(S, level, Td, m, s_k)
    stored = touch_down_closes(S, level, Td, m, s_s, nd)    # stored: spread vol, closes only
    stored_allday = touch_down(S, level, Td, m, s_s)
    fin = finish_below(S, level, Td, m, s_s)
    sim = mc_down(S, level, Td, m, s_s, nd)
    band = sorted(touch_down_closes(S, level, Td, m, v, nd) for v in s_band if v)
    note(f"  Expiry handling: {how}.")
    note(f"  Drift: {pct(m)} a year = " + (drift_label or f"Treasury rate {pct(rd)} minus carry yield {pct(q)}") + ".")
    note(f"  A. PLAIN FORMULA (strike vol {pct(s_k)}, watched all day): touch {pct(plain)}; finish by N(d2) {pct(plain_fin)}")
    note(f"       bid-side vol {pct(s_kb)}: {pct(plain_lo)}; ask-side vol {pct(s_ka)}: {pct(plain_hi)}; closes only: {pct(plain_closes)}")
    note(f"  B. SPREAD VOL {pct(s_s)} (reprices the market's finish odds): touch watched all day {pct(stored_allday)}; "
         f"FINISH on the deadline day {pct(fin)}")
    note(f"     STORED: TOUCH, closes only, spread vol: {pct(stored)}   (simulation check, {nd} daily closes, {PATHS:,} paths: {pct(sim)})")
    if len(band) == 2:
        note(f"       quote band (every leg at its bid, then every leg at its ask): {pct(band[0])} to {pct(band[1])}")
    o = ours(eid)
    note(f"  Ours {o:g}%  vs  market touch {pct(stored)}  -> gap (market minus ours) {100 * stored - o:+.1f} points "
         f"(plain formula {pct(plain)}: {100 * plain - o:+.1f})")
    RESULTS[eid] = {"emit": True, "sym": sym, "touch": stored, "touch_allday": stored_allday, "finish": fin,
                    "sim": sim, "plain": plain, "plain_closes": plain_closes, "plain_finish": plain_fin,
                    "plain_lo": plain_lo, "plain_hi": plain_hi, "iv": s_k, "iv_bid": s_kb, "iv_ask": s_ka,
                    "spread_vol": s_s, "T_days": days(last_day), "closes": nd, "expiry_used": expiry_used, "gap": gap,
                    "how": how, "drift": m, "r": rd, "q": q, "S": S, "level": level, "ours": o,
                    "band": band, "good": [g["exp"] for g in good]}
    return RESULTS[eid]


# ================================================================ F5  Nvidia closes under $120 by Mar 31, 2027
down_event("F5", "NVDA", 120.0, "2027-03-31", dt.date(2027, 3, 31), ["2027-03-19", "2027-04-16"], CLOSE["NVDA"])

# ================================================================ B3  KRE closes under $60 by Mar 31, 2027
q_kre = FACTS["KRE_fund_distribution_yield_pct"]["value"] / 100.0
_T19 = yrs(d_("2027-03-19"))
_k55, _k60, _k65 = (quote("KRE", "2027-03-19", "p", k) for k in (55.0, 60.0, 65.0))
_lo = (_k60["mid"] - _k55["last"]) / 5.0 * math.exp(rate(_T19) * _T19)
_hi = (_k65["mid"] - _k60["mid"]) / 5.0 * math.exp(rate(_T19) * _T19)
r_b3 = down_event("B3", "KRE", 60.0, "2027-03-31", dt.date(2027, 3, 31), ["2027-03-19", "2027-03-31"], CLOSE["KRE"],
                  q_fixed=q_kre, q_label=f"State Street fund distribution yield {pct(q_kre)}, "
                  f"as of {FACTS['KRE_fund_distribution_yield_pct']['as_of']}; at-the-money KRE quotes are too wide for parity",
                  extra_lines=("  Weakest row. The 60 put is quoted 0.87 bid, 1.31 ask (spread 40% of mid, inside the screen but wide);",
                               "  the 55 put has no real bid, so the only usable spread is 60/65, which sits above the level.",
                               f"  Cross-check with a stale price: the 55 put last traded at {_k55['last']:g} (bid {_k55['bid']:g}, ask {_k55['ask']:g}, open "
                               f"interest {_k55['open_interest']}). Against the 60 put mid, that 55/60 spread says {pct(_lo)} for finishing under 57.5;",
                               f"  the 60/65 spread says {pct(_hi)} for finishing under 62.5. Halfway between is {pct((_lo + _hi) / 2)} for finishing under 60, "
                               "close to the finish odds the spread vol gives below."))

# ================================================================ F9  S&P 500 closes at or under 6,255.14 by May 31, 2027
ratio = CLOSE["SPX"] / CLOSE["SPY"]
spy_level = 6255.14 / ratio
spx_blank = all(float(v["b"]) == 0 and float(v["a"]) == 0 for v in
                json.load(open(os.path.join(RAW, "opc_SPX_options.json")))["options"]["2027-05-21"]["p"].values())
down_event("F9", "SPY", spy_level, "2027-05-31", dt.date(2027, 5, 28), ["2027-04-30", "2027-06-17"], CLOSE["SPY"],
           level_text=f"SPY {spy_level:.2f}, which is S&P 500 6,255.14 at the Nov 27 closing ratio "
           f"{ratio:.4f} (SPX {CLOSE['SPX']:g} / SPY {CLOSE['SPY']:g})",
           extra_lines=(f"  SPX options in this feed show bid 0 and ask 0 on every 2027-05-21 put (checked: {spx_blank}). "
                        "SPY options, on the fund that tracks the same index, are used instead.",
                        "  May 31, 2027 is Memorial Day, so the last close in the window is Friday May 28, 2027.",
                        "  The test level rises if the index sets a new record first; that is ignored here "
                        "(the index is 6.7% under its 7,818.93 record)."))

# ================================================================ D4  10-year Treasury closes above 5.50% by May 31, 2027
D = FACTS["IEF_effective_duration_years"]["value"]
CX = FACTS["IEF_convexity"]["value"] * 100.0
YTM = FACTS["IEF_average_yield_to_maturity_pct"]["value"] / 100.0
# how much the fund's 7 to 10 year sector moves per point of the 10-year: daily changes over 2026, Treasury curve
_r = TSY_ROWS[::-1]
_w7 = (10.0 - 8.27) / 3.0     # 8.27 years is the fund's weighted average maturity (iShares page)
_y10 = np.array([float(x["10 Yr"]) for x in _r])
_yb = np.array([_w7 * float(x["7 Yr"]) + (1 - _w7) * float(x["10 Yr"]) for x in _r])
BETA = float(np.polyfit(np.diff(_y10), np.diff(_yb), 1)[0])
dy10 = (5.50 - TEN_YEAR) / 100.0
dy = BETA * dy10
ief_level = CLOSE["IEF"] * (1.0 - D * dy + 0.5 * CX * dy * dy)
Td4 = yrs(dt.date(2027, 5, 28))
drift_d4 = rate(Td4) - YTM
r_d4 = down_event("D4", "IEF", ief_level, "2027-05-31", dt.date(2027, 5, 28), ["2027-04-16", "2027-06-17"], CLOSE["IEF"],
                  level_text=f"IEF {ief_level:.2f}, the fund price that matches a 10-year yield of 5.50%",
                  drift_override=drift_d4,
                  drift_label=f"Treasury rate {pct(rate(Td4))} minus the fund's average yield to maturity {pct(YTM)} "
                  "(carry: the fund earns its yield, so the price path with yields unchanged is the reference line; "
                  "the same as saying forward yields sit a little above today's)",
                  extra_lines=(
                      f"  Yield to price conversion: 10-year par yield {TEN_YEAR:.2f}% on {AS_OF} (Treasury daily par yield "
                      f"curve), so 5.50% is {100 * dy10:.2f} points higher.",
                      f"  IEF (iShares 7-10 Year Treasury Bond ETF): effective duration {D:g} years, convexity {CX:g}, average "
                      f"maturity 8.27 years (iShares page, {FACTS['IEF_effective_duration_years']['as_of']}).",
                      f"  The 8.27-year point of the Treasury curve has moved {BETA:.3f} points per point of the 10-year "
                      f"(daily changes, all of 2026), so the fund's yield rises about {100 * dy:.3f} points.",
                      f"  Price change = -D*dy + 0.5*C*dy^2 = {100 * (-D * dy + 0.5 * CX * dy * dy):.2f}%, so IEF "
                      f"{CLOSE['IEF']:g} -> {ief_level:.2f}.",
                      "  Cboe TNX options and CME 10-year note options could not be reached (see routes), so IEF options stand in.",
                      "  May 31, 2027 is a holiday; the last Treasury yield in the window is May 28, 2027."))
if r_d4:
    lvl2 = FACTS["IEF_52wk_low_nav"]["value"] * (1.0 - D * BETA * (5.50 - 5.31) / 100.0)
    p2 = touch_down_closes(CLOSE["IEF"], lvl2, Td4, drift_d4, r_d4["spread_vol"], r_d4["closes"])
    NOTES.insert(len(NOTES) - 1, f"  Conversion check: the 10-year peaked at 5.31% on Oct 5, 2026 and IEF's 52-week low is "
                 f"{FACTS['IEF_52wk_low_nav']['value']:g}; from that anchor 5.50% is IEF {lvl2:.2f} and the stored odds would be "
                 f"{pct(p2)}. The conversion is worth about that many points.")
    r_d4["alt_touch"] = p2
    if len(r_d4["good"]) == 1:
        T1, T2 = yrs(d_("2027-04-16")), yrs(d_("2027-06-17"))
        pq2 = parity_q("IEF", "2027-06-17", CLOSE["IEF"], T2, rate(T2))
        iv2 = iv_at("IEF", "2027-06-17", "p", ief_level, CLOSE["IEF"], T2, rate(T2), pq2["q"])
        if iv2 and iv2["mid"]:
            s2 = interp_var(T1, r_d4["iv"], T2, iv2["mid"], Td4)
            NOTES.insert(len(NOTES) - 1, f"  Expiry check: interpolating total variance with the refused 2027-06-17 quotes anyway "
                         f"(strike vol {pct(iv2['mid'])} there) gives strike vol {pct(s2)} and a plain-formula touch of "
                         f"{pct(touch_down(CLOSE['IEF'], ief_level, Td4, drift_d4, s2))} against {pct(r_d4['plain'])}.")

# ================================================================ O1, O2  front-month Brent settles above $100 / $110 by May 31, 2027
CONTRACTS = []
for code, label in (("F2027", "Jan 2027"), ("G2027", "Feb 2027"), ("H2027", "Mar 2027"), ("J2027", "Apr 2027"),
                    ("K2027", "May 2027"), ("M2027", "Jun 2027"), ("N2027", "Jul 2027"), ("Q2027", "Aug 2027"),
                    ("U2027", "Sep 2027"), ("V2027", "Oct 2027"), ("X2027", "Nov 2027"), ("Z2027", "Dec 2027"),
                    ("F2028", "Jan 2028"), ("G2028", "Feb 2028"), ("H2028", "Mar 2028"), ("J2028", "Apr 2028")):
    d = TV["ICEEUR:BRN" + code]
    CONTRACTS.append({"label": label, "price": float(d[0]), "expiry": dt.datetime.strptime(str(d[4]), "%Y%m%d").date()})


def front(day):
    return next(c for c in CONTRACTS if c["expiry"] >= day)


BRENT_DEADLINE = dt.date(2027, 5, 31)
BRENT_DAYS = trading_days(dt.date(2026, 11, 30), BRENT_DEADLINE, ICE_HOLIDAYS)
S_BNO = CLOSE["BNO"]
T_APR, T_JUL = yrs(d_("2027-04-16")), yrs(d_("2027-07-16"))
PQ_APR = parity_q("BNO", "2027-04-16", S_BNO, T_APR, rate(T_APR))
PQ_JUL = parity_q("BNO", "2027-07-16", S_BNO, T_JUL, rate(T_JUL))
# straight-line fit of ln(front-month futures price) against time, over the days from Dec 1 on
_t = np.array([yrs(d) for d in BRENT_DAYS[1:]])
_y = np.log(np.array([front(d)["price"] for d in BRENT_DAYS[1:]]))
MU_BRENT, A_BRENT = (float(v) for v in np.polyfit(_t, _y, 1))
S0_BRENT = math.exp(A_BRENT)


def brent_sim(level, s):
    """Rolling front month, daily settles: every contract moves by one common lognormal factor (parallel moves
    along the curve); the front contract on each day comes from the ICE expiry dates; equal variance per
    trading day, total variance s*s*T to the deadline."""
    rng = np.random.default_rng(SEED)
    Td = yrs(BRENT_DEADLINE)
    h = Td / len(BRENT_DAYS)
    x = np.zeros(PATHS)
    hit = np.zeros(PATHS, dtype=bool)
    first = None
    for d in BRENT_DAYS:
        z = rng.standard_normal(PATHS // 2)
        x += -0.5 * s * s * h + s * math.sqrt(h) * np.concatenate([z, -z])
        hit |= (front(d)["price"] * np.exp(x) > level)
        if first is None:
            first = float(hit.mean())
    fin = float((front(BRENT_DAYS[-1])["price"] * np.exp(x) > level).mean())
    return float(hit.mean()), first, fin


def brent_event(eid, level):
    block(f"{eid}  (BNO options for the vol, ICE Brent futures curve for the drift)")
    test_lines(eid)
    note(f"  ICE Brent futures, delayed close {AS_OF} (TradingView scanner, 10 minute delayed):")
    note("    " + "; ".join(f"{c['label']} {c['price']:g} (expires {c['expiry']})" for c in CONTRACTS[:9]))
    note(f"  Front month on Nov 30 is still {CONTRACTS[0]['label']} at {CONTRACTS[0]['price']:g} (its last day); from Dec 1 it is "
         f"{CONTRACTS[1]['label']} at {CONTRACTS[1]['price']:g}; on the deadline it is {front(BRENT_DEADLINE)['label']} at "
         f"{front(BRENT_DEADLINE)['price']:g}. The curve slopes down, so the front-month price is expected to fall as contracts roll.")
    note(f"  Drift for the formula: straight-line fit of ln(front-month futures price) on time, Dec 1 to May 31: start "
         f"{S0_BRENT:.2f}, drift {pct(MU_BRENT)} a year. (Under the risk-neutral measure a futures price has no drift, so "
         "the expected path of the front month is today's curve.)")
    note(f"  Vol source: BNO (United States Brent Oil Fund, holds near-month ICE Brent futures), close {S_BNO:g}. "
         f"BNO forward by put-call parity at strike {PQ_APR['K']:g}: {PQ_APR['F']:.2f} for 2027-04-16 "
         f"(Treasury rate {pct(rate(T_APR))}, carry yield {pct(PQ_APR['q'])}).")
    g_apr, g_jul = front(d_("2027-04-16"))["price"], front(d_("2027-07-16"))["price"]
    k_apr = PQ_APR["F"] * level / g_apr
    k_jul = PQ_JUL["F"] * level / g_jul
    note(f"  Strike match: front-month Brent at {level:g} on 2027-04-16 means BNO at forward * {level:g} / "
         f"{g_apr:g} ({front(d_('2027-04-16'))['label']} futures today) = {k_apr:.2f}.")
    r_a, q_a = rate(T_APR), PQ_APR["q"]
    iv_a = iv_at("BNO", "2027-04-16", "c", k_apr, S_BNO, T_APR, r_a, q_a)
    for x in iv_a["rows"]:
        note(row_text(x))
    note(f"    strike vol at BNO {k_apr:.2f}: {pct(iv_a['mid'])}" + ("" if iv_a["ok"] else f"   REFUSED: {iv_a['why']}"))
    iv_j = iv_at("BNO", "2027-07-16", "c", k_jul, S_BNO, T_JUL, rate(T_JUL), PQ_JUL["q"])
    note(f"  Second expiry 2027-07-16 (BNO strike match {k_jul:.2f}):")
    for x in iv_j["rows"]:
        note(row_text(x))
    note(f"    strike vol there: {pct(iv_j['mid'])}" + ("" if iv_j["ok"] else f"   REFUSED: {iv_j['why']}"))
    if not iv_a["ok"]:
        note("  RESULT: the April strikes fail the screen. No row.")
        RESULTS[eid] = {"emit": False, "reject": "BNO options too thin at the needed strikes"}
        return
    sv = spread_vol("BNO", "2027-04-16", "c", k_apr, S_BNO, T_APR, r_a, q_a)
    spread_lines(sv, "BNO 2027-04-16 call")
    for p in sv["used"]:
        note(f"      (BNO {p['mid']:g} on Apr 16 is front-month Brent near {p['mid'] * g_apr / PQ_APR['F']:.1f})")
    note(f"    spread vol at BNO {k_apr:.2f}: {pct(sv['vol'])} ({sv['how']})")
    Td = yrs(BRENT_DEADLINE)
    nd = len(BRENT_DAYS)
    gapd = days(BRENT_DEADLINE) - days(d_("2027-04-16"))
    how = (f"vol of the 2027-04-16 expiry held flat to the deadline (expiry is {gapd} days before it; "
           "the 2027-07-16 strikes have almost no open interest)")
    s_k, s_kb, s_ka, s_s = iv_a["mid"], iv_a["bid"], iv_a["ask"], sv["vol"]
    plain = touch_up(S0_BRENT, level, Td, MU_BRENT, s_k)
    plain_lo, plain_hi = touch_up(S0_BRENT, level, Td, MU_BRENT, s_kb), touch_up(S0_BRENT, level, Td, MU_BRENT, s_ka)
    plain_closes = touch_up_closes(S0_BRENT, level, Td, MU_BRENT, s_k, nd)
    fwd_T = front(BRENT_DEADLINE)["price"]
    plain_fin = finish_above(fwd_T, level, Td, 0.0, s_k)
    form_s = touch_up_closes(S0_BRENT, level, Td, MU_BRENT, s_s, nd)
    fin = finish_above(fwd_T, level, Td, 0.0, s_s)
    sim, sim_first, sim_fin = brent_sim(level, s_s)
    sim_k, _, _ = brent_sim(level, s_k)
    band = sorted(brent_sim(level, v)[0] for v in spread_vol_band("BNO", "2027-04-16", "c", k_apr, S_BNO, T_APR, r_a, q_a) if v)
    note(f"  Expiry handling: {how}.")
    note(f"  A. PLAIN FORMULA (strike vol {pct(s_k)}, watched all day, start {S0_BRENT:.2f}, curve drift): touch {pct(plain)}; "
         f"finish by N(d2) on the {front(BRENT_DEADLINE)['label']} price {fwd_T:g}: {pct(plain_fin)}")
    note(f"       bid-side vol {pct(s_kb)}: {pct(plain_lo)}; ask-side vol {pct(s_ka)}: {pct(plain_hi)}; settles only: {pct(plain_closes)}")
    note(f"  B. SPREAD VOL {pct(s_s)}: formula, settles only {pct(form_s)}; FINISH above {level:g} on May 31: {pct(fin)}")
    note(f"     STORED: TOUCH by rolling-contract simulation, daily settles, exact ICE expiry dates, spread vol, "
         f"{PATHS:,} paths, fixed seed: {pct(sim)}")
    note(f"       (inside that: the expiring {CONTRACTS[0]['label']} contract settling above {level:g} on Nov 30 alone "
         f"{pct(sim_first)}; simulated finish on May 31 {pct(sim_fin)}; same simulation with the strike vol {pct(sim_k)})")
    if len(band) == 2:
        note(f"       quote band (every leg at its bid, then every leg at its ask): {pct(band[0])} to {pct(band[1])}")
    note("     The simulation is stored because the front month is not one asset: it steps down at each roll, and the")
    note("     formula can only take a smooth drift and cannot see the Jan contract's last day.")
    if iv_j["mid"]:
        s2 = interp_var(T_APR, iv_a["mid"], T_JUL, iv_j["mid"], Td)
        note(f"  Expiry check: interpolating total variance with the refused 2027-07-16 quotes anyway gives strike vol {pct(s2)} "
             f"and a plain-formula touch of {pct(touch_up(S0_BRENT, level, Td, MU_BRENT, s2))} against {pct(plain)}.")
    note("  Model limits here: BNO is a fund proxy for Brent futures options; all contracts are assumed to move together,")
    note("  and far contracts usually move less than the front, so odds late in the window run a little high.")
    o = ours(eid)
    note(f"  Ours {o:g}%  vs  market touch {pct(sim)}  -> gap (market minus ours) {100 * sim - o:+.1f} points "
         f"(plain formula {pct(plain)}: {100 * plain - o:+.1f})")
    RESULTS[eid] = {"emit": True, "sym": "BNO", "touch": sim, "finish": fin, "plain": plain, "plain_closes": plain_closes,
                    "plain_finish": plain_fin, "plain_lo": plain_lo, "plain_hi": plain_hi, "iv": s_k, "iv_bid": s_kb,
                    "iv_ask": s_ka, "spread_vol": s_s, "T_days": days(BRENT_DEADLINE), "closes": nd,
                    "expiry_used": "2027-04-16", "gap": f"expiry {gapd} days before the deadline", "how": how,
                    "drift": MU_BRENT, "S": S0_BRENT, "level": level, "ours": o, "sim_first": sim_first,
                    "sim_fin": sim_fin, "sim_strike_vol": sim_k, "formula_spread_vol_closes": form_s, "k_bno": k_apr,
                    "band": band,
                    "strikes": sorted({x["strike"] for x in iv_a["rows"]} | {p[k] for p in sv["used"] for k in ("a", "b")}),
                    "front_now": CONTRACTS[1]["price"], "front_deadline": fwd_T}


brent_event("O1", 100.0)
brent_event("O2", 110.0)

# ================================================================ notes-only guides
block("O7  (NOTES ONLY, no row)  Brent monthly average under $75, Dec 2026 to Nov 2027")
test_lines("O7")
note("  Vanilla options do not price this one to one. The test is on a calendar-month AVERAGE of the EIA Brent spot")
note("  price in any of twelve months. A listed option pays on one closing price on one day. An average moves less")
note("  than a daily close, twelve overlapping months are not twelve separate bets, and the spot price is not the")
note("  futures price. A fair price needs an average-price (Asian) option model and a view on how the months move together.")
note("  Rough guide only: chance the front-month futures price FINISHES under $75 on each BNO expiry (N(d2), BNO put")
note("  strike vol at the matching strike, no drift on the futures price):")
for e in ("2027-04-16", "2027-07-16", "2028-01-21"):
    T = yrs(d_(e))
    pq = parity_q("BNO", e, S_BNO, T, rate(T))
    g = front(d_(e))
    k = pq["F"] * 75.0 / g["price"]
    iv = iv_at("BNO", e, "p", k, S_BNO, T, rate(T), pq["q"])
    if iv and iv["mid"]:
        p = finish_below(g["price"], 75.0, T, 0.0, iv["mid"])
        note(f"    {e}: front month then is {g['label']}, {g['price']:g} today; BNO strike match {k:.2f}; vol "
             f"{pct(iv['mid'])}; finish under 75: {pct(p)}" + ("" if iv["ok"] else f"   [thin: {iv['why']}]"))
        for x in iv["rows"]:
            note("  " + row_text(x))
note(f"  The futures curve itself is {CONTRACTS[11]['price']:g} for {CONTRACTS[11]['label']} and {CONTRACTS[12]['price']:g} for "
     f"{CONTRACTS[12]['label']}, so the market's central path already runs close to $75 by late 2027.")
note(f"  Our odds_now is {ours('O7'):g}%. The guide numbers say the market leans well above that, but they are not like for like, so no row is written.")
RESULTS["O7"] = {"emit": False, "reject": "monthly average, not priced by vanilla options"}

block("J1  (NOTES ONLY, no row)  dollar closes above 160 yen AND Tokyo reports 5 trillion yen of buying, by Mar 31, 2027")
test_lines("J1")
usdjpy = float(TV["FX_IDC:USDJPY"][0])
jp3m = float(TV["TVC:JP03MY"][0]) / 100.0
S_FXY = CLOSE["FXY"]
T_FX = yrs(d_("2027-03-19"))
Td_fx = yrs(dt.date(2027, 3, 31))
nd_fx = n_closes(dt.date(2027, 3, 31))
fxy_level = S_FXY * usdjpy / 160.0
pq_fx = parity_q("FXY", "2027-03-19", S_FXY, T_FX, rate(T_FX))
q_fx = pq_fx["q"] if pq_fx else 0.0
iv_fx = iv_at("FXY", "2027-03-19", "c", 57.0, S_FXY, T_FX, rate(T_FX), q_fx)
iv_fx_put = iv_at("FXY", "2027-03-19", "p", 57.0, S_FXY, T_FX, rate(T_FX), q_fx)
note(f"  Price leg only. USD/JPY {usdjpy:g} (delayed FX close for the Nov 27 session); Federal Reserve H.10 last print "
     f"158.76 for Nov 20 (FRED DEXJPUS). The 160 level is {100 * (160 / usdjpy - 1):.2f}% away.")
note(f"  FXY (Invesco CurrencyShares Japanese Yen Trust) close {S_FXY:g}; 160 yen matches FXY {fxy_level:.2f}, nearest strike 57.")
for x in iv_fx["rows"] + iv_fx_put["rows"]:
    note(row_text(x))
if iv_fx["mid"]:
    m_fx = jp3m - rate(Td_fx)
    p_fx = touch_up(usdjpy, 160.0, Td_fx, m_fx, iv_fx["mid"])
    p_fx_c = touch_up_closes(usdjpy, 160.0, Td_fx, m_fx, iv_fx["mid"], nd_fx)
    p_fx_fin = finish_above(usdjpy, 160.0, Td_fx, m_fx, iv_fx["mid"])
    note(f"  Vol {pct(iv_fx['mid'])} from the 2027-03-19 57 call (held flat 12 days to Mar 31; quote is wide, bid vol "
         f"{pct(iv_fx['bid'])}, ask vol {pct(iv_fx['ask'])}); drift {pct(m_fx)} a year = Japan 3-month yield {pct(jp3m)} "
         f"minus Treasury rate {pct(rate(Td_fx))}.")
    note(f"  Price leg TOUCH odds (dollar above 160 yen on any day by Mar 31): {pct(p_fx)} watched all day, {pct(p_fx_c)} closes "
         f"only.  FINISH above 160 on Mar 31: {pct(p_fx_fin)}.")
    note("  This is an UPPER BOUND for J1, not its odds. J1 also needs Japan's Ministry of Finance to report 5 trillion yen or more")
    note("  of intervention in the window, and no listed option prices that. With the dollar a quarter of a percent from 160, the")
    note(f"  price leg is close to certain and says almost nothing about the event. Our odds_now is {ours('J1'):g}%. No row is written.")
    RESULTS["J1"] = {"emit": False, "reject": "second leg is an intervention report", "price_leg_touch": p_fx,
                     "price_leg_touch_closes": p_fx_c, "price_leg_finish": p_fx_fin, "iv": iv_fx["mid"]}

# ================================================================ seed rows
SEED_ROWS = {}
PLAIN_ROWS = {}


def seed_row(eid, contract, url, text, plain_text):
    r = RESULTS[eid]
    for t in (text, plain_text):
        assert len(t) < 600, (eid, len(t), t)
        assert chr(8212) not in t and chr(8211) not in t
    SEED_ROWS[eid] = {"odds": int(round(100 * r["touch"])), "venue": VENUE, "contract": contract, "url": url,
                      "as_of": AS_OF, "match_note": text}
    PLAIN_ROWS[eid] = {"odds": int(round(100 * r["plain"])), "venue": VENUE, "contract": contract, "url": url,
                       "as_of": AS_OF, "match_note": plain_text}
    assert 1 <= SEED_ROWS[eid]["odds"] <= 99 and 1 <= PLAIN_ROWS[eid]["odds"] <= 99


if RESULTS["F5"]["emit"]:
    r = RESULTS["F5"]
    seed_row("F5", "NVDA Mar 19 2027 and Apr 16 2027 puts, strikes 115, 120 and 125", FEED.format("NVDA"),
             f"TOUCH odds, closes only: one-touch formula for NVDA closing under 120 on any day by Mar 31, 2027 ({r['T_days']} "
             f"days). Close {r['S']:g}. Vol {pct(r['spread_vol'])} is the one that reprices the 115/120/125 put spreads "
             f"(finish under 120 on Mar 31: {p0(r['finish'])}); Mar 19 and Apr 16 expiries sit either side of the deadline, "
             f"total variance interpolated; drift {pct(r['drift'])}. Plain formula with the 120 strike vol {pct(r['iv'])} gives "
             f"{p0(r['plain'])}, too high because of skew. " + BIAS,
             f"TOUCH odds, plain one-touch formula, watched all day: NVDA under 120 on any day by Mar 31, 2027 ({r['T_days']} "
             f"days). Close {r['S']:g}; implied vol {pct(r['iv'])} at the 120 strike, total variance interpolated between the "
             f"Mar 19 and Apr 16 expiries; drift {pct(r['drift'])}. Finish under 120 by N(d2): {p0(r['plain_finish'])}. Runs high: "
             f"put spreads price the finish at {p0(r['finish'])}; fitted to them and closes only the touch is {p0(r['touch'])}. " + BIAS)
if RESULTS["B3"]["emit"]:
    r = RESULTS["B3"]
    seed_row("B3", "KRE Mar 19 2027 60 put and 65 put", FEED.format("KRE"),
             f"TOUCH odds, closes only: one-touch formula for KRE closing under 60 on any day by Mar 31, 2027 ({r['T_days']} "
             f"days). Close {r['S']:g}. Vol {pct(r['spread_vol'])} reprices the 60/65 put spread, held flat 12 days past the "
             f"Mar 19 expiry (Mar 31 expiry quoted too wide); drift {pct(r['drift'])}. Finish under 60 on Mar 31: "
             f"{p0(r['finish'])}. Plain formula with the 60 strike vol {pct(r['iv'])} gives {p0(r['plain'])}. Weak row: the 60 "
             f"put is quoted 0.87 to 1.31. " + BIAS,
             f"TOUCH odds, plain one-touch formula, watched all day: KRE under 60 on any day by Mar 31, 2027 ({r['T_days']} days). "
             f"Close {r['S']:g}; implied vol {pct(r['iv'])} from the Mar 19 60 put, held flat 12 days (Mar 31 expiry quoted too "
             f"wide); drift {pct(r['drift'])}. Finish by N(d2): {p0(r['plain_finish'])}. Wide quote: bid to ask vol gives "
             f"{p0(r['plain_lo'])} to {p0(r['plain_hi'])}. Fitted to the 60/65 put spread and closes only: {p0(r['touch'])}. " + BIAS)
if RESULTS["F9"]["emit"]:
    r = RESULTS["F9"]
    seed_row("F9", "SPY Apr 30 2027 610, 620 and 630 puts; SPY Jun 17 2027 620, 625 and 630 puts (SPY stands in for SPX)",
             FEED.format("SPY"),
             f"TOUCH odds, closes only: one-touch formula for the S&P 500 closing at or under 6,255.14 by May 28, 2027 (last "
             f"session before May 31; {r['T_days']} days), priced on SPY at {r['level']:.2f} (SPY {r['S']:g}; SPX quotes were "
             f"blank). Vol {pct(r['spread_vol'])} reprices the put spreads around the level (finish under on May 28: "
             f"{p0(r['finish'])}); Apr 30 and Jun 17 expiries, total variance interpolated; drift {pct(r['drift'])}. Plain "
             f"formula with the strike vol {pct(r['iv'])} gives {p0(r['plain'])}, too high because of skew. " + BIAS,
             f"TOUCH odds, plain one-touch formula, watched all day: S&P 500 at or under 6,255.14 by May 28, 2027 ({r['T_days']} "
             f"days), priced on SPY at {r['level']:.2f} (SPY {r['S']:g}; SPX quotes were blank). Implied vol {pct(r['iv'])} at "
             f"that strike, Apr 30 and Jun 17 expiries, total variance interpolated; drift {pct(r['drift'])}. Finish by N(d2): "
             f"{p0(r['plain_finish'])}. Runs high: put spreads price the finish at {p0(r['finish'])}; fitted to them and closes "
             f"only the touch is {p0(r['touch'])}. " + BIAS)
if RESULTS["D4"]["emit"]:
    r = RESULTS["D4"]
    seed_row("D4", "IEF Apr 16 2027 86, 88 and 89 puts (iShares 7-10 Year Treasury ETF stands in for the 10-year yield)",
             FEED.format("IEF"),
             f"TOUCH odds, closes only: one-touch formula for the 10-year yield closing above 5.50% by May 28, 2027 "
             f"({r['T_days']} days), priced on IEF: yield {TEN_YEAR:.2f}% to 5.50% is IEF {r['S']:g} to {r['level']:.2f} (duration "
             f"{D:g}). Vol {pct(r['spread_vol'])} reprices the Apr 16 put spreads, held flat 42 days (June strikes too thin); "
             f"drift {pct(r['drift'])}. Finish only: {p0(r['finish'])}. Plain formula {p0(r['plain'])}. Fund proxy: another "
             f"conversion anchor gives {p0(r['alt_touch'])}. " + BIAS,
             f"TOUCH odds, plain one-touch formula, watched all day: 10-year yield above 5.50% by May 28, 2027 ({r['T_days']} "
             f"days), priced on IEF: yield {TEN_YEAR:.2f}% to 5.50% is IEF {r['S']:g} to {r['level']:.2f} (duration {D:g}). Implied "
             f"vol {pct(r['iv'])} from the Apr 16 88 and 89 puts, held flat 42 days (June strikes too thin); drift "
             f"{pct(r['drift'])}. Finish by N(d2): {p0(r['plain_finish'])}. Closes only and fitted to put spreads: "
             f"{p0(r['touch'])}. Fund proxy. " + BIAS)
for eid, lvl in (("O1", 100), ("O2", 110)):
    if RESULTS[eid]["emit"]:
        r = RESULTS[eid]
        ks = ", ".join(f"{k:g}" for k in r["strikes"])
        seed_row(eid, f"BNO Apr 16 2027 calls, strikes {ks} (vol); ICE Brent futures Jan 2027 to Aug 2027 (curve)",
                 FEED.format("BNO"),
                 f"TOUCH odds: simulation of the rolling front month, daily settles, above {lvl} on any day by May 31, 2027 "
                 f"({r['T_days']} days). Front month {r['front_now']:g} after the Jan roll, {r['front_deadline']:g} for the "
                 f"deadline contract (curve slopes down). Vol {pct(r['spread_vol'])} reprices BNO Apr 16 call spreads at the "
                 f"matching strike {r['k_bno']:.1f}, held flat 45 days. Finish above on May 31: {p0(r['finish'])}. Plain "
                 f"one-touch formula {p0(r['plain'])}. BNO is a fund proxy. " + BIAS,
                 f"TOUCH odds, plain one-touch formula, watched all day: front-month Brent above {lvl} on any day by May 31, "
                 f"2027 ({r['T_days']} days). Start {r['S']:.2f}, drift {pct(r['drift'])} a year from the futures curve "
                 f"({r['front_now']:g} front, {r['front_deadline']:g} deadline contract). Implied vol {pct(r['iv'])} from BNO Apr 16 "
                 f"calls at the matching strike {r['k_bno']:.1f}, held flat 45 days. Finish by N(d2): {p0(r['plain_finish'])}. "
                 f"Daily-settle simulation: {p0(r['touch'])}. BNO is a fund proxy. " + BIAS)

# ---------------------------------------------------------------- the list of every price-threshold main event
PRICE_EVENTS = [
    ("F5", "NVDA close under $120.00", "2027-03-31", "ROW"),
    ("B3", "KRE close under $60.00", "2027-03-31", "ROW"),
    ("F9", "S&P 500 close at or under 6,255.14 (20% under the 7,818.93 record)", "2027-05-31", "ROW (found in the search; SPY options)"),
    ("D4", "10-year Treasury par yield close above 5.50%", "2027-05-31", "ROW (IEF options with a stated conversion)"),
    ("O1", "front-month ICE Brent settle above $100", "2027-05-31", "ROW (BNO vol, ICE curve)"),
    ("O2", "front-month ICE Brent settle above $110", "2027-05-31", "ROW (BNO vol, ICE curve)"),
    ("O7", "EIA monthly average Brent spot under $75.00, any month Dec 2026 to Nov 2027", "2027-11-30", "NO ROW: monthly average"),
    ("J1", "USD/JPY close above 160.00 AND 5 trillion yen of reported intervention", "2027-03-31", "NO ROW: second leg not priced"),
    ("J3", "USD/JPY 4.76% or more below its level five trading days earlier", "2027-03-31", "NO ROW: path event"),
    ("D7", "ICE US Dollar Index close 5% or more below its close five trading days earlier", "2027-03-31", "NO ROW: path event (found in the search)"),
    ("27-5", "10-year yield close at or above 5.50% AND a yen-buying intervention", "2027-11-30", "NO ROW: second leg not priced (found in the search)"),
    ("BT1", "three of EBS, SIGA, LAKE, APT, NVAX, GOVX each close up 10% in one session, tied to a headline", "2027-03-31", "NO ROW: joint one-day jump plus a news test (found in the search)"),
    ("BB5", "a $10B+ company falls 10% in a session on a rival's trial or approval", "2027-09-30", "NO ROW: no named stock (found in the search)"),
    ("J4", "SoftBank 5-year CDS close above 600 bp (or a downgrade, or forced sales)", "2027-01-31", "NO ROW: CDS has no listed options (found in the search)"),
    ("RU7", "France 10-year spread over Germany above 200 bp for 5 straight days (or ECB TPI)", "2029-11-19", "NO ROW: no listed option on the spread (found in the search)"),
    ("D8", "1-month bill yield 25 bp over the 3-month during extraordinary measures (or a rating action)", "2027-11-30", "NO ROW: no listed option on bill spreads (found in the search)"),
    ("J2", "30-year JGB yield at a record close on a weak auction day (or a megabank lending cap)", "2027-05-31", "NO ROW: needs an auction result too (found in the search)"),
    ("R4", "dysprosium and terbium Europe price at or above 3 times China price in every assessment", "2027-05-31", "NO ROW: no listed options"),
    ("R8", "Europe dysprosium oxide at or below half its peak", "2027-11-30", "NO ROW: no listed options"),
    ("P6", "Drewry World Container Index above $10,377", "2029-11-30", "NO ROW: no listed options"),
    ("WF8", "FAO Food Price Index above 160.2 (or an export ban)", "2029-11-19", "NO ROW: no listed options on the index"),
]

REJECTS = [
    ("O7", "Monthly average of spot Brent in any of twelve months. A vanilla option pays on one close on one day. Guide numbers are in the O7 block only."),
    ("J1", "Two legs. Options price only the dollar above 160 yen; the Ministry of Finance intervention report is not priced. The price leg is an upper bound (see the J1 block)."),
    ("J3", "A 5% yen gain inside five trading days is a path event (a move over a rolling window). Vanilla options give the spread of the level on one date, not the chance of a fast move at some point in four months. It needs a jump or changing-vol model fitted to short-dated options, and FXY options are too thin for that (most strikes have no bid)."),
    ("D7", "Same as J3: a 5% fall in the dollar index inside five trading days is a path event. Not computable from vanilla options."),
    ("27-5", "Two legs (10-year at or above 5.50% and a yen intervention). The second leg is not priced. Also the IEF Dec 2027 strikes needed for a Nov 30, 2027 deadline have open interest of 0 to 5."),
    ("BT1", "Needs three of six small stocks up 10% on the same day and a news link. Single-stock options do not price a joint one-day jump."),
    ("BB5", "No named stock, and a one-day 10% fall tied to a news cause is not priced by listed options."),
    ("J4", "SoftBank CDS is not a listed option market; the other two legs are a rating action and an asset sale."),
    ("RU7", "No listed option on the France minus Germany yield spread; options on each bond future alone do not price the spread."),
    ("D8", "No listed option on the 1-month minus 3-month bill spread; the other leg is a rating action."),
    ("J2", "Needs a 30-year auction result as well as a record yield; no listed option on the 30-year JGB yield."),
    ("R4, R8, P6, WF8", "Price tests on things with no listed options (rare earth oxides, container index, FAO index)."),
    ("KRE 2027-03-31 expiry (inside B3)", "The Mar 31 60 put matches the deadline exactly but is quoted 0.69 bid, 1.48 ask (spread 73% of mid), so it was refused and the Mar 19 puts were used."),
    ("SPX options (inside F9)", "Every SPX row in the feed shows bid 0 and ask 0 after the close. SPY was used."),
    ("IEF 2027-06-17 88 put (inside D4)", "Open interest 2. Refused; April vol held flat."),
    ("BNO 2027-07-16 calls (inside O1, O2)", "Open interest 1 to 5 at the 75 and 80 strikes. Refused; April vol held flat."),
]
for eid in ("F5", "B3", "F9", "D4", "O1", "O2"):
    if not RESULTS[eid]["emit"]:
        REJECTS.insert(0, (eid, RESULTS[eid]["reject"]))

_f9, _f5 = RESULTS["F9"], RESULTS["F5"]
HEADER = f"""EARTH2 MARKET-IMPLIED ODDS FROM LISTED OPTIONS
Quote date: {AS_OF} (Friday, US markets closed at 1 PM Eastern). Built by touch.py; no number here was worked by hand.

READ THIS FIRST: ONE CHANGE FROM THE BRIEF
  The brief asked for the plain one-touch formula with the implied vol at the level's strike. That number is
  computed and printed for every event (line A in each block) and written to seed_markets_plain_formula.json.
  It is NOT the number in seed_markets.json, because the quotes themselves show it runs high wherever puts get
  dearer at lower strikes (skew):
    - The market's own finish odds can be read straight off put spreads around the level. For the S&P 500 they
      say {p0(_f9['finish'])} for finishing under the level; the strike vol's N(d2) says {p0(_f9['plain_finish'])}.
    - Once a price is sitting on a level it is close to a coin flip whether it ends beyond it, so touch odds are
      about twice finish odds. The plain formula's {p0(_f9['plain'])} touch cannot sit beside a {p0(_f9['finish'])} finish.
    - The same gap shows on Nvidia ({p0(_f5['plain'])} plain touch against a {p0(_f5['finish'])} market finish) and on KRE.
      It is smaller on IEF and on BNO at 100, and it matters again for BNO at 110, where calls get dearer
      at higher strikes.
  Stored odds (line B) use the same one-touch formula with the vol that reprices those spreads, and they count
  closes only, because every test reads closing or settlement prices. For Brent the stored number comes from a
  daily simulation of the rolling front month. To use the brief's plain formula instead, import
  seed_markets_plain_formula.json (same rows, also passes the dry run).

WARNING ABOUT seed_markets_final.json
  A file of that name appeared in this folder at 23:06 on Nov 27 (Mountain time) while this work was still
  running. touch.py did not write it. As found, it carries first-pass numbers (F5 52, F9 38, O1 65, O2 40: the
  plain strike-vol formula, closes only) glued to notes that describe the final method, so its notes and odds
  disagree, and its "continuous figure" labels are wrong. The final numbers are the ones in the SUMMARY table
  below and in seed_markets.json. Rebuild that file from seed_markets.json before importing it.

DATA ROUTES TRIED, IN ORDER
  1. Cboe delayed quotes JSON (cdn.cboe.com/api/global/delayed_quotes/options/NVDA.json): FAILED. The shell gets a
     307 to cdn-api.cboe.com and then a 403 Cloudflare block page. WebFetch was not allowed to open the URL (the
     permission request timed out; blocked URLs: the NVDA.json and KRE.json Cboe links).
  2. Nasdaq option chain API (api.nasdaq.com): FAILED, no bytes back in 30 seconds (and an HTTP/2 stream error).
  3. Yahoo Finance option chain: FAILED, HTTP 429 "Too Many Requests" on both the options and the chart endpoints.
  4. Brent: ICE delayed data page: FAILED (403 Cloudflare). CME settlements: FAILED (timeout). EIA November 2026
     STEO: reached, but this edition prints only a WTI futures curve (five days to Nov 5) and no option-based
     confidence interval for Brent, so it was not used.
  5. Yen: CME FX settlements not reachable (same CME timeout).
  6. 10-year: Cboe TNX options blocked with the rest of Cboe; CME 10-year note options not reachable.
  WHAT WORKED
  A. optionsprofitcalculator.com option chain feed (getOptions and getStockPrice): full listed chains with bid,
     ask, last, open interest and volume per strike and expiry for NVDA, KRE, SPY, IEF, BNO, FXY, TLT, USO. Its
     help page says prices are delayed 15 to 30 minutes. Pulled after the close, so these are the Nov 27 closing
     quotes. The feed gives no implied vol, so every vol is computed here from the quoted bid and ask.
     Its SPX chain came back with every bid and ask at 0, and it has no TNX chain.
  B. Treasury daily par yield curve CSV (home.treasury.gov) for the interest rate and the 10-year yield.
  C. TradingView scanner (scanner.tradingview.com/global/scan), 10 to 15 minute delayed: ICE Brent futures curve by
     contract with expiry dates, USD/JPY, Japan 3-month yield, and a second check on every closing price.
  D. Fund pages: iShares (IEF duration, convexity, yield) and State Street (KRE distribution yield). FRED for the
     H.10 yen rate and EIA Brent spot history.

METHOD
  Each test below is "closes beyond a level on ANY day by the deadline". That is a touch (barrier hit) chance, not
  the chance of finishing beyond the level on the last day. Both are computed; the touch number is the one stored.
    n = m - s*s/2, where s is the vol, m the yearly drift, T the years to the deadline (calendar days / 365)
    finish below H:  N( (ln(H/S) - n*T) / (s*sqrt(T)) )
    touch H below S: N( (ln(H/S) - n*T) / (s*sqrt(T)) ) + (H/S)^(2n/s^2) * N( (ln(H/S) + n*T) / (s*sqrt(T)) )
    touch H above S: N( (ln(S/H) + n*T) / (s*sqrt(T)) ) + (H/S)^(2n/s^2) * N( (ln(S/H) - n*T) / (s*sqrt(T)) )
    closes only: the same formula with H moved away from S by exp(0.5826 * s * sqrt(T / number of closes))
  Strike vol: the option mid at the level's strike, inverted with an American binomial tree (400 steps) for puts
  and Black-Scholes for calls; between two strikes the two vols are joined by a straight line.
  Spread vol: for each pair of neighbouring strikes that pass the screen, market finish odds at the pair's midpoint
  = spread price / width (each leg first stripped of its early exercise value, then grossed up for interest); the
  spread vol is the s at which the finish formula above gives that same number.
  Expiries: where two expiries sit either side of the deadline and both pass the screen, total variance (s*s*T) is
  interpolated in a straight line. Where only one passes, its vol is held flat to the deadline and the block says so.
  Drift m: Treasury par yield at the horizon ({AS_OF} curve: 3 month {TSY_ROW['3 Mo']}%, 4 month {TSY_ROW['4 Mo']}%, 6 month
  {TSY_ROW['6 Mo']}%; source home.treasury.gov daily par yield curve) minus the carry yield. Carry yield comes from put-call
  parity at the strike nearest spot, or from the fund's published yield where parity quotes are too wide.
  Liquidity screen: a row is refused if it has no bid, open interest under {OI_MIN}, or a spread wider than half the mid.

KNOWN BIASES (all rows)
  - Risk-neutral odds. Option prices include a risk premium, so these usually run HIGHER than real-world odds for
    crash-side levels (stocks down, yields up, oil up in a supply scare).
  - The touch model assumes one constant volatility and no jumps. Fitting the vol to the spreads removes most of
    the skew error but not all of it.
  - Quotes are delayed closing quotes from a half-day session, with wider spreads than usual.
"""

with open(os.path.join(HERE, "NOTES.txt"), "w") as f:
    f.write(HEADER)
    f.write("\nSUMMARY (rows written to seed_markets.json)\n")
    f.write(f"  {'id':<5}{'ours':>7}{'STORED':>8}{'finish':>8}{'gap':>7}  |{'plain':>7}{'gap':>7}  |{'strike vol':>11}{'spread vol':>11}   expiry used\n")
    for eid in ("F5", "B3", "F9", "D4", "O1", "O2"):
        r = RESULTS[eid]
        if r["emit"]:
            f.write(f"  {eid:<5}{r['ours']:>6.1f}%{100 * r['touch']:>7.1f}%{100 * r['finish']:>7.1f}%{100 * r['touch'] - r['ours']:>+7.1f}  |"
                    f"{100 * r['plain']:>6.1f}%{100 * r['plain'] - r['ours']:>+7.1f}  |{100 * r['iv']:>10.1f}%{100 * r['spread_vol']:>10.1f}%   {r['expiry_used']}\n")
    f.write("  STORED = touch odds, closes only, spread vol (the seed's odds). finish = beyond the level on the deadline day only.\n")
    f.write("  plain = the brief's formula: one-touch, strike vol, watched all day. gap = market minus ours, in points.\n")
    f.write("\nEVERY MAIN EVENT WITH A PRICE OR YIELD TEST (live, not fired, odds above 1)\n")
    for eid, thr, dl, verdict in PRICE_EVENTS:
        f.write(f"  {eid:<5} threshold: {thr}; deadline {dl}; {verdict}\n")
        f.write(f"        test: {GRAPH_NODES[eid]['settlement_test']}\n")
    f.write("  Not touched (already carry a prediction-market row): "
            + ", ".join(sorted(n["id"] for n in GRAPH_NODES.values() if n.get("market"))) + ".\n")
    f.write("  Fired, skipped: F6 (Anthropic under $83), F8 (S&P 500 10% under its record).\n")
    f.write("  B2's label mentions Blue Owl under $7, but its test is on fund NAV and tender results, not a price.\n")
    f.write("\n".join(NOTES) + "\n")
    f.write("\n" + "=" * 100 + "\nREJECTS\n" + "=" * 100 + "\n")
    for eid, why in REJECTS:
        f.write(f"  {eid}: {why}\n")
    f.write("\nFILES\n  /home/claude/work/p2/opt/seed_markets.json (stored odds)\n"
            "  /home/claude/work/p2/opt/seed_markets_plain_formula.json (the brief's plain formula, same rows)\n"
            "  /home/claude/work/p2/opt/NOTES.txt\n"
            "  /home/claude/work/p2/opt/touch.py (this script)\n  /home/claude/work/p2/opt/results.json\n"
            "  /home/claude/work/p2/opt/raw/ (option chains, prices, Treasury curve, futures curve, used_rows.json, source_facts.json)\n")

seed = {"_note": (f"Market-implied odds from listed option quotes, {AS_OF} close. odds is the risk-neutral TOUCH chance "
                  "(one-touch barrier formula, lognormal, closes only) because each test is 'closes beyond the level on "
                  "any day by the deadline'. The vol is fitted to the put or call spreads around the level; the plain "
                  "formula with the strike's own implied vol is quoted in each match_note and stored in "
                  "seed_markets_plain_formula.json. Built by touch.py; inputs and both probabilities are in NOTES.txt. "
                  "No rows for O7, J1, J3, D7, 27-5 (see rejects in NOTES.txt)."),
        "event_markets": SEED_ROWS}
plain_seed = {"_note": (f"Same rows as seed_markets.json, {AS_OF} close, but odds is the plain one-touch formula exactly as "
                        "briefed: risk-neutral lognormal, implied vol at the level's strike, watched all day. These run "
                        "high where there is skew (NVDA, KRE, S&P 500); see NOTES.txt. Import this file OR "
                        "seed_markets.json, not both."),
              "event_markets": PLAIN_ROWS}
json.dump(seed, open(os.path.join(HERE, "seed_markets.json"), "w"), indent=1)
json.dump(plain_seed, open(os.path.join(HERE, "seed_markets_plain_formula.json"), "w"), indent=1)
json.dump(RESULTS, open(os.path.join(HERE, "results.json"), "w"), indent=1, default=str)
json.dump({"_note": f"Every option quote row that fed a number in touch.py. Source feed: optionsprofitcalculator.com, {AS_OF} close.",
           "rows": USED_ROWS}, open(os.path.join(RAW, "used_rows.json"), "w"), indent=1)

for name in ("NOTES.txt", "seed_markets.json", "seed_markets_plain_formula.json"):
    txt = open(os.path.join(HERE, name), encoding="utf-8").read()
    assert chr(8212) not in txt and chr(8211) not in txt, name

print(open(os.path.join(HERE, "NOTES.txt")).read())
print(json.dumps(seed, indent=1))
