import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  ArrowLeft, 
  TrendingUp, 
  LineChart,
  PieChart, 
  BarChart3, 
  CalendarDays, 
  Clock, 
  IndianRupee, 
  Percent, 
  AlertTriangle,
  Shield,
  Lightbulb,
  Wallet,
  Landmark,
  Globe,
  Building,
  ChevronRight,
  FileBarChart,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  AlertCircle,
  Phone,
  Mail,
  User,
  MessageCircle,
  Calendar,
  Receipt,
  ChevronDown,
  ChevronUp,
  Calculator,
  FileText,
  Filter
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { clientApi } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { getTierColor } from "@/lib/utils";
import { ClientPageLayout } from "@/components/layout/ClientPageLayout";
import { SecurityAvatar } from "@/components/ui/security-avatar";
import { useToast } from "@/hooks/use-toast";

// Import custom chart components
import AssetAllocationChart from "../components/charts/AssetAllocationChart";
import PerformanceChart from "../components/charts/PerformanceChart";
import BarChartComponent from "../components/charts/BarChart";
import SimpleAumTrendChart from "../components/charts/SimpleAumTrendChart";
import AumTrendChart from "../components/charts/AumTrendChart";
import BenchmarkComparisonChart from "../components/charts/BenchmarkComparisonChart";
import FixedTooltipChart from "../components/charts/FixedTooltipChart";
import PerformanceComparisonChart from "../components/charts/PerformanceComparisonChart";
import { RetirementProjectionChart } from "../components/charts/RetirementProjectionChart";
import PortfolioEfficiencyChart from "../components/charts/PortfolioEfficiencyChart";

// Mock data for portfolio holdings
const mockHoldings = [
  { 
    name: "HDFC Top 100 Fund", 
    type: "Mutual Fund - Equity", 
    value: 1250000, 
    allocation: 25, 
    gain: 15.4, 
    oneYearReturn: 17.8, 
    benchmark: "NIFTY 50", 
    benchmarkReturn: 16.3, 
    alphaReturn: 1.5 
  },
  { 
    name: "SBI Small Cap Fund", 
    type: "Mutual Fund - Equity", 
    value: 875000, 
    allocation: 17.5, 
    gain: 22.8, 
    oneYearReturn: 24.2, 
    benchmark: "NIFTY SMALLCAP 250", 
    benchmarkReturn: 20.5, 
    alphaReturn: 3.7 
  },
  { 
    name: "ICICI Prudential Corporate Bond Fund", 
    type: "Mutual Fund - Debt", 
    value: 1000000, 
    allocation: 20, 
    gain: 7.2, 
    oneYearReturn: 8.4, 
    benchmark: "CRISIL Corporate Bond Index", 
    benchmarkReturn: 7.8, 
    alphaReturn: 0.6 
  },
  { 
    name: "Reliance Industries Ltd.", 
    type: "Direct Equity", 
    value: 625000, 
    allocation: 12.5, 
    gain: 18.7, 
    oneYearReturn: 22.4, 
    benchmark: "NIFTY 50", 
    benchmarkReturn: 16.3, 
    alphaReturn: 6.1 
  },
  { 
    name: "HDFC Bank Ltd.", 
    type: "Direct Equity", 
    value: 500000, 
    allocation: 10, 
    gain: 9.8, 
    oneYearReturn: 12.3, 
    benchmark: "NIFTY BANK", 
    benchmarkReturn: 14.7, 
    alphaReturn: -2.4 
  },
  { 
    name: "Gold ETF", 
    type: "Gold ETF", 
    value: 375000, 
    allocation: 7.5, 
    gain: 11.2, 
    oneYearReturn: 14.6, 
    benchmark: "MCX Gold", 
    benchmarkReturn: 14.2, 
    alphaReturn: 0.4 
  },
  { 
    name: "HDFC Savings Account", 
    type: "Cash", 
    value: 375000, 
    allocation: 7.5, 
    gain: 3.5, 
    oneYearReturn: 3.5, 
    benchmark: "Savings Rate", 
    benchmarkReturn: 3.5, 
    alphaReturn: 0.0 
  },
];

// Mock data for performance periods
const performancePeriods = [
  { label: "1M", value: 2.8, benchmark: 2.3, alpha: 0.5 },
  { label: "3M", value: 5.4, benchmark: 4.6, alpha: 0.8 },
  { label: "6M", value: 8.7, benchmark: 7.5, alpha: 1.2 },
  { label: "YTD", value: 11.2, benchmark: 9.8, alpha: 1.4 },
  { label: "1Y", value: 14.5, benchmark: 12.1, alpha: 2.4 },
  { label: "3Y", value: 12.3, benchmark: 10.5, alpha: 1.8 },
  { label: "5Y", value: 11.8, benchmark: 10.2, alpha: 1.6 },
  { label: "Since Inception", value: 13.2, benchmark: 11.4, alpha: 1.8 },
];

// Mock asset allocation data
const mockAssetAllocation = {
  Equity: 65,
  "Fixed Income": 20,
  Gold: 7.5,
  Cash: 7.5
};

// Mock sector exposure
const mockSectorExposure = {
  "Financial Services": 28,
  "IT": 18,
  "Energy": 12,
  "Consumer Goods": 10,
  "Healthcare": 8,
  "Others": 24
};

// Mock geographic exposure
const mockGeographicExposure = {
  "India": 75,
  "US": 15,
  "Europe": 5,
  "Others": 5
};

// Portfolio metrics component
interface MetricCardProps {
  title: string;
  value: React.ReactNode;
  icon: React.ReactNode;
  description?: string;
  color?: string;
  trend?: number;
  isLoading?: boolean;
}

