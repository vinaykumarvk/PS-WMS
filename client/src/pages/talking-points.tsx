import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Lightbulb, Calendar, Tag, ChevronDown, ChevronUp, MessageCircle, RefreshCcw } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import type { TalkingPoint } from "@/types/talking-point";

interface ProductSummary {
  id: number;
  name: string;
  description: string;
  category: string;
  riskLevel: string;
  keyFeatures: string[];
  tags?: string[];
  targetAudience?: string;
}

interface QAInteraction {
  question: string;
  answer: string;
  sources: string[];
  askedAt: string;
}

export default function TalkingPointsPage() {
  const [showAll, setShowAll] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
  const [question, setQuestion] = useState("");
  const [qaHistory, setQaHistory] = useState<QAInteraction[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: talkingPoints, isLoading, refetch } = useQuery<TalkingPoint[]>({
    queryKey: ['/api/talking-points'],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const { data: products } = useQuery<ProductSummary[]>({
    queryKey: ['/api/products'],
    staleTime: 10 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background transition-colors duration-300">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="h-8 w-48 bg-muted rounded animate-pulse mb-6"></div>
          <div className="space-y-6">
            {Array.from({ length: 5 }).map((_, index) => (
              <Card key={index} className="overflow-hidden">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="h-5 w-3/4 bg-muted rounded animate-pulse"></div>
                      <div className="h-4 w-1/2 bg-muted rounded animate-pulse"></div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-16 bg-muted rounded-full animate-pulse"></div>
                      <div className="h-6 w-8 bg-muted rounded animate-pulse"></div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 mb-4">
                    <div className="h-4 w-full bg-muted rounded animate-pulse"></div>
                    <div className="h-4 w-5/6 bg-muted rounded animate-pulse"></div>
                  </div>
                  <div className="flex items-center gap-2 mb-4">
                    {Array.from({ length: 3 }).map((_, tagIndex) => (
                      <div key={tagIndex} className="h-5 w-16 bg-muted rounded-full animate-pulse"></div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="h-4 w-32 bg-muted rounded animate-pulse"></div>
                    <div className="h-4 w-24 bg-muted rounded animate-pulse"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const enhancedPoints = Array.isArray(talkingPoints) ? talkingPoints : [];
  const activeTalkingPoints = enhancedPoints.filter(point => !point.auto_archived && point.is_active !== false);
  const archivedTalkingPoints = enhancedPoints.filter(point => point.auto_archived);
  const expiringSoonTalkingPoints = activeTalkingPoints.filter(point => point.status === 'expiring_soon');
  const displayedPoints = showAll ? activeTalkingPoints : activeTalkingPoints.slice(0, 3);

  const normalizeText = (value: string) =>
    value
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

  const knowledgeBase = useMemo(() => {
    const entries: Array<{
      id: string;
      type: 'talking_point' | 'product';
      title: string;
      summary: string;
      detail: string;
      tags: string[];
      segmentMatches?: string[];
      baseScore: number;
    }> = [];

    activeTalkingPoints.forEach(point => {
      entries.push({
        id: `talking-point-${point.id}`,
        type: 'talking_point',
        title: point.title,
        summary: point.summary || point.title,
        detail: point.detailed_content || point.summary || point.title,
        tags: point.tags || [],
        segmentMatches: (point.segment_matches || []).map(match => match.segment_value),
        baseScore: Number(point.personalized_score || point.relevance_score || 5),
      });
    });

    (products || []).forEach(product => {
      entries.push({
        id: `product-${product.id}`,
        type: 'product',
        title: product.name,
        summary: product.description,
        detail: `${product.keyFeatures?.slice(0, 3).join('; ') || ''} ${product.targetAudience ? `Target: ${product.targetAudience}` : ''}`.trim(),
        tags: [...(product.tags || []), product.category, `${product.riskLevel} risk`],
        segmentMatches: product.targetAudience ? [product.targetAudience] : undefined,
        baseScore: 4,
      });
    });

    return entries;
  }, [activeTalkingPoints, products]);

  const handleGenerateAnswer = () => {
    const trimmed = question.trim();
    if (!trimmed) return;

    setIsGenerating(true);

    const normalizedQuestion = normalizeText(trimmed);
    const keywords = normalizedQuestion.split(' ').filter(word => word.length > 3);

    const scoredEntries = knowledgeBase
      .map(entry => {
        const normalizedSummary = normalizeText(entry.summary);
        const normalizedDetail = normalizeText(entry.detail);
        let score = entry.baseScore;

        entry.tags.forEach(tag => {
          const normalizedTag = normalizeText(tag);
          if (normalizedTag && normalizedQuestion.includes(normalizedTag)) {
            score += 4;
          }
        });

        (entry.segmentMatches || []).forEach(match => {
          const normalizedMatch = normalizeText(match);
          if (normalizedMatch && normalizedQuestion.includes(normalizedMatch)) {
            score += 3;
          }
        });

        keywords.forEach(keyword => {
          if (normalizedSummary.includes(keyword)) score += 1.5;
          if (normalizedDetail.includes(keyword)) score += 1;
        });

        return { entry, score };
      })
      .filter(result => result.score > 4)
      .sort((a, b) => b.score - a.score)
      .slice(0, 4);

    let answer = '';
    const sources: string[] = [];

    if (scoredEntries.length === 0) {
      answer = "I couldn't find a relevant insight in the current library. Try refreshing your talking points or broadening the question.";
    } else {
      const topTalkingPoint = scoredEntries.find(result => result.entry.type === 'talking_point');
      const topProduct = scoredEntries.find(result => result.entry.type === 'product');

      if (topTalkingPoint) {
        answer += `Lead with "${topTalkingPoint.entry.title}" – ${topTalkingPoint.entry.summary}.`;
        if (topTalkingPoint.entry.segmentMatches?.length) {
          answer += ` Emphasize how this resonates with ${topTalkingPoint.entry.segmentMatches.join(', ')} clients.`;
        }
        sources.push(`Insight: ${topTalkingPoint.entry.title}`);
      }

      if (topProduct) {
        answer += `${answer ? ' ' : ''}Pair it with the product "${topProduct.entry.title}" to address the question. Key angle: ${topProduct.entry.summary}.`;
        sources.push(`Product: ${topProduct.entry.title}`);
      }

      if (!topTalkingPoint && !topProduct && scoredEntries[0]) {
        const fallback = scoredEntries[0];
        answer = `Consider referencing "${fallback.entry.title}" – ${fallback.entry.summary}.`;
        sources.push(`${fallback.entry.type === 'talking_point' ? 'Insight' : 'Product'}: ${fallback.entry.title}`);
      }
    }

    setQaHistory(prev => [
      { question: trimmed, answer, sources, askedAt: new Date().toISOString() },
      ...prev,
    ]);
    setIsGenerating(false);
    setQuestion('');
  };

  const toggleExpanded = (id: number) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      {/* Enhanced Sticky Header */}
      <div className="sticky top-0 z-10 bg-card border-b border-border px-6 py-4 backdrop-blur-sm bg-card/95 animate-in slide-in-from-top-4 duration-500">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Lightbulb className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Market Insights</h1>
          <Badge variant="secondary" className="ml-auto font-semibold">
            {activeTalkingPoints.length} Active Points
          </Badge>
        </div>

        <p className="text-muted-foreground mt-2 font-medium leading-relaxed">
          Market insights and conversation starters to enhance client discussions
        </p>

        {expiringSoonTalkingPoints.length > 0 && (
          <Alert className="mt-4 border-primary/40 bg-primary/5">
            <RefreshCcw className="h-4 w-4 text-primary" />
            <AlertDescription className="text-sm">
              {expiringSoonTalkingPoints.length === 1
                ? 'One talking point will expire soon. Refresh it to keep your playbook current.'
                : `${expiringSoonTalkingPoints.length} talking points will expire soon. Refresh them to keep your playbook current.`}
              <Button variant="link" className="h-auto px-1 text-primary" onClick={() => refetch()}>
                Refresh now
              </Button>
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Enhanced Main Content */}
      <div className="p-6 space-y-6 animate-in fade-in duration-700 delay-200">
        {activeTalkingPoints.length > 0 ? (
        <Card className="shadow-lg border-0 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-0">
            {displayedPoints.map((point, index) => {
              const isExpanded = expandedItems.has(point.id);
              return (
                <div
                  key={point.id}
                  className={`p-6 cursor-pointer hover:bg-muted/30 transition-all duration-300 hover:scale-[1.01] animate-in slide-in-from-left-4 duration-500 ${
                    index !== displayedPoints.length - 1 ? 'border-b border-border/50' : ''
                  }`}
                  style={{ animationDelay: `${index * 100}ms` }}
                  onClick={() => toggleExpanded(point.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 space-y-2">
                      <h3 className="text-lg font-medium text-foreground mb-2">
                        {point.title}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <Badge variant="outline" className="capitalize font-medium">
                          {point.category.replace('_', ' ')}
                        </Badge>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span className="font-medium">{point.created_at ? format(new Date(point.created_at), 'MMM dd, yyyy') : 'Recently added'}</span>
                        </div>
                        {point.personalized_score !== undefined && (
                          <span className="text-xs font-semibold text-primary/80">
                            Score {point.personalized_score.toFixed?.(2) ?? point.personalized_score}
                          </span>
                        )}
                        {point.status === 'expiring_soon' && point.valid_until && (
                          <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-900 border-amber-500">
                            Expires {formatDistanceToNow(new Date(point.valid_until), { addSuffix: true })}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-4 space-y-4">
                      <div className="text-sm text-foreground bg-muted/50 border border-border p-3 rounded-lg font-medium">
                        <strong className="text-primary">Summary:</strong> {point.summary}
                      </div>
                      
                      <div className="prose prose-sm text-foreground">
                        <p>{point.detailed_content}</p>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-border">
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Tag className="h-4 w-4 mr-1" />
                          <span className="font-medium">{point.source}</span>
                        </div>
                        
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4 mr-1" />
                          Valid until: {point.valid_until ? format(new Date(point.valid_until), 'MMM dd, yyyy') : 'No expiry'}
                        </div>
                      </div>

                      {point.segment_matches && point.segment_matches.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {point.segment_matches.map((match, index) => (
                            <Badge key={`${point.id}-segment-${index}`} variant="outline" className="text-xs">
                              {match.segment_value}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {point.tags && point.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {point.tags.map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {activeTalkingPoints.length > 3 && (
              <div className="p-4 border-t border-border">
                <Button
                  variant="ghost"
                  className="w-full text-muted-foreground hover:text-foreground"
                  onClick={() => setShowAll(!showAll)}
                >
                  {showAll ? (
                    <>
                      <ChevronUp className="h-4 w-4 mr-2" />
                      Show Less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4 mr-2" />
                      Show More ({activeTalkingPoints.length - 3} more)
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <Lightbulb className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No Active Insights</h3>
              <p className="text-muted-foreground">Check back later for new market insights and conversation starters.</p>
            </div>
          </CardContent>
        </Card>
      )}

        {archivedTalkingPoints.length > 0 && (
          <Card className="border-dashed border-border/60">
            <CardHeader>
              <CardTitle className="text-base">Archived Insights</CardTitle>
              <CardDescription>Automatically archived after expiry. Refresh from research to restore them.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {archivedTalkingPoints.map(point => (
                <div key={`archived-${point.id}`} className="border border-border/70 rounded-md p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-muted-foreground">{point.title}</div>
                    <Badge variant="outline" className="text-xs">
                      Expired {point.valid_until ? format(new Date(point.valid_until), 'MMM dd, yyyy') : ''}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{point.summary}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <Card className="shadow-sm">
          <CardHeader className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-primary" />
              <div>
                <CardTitle className="text-lg">Coaching Q&A Simulator</CardTitle>
                <CardDescription>Ask a question to rehearse a client conversation. Answers blend your talking points with product documentation.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Textarea
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                placeholder="Example: How should I brief a platinum client worried about market volatility?"
                className="min-h-[120px]"
              />
              <div className="flex justify-end mt-2">
                <Button onClick={handleGenerateAnswer} disabled={isGenerating || !question.trim()}>
                  {isGenerating ? 'Generating...' : 'Generate coaching response'}
                </Button>
              </div>
            </div>

            {qaHistory.length > 0 && (
              <div className="space-y-4">
                {qaHistory.map((interaction, index) => (
                  <div key={`${interaction.askedAt}-${index}`} className="border border-border rounded-md p-4 space-y-2">
                    <div className="text-sm font-semibold text-muted-foreground flex items-start gap-2">
                      <MessageCircle className="h-4 w-4 mt-0.5" />
                      <span>{interaction.question}</span>
                    </div>
                    <p className="text-sm text-foreground leading-relaxed">{interaction.answer}</p>
                    {interaction.sources.length > 0 && (
                      <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-2">
                        <span className="font-medium uppercase tracking-wide">Sources</span>
                        <Separator orientation="vertical" className="h-4" />
                        {interaction.sources.map(source => (
                          <Badge key={source} variant="outline" className="text-[11px]">
                            {source}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}