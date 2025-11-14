/**
 * Export Options Component
 * Provides export functionality for analytics data
 */

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, FileSpreadsheet, FileText } from 'lucide-react';
import { useState } from 'react';
import { OrderAnalytics, PerformanceMetrics, ClientInsights } from '../types/analytics.types';

interface ExportOptionsProps {
  orderAnalytics?: OrderAnalytics;
  performanceMetrics?: PerformanceMetrics;
  clientInsights?: ClientInsights;
}

export function ExportOptionsComponent({
  orderAnalytics,
  performanceMetrics,
  clientInsights,
}: ExportOptionsProps) {
  const [isExporting, setIsExporting] = useState(false);

  const exportToCSV = (data: any[], filename: string) => {
    if (!data || data.length === 0) {
      alert('No data to export');
      return;
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map((row) => headers.map((header) => JSON.stringify(row[header] || '')).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToJSON = (data: any, filename: string) => {
    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportOrders = async (format: 'csv' | 'json') => {
    if (!orderAnalytics) return;

    setIsExporting(true);
    try {
      if (format === 'csv') {
        // Export orders over time
        if (orderAnalytics.ordersOverTime.length > 0) {
          exportToCSV(orderAnalytics.ordersOverTime, 'order-analytics-trends');
        }
        // Export top clients
        if (orderAnalytics.topClients.length > 0) {
          exportToCSV(orderAnalytics.topClients, 'order-analytics-top-clients');
        }
        // Export top products
        if (orderAnalytics.topProducts.length > 0) {
          exportToCSV(orderAnalytics.topProducts, 'order-analytics-top-products');
        }
      } else {
        exportToJSON(orderAnalytics, 'order-analytics');
      }
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export data');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPerformance = async (format: 'csv' | 'json') => {
    if (!performanceMetrics) return;

    setIsExporting(true);
    try {
      if (format === 'csv') {
        // Export trends
        if (performanceMetrics.trends.length > 0) {
          exportToCSV(performanceMetrics.trends, 'performance-metrics-trends');
        }
      } else {
        exportToJSON(performanceMetrics, 'performance-metrics');
      }
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export data');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportClients = async (format: 'csv' | 'json') => {
    if (!clientInsights) return;

    setIsExporting(true);
    try {
      if (format === 'csv') {
        // Export top clients
        if (clientInsights.topClients.length > 0) {
          exportToCSV(clientInsights.topClients, 'client-insights-top-clients');
        }
        // Export acquisition trend
        if (clientInsights.clientAcquisitionTrend.length > 0) {
          exportToCSV(clientInsights.clientAcquisitionTrend, 'client-insights-acquisition');
        }
      } else {
        exportToJSON(clientInsights, 'client-insights');
      }
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export data');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          Export Analytics Data
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Order Analytics Export */}
          {orderAnalytics && (
            <div className="space-y-2">
              <h4 className="font-medium">Order Analytics</h4>
              <div className="flex gap-2">
                <Button
                  onClick={() => handleExportOrders('csv')}
                  disabled={isExporting}
                  variant="outline"
                  size="sm"
                >
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
                <Button
                  onClick={() => handleExportOrders('json')}
                  disabled={isExporting}
                  variant="outline"
                  size="sm"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Export JSON
                </Button>
              </div>
            </div>
          )}

          {/* Performance Metrics Export */}
          {performanceMetrics && (
            <div className="space-y-2">
              <h4 className="font-medium">Performance Metrics</h4>
              <div className="flex gap-2">
                <Button
                  onClick={() => handleExportPerformance('csv')}
                  disabled={isExporting}
                  variant="outline"
                  size="sm"
                >
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
                <Button
                  onClick={() => handleExportPerformance('json')}
                  disabled={isExporting}
                  variant="outline"
                  size="sm"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Export JSON
                </Button>
              </div>
            </div>
          )}

          {/* Client Insights Export */}
          {clientInsights && (
            <div className="space-y-2">
              <h4 className="font-medium">Client Insights</h4>
              <div className="flex gap-2">
                <Button
                  onClick={() => handleExportClients('csv')}
                  disabled={isExporting}
                  variant="outline"
                  size="sm"
                >
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
                <Button
                  onClick={() => handleExportClients('json')}
                  disabled={isExporting}
                  variant="outline"
                  size="sm"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Export JSON
                </Button>
              </div>
            </div>
          )}

          {!orderAnalytics && !performanceMetrics && !clientInsights && (
            <p className="text-sm text-muted-foreground">No data available for export</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

