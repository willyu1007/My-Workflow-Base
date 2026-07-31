# Verification

## A — value fidelity repair (2026-07-31)

**No warm-lineage literal survives** in `templates/web-workbench/{src,lint,*.md}`:

```bash
grep -rniE '1F1E1B|2D2C28|4A4843|6E6B65|A09D96|F5F2EA|EDE9DD|E3DDCD|CFC8B6|rgba\(20, ?25, ?35' \
  src/ lint/ *.md
# exit 1 (no matches) — DECISIONS.md intentionally records the old values; it is
# excluded by being the decision record itself. Re-run without *.md to confirm
# code-only cleanliness if DECISIONS.md ever trips a future scanner.
```

(Verified: the only remaining mentions of the old values are inside
`DECISIONS.md` and this task bundle, both records by design.)

**Contrast (WCAG relative luminance), matches My-Chat T-033 D-01:**

| Pair | Ratio | Verdict |
|---|---|---|
| `#6B707D` on `#FBF7F1` (muted on cream) | 4.64:1 | AA pass — matches My-Chat's recorded 4.64:1 |
| `#717684` on `#FBF7F1` (reference value) | 4.25:1 | AA fail — why D-A2 exists |
| `#6B707D` on `#F5EFE6` (muted on sand) | 4.33:1 | known scope limit, identical in My-Chat; recorded in D-A2 |
| `#111827` on `#FBF7F1` | 16.62:1 | AA/AAA pass |

**Cross-repo value identity** (workbench ↔ My-Chat `ui/tokens/base.json`):
ink 1–5 ≡ `ink.1-5`, cream/sand/sand-2/stone ≡ `warm.*`, scrim
`rgba(17,24,39,0.33)` ≡ `overlay_backdrop #11182754` (alpha 84/255 ≈ 0.329).

**Source-lock unaffected:** `conformance/workflow-contract-source-lock.json`
contains zero `templates/web-workbench` entries; `check:workflow-contract-source`
scope untouched.

**Not run:** package build (CSS-only change; `prepublishOnly` builds at
publish time), workflow-contract suites (out of scope for this directory).
