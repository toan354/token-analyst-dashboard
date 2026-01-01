/**
 * L4 - Research Deep Dive
 * 
 * Purpose: Extended analysis for researchers
 * Content: Narrative blocks, hypotheses, correlations
 */

interface NarrativeBlock {
  title: string;
  content: string;
}

interface L4Props {
  narratives?: NarrativeBlock[];
}

const defaultNarratives: NarrativeBlock[] = [
  { 
    title: 'Primary Thesis', 
    content: 'No thesis defined. Add your investment hypothesis here.' 
  },
  { 
    title: 'Key Correlations', 
    content: 'No correlations identified. Analyze relationships between metrics.' 
  },
  { 
    title: 'Risk Factors', 
    content: 'No risk factors documented. Identify potential downside scenarios.' 
  },
];

export default function L4_ResearchDeepDive({ narratives = defaultNarratives }: L4Props) {
  return (
    <section className="dashboard-section">
      <div className="section-header">
        <span className="section-label">L4</span>
        <span className="section-title">Research Deep Dive</span>
      </div>
      <div className="section-content">
        {narratives.length === 0 ? (
          <div className="empty-state">No research notes available</div>
        ) : (
          <div className="flex-col" style={{ gap: '16px' }}>
            {narratives.map((block, idx) => (
              <div key={idx} style={{ 
                padding: '12px', 
                backgroundColor: '#0f0f0f', 
                borderRadius: '4px',
                borderLeft: '3px solid #3b82f6'
              }}>
                <h3 style={{ 
                  fontSize: '0.875rem', 
                  fontWeight: 600, 
                  color: '#fafafa', 
                  marginBottom: '8px' 
                }}>
                  {block.title}
                </h3>
                <p style={{ color: '#a1a1aa', lineHeight: 1.6 }}>
                  {block.content}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
