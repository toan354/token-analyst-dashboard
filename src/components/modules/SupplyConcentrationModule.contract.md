# SupplyConcentrationModule Interface Contract

## Module Classification

| Field | Value |
|-------|-------|
| module_id | `supply_concentration` |
| module_name | Holder Concentration Overview |
| layer | L2 — Structural Metrics |
| type | Context / Explanation |
| verdict_authority | **NONE** |

---

## Purpose

Describe token holder concentration and ownership distribution
to provide structural context for analyst interpretation.

**This module does NOT produce risk verdicts.**

---

## Inputs

### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `totalSupply` | `number` | Total token supply |
| `holders` | `HolderRecord[]` | Array of holder records |

### Optional Fields

| Field | Type | Description |
|-------|------|-------------|
| `previousSnapshot` | `HolderRecord[]` | For delta analysis |

### HolderRecord Structure

```typescript
interface HolderRecord {
  address: string;
  balance: number;
  label?: 'team' | 'treasury' | 'exchange' | 'contract' | 'unknown';
}
```

---

## Outputs

### a. Raw Metrics (research)

| Metric | Type | Description |
|--------|------|-------------|
| `topHolderShare` | `number` | % held by #1 holder |
| `top5HoldersShare` | `number` | % held by top 5 |
| `top10HoldersShare` | `number` | % held by top 10 |
| `top50HoldersShare` | `number` | % held by top 50 |
| `holderCount` | `number` | Total tracked holders |
| `teamShare` | `number` | % held by team wallets |
| `treasuryShare` | `number` | % held by treasury |
| `exchangeShare` | `number` | % held on exchanges |

### b. Structural Descriptions

| Field | Values | Description |
|-------|--------|-------------|
| `concentrationLevel` | `low` / `moderate` / `high` | Descriptive classification |
| `distributionShape` | `flat` / `skewed` | Ownership spread pattern |

### c. Context Summary

- 2-3 neutral sentences
- Describes ownership structure ONLY
- **NO** risk language
- **NO** verdicts
- **NO** recommendations

---

## Visualization Rules

- Vertical layout only
- **NO** status badges
- **NO** alert colors (red/yellow/green for status)
- Neutral gray distribution bar
- Matches other L2 modules visually

---

## Failure Behavior

If required data is missing:
- Display: **"HOLDER STRUCTURE DATA UNAVAILABLE"**
- List missing fields
- Do NOT infer or estimate values

---

## Forbidden Outputs

This module must **NEVER** produce:

- ❌ PASS / WARNING / FAIL / INSUFFICIENT_DATA status badges
- ❌ Risk-colored backgrounds or text
- ❌ Buy/sell/hold recommendations
- ❌ Bullish/bearish language
- ❌ Price predictions
- ❌ Any verdict that influences L1 aggregation

---

## Example Outputs

### Normal State
```
Top 10 holders control 58.5% of total supply.
Ownership is relatively distributed among top holders.
Total tracked holders: 12.
```

### Missing Data State
```
HOLDER STRUCTURE DATA UNAVAILABLE
Missing: holders
```
