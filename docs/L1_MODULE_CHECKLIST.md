# L1 Module Validation Checklist

> Use this checklist when creating or reviewing any L1 risk module.

---

## 1. Status Definition Compliance

- [ ] Module outputs exactly ONE of: `PASS`, `WARNING`, `FAIL`, `INSUFFICIENT_DATA`
- [ ] No other status labels are used
- [ ] PASS means: no material risk, metrics within norms
- [ ] WARNING means: abnormal behavior, baseline deviation
- [ ] FAIL means: structural violation, threshold breach
- [ ] INSUFFICIENT_DATA means: missing/stale data, cannot determine

---

## 2. Language Compliance

### Summary Text
- [ ] Uses only allowed language (elevated, abnormal, deviating, accelerating)
- [ ] Does NOT contain: bullish, bearish, buy, sell, safe, unsafe, good, bad

### Status Logic Comments
- [ ] Thresholds are explicitly stated
- [ ] Rationale is structural, not opinion-based

---

## 3. Failure Behavior Compliance

- [ ] Missing required data → INSUFFICIENT_DATA (never defaults to PASS)
- [ ] Invalid/NaN values → INSUFFICIENT_DATA
- [ ] Stale data handling is defined
- [ ] Error states display clear messages

---

## 4. Cross-Module Consistency

- [ ] PASS/WARNING/FAIL semantic meaning matches other L1 modules
- [ ] Threshold severity is comparable across modules
- [ ] Status aggregation compatibility confirmed

---

## 5. Output Requirements

- [ ] Raw metrics exposed (for researchers)
- [ ] Derived signals provided (for analysts)
- [ ] Neutral summary (1-2 sentences, descriptive only)
- [ ] Collapsible raw data block

---

## 6. Visualization Rules

- [ ] Vertical layout only
- [ ] No internal scrolling
- [ ] Height constrained (max-height defined)
- [ ] Fits within L1 skeleton section
- [ ] No charts (text + badges only)

---

## Reviewer Sign-Off

| Reviewer | Date | Module | Result |
|----------|------|--------|--------|
| | | | PASS / NEEDS REVISION |
