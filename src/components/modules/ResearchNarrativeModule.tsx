/**
 * ResearchNarrativeModule
 * 
 * Layer: L4 — Research Narrative
 * Type: Interpretive synthesis (READ-ONLY)
 * Verdict Authority: NONE
 * 
 * ════════════════════════════════════════════════════════════════
 * MODULE INTERFACE CONTRACT
 * ════════════════════════════════════════════════════════════════
 * 
 * PURPOSE:
 * Provide structured research interpretation based on existing
 * L1–L3 outputs. This module synthesizes behavioral observations
 * into coherent narratives without creating new signals or verdicts.
 * 
 * INPUTS (READ-ONLY):
 * - L1 statuses and summaries (risk health signals)
 * - L2 structural context summaries (risk modules)
 * - L3 behavioral summaries and regimes
 * 
 * RULES:
 * - Do NOT fetch data
 * - Do NOT compute new metrics
 * - Do NOT alter upstream logic
 * - Do NOT use buy/sell language
 * 
 * OUTPUTS:
 * a. Hypothesis Blocks
 * b. Narrative Summary (3-5 paragraphs)
 * c. Open Questions
 * 
 * FAILURE BEHAVIOR:
 * - If upstream data missing: explicitly state limitations
 * - Do NOT infer or speculate
 * ════════════════════════════════════════════════════════════════
 */

'use client';

import { useState } from 'react';

// ─────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────

export type L1Status = 'PASS' | 'WARNING' | 'FAIL' | 'INSUFFICIENT_DATA';

export interface L1Summary {
  overallStatus: L1Status;
  exchangeFlowStatus?: L1Status;
  supplyEmissionStatus?: L1Status;
  summary: string;
  notes?: string[];
}

export interface L2Context {
  exchangeFlowRisk?: {
    netFlowDirection: 'inflow' | 'outflow' | 'neutral';
    magnitudeDescription: string;
    zScoreContext?: string;
  };
  supplyEmissionRisk?: {
    inflationContext: string;
    unlockProximity: string;
    vestingPressure: string;
  };
}

export interface L3Behavioral {
  onChainFlow?: {
    dominantRegime: string;
    trendDescription: string;
    volatilityLevel: string;
  };
  exchangeVsNonExchange?: {
    dominantDestination: string;
    shiftTrend: string;
    flowIntensity: string;
  };
  whaleTransfer?: {
    activityLevel: string;
    destinationBias: string;
    activityRegime: string;
  };
}

export interface ResearchNarrativeInput {
  tokenSymbol: string;
  analysisDate: string;
  l1Summary?: L1Summary;
  l2Context?: L2Context;
  l3Behavioral?: L3Behavioral;
}

export interface HypothesisBlock {
  hypothesis: string;
  supportingObservations: Array<{
    observation: string;
    source: 'L1' | 'L2' | 'L3';
    module: string;
  }>;
  contradictoryEvidence?: Array<{
    observation: string;
    source: 'L1' | 'L2' | 'L3';
    module: string;
  }>;
}

export interface ResearchNarrativeProps {
  data?: ResearchNarrativeInput | null;
  isLoading?: boolean;
}

// ─────────────────────────────────────────────────
// Narrative Generation Logic
// ─────────────────────────────────────────────────

