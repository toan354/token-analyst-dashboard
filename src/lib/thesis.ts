
import { DevAnalysisResult } from './dev-analysis';
import { FlowAnalysisResult } from './flow';
import { TreasuryAnalysis } from './treasury';

export interface Catalyst {
    description: string;
    isPrimary: boolean;
    status: 'PENDING' | 'OCCURRED' | 'MISSED';
}

export interface Thesis {
    statement: string;
    startDate: string; // ISO
    expiryDate: string; // ISO
    catalysts: Catalyst[];
    status: 'ACTIVE' | 'UNDER_PRESSURE' | 'EXPIRED' | 'INVALIDATED';
    confidence: number; // 0-100
    warnings: string[];
}

export function checkThesisStatus(
    thesis: Thesis,
    signals: {
        dev?: DevAnalysisResult;
        flow?: FlowAnalysisResult;
        treasury?: TreasuryAnalysis;
    }
): Thesis {
    const now = new Date();
    const expiry = new Date(thesis.expiryDate);
    const newWarnings: string[] = [];
    let status = thesis.status;
    let confidence = 80; // Base confidence

    // 1. Expiry Check
    if (now > expiry) {
        // Check if primary catalyst happened
        const primary = thesis.catalysts.find(c => c.isPrimary);
        if (primary && primary.status !== 'OCCURRED') {
            status = 'EXPIRED';
            newWarnings.push("Thesis Expired without Primary Catalyst occurring.");
            confidence = 0;
        }
    }

    // 2. Dev Signal
    if (signals.dev) {
        if (signals.dev.status === 'INACTIVE') {
            newWarnings.push("Dev Activity is DEAD. Thesis execution unlikely.");
            confidence -= 30;
            if (status === 'ACTIVE') status = 'UNDER_PRESSURE';
        } else if (signals.dev.status === 'WEAKENING') {
            newWarnings.push("Dev Activity is weakening.");
            confidence -= 10;
        }
    }

    // 3. Flow Signal
    if (signals.flow) {
        if (signals.flow.thesisStatus === 'INVALIDATED') {
            newWarnings.push("On-Chain Flows contradict thesis.");
            confidence -= 40;
            status = 'INVALIDATED';
        } else if (signals.flow.thesisStatus === 'WARNING') {
            newWarnings.push("On-Chain Flows show warning signs.");
            confidence -= 15;
            if (status === 'ACTIVE') status = 'UNDER_PRESSURE';
        }
    }

    // 4. Treasury Signal
    if (signals.treasury) {
        if (signals.treasury.riskLevel === 'CRITICAL') {
            newWarnings.push("Project has < 6 months runway. Survival risk dominates thesis.");
            confidence -= 50;
            if (status === 'ACTIVE') status = 'UNDER_PRESSURE';
        } else if (signals.treasury.riskLevel === 'CAUTION') {
            newWarnings.push("Short runway (< 12 mo). Execution risk elevated.");
            confidence -= 10;
        }
    }

    if (confidence < 0) confidence = 0;

    return {
        ...thesis,
        status,
        confidence,
        warnings: newWarnings
    };
}
