#!/usr/bin/env python3
"""Build the free PDF downloads from the text sources in docs/downloads-src/.

    python3 scripts/build-downloads-v1-1.py                 # every *.md source
    python3 scripts/build-downloads-v1-1.py field-sheet.en  # one source

Each source names its own output file in the front matter, so a revision is a
text edit here followed by one run. Requires reportlab and qpdf. The PDF is
written by reportlab, then linearized through qpdf so the file carries no
library comments; Producer and Creator read Meridian Optics Lab.

Source format. Front matter between two "---" lines, key: value:

    file           output name under public/downloads
    title          PDF title
    subject        PDF subject
    author         PDF author
    footer_left    footer, left
    footer_center  footer, centre (carries the version string)
    page_label     e.g. "Page {n} of {total}", in the document's language

Body, one page per "=== page" line:

    # Text                 page title
    > Text                 subtitle under the title
    ## TEXT                section heading
    plain lines            paragraph; consecutive lines are joined
    1. Text                numbered item
    - Text                 bullet item
    [fields] + "a | b"     two column labelled write-in lines
    [field] a              one full width write-in line
    [checks] + "a | b | c" three column checkboxes
    [lines N]              N ruled note lines
    [sketches] + "a | b | c" and one caption line
                           three sketch boxes with a caption under each
    [box N]                one full width box N points tall
    [sign] + title, sentence, "a | b"
                           framed acknowledgment block
    [gap N]                N points of vertical space

No em-dashes anywhere in a source. Each language file keeps the spelling
convention already in it (the ES field sheet is written without accents and
the ES baseline with them; the DE field sheet writes ue/ae/oe and the DE
baseline uses umlauts).
"""

import os
import re
import shutil
import subprocess
import sys
import tempfile

from reportlab.lib.pagesizes import letter
from reportlab.lib.colors import Color
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfgen import canvas

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC_DIR = os.path.join(ROOT, "docs", "downloads-src")
OUT_DIR = os.path.join(ROOT, "public", "downloads")

PAGE_W, PAGE_H = letter
LM = 40.0
RM = 40.0
TM = 37.0
BODY_W = PAGE_W - LM - RM
FOOTER_Y = 29.0

INK = Color(0.101961, 0.101961, 0.101961)
GREY = Color(0.333333, 0.333333, 0.333333)
ACCENT = Color(0.560784, 0.113725, 0.113725)
RULE = Color(0.847059, 0.847059, 0.847059)

FONT = "Helvetica"
BOLD = "Helvetica-Bold"

BODY_SIZE = 8.6
BODY_LEAD = 11.6
HEAD_SIZE = 9.5
LABEL_SIZE = 8.0
FIELD_ROW = 20.0
CHECK_ROW = 16.0
NOTE_ROW = 12.0

# Strings that must not appear anywhere in a shipped file.
FORBIDDEN_TEXT = ["—", "generated", "Generated", "draft", "Draft"]


# ---------------------------------------------------------------- parsing
def parse_source(path):
    text = open(path, encoding="utf-8").read()
    for bad in FORBIDDEN_TEXT:
        if bad in text:
            raise SystemExit(f"{path}: contains forbidden string {bad!r}")
    m = re.match(r"---\n(.*?)\n---\n(.*)", text, re.S)
    if not m:
        raise SystemExit(f"{path}: missing front matter")
    meta = {}
    for line in m.group(1).splitlines():
        k, _, v = line.partition(":")
        meta[k.strip()] = v.strip()
    for key in ("file", "title", "subject", "author", "footer_left", "footer_center", "page_label"):
        if key not in meta:
            raise SystemExit(f"{path}: front matter lacks {key}")
    pages = []
    for chunk in re.split(r"^=== page\s*$", m.group(2), flags=re.M):
        if chunk.strip():
            pages.append(parse_page(chunk, path))
    return meta, pages