function generateHypotheses(input: ResearchNarrativeInput): HypothesisBlock[] {
  const hypotheses: HypothesisBlock[] = [];
  const { l1Summary, l2Context, l3Behavioral } = input;
  
  // Hypothesis 1: Flow-based behavioral interpretation
  if (l3Behavioral?.onChainFlow || l2Context?.exchangeFlowRisk) {
    const supporting: HypothesisBlock['supportingObservations'] = [];
    const contradicting: HypothesisBlock['contradictoryEvidence'] = [];
    
    let hypothesis = 'On-chain flow patterns suggest ';
    
    if (l2Context?.exchangeFlowRisk?.netFlowDirection === 'inflow') {
      hypothesis += 'increased token movement toward exchanges.';
      supporting.push({
        observation: `Net flow direction: ${l2Context.exchangeFlowRisk.magnitudeDescription}`,
        source: 'L2',
        module: 'ExchangeFlowRisk',
      });
    } else if (l2Context?.exchangeFlowRisk?.netFlowDirection === 'outflow') {
      hypothesis += 'increased token movement away from exchanges.';
      supporting.push({
        observation: `Net flow direction: ${l2Context.exchangeFlowRisk.magnitudeDescription}`,
        source: 'L2',
        module: 'ExchangeFlowRisk',
      });
    } else {
      hypothesis += 'neutral or balanced flow between exchange and non-exchange addresses.';
    }
    
    if (l3Behavioral?.onChainFlow) {
      supporting.push({
        observation: `Dominant regime: ${l3Behavioral.onChainFlow.dominantRegime}`,
        source: 'L3',
        module: 'OnChainFlowOverview',
      });
      supporting.push({
        observation: `Trend: ${l3Behavioral.onChainFlow.trendDescription}`,
        source: 'L3',
        module: 'OnChainFlowOverview',
      });
    }
    
    if (l3Behavioral?.exchangeVsNonExchange) {
      const destBias = l3Behavioral.exchangeVsNonExchange.dominantDestination;
      if (l2Context?.exchangeFlowRisk?.netFlowDirection === 'inflow' && destBias === 'non_exchange') {
        contradicting.push({
          observation: `Destination split shows non-exchange dominance despite inflow signal`,
          source: 'L3',
          module: 'ExchangeVsNonExchangeFlow',
        });
      } else {
        supporting.push({
          observation: `Dominant destination: ${destBias}`,
          source: 'L3',
          module: 'ExchangeVsNonExchangeFlow',
        });
      }
    }
    
    hypotheses.push({
      hypothesis,
      supportingObservations: supporting,
      contradictoryEvidence: contradicting.length > 0 ? contradicting : undefined,
    });
  }
  
  // Hypothesis 2: Large actor behavioral interpretation
  if (l3Behavioral?.whaleTransfer) {
    const supporting: HypothesisBlock['supportingObservations'] = [];
    
    const { activityLevel, destinationBias, activityRegime } = l3Behavioral.whaleTransfer;
    
    let hypothesis = 'Large holder activity has been ';
    hypothesis += activityLevel === 'high' ? 'elevated' : 
                  activityLevel === 'low' ? 'subdued' : 'moderate';
    hypothesis += `, with ${activityRegime} transfer patterns.`;
    
    supporting.push({
      observation: `Activity level: ${activityLevel}`,
      source: 'L3',
      module: 'WhaleTransferBehavior',
    });
    supporting.push({
      observation: `Activity regime: ${activityRegime}`,
      source: 'L3',
      module: 'WhaleTransferBehavior',
    });
    
    if (destinationBias !== 'mixed') {
      supporting.push({
        observation: `Destination bias: ${destinationBias}`,
        source: 'L3',
        module: 'WhaleTransferBehavior',
      });
    }
    
    hypotheses.push({
      hypothesis,
      supportingObservations: supporting,
    });
  }
  
  // Hypothesis 3: Supply structure interpretation
  if (l2Context?.supplyEmissionRisk) {
    const supporting: HypothesisBlock['supportingObservations'] = [];
    
    const { inflationContext, unlockProximity, vestingPressure } = l2Context.supplyEmissionRisk;
    
    let hypothesis = 'Supply dynamics indicate ';
    hypothesis += vestingPressure.toLowerCase().includes('high') || vestingPressure.toLowerCase().includes('elevated')
      ? 'potential near-term supply expansion considerations.'
      : 'relatively stable near-term supply conditions.';
    
    supporting.push({
      observation: `Inflation context: ${inflationContext}`,
      source: 'L2',
      module: 'SupplyEmissionRisk',
    });
    supporting.push({
      observation: `Unlock proximity: ${unlockProximity}`,
      source: 'L2',
      module: 'SupplyEmissionRisk',
    });
    supporting.push({
      observation: `Vesting pressure: ${vestingPressure}`,
      source: 'L2',
      module: 'SupplyEmissionRisk',
    });
    
    hypotheses.push({
      hypothesis,
      supportingObservations: supporting,
    });
  }
  
  return hypotheses;
}

