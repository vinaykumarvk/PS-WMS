/**
 * Switch History Component
 * Module D: Advanced Switch Features
 * Displays history of all switch transactions
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/empty-state';
import { History, Search, Filter, Download, Calendar } from 'lucide-react';
import { useSwitchHistory } from '../../hooks/use-switch';
import { format } from 'date-fns';

interface SwitchHistoryProps {
  clientId: number;
}

interface SwitchHistoryItem {
  id: number;
  sourceScheme: string;
  targetSchemes: string[];
  amount: number;
  units?: number;
  switchDate: string;
  status: 'Completed' | 'Pending' | 'Failed';
  exitLoad?: number;
  exitLoadAmount?: number;
  netAmount: number;
  type: 'Full' | 'Partial' | 'Multi-Scheme';
}

export default function SwitchHistory({ clientId }: SwitchHistoryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');

  const { data: history = [], isLoading } = useSwitchHistory(clientId, {
    status: statusFilter !== 'all' ? statusFilter : undefined,
    type: typeFilter !== 'all' ? typeFilter : undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  });

  const filteredHistory = history.filter((item: SwitchHistoryItem) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        item.sourceScheme.toLowerCase().includes(query) ||
        item.targetSchemes.some(s => s.toLowerCase().includes(query))
      );
    }
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Completed':
        return <Badge className="bg-green-500">Completed</Badge>;
      case 'Pending':
        return <Badge className="bg-yellow-500">Pending</Badge>;
      case 'Failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'Full':
        return <Badge variant="outline">Full Switch</Badge>;
      case 'Partial':
        return <Badge variant="outline">Partial Switch</Badge>;
      case 'Multi-Scheme':
        return <Badge variant="outline">Multi-Scheme</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Switch History
        </CardTitle>
        <CardDescription>
          View all your switch transactions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by scheme name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Filter Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status-filter">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger id="status-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="type-filter">Type</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger id="type-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="Full">Full Switch</SelectItem>
                  <SelectItem value="Partial">Partial Switch</SelectItem>
                  <SelectItem value="Multi-Scheme">Multi-Scheme</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date-from">From Date</Label>
              <Input
                id="date-from"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date-to">To Date</Label>
              <Input
                id="date-to"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                min={dateFrom}
              />
            </div>
          </div>

          {/* Clear Filters */}
          {(statusFilter !== 'all' || typeFilter !== 'all' || dateFrom || dateTo || searchQuery) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setStatusFilter('all');
                setTypeFilter('all');
                setDateFrom('');
                setDateTo('');
                setSearchQuery('');
              }}
            >
              Clear Filters
            </Button>
          )}
        </div>

        {/* History List */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        ) : filteredHistory.length === 0 ? (
          <EmptyState
            icon={History}
            title="No switch history"
            description={
              searchQuery || statusFilter !== 'all' || typeFilter !== 'all' || dateFrom || dateTo
                ? 'No switch transactions match your filters'
                : 'You haven\'t made any switch transactions yet'
            }
          />
        ) : (
          <div className="space-y-3">
            {filteredHistory.map((item: SwitchHistoryItem) => (
              <div
                key={item.id}
                className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium">{item.sourceScheme}</span>
                          <span className="text-muted-foreground">→</span>
                          <span className="font-medium">
                            {item.targetSchemes.length === 1
                              ? item.targetSchemes[0]
                              : `${item.targetSchemes.length} schemes`}
                          </span>
                        </div>
                        {item.targetSchemes.length > 1 && (
                          <div className="mt-1 text-sm text-muted-foreground">
                            {item.targetSchemes.join(', ')}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {getTypeBadge(item.type)}
                        {getStatusBadge(item.status)}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Switch Amount</p>
                        <p className="font-medium">₹{item.amount.toLocaleString()}</p>
                      </div>
                      {item.units && (
                        <div>
                          <p className="text-muted-foreground">Units</p>
                          <p className="font-medium">{item.units.toLocaleString()}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-muted-foreground">Net Amount</p>
                        <p className="font-medium">₹{item.netAmount.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Date</p>
                        <p className="font-medium flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(item.switchDate), 'dd MMM yyyy')}
                        </p>
                      </div>
                    </div>

                    {item.exitLoadAmount && item.exitLoadAmount > 0 && (
                      <div className="text-sm text-muted-foreground">
                        Exit Load: {item.exitLoad}% = ₹{item.exitLoadAmount.toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Export Button */}
        {filteredHistory.length > 0 && (
          <div className="flex justify-end pt-4 border-t">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export History
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

