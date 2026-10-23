#!/usr/bin/env bash
# Rerun DMT Code analysis run 01 end to end from input/ into output/.
# Usage: scripts/analysis/run_all.sh            (from anywhere)
#        ROOT=/path/to/analysis-rebuild scripts/analysis/run_all.sh
set -euo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="${ROOT:-$(cd "$HERE/../.." && pwd)}"
IN="$ROOT/input"
OUT="$ROOT/output"
WORK="$OUT/work"
mkdir -p "$WORK" "$OUT/sensitivity"
export PYTHONHASHSEED=0

python3 "$HERE/segmenter.py" --input "$IN" --out "$WORK/primitives_component.npz" --unit component
python3 "$HERE/segmenter.py" --input "$IN" --out "$WORK/primitives_junction.npz" --unit junction --min-branch 8
python3 "$HERE/analysis.py" --input "$IN" --component "$WORK/primitives_component.npz" \
        --junction "$WORK/primitives_junction.npz" --out "$OUT"
echo "done: $OUT"
