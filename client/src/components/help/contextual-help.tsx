/**
 * Contextual Help Component
 * Provides contextual help tooltips and information based on current context
 */

import React, { useState, useEffect } from 'react';
import { HelpCircle, X } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface HelpContent {
  title: string;
  description: string;
  tips?: string[];
  links?: { label: string; href: string }[];
}

interface ContextualHelpProps {
  content: HelpContent;
  variant?: 'tooltip' | 'popover' | 'inline';
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
  triggerClassName?: string;
}

export function ContextualHelp({
  content,
  variant = 'tooltip',
  position = 'top',
  className,
  triggerClassName,
}: ContextualHelpProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (variant === 'inline') {
    return (
      <Card className={cn('border-dashed', className)}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <HelpCircle className="h-4 w-4 text-muted-foreground" />
              {content.title}
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">{content.description}</p>
          {content.tips && content.tips.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Tips:</p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                {content.tips.map((tip, index) => (
                  <li key={index}>{tip}</li>
                ))}
              </ul>
            </div>
          )}
          {content.links && content.links.length > 0 && (
            <div className="space-y-2 pt-2 border-t">
              <p className="text-sm font-medium">Learn more:</p>
              <div className="flex flex-wrap gap-2">
                {content.links.map((link, index) => (
                  <Button
                    key={index}
                    variant="link"
                    size="sm"
                    className="h-auto p-0 text-xs"
                    onClick={() => {
                      window.location.hash = link.href;
                    }}
                  >
                    {link.label}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  if (variant === 'popover') {
    return (
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={cn('h-5 w-5', triggerClassName)}
            aria-label="Help"
          >
            <HelpCircle className="h-4 w-4 text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" side={position}>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <HelpCircle className="h-4 w-4 text-muted-foreground" />
              <h4 className="font-semibold text-sm">{content.title}</h4>
            </div>
            <p className="text-sm text-muted-foreground">{content.description}</p>
            {content.tips && content.tips.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium">Tips:</p>
                <ul className="list-disc list-inside space-y-1 text-xs text-muted-foreground">
                  {content.tips.map((tip, index) => (
                    <li key={index}>{tip}</li>
                  ))}
                </ul>
              </div>
            )}
            {content.links && content.links.length > 0 && (
              <div className="space-y-2 pt-2 border-t">
                <p className="text-xs font-medium">Learn more:</p>
                <div className="flex flex-col gap-1">
                  {content.links.map((link, index) => (
                    <Button
                      key={index}
                      variant="link"
                      size="sm"
                      className="h-auto p-0 text-xs justify-start"
                      onClick={() => {
                        window.location.hash = link.href;
                        setIsOpen(false);
                      }}
                    >
                      {link.label}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  // Default: tooltip variant
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={cn('h-5 w-5', triggerClassName)}
            aria-label="Help"
          >
            <HelpCircle className="h-4 w-4 text-muted-foreground" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side={position} className="max-w-xs">
          <div className="space-y-2">
            <p className="font-semibold text-xs">{content.title}</p>
            <p className="text-xs">{content.description}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Hook to get contextual help content based on current route/context
 */
export function useContextualHelp(context: string): HelpContent | null {
  const helpContent: Record<string, HelpContent> = {
    'dashboard': {
      title: 'Dashboard Overview',
      description: 'Your dashboard provides a comprehensive view of your business metrics, recent clients, and quick actions.',
      tips: [
        'Use quick actions to perform common tasks',
        'Check business metrics regularly to track performance',
        'Review recent clients to stay on top of activity',
      ],
      links: [
        { label: 'View Clients', href: '/clients' },
        { label: 'Order Management', href: '/order-management' },
      ],
    },
    'clients': {
      title: 'Client Management',
      description: 'Manage all your clients from this page. Add new clients, view details, and track their portfolios.',
      tips: [
        'Use search to quickly find clients',
        'Click on a client card to view full details',
        'Use filters to organize your client list',
      ],
      links: [
        { label: 'Add New Client', href: '/clients/add' },
        { label: 'Dashboard', href: '/' },
      ],
    },
    'order-management': {
      title: 'Order Management',
      description: 'Create and manage investment orders for your clients. Place quick orders or build complex portfolios.',
      tips: [
        'Use quick order for simple transactions',
        'Review your cart before submitting',
        'Check portfolio impact before placing orders',
      ],
      links: [
        { label: 'View Clients', href: '/clients' },
        { label: 'Products', href: '/products' },
      ],
    },
  };

  return helpContent[context] || null;
}

