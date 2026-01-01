# L1 Status Taxonomy

> **Scope**: All L1 — Health & Risk Signals modules  
> **Version**: 1.0  
> **Last Updated**: 2026-01-01

---

## Core Principle

**Status labels represent STRUCTURAL STATE, not price direction or opinion.**

Modules provide signals. Analysts make decisions.

---

## Status States (Canonical)

Every L1 module MUST output exactly ONE of these statuses:

| Status | Definition |
|--------|------------|
| **PASS** | No material risk detected. Metrics within historical or structural norms. No immediate or latent stress observed. |
| **WARNING** | Abnormal behavior or emerging risk. Metrics deviating from baseline. Potential risk accumulation. Requires monitoring, not action. |
| **FAIL** | Structural violation or extreme abnormality. Threshold breach with systemic implications. Risk is present regardless of market context. |
| **INSUFFICIENT_DATA** | Required data missing, stale, or inconsistent. No inference possible. Status cannot be determined safely. |

**No other status labels are allowed.**

---

## Interpretation Rules

### 1. Status is DESCRIPTIVE, not PRESCRIPTIVE
Status describes structural state. It does not recommend action.

### 2. FAIL ≠ Price Will Go Down
FAIL indicates structural risk, not directional prediction.

### 3. WARNING ≠ Weak FAIL
WARNING signals transition or buildup. It is not a softer version of FAIL.

### 4. INSUFFICIENT_DATA ≠ Neutral
Missing data is a first-class state. It must be visible and respected.

---

## Language Rules

### Allowed
- "elevated"
- "abnormal"
- "deviating"
- "accelerating"
- "structural pressure"
- "emerging"
- "accumulating"

### Forbidden
- bullish / bearish
- buy / sell / hold
- safe / unsafe
- good / bad
- positive / negative (in opinion sense)
- confident / uncertain

---

## Cross-Module Consistency

- Identical status labels MUST mean the same thing across all L1 modules
- A FAIL in Supply Emission Risk must be comparable in severity to a FAIL in Exchange Flow Risk
- Thresholds may differ per module, but semantic meaning is constant

---

## Status Severity Hierarchy

```
FAIL > WARNING > PASS
         ↓
  INSUFFICIENT_DATA (orthogonal — data quality issue)
```

INSUFFICIENT_DATA is not ranked against PASS/WARNING/FAIL. It represents inability to evaluate, not a severity level.