def parse_page(chunk, path):
    blocks = []
    lines = chunk.splitlines()
    i = 0
    para = []

    def flush():
        if para:
            blocks.append(("p", " ".join(para)))
            para.clear()

    while i < len(lines):
        line = lines[i].rstrip()
        i += 1
        if not line.strip():
            flush()
            continue
        if line.startswith("# "):
            flush()
            blocks.append(("title", line[2:].strip()))
        elif line.startswith("> "):
            flush()
            blocks.append(("subtitle", line[2:].strip()))
        elif line.startswith("## "):
            flush()
            blocks.append(("h", line[3:].strip()))
        elif re.match(r"^\d+\.\s", line):
            flush()
            blocks.append(("num", re.sub(r"^\d+\.\s+", "", line)))
        elif line.startswith("- "):
            flush()
            blocks.append(("bullet", line[2:].strip()))
        elif line.startswith("[field] "):
            flush()
            blocks.append(("field", line[8:].strip()))
        elif line in ("[fields]", "[checks]", "[sketches]", "[sign]"):
            flush()
            rows = []
            while i < len(lines) and lines[i].strip() and not lines[i].startswith(("[", "#", "=")):
                rows.append([c.strip() for c in lines[i].split("|")])
                i += 1
            blocks.append((line[1:-1], rows))
        elif re.match(r"^\[(lines|box|gap) \d+\]$", line):
            flush()
            kind, n = line[1:-1].split()
            blocks.append((kind, int(n)))
        else:
            para.append(line.strip())
    flush()
    return blocks


# ---------------------------------------------------------------- text helpers
def wrap(text, font, size, width):
    words = text.split()
    out, cur = [], ""
    for w in words:
        trial = (cur + " " + w).strip()
        if pdfmetrics.stringWidth(trial, font, size) <= width or not cur:
            cur = trial
        else:
            out.append(cur)
            cur = w
    if cur:
        out.append(cur)
    return out


