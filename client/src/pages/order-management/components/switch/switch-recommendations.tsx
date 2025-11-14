/**
 * Switch Recommendations Component
 * Module D: Advanced Switch Features
 * Displays AI-powered switch recommendations
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/empty-state';
import { Sparkles, TrendingUp, AlertTriangle, Info, ArrowRight } from 'lucide-react';
import { useSwitchRecommendations } from '../../hooks/use-switch';
import { SwitchRecommendation } from '../../../../shared/types/order-management.types';

interface SwitchRecommendationsProps {
  clientId: number;
  onApplyRecommendation?: (recommendation: SwitchRecommendation) => void;
}

export default function SwitchRecommendations({
  clientId,
  onApplyRecommendation,
}: SwitchRecommendationsProps) {
  const { data: recommendations = [], isLoading } = useSwitchRecommendations(clientId);

  const getRiskBadge = (riskLevel: string) => {
    switch (riskLevel) {
      case 'Low':
        return <Badge className="bg-green-500">Low Risk</Badge>;
      case 'Medium':
        return <Badge className="bg-yellow-500">Medium Risk</Badge>;
      case 'High':
        return <Badge variant="destructive">High Risk</Badge>;
      default:
        return <Badge>{riskLevel}</Badge>;
    }
  };

  const handleApply = (recommendation: SwitchRecommendation) => {
    if (onApplyRecommendation) {
      onApplyRecommendation(recommendation);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          Switch Recommendations
        </CardTitle>
        <CardDescription>
          AI-powered suggestions to optimize your portfolio
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        ) : recommendations.length === 0 ? (
          <EmptyState
            icon={Sparkles}
            title="No recommendations"
            description="We don't have any switch recommendations for you at this time. Your portfolio appears to be well-balanced."
          />
        ) : (
          <>
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                These recommendations are based on your portfolio analysis, market conditions, and performance trends. 
                Please review carefully before making any switches.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              {recommendations.map((recommendation: SwitchRecommendation, index: number) => (
                <div
                  key={index}
                  className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-2">
                            <span className="font-medium">{recommendation.fromScheme}</span>
                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{recommendation.toScheme}</span>
                          </div>
                          {getRiskBadge(recommendation.riskLevel)}
                        </div>
                      </div>

                      {/* Reason */}
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Reason</p>
                        <p className="text-sm">{recommendation.reason}</p>
                      </div>

                      {/* Expected Benefit */}
                      <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Expected Benefit</p>
                          <p className="text-sm font-semibold">{recommendation.expectedBenefit}</p>
                        </div>
                      </div>

                      {/* Risk Warning */}
                      {recommendation.riskLevel === 'High' && (
                        <Alert variant="destructive">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription className="text-sm">
                            This recommendation involves higher risk. Please consult with your advisor before proceeding.
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>

                    {/* Action Button */}
                    <div className="flex md:flex-col gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleApply(recommendation)}
                        className="md:w-full"
                      >
                        View Details
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleApply(recommendation)}
                        className="md:w-full"
                      >
                        Apply Switch
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Disclaimer */}
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                <strong>Disclaimer:</strong> These recommendations are for informational purposes only and should not be 
                considered as financial advice. Past performance does not guarantee future results. 
                Please consult with your financial advisor before making any investment decisions.
              </AlertDescription>
            </Alert>
          </>
        )}
      </CardContent>
    </Card>
  );
}

