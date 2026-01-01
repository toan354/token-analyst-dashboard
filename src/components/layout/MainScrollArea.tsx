/**
 * MainScrollArea - ONLY scrollable container in the app
 * 
 * STRICT RULES:
 * - flex: 1 to fill remaining space
 * - overflow-y: auto for vertical scroll
 * - overflow-x: hidden (no horizontal scroll)
 * - This is the ONLY component allowed to scroll
 */

import { ReactNode } from 'react';

interface MainScrollAreaProps {
  children: ReactNode;
}

export default function MainScrollArea({ children }: MainScrollAreaProps) {
  return (
    <main className="main-scroll-area">
      {children}
    </main>
  );
}
