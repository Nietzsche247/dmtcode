# DMT Code Project, FINAL Logo (locked), Brand Sheet, 2026-08-18 1130 MST
Supersedes DMTCODE_LOGO_BRAND_SHEET_2026-08-18_0930.md and the 1100 molecule sheet.

## The mark (LOCKED 2026-08-18)
Lattice mark: seven-node hexagonal lattice, red center node = 650 nm source, six ink nodes = observers and recorded forms; hexagon perimeter plus spokes = the registry's most-reported glyph class (hexagonal lattice, nested triangles). Wordmark "DMT CODE" in Barlow Condensed SemiBold, tracking -0.5%. "PROJECT" in Inter Display SemiBold at 24% of the wordmark size, +32% tracking, left-aligned under DMT CODE. Optional tagline "OPEN DATASET  ·  CC BY 4.0", Inter SemiBold, +16% tracking, gray. Mark height = height of the DMT CODE + PROJECT block in the horizontal lockup. The molecule concept (v4 to v6) is retired; files kept in the 08-18 session zips only.

## Palette
| Token | Hex | Use |
|---|---|---|
| Laser 650 | #E3001B | center node. Only color in the system. |
| Ink | #111111 | text and lattice on light |
| Paper | #FAFAFA | text and lattice on dark |
| Gray | #7A7A7A (light) / #9A9A9A (dark) | tagline only |
| Dark bg | #0B0B0B | dark lockups, merch on black |
Print: Laser 650 ~ Pantone 185 C. Single-ink merch: mono-black or mono-white files.

## Files (svg + png each; 7 palette variants: color-on-light, color-on-paper, color-on-dark, mono-black, mono-white, red-on-light, red-on-black)
| Pattern | Use |
|---|---|
| dmtcode_final_horizontal_{v} | site header, email footer, docs headers |
| dmtcode_final_horizontal_tagline_{v} | email footer, letterhead, og image |
| dmtcode_final_stacked_{v} | merch chest, stickers, posters, social avatar |
| dmtcode_final_wordmark_{v} | text only |
| dmtcode_final_icon_{v} | lattice mark alone, 512. favicon, avatar, embroidery |
| favicon.svg / favicon-32.png / dmtcode_final_favicon.png | site favicon |
| icon-192.png, icon-512.png, dmtcode_final_appicon_rounded.png | PWA / app icons |
| dmtcode_final_og_1200x630.png | og:image (/og-image.png) |

## Rules
Clear space = diameter of the red center node on all sides. Minimum sizes: icon 16 px; horizontal lockup 140 px wide; stacked 100 px wide. Single-ink merch: mono files (whole mark one color). Never recolor the center node anything but Laser 650 or the mono ink.

## Regenerate
claude/tools/dmtcode_logo_gen.py (mark_A + text engine) and dmtcode_logo_gen_v7.py (final lockups, icons, palettes, og). python3, cairosvg + fonttools; fonts Barlow Condensed SemiBold, Inter Display SemiBold, Inter SemiBold (all OFL).