function generateNarrativeParagraphs(input: ResearchNarrativeInput): string[] {
  const paragraphs: string[] = [];
  const { tokenSymbol, analysisDate, l1Summary, l2Context, l3Behavioral } = input;
  
  // Opening paragraph
  let opening = `This research narrative synthesizes on-chain behavioral data for ${tokenSymbol} as of ${analysisDate}. `;
  
  if (l1Summary) {
    opening += `The L1 health aggregator reports an overall status of ${l1Summary.overallStatus}. `;
    opening += l1Summary.summary;
  } else {
    opening += 'L1 health status data is not available for this analysis.';
  }
  paragraphs.push(opening);
  
  // Flow behavior paragraph
  if (l3Behavioral?.onChainFlow || l2Context?.exchangeFlowRisk) {
    let flowPara = 'Regarding on-chain flow behavior, ';
    
    if (l3Behavioral?.onChainFlow) {
      flowPara += `the dominant regime has been characterized as ${l3Behavioral.onChainFlow.dominantRegime}. `;
      flowPara += `${l3Behavioral.onChainFlow.trendDescription} `;
      flowPara += `Volatility has been ${l3Behavioral.onChainFlow.volatilityLevel}.`;
    }
    
    if (l3Behavioral?.exchangeVsNonExchange) {
      flowPara += ` When examining destination breakdown, ${l3Behavioral.exchangeVsNonExchange.dominantDestination} addresses have received the majority of flows. `;
      flowPara += `The shift trend has been ${l3Behavioral.exchangeVsNonExchange.shiftTrend}, with ${l3Behavioral.exchangeVsNonExchange.flowIntensity} intensity.`;
    }
    
    paragraphs.push(flowPara);
  }
  
  // Large holder paragraph
  if (l3Behavioral?.whaleTransfer) {
    const { activityLevel, destinationBias, activityRegime } = l3Behavioral.whaleTransfer;
    
    let whalePara = `Large holder (whale) transfer behavior shows ${activityLevel} activity levels. `;
    whalePara += `The activity regime has been ${activityRegime}, `;
    
    if (destinationBias === 'mixed') {
      whalePara += 'with transfers distributed between exchange and non-exchange destinations without clear bias.';
    } else {
      whalePara += `with a destination bias toward ${destinationBias} addresses.`;
    }
    
    paragraphs.push(whalePara);
  }
  
  // Supply context paragraph
  if (l2Context?.supplyEmissionRisk) {
    const { inflationContext, unlockProximity, vestingPressure } = l2Context.supplyEmissionRisk;
    
    let supplyPara = `From a supply structure perspective, ${inflationContext} `;
    supplyPara += `${unlockProximity} `;
    supplyPara += vestingPressure;
    
    paragraphs.push(supplyPara);
  }
  
  // Closing paragraph with limitations
  let closing = 'This narrative reflects observable on-chain behavior only and does not constitute investment advice. ';
  
  const missingData: string[] = [];
  if (!l1Summary) missingData.push('L1 health status');
  if (!l2Context?.exchangeFlowRisk) missingData.push('L2 exchange flow context');
  if (!l2Context?.supplyEmissionRisk) missingData.push('L2 supply emission context');
  if (!l3Behavioral?.onChainFlow) missingData.push('L3 on-chain flow behavior');
  if (!l3Behavioral?.exchangeVsNonExchange) missingData.push('L3 exchange vs non-exchange behavior');
  if (!l3Behavioral?.whaleTransfer) missingData.push('L3 whale transfer behavior');
  
  if (missingData.length > 0) {
    closing += `Data limitations: ${missingData.join(', ')} were not available for this analysis.`;
  } else {
    closing += 'All primary data sources were available for this analysis.';
  }
  
  paragraphs.push(closing);
  
  return paragraphs;
}

function generateOpenQuestions(input: ResearchNarrativeInput): string[] {
  const questions: string[] = [];
  const { l1Summary, l2Context, l3Behavioral } = input;
  
  // Questions based on what data would change interpretation
  if (l2Context?.exchangeFlowRisk?.netFlowDirection === 'inflow') {
    questions.push('Would sustained outflow reversal change the flow interpretation?');
  }
  
  if (l3Behavioral?.whaleTransfer?.activityRegime === 'bursty') {
    questions.push('Are the concentrated transfer bursts related to identifiable on-chain events?');
  }
  
  if (l3Behavioral?.exchangeVsNonExchange?.shiftTrend === 'rotating') {
    questions.push('What is driving the frequent shifts between exchange and non-exchange destination dominance?');
  }
  
  // Standard uncertainty questions
  questions.push('How do off-chain factors (market sentiment, regulatory news) correlate with observed on-chain behavior?');
  
  if (l2Context?.supplyEmissionRisk) {
    questions.push('Will upcoming token unlocks materialize as actual circulating supply or remain locked in secondary mechanisms?');
  }
  
  if (!l3Behavioral?.whaleTransfer) {
    questions.push('Large holder behavior data is not available — how does this affect behavioral interpretation?');
  }
  
  return questions.slice(0, 5); // Limit to 5 questions
}

// ─────────────────────────────────────────────────
// Scoped Styles
// ─────────────────────────────────────────────────

