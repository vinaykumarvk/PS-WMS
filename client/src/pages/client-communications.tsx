import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ArrowLeft, MessageCircle, Phone, Mail, Video, FileText, Clock, Paperclip, Calendar, CheckCircle2, AlertCircle, Filter, BarChart4, Wallet, Target, User, ArrowUpDown, Users, CheckSquare, MessageSquare, Plus, Search, ChevronDown, ChevronUp, PieChart, Receipt, FileBarChart, Lightbulb, FileAudio2, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { transcribeInteractionAudio, summarizeInteractionTranscript } from '@/lib/model-orchestration';

// Utility functions
const getInitials = (name: string): string => {
  return name.split(' ').map(n => n[0]).join('').toUpperCase();
};

const generateAvatar = (initials: string): string => {
  const colors = [
    { bg: '#3B82F6', text: 'white' },
    { bg: '#EF4444', text: 'white' },
    { bg: '#10B981', text: 'white' },
    { bg: '#F59E0B', text: 'white' },
    { bg: '#8B5CF6', text: 'white' },
    { bg: '#06B6D4', text: 'white' },
    { bg: '#EC4899', text: 'white' },
    { bg: '#84CC16', text: 'white' }
  ];
  
  const colorIndex = initials.charCodeAt(0) % colors.length;
  const color = colors[colorIndex];
  
  return `<svg width="40" height="40" xmlns="http://www.w3.org/2000/svg">
    <rect width="40" height="40" fill="${color.bg}"/>
    <text x="20" y="25" text-anchor="middle" fill="${color.text}" font-family="Arial, sans-serif" font-size="14" font-weight="bold">${initials}</text>
  </svg>`;
};

const svgToDataURL = (svg: string): string => {
  return `data:image/svg+xml;base64,${btoa(svg)}`;
};

const getTierColor = (tier: string) => {
  switch (tier?.toLowerCase()) {
    case 'platinum':
      return { 
        bg: 'bg-accent', 
        text: 'text-accent-foreground',
        border: 'border-border'
      };
    case 'gold':
      return { 
        bg: 'bg-accent', 
        text: 'text-accent-foreground',
        border: 'border-border'
      };
    case 'silver':
      return { 
        bg: 'bg-muted', 
        text: 'text-muted-foreground',
        border: 'border-border'
      };
    default:
      return { 
        bg: 'bg-muted', 
        text: 'text-muted-foreground',
        border: 'border-border'
      };
  }
};

// Interface definitions
interface Communication {
  id: number;
  client_id: number;
  initiated_by: number;
  start_time: string;
  end_time: string | null;
  duration: number | null;
  communication_type: string;
  channel: string;
  direction: string;
  subject: string | null;
  summary: string | null;
  notes: string | null;
  sentiment: string | null;
  tags: string[];
  follow_up_required: boolean;
  next_steps: string | null;
  action_item_count: number;
  attachment_count: number;
  // Additional fields for global view
  client_name?: string;
  client_initials?: string;
  client_tier?: string;
}

interface CommunicationPreference {
  client_id: number;
  preferred_channels: string[];
  preferred_frequency: string;
  preferred_days: string[];
  preferred_time_slots: string[];
  preferred_language: string;
  opt_in_marketing: boolean;
  do_not_contact: boolean;
  last_updated: string;
}

interface ActionItem {
  id: number;
  communication_id: number;
  title: string;
  description: string | null;
  assigned_to: number;
  due_date: string;
  priority: string;
  status: string;
  completed_at: string | null;
  action_type: string;
  deal_value: number | null;
  expected_close_date: string | null;
}

interface Attachment {
  id: number;
  communication_id: number;
  file_name: string;
  file_type: string;
  file_size: number;
  file_url: string;
  description: string | null;
  uploaded_by: number;
  created_at: string;
}

interface Template {
  id: number;
  name: string;
  category: string;
  subject: string;
  content: string;
  variables: string[];
  is_global: boolean;
  created_by: number;
  is_active: boolean;
}

