# How to Read L1 Statuses

> Quick reference guide for analysts interpreting L1 — Health & Risk Signals.

---

## At a Glance

| Status | What It Means | What To Do |
|--------|---------------|------------|
| **PASS** | No structural issues detected | Continue normal analysis |
| **WARNING** | Emerging risk or deviation | Monitor closely, investigate |
| **FAIL** | Structural risk present | Prioritize investigation |
| **INSUFFICIENT_DATA** | Cannot evaluate | Wait for data or check source |

---

## Key Points

### PASS
- Metrics are within normal ranges
- No red flags from this module
- Does NOT mean "safe" — just no issues detected here

### WARNING
- Something is deviating from baseline
- Risk may be building up
- Worth investigating before it escalates

### FAIL
- A structural threshold has been breached
- Risk exists regardless of market direction
- Should be investigated immediately

### INSUFFICIENT_DATA
- Required data is missing or stale
- Module cannot make a determination
- This is NOT a neutral state — treat it seriously

---

## What Status Does NOT Tell You

❌ Whether price will go up or down  
❌ Whether to buy or sell  
❌ Whether the asset is "good" or "bad"  
❌ Investment recommendations of any kind

---

## Reading Multiple Modules

When multiple L1 modules have different statuses:

- **Any FAIL** → Investigate that module first
- **Multiple WARNINGs** → Compound risk, elevated priority
- **All PASS** → Proceed to L2+ analysis
- **Any INSUFFICIENT_DATA** → Note the gap, don't assume PASS