const styles = {
  container: {
    padding: '16px',
    backgroundColor: '#0a0a0a',
    borderRadius: '8px',
    border: '1px solid #27272a',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
    paddingBottom: '12px',
    borderBottom: '1px solid #27272a',
  },
  title: {
    fontSize: '1rem',
    fontWeight: 600,
    color: '#fafafa',
  },
  layerTag: {
    padding: '3px 8px',
    borderRadius: '4px',
    fontSize: '0.6875rem',
    fontWeight: 600,
    backgroundColor: '#1e3a5f',
    color: '#60a5fa',
    textTransform: 'uppercase' as const,
  },
  meta: {
    display: 'flex',
    gap: '12px',
    marginBottom: '16px',
    fontSize: '0.75rem',
    color: '#71717a',
  },
  metaItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  section: {
    marginBottom: '20px',
  },
  sectionLabel: {
    fontSize: '0.75rem',
    fontWeight: 600,
    color: '#71717a',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    marginBottom: '10px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  hypothesisCard: {
    padding: '12px',
    backgroundColor: '#18181b',
    borderRadius: '6px',
    marginBottom: '10px',
    borderLeft: '3px solid #3b82f6',
  },
  hypothesisText: {
    fontSize: '0.875rem',
    fontWeight: 500,
    color: '#e4e4e7',
    marginBottom: '8px',
  },
  evidenceList: {
    marginLeft: '12px',
    fontSize: '0.8125rem',
    color: '#a1a1aa',
  },
  evidenceItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '6px',
    marginBottom: '4px',
    lineHeight: 1.4,
  },
  sourceTag: {
    padding: '1px 4px',
    borderRadius: '2px',
    fontSize: '0.625rem',
    fontWeight: 600,
    backgroundColor: '#27272a',
    color: '#71717a',
    flexShrink: 0,
  },
  contradictorySection: {
    marginTop: '8px',
    paddingTop: '8px',
    borderTop: '1px dashed #3f3f46',
  },
  contradictoryLabel: {
    fontSize: '0.6875rem',
    color: '#f59e0b',
    fontWeight: 500,
    marginBottom: '4px',
  },
  narrativeText: {
    fontSize: '0.875rem',
    color: '#d4d4d8',
    lineHeight: 1.6,
    marginBottom: '12px',
  },
  questionList: {
    padding: '12px',
    backgroundColor: '#18181b',
    borderRadius: '6px',
  },
  questionItem: {
    fontSize: '0.8125rem',
    color: '#a1a1aa',
    marginBottom: '6px',
    paddingLeft: '12px',
    position: 'relative' as const,
  },
  questionBullet: {
    position: 'absolute' as const,
    left: 0,
    color: '#71717a',
  },
  collapsible: {
    cursor: 'pointer',
    userSelect: 'none' as const,
  },
  unavailable: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '120px',
    color: '#52525b',
    textAlign: 'center' as const,
  },
};

// ─────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────