const ClientCommunications: React.FC = () => {
  const params = useParams();
  
  // Extract clientId from URL hash like /clients/:id/communications
  const getClientIdFromUrl = (): number | null => {
    const hash = window.location.hash.replace(/^#/, '');
    const match = hash.match(/\/clients\/(\d+)\/communications/);
    return match ? parseInt(match[1]) : null;
  };
  
  const clientId = getClientIdFromUrl();
  const isGlobalView = !clientId;
  const { toast } = useToast();
  
  // State hooks
  const [selectedCommunication, setSelectedCommunication] = useState<Communication | null>(null);
  const [activeTab, setActiveTab] = useState<string>('details');
  const [selectedCustomer, setSelectedCustomer] = useState<string>('all');
  const [showAllNotes, setShowAllNotes] = useState<boolean>(false);
  const [expandedNotes, setExpandedNotes] = useState<Set<number>>(new Set());
  const [filtersExpanded, setFiltersExpanded] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  const toggleNoteExpansion = (noteId: number) => {
    const newExpanded = new Set(expandedNotes);
    if (newExpanded.has(noteId)) {
      newExpanded.delete(noteId);
    } else {
      newExpanded.add(noteId);
    }
    setExpandedNotes(newExpanded);
  };
  
  const [filters, setFilters] = useState({
    noteType: 'all',
    channel: 'all',
    dateRange: 'all'
  });
  
  // Pagination state
  const [visibleCount, setVisibleCount] = useState<number>(5);
  const ITEMS_PER_PAGE = 5;
  
  // New note dialog state
  const [isNewNoteDialogOpen, setIsNewNoteDialogOpen] = useState(false);
  const [newNoteData, setNewNoteData] = useState({
    client_id: clientId ? parseInt(clientId.toString()) : undefined as number | undefined,
    communication_type: 'advisory_meeting',
    channel: 'phone',
    direction: 'outbound',
    duration_minutes: 30,
    subject: '',
    summary: '',
    notes: '',
    sentiment: 'positive',
    follow_up_required: false,
    next_steps: '',
    tags: [] as string[],
    audioTranscript: '',
    audioSummary: '',
    audioFileName: '',
    audioDurationSeconds: undefined as number | undefined,
  });
  const audioFileInputRef = useRef<HTMLInputElement | null>(null);
  const [audioProcessingState, setAudioProcessingState] = useState<'idle' | 'processing' | 'complete'>('idle');
  const [audioError, setAudioError] = useState<string | null>(null);
  
  // Query client for cache invalidation
  const queryClient = useQueryClient();

  // Filter functions

  const handleClearFilters = () => {
    setFilters({
      noteType: 'all',
      channel: 'all',
      dateRange: 'all'
    });
  };

  // Pagination handlers
  const handleShowMore = () => {
    setVisibleCount(prev => prev + ITEMS_PER_PAGE);
  };

  const handleShowLess = () => {
    setVisibleCount(ITEMS_PER_PAGE);
  };

  // Queries
  const { data: client, isLoading: isClientLoading } = useQuery({
    queryKey: [`/api/clients/${clientId}`],
    enabled: !isGlobalView && !!clientId,
  });

  const { data: communications, isLoading, refetch: refetchCommunications } = useQuery({
    queryKey: isGlobalView ? ['/api/communications'] : [`/api/communications/${clientId}`],
    enabled: isGlobalView || !!clientId,
  });

  // Query all clients for client selection in global view
  const { data: allClients } = useQuery({
    queryKey: ['/api/clients'],
    enabled: isGlobalView,
  });

  // Filter communications
  const filteredCommunications = React.useMemo(() => {
    if (!communications || !Array.isArray(communications)) return [];
    
    return communications.filter((comm: any) => {
      
      // Search filter - search in subject, summary, notes, and client name
      const matchesSearch = searchQuery === '' || 
        (comm.subject && comm.subject.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (comm.summary && comm.summary.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (comm.notes && comm.notes.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (comm.client_name && comm.client_name.toLowerCase().includes(searchQuery.toLowerCase()));
      
      // Customer filter - filter by selected customer
      const matchesCustomer = selectedCustomer === 'all' || 
        comm.client_name === selectedCustomer;
      
      // Note type filter
      const matchesNoteType = filters.noteType === 'all' || 
        comm.communication_type === filters.noteType;
      
      // Channel filter
      const matchesChannel = filters.channel === 'all' || 
        comm.channel === filters.channel;
      
      // Date filter
      const commDate = new Date(comm.start_time);
      const now = new Date();
      const dateFilter = filters.dateRange || 'all';
      const matchesDate = dateFilter === 'all' || 
        (dateFilter === '7days' && (now.getTime() - commDate.getTime()) <= 7 * 24 * 60 * 60 * 1000) ||
        (dateFilter === '30days' && (now.getTime() - commDate.getTime()) <= 30 * 24 * 60 * 60 * 1000) ||
        (dateFilter === '3months' && (now.getTime() - commDate.getTime()) <= 90 * 24 * 60 * 60 * 1000) ||
        (dateFilter === '6months' && (now.getTime() - commDate.getTime()) <= 180 * 24 * 60 * 60 * 1000);
      
      return matchesSearch && matchesCustomer && matchesNoteType && matchesChannel && matchesDate;
    }).sort((a: any, b: any) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());
  }, [communications, filters, searchQuery, selectedCustomer]);

  // Get unique customer names for filter dropdown
  const uniqueCustomers = React.useMemo(() => {
    if (!communications || !Array.isArray(communications)) return [];
    const customers = communications
      .map((comm: any) => comm.client_name)
      .filter((name: string) => name && name.trim() !== '')
      .filter((name: string, index: number, arr: string[]) => arr.indexOf(name) === index)
      .sort();
    return customers;
  }, [communications]);

  // Get paginated communications for display
  const displayedCommunications = React.useMemo(() => {
    return filteredCommunications.slice(0, visibleCount);
  }, [filteredCommunications, visibleCount]);

  const readFileAsBase64 = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = typeof reader.result === 'string' ? reader.result : '';
        const base64 = result.includes(',') ? result.split(',')[1] ?? '' : result;
        resolve(base64);
      };
      reader.onerror = () => reject(new Error('Failed to read audio file'));
      reader.readAsDataURL(file);
    });

  const handleAudioUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setAudioError(null);
    setAudioProcessingState('processing');

    try {
      const base64Audio = await readFileAsBase64(file);
      const transcription = await transcribeInteractionAudio({
        base64Audio,
        fileName: file.name,
        mimeType: file.type,
        clientId: newNoteData.client_id,
        context: newNoteData.subject || 'client-interaction',
      });

      const summarization = await summarizeInteractionTranscript({
        transcript: transcription.transcript,
        clientId: newNoteData.client_id,
        subject: newNoteData.subject,
      });

      setNewNoteData(prev => ({
        ...prev,
        audioTranscript: transcription.transcript,
        audioSummary: summarization.summary,
        audioFileName: file.name,
        audioDurationSeconds: transcription.durationSeconds,
        summary: prev.summary && prev.summary.trim().length > 0 ? prev.summary : summarization.summary,
        notes: prev.notes && prev.notes.trim().length > 0 ? prev.notes : transcription.transcript,
        tags: Array.from(new Set([...(prev.tags || []), 'audio-transcript'])),
      }));

      setAudioProcessingState('complete');
      toast({ title: 'Audio processed', description: 'Transcript and summary have been generated for this recording.' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to process audio recording.';
      setAudioProcessingState('idle');
      setAudioError(message);
      toast({ title: 'Audio processing failed', description: message, variant: 'destructive' });
    }
  };

  const clearAudioUpload = () => {
    setNewNoteData(prev => ({
      ...prev,
      audioTranscript: '',
      audioSummary: '',
      audioFileName: '',
      audioDurationSeconds: undefined,
      tags: (prev.tags || []).filter(tag => tag !== 'audio-transcript'),
    }));
    setAudioProcessingState('idle');
    setAudioError(null);
    if (audioFileInputRef.current) {
      audioFileInputRef.current.value = '';
    }
  };

  // Mutation for creating new note
  const createNoteMutation = useMutation({
    mutationFn: async (noteData: typeof newNoteData) => {
      const summaryText = noteData.summary && noteData.summary.trim().length > 0
        ? noteData.summary
        : (noteData.audioSummary || noteData.summary);
      const transcriptBlock = noteData.audioTranscript
        ? `${noteData.notes && noteData.notes.trim().length > 0 ? '\n\n' : ''}Transcript (${noteData.audioFileName || 'Recording'}):\n${noteData.audioTranscript}`
        : '';
      const baseNotes = noteData.notes && noteData.notes.trim().length > 0 ? noteData.notes.trim() : '';
      const combinedNotes = `${baseNotes}${transcriptBlock}`.trim();
      const payload = {
        client_id: noteData.client_id,
        initiated_by: 1, // Current user ID
        start_time: new Date().toISOString(),
        communication_type: noteData.communication_type,
        channel: noteData.channel,
        direction: noteData.direction,
        subject: noteData.subject || 'Note',
        summary: summaryText || noteData.summary,
        notes: combinedNotes || noteData.notes,
        sentiment: noteData.sentiment,
        follow_up_required: noteData.follow_up_required,
        next_steps: noteData.next_steps,
        tags: Array.from(new Set([...(noteData.tags || []), ...(noteData.audioTranscript ? ['audio-transcript'] : [])]))
      };
      
      return apiRequest('POST', '/api/communications', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: isGlobalView ? ['/api/communications'] : [`/api/communications/${clientId}`] 
      });
      setIsNewNoteDialogOpen(false);
      setNewNoteData({
        client_id: clientId ? parseInt(clientId.toString()) : undefined as number | undefined,
        communication_type: 'advisory_meeting',
        channel: 'phone',
        direction: 'outbound',
        subject: '',
        summary: '',
        notes: '',
        sentiment: 'positive',
        follow_up_required: false,
        next_steps: '',
        tags: [] as string[],
        audioTranscript: '',
        audioSummary: '',
        audioFileName: '',
        audioDurationSeconds: undefined as number | undefined,
      });
      setAudioProcessingState('idle');
      setAudioError(null);
      if (audioFileInputRef.current) {
        audioFileInputRef.current.value = '';
      }
      toast({
        title: "Note created",
        description: "Your note has been saved successfully."
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create note. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Main component return
  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      {/* Enhanced Client Header - Only show for client-specific view */}
      {!isGlobalView && (
        <div className={`bg-card shadow-sm border-l-4 transition-all duration-300 hover:shadow-md ${client ? getTierColor(client.tier).border.replace('border-', 'border-l-') : 'border-l-slate-300'}`}>
          <div className="px-6 py-4 animate-in slide-in-from-top-4 duration-500">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => window.location.hash = '/clients'}
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                >
                  <ArrowLeft className="h-5 w-5 text-muted-foreground" />
                </button>
                
                <div className="flex items-center gap-3">
                  {isClientLoading ? (
                    <div className="space-y-1">
                      <Skeleton className="h-6 w-32" />
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  ) : client ? (
                    <div className="flex flex-col">
                      {/* Line 1: Client Name */}
                      <button 
                        onClick={() => window.location.hash = `/clients/${clientId}/personal`}
                        className="text-xl font-semibold text-foreground hover:text-primary transition-colors cursor-pointer text-left"
                      >
                        {client.fullName}
                      </button>
                      
                      {/* Line 2: Phone Number */}
                      {client.phone && (
                        <div className="mt-1 flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <a 
                            href={`tel:${client.phone}`}
                            className="text-sm text-primary hover:text-primary/80 hover:underline transition-colors"
                            title="Call client"
                          >
                            {client.phone}
                          </a>
                        </div>
                      )}
                      
                      {/* Line 3: Email */}
                      {client.email && (
                        <div className="mt-1 flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <a 
                            href={`mailto:${client.email}`}
                            className="text-sm text-primary hover:text-primary/80 hover:underline transition-colors"
                            title="Send email to client"
                          >
                            {client.email}
                          </a>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-muted-foreground">Client not found</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Page Title Band with Navigation */}
      <div className="sticky top-0 z-10 bg-card border-b border-border px-1 py-4">
        <div className="flex justify-between items-center px-5 mb-3">
          <h2 className="text-2xl sm:text-3xl font-semibold text-foreground">Notes</h2>
          <Button 
            size="sm" 
            onClick={() => setIsNewNoteDialogOpen(true)}
            className="h-8 w-8 p-0 rounded-full"
            aria-label="Add new note"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        
        {!isGlobalView && clientId && (
          <div className="grid grid-cols-7 gap-1 px-1">
            <button 
              className="flex items-center justify-center px-1 py-2 rounded-lg hover:bg-muted transition-colors h-12 w-full"
              onClick={() => window.location.hash = `/clients/${clientId}/personal`}
              title="Personal Profile"
            >
              <User className="h-6 w-6 text-muted-foreground" />
            </button>
            
            <button 
              className="flex items-center justify-center px-1 py-2 rounded-lg hover:bg-muted transition-colors h-12 w-full"
              onClick={() => window.location.hash = `/clients/${clientId}/portfolio`}
              title="Portfolio"
            >
              <PieChart className="h-6 w-6 text-muted-foreground" />
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
              className="flex items-center justify-center px-1 py-2 rounded-lg bg-blue-50 border border-blue-200 h-12 w-full"
              title="Notes"
            >
              <FileText className="h-6 w-6 text-blue-600" />
            </button>
            
            <button 
              className="flex items-center justify-center px-1 py-2 rounded-lg hover:bg-muted transition-colors h-12 w-full"
              onClick={() => window.location.hash = `/clients/${clientId}/portfolio-report`}
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
          </div>
        )}

      </div>

      {/* Main Content */}
      <div className="p-4 space-y-4">
        {/* Search Box - Always visible */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search in notes, subject, or customer name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filter Controls - Collapsible */}
        <Card className="overflow-hidden">
          <div 
            className="p-4 bg-muted border-b cursor-pointer hover:bg-muted transition-colors"
            onClick={() => setFiltersExpanded(!filtersExpanded)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Filter className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium text-foreground">Filters</span>
                {(searchQuery !== '' || selectedCustomer !== 'all' || filters.noteType !== 'all' || filters.channel !== 'all' || filters.dateRange !== 'all') && (
                  <div className="flex items-center space-x-2 ml-2">
                    {searchQuery !== '' && (
                      <span className="px-2 py-1 text-xs bg-primary/10 text-primary rounded">
                        SEARCH: {searchQuery.length > 15 ? searchQuery.substring(0, 15) + '...' : searchQuery}
                      </span>
                    )}
                    {selectedCustomer !== 'all' && (
                      <span className="px-2 py-1 text-xs bg-primary/10 text-primary rounded">
                        CUSTOMER: {selectedCustomer}
                      </span>
                    )}
                    {filters.noteType !== 'all' && (
                      <span className="px-2 py-1 text-xs bg-primary/10 text-primary rounded">
                        {filters.noteType.replace('_', ' ').toUpperCase()}
                      </span>
                    )}
                    {filters.channel !== 'all' && (
                      <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                        {filters.channel.toUpperCase()}
                      </span>
                    )}
                    {filters.dateRange !== 'all' && (
                      <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded">
                        {filters.dateRange === '7days' ? 'LAST 7 DAYS' :
                         filters.dateRange === '30days' ? 'LAST 30 DAYS' :
                         filters.dateRange === '3months' ? 'LAST 3 MONTHS' :
                         filters.dateRange === '6months' ? 'LAST 6 MONTHS' : 
                         filters.dateRange.toUpperCase()}
                      </span>
                    )}
                  </div>
                )}
              </div>
              <ChevronDown 
                className={`h-5 w-5 text-muted-foreground transition-transform ${filtersExpanded ? 'rotate-180' : ''}`}
              />
            </div>
          </div>
          
          {filtersExpanded && (
            <div className="p-4 space-y-4">
              {/* Customer Filter - Only show for global view */}
              {isGlobalView && (
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Customer</label>
                  <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select customer" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Customers</SelectItem>
                      {uniqueCustomers.map((customer) => (
                        <SelectItem key={customer} value={customer}>
                          {customer}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Note Type</label>
                <Select value={filters.noteType} onValueChange={(value) => setFilters(prev => ({...prev, noteType: value}))}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select note type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="quarterly_review">Quarterly Portfolio Review</SelectItem>
                    <SelectItem value="portfolio_diagnosis">Portfolio Health Check</SelectItem>
                    <SelectItem value="risk_assessment">Risk Profile Assessment</SelectItem>
                    <SelectItem value="goal_planning">Financial Goal Planning</SelectItem>
                    <SelectItem value="product_discussion">Product Discussion</SelectItem>
                    <SelectItem value="investment_advisory">Investment Advisory Session</SelectItem>
                    <SelectItem value="market_update">Market Update Discussion</SelectItem>
                    <SelectItem value="onboarding">Client Onboarding</SelectItem>
                    <SelectItem value="complaint_resolution">Complaint Resolution</SelectItem>
                    <SelectItem value="general_note">General Note</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Channel</label>
                <Select value={filters.channel} onValueChange={(value) => setFilters(prev => ({...prev, channel: value}))}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select channel" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Channels</SelectItem>
                    <SelectItem value="phone">Phone</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="in_person">In Person</SelectItem>
                    <SelectItem value="video_call">Video Call</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Date Range</label>
                <Select value={filters.dateRange} onValueChange={(value) => setFilters(prev => ({...prev, dateRange: value}))}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select date range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="7days">Last 7 Days</SelectItem>
                    <SelectItem value="30days">Last 30 Days</SelectItem>
                    <SelectItem value="3months">Last 3 Months</SelectItem>
                    <SelectItem value="6months">Last 6 Months</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {(filters.noteType !== 'all' || filters.channel !== 'all' || filters.dateRange !== 'all') && (
                <div className="pt-2">
                  <Button onClick={handleClearFilters} variant="outline" className="w-full">
                    Clear All Filters
                  </Button>
                </div>
              )}
            </div>
          )}
        </Card>

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </Card>
            ))}
          </div>
        ) : filteredCommunications && filteredCommunications.length > 0 ? (
          <div className="space-y-3">
            {displayedCommunications.map((communication: Communication) => {
              const isExpanded = expandedNotes.has(communication.id);
              const communicationType = communication.communication_type?.replace('_', ' ')?.toUpperCase() || 'NOTE';
              const channel = communication.channel?.toUpperCase() || 'UNKNOWN';
              const date = new Date(communication.start_time).toLocaleDateString();
              
              return (
                <Card key={communication.id} className="overflow-hidden">
                  {/* Summary Band - Always Visible */}
                  <div 
                    className="p-4 bg-muted border-b cursor-pointer hover:bg-muted transition-colors"
                    onClick={() => toggleNoteExpansion(communication.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-1">
                        <div className="text-sm font-medium text-foreground">
                          {communicationType} • {channel}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {date}
                        </div>
                        {/* Show customer name in global view */}
                        {isGlobalView && communication.client_name && (
                          <div className="text-sm font-medium text-blue-600">
                            {communication.client_name}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center">
                        <ChevronDown 
                          className={`h-5 w-5 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        />
                      </div>
                    </div>
                    
                    {/* Show subject/title in summary if available */}
                    {communication.subject && (
                      <div className="mt-2">
                        <p className="text-sm font-medium text-foreground line-clamp-1">
                          {communication.subject}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {/* Expandable Content */}
                  {isExpanded && (
                    <div className="p-4 space-y-4">
                      {/* Summary */}
                      {communication.summary && (
                        <div>
                          <h4 className="text-sm font-medium text-foreground mb-2">Summary</h4>
                          <p className="text-sm text-foreground">
                            {communication.summary}
                          </p>
                        </div>
                      )}
                      
                      {/* Notes/Details */}
                      {communication.notes && (
                        <div>
                          <h4 className="text-sm font-medium text-foreground mb-2">Notes</h4>
                          <div className="bg-muted p-3 rounded-lg">
                            <p className="text-sm text-foreground">
                              {communication.notes}
                            </p>
                          </div>
                        </div>
                      )}
                      
                      {/* Tags */}
                      {communication.tags && communication.tags.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-foreground mb-2">Tags</h4>
                          <div className="flex flex-wrap gap-1">
                            {communication.tags.map((tag, index) => (
                              <span key={index} className="px-2 py-1 text-xs bg-primary/10 text-primary rounded-full">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Additional Details */}
                      <div className="pt-2 border-t border-border">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Direction:</span>
                            <span className="ml-2 text-foreground">{communication.direction}</span>
                          </div>
                          {communication.duration && (
                            <div>
                              <span className="text-muted-foreground">Duration:</span>
                              <span className="ml-2 text-foreground">{communication.duration} min</span>
                            </div>
                          )}
                          {communication.sentiment && (
                            <div>
                              <span className="text-muted-foreground">Sentiment:</span>
                              <span className="ml-2 text-foreground">{communication.sentiment}</span>
                            </div>
                          )}
                          {communication.action_item_count > 0 && (
                            <div>
                              <span className="text-muted-foreground">Action Items:</span>
                              <span className="ml-2 text-foreground">{communication.action_item_count}</span>
                            </div>
                          )}
                        </div>
                        
                        {communication.next_steps && (
                          <div className="mt-3">
                            <h4 className="text-sm font-medium text-foreground mb-1">Next Steps</h4>
                            <p className="text-sm text-foreground">
                              {communication.next_steps}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
            
            {/* Pagination Controls */}
            {filteredCommunications.length > ITEMS_PER_PAGE && (
              <div className="flex justify-center mt-6 space-x-3">
                {visibleCount < filteredCommunications.length && (
                  <Button 
                    onClick={handleShowMore} 
                    variant="outline"
                    className="px-6"
                  >
                    Show more ({filteredCommunications.length - visibleCount} more notes)
                  </Button>
                )}
                {visibleCount > ITEMS_PER_PAGE && (
                  <Button 
                    onClick={handleShowLess} 
                    variant="outline"
                    className="px-6"
                  >
                    Show Less
                  </Button>
                )}
              </div>
            )}
          </div>
        ) : (
          <Card className="p-8 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No notes found</h3>
            <p className="text-muted-foreground">
              {clientId ? "No communication records found for this client." : "No communication records found."}
            </p>
          </Card>
        )}
      </div>

      {/* New Note Dialog */}
      <Dialog open={isNewNoteDialogOpen} onOpenChange={setIsNewNoteDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Note</DialogTitle>
            <DialogDescription>
              Record a new communication or note {isGlobalView ? 'for a client' : 'for this client'}.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={(e) => {
            e.preventDefault();
            createNoteMutation.mutate(newNoteData);
          }}>
            <div className="grid gap-3 py-3">
              {/* Client Selection - Only show in global view */}
              {isGlobalView && (
                <div className="space-y-2">
                  <Label htmlFor="client_id">Client *</Label>
                  <Select 
                    value={newNoteData.client_id?.toString() || ''} 
                    onValueChange={(value) => setNewNoteData(prev => ({ ...prev, client_id: parseInt(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select client" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.isArray(allClients) && allClients.map((client: any) => (
                        <SelectItem key={client.id} value={client.id.toString()}>
                          {client.fullName} ({client.tier})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="communication_type">Type *</Label>
                  <Select 
                    value={newNoteData.communication_type} 
                    onValueChange={(value) => setNewNoteData(prev => ({ ...prev, communication_type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="quarterly_review">Quarterly Portfolio Review</SelectItem>
                      <SelectItem value="portfolio_diagnosis">Portfolio Health Check</SelectItem>
                      <SelectItem value="risk_assessment">Risk Profile Assessment</SelectItem>
                      <SelectItem value="goal_planning">Financial Goal Planning</SelectItem>
                      <SelectItem value="product_discussion">Product Discussion</SelectItem>
                      <SelectItem value="investment_advisory">Investment Advisory Session</SelectItem>
                      <SelectItem value="market_update">Market Update Discussion</SelectItem>
                      <SelectItem value="onboarding">Client Onboarding</SelectItem>
                      <SelectItem value="complaint_resolution">Complaint Resolution</SelectItem>
                      <SelectItem value="general_note">General Note</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="channel">Channel *</Label>
                  <Select 
                    value={newNoteData.channel} 
                    onValueChange={(value) => setNewNoteData(prev => ({ ...prev, channel: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select channel" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="phone">Phone</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="in_person">In Person</SelectItem>
                      <SelectItem value="video_call">Video Call</SelectItem>
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="direction">Direction *</Label>
                  <Select 
                    value={newNoteData.direction} 
                    onValueChange={(value) => setNewNoteData(prev => ({ ...prev, direction: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select direction" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="outbound">Outbound</SelectItem>
                      <SelectItem value="inbound">Inbound</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration_minutes">Duration (minutes) *</Label>
                  <Input
                    id="duration_minutes"
                    type="number"
                    value={newNoteData.duration_minutes}
                    onChange={(e) => setNewNoteData(prev => ({ ...prev, duration_minutes: parseInt(e.target.value) || 15 }))}
                    min="1"
                    max="300"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Subject *</Label>
                <Input
                  id="subject"
                  value={newNoteData.subject}
                  onChange={(e) => setNewNoteData(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="Brief subject or title"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="summary">Summary *</Label>
                <Textarea
                  id="summary"
                  value={newNoteData.summary}
                  onChange={(e) => setNewNoteData(prev => ({ ...prev, summary: e.target.value }))}
                  placeholder="Brief summary of the communication"
                  rows={2}
                  className="min-h-[60px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Detailed Notes *</Label>
                <Textarea
                  id="notes"
                  value={newNoteData.notes}
                  onChange={(e) => setNewNoteData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Detailed notes and observations"
                  rows={3}
                  className="min-h-[80px]"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="interaction-audio">Attach Audio Recording</Label>
                <Input
                  id="interaction-audio"
                  type="file"
                  accept="audio/*"
                  ref={audioFileInputRef}
                  onChange={handleAudioUpload}
                  disabled={audioProcessingState === 'processing'}
                />
                <p className="text-xs text-muted-foreground">
                  Upload meeting recordings to generate transcripts and summaries automatically.
                </p>
                {audioProcessingState === 'processing' && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing audio...
                  </div>
                )}
                {audioError && (
                  <p className="text-xs text-destructive">{audioError}</p>
                )}
                {newNoteData.audioFileName && newNoteData.audioTranscript && (
                  <div className="rounded-md border border-muted-foreground/20 bg-muted/40 p-3 space-y-2">
                    <div className="flex items-center justify-between gap-2 text-sm font-medium">
                      <span className="flex items-center gap-2"><FileAudio2 className="h-4 w-4 text-primary" /> {newNoteData.audioFileName}</span>
                      <Button type="button" variant="ghost" size="sm" onClick={clearAudioUpload}>
                        Remove
                      </Button>
                    </div>
                    {typeof newNoteData.audioDurationSeconds === 'number' && (
                      <p className="text-xs text-muted-foreground">Duration: ~{Math.round(newNoteData.audioDurationSeconds)} seconds</p>
                    )}
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">Transcript preview</p>
                      <div className="max-h-32 overflow-y-auto rounded-md border border-dashed border-muted-foreground/30 bg-background/80 p-2 text-xs text-muted-foreground whitespace-pre-wrap">
                        {newNoteData.audioTranscript}
                      </div>
                    </div>
                    {newNoteData.audioSummary && (
                      <div className="rounded-md border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-foreground">
                        <span className="font-semibold">AI Summary:</span> {newNoteData.audioSummary}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sentiment">Sentiment</Label>
                  <Select
                    value={newNoteData.sentiment} 
                    onValueChange={(value) => setNewNoteData(prev => ({ ...prev, sentiment: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select sentiment" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="positive">Positive</SelectItem>
                      <SelectItem value="neutral">Neutral</SelectItem>
                      <SelectItem value="negative">Negative</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2 pt-6">
                  <Checkbox 
                    id="follow_up_required"
                    checked={newNoteData.follow_up_required}
                    onCheckedChange={(checked) => setNewNoteData(prev => ({ ...prev, follow_up_required: !!checked }))}
                  />
                  <Label htmlFor="follow_up_required">Follow-up required</Label>
                </div>
              </div>

              {newNoteData.follow_up_required && (
                <div className="space-y-2">
                  <Label htmlFor="next_steps">Next Steps</Label>
                  <Textarea
                    id="next_steps"
                    value={newNoteData.next_steps}
                    onChange={(e) => setNewNoteData(prev => ({ ...prev, next_steps: e.target.value }))}
                    placeholder="Describe the next steps or follow-up actions"
                    rows={2}
                  />
                </div>
              )}
            </div>
            
            <DialogFooter className="sticky bottom-0 bg-background pt-4 border-t mt-4">
              <Button 
                variant="outline" 
                onClick={() => setIsNewNoteDialogOpen(false)}
                disabled={createNoteMutation.isPending}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={createNoteMutation.isPending || !newNoteData.notes.trim() || (isGlobalView && !newNoteData.client_id)}
              >
                {createNoteMutation.isPending ? "Saving..." : "Save Note"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClientCommunications;