/**
 * Favorites List Component
 * Module A: Quick Order Placement
 * Displays favorite schemes with quick invest options
 */

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, Loader2 } from 'lucide-react';
import { Favorite } from '../../types/quick-order.types';
import { EmptyState } from '@/components/empty-state';

interface FavoritesListProps {
  favorites: Favorite[];
  isLoading?: boolean;
  onQuickInvest: (favorite: Favorite) => void;
  onRemoveFavorite: (favoriteId: string) => void;
  isInvesting?: boolean;
}

export default function FavoritesList({
  favorites,
  isLoading = false,
  onQuickInvest,
  onRemoveFavorite,
  isInvesting = false,
}: FavoritesListProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (favorites.length === 0) {
    return (
      <EmptyState
        icon={<Star className="h-12 w-12 text-muted-foreground" />}
        title="No favorites yet"
        description="Add schemes to your favorites for quick access."
      />
    );
  }

  return (
    <div className="space-y-3">
      {favorites.map((favorite) => (
        <Card key={favorite.id} className="border-border hover:border-primary/50 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                  <h4 className="font-semibold text-foreground truncate">{favorite.schemeName}</h4>
                  {favorite.schemeCode && (
                    <Badge variant="outline" className="text-xs">
                      {favorite.schemeCode}
                    </Badge>
                  )}
                </div>
                {favorite.product && (
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div className="flex items-center gap-4">
                      <span>NAV: ₹{favorite.product.nav.toFixed(2)}</span>
                      <span>Min: ₹{favorite.product.minInvestment.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {favorite.product.category}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {favorite.product.riskLevel}
                      </Badge>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button
                  size="sm"
                  onClick={() => onQuickInvest(favorite)}
                  disabled={isInvesting}
                  className="whitespace-nowrap"
                >
                  {isInvesting ? (
                    <>
                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                      Investing...
                    </>
                  ) : (
                    'Quick Invest'
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onRemoveFavorite(favorite.id)}
                  disabled={isInvesting}
                  className="h-8 w-8"
                  aria-label={`Remove ${favorite.schemeName} from favorites`}
                >
                  <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

