import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { getTierColor, formatRelativeDate } from "@/lib/utils";
import { 
  Search,
  UserPlus,
  Filter as FilterIcon,
  ChevronDown,
  Download,
  X,
  Check,
  Phone,
  Mail,
  Bell,
  Crown,
  Award,
  Medal,
  AlertTriangle
} from "lucide-react";
import { clientApi } from "@/lib/api";
import { Client } from "@shared/schema";
import {
  calculateRelationshipHealth,
  getRelationshipHealthStatusMeta,
  type RelationshipHealthRecord,
  type RelationshipHealthStatusMeta,
} from "@/utils/relationship-health";
import { useIsMobile } from "@/hooks/use-mobile";
import { generateAvatar } from "@/lib/avatarGenerator";
import { FloatingAddButton } from "@/components/ui/floating-add-button";
import { EmptyState } from "@/components/empty-state";

// Filter options type definition
interface FilterOptions {
  minAum: number;
  maxAum: number;
  includedTiers: string[];
  riskProfiles: string[];
  pendingOnly: boolean;
}

// Helper functions for tier visualization
const getTierIcon = (tier: string) => {
  switch (tier?.toLowerCase()) {
    case 'platinum':
      return Crown;
    case 'gold':
      return Award;
    case 'silver':
      return Medal;
    default:
      return Medal;
  }
};

const getTierBadgeColors = (tier: string) => {
  switch (tier?.toLowerCase()) {
    case 'platinum':
      return {
        bg: 'bg-gradient-to-r from-muted/50 to-muted/80',
        text: 'text-foreground',
        border: 'border-border'
      };
    case 'gold':
      return {
        bg: 'bg-gradient-to-r from-primary/20 to-primary/40',
        text: 'text-foreground',
        border: 'border-primary/40'
      };
    case 'silver':
      return {
        bg: 'bg-gradient-to-r from-muted to-muted/70',
        text: 'text-foreground',
        border: 'border-border'
      };
    default:
      return {
        bg: 'bg-gradient-to-r from-muted to-muted/70',
        text: 'text-foreground',
        border: 'border-border'
      };
  }
};

// Client Card component
interface ClientCardProps {
  client: Client & { profile_status?: string; incomplete_sections?: string[]; aumValue?: number; investmentHorizon?: string | null };
  onClick: (id: number, section?: string) => void;
  health?: RelationshipHealthRecord;
}

function isClientIncomplete(client: any): boolean {
  // Treat as incomplete when server marks it or when core fields are missing/empty
  if (client?.profile_status === 'incomplete') return true;
  const noFinancials = (client?.aumValue ?? 0) === 0;
  const noHorizon = !client?.investmentHorizon;
  const noNetWorth = !client?.netWorth;
  return noFinancials || noHorizon || noNetWorth;
}

