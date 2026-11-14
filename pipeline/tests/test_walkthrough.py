"""The presenter's walkthrough quotes every check exactly as meta.json has it. Needs no downloaded data.

AI-assisted: written with help from Claude. Reviewed by: Mahabu Subhani (pending).

Run from the repo root: python -m pytest pipeline/tests/test_walkthrough.py -q
"""

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import walkthrough  # noqa: E402


def build(tmp_path, monkeypatch) -> str:
    out = tmp_path / "walk.md"
    monkeypatch.setattr(walkthrough, "OUT", out)
    monkeypatch.setattr(walkthrough, "REPO", tmp_path)        # so the printed relative path resolves
    walkthrough.main()
    return out.read_text(encoding="utf-8")


def test_every_check_row_matches_meta(tmp_path, monkeypatch):
    text = build(tmp_path, monkeypatch)
    for area, region in walkthrough.regions().items():
        meta = walkthrough.load(area, "meta.json")
        if not meta:
            continue
        for c in meta["checks"]:
            row = f"| {walkthrough.short(region)} | {walkthrough.cell(c['value'])} | {walkthrough.verdict(c['verdict'])} |"
            assert row in text, f"{area} {c['id']}: expected row {row!r}"


def test_c6_table_reads_every_note(tmp_path, monkeypatch):
    """If export.py changes the wording of the C6 note, the parse must not silently show n/a."""
    text = build(tmp_path, monkeypatch)
    section = text.split("## 4.")[1].split("**Reading the table.**")[0]
    rows = [line for line in section.splitlines() if line.startswith("| ") and "Gated?" not in line]
    assert rows, "no C6 rows"
    for line in rows:
        assert "n/a" not in line, f"unparsed C6 note: {line}"


def test_no_number_typed_by_hand_for_the_jump(tmp_path, monkeypatch):
    text = build(tmp_path, monkeypatch)
    meta = json.loads((walkthrough.APP_DATA / "punjab-haryana" / "meta.json").read_text(encoding="utf-8"))
    c0 = next(c["value"] for c in meta["checks"] if c["id"] == "C0")
    assert f"(check C0, {c0})" in text