function MetricCard({ title, value, icon, description, color = "blue", trend, isLoading = false }: MetricCardProps) {
  const colorMap = {
    blue: "bg-blue-100 text-blue-600",
    amber: "bg-amber-100 text-amber-600",
    green: "bg-green-100 text-green-600",
    red: "bg-red-100 text-red-600",
    purple: "bg-purple-100 text-purple-600",
    indigo: "bg-indigo-100 text-indigo-600",
  };
  
  const iconBg = colorMap[color as keyof typeof colorMap] || colorMap.blue;
  
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start">
          <div className={`p-2 rounded-full ${iconBg} mr-3`}>
            {icon}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="mt-1 flex items-baseline">
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <h3 className="text-2xl font-bold flex items-center">
                  {value}
                  {trend !== undefined && (
                    <span className={`ml-2 text-sm flex items-center ${trend >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {trend > 0 ? <ArrowUpRight className="h-3 w-3 mr-0.5" /> : <ArrowDownRight className="h-3 w-3 mr-0.5" />}
                      {Math.abs(trend).toFixed(1)}%
                    </span>
                  )}
                </h3>
              )}
            </div>
            {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Allocation chart component (simplified for now)
function AllocationChart({ data, title, color = "blue" }: { data: Record<string, number>, title: string, color?: string }) {
  const colorMap = {
    blue: ["#3B82F6", "#EF4444", "#10B981", "#F59E0B", "#8B5CF6", "#EC4899", "#06B6D4", "#84CC16"],
    green: ["#10B981", "#3B82F6", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#06B6D4", "#84CC16"],
    amber: ["#F59E0B", "#EF4444", "#10B981", "#3B82F6", "#8B5CF6", "#EC4899", "#06B6D4", "#84CC16"],
    purple: ["#8B5CF6", "#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#EC4899", "#06B6D4", "#84CC16"],
  };
  
  const colors = colorMap[color as keyof typeof colorMap] || colorMap.blue;
  
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">{title}</h3>
      <div className="space-y-2">
        {Object.entries(data).map(([key, value], index) => {
          const itemColor = colors[index % colors.length];
          
          return (
            <div key={key} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center">
                  <span 
                    className="inline-block w-3 h-3 mr-2 rounded-full" 
                    style={{ backgroundColor: itemColor }}
                  ></span>
                  {key}
                </span>
                <span className="font-medium">{value}%</span>
              </div>
              {/* Custom progress bar with matching colors */}
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="h-2 rounded-full transition-all duration-300"
                  style={{ 
                    backgroundColor: itemColor,
                    width: `${value}%`
                  }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Local performance chart component (simplified for now)
function LocalPerformanceChart({ periods }: { periods: { label: string, value: number }[] }) {
  // Find highest and lowest performance values
  const maxValue = Math.max(...periods.map(period => period.value));
  const minValue = Math.min(...periods.map(period => period.value));
  
  // Group periods into rows as requested
  const shortTermPeriods = periods.filter(p => ['1M', '3M', '6M'].includes(p.label));
  const mediumTermPeriods = periods.filter(p => ['1Y', '3Y', '5Y'].includes(p.label));
  const longTermPeriods = periods.filter(p => ['YTD', 'Since Inception'].includes(p.label));
  
  // Render a single performance item
  const renderPeriodItem = (period: {label: string, value: number}) => (
    <div key={period.label} className="flex flex-col items-center">
      <span className={`text-sm ${
        period.value >= 0 ? 'text-green-600' : 'text-red-600'
      } ${
        period.value === maxValue || period.value === minValue ? 'font-bold' : 'font-medium'
      }`}>
        {period.value > 0 ? '+' : ''}{period.value.toFixed(1)}%
      </span>
      <span className="text-xs text-muted-foreground">{period.label}</span>
    </div>
  );
  
  // Render a group of performance items
  const renderPeriodGroup = (periodGroup: {label: string, value: number}[]) => (
    <div className="flex justify-between gap-4">
      {periodGroup.map(renderPeriodItem)}
    </div>
  );
  
  return (
    <div className="mt-4">
      {/* Desktop view with organized rows */}
      <div className="hidden md:block space-y-4">
        {renderPeriodGroup(shortTermPeriods)}
        {renderPeriodGroup(mediumTermPeriods)}
        {renderPeriodGroup(longTermPeriods)}
      </div>
      
      {/* Mobile view - compact grid layout */}
      <div className="md:hidden space-y-3">
        <div className="grid grid-cols-3 gap-2">
          {shortTermPeriods.map(period => (
            <div key={period.label} className="flex flex-col items-center p-2 bg-muted rounded-md border border-border transition-colors">
              <span className={`text-sm ${
                period.value >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              } ${
                period.value === maxValue || period.value === minValue ? 'font-bold' : 'font-medium'
              }`}>
                {period.value > 0 ? '+' : ''}{period.value.toFixed(1)}%
              </span>
              <span className="text-xs text-muted-foreground">{period.label}</span>
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-3 gap-2">
          {mediumTermPeriods.map(period => (
            <div key={period.label} className="flex flex-col items-center p-2 bg-muted rounded-md border border-border transition-colors">
              <span className={`text-sm ${
                period.value >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              } ${
                period.value === maxValue || period.value === minValue ? 'font-bold' : 'font-medium'
              }`}>
                {period.value > 0 ? '+' : ''}{period.value.toFixed(1)}%
              </span>
              <span className="text-xs text-muted-foreground">{period.label}</span>
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          {longTermPeriods.map(period => (
            <div key={period.label} className="flex flex-col items-center p-2 bg-muted rounded-md border border-border transition-colors">
              <span className={`text-sm ${
                period.value >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              } ${
                period.value === maxValue || period.value === minValue ? 'font-bold' : 'font-medium'
              }`}>
                {period.value > 0 ? '+' : ''}{period.value.toFixed(1)}%
              </span>
              <span className="text-xs text-muted-foreground">{period.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Sortable Holdings table component with show more/less functionality
function SortableHoldingsTable({ 
  holdings, 
  sortBy, 
  onSortChange, 
  showAll, 
  onToggleShowAll 
}: { 
  holdings: any[]; 
  sortBy: string; 
  onSortChange: (value: string) => void;
  showAll: boolean;
  onToggleShowAll: () => void;
}) {
  // Sort holdings based on selected option
  const sortedHoldings = [...holdings].sort((a, b) => {
    switch (sortBy) {
      case 'value_desc':
        return b.value - a.value;
      case 'value_asc':
        return a.value - b.value;
      case 'name_asc':
        return a.name.localeCompare(b.name);
      case 'name_desc':
        return b.name.localeCompare(a.name);
      case 'type':
        return a.type.localeCompare(b.type);
      case 'gain_desc':
        return b.gain - a.gain;
      case 'gain_asc':
        return a.gain - b.gain;
      default:
        return b.value - a.value;
    }
  });

  // Show only top 5 holdings by default, or all if showAll is true
  const displayedHoldings = showAll ? sortedHoldings : sortedHoldings.slice(0, 5);
  const hasMoreHoldings = sortedHoldings.length > 5;

  return (
    <div>
      {/* Sorting Controls */}
      <div className="flex items-center gap-2 mb-4">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Sort by:</span>
        <Select value={sortBy} onValueChange={onSortChange}>
          <SelectTrigger className="w-48 sm:w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="value_desc">Amount (Highest to Lowest)</SelectItem>
            <SelectItem value="value_asc">Amount (Lowest to Highest)</SelectItem>
            <SelectItem value="name_asc">Name (A-Z)</SelectItem>
            <SelectItem value="name_desc">Name (Z-A)</SelectItem>
            <SelectItem value="type">Product Type</SelectItem>
            <SelectItem value="gain_desc">Gain (Highest to Lowest)</SelectItem>
            <SelectItem value="gain_asc">Gain (Lowest to Highest)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table for desktop/tablet */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Security</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Type</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Value</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Allocation</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Current Gain</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">1Y Return</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Benchmark</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Benchmark Return</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Alpha</th>
            </tr>
          </thead>
          <tbody>
            {displayedHoldings.map((holding, index) => (
              <tr key={index} className="border-b border-border hover:bg-muted/50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <SecurityAvatar 
                      securityName={holding.name} 
                      securityType={holding.type}
                      size="sm"
                    />
                    <span className="font-medium">{holding.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{holding.type}</td>
                <td className="px-4 py-3 text-right font-medium">₹{(holding.value / 100000).toFixed(1)}L</td>
                <td className="px-4 py-3 text-right">{holding.allocation}%</td>
                <td className={`px-4 py-3 text-right font-medium ${holding.gain >= 0 ? 'text-green-600 dark:text-green-400 primesoft-theme:text-green-300' : 'text-red-600 dark:text-red-400 primesoft-theme:text-red-300'}`}>
                  {holding.gain > 0 ? '+' : ''}{holding.gain}%
                </td>
                <td className={`px-4 py-3 text-right font-medium ${holding.oneYearReturn >= 0 ? 'text-green-600 dark:text-green-400 primesoft-theme:text-green-300' : 'text-red-600 dark:text-red-400 primesoft-theme:text-red-300'}`}>
                  {holding.oneYearReturn > 0 ? '+' : ''}{holding.oneYearReturn}%
                </td>
                <td className="px-4 py-3 text-muted-foreground">{holding.benchmark}</td>
                <td className={`px-4 py-3 text-right ${holding.benchmarkReturn >= 0 ? 'text-green-600 dark:text-green-400 primesoft-theme:text-green-300' : 'text-red-600 dark:text-red-400 primesoft-theme:text-red-300'}`}>
                  {holding.benchmarkReturn > 0 ? '+' : ''}{holding.benchmarkReturn}%
                </td>
                <td className={`px-4 py-3 text-right font-medium ${holding.alphaReturn > 0 ? 'text-green-600 dark:text-green-400 primesoft-theme:text-green-300' : holding.alphaReturn < 0 ? 'text-red-600 dark:text-red-400 primesoft-theme:text-red-300' : 'text-muted-foreground'}`}>
                  {holding.alphaReturn > 0 ? '+' : ''}{holding.alphaReturn}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Cards for mobile */}
      <div className="md:hidden space-y-3">
        {displayedHoldings.map((holding, index) => (
          <div key={index} className="p-3 rounded-lg border border-border bg-card">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                <SecurityAvatar 
                  securityName={holding.name} 
                  securityType={holding.type}
                  size="sm"
                />
                <div>
                  <div className="font-medium text-sm">{holding.name}</div>
                  <div className="text-xs text-muted-foreground">{holding.type}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium text-sm">₹{(holding.value / 100000).toFixed(1)}L</div>
                <div className="text-xs text-muted-foreground">{holding.allocation}% allocation</div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <div className="text-muted-foreground">Current Gain</div>
                <div className={`font-medium ${holding.gain >= 0 ? 'text-green-600 dark:text-green-400 primesoft-theme:text-green-300' : 'text-red-600 dark:text-red-400 primesoft-theme:text-red-300'}`}>
                  {holding.gain > 0 ? '+' : ''}{holding.gain}%
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">1Y Return</div>
                <div className={`font-medium ${holding.oneYearReturn >= 0 ? 'text-green-600 dark:text-green-400 primesoft-theme:text-green-300' : 'text-red-600 dark:text-red-400 primesoft-theme:text-red-300'}`}>
                  {holding.oneYearReturn > 0 ? '+' : ''}{holding.oneYearReturn}%
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Alpha</div>
                <div className={`font-medium text-right ${holding.alphaReturn > 0 ? 'text-green-600 dark:text-green-400 primesoft-theme:text-green-300' : holding.alphaReturn < 0 ? 'text-red-600 dark:text-red-400 primesoft-theme:text-red-300' : 'text-muted-foreground'}`}>
                  {holding.alphaReturn > 0 ? '+' : ''}{holding.alphaReturn}%
                </div>
              </div>
            </div>
            
            <div className="mt-2 pt-2 border-t border-border">
              <div className="text-xs text-muted-foreground">Benchmark</div>
              <div className="flex justify-between items-center">
                <div className="font-medium text-sm">{holding.benchmark}</div>
                <div className={`text-xs ${holding.benchmarkReturn >= 0 ? 'text-green-600 dark:text-green-400 primesoft-theme:text-green-300' : 'text-red-600 dark:text-red-400 primesoft-theme:text-red-300'}`}>
                  {holding.benchmarkReturn > 0 ? '+' : ''}{holding.benchmarkReturn}%
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Show More/Less Button */}
      {hasMoreHoldings && (
        <div className="mt-4 text-center">
          <Button 
            variant="outline" 
            onClick={onToggleShowAll}
            className="text-sm"
          >
            {showAll ? (
              <>
                Show Less
                <ChevronUp className="h-4 w-4 ml-1" />
              </>
            ) : (
              <>
                Show More ({sortedHoldings.length - 5} more holdings)
                <ChevronDown className="h-4 w-4 ml-1" />
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

// Legacy Holdings table component
function HoldingsTable({ holdings }: { holdings: any[] }) {
  return (
    <div>
      {/* Table for desktop/tablet */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Security</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Type</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Value</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Allocation</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Current Gain</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">1Y Return</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Benchmark</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Benchmark Return</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Alpha</th>
            </tr>
          </thead>
          <tbody>
            {holdings.map((holding, index) => (
              <tr key={index} className="border-b border-border hover:bg-muted/50">
                <td className="px-4 py-3 font-medium">{holding.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{holding.type}</td>
                <td className="px-4 py-3 text-right">
                  ₹{(holding.value / 100000).toFixed(2)} L
                </td>
                <td className="px-4 py-3 text-right">{holding.allocation}%</td>
                <td className={`px-4 py-3 text-right ${holding.gain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {holding.gain > 0 ? '+' : ''}{holding.gain}%
                </td>
                <td className={`px-4 py-3 text-right ${holding.oneYearReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {holding.oneYearReturn > 0 ? '+' : ''}{holding.oneYearReturn}%
                </td>
                <td className="px-4 py-3 text-muted-foreground">{holding.benchmark}</td>
                <td className={`px-4 py-3 text-right ${holding.benchmarkReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {holding.benchmarkReturn > 0 ? '+' : ''}{holding.benchmarkReturn}%
                </td>
                <td className={`px-4 py-3 text-right font-medium ${holding.alphaReturn > 0 ? 'text-green-600' : holding.alphaReturn < 0 ? 'text-red-600' : 'text-muted-foreground'}`}>
                  {holding.alphaReturn > 0 ? '+' : ''}{holding.alphaReturn}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Card view for mobile */}
      <div className="md:hidden space-y-4">
        {holdings.map((holding, index) => (
          <div key={index} className="bg-card border border-border rounded-lg p-4 shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-medium text-sm">{holding.name}</h4>
              <span className={`text-sm font-medium ${holding.gain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {holding.gain > 0 ? '+' : ''}{holding.gain}%
              </span>
            </div>
            <div className="text-xs text-muted-foreground mb-3">{holding.type}</div>
            
            <div className="grid grid-cols-2 gap-3 border-t border-border pt-2">
              <div>
                <div className="text-xs text-muted-foreground">Value</div>
                <div className="font-medium">₹{(holding.value / 100000).toFixed(2)} L</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Allocation</div>
                <div className="font-medium text-right">{holding.allocation}%</div>
              </div>
              
              <div>
                <div className="text-xs text-muted-foreground">1Y Return</div>
                <div className={`font-medium ${holding.oneYearReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {holding.oneYearReturn > 0 ? '+' : ''}{holding.oneYearReturn}%
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Alpha</div>
                <div className={`font-medium text-right ${holding.alphaReturn > 0 ? 'text-green-600' : holding.alphaReturn < 0 ? 'text-red-600' : 'text-muted-foreground'}`}>
                  {holding.alphaReturn > 0 ? '+' : ''}{holding.alphaReturn}%
                </div>
              </div>
            </div>
            
            <div className="mt-2 pt-2 border-t border-border">
              <div className="text-xs text-muted-foreground">Benchmark</div>
              <div className="flex justify-between items-center">
                <div className="font-medium text-sm">{holding.benchmark}</div>
                <div className={`text-xs ${holding.benchmarkReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {holding.benchmarkReturn > 0 ? '+' : ''}{holding.benchmarkReturn}%
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Risk assessment component
function RiskAssessment({ score }: { score: number }) {
  const getScoreLabel = (score: number) => {
    if (score <= 3) return "Low Risk";
    if (score <= 6) return "Moderate Risk";
    return "High Risk";
  };
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Risk Score</span>
        <span className="text-sm font-medium">{score}/10</span>
      </div>
      <div className="relative h-2 bg-muted rounded-full overflow-hidden">
        <div 
          className={`absolute top-0 left-0 h-full ${score <= 3 ? 'bg-green-500' : score <= 6 ? 'bg-amber-500' : 'bg-red-500'}`}
          style={{ width: `${score * 10}%` }}
        ></div>
      </div>
      <div className="text-xs text-muted-foreground">{getScoreLabel(score)}</div>
    </div>
  );
}

// Main portfolio page component
// Collapsible Section Component
function PortfolioSection({ 
  title, 
  icon, 
  children, 
  defaultOpen = false,
  ...props
}: { 
  title: string; 
  icon: React.ReactNode; 
  children: React.ReactNode; 
  defaultOpen?: boolean;
  [key: string]: any;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} {...props}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 dark:hover:bg-muted/30 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-full bg-primary/10 text-primary">
                  {icon}
                </div>
                <CardTitle className="text-lg">{title}</CardTitle>
              </div>
              {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0 px-0 pb-0">
            {children}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

export default function ClientPortfolioPage() {
  const [clientId, setClientId] = useState<number | null>(null);
  const [holdingsSortBy, setHoldingsSortBy] = useState('value_desc');
  const [showAllHoldings, setShowAllHoldings] = useState(false);
  const { toast } = useToast();
  
  // Set page title
  useEffect(() => {
    document.title = "Client Portfolio | Wealth RM";
    
    // Get client ID from URL
    const hash = window.location.hash;
    const match = hash.match(/\/clients\/(\d+)\/portfolio/);
    if (match && match[1]) {
      setClientId(Number(match[1]));
    }
  }, []);

  // Handle hash navigation to specific sections
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes('action-items')) {
      // Wait for component to render then scroll to Action Items section
      setTimeout(() => {
        const actionItemsSection = document.querySelector('[data-section="action-items"]');
        if (actionItemsSection) {
          actionItemsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 1000);
    }
  }, [clientId]);

  // Listen for hash changes while on this page
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.includes('action-items')) {
        setTimeout(() => {
          const actionItemsSection = document.querySelector('[data-section="action-items"]');
          if (actionItemsSection) {
            actionItemsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 500);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);
  
  // Fetch client data
  const { data: client, isLoading } = useQuery({
    queryKey: ['client', clientId],
    queryFn: () => clientId ? clientApi.getClient(clientId) : null,
    enabled: !!clientId,
  });
  
  const handleBackClick = () => {
    window.location.hash = "/clients";
  };
  
  if (!clientId) {
    return (
      <div className="px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 py-6 sm:py-8 lg:py-10">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">Client not found</h1>
        <Button onClick={handleBackClick}>Back to Clients</Button>
      </div>
    );
  }
  
  // Convert string AUM to numerical value for calculations if needed
  const getAumValue = (aumString?: string): number => {
    if (!aumString) return 0;
    
    // Handle crores format (e.g., "₹2.93 Cr" -> 29300000)
    const crMatch = aumString.match(/₹([\d\.]+)\s*Cr/);
    if (crMatch) {
      return parseFloat(crMatch[1]) * 10000000; // 1 Cr = 10,000,000
    }
    
    // Handle lakhs format (e.g., "₹11.20 L" -> 1120000)
    const lMatch = aumString.match(/₹([\d\.]+)\s*L/);
    if (lMatch) {
      return parseFloat(lMatch[1]) * 100000; // 1 L = 100,000
    }
    
    return 0;
  };
  
  // Generate realistic AUM trend data based on current value and relationship start date
  const generateAumTrendData = (currentValue: number, clientSince?: Date | null): {date: string, value: number}[] => {
    const data: {date: string, value: number}[] = [];
    const today = new Date();
    
    // Default to 3 years ago if no relationship start date provided
    let startDate = new Date(today.getFullYear() - 3, today.getMonth(), 1);
    
    if (clientSince && clientSince instanceof Date && !isNaN(clientSince.getTime())) {
      startDate = new Date(clientSince);
    } else {
      // If client since is not a valid date, fall back to 3 years ago
      console.log("Using default start date for AUM trend chart");
    }
    
    // Generate monthly data points from start date to today
    let currentDate = new Date(startDate);
    let previousValue = currentValue * 0.85; // Start with a lower value
    
    // Add data point for start month
    data.push({
      date: currentDate.toISOString().slice(0, 7),
      value: previousValue
    });
    
    // Move to next month
    currentDate.setMonth(currentDate.getMonth() + 1);
    
    // Generate data points for all months between start and now
    while (currentDate <= today) {
      // Random fluctuation between -5% and +5%
      const fluctuation = 0.95 + (Math.random() * 0.1);
      
      // Gradually increase probability of growth as we approach present time
      const timeProgress = (currentDate.getTime() - startDate.getTime()) / 
                          (today.getTime() - startDate.getTime());
      const growthBias = 0.02 * timeProgress; // Up to 2% growth bias toward present time
      
      // Apply fluctuation with growth bias
      const newValue = previousValue * (fluctuation + growthBias);
      
      data.push({
        date: currentDate.toISOString().slice(0, 7),
        value: newValue
      });
      
      previousValue = newValue;
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
    
    // Ensure the last value is the current AUM
    if (data.length > 0) {
      data[data.length - 1].value = currentValue;
    }
    
    return data;
  };
  
  const aumValue = getAumValue(client?.aum);
  
  return (
    <ClientPageLayout client={client} isLoading={isLoading} clientId={clientId || 0}>
      {/* Page Header with Navigation */}
      <div className="bg-card border-b border-border px-3 py-3">
        <h2 className="text-2xl sm:text-3xl font-semibold text-foreground mb-3 ml-3">Portfolio</h2>
        
        {/* Navigation Icons */}
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-3 ml-3">
          <button 
            className="flex items-center justify-center px-1 py-2 rounded-lg hover:bg-muted transition-colors h-12 w-full"
            onClick={() => window.location.hash = `/clients/${clientId}/personal`}
            title="Personal Profile"
          >
            <User className="h-6 w-6 text-muted-foreground" />
          </button>
          
          <button 
            className="flex items-center justify-center px-1 py-2 rounded-lg bg-primary/10 border border-primary/20 h-12 w-full"
            title="Portfolio"
          >
            <PieChart className="h-6 w-6 text-primary" />
          </button>
          
          <button 
            className="flex items-center justify-center px-1 py-2 rounded-lg hover:bg-muted transition-colors h-12 w-full"
            onClick={() => window.location.hash = `/clients/${clientId}/transactions`}
            title="Transactions"
          >
            <Receipt className="h-6 w-6 text-muted-foreground" />
          </button>
          
          <button 
            className="flex items-center justify-center px-1 py-2 rounded-lg hover:bg-muted transition-colors h-12 w-full"
            onClick={() => window.location.hash = `/clients/${clientId}/appointments`}
            title="Appointments"
          >
            <Calendar className="h-6 w-6 text-muted-foreground" />
          </button>
          
          <button 
            className="flex items-center justify-center px-1 py-2 rounded-lg hover:bg-muted transition-colors h-12 w-full"
            onClick={() => window.location.hash = `/clients/${clientId}/communications`}
            title="Notes"
          >
            <FileText className="h-6 w-6 text-muted-foreground" />
          </button>
          
          <button 
            className="flex items-center justify-center px-1 py-2 rounded-lg hover:bg-muted transition-colors h-12 w-full"
            onClick={() => {
              // Check if mobile device
              const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
              
              if (isMobile) {
                // On mobile, open in same tab for better experience
                window.location.href = `/api/clients/${clientId}/portfolio-report`;
              } else {
                // On desktop, open in new tab
                window.open(`/api/clients/${clientId}/portfolio-report`, '_blank');
              }
            }}
            title="Portfolio Report"
          >
            <FileBarChart className="h-6 w-6 text-muted-foreground" />
          </button>
          
          <button 
            className="flex items-center justify-center px-1 py-2 rounded-lg hover:bg-muted transition-colors h-12 w-full"
            onClick={() => window.location.hash = `/clients/${clientId}/insights`}
            title="Client Insights"
          >
            <Lightbulb className="h-6 w-6 text-muted-foreground" />
          </button>
          
          <button 
            className="flex items-center justify-center px-1 py-2 rounded-lg hover:bg-muted transition-colors h-12 w-full"
            onClick={() => window.location.hash = `/clients/${clientId}/goals`}
            title="Goals"
          >
            <Target className="h-6 w-6 text-muted-foreground" />
          </button>

        </div>
      </div>
      

      
      {/* Portfolio Sections as Collapsible Cards */}
      <div className="space-y-3 flex-grow w-full">
        
        {/* Summary Section */}
        <PortfolioSection
          title="Summary"
          icon={<IndianRupee className="h-5 w-5" />}
          defaultOpen={true}
        >
          <Card>
            <CardContent className="p-0">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4">
                {/* AUM */}
                <div className="text-center">
                  <div className="text-sm text-muted-foreground mb-1">AUM</div>
                  <div className="text-lg font-semibold">₹{Math.round(aumValue / 100000)} L</div>
                </div>
                
                {/* Investment */}
                <div className="text-center">
                  <div className="text-sm text-muted-foreground mb-1">Investment</div>
                  <div className="text-lg font-semibold">₹{Math.round((aumValue * 0.85) / 100000)} L</div>
                </div>
                
                {/* Unrealized Gain */}
                <div className="text-center">
                  <div className="text-sm text-muted-foreground mb-1">Unrealized Gain</div>
                  <div className="text-lg font-semibold text-green-600 dark:text-green-400">
                    ₹{Math.round((aumValue * 0.15) / 100000)} L
                    <span className="text-xs ml-1">↗ 19.05%</span>
                  </div>
                </div>
                
                {/* XIRR */}
                <div className="text-center">
                  <div className="text-sm text-muted-foreground mb-1">XIRR</div>
                  <div className="text-lg font-semibold">{(client as any)?.yearlyPerformance || 12.5}%</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </PortfolioSection>
        
        {/* Portfolio Overview Section */}
        <PortfolioSection
          title="Portfolio Overview"
          icon={<PieChart className="h-5 w-5" />}
          defaultOpen={true}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="md:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle>Asset Allocation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col">
                    <div className="flex-1 h-52">
                      <AssetAllocationChart 
                        data={(client as any)?.assetAllocation || mockAssetAllocation} 
                      />
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <div className="mb-4">
                      <CardTitle>AUM Trends (3 Years)</CardTitle>
                    </div>
                    <div className="flex-1 border rounded-md p-4 h-52">
                      <SimpleAumTrendChart aumValue={client?.aumValue || 5000000} />
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-0">
                <Button variant="link" className="ml-auto">
                  View Rebalancing Opportunities
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Performance Snapshot</CardTitle>
                <CardDescription>Returns across time periods</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <LocalPerformanceChart periods={performancePeriods} />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-0">
                <Button variant="link" className="ml-auto">
                  Detailed Performance Analysis
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </CardFooter>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Sector Exposure</CardTitle>
                <CardDescription>Allocation by industry sectors</CardDescription>
              </CardHeader>
              <CardContent>
                <AllocationChart 
                  data={(client as any)?.sectorExposure || mockSectorExposure as Record<string, number>} 
                  title="" 
                  color="purple" 
                />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Underlying Security Exposure</CardTitle>
                <CardDescription>Look-through to actual companies</CardDescription>
              </CardHeader>
              <CardContent>
                <AllocationChart 
                  data={{
                    "Reliance Industries": 8.3,
                    "HDFC Bank": 7.5,
                    "Infosys": 6.2,
                    "TCS": 5.8,
                    "ICICI Bank": 5.1,
                    "Others": 67.1
                  }} 
                  title="" 
                  color="green" 
                />
              </CardContent>
            </Card>
          </div>

        </PortfolioSection>
        
        {/* Holdings Section */}
        <PortfolioSection
          title="Holdings"
          icon={<IndianRupee className="h-5 w-5" />}
          defaultOpen={false}
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Portfolio Holdings</CardTitle>
              <CardDescription>All investments with sorting and filtering options</CardDescription>
            </CardHeader>
            <CardContent>
              <SortableHoldingsTable 
                holdings={mockHoldings}
                sortBy={holdingsSortBy}
                onSortChange={setHoldingsSortBy}
                showAll={showAllHoldings}
                onToggleShowAll={() => setShowAllHoldings(!showAllHoldings)}
              />
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2 text-green-500" />
                  Top Performers
                </CardTitle>
                <CardDescription>Best performing holdings in your portfolio</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockHoldings
                    .sort((a, b) => b.gain - a.gain)
                    .slice(0, 5)
                    .map((holding, index) => (
                      <div key={index} className="flex justify-between items-center p-2 rounded-md hover:bg-muted/50">
                        <div className="flex items-start space-x-2">
                          <SecurityAvatar 
                            securityName={holding.name} 
                            securityType={holding.type}
                            size="sm"
                          />
                          <div>
                            <div className="font-medium text-sm">{holding.name}</div>
                            <div className="text-xs text-muted-foreground">{holding.type}</div>
                          </div>
                        </div>
                        <div className="text-green-600 dark:text-green-400 font-medium">+{holding.gain}%</div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center">
                  <ArrowDownRight className="h-5 w-5 mr-2 text-red-500" />
                  Underperformers
                </CardTitle>
                <CardDescription>Holdings that need attention</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockHoldings
                    .sort((a, b) => a.gain - b.gain)
                    .slice(0, 5)
                    .map((holding, index) => (
                      <div key={index} className="flex justify-between items-center p-2 rounded-md hover:bg-muted/50">
                        <div className="flex items-start space-x-2">
                          <SecurityAvatar 
                            securityName={holding.name} 
                            securityType={holding.type}
                            size="sm"
                          />
                          <div>
                            <div className="font-medium text-sm">{holding.name}</div>
                            <div className="text-xs text-muted-foreground">{holding.type}</div>
                          </div>
                        </div>
                        <div className={`font-medium ${holding.gain >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                          {holding.gain > 0 ? '+' : ''}{holding.gain}%
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </PortfolioSection>
        
        {/* Performance Section */}
        <PortfolioSection
          title="Performance"
          icon={<TrendingUp className="h-5 w-5" />}
          defaultOpen={false}
        >
          <div className="grid grid-cols-1 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle>Historical Performance</CardTitle>
                <CardDescription>Portfolio value growth over time</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <div className="h-full">
                  <SimpleAumTrendChart aumValue={client?.aumValue || 5000000} />
                </div>
              </CardContent>
            </Card>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Benchmark Comparison</CardTitle>
                  <CardDescription>Portfolio vs Market Index (Base 100)</CardDescription>
                </CardHeader>
                <CardContent className="h-72">
                  <div className="h-full">
                    <BenchmarkComparisonChart aumValue={client?.aumValue || 5000000} />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Portfolio Efficiency Analysis</CardTitle>
                  <CardDescription>Risk vs. Return positioning of portfolio holdings</CardDescription>
                </CardHeader>
                <CardContent className="h-72">
                  <div className="h-full">
                    <PortfolioEfficiencyChart holdings={mockHoldings} />
                  </div>
                </CardContent>
              </Card>

            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Performance by Time Period</CardTitle>
                <CardDescription>Portfolio vs Benchmark comparison across timeframes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Monthly Performance Chart */}
                  <div className="border rounded-lg p-3 bg-card">
                    <PerformanceComparisonChart 
                      data={performancePeriods.filter(p => ['1M', '3M', '6M'].includes(p.label))} 
                      timeframe="monthly"
                    />
                  </div>
                  
                  {/* Yearly Performance Chart */}
                  <div className="border rounded-lg p-3 bg-card">
                    <PerformanceComparisonChart 
                      data={performancePeriods.filter(p => ['1Y', '3Y', '5Y'].includes(p.label))} 
                      timeframe="yearly"
                    />
                  </div>
                  
                  {/* Overall Performance Chart */}
                  <div className="border rounded-lg p-3 bg-card">
                    <PerformanceComparisonChart 
                      data={performancePeriods.filter(p => ['YTD', 'Since Inception'].includes(p.label))} 
                      timeframe="overall"
                    />
                  </div>
                  
                  {/* Summary Text */}
                  <div className="text-xs text-muted-foreground pt-2 px-1">
                    <p>
                      <span className="font-medium">Alpha</span> represents excess return over benchmark after adjusting for risk. 
                      Positive values indicate outperformance of the managed portfolio versus the market benchmark.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            

          </div>
        </PortfolioSection>
        
        {/* Risk Analysis Section */}
        <PortfolioSection
          title="Risk Analysis"
          icon={<AlertTriangle className="h-5 w-5" />}
          defaultOpen={false}
        >
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Risk and Return Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm">
                  {/* Risk Adjusted Returns Section */}
                  <div className="mb-4">
                    <h4 className="font-medium text-foreground mb-2">Risk Adjusted Returns</h4>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                      <div className="border rounded-lg p-2">
                        <div className="text-muted-foreground text-xs">Standard Deviation (1Y)</div>
                        <div className="flex items-center mt-1">
                          <span className="text-base font-medium">12.4%</span>
                          <div className="ml-auto px-1.5 py-0.5 text-xs rounded bg-amber-100/50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-200">Moderate</div>
                        </div>
                      </div>
                      
                      <div className="border rounded-lg p-2">
                        <div className="text-muted-foreground text-xs">Sharpe Ratio</div>
                        <div className="flex items-center mt-1">
                          <span className="text-base font-medium">1.78</span>
                          <div className="ml-auto px-1.5 py-0.5 text-xs rounded bg-green-100/50 dark:bg-green-950/30 text-green-800 dark:text-green-200">Good</div>
                        </div>
                      </div>
                      
                      <div className="border rounded-lg p-2">
                        <div className="text-muted-foreground text-xs">Alpha</div>
                        <div className="flex items-center mt-1">
                          <span className="text-base font-medium">2.6%</span>
                          <div className="ml-auto px-1.5 py-0.5 text-xs rounded bg-green-100/50 dark:bg-green-950/30 text-green-800 dark:text-green-200">Positive</div>
                        </div>
                      </div>
                      
                      <div className="border rounded-lg p-2">
                        <div className="text-muted-foreground text-xs">Beta</div>
                        <div className="flex items-center mt-1">
                          <span className="text-base font-medium">0.92</span>
                          <div className="ml-auto px-1.5 py-0.5 text-xs rounded bg-blue-100/50 dark:bg-blue-950/30 text-blue-800 dark:text-blue-200">Defensive</div>
                        </div>
                      </div>
                      
                      <div className="border rounded-lg p-2 col-span-2">
                        <div className="text-muted-foreground text-xs">Information Ratio</div>
                        <div className="flex items-center mt-1">
                          <span className="text-base font-medium">1.24</span>
                          <div className="ml-auto px-1.5 py-0.5 text-xs rounded bg-green-100/50 dark:bg-green-950/30 text-green-800 dark:text-green-200">Strong</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Value at Risk Section */}
                  <div className="mb-4">
                    <h4 className="font-medium text-foreground mb-2">Value at Risk</h4>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                      <div className="border rounded-lg p-2">
                        <div className="text-muted-foreground text-xs">VaR (95% Confidence)</div>
                        <div className="flex items-center mt-1">
                          <span className="text-base font-medium text-red-600 dark:text-red-400">-7.2%</span>
                          <div className="ml-auto px-1.5 py-0.5 text-xs rounded bg-amber-100/50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-200">Moderate</div>
                        </div>
                      </div>
                      
                      <div className="border rounded-lg p-2">
                        <div className="text-muted-foreground text-xs">VaR (99% Confidence)</div>
                        <div className="flex items-center mt-1">
                          <span className="text-base font-medium text-red-600 dark:text-red-400">-11.5%</span>
                          <div className="ml-auto px-1.5 py-0.5 text-xs rounded bg-amber-100/50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-200">Moderate</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Diversification Section */}
                  <div>
                    <h4 className="font-medium text-foreground mb-2">Diversification</h4>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                      <div className="border rounded-lg p-2">
                        <div className="text-muted-foreground text-xs">Diversification Score</div>
                        <div className="flex items-center mt-1">
                          <span className="text-base font-medium">8.2/10</span>
                          <div className="ml-auto px-1.5 py-0.5 text-xs rounded bg-green-100/50 dark:bg-green-950/30 text-green-800 dark:text-green-200">Well Diversified</div>
                        </div>
                      </div>
                      
                      <div className="border rounded-lg p-2">
                        <div className="text-muted-foreground text-xs">Correlation Score</div>
                        <div className="flex items-center mt-1">
                          <span className="text-base font-medium">0.34</span>
                          <div className="ml-auto px-1.5 py-0.5 text-xs rounded bg-green-100/50 dark:bg-green-950/30 text-green-800 dark:text-green-200">Low Correlation</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-3 text-xs text-muted-foreground">
                    <p>Risk metrics calculated as of {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Risk Breakdown</CardTitle>
                <CardDescription>Analysis of portfolio risk factors</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm font-medium mb-2">Risk Contribution by Asset Class</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Equity</span>
                        <span className="font-medium">82%</span>
                      </div>
                      <Progress value={82} className="h-2" />
                      
                      <div className="flex justify-between text-sm">
                        <span>Fixed Income</span>
                        <span className="font-medium">10%</span>
                      </div>
                      <Progress value={10} className="h-2" />
                      
                      <div className="flex justify-between text-sm">
                        <span>Gold</span>
                        <span className="font-medium">6%</span>
                      </div>
                      <Progress value={6} className="h-2" />
                      
                      <div className="flex justify-between text-sm">
                        <span>Cash</span>
                        <span className="font-medium">2%</span>
                      </div>
                      <Progress value={2} className="h-2" />
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h4 className="text-sm font-medium mb-2">Risk Concentration</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium">Top 5 Holdings</div>
                          <div className="text-xs text-muted-foreground">Portfolio Concentration</div>
                        </div>
                        <div className="font-medium">68%</div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium">Largest Sector</div>
                          <div className="text-xs text-muted-foreground">Financial Services</div>
                        </div>
                        <div className="font-medium">28%</div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium">Diversification Score</div>
                          <div className="text-xs text-muted-foreground">Overall Assessment</div>
                        </div>
                        <div className="font-medium">7/10</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Drawdown Analysis</CardTitle>
                <CardDescription>Historical downside risk assessment</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm font-medium mb-2">Maximum Drawdown</h4>
                    <div className="text-2xl font-bold text-red-600">-18.5%</div>
                    <div className="text-xs text-muted-foreground">March 2020 (COVID-19 Crash)</div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium">Recovery Time</div>
                        <div className="text-xs text-muted-foreground">Last Major Drawdown</div>
                      </div>
                      <div className="font-medium">7 Months</div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium">Value at Risk (Monthly)</div>
                        <div className="text-xs text-muted-foreground">95% Confidence</div>
                      </div>
                      <div className="font-medium text-amber-600">-5.2%</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </PortfolioSection>
        
        {/* Financial Planning Section */}
        <PortfolioSection
          title="Financial Planning"
          icon={<Calculator className="h-5 w-5" />}
          defaultOpen={false}
        >
          <Card>
            <CardHeader>
              <CardTitle>Financial Goals</CardTitle>
              <CardDescription>Progress toward your investment objectives</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="flex justify-between items-baseline">
                    <h4 className="font-medium">Retirement Planning</h4>
                    <span className="text-sm text-green-600 dark:text-green-400 font-medium">75% Funded</span>
                  </div>
                  <Progress value={75} className="h-2" />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Current: ₹37.5 L</span>
                    <span>Target: ₹50 L</span>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-baseline">
                    <h4 className="font-medium">Children's Education</h4>
                    <span className="text-sm text-green-600 dark:text-green-400 font-medium">60% Funded</span>
                  </div>
                  <Progress value={60} className="h-2" />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Current: ₹12 L</span>
                    <span>Target: ₹20 L</span>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-baseline">
                    <h4 className="font-medium">Property Purchase</h4>
                    <span className="text-sm text-amber-600 dark:text-amber-400 font-medium">35% Funded</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-amber-500 h-2 rounded-full" style={{ width: '35%' }}></div>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Current: ₹17.5 L</span>
                    <span>Target: ₹50 L</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Retirement Projections</CardTitle>
              </CardHeader>
              <CardContent>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="text-sm text-muted-foreground">Retirement Age</div>
                    <div className="text-xl font-bold">60 years</div>
                  </div>
                  
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="text-sm text-muted-foreground">Monthly Income</div>
                    <div className="text-xl font-bold">₹85,000</div>
                  </div>
                  
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="text-sm text-muted-foreground">Projected Corpus</div>
                    <div className="text-xl font-bold">₹2.1 Cr</div>
                  </div>
                  
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="text-sm text-muted-foreground">Funding Status</div>
                    <div className="text-xl font-bold text-green-600 dark:text-green-400">75%</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-3 bg-green-50/50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <h4 className="text-sm font-medium text-green-800 dark:text-green-200 flex items-center">
                      <TrendingUp className="h-4 w-4 mr-2 text-green-600 dark:text-green-400" />
                      Increase Monthly SIP
                    </h4>
                    <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                      To reach your retirement goal, consider increasing your monthly SIP by ₹5,000.
                    </p>
                  </div>
                  
                  <div className="p-3 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 flex items-center">
                      <Shield className="h-4 w-4 mr-2 text-blue-600 dark:text-blue-400" />
                      Review Insurance Coverage
                    </h4>
                    <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                      Your life insurance coverage appears insufficient. We recommend increasing it to ₹1 Cr.
                    </p>
                  </div>
                  
                  <div className="p-3 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                    <h4 className="text-sm font-medium text-amber-800 dark:text-amber-200 flex items-center">
                      <Landmark className="h-4 w-4 mr-2 text-amber-600 dark:text-amber-400" />
                      Tax Planning
                    </h4>
                    <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                      You have ₹50,000 remaining in your Section 80C limit. Consider additional ELSS investments.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </PortfolioSection>
        
        {/* Action Items Section */}
        <PortfolioSection
          title="Action Items"
          icon={<AlertCircle className="h-5 w-5" />}
          defaultOpen={true}
          data-section="action-items"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="overflow-hidden border border-border shadow-md">
              <CardHeader className="pb-3 bg-amber-600 dark:bg-amber-800 text-white transition-colors">
                <CardTitle className="flex items-center text-lg text-white font-semibold">
                  <AlertCircle className="h-5 w-5 mr-2 text-white" />
                  Portfolio Alerts
                </CardTitle>
                <CardDescription className="text-amber-100 dark:text-amber-200">Important notices about your investments</CardDescription>
              </CardHeader>
              <CardContent className="p-5">
                <div className="space-y-4">
                  <div className="p-4 bg-muted border-l-4 border-amber-500 rounded-r-lg shadow-sm">
                    <h4 className="text-sm font-medium text-foreground flex items-center">
                      <AlertTriangle className="h-4 w-4 mr-2 text-amber-500" />
                      <span className="font-semibold">Portfolio Rebalancing Due</span>
                    </h4>
                    <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                      Your equity allocation has drifted 5% above target. Consider rebalancing to maintain your risk profile.
                    </p>
                    <div className="mt-3">
                      <Button size="sm" variant="outline" className="text-xs">
                        Review Allocation
                      </Button>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-muted border-l-4 border-blue-500 rounded-r-lg shadow-sm">
                    <h4 className="text-sm font-medium text-foreground flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-blue-500" />
                      <span className="font-semibold">Fixed Deposit Maturing</span>
                    </h4>
                    <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                      Your HDFC Bank FD of ₹3,00,000 is maturing in 15 days. Contact your RM for reinvestment options.
                    </p>
                    <div className="mt-3">
                      <Button size="sm" variant="outline" className="text-xs">
                        View Options
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="overflow-hidden border border-border shadow-md">
              <CardHeader className="pb-3 bg-indigo-600 dark:bg-indigo-800 text-white transition-colors">
                <CardTitle className="flex items-center text-lg text-white font-semibold">
                  <Lightbulb className="h-5 w-5 mr-2 text-white" />
                  Investment Opportunities
                </CardTitle>
                <CardDescription className="text-indigo-100 dark:text-indigo-200">Personalized recommendations</CardDescription>
              </CardHeader>
              <CardContent className="p-5">
                <div className="space-y-4">
                  <div className="p-4 bg-muted border-l-4 border-indigo-500 rounded-r-lg shadow-sm">
                    <h4 className="text-sm font-medium text-foreground flex items-center">
                      <Wallet className="h-4 w-4 mr-2 text-indigo-500" />
                      <span className="font-semibold">Increase Tax-Efficient Investments</span>
                    </h4>
                    <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                      Based on your tax bracket, consider additional ELSS funds to optimize tax savings.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge variant="outline">ELSS Funds</Badge>
                      <Badge variant="outline">Tax Planning</Badge>
                    </div>
                    <div className="mt-3">
                      <Button size="sm" variant="outline" className="text-xs">
                        Explore Options
                      </Button>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-muted border-l-4 border-indigo-500 rounded-r-lg shadow-sm">
                    <h4 className="text-sm font-medium text-foreground flex items-center">
                      <Globe className="h-4 w-4 mr-2 text-indigo-500" />
                      <span className="font-semibold">International Diversification</span>
                    </h4>
                    <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                      Add exposure to US markets through index funds to increase geographic diversification.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge variant="outline">International Equity</Badge>
                      <Badge variant="outline">Diversification</Badge>
                    </div>
                    <div className="mt-3">
                      <Button size="sm" variant="outline" className="text-xs">
                        View Funds
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </PortfolioSection>
      </div>
    </ClientPageLayout>
  );
}