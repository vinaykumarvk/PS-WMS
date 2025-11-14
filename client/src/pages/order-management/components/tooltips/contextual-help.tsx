import { ReactNode, useState } from 'react';
import { HelpCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface ContextualHelpProps {
  content: string | ReactNode;
  children?: ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  className?: string;
  iconClassName?: string;
  variant?: 'default' | 'icon-only';
}

export function ContextualHelp({
  content,
  children,
  side = 'top',
  className,
  iconClassName,
  variant = 'default',
}: ContextualHelpProps) {
  const [open, setOpen] = useState(false);

  return (
    <TooltipProvider>
      <Tooltip open={open} onOpenChange={setOpen}>
        <TooltipTrigger asChild>
          {children || (
            <button
              type="button"
              className={cn(
                'inline-flex items-center justify-center',
                variant === 'icon-only' && 'h-4 w-4',
                className
              )}
              onClick={(e) => {
                e.preventDefault();
                setOpen(!open);
              }}
            >
              <HelpCircle className={cn('h-4 w-4 text-muted-foreground', iconClassName)} />
            </button>
          )}
        </TooltipTrigger>
        <TooltipContent side={side} className="max-w-xs">
          {typeof content === 'string' ? <p className="text-sm">{content}</p> : content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

interface HelpTextProps {
  text: string;
  helpContent: string | ReactNode;
  className?: string;
}

export function HelpText({ text, helpContent, className }: HelpTextProps) {
  return (
    <div className={cn('flex items-center gap-1', className)}>
      <span>{text}</span>
      <ContextualHelp content={helpContent} variant="icon-only" />
    </div>
  );
}

