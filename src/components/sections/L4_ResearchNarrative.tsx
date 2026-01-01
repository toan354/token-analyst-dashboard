/**
 * L4 Research Narrative Section
 * 
 * Layer: L4 — Research Narrative
 * Purpose: Section wrapper for the Research Narrative Module
 */

'use client';

import ResearchNarrativeModule, { 
  ResearchNarrativeInput,
  EXAMPLE_NARRATIVE_INPUT,
} from '@/components/modules/ResearchNarrativeModule';

interface L4ResearchNarrativeProps {
  data?: ResearchNarrativeInput | null;
  isLoading?: boolean;
  useMockData?: boolean;
}

export default function L4_ResearchNarrative({ 
  data, 
  isLoading = false,
  useMockData = true,
}: L4ResearchNarrativeProps) {
  // Use provided data or fall back to example
  const narrativeData = data ?? (useMockData ? EXAMPLE_NARRATIVE_INPUT : null);
  
  return (
    <section style={{ marginBottom: '24px' }}>
      <h2 style={{ 
        fontSize: '1.125rem', 
        fontWeight: 600, 
        color: '#fafafa',
        marginBottom: '12px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}>
        <span style={{ 
          padding: '2px 6px',
          borderRadius: '4px',
          fontSize: '0.625rem',
          fontWeight: 600,
          backgroundColor: '#1e3a5f',
          color: '#60a5fa',
        }}>L4</span>
        Research Narrative
      </h2>
      
      <ResearchNarrativeModule 
        data={narrativeData}
        isLoading={isLoading}
      />
    </section>
  );
}

export { EXAMPLE_NARRATIVE_INPUT };
