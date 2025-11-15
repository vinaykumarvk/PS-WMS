import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, TrendingUp, ChevronDown, ChevronRight, CheckSquare } from "lucide-react";
import type { ActionItemCategory, NormalizedActionItem, OrchestratedActionItems } from "@/types/dashboard";

interface ActionItemsPrioritiesProps {
  data?: OrchestratedActionItems;
  isLoading?: boolean;
}

const iconMap: Record<ActionItemCategory["key"], typeof Calendar> = {
  task: Clock,
  appointment: Calendar,
  portfolioDelta: TrendingUp,
};

const priorityBadgeMap: Record<NormalizedActionItem["priority"], string> = {
  critical: "bg-destructive/10 text-destructive border-destructive/40",
  high: "bg-amber-100 text-amber-800 dark:bg-amber-400/20 dark:text-amber-200 border-amber-200/50",
  medium: "bg-blue-100 text-blue-700 dark:bg-blue-400/20 dark:text-blue-200 border-blue-200/50",
  low: "bg-slate-100 text-slate-700 dark:bg-slate-500/10 dark:text-slate-300 border-slate-200/50",
};

function formatDate(value?: string) {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function renderItemDetails(item: NormalizedActionItem) {
  switch (item.type) {
    case "task":
      return (
        <div className="text-xs text-muted-foreground space-y-1">
          {item.meta.dueDate && (
            <div>
              <span className="font-medium text-foreground">Due:</span> {formatDate(item.meta.dueDate)}
            </div>
          )}
          {item.meta.priorityLabel && (
            <div>
              <span className="font-medium text-foreground">Priority:</span> {item.meta.priorityLabel}
            </div>
          )}
          {item.details && <p>{item.details}</p>}
        </div>
      );
    case "appointment":
      return (
        <div className="text-xs text-muted-foreground space-y-1">
          {item.meta.dueDate && (
            <div>
              <span className="font-medium text-foreground">Start:</span> {formatDate(item.meta.dueDate)}
            </div>
          )}
          {item.meta.location && (
            <div>
              <span className="font-medium text-foreground">Location:</span> {item.meta.location}
            </div>
          )}
          {item.details && <p>{item.details}</p>}
        </div>
      );
    case "portfolioDelta":
      return (
        <div className="text-xs text-muted-foreground space-y-1">
          {item.meta.delta && (
            <div>
              <span className="font-medium text-foreground">Impact:</span> {item.meta.delta.summary}
            </div>
          )}
          {item.meta.timeframe && (
            <div>
              <span className="font-medium text-foreground">Window:</span> {item.meta.timeframe}
            </div>
          )}
          {item.details && <p>{item.details}</p>}
        </div>
      );
    default:
      return item.details ? <p className="text-xs text-muted-foreground">{item.details}</p> : null;
  }
}

export function ActionItemsPriorities({ data, isLoading }: ActionItemsPrioritiesProps) {
  const categories = data?.categories ?? [];
  const [isOpen, setIsOpen] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [showMoreItems, setShowMoreItems] = useState<Set<string>>(new Set());

  const totalCount = categories.reduce((sum, category) => sum + category.totalCount, 0);

  if (isLoading) {
    return (
      <Card className="bg-card text-card-foreground border-unified">
        <CardHeader>
          <CardTitle className="text-lg">Priorities are loading…</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {[1, 2, 3].map((idx) => (
            <div key={idx} className="h-10 rounded bg-muted animate-pulse" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card text-card-foreground border-unified transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 transform hover:scale-[1.01] interactive-hover">
      <CardHeader className="hover:bg-muted/50 dark:hover:bg-muted/30 transition-all duration-300">
        <button
          type="button"
          className="w-full flex items-center justify-between text-left focus:outline-none"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-expanded={isOpen}
          aria-controls="action-items-priorities-content"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg brand-accent-bg-subtle transition-all duration-300 hover:bg-primary/20 hover:scale-110 interactive-scale">
              <CheckSquare size={20} className="brand-accent transition-all duration-300" />
            </div>
            <div>
              <CardTitle className="text-lg transition-colors duration-300 brand-accent-subtle">Action Items &amp; Priorities</CardTitle>
              <p className="text-xs text-muted-foreground">{totalCount} orchestrated signals</p>
            </div>
          </div>
          {isOpen ? (
            <ChevronDown size={20} className="transition-all duration-300 brand-accent" />
          ) : (
            <ChevronRight size={20} className="transition-all duration-300 text-muted-foreground hover:text-primary brand-accent-subtle" />
          )}
        </button>
      </CardHeader>

      <div id="action-items-priorities-content" className={isOpen ? "block" : "hidden"}>
        <CardContent className="space-y-4 pt-0">
          {totalCount === 0 && (
            <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
              Nothing urgent right now. Enjoy the momentum!
            </div>
          )}

          {categories.map((category) => {
            if (category.totalCount === 0) return null;
            const isExpanded = expandedCategories.has(category.key);
            const IconComponent = iconMap[category.key];
            const items = showMoreItems.has(category.key)
              ? category.items
              : category.items.slice(0, 5);

            return (
              <div key={category.key} className="rounded-lg border border-border p-3 sm:p-4 bg-muted/30 hover:bg-muted/50 transition-all duration-300">
                <button
                  type="button"
                  className="w-full flex items-center justify-between p-0 h-auto hover:bg-transparent focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-md"
                  onClick={() => {
                    setExpandedCategories((prev) => {
                      const next = new Set(prev);
                      if (next.has(category.key)) next.delete(category.key);
                      else next.add(category.key);
                      return next;
                    });
                  }}
                  aria-expanded={isExpanded}
                  aria-controls={`category-${category.key}-content`}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-lg bg-background/60 text-primary">
                      <IconComponent size={18} />
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold text-sm text-foreground leading-tight">{category.title}</h3>
                      <p className="text-xl font-bold text-foreground leading-tight tracking-tight">{category.totalCount}</p>
                    </div>
                  </div>
                  {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>

                <div id={`category-${category.key}-content`} className={`mt-3 ${isExpanded ? "block" : "hidden"}`}>
                  <p className="text-sm text-muted-foreground mb-3">{category.description}</p>
                  <div className="space-y-2">
                    {items.map((item) => {
                      const isItemExpanded = expandedItems.has(item.id);
                      return (
                        <div key={item.id} className="bg-background border border-border rounded overflow-hidden">
                          <Button
                            variant="ghost"
                            className="w-full p-3 h-auto justify-start text-foreground hover:bg-accent/20"
                            onClick={() => {
                              setExpandedItems((prev) => {
                                const next = new Set(prev);
                                if (next.has(item.id)) next.delete(item.id);
                                else next.add(item.id);
                                return next;
                              });
                            }}
                          >
                            <div className="flex flex-col items-start gap-1 w-full text-left">
                              <div className="flex items-center gap-2">
                                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${priorityBadgeMap[item.priority]}`}>
                                  {item.priority.toUpperCase()}
                                </span>
                                {item.meta.clientName && (
                                  <span className="text-xs text-muted-foreground">{item.meta.clientName}</span>
                                )}
                              </div>
                              <div className="font-medium text-sm text-foreground">
                                {item.title}
                              </div>
                              {item.subtitle && (
                                <div className="text-xs text-muted-foreground">{item.subtitle}</div>
                              )}
                            </div>
                          </Button>

                          {isItemExpanded && (
                            <div className="px-4 pb-3">
                              {renderItemDetails(item)}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {category.items.length > 5 && (
                    <div className="mt-3 pt-2 border-t border-border">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setShowMoreItems((prev) => {
                            const next = new Set(prev);
                            if (next.has(category.key)) next.delete(category.key);
                            else next.add(category.key);
                            return next;
                          });
                        }}
                        className="w-full text-xs text-muted-foreground hover:text-foreground"
                      >
                        {showMoreItems.has(category.key)
                          ? `Show Less (showing ${category.items.length})`
                          : `Show More (${category.items.length - 5} more)`}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </div>
    </Card>
  );
}
