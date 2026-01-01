
import { TokenData } from './types';
import { ZombieStatus } from './zombie';

export type TrackObj = 'TRACK_A' | 'TRACK_B' | 'TRACK_C';

export interface ClassificationInput {
    isProductLive: boolean; // Manual
    isRevenueOnChain: boolean; // Manual
    tokenData: TokenData | null;
    activityStatus: ZombieStatus;
}

export interface ClassificationResult {
    track: TrackObj;
    reason: string;
    description: string;
}

export function classifyTrack(input: ClassificationInput): ClassificationResult {
    const { tokenData, isProductLive, activityStatus } = input;

    // Fail-safe: Missing data defaults to Track C (Risk)
    if (!tokenData || !input) {
        return {
            track: 'TRACK_C',
            reason: 'Insufficient Data',
            description: 'Missing market data or product status. Defaulting to high risk.'
        };
    }

    const mCap = tokenData.market_cap;
    const vol = tokenData.total_volume;

    // TRACK A: Value / Established
    // MCap >= 500M, Vol >= 10M, Stable Activity, Product Live
    if (
        mCap >= 500_000_000 &&
        vol >= 10_000_000 &&
        activityStatus !== 'ZOMBIE_RISK' && // Stable/Healthy or even Weakening but not dead
        isProductLive
    ) {
        return {
            track: 'TRACK_A',
            reason: 'High Valuation & Stable',
            description: 'Mature project with >$500M MCap, deep liquidity, and live product. Focus: Sustainability.'
        };
    }

    // TRACK B: Growth / Scaling
    // MCap 20M-500M, Healthy Activity, Product Live
    if (
        mCap >= 20_000_000 && 
        mCap < 500_000_000 &&
        activityStatus === 'HEALTHY' && // Strictly healthy for growth track
        isProductLive
    ) {
        return {
            track: 'TRACK_B',
            reason: 'Mid-Cap Growth',
            description: 'Scaling phase ($20M-$500M) with confirmed healthy user activity and live product.'
        };
    }

    // TRACK C: Alpha / Early Stage
    // Anything else (Low MCap, No Product, or Bad Activity)
    let reason = 'High Risk Factors';
    if (mCap < 20_000_000) reason = 'Microcap (<$20M)';
    else if (!isProductLive) reason = 'Product Not Live';
    else if (activityStatus === 'ZOMBIE_RISK') reason = 'Zombie Activity Risk';
    else if (activityStatus === 'WEAKENING') reason = 'Declining Activity';

    return {
        track: 'TRACK_C',
        reason,
        description: 'Early stage or distressed. High uncertainty. Focus: Team & Execution.'
    };
}
