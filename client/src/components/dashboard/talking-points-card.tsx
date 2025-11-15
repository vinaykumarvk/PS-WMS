import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { formatDistanceToNow } from "date-fns";
import {
  ChevronRight,
  ChevronDown,
  TrendingUp,
  AlertTriangle,
  Building,
  Globe,
  Lightbulb,
  RefreshCcw,
} from "lucide-react";
import type { TalkingPoint } from "@/types/talking-point";

const categoryIcons = {
  market_analysis: TrendingUp,
  regulatory_update: AlertTriangle,
  company_news: Building,
  economic_indicator: Globe,
  investment_strategy: Lightbulb,
};

export function TalkingPointsCard() {
  const [isOpen, setIsOpen] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const { data: talkingPoints = [], isLoading, refetch } = useQuery({
    queryKey: ['/api/talking-points'],
  });

  const enhancedPoints = Array.isArray(talkingPoints) ? (talkingPoints as TalkingPoint[]) : [];
  const activePoints = enhancedPoints.filter((point) => !point.auto_archived);

  // Group talking points by category
  const groupedPoints = activePoints.reduce((groups: Record<string, TalkingPoint[]>, point) => {
    const category = point.category || 'general';
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(point);
    return groups;
  }, {} as Record<string, TalkingPoint[]>);

  const categories = {
    market_analysis: {
      title: 'Market Analysis',
      color: 'text-foreground',
      bgColor: 'bg-accent border-border',
      count: groupedPoints.market_analysis?.length || 0,
      items: groupedPoints.market_analysis || []
    },
    regulatory_update: {
      title: 'Regulatory Updates',
      color: 'text-foreground',
      bgColor: 'bg-accent border-border',
      count: groupedPoints.regulatory_update?.length || 0,
      items: groupedPoints.regulatory_update || []
    },
    company_news: {
      title: 'Company News',
      color: 'text-foreground',
      bgColor: 'bg-accent border-border',
      count: groupedPoints.company_news?.length || 0,
      items: groupedPoints.company_news || []
    },
    economic_indicator: {
      title: 'Economic Indicators',
      color: 'text-foreground',
      bgColor: 'bg-accent border-border',
      count: groupedPoints.economic_indicator?.length || 0,
      items: groupedPoints.economic_indicator || []
    },
    investment_strategy: {
      title: 'Investment Strategy',
      color: 'text-foreground',
      bgColor: 'bg-accent border-border',
      count: groupedPoints.investment_strategy?.length || 0,
      items: groupedPoints.investment_strategy || []
    }
  };

  const totalTalkingPoints = Object.values(categories).reduce((sum, category) => sum + category.count, 0);

  const expiringSoon = activePoints.filter((point) => point.status === 'expiring_soon');

  const toggleCategory = (categoryKey: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryKey)) {
      newExpanded.delete(categoryKey);
    } else {
      newExpanded.add(categoryKey);
    }
    setExpandedCategories(newExpanded);
  };

  const toggleItem = (itemKey: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemKey)) {
      newExpanded.delete(itemKey);
    } else {
      newExpanded.add(itemKey);
    }
    setExpandedItems(newExpanded);
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="bg-card text-card-foreground border-unified transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 transform hover:scale-[1.01] interactive-hover">
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 dark:hover:bg-muted/30 transition-all duration-300 focus-enhanced">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg brand-accent-bg-subtle transition-all duration-300 hover:bg-primary/20 hover:scale-110 interactive-scale">
                  <Lightbulb size={20} className="brand-accent transition-all duration-300" />
                </div>
                <CardTitle className="text-lg transition-colors duration-300 brand-accent-subtle">Market Insights</CardTitle>
              </div>
              {isOpen ? (
                <ChevronDown size={20} className="transition-all duration-300 brand-accent" />
              ) : (
                <ChevronRight size={20} className="transition-all duration-300 text-muted-foreground hover:text-primary brand-accent-subtle" />
              )}
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="space-y-3 pt-0">
            <div className="px-3 sm:px-4 py-3 sm:py-4 space-y-3">
              {expiringSoon.length > 0 && (
                <div className="flex items-start gap-2 rounded-lg border border-dashed border-primary/40 bg-primary/5 p-3 text-xs text-muted-foreground">
                  <RefreshCcw className="h-4 w-4 text-primary mt-0.5" />
                  <div>
                    <p className="font-semibold text-primary">
                      {expiringSoon.length === 1
                        ? 'One insight is about to expire'
                        : `${expiringSoon.length} insights are about to expire`}
                    </p>
                    <p>
                      Refresh the content to keep your client talking points current.
                      <Button variant="link" className="h-auto px-1 text-primary" onClick={() => refetch()}>
                        Refresh now
                      </Button>
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <div className="text-left">
                  <h3 className="font-semibold text-sm text-muted-foreground leading-tight">Market Insights</h3>
                  <p className="text-xl font-bold text-foreground transition-all duration-300 group-hover:scale-105 leading-tight tracking-tight">
                    {totalTalkingPoints}
                  </p>
                </div>
              </div>
              
              <div className="text-sm text-muted-foreground mt-3">
                Market insights, regulatory updates, and investment strategies to discuss with clients.
              </div>
              
              <div className="mt-3 space-y-3">
                {isLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : (
                  Object.entries(categories).map(([key, category]) => {
                    if (category.count === 0) return null;
                    
                    const isExpanded = expandedCategories.has(key);
                    const IconComponent = categoryIcons[key as keyof typeof categoryIcons] || Lightbulb;
                    
                    return (
                      <Collapsible key={key} open={isExpanded} onOpenChange={() => toggleCategory(key)}>
                        <div className={`rounded-lg border p-3 ${category.bgColor}`}>
                          <CollapsibleTrigger asChild>
                            <Button
                              variant="ghost"
                              className="w-full justify-between p-0 h-auto hover:bg-transparent"
                            >
                              <div className="flex items-center gap-3">
                                <div className={`p-1.5 rounded-lg bg-muted ${category.color}`}>
                                  <IconComponent size={18} />
                                </div>
                                <div className="text-left">
                                  <h3 className="font-semibold text-sm text-foreground">{category.title}</h3>
                                  <p className={`text-lg font-bold ${category.color}`}>
                                    {category.count}
                                  </p>
                                </div>
                              </div>
                              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            </Button>
                          </CollapsibleTrigger>
                        
                          <CollapsibleContent className="mt-3">
                            <div className="space-y-2">
                              {category.items.length === 0 ? (
                                <div className="text-sm text-muted-foreground italic">
                                  No {category.title.toLowerCase()} at this time
                                </div>
                              ) : (
                                category.items
                                  .sort((a, b) => (Number(b.personalized_score || 0) - Number(a.personalized_score || 0)))
                                  .slice(0, 5)
                                  .map((item, index: number) => {
                                  const isItemExpanded = expandedItems.has(item.id?.toString() || index.toString());

                                  return (
                                    <div
                                      key={item.id || index}
                                      className="bg-background border border-border rounded p-3 text-sm hover:bg-muted/50 transition-colors cursor-pointer"
                                      onClick={() => {
                                        const itemKey = item.id?.toString() || index.toString();
                                        const newExpanded = new Set(expandedItems);
                                        if (newExpanded.has(itemKey)) {
                                          newExpanded.delete(itemKey);
                                        } else {
                                          newExpanded.add(itemKey);
                                        }
                                        setExpandedItems(newExpanded);
                                      }}
                                    >
                                      <div className="flex items-start justify-between gap-3">
                                        <div>
                                          <div className="font-medium text-foreground mb-1">{item.title}</div>
                                          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                            <span>Score: {item.personalized_score?.toFixed?.(2) ?? item.personalized_score ?? item.relevance_score}</span>
                                            {item.status === 'expiring_soon' && item.valid_until && (
                                              <Badge variant="outline" className="border-amber-500 text-amber-600 bg-amber-50 dark:bg-amber-500/10">
                                                Expires {formatDistanceToNow(new Date(item.valid_until), { addSuffix: true })}
                                              </Badge>
                                            )}
                                          </div>
                                        </div>
                                        {item.refresh_prompt && (
                                          <Badge variant="secondary" className="text-[10px] leading-tight text-primary border-primary/40 bg-primary/10">
                                            {item.refresh_prompt}
                                          </Badge>
                                        )}
                                      </div>

                                      {!isItemExpanded && item.summary && (
                                        <div className="text-foreground mb-2 text-xs leading-relaxed font-medium bg-muted/30 px-2 py-1 rounded">
                                          Summary: {item.summary}
                                        </div>
                                      )}
                                      
                                      {isItemExpanded && (
                                        <div className="mt-3 space-y-3">
                                          {item.summary && (
                                            <div className="text-foreground text-xs leading-relaxed font-medium bg-muted/30 px-2 py-1 rounded">
                                              Summary: {item.summary}
                                            </div>
                                          )}
                                          
                                          {item.detailed_content && (
                                            <div className="text-foreground text-xs leading-relaxed">
                                              {item.detailed_content}
                                            </div>
                                          )}
                                          
                                          {item.segment_matches && item.segment_matches.length > 0 && (
                                            <div className="flex flex-wrap gap-1">
                                              {item.segment_matches.slice(0, 3).map((match, matchIndex) => (
                                                <Badge key={`${item.id}-match-${matchIndex}`} variant="outline" className="text-[11px]">
                                                  {match.segment_value}
                                                </Badge>
                                              ))}
                                            </div>
                                          )}

                                          {item.tags && item.tags.length > 0 && (
                                            <div className="flex flex-wrap gap-1">
                                              {item.tags.map((tag: string, tagIndex: number) => (
                                                <span key={tagIndex} className="bg-primary/10 text-primary text-xs px-1.5 py-0.5 rounded">
                                                  {tag}
                                                </span>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                      )}

                                      <div className="text-muted-foreground text-xs mt-2">
                                        {item.relevance_score && (
                                          <span className="mr-2">Baseline: {item.relevance_score}/10</span>
                                        )}
                                        {item.source}
                                      </div>
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          </CollapsibleContent>
                        </div>
                      </Collapsible>
                    );
                  })
                )}
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}