function ClientCard({ client, onClick, tasks = [], appointments = [], alerts = [], health }: ClientCardProps & { tasks?: any[], appointments?: any[], alerts?: any[], health?: RelationshipHealthRecord }) {
  const tierColors = getTierColor(client.tier);
  const TierIcon = getTierIcon(client.tier);
  const tierBadge = getTierBadgeColors(client.tier);
  const incomplete = isClientIncomplete(client);

  // Helper: contact urgency (re-added)
  const getContactUrgency = (lastContactDate: Date | string | null | undefined, clientId: number, appointmentsList: any[] = []) => {
    const today = new Date();
    const hasMeetingNextWeek = appointmentsList.some(apt => {
      if (apt.clientId !== clientId) return false;
      const aptDate = new Date(apt.startTime);
      const diffDays = Math.ceil((aptDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= 7;
    });
    if (!lastContactDate) return { isUrgent: true, message: 'No contact record' };
    const contactDate = new Date(lastContactDate);
    const daysSinceContact = Math.floor((new Date().getTime() - contactDate.getTime()) / (1000 * 60 * 60 * 24));
    if (hasMeetingNextWeek || daysSinceContact > 75) return { isUrgent: true, message: 'Contact soon' };
    return { isUrgent: false, message: '' };
  };

  // Handle section clicks
  const handleSectionClick = (e: React.MouseEvent, section: string) => {
    e.stopPropagation();
    onClick(client.id, section);
  };

  // Generate initials if not available
  const getInitials = (name: string) => {
    return name.split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase();
  };

  // Generate avatar color based on client name
  const getAvatarColor = (name: string) => {
    const colors = [
      'bg-blue-500',
      'bg-green-500', 
      'bg-purple-500',
      'bg-primary',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-primary',
      'bg-red-500'
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  // Risk profile color coding
  const getRiskProfileColor = (riskProfile: string | null) => {
    return 'text-foreground';
  };

  const getRiskProfileBg = (riskProfile: string | null) => {
    switch (riskProfile?.toLowerCase()) {
      case 'conservative':
        return 'bg-green-400';
      case 'moderate':
        return 'bg-yellow-400';
      case 'aggressive':
        return 'bg-red-400';
      default:
      return 'bg-muted';
    }
  };

  const HEALTH_TONE_STYLES: Record<RelationshipHealthStatusMeta["tone"], { text: string; bar: string }> = {
    positive: { text: "text-emerald-600 dark:text-emerald-400", bar: "bg-emerald-500" },
    neutral: { text: "text-sky-600 dark:text-sky-400", bar: "bg-sky-500" },
    caution: { text: "text-amber-600 dark:text-amber-400", bar: "bg-amber-500" },
    critical: { text: "text-red-600 dark:text-red-400", bar: "bg-red-500" },
  };

  const DEFAULT_HEALTH_STYLE = { text: "text-foreground", bar: "bg-muted-foreground/50" };

  const healthMeta = health ? getRelationshipHealthStatusMeta(health.status) : undefined;
  const toneStyle = healthMeta ? HEALTH_TONE_STYLES[healthMeta.tone] : DEFAULT_HEALTH_STYLE;
  const healthScore = health ? Math.max(6, Math.min(health.score, 100)) : 0;
  const healthNarrative = health?.recommendedFocus ?? health?.risks[0] ?? health?.strengths[0];
  const highlightAsFocus = Boolean(health?.recommendedFocus || (health?.risks && health.risks.length > 0));
  // Format performance value with sign and color
  const formatPerformance = (performance: number | null | undefined) => {
    if (performance === null || performance === undefined) {
      return <span className="text-xs text-emerald-600 mt-1">1Y +8.5%</span>;
    }
    
    const sign = performance >= 0 ? '+' : '';
    const colorClass = performance >= 0 ? 'text-emerald-600' : 'text-red-600';
    
    return <span className={`text-xs ${colorClass} mt-1`}>1Y {sign}{performance.toFixed(1)}%</span>;
  };
  
  // Calculate days since last transaction
  const getDaysSinceTransaction = (date: Date | null | undefined) => {
    if (!date) return "N/A";
    
    const transactionDate = new Date(date);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - transactionDate.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    return `${diffDays} days ago`;
  };
  
  // Capitalize the first letter of tier
  const formatTier = (tier: string) => {
    return tier.charAt(0).toUpperCase() + tier.slice(1);
  };
  

  
  return (
    <Card 
      className={`overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-primary/10 transform interactive-hover mb-4 border-l-4 ${tierColors.border} !bg-card !border-border`}
    >
      <CardContent className="p-0">
        {/* Header Section - Client Info */}
        <div className="p-4 bg-gradient-to-r from-muted/20 to-transparent border-b border-border/30">
          <div className="flex items-start justify-between">
            <div className="flex gap-3 flex-1">
              {/* Avatar and Tier Badge Column */}
              <div className="flex flex-col items-center gap-2 flex-shrink-0">
                {/* Client Avatar */}
                <Avatar className="h-12 w-12 ring-2 ring-background shadow-sm">
                  <AvatarImage src={generateAvatar(client.fullName, client.id.toString())} alt={client.fullName} />
                  <AvatarFallback className={`${getAvatarColor(client.fullName)} text-white font-semibold text-sm`}>
                    {client.initials || getInitials(client.fullName)}
                  </AvatarFallback>
                </Avatar>
                
                {/* Tier Badge - moved below avatar */}
                <div className={`px-2 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1 ${tierBadge.bg} ${tierBadge.text} border ${tierBadge.border} shadow-sm`}>
                  <TierIcon className="h-3 w-3" />
                  {client.tier ? client.tier.charAt(0).toUpperCase() : 'S'}
                </div>
              </div>
              
              {/* Client Name and Contact - aligned vertically */}
              <div className="flex-1 min-w-0 space-y-1">
                <div 
                  className="cursor-pointer"
                  onClick={(e) => handleSectionClick(e, 'personal')}
                  title="View client personal information"
                >
                  <h3 className="text-sm font-semibold text-foreground truncate hover:text-primary transition-colors">{client.fullName}</h3>
                </div>
                
                {/* Pending badge */}
                {client.profile_status === 'incomplete' || incomplete ? (
                  <div className="inline-flex items-center gap-1 text-xs text-primary bg-primary/10 border border-primary/30 rounded px-2 py-0.5 mt-1">
                    <AlertTriangle className="h-3 w-3" /> Pending profile
                  </div>
                ) : null}
                
                {/* Contact Information Group */}
                <div className="space-y-0.5">
                  {/* Phone - clickable to dial */}
                  {client.phone && (
                    <div className="text-xs text-muted-foreground">
                      <a 
                        href={`tel:${client.phone}`}
                        className="text-foreground hover:text-primary hover:underline transition-colors flex items-center gap-1"
                        title="Call client"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Phone className="h-3 w-3" />
                        {client.phone}
                      </a>
                    </div>
                  )}
                  
                  {/* Email - clickable to send email */}
                  {client.email && (
                    <div className="text-xs text-muted-foreground">
                      <a 
                        href={`mailto:${client.email}`}
                        className="text-foreground hover:text-primary hover:underline transition-colors flex items-center gap-1"
                        title="Send email to client"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Mail className="h-3 w-3" />
                        {client.email}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Alert Badge - positioned more to the left with margin */}
            {(client.alertCount ?? 0) > 0 && (
              <div className="flex items-start mr-2">
                <div 
                  className="relative cursor-pointer flex-shrink-0" 
                  onClick={(e) => handleSectionClick(e, 'actions')}
                  title="View client alerts and actions"
                >
                  <div className="h-7 w-7 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center hover:bg-destructive/90 transition-colors shadow-sm" aria-label="Client alerts">
                    <Bell className="h-3 w-3" aria-hidden="true" />
                  </div>
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center font-semibold shadow-sm">
                    {client.alertCount}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Financial Metrics Section */}
        <div className="p-4 bg-gradient-to-r from-blue-50/50 to-transparent dark:from-blue-950/20 border-b border-border/30">
          <div className="grid grid-cols-3 gap-3">
            {/* AUM - Primary metric with performance */}
            <div 
              className="text-center p-3 bg-card/60 rounded-lg cursor-pointer hover:bg-card transition-all duration-200 shadow-sm hover:shadow-md border border-border/20" 
              onClick={(e) => handleSectionClick(e, 'portfolio')}
              title="View client portfolio"
            >
              <div className="text-xs text-muted-foreground mb-1 font-medium">Portfolio Value</div>
              <div className="text-sm font-bold text-foreground">{client.aum}</div>
              <div className="text-xs text-muted-foreground mt-1 text-center">
                Portfolio
              </div>
            </div>
            
            {/* Last Contact with urgency indicator */}
            <div 
              className="text-center p-3 bg-card/60 rounded-lg cursor-pointer hover:bg-card transition-all duration-200 shadow-sm hover:shadow-md border border-border/20"
              onClick={(e) => handleSectionClick(e, 'communications')}
              title="View client appointments"
            >
              <div className="text-xs text-muted-foreground mb-1 font-medium">Last Contact</div>
              <div className="text-sm font-medium text-foreground">
                {formatRelativeDate(client.lastContactDate)}
              </div>
              {getContactUrgency(client.lastContactDate, client.id, appointments).isUrgent && (
                <div className="text-xs text-muted-foreground mt-1 font-medium">
                  {getContactUrgency(client.lastContactDate, client.id, appointments).message}
                </div>
              )}
            </div>
            
            {/* Last Transaction - moved to top row */}
            <div 
              className="text-center p-3 bg-card/60 rounded-lg cursor-pointer hover:bg-card transition-all duration-200 shadow-sm hover:shadow-md border border-border/20" 
              onClick={(e) => handleSectionClick(e, 'transactions')}
              title="View client transactions"
            >
              <div className="text-xs text-muted-foreground mb-1 font-medium">Last Transaction</div>
              <div className="text-sm font-medium text-foreground">
                {getDaysSinceTransaction(client.lastTransactionDate)}
              </div>
            </div>
          </div>
        </div>

        {/* Secondary Metrics Section */}
        <div className="p-4 bg-gradient-to-r from-muted/30 to-transparent dark:from-muted/20 border-b border-border/30">
          <div className="grid grid-cols-2 gap-3">
            {/* Risk Profile with visual indicator - moved to bottom row */}
            <div className="p-3 bg-card/60 rounded-lg hover:bg-card transition-all duration-200 shadow-sm hover:shadow-md border border-border/20">
              <div className="text-xs text-muted-foreground mb-1 font-medium">Risk Profile</div>
              <div className={`text-sm font-medium ${getRiskProfileColor(client.riskProfile)}`}>
                {client.riskProfile ? client.riskProfile.charAt(0).toUpperCase() + client.riskProfile.slice(1) : 'Moderate'}
              </div>
              <div className={`h-1.5 w-full rounded-full mt-2 ${getRiskProfileBg(client.riskProfile)} shadow-sm`}></div>
            </div>
            
            {/* Client Relationship Health */}
            <div className="p-3 bg-card/60 rounded-lg hover:bg-card transition-all duration-200 shadow-sm hover:shadow-md border border-border/20">
              <div className="text-xs text-muted-foreground mb-1 font-medium">Relationship Health</div>
              <div className="flex items-center justify-between text-sm font-medium">
                <span className={toneStyle.text}>{health?.statusLabel ?? 'Assessing'}</span>
                <span className="text-xs text-muted-foreground">{health ? `${health.score}/100` : '—'}</span>
              </div>
              <div className="mt-2 h-1.5 w-full rounded-full bg-muted overflow-hidden shadow-sm">
                <div
                  className={`h-full transition-all duration-500 ${toneStyle.bar}`}
                  style={{ width: `${health ? healthScore : 0}%` }}
                ></div>
              </div>
              {healthNarrative && (
                <div className="mt-2 text-[11px] text-muted-foreground">
                  {highlightAsFocus ? `Focus: ${healthNarrative}` : `Strength: ${healthNarrative}`}
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const RECENT_KEY = 'recent_clients_v1';
function markRecent(clientId: number) {
  const raw = localStorage.getItem(RECENT_KEY);
  const now = Date.now();
  let data: Record<string, number> = raw ? JSON.parse(raw) : {};
  data[String(clientId)] = now;
  // keep only latest 50
  const entries = Object.entries(data).sort((a,b)=>b[1]-a[1]).slice(0,50);
  localStorage.setItem(RECENT_KEY, JSON.stringify(Object.fromEntries(entries)));
}
function getRecentOrder(): Record<string, number> {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '{}'); } catch { return {}; }
}

export default function Clients() {
  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState(0);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    minAum: 0,
    maxAum: 100000000, // 10 Cr to include all high-value clients
    includedTiers: ['platinum', 'gold', 'silver'],
    riskProfiles: ['conservative', 'moderate', 'aggressive'],
    pendingOnly: false
  });
  const [recentOnly, setRecentOnly] = useState(false);
  
  const isMobile = useIsMobile();
  
  // Set page title
  useEffect(() => {
    document.title = "Clients | Wealth RM";
  }, []);
  
  // Use the clientApi service to fetch clients data
  const { data: clients, isLoading } = useQuery<Client[]>({
    queryKey: ['clients'],
    queryFn: () => clientApi.getClients(),
  });

  // Fetch additional data for health status calculations
  const { data: tasks = [] } = useQuery<any[]>({
    queryKey: ['tasks'],
    queryFn: () => fetch('/api/tasks').then(res => res.json()),
  });

  const { data: appointments = [] } = useQuery<any[]>({
    queryKey: ['appointments'],
    queryFn: () => fetch('/api/appointments').then(res => res.json()),
  });

  const { data: alerts = [] } = useQuery<any[]>({
    queryKey: ['portfolio-alerts'],
    queryFn: () => fetch('/api/portfolio-alerts').then(res => res.json()),
  });

  const healthMap = useMemo(() => {
    if (!Array.isArray(clients)) {
      return new Map<number, RelationshipHealthRecord>();
    }

    const map = new Map<number, RelationshipHealthRecord>();
    clients.forEach((client: any) => {
      if (!client || typeof client.id !== 'number') return;
      const record = calculateRelationshipHealth(client, {
        tasks,
        appointments,
        alerts,
      });
      map.set(client.id, record);
    });
    return map;
  }, [clients, tasks, appointments, alerts]);
  
  // Calculate active filters
  useEffect(() => {
    if (clients) {
      calculateActiveFilters();
    }
  }, [filterOptions, clients]);
  
  const calculateActiveFilters = () => {
    let count = 0;
    
    if (filterOptions.minAum > 0) count++;
    if (filterOptions.maxAum < 100000000) count++;
    if (filterOptions.includedTiers.length < 3) count++;
    if (filterOptions.riskProfiles.length < 3) count++;
    if (filterOptions.pendingOnly) count++;
    
    setActiveFilters(count);
  };
  
  // Add debugging for clients
  console.log('Clients data received:', clients);
  
  const recentMap = getRecentOrder();
  const filteredClients = clients
    ? clients
        .filter((client: Client) => {
          // Apply search filter
          const matchesSearch = !searchQuery || 
            client.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (client.email && client.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (client.phone && client.phone.includes(searchQuery));
          
          // Apply additional filters with safer checks - default to true if value doesn't exist
          const matchesTier = client.tier ? filterOptions.includedTiers.includes(client.tier) : true;
          
          // Check risk profile with case insensitive comparison - default to true if missing
          const riskProfile = client.riskProfile ? client.riskProfile.toLowerCase() : '';
          const matchesRiskProfile = !riskProfile || filterOptions.riskProfiles.includes(riskProfile);
          
          // Set a maximum AUM value to avoid filtering out high-value clients
          const MAX_AUM = 100000000; // 10 Cr
          const aumValue = typeof client.aumValue === 'number' ? client.aumValue : 0;
          const matchesAum = aumValue >= filterOptions.minAum && 
                            (aumValue <= filterOptions.maxAum || filterOptions.maxAum >= MAX_AUM);
          
          // Check pending profiles filter
          const matchesPending = !filterOptions.pendingOnly || isClientIncomplete(client);

          // Check recent access filter
          const matchesRecent = !recentOnly || recentMap[String(client.id)];

          // Check filter results
          const result = matchesSearch && matchesTier && matchesRiskProfile && matchesAum && matchesPending && matchesRecent;
          if (!result) {
            console.log('Filtered out client:', client.id, client.fullName);
            console.log('  - Tier match:', matchesTier, 'Risk match:', matchesRiskProfile, 'AUM match:', matchesAum, 'Pending match:', matchesPending, 'Recent match:', matchesRecent);
          }
          
          return result;
        })
        // Smart sorting: Attention needed first, then by AUM within each group
        .sort((a, b) => {
          if (recentOnly) {
            const ra = recentMap[String(a.id)] || 0;
            const rb = recentMap[String(b.id)] || 0;
            if (rb !== ra) return rb - ra;
          }
          const today = new Date();
          const daysSinceLastContact = a.lastContactDate
            ? Math.floor((today.getTime() - new Date(a.lastContactDate).getTime()) / (1000 * 60 * 60 * 24))
            : 999;
          const daysSinceLastContactB = b.lastContactDate
            ? Math.floor((today.getTime() - new Date(b.lastContactDate).getTime()) / (1000 * 60 * 60 * 24))
            : 999;

          const healthA = healthMap.get(a.id);
          const healthB = healthMap.get(b.id);

          const aNeedsAttention = healthA
            ? healthA.status === 'at-risk' || healthA.status === 'watch'
            : daysSinceLastContact > 90 || (a.alertCount && a.alertCount > 0);
          const bNeedsAttention = healthB
            ? healthB.status === 'at-risk' || healthB.status === 'watch'
            : daysSinceLastContactB > 90 || (b.alertCount && b.alertCount > 0);

          if (aNeedsAttention && !bNeedsAttention) return -1;
          if (!aNeedsAttention && bNeedsAttention) return 1;

          if (healthA && healthB && healthA.score !== healthB.score) {
            return healthA.score - healthB.score;
          }

          return (b.aumValue || 0) - (a.aumValue || 0);
        })
    : [];
  
  // Reset filters function
  const resetFilters = () => {
    setFilterOptions({
      minAum: 0,
      maxAum: 100000000,
      includedTiers: ['platinum', 'gold', 'silver'],
      riskProfiles: ['conservative', 'moderate', 'aggressive'],
      pendingOnly: false
    });
  };
  
  // Export clients to CSV
  const exportClients = () => {
    if (!filteredClients || filteredClients.length === 0) return;
    
    // Create CSV content
    const headers = ['Name', 'Email', 'Phone', 'AUM', 'Tier', 'Risk Profile', 'Last Contact'];
    const rows = filteredClients.map(c => [
      c.fullName,
      c.email || '',
      c.phone || '',
      c.aum,
      c.tier,
      c.riskProfile,
      c.lastContactDate ? new Date(c.lastContactDate).toLocaleDateString() : ''
    ]);
    
    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `clients_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Handle client click
  const handleClientClick = (clientId: number, section?: string) => {
    markRecent(clientId);
    if (section === 'actions') {
      window.location.hash = `/clients/${clientId}/portfolio#action-items`;
    } else if (section === 'portfolio') {
      window.location.hash = `/clients/${clientId}/portfolio`;
    } else if (section === 'communications') {
      window.location.hash = `/clients/${clientId}/appointments`;
    } else if (section === 'transactions') {
      window.location.hash = `/clients/${clientId}/transactions`;
    } else {
      window.location.hash = `/clients/${clientId}`;
    }
  };
  
  // Handle add prospect click
  const handleAddProspectClick = () => {
    window.location.hash = "/add-prospect";
  };
  
  return (
    <div className="min-h-screen bg-background transition-colors duration-300 overflow-x-hidden">
      <div className="px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 pt-6 sm:pt-8 lg:pt-10 pb-8 sm:pb-12 lg:pb-16">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 lg:mb-10 animate-in slide-in-from-top-4 duration-500">
          <div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground tracking-tight mb-1">Client Portfolio</h1>
            <p className="text-muted-foreground text-sm font-medium">
              {filteredClients.length} of {clients?.length || 0} clients
            </p>
          </div>
        </div>
      
        <Card className="mb-6 bg-card/50 backdrop-blur-sm border-border/50 shadow-sm hover:shadow-md transition-all duration-300 animate-in slide-in-from-bottom-4 duration-700 delay-200">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input 
                placeholder="Search clients..." 
                className="pl-10 bg-background border-input text-foreground focus-visible:ring-2 focus-visible:ring-primary/50 transition-all duration-200" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2 relative !bg-background !border-input !text-foreground">
                    <FilterIcon className="h-4 w-4" />
                    Filter
                    {activeFilters > 0 && (
                      <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center" aria-label={`${activeFilters} active filters`}>
                        {activeFilters}
                      </span>
                    )}
                    <ChevronDown className="h-4 w-4 ml-1" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[90vw] sm:w-80 p-4 !bg-card !border-border" align="end">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">Filter Clients</h3>
                    <Button variant="ghost" size="sm" onClick={() => { resetFilters(); setRecentOnly(false); }} className="text-xs h-8 px-2">Reset</Button>
                  </div>
                  <div className="space-y-4">
                    {/* Pending Profiles */}
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Pending profiles only</Label>
                      <Button variant="outline" size="sm" onClick={() => setFilterOptions(prev => ({ ...prev, pendingOnly: !prev.pendingOnly }))}>
                        {filterOptions.pendingOnly ? 'On' : 'Off'}
                      </Button>
                    </div>

                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Recently accessed only</Label>
                      <Button variant="outline" size="sm" onClick={() => setRecentOnly(v => !v)}>
                        {recentOnly ? 'On' : 'Off'}
                      </Button>
                    </div>

                    <Separator />

                    {/* AUM Range */}
                    <div>
                      <Label className="text-sm mb-2 block">AUM Range</Label>
                      <div className="mt-6 px-2">
                        <Slider 
                          value={[filterOptions.minAum, filterOptions.maxAum]}
                          max={100000000}
                          step={1000000}
                          onValueChange={(values) => setFilterOptions(prev => ({ ...prev, minAum: values[0], maxAum: values[1] }))}
                        />
                      </div>
                      <div className="flex justify-between mt-2">
                        <span className="text-xs text-muted-foreground">₹{(filterOptions.minAum / 100000).toFixed(1)}L</span>
                        <span className="text-xs text-muted-foreground">₹{(filterOptions.maxAum / 100000).toFixed(0)}L</span>
                      </div>
                    </div>

                    <Separator />

                    {/* Tier Filter */}
                    <div>
                      <Label className="text-sm mb-2 block">Client Tier</Label>
                      <div className="space-y-2 mt-2">
                        {['platinum', 'gold', 'silver'].map(tier => (
                          <div key={tier} className="flex items-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="p-0 h-8 w-8 mr-2"
                              onClick={() => setFilterOptions(prev => ({
                                ...prev,
                                includedTiers: prev.includedTiers.includes(tier)
                                  ? prev.includedTiers.filter(t => t !== tier)
                                  : [...prev.includedTiers, tier]
                              }))}
                            >
                              <div className="h-5 w-5 rounded-sm border border-border flex items-center justify-center">
                                {filterOptions.includedTiers.includes(tier) && (<Check className="h-3.5 w-3.5 text-primary-600" />)}
                              </div>
                            </Button>
                            <span className="text-sm capitalize">{tier}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    {/* Risk Profile Filter */}
                    <div>
                      <Label className="text-sm mb-2 block">Risk Profile</Label>
                      <div className="space-y-2 mt-2">
                        {['conservative', 'moderate', 'aggressive'].map(profile => (
                          <div key={profile} className="flex items-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="p-0 h-8 w-8 mr-2"
                              onClick={() => setFilterOptions(prev => ({
                                ...prev,
                                riskProfiles: prev.riskProfiles.includes(profile)
                                  ? prev.riskProfiles.filter(p => p !== profile)
                                  : [...prev.riskProfiles, profile]
                              }))}
                            >
                              <div className="h-5 w-5 rounded-sm border border-border flex items-center justify-center">
                                {filterOptions.riskProfiles.includes(profile) && (<Check className="h-3.5 w-3.5 text-primary-600" />)}
                              </div>
                            </Button>
                            <span className="text-sm capitalize">{profile}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
              <Button 
                variant="outline"
                className="flex items-center gap-2"
                onClick={exportClients}
                disabled={!filteredClients || filteredClients.length === 0}
              >
                <Download className="h-4 w-4" />
                Export
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array(6).fill(0).map((_, index) => (
            <Card key={index} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-5 w-32 mb-1" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="h-8 w-20 rounded" />
                </div>
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">AUM</div>
                    <Skeleton className="h-4 w-16" />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Risk Profile</div>
                    <Skeleton className="h-4 w-20" />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Last Contact</div>
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Contact</div>
                    <div className="flex space-x-2">
                      <Skeleton className="h-8 w-8 rounded" />
                      <Skeleton className="h-8 w-8 rounded" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredClients && filteredClients.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClients.map((client: Client) => (
            <ClientCard
              key={client.id}
              client={client}
              onClick={handleClientClick}
              tasks={Array.isArray(tasks) ? tasks : []}
              appointments={Array.isArray(appointments) ? appointments : []}
              alerts={Array.isArray(alerts) ? alerts : []}
              health={healthMap.get(client.id)}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<X className="h-12 w-12 text-muted-foreground" />}
          title="No clients found"
          description={searchQuery || activeFilters > 0 
            ? "Try adjusting your search or filters to find what you're looking for."
            : "Add new clients by converting prospects."}
        />
      )}
      </div>
      
      {/* Floating Add Client Button */}
      <FloatingAddButton 
        onClick={() => window.location.hash = '/clients/add'}
        label="Add New Client"
      />
    </div>
  );
}