export default function ResearchNarrativeModule({ data, isLoading }: ResearchNarrativeProps) {
  const [expandedSections, setExpandedSections] = useState({
    hypotheses: true,
    narrative: true,
    questions: true,
  });
  
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };
  
  if (isLoading) {
    return (
      <div style={styles.container}>
        <div style={styles.unavailable}>Synthesizing research narrative...</div>
      </div>
    );
  }
  
  if (!data) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <span style={styles.title}>Research Narrative</span>
          <span style={styles.layerTag}>L4 Research</span>
        </div>
        <div style={styles.unavailable}>
          <span style={{ fontWeight: 600, marginBottom: '4px' }}>NARRATIVE UNAVAILABLE</span>
          <span style={{ fontSize: '0.75rem' }}>No upstream data provided for synthesis</span>
        </div>
      </div>
    );
  }
  
  const hypotheses = generateHypotheses(data);
  const paragraphs = generateNarrativeParagraphs(data);
  const questions = generateOpenQuestions(data);
  
  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <span style={styles.title}>Research Narrative</span>
        <span style={styles.layerTag}>L4 Research</span>
      </div>
      
      {/* Meta */}
      <div style={styles.meta}>
        <div style={styles.metaItem}>
          <span style={{ color: '#52525b' }}>Token:</span>
          <span style={{ color: '#a1a1aa' }}>{data.tokenSymbol}</span>
        </div>
        <div style={styles.metaItem}>
          <span style={{ color: '#52525b' }}>Date:</span>
          <span style={{ color: '#a1a1aa' }}>{data.analysisDate}</span>
        </div>
        {data.l1Summary && (
          <div style={styles.metaItem}>
            <span style={{ color: '#52525b' }}>L1 Status:</span>
            <span style={{ 
              color: data.l1Summary.overallStatus === 'PASS' ? '#22c55e' :
                     data.l1Summary.overallStatus === 'WARNING' ? '#f59e0b' :
                     data.l1Summary.overallStatus === 'FAIL' ? '#ef4444' : '#71717a'
            }}>{data.l1Summary.overallStatus}</span>
          </div>
        )}
      </div>
      
      {/* Hypothesis Blocks */}
      <div style={styles.section}>
        <div 
          style={{ ...styles.sectionLabel, ...styles.collapsible }}
          onClick={() => toggleSection('hypotheses')}
        >
          <span>{expandedSections.hypotheses ? '▼' : '▶'}</span>
          <span>Hypothesis Blocks</span>
        </div>
        
        {expandedSections.hypotheses && hypotheses.map((h, idx) => (
          <div key={idx} style={styles.hypothesisCard}>
            <div style={styles.hypothesisText}>{h.hypothesis}</div>
            
            <div style={styles.evidenceList}>
              {h.supportingObservations.map((obs, oIdx) => (
                <div key={oIdx} style={styles.evidenceItem}>
                  <span style={styles.sourceTag}>{obs.source}</span>
                  <span>{obs.observation}</span>
                </div>
              ))}
            </div>
            
            {h.contradictoryEvidence && h.contradictoryEvidence.length > 0 && (
              <div style={styles.contradictorySection}>
                <div style={styles.contradictoryLabel}>Contradictory Evidence:</div>
                <div style={styles.evidenceList}>
                  {h.contradictoryEvidence.map((obs, oIdx) => (
                    <div key={oIdx} style={styles.evidenceItem}>
                      <span style={styles.sourceTag}>{obs.source}</span>
                      <span>{obs.observation}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
        
        {expandedSections.hypotheses && hypotheses.length === 0 && (
          <div style={{ color: '#52525b', fontSize: '0.8125rem', fontStyle: 'italic' }}>
            Insufficient data to generate hypotheses
          </div>
        )}
      </div>
      
      {/* Narrative Summary */}
      <div style={styles.section}>
        <div 
          style={{ ...styles.sectionLabel, ...styles.collapsible }}
          onClick={() => toggleSection('narrative')}
        >
          <span>{expandedSections.narrative ? '▼' : '▶'}</span>
          <span>Narrative Summary</span>
        </div>
        
        {expandedSections.narrative && paragraphs.map((para, idx) => (
          <p key={idx} style={styles.narrativeText}>{para}</p>
        ))}
      </div>
      
      {/* Open Questions */}
      <div style={styles.section}>
        <div 
          style={{ ...styles.sectionLabel, ...styles.collapsible }}
          onClick={() => toggleSection('questions')}
        >
          <span>{expandedSections.questions ? '▼' : '▶'}</span>
          <span>Open Questions</span>
        </div>
        
        {expandedSections.questions && (
          <div style={styles.questionList}>
            {questions.map((q, idx) => (
              <div key={idx} style={styles.questionItem}>
                <span style={styles.questionBullet}>?</span>
                {q}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────
// Example Data Export
// ─────────────────────────────────────────────────

export const EXAMPLE_NARRATIVE_INPUT: ResearchNarrativeInput = {
  tokenSymbol: 'ETH',
  analysisDate: '2024-01-14',
  l1Summary: {
    overallStatus: 'WARNING',
    exchangeFlowStatus: 'WARNING',
    supplyEmissionStatus: 'PASS',
    summary: 'Exchange flow metrics show elevated activity requiring attention.',
    notes: ['Data Confidence: High'],
  },
  l2Context: {
    exchangeFlowRisk: {
      netFlowDirection: 'inflow',
      magnitudeDescription: 'Moderate net inflow observed over the analysis period',
      zScoreContext: 'Within 1.5 standard deviations of historical baseline',
    },
    supplyEmissionRisk: {
      inflationContext: 'Current inflation rate is within expected parameters.',
      unlockProximity: 'Next significant unlock event is 45+ days away.',
      vestingPressure: 'Low vesting pressure observed.',
    },
  },
  l3Behavioral: {
    onChainFlow: {
      dominantRegime: 'inflow-trending',
      trendDescription: 'Flow has been trending toward exchanges with moderate intensity.',
      volatilityLevel: 'moderate',
    },
    exchangeVsNonExchange: {
      dominantDestination: 'exchange',
      shiftTrend: 'stable',
      flowIntensity: 'exchange-heavy',
    },
    whaleTransfer: {
      activityLevel: 'moderate',
      destinationBias: 'exchange',
      activityRegime: 'active',
    },
  },
};