class Page:
    """Cursor that draws blocks down one page."""

    def __init__(self, canv, meta, number, total):
        self.c = canv
        self.meta = meta
        self.y = PAGE_H - TM
        self.number = number
        self.total = total

    # -- chrome
    def footer(self):
        c = self.c
        c.setFont(FONT, 7.5)
        c.setFillColor(GREY)
        c.drawString(LM, FOOTER_Y, self.meta["footer_left"])
        c.drawCentredString(PAGE_W / 2, FOOTER_Y, self.meta["footer_center"])
        c.drawRightString(PAGE_W - RM, FOOTER_Y, self.meta["page_label"].format(n=self.number, total=self.total))

    # -- blocks
    def title(self, text):
        c = self.c
        c.setFont(BOLD, 15)
        c.setFillColor(INK)
        c.drawString(LM, self.y - 12, text)
        self.y -= 12

    def subtitle(self, text):
        c = self.c
        c.setFont(FONT, 8.6)
        c.setFillColor(GREY)
        c.drawString(LM, self.y - 13, text)
        self.y -= 13
        c.setStrokeColor(ACCENT)
        c.setLineWidth(1.2)
        c.line(LM, self.y - 8, PAGE_W - RM, self.y - 8)
        self.y -= 8 + 20

    def heading(self, text):
        c = self.c
        c.setFont(BOLD, HEAD_SIZE)
        c.setFillColor(ACCENT)
        c.drawString(LM, self.y - HEAD_SIZE, text)
        self.y -= HEAD_SIZE + 6

    def para(self, text):
        c = self.c
        c.setFont(FONT, BODY_SIZE)
        c.setFillColor(INK)
        for ln in wrap(text, FONT, BODY_SIZE, BODY_W):
            c.drawString(LM, self.y - BODY_SIZE, ln)
            self.y -= BODY_LEAD
        self.y -= 7

    def item(self, marker, text, marker_color, indent=14.0):
        c = self.c
        c.setFont(FONT, BODY_SIZE)
        if marker:
            c.setFillColor(marker_color)
            c.drawString(LM, self.y - BODY_SIZE, marker)
        else:
            # Bullet: a short accent dash drawn as a line, so no dash glyph is used.
            c.setStrokeColor(marker_color)
            c.setLineWidth(1.2)
            c.line(LM, self.y - BODY_SIZE + 3, LM + 5, self.y - BODY_SIZE + 3)
        c.setFillColor(INK)
        for ln in wrap(text, FONT, BODY_SIZE, BODY_W - indent):
            c.drawString(LM + indent, self.y - BODY_SIZE, ln)
            self.y -= BODY_LEAD
        self.y -= 1

    def end_list(self):
        self.y -= 6

    MIN_WRITE_IN = 70.0

    def label_width(self, label):
        return pdfmetrics.stringWidth(label, FONT, LABEL_SIZE)

    def stacked(self, label, width):
        """True when the label is long enough that the write-in line goes under it."""
        return width - self.label_width(label) - 6 < self.MIN_WRITE_IN

    def field_line(self, label, x, width):
        c = self.c
        c.setFont(FONT, LABEL_SIZE)
        c.setFillColor(GREY)
        c.drawString(x, self.y - LABEL_SIZE, label)
        c.setStrokeColor(RULE)
        c.setLineWidth(0.8)
        if self.stacked(label, width):
            c.line(x, self.y - LABEL_SIZE - 11, x + width, self.y - LABEL_SIZE - 11)
        else:
            c.line(x + self.label_width(label) + 6, self.y - LABEL_SIZE - 1, x + width, self.y - LABEL_SIZE - 1)

    def fields(self, rows):
        gap = 20.0
        col = (BODY_W - gap) / 2
        for row in rows:
            for j, label in enumerate(row[:2]):
                self.field_line(label, LM + j * (col + gap), col)
            self.y -= FIELD_ROW + (10 if any(self.stacked(l, col) for l in row[:2]) else 0)
        self.y -= 4

    def field(self, label):
        self.field_line(label, LM, BODY_W)
        self.y -= FIELD_ROW

    def checks(self, rows):
        c = self.c
        col = BODY_W / 3
        for row in rows:
            for j, label in enumerate(row[:3]):
                x = LM + j * col
                c.setStrokeColor(INK)
                c.setLineWidth(0.7)
                c.rect(x, self.y - 8.5, 7, 7, stroke=1, fill=0)
                c.setFont(FONT, LABEL_SIZE)
                c.setFillColor(INK)
                c.drawString(x + 11, self.y - 8, label)
            self.y -= CHECK_ROW
        self.y -= 4

    def lines(self, n):
        c = self.c
        c.setStrokeColor(RULE)
        c.setLineWidth(0.8)
        for _ in range(n):
            self.y -= NOTE_ROW
            c.line(LM, self.y, PAGE_W - RM, self.y)
        self.y -= 6

    def sketches(self, rows):
        c = self.c
        if len(rows) < 2:
            raise SystemExit("[sketches] needs a row of three captions and one caption line")
        labels, caption = rows[0], " ".join(rows[1])
        gap = 14.0
        col = (BODY_W - 2 * gap) / 3
        box_h = 100.0
        c.setFont(FONT, 7.5)
        c.setFillColor(GREY)
        for j, label in enumerate(labels[:3]):
            c.drawString(LM + j * (col + gap), self.y - 7.5, label)
        self.y -= 11
        c.setStrokeColor(RULE)
        c.setLineWidth(0.7)
        for j in range(3):
            c.rect(LM + j * (col + gap), self.y - box_h, col, box_h, stroke=1, fill=0)
        self.y -= box_h + 10
        c.setFont(FONT, 7.0)
        c.setFillColor(INK)
        for j in range(3):
            c.drawString(LM + j * (col + gap), self.y - 7, caption)
        self.y -= 7 + 16

    def box(self, h):
        c = self.c
        c.setStrokeColor(RULE)
        c.setLineWidth(0.7)
        c.rect(LM, self.y - h, BODY_W, h, stroke=1, fill=0)
        self.y -= h + 14

    def gap(self, n):
        self.y -= n

    def sign(self, rows):
        c = self.c
        title, sentence, labels = rows[0][0], rows[1][0], rows[2]
        h = 62.0
        c.setStrokeColor(RULE)
        c.setLineWidth(0.8)
        c.rect(LM, self.y - h, BODY_W, h, stroke=1, fill=0)
        inner = 10.0
        c.setFont(BOLD, 8.6)
        c.setFillColor(INK)
        c.drawString(LM + inner, self.y - 16, title)
        c.setFont(FONT, BODY_SIZE)
        c.drawString(LM + inner, self.y - 30, sentence)
        saved = self.y
        self.y -= 40
        gap = 30.0
        col = (BODY_W - 2 * inner - gap) * 0.62
        self.field_line(labels[0], LM + inner, col)
        self.field_line(labels[1], LM + inner + col + gap, BODY_W - 2 * inner - col - gap)
        self.y = saved - h - 10

    # -- driver
    def draw(self, blocks):
        prev = None
        for kind, payload in blocks:
            if prev in ("num", "bullet") and kind not in ("num", "bullet"):
                self.end_list()
            if kind == "title":
                self.title(payload)
            elif kind == "subtitle":
                self.subtitle(payload)
            elif kind == "h":
                self.heading(payload)
            elif kind == "p":
                self.para(payload)
            elif kind == "num":
                self.item(f"{self._num}.", payload, INK)
                self._num += 1
            elif kind == "bullet":
                self.item("", payload, ACCENT)
            elif kind == "fields":
                self.fields(payload)
            elif kind == "field":
                self.field(payload)
            elif kind == "checks":
                self.checks(payload)
            elif kind == "lines":
                self.lines(payload)
            elif kind == "sketches":
                self.sketches(payload)
            elif kind == "box":
                self.box(payload)
            elif kind == "gap":
                self.gap(payload)
            elif kind == "sign":
                self.sign(payload)
            else:
                raise SystemExit(f"unknown block {kind}")
            if kind == "h":
                self._num = 1
            prev = kind
        if self.y < FOOTER_Y + 20:
            raise SystemExit(f"page {self.number} overflows by {FOOTER_Y + 20 - self.y:.0f} pt")

    _num = 1


