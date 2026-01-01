/**
 * Main Dashboard Page
 * 
 * Uses AppShell as the root layout container.
 * All sections (L0–L5) are rendered inside MainScrollArea.
 */

import AppShell from '@/components/layout/AppShell';
import L0_ExecutiveOverview from '@/components/sections/L0_ExecutiveOverview';
import L1_HealthRiskSignals from '@/components/sections/L1_HealthRiskSignals';
import L2_StructuralMetrics from '@/components/sections/L2_StructuralMetrics';
import L3_BehavioralFlow from '@/components/sections/L3_BehavioralFlow';
import L4_ResearchDeepDive from '@/components/sections/L4_ResearchDeepDive';
import L5_RawDiagnostics from '@/components/sections/L5_RawDiagnostics';

export default function Home() {
  return (
    <AppShell>
      {/* L0 — Executive Overview */}
      <L0_ExecutiveOverview />
      
      {/* L1 — Health & Risk Signals */}
      <L1_HealthRiskSignals />
      
      {/* L2 — Structural Metrics */}
      <L2_StructuralMetrics />
      
      {/* L3 — Behavioral / Flow */}
      <L3_BehavioralFlow />
      
      {/* L4 — Research Deep Dive */}
      <L4_ResearchDeepDive />
      
      {/* L5 — Raw & Diagnostics */}
      <L5_RawDiagnostics />
    </AppShell>
  );
}
