/**
 * Foundation Layer - F4: Order Card Component
 * Reusable card component for displaying order information
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate } from '@shared/utils/formatting';
import { Edit, Trash2, Eye } from 'lucide-react';
import type { CartItem } from '@shared/types/order-management.types';

interface OrderCardProps {
  item: CartItem;
  onEdit?: (itemId: string) => void;
  onRemove?: (itemId: string) => void;
  onView?: (itemId: string) => void;
  showActions?: boolean;
  className?: string;
}

export function OrderCard({
  item,
  onEdit,
  onRemove,
  onView,
  showActions = true,
  className,
}: OrderCardProps) {
  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-base font-semibold">
            {item.schemeName}
          </CardTitle>
          <div className="flex gap-2">
            <Badge variant="outline">{item.transactionType}</Badge>
            {item.orderType && (
              <Badge variant="secondary">{item.orderType}</Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Amount:</span>
            <span className="font-medium">{formatCurrency(item.amount)}</span>
          </div>
          {item.units && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Units:</span>
              <span className="font-medium">{item.units.toFixed(4)}</span>
            </div>
          )}
          {item.nav && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">NAV:</span>
              <span className="font-medium">{formatCurrency(item.nav)}</span>
            </div>
          )}
          {item.sourceSchemeName && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">From:</span>
              <span className="font-medium">{item.sourceSchemeName}</span>
            </div>
          )}
        </div>
        
        {showActions && (onEdit || onRemove || onView) && (
          <div className="flex gap-2 mt-4 pt-4 border-t">
            {onView && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onView(item.id)}
                className="flex-1"
              >
                <Eye className="h-4 w-4 mr-2" />
                View
              </Button>
            )}
            {onEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(item.id)}
                className="flex-1"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
            {onRemove && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemove(item.id)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

