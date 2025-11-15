import { Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { ClientAttentionReason } from "@shared/types/insights";

interface InsightBadgeProps {
  reasons: ClientAttentionReason[] | undefined;
  className?: string;
}

const severityClassMap: Record<ClientAttentionReason["severity"], string> = {
  info: "bg-muted text-foreground border-border/60",
  warning: "bg-amber-100 text-amber-900 border-amber-200 dark:bg-amber-900/40 dark:text-amber-100 dark:border-amber-500/30",
  critical: "bg-destructive/10 text-destructive border-destructive/40",
};

export function InsightBadge({ reasons, className }: InsightBadgeProps) {
  if (!reasons || reasons.length === 0) return null;

  const [primary, ...rest] = reasons;
  const moreCount = rest.length;

  const badgeContent = (
    <Badge
      className={cn(
        "gap-1 px-2 py-1 text-xs font-medium leading-tight",
        severityClassMap[primary.severity],
        className
      )}
      variant="outline"
    >
      <Sparkles className="h-3.5 w-3.5" />
      <span className="truncate max-w-[12rem]" title={primary.message}>
        {primary.message}
      </span>
      {moreCount > 0 && <span className="text-muted-foreground/80">+{moreCount}</span>}
    </Badge>
  );

  if (moreCount === 0) {
    return badgeContent;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{badgeContent}</TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <div className="space-y-1">
            {reasons.map((reason, index) => (
              <div key={`${reason.category}-${index}`} className="text-xs leading-snug">
                {reason.message}
              </div>
            ))}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
