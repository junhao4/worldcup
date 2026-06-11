#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(CDPATH='' cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
EXT_DIR="$ROOT_DIR/.specify/extensions/d2/commands"
SKILLS_DIR="$ROOT_DIR/.kiro/skills"

if [[ ! -d "$EXT_DIR" ]]; then
  echo "D2 extension commands not found at $EXT_DIR" >&2
  exit 1
fi

if [[ ! -d "$SKILLS_DIR" ]]; then
  echo "Kiro skills directory not found at $SKILLS_DIR" >&2
  exit 1
fi

for source_file in "$EXT_DIR"/speckit.d2.*.md; do
  [[ -f "$source_file" ]] || continue

  command_name="$(basename "$source_file" .md)"
  skill_name="${command_name//./-}"
  skill_dir="$SKILLS_DIR/$skill_name"
  target_file="$skill_dir/SKILL.md"

  [[ -d "$skill_dir" ]] || continue

  python3 - "$source_file" "$target_file" "$skill_name" <<'PY'
from pathlib import Path
import sys

source_path = Path(sys.argv[1])
target_path = Path(sys.argv[2])
skill_name = sys.argv[3]

text = source_path.read_text(encoding="utf-8")
parts = text.split("---", 2)

if len(parts) < 3:
    raise SystemExit(f"Unexpected frontmatter format in {source_path}")

frontmatter = parts[1].strip("\n")
body = parts[2].lstrip("\n")

target_text = (
    "---\n"
    f"{frontmatter}\n"
    f"name: {skill_name}\n"
    "---\n\n"
    "<!-- Extension: d2 -->\n"
    "<!-- Config: .specify/extensions/d2/ -->\n"
    f"{body}"
)

target_path.write_text(target_text, encoding="utf-8")
PY

  echo "Synced $command_name -> ${target_file#$ROOT_DIR/}"
done
