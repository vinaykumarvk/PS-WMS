/**
 * Redemption History Component
 * Module E: Instant Redemption Features
 * Displays redemption history with filters
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { History, Search, Filter, Calendar, Loader2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useRedemptionHistory } from '../../hooks/use-redemption';
import type { RedemptionHistory } from '@shared/types/order-management.types';
import { cn } from '@/lib/utils';

interface RedemptionHistoryProps {
  clientId: number | null;
  className?: string;
}

const statusColors: Record<string, string> = {
  'Pending Approval': 'bg-yellow-100 text-yellow-800',
  'Approved': 'bg-blue-100 text-blue-800',
  'Executed': 'bg-green-100 text-green-800',
  'Settled': 'bg-green-100 text-green-800',
  'Failed': 'bg-red-100 text-red-800',
  'Cancelled': 'bg-gray-100 text-gray-800',
};

export default function RedemptionHistory({
  clientId,
  className,
}: RedemptionHistoryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const filters = {
    ...(statusFilter !== 'all' && { status: statusFilter }),
    ...(startDate && { startDate }),
    ...(endDate && { endDate }),
  };

  const { data: history, isLoading, error } = useRedemptionHistory(filters);

  // Filter by search query
  const filteredHistory = React.useMemo(() => {
    if (!history) return [];
    if (!searchQuery) return history;

    const query = searchQuery.toLowerCase();
    return history.filter(
      (item) =>
        item.schemeName.toLowerCase().includes(query) ||
        item.orderId.toString().includes(query) ||
        item.id.toLowerCase().includes(query)
    );
  }, [history, searchQuery]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setStartDate('');
    setEndDate('');
  };

  if (!clientId) {
    return (
      <Card className={className}>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">
            Please select a client to view redemption history
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-primary" />
          <CardTitle>Redemption History</CardTitle>
        </div>
        <CardDescription>View your past redemption transactions</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by scheme name or order ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Pending Approval">Pending Approval</SelectItem>
                <SelectItem value="Approved">Approved</SelectItem>
                <SelectItem value="Executed">Executed</SelectItem>
                <SelectItem value="Settled">Settled</SelectItem>
                <SelectItem value="Failed">Failed</SelectItem>
                <SelectItem value="Cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1">
              <Label htmlFor="start-date" className="text-xs text-muted-foreground">
                Start Date
              </Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="flex-1">
              <Label htmlFor="end-date" className="text-xs text-muted-foreground">
                End Date
              </Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={handleResetFilters}
                className="w-full sm:w-auto"
              >
                Reset
              </Button>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-center text-sm text-destructive">
            Failed to load redemption history. Please try again.
          </div>
        )}

        {/* History Table */}
        {!isLoading && !error && (
          <>
            {filteredHistory.length === 0 ? (
              <div className="rounded-lg border bg-muted/50 p-8 text-center">
                <History className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-sm font-medium">No redemption history found</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {searchQuery || statusFilter !== 'all' || startDate || endDate
                    ? 'Try adjusting your filters'
                    : 'Your redemption transactions will appear here'}
                </p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Scheme</TableHead>
                      <TableHead className="text-right">Units</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Redemption Date</TableHead>
                      <TableHead>Settlement Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredHistory.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          #{item.orderId}
                        </TableCell>
                        <TableCell>{item.schemeName}</TableCell>
                        <TableCell className="text-right">
                          {item.units.toFixed(4)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          ₹{item.amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{item.redemptionType}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={cn(
                              'text-xs',
                              statusColors[item.status] || 'bg-gray-100 text-gray-800'
                            )}
                          >
                            {item.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(item.redemptionDate).toLocaleDateString('en-IN')}
                        </TableCell>
                        <TableCell>
                          {item.settlementDate
                            ? new Date(item.settlementDate).toLocaleDateString('en-IN')
                            : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Summary */}
            {filteredHistory.length > 0 && (
              <div className="flex justify-between items-center text-sm text-muted-foreground pt-2">
                <span>
                  Showing {filteredHistory.length} redemption{filteredHistory.length !== 1 ? 's' : ''}
                </span>
                {filteredHistory.length > 0 && (
                  <span>
                    Total Amount: ₹
                    {filteredHistory
                      .reduce((sum, item) => sum + item.amount, 0)
                      .toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                  </span>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

