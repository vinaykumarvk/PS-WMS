/**
 * Goal Recommendations Component
 * Displays AI-powered goal recommendations based on client profile
 */

import React from 'react';
import { Sparkles, Target, TrendingUp, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useGoalRecommendations } from '../../hooks/use-goals';
import { GoalRecommendation } from '../../../../../../shared/types/order-management.types';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface GoalRecommendationsProps {
  clientId: number;
  onApplyRecommendation?: (recommendation: GoalRecommendation) => void;
  className?: string;
}

const priorityColors = {
  High: 'bg-red-100 text-red-800 border-red-200',
  Medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  Low: 'bg-green-100 text-green-800 border-green-200',
};

export default function GoalRecommendations({
  clientId,
  onApplyRecommendation,
  className,
}: GoalRecommendationsProps) {
  const { data: recommendations = [], isLoading, error } = useGoalRecommendations(clientId);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Goal Recommendations
          </CardTitle>
          <CardDescription>AI-powered suggestions for your client's goals</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Goal Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load recommendations. Please try again later.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (recommendations.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Goal Recommendations
          </CardTitle>
          <CardDescription>AI-powered suggestions for your client's goals</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No recommendations available at this time.</p>
            <p className="text-sm mt-2">
              Recommendations will appear based on your client's profile and portfolio.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Goal Recommendations
        </CardTitle>
        <CardDescription>
          AI-powered suggestions based on your client's profile and portfolio
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {recommendations.map((recommendation) => (
          <Card key={recommendation.goalId} className="border-2">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    {recommendation.goalName}
                  </CardTitle>
                  <CardDescription className="mt-1">{recommendation.reason}</CardDescription>
                </div>
                <Badge
                  variant="outline"
                  className={priorityColors[recommendation.priority]}
                >
                  {recommendation.priority} Priority
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Recommended Amount */}
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <span className="text-sm font-medium">Recommended Investment:</span>
                <span className="text-lg font-bold text-primary">
                  {formatCurrency(recommendation.recommendedAmount)}
                </span>
              </div>

              {/* Recommended Schemes */}
              {recommendation.recommendedSchemes && recommendation.recommendedSchemes.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Recommended Schemes:</p>
                  <div className="space-y-2">
                    {recommendation.recommendedSchemes.map((scheme, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-background border rounded-md"
                      >
                        <div className="flex-1">
                          <p className="text-sm font-medium">{scheme.schemeName}</p>
                          <p className="text-xs text-muted-foreground">{scheme.reason}</p>
                        </div>
                        <Badge variant="secondary" className="ml-2">
                          {scheme.allocation}%
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Button */}
              {onApplyRecommendation && (
                <Button
                  className="w-full"
                  onClick={() => onApplyRecommendation(recommendation)}
                >
                  Apply Recommendation
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </CardContent>
    </Card>
  );
}
