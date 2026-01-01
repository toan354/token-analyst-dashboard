'use server';

import { JsonRpcProvider } from 'ethers';
import fs from 'fs/promises';
import path from 'path';

export interface BlockActivity {
  blockNumber: number;
  txCount: number;
  uniqueSenders: number;
  timestamp: number;
}

export interface ActivityReport {
  blocks: BlockActivity[];
  totalTransactions: number;
  averageTxPerBlock: number;
  estimatedUniqueUsers: number;
  lastUpdated: string;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'chain_activity.json');

import { DEFAULT_RPC } from './constants';
// const DEFAULT_RPC = ... removed
const HISTORY_FILE = path.join(DATA_DIR, 'history_log.json');

export interface HistoryEntry {
  timestamp: number;
  txCount: number;
  uniqueSenders: number;
  avgTxPerBlock: number;
}

export async function fetchAndAnalyzeBlocks(count: number = 20): Promise<ActivityReport> {
  // ... (existing logic)
  const safeCount = Math.min(count, 50); 
  // ... (fetching logic blocks)
  
  const provider = new JsonRpcProvider(DEFAULT_RPC);
  const latestBlock = await provider.getBlockNumber();
  
  const activities: BlockActivity[] = [];
  const uniqueAddresses = new Set<string>();
  let totalTx = 0;

  for (let i = 0; i < safeCount; i += 5) {
      // ... same fetching logic as before ...
    const promises = [];
    for (let j = 0; j < 5 && (i + j) < safeCount; j++) {
       promises.push(provider.getBlock(latestBlock - (i + j), true)); 
    }
    
    const blocks = await Promise.all(promises);
    
    for (const block of blocks) {
      if (!block) continue;
      
      const senders = new Set<string>();
      for (const tx of block.prefetchedTransactions) {
          if (tx && tx.from) { 
             senders.add(tx.from);
             uniqueAddresses.add(tx.from);
          }
      }

      activities.push({
        blockNumber: block.number,
        timestamp: block.timestamp,
        txCount: block.prefetchedTransactions.length,
        uniqueSenders: senders.size
      });
      
      totalTx += block.prefetchedTransactions.length;
    }
  }

  activities.sort((a, b) => a.blockNumber - b.blockNumber);

  const report: ActivityReport = {
    blocks: activities,
    totalTransactions: totalTx,
    averageTxPerBlock: totalTx / activities.length,
    estimatedUniqueUsers: uniqueAddresses.size,
    lastUpdated: new Date().toISOString()
  };

  await saveReport(report);
  
  // NEW: Save to history
  await saveHistory({
      timestamp: Date.now(),
      txCount: totalTx,
      uniqueSenders: uniqueAddresses.size,
      avgTxPerBlock: totalTx / activities.length
  });

  return report;
}

async function saveReport(report: ActivityReport) {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(DATA_FILE, JSON.stringify(report, null, 2));
  } catch (error) {
    console.error('Failed to save activity report:', error);
  }
}

async function saveHistory(entry: HistoryEntry) {
    try {
        let history: HistoryEntry[] = [];
        try {
            const data = await fs.readFile(HISTORY_FILE, 'utf-8');
            history = JSON.parse(data);
        } catch {
            // File doesn't exist yet
        }
        
        history.push(entry);
        // Keep last 50 entries
        if (history.length > 50) history = history.slice(-50);
        
        await fs.writeFile(HISTORY_FILE, JSON.stringify(history, null, 2));
    } catch (e) {
        console.error("Failed to save history", e);
    }
}

export async function getHistory(): Promise<HistoryEntry[]> {
    try {
        const data = await fs.readFile(HISTORY_FILE, 'utf-8');
        return JSON.parse(data);
    } catch {
        return [];
    }
}

export async function getStoredReport(): Promise<ActivityReport | null> {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return null;
  }
}
