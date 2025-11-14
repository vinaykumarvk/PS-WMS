/**
 * Quick Invest Button Component
 * Module A: Quick Order Placement
 * Floating action button for quick order placement
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickInvestButtonProps {
  onClick: () => void;
  className?: string;
  disabled?: boolean;
}

export default function QuickInvestButton({
  onClick,
  className,
  disabled = false,
}: QuickInvestButtonProps) {
  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      size="lg"
      className={cn(
        'fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all',
        'bg-primary hover:bg-primary/90',
        'flex items-center justify-center',
        className
      )}
      aria-label="Quick Invest"
    >
      <Zap className="h-6 w-6" />
    </Button>
  );
}

