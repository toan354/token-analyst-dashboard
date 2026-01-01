# Module Interface Contract: Exchange Flow Risk

────────────────────────
## 1. Meta
────────────────────────

| Field | Value |
|-------|-------|
| **module_id** | `exchange_flow_risk` |
| **module_name** | Exchange Flow Risk |
| **layer** | L1 — Health & Risk Signals |
| **purpose** | Detect abnormal token flows between exchanges and non-exchange wallets that may indicate distribution, accumulation, or liquidity stress. |

────────────────────────
## 2. Inputs
────────────────────────

### Required Fields
| Field | Type | Description |
|-------|------|-------------|
| `timestamp` | `number` | Unix timestamp of data snapshot |
| `exchangeInflow` | `number` | Tokens flowing INTO exchanges |
| `exchangeOutflow` | `number` | Tokens flowing OUT of exchanges |
| `netExchangeFlow` | `number` | `inflow - outflow` (positive = net inflow) |
| `circulatingSupply` | `number` | Total circulating supply |

### Optional Fields
| Field | Type | Description |
|-------|------|-------------|
| `historicalBaseline` | `{ avg30d: number; avg90d: number }` | Historical averages |
| `zScore` | `number` | Standard deviations from mean |
| `largeTransferCount` | `number` | Count of whale-size transfers |

### Rules
- ❌ Do NOT fetch data
- ❌ Do NOT call APIs
- ✅ All data injected via props/state

────────────────────────
## 3. Outputs
────────────────────────

### a. Raw Metrics (Researchers)

| Metric | Type |
|--------|------|
| `exchangeInflow` | `number` |
| `exchangeOutflow` | `number` |
| `netExchangeFlow` | `number` |
| `netFlowPctOfSupply` | `number` (calculated) |
| `historicalBaseline` | `object \| null` |
| `zScore` | `number \| null` |

### b. Derived Signals (Analysts)

| Signal | Values | Logic |
|--------|--------|-------|
| `netFlowDirection` | `'inflow' \| 'outflow' \| 'neutral'` | Based on sign of netExchangeFlow |
| `abnormalityLevel` | `'normal' \| 'elevated' \| 'extreme'` | Based on zScore thresholds |
| `flowVelocityChange` | `'increase' \| 'stable' \| 'decrease'` | Comparison to baseline |

### c. Neutral Summary

Template:
> "Net exchange flow is **{direction}** at **{X}%** of circulating supply. Flow abnormality is **{level}**."

- Descriptive only
- NO buy/sell recommendations
- NO bullish/bearish language

────────────────────────
## 4. Status Logic
────────────────────────

### Thresholds (PLACEHOLDER — configurable)

| Threshold | Value |
|-----------|-------|
| `NORMAL_FLOW_PCT` | < 0.5% |
| `WARNING_FLOW_PCT` | 0.5% – 2.0% |
| `FAIL_FLOW_PCT` | > 2.0% |
| `ELEVATED_ZSCORE` | > 1.5 |
| `EXTREME_ZSCORE` | > 3.0 |

### Status Determination

| Status | Condition |
|--------|-----------|
| **PASS** | `netFlowPct < 0.5%` AND `abnormalityLevel === 'normal'` |
| **WARNING** | `netFlowPct ≥ 0.5%` AND `netFlowPct ≤ 2%` OR `abnormalityLevel === 'elevated'` |
| **FAIL** | `netFlowPct > 2%` OR `abnormalityLevel === 'extreme'` |
| **INSUFFICIENT DATA** | Any required field missing or invalid |

> [!CAUTION]
> Never default to PASS. Missing data → INSUFFICIENT DATA.

────────────────────────
## 5. Visualization Rules
────────────────────────

- **Layout**: Vertical, fits inside L1 section
- **No internal scrolling**
- **Height constrained**: `max-height: 300px`
- **Collapsible**: Raw metrics hidden by default
- **No charts**: Text + badges only

### Visual Elements
1. Status badge (PASS/WARNING/FAIL/INSUFFICIENT DATA)
2. Flow direction indicator (↑ ↓ →)
3. Neutral summary sentence
4. Metrics grid (compact)
5. Collapsible raw data

────────────────────────
## 6. Failure Behavior
────────────────────────

| Condition | Behavior |
|-----------|----------|
| Missing `timestamp` | INSUFFICIENT DATA |
| Missing `exchangeInflow` or `exchangeOutflow` | INSUFFICIENT DATA |
| Missing `circulatingSupply` or = 0 | INSUFFICIENT DATA |
| Invalid numeric values (NaN, Infinity) | INSUFFICIENT DATA |

Display: "INSUFFICIENT DATA — Missing: {field names}"
