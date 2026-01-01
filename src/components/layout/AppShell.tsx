/**
 * AppShell - Root layout container
 * 
 * STRICT RULES:
 * - ONLY component allowed to use height: 100vh
 * - Children: GlobalHeader, ContextBar (optional), MainScrollArea
 * - NO modifications to this structure without approval
 */

import { ReactNode } from 'react';
import GlobalHeader from './GlobalHeader';
import ContextBar from './ContextBar';
import MainScrollArea from './MainScrollArea';

interface AppShellProps {
  children: ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  return (
    <div className="app-shell">
      <GlobalHeader />
      <ContextBar />
      <MainScrollArea>
        {children}
      </MainScrollArea>
    </div>
  );
}
