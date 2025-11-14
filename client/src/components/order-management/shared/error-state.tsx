/**
 * Foundation Layer - F4: Error State Component
 * Reusable error state component for order management
 */

import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
  variant?: 'default' | 'destructive' | 'warning';
}

export function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
  className,
  variant = 'destructive',
}: ErrorStateProps) {
  return (
    <Card className={className}>
      <CardContent className="py-8 px-4">
        <Alert variant={variant}>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>{title}</AlertTitle>
          <AlertDescription className="mt-2">
            {message}
          </AlertDescription>
          {onRetry && (
            <div className="mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={onRetry}
                className="w-full sm:w-auto"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </div>
          )}
        </Alert>
      </CardContent>
    </Card>
  );
}

