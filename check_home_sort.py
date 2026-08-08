"""Mechanical P2 check for home.html: every sibling list sorts A->Z.

Verifies the control room's tree-display principle P2 (total, stable
sort) the way eyeballs demonstrably cannot (2026-08-08: two false
"verified sorted" claims by inspection; this script caught the third
violation in one pass).

Args:      none (operates on home.html beside this script).
Pre:       home.html exists and contains the <h2>Docs ... <h2>Instruments
           section markers this parser keys on (asserted at startup;
           failure names the missing marker).
Modifies:  nothing — read-only; prints one line per sibling list.
Post:      exit 0 if every checked list is sorted case-insensitively
           (page sections, Docs kind folders, every kids list); exit 1
           with BAD lines naming each unsorted list.

Run (ps or bash):  python check_home_sort.py
"""
import re
import sys
import pathlib

page = pathlib.Path(__file__).with_name("home.html")
assert page.exists(), f"Pre failed: {page} not found - run beside home.html"
t = page.read_text(encoding="utf-8")
for marker in ("<h2>Docs", "<h2>Instruments"):
    assert marker in t, f"Pre failed: marker {marker!r} not in home.html"

failures = []

def check(name, items):
    ok = items == sorted(items, key=str.lower)
    print(("OK " if ok else "BAD"), name, "->",
          f"{len(items)} sorted" if ok else items)
    if not ok:
        failures.append(name)

check("page sections", re.findall(r"<h2>([A-Za-z]+)", t))
docs = t[t.index("<h2>Docs"):t.index("<h2>Instruments")]
check("Docs kind folders", re.findall(r"<summary>(\w+)<small>", docs))
for m in re.finditer(
        r'<details class="tree">\s*\n?\s*<summary>(\w[\w -]*?)<small>(.*?)\n</details>\n',
        docs, re.S):
    kind, block = m.group(1), m.group(2)
    subs = re.findall(r'<details class="tree"><summary>([^<]+)</summary>', block)
    if subs:
        check(f"{kind}: subfolders", subs)
for m in re.finditer(
        r'<details class="tree"><summary>([^<]+)</summary><div class="kids">(.*?)</div></details>',
        docs, re.S):
    rows = re.findall(r'<a class="doc"[^>]*>([^<]+?) <span', m.group(2))
    if rows:
        check(f"  {m.group(1)}", rows)
rows = re.findall(r'<a class="doc"[^>]*>([^<]+?) <span',
                  re.sub(r"<details.*?</details>", "", docs, flags=re.S))
if rows:
    check("kind-level loose docs", rows)

sys.exit(1 if failures else 0)