# ---------------------------------------------------------------- build
def build(src_path):
    meta, pages = parse_source(src_path)
    out_path = os.path.join(OUT_DIR, meta["file"])
    tmp_dir = tempfile.mkdtemp(prefix="dl-")
    raw = os.path.join(tmp_dir, "raw.pdf")
    c = canvas.Canvas(raw, pagesize=letter, invariant=1)
    c.setTitle(meta["title"])
    c.setSubject(meta["subject"])
    c.setAuthor(meta["author"])
    c.setCreator("Meridian Optics Lab")
    c.setProducer("Meridian Optics Lab")
    total = len(pages)
    for n, blocks in enumerate(pages, start=1):
        page = Page(c, meta, n, total)
        page.draw(blocks)
        page.footer()
        c.showPage()
    c.save()
    # Linearize through qpdf. The rewrite drops the library's own header
    # comments, so the only producer string left in the file is ours.
    subprocess.run(["qpdf", "--linearize", raw, out_path], check=True)
    shutil.rmtree(tmp_dir)
    data = open(out_path, "rb").read()
    for bad in (b"ReportLab", b"reportlab"):
        if bad in data:
            raise SystemExit(f"{out_path}: still carries {bad.decode()}")
    info = subprocess.run(["pdfinfo", out_path], capture_output=True, text=True).stdout
    pages_line = next((l for l in info.splitlines() if l.startswith("Pages:")), "Pages: ?")
    print(f"{meta['file']}: {pages_line.split(':', 1)[1].strip()} pages")
    return out_path


def main(argv):
    names = argv[1:]
    sources = sorted(f for f in os.listdir(SRC_DIR) if f.endswith(".md"))
    if names:
        wanted = {n if n.endswith(".md") else n + ".md" for n in names}
        sources = [s for s in sources if s in wanted]
        missing = wanted - set(sources)
        if missing:
            raise SystemExit(f"no such source: {', '.join(sorted(missing))}")
    if not sources:
        raise SystemExit(f"no sources in {SRC_DIR}")
    for s in sources:
        build(os.path.join(SRC_DIR, s))


if __name__ == "__main__":
    main(sys.argv)
