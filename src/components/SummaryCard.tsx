import React from 'react';

type CardVariant = 'success' | 'warning' | 'danger' | 'neutral' | 'empty';

interface SummaryCardProps {
  title: string;
  value: React.ReactNode;
  variant?: CardVariant;
  className?: string;
}

export default function SummaryCard({ title, value, variant = 'neutral', className = '' }: SummaryCardProps) {
  const getVariantStyles = (v: CardVariant) => {
    switch (v) {
      case 'success':
        return {
          container: 'bg-green-900/10 border-green-500/30',
          text: 'text-green-400',
        };
      case 'warning':
        return {
          container: 'bg-yellow-900/10 border-yellow-500/30',
          text: 'text-yellow-400',
        };
      case 'danger':
        return {
          container: 'bg-red-900/10 border-red-500/30',
          text: 'text-red-400',
        };
      case 'empty':
        return {
          container: 'border-dashed border-slate-700',
          text: 'text-gray-500',
        };
      case 'neutral':
      default:
        return {
          container: 'bg-slate-800 border-slate-700',
          text: 'text-white',
        };
    }
  };

  const styles = getVariantStyles(variant);

  return (
    <div className={`p-4 rounded-lg border h-full flex flex-col justify-center ${styles.container} ${className}`}>
      <div className="text-xs uppercase tracking-wider mb-1 font-semibold text-gray-400">
        {title}
      </div>
      <div className={`text-lg font-bold ${styles.text}`}>
        {value}
      </div>
    </div>
  );
}
