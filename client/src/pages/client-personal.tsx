import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  ArrowLeft, User, Phone, Mail, MapPin, Calendar, Briefcase, Home, Building, 
  CreditCard, Shield, Users, Wallet, PieChart, MessageCircle, Clock, Heart,
  FileBarChart, CheckCircle, XCircle, AlertCircle, Lightbulb, Receipt, TrendingUp, TrendingDown, ChevronDown, ChevronUp, FileText, Edit
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { clientApi } from "@/lib/api";
import { generateAvatar, svgToDataURL } from "@/lib/avatarGenerator";
import { getTierColor } from "@/lib/utils";
import { ClientPageLayout } from "@/components/layout/ClientPageLayout";
import { PersonalInfoForm } from "@/components/forms/personal-info-form";
import { useToast } from "@/hooks/use-toast";

export default function ClientPersonalPage() {
  const [clientId, setClientId] = useState<number | null>(null);
  const [isPersonalOpen, setIsPersonalOpen] = useState(true);
  const [isFinancialOpen, setIsFinancialOpen] = useState(false);
  const [isFamilyOpen, setIsFamilyOpen] = useState(false);
  const [isKycOpen, setIsKycOpen] = useState(false);
  const [isEditPersonalDialogOpen, setIsEditPersonalDialogOpen] = useState(false);
  const [isEditFinancialDialogOpen, setIsEditFinancialDialogOpen] = useState(false);
  const [isEditFamilyDialogOpen, setIsEditFamilyDialogOpen] = useState(false);
  const [isEditKycDialogOpen, setIsEditKycDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Set page title
  useEffect(() => {
    document.title = "Client Information | Wealth Management System";
  }, []);

  // Extract client ID from URL path and handle section navigation
  const checkUrlAndOpenSection = () => {
    const path = window.location.hash;
    const match = path.match(/\/clients\/(\d+)/);
    if (match) {
      setClientId(parseInt(match[1]));
    }
    
    // Check for section parameter in URL hash to auto-open specific sections
    // Support both query params (?section=family) and hash fragments (#family)
    const hashMatch = path.match(/[?#]section=(\w+)/);
    const section = hashMatch ? hashMatch[1] : null;
    
    if (section === 'family') {
      setIsFamilyOpen(true);
      // Scroll to family section after a brief delay to ensure it's rendered
      setTimeout(() => {
        const familyElement = document.getElementById('family-information-section');
        if (familyElement) {
          familyElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 300);
    }
  };

  useEffect(() => {
    checkUrlAndOpenSection();
    
    // Listen for hash changes to handle navigation
    const handleHashChange = () => {
      checkUrlAndOpenSection();
    };
    
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const { data: client, isLoading, error } = useQuery({
    queryKey: [`/api/clients/${clientId}`],
    enabled: !!clientId,
  });

  // Update client mutation
  const updateClientMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/clients/${clientId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Failed to update client" }));
        throw new Error(errorData.message || "Failed to update client");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/clients/${clientId}`] });
      toast({ title: "Success", description: "Client information updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  // Utility functions
  const formatDate = (date: string | Date | null): string => {
    if (!date) return "Not specified";
    try {
      const parsedDate = typeof date === 'string' ? new Date(date) : date;
      return parsedDate.toLocaleDateString();
    } catch {
      return "Invalid date";
    }
  };

  const parseJsonData = (data: string | null): any => {
    if (!data) return null;
    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  };

  const getKycStatusBadge = (status: string | null) => {
    if (!status) return { color: "secondary", icon: <AlertCircle className="h-3 w-3" /> };
    
    switch (status.toLowerCase()) {
      case "completed":
        return { color: "default", icon: <CheckCircle className="h-3 w-3" /> };
      case "pending":
        return { color: "secondary", icon: <Clock className="h-3 w-3" /> };
      case "expired":
        return { color: "destructive", icon: <XCircle className="h-3 w-3" /> };
      default:
        return { color: "secondary", icon: <AlertCircle className="h-3 w-3" /> };
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="p-6">
          <Skeleton className="h-32 w-full mb-6" />
          <Skeleton className="h-8 w-64 mb-4" />
          <div className="space-y-4">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="min-h-screen bg-background">
        <div className="p-6">
          <div className="text-center py-8 text-muted-foreground">
            <p>Could not load client information.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ClientPageLayout client={client} isLoading={isLoading} clientId={clientId || 0}>

      {/* Page Title Band with Navigation */}
      <div className="bg-card border-b border-border px-3 py-4">
        <div className="flex justify-between items-center px-3 sm:px-5 mb-3">
          <h2 className="text-2xl font-bold text-foreground tracking-tight">Personal Details</h2>
        </div>
        
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 px-1">
          <button 
            className="flex items-center justify-center px-1 py-2 rounded-lg bg-primary/10 border border-primary/20 h-12 w-full"
            title="Personal Profile"
          >
            <User className="h-6 w-6 text-primary" />
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
            className="flex items-center justify-center px-1 py-2 rounded-lg hover:bg-muted transition-colors h-12 w-full"
            onClick={() => window.location.hash = `/clients/${clientId}/goals`}
            title="Goals"
          >
            <Target className="h-6 w-6 text-muted-foreground" />
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
      </div>

      {/* Main Content */}
      <div className="p-4 space-y-4">
        {/* Incomplete profile banner */}
        {((client as any).profile_status === 'incomplete' || (client as any).aumValue === 0 || !(client as any).investmentHorizon || !(client as any).netWorth) && (
          <Card className="border-primary/30">
            <CardContent className="p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
              <div>
                <p className="font-medium text-foreground">This client profile is incomplete.</p>
                <p className="text-sm text-muted-foreground">Complete the remaining sections to finish onboarding.</p>
              </div>
              <div className="flex gap-2">
                <Button className="w-full sm:w-auto h-11" onClick={() => window.location.hash = `/clients/${clientId}/financial-profile`}>Complete Financial Profile</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Summary Card */}
        <Card>
          <CardContent className="px-4 py-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="flex items-center justify-center gap-3">
                  <Avatar className="h-14 w-14">
                    <AvatarImage src={svgToDataURL(generateAvatar(client.initials || client.fullName))} />
                    <AvatarFallback>{client.initials || client.fullName.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="text-left">
                    <p className="text-sm text-muted-foreground">Client</p>
                    <p className="font-medium">{client.fullName}</p>
                  </div>
                </div>
              </div>
              
              <div className="text-left">
                <div>
                  <p className="text-sm text-muted-foreground">Age</p>
                  <p>{client.dateOfBirth ? new Date().getFullYear() - new Date(client.dateOfBirth).getFullYear() : "Not provided"}</p>
                </div>
              </div>
              
              <div className="text-left">
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p>{client.maritalStatus || "Not provided"}</p>
                </div>
              </div>
              
              <div className="text-left">
                <div>
                  <p className="text-sm text-muted-foreground">Company</p>
                  <p>{client.companyName || "Not provided"}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Personal Details Collapsible Card */}
        <Collapsible 
          open={isPersonalOpen} 
          onOpenChange={setIsPersonalOpen}
          className="space-y-2"
        >
          <Card className="overflow-hidden">
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors py-3 px-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-medium flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Personal Information
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsEditPersonalDialogOpen(true);
                      }}
                      className="flex items-center gap-2"
                    >
                      <Edit className="h-4 w-4" />
                      Edit
                    </Button>
                    {isPersonalOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="px-4 pb-4 space-y-6">
                <div>
                  <h3 className="font-medium mb-3">Basic Details</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <dt className="text-sm text-muted-foreground">Date of Birth</dt>
                      <dd className="text-sm font-medium">{formatDate(client.dateOfBirth)}</dd>
                    </div>
                    <div className="space-y-1">
                      <dt className="text-sm text-muted-foreground">Age</dt>
                      <dd className="text-sm font-medium">
                        {client.dateOfBirth ? `${new Date().getFullYear() - new Date(client.dateOfBirth).getFullYear()} years` : "Not specified"}
                      </dd>
                    </div>
                    <div className="space-y-1">
                      <dt className="text-sm text-muted-foreground">Gender</dt>
                      <dd className="text-sm font-medium">{client.gender || "Not specified"}</dd>
                    </div>
                    <div className="space-y-1">
                      <dt className="text-sm text-muted-foreground">Marital Status</dt>
                      <dd className="text-sm font-medium">{client.maritalStatus || "Not specified"}</dd>
                    </div>
                    {client.maritalStatus === "Married" && (
                      <div className="space-y-1">
                        <dt className="text-sm text-muted-foreground">Anniversary</dt>
                        <dd className="text-sm font-medium">{formatDate(client.anniversaryDate)}</dd>
                      </div>
                    )}
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="font-medium mb-3">Contact Preferences</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <dt className="text-sm text-muted-foreground">Preferred Contact Method</dt>
                      <dd className="text-sm font-medium">{client.preferredContactMethod || "Not specified"}</dd>
                    </div>
                    <div className="space-y-1">
                      <dt className="text-sm text-muted-foreground">Preferred Time</dt>
                      <dd className="text-sm font-medium">{client.preferredContactTime || "Not specified"}</dd>
                    </div>
                    <div className="space-y-1">
                      <dt className="text-sm text-muted-foreground">Communication Frequency</dt>
                      <dd className="text-sm font-medium">{client.communicationFrequency || "Not specified"}</dd>
                    </div>
                    <div className="space-y-1">
                      <dt className="text-sm text-muted-foreground">Last Contact</dt>
                      <dd className="text-sm font-medium">{formatDate(client.lastContactDate)}</dd>
                    </div>
                  </div>
                </div>

                <Separator />
                
                <div>
                  <h3 className="font-medium mb-3">Home Address</h3>
                  <div className="bg-muted p-4 rounded-lg">
                    <p className="mb-1">{client.homeAddress || "Address not provided"}</p>
                    <p className="text-sm">
                      {client.homeCity && <span>{client.homeCity}, </span>}
                      {client.homeState && <span>{client.homeState}, </span>}
                      {client.homePincode && <span>PIN: {client.homePincode}</span>}
                    </p>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="font-medium mb-3">Work Address</h3>
                  <div className="bg-muted p-4 rounded-lg">
                    <p className="mb-1">{client.workAddress || "Address not provided"}</p>
                    <p className="text-sm">
                      {client.workCity && <span>{client.workCity}, </span>}
                      {client.workState && <span>{client.workState}, </span>}
                      {client.workPincode && <span>PIN: {client.workPincode}</span>}
                    </p>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="font-medium mb-3">Professional Information</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <dt className="text-sm text-muted-foreground">Profession</dt>
                      <dd className="text-sm font-medium">{client.profession || "Not specified"}</dd>
                    </div>
                    <div className="space-y-1">
                      <dt className="text-sm text-muted-foreground">Designation</dt>
                      <dd className="text-sm font-medium">{client.designation || "Not specified"}</dd>
                    </div>
                    <div className="space-y-1">
                      <dt className="text-sm text-muted-foreground">Company</dt>
                      <dd className="text-sm font-medium">{client.companyName || "Not specified"}</dd>
                    </div>
                    <div className="space-y-1">
                      <dt className="text-sm text-muted-foreground">Work Experience</dt>
                      <dd className="text-sm font-medium">{client.workExperience ? `${client.workExperience} years` : "Not specified"}</dd>
                    </div>
                    <div className="space-y-1">
                      <dt className="text-sm text-muted-foreground">Sector</dt>
                      <dd className="text-sm font-medium">{client.sectorOfEmployment || "Not specified"}</dd>
                    </div>
                    <div className="space-y-1">
                      <dt className="text-sm text-muted-foreground">Annual Income</dt>
                      <dd className="text-sm font-medium">{client.annualIncome || "Not specified"}</dd>
                    </div>
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Financial Information Collapsible Card */}
        <Collapsible 
          open={isFinancialOpen} 
          onOpenChange={setIsFinancialOpen}
          className="space-y-2"
        >
          <Card className="overflow-hidden">
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors py-3 px-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-medium flex items-center gap-2">
                    <PieChart className="h-5 w-5" />
                    Financial Profile
                    {(((client as any).profile_status === 'incomplete') || !(client as any).investmentHorizon || (client as any).aumValue === 0) && (
                      <>
                        <span className="ml-2 text-xs text-primary bg-primary/10 border border-primary/30 rounded px-2 py-0.5">Incomplete</span>
                        <Button
                          size="sm"
                          className="ml-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.location.hash = `/clients/${clientId}/financial-profile`;
                          }}
                        >
                          Complete Now
                        </Button>
                      </>
                    )}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {!client.riskProfile && !client.investmentHorizon && (
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.location.hash = `/clients/${clientId}/financial-profile`;
                        }}
                        className="bg-primary hover:bg-primary/90"
                      >
                        <PieChart className="h-4 w-4 mr-2" />
                        Create Financial Profile
                      </Button>
                    )}
                    {(client.riskProfile || client.investmentHorizon) && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsEditFinancialDialogOpen(true);
                        }}
                        className="flex items-center gap-2"
                      >
                        <Edit className="h-4 w-4" />
                        Edit
                      </Button>
                    )}
                    {isFinancialOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="px-4 pb-4 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-muted/30 p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground">AUM</p>
                    <p className="font-medium text-lg">{client.aum}</p>
                    <p className="text-xs text-muted-foreground">Tier: {client.tier.toUpperCase()}</p>
                  </div>
                  <div className="bg-muted/30 p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground">Risk Profile</p>
                    <p className="font-medium text-lg">{client.riskProfile ? client.riskProfile.charAt(0).toUpperCase() + client.riskProfile.slice(1) : "Not specified"}</p>
                    <p className="text-xs text-muted-foreground">Score: {client.riskAssessmentScore || "N/A"}/10</p>
                  </div>
                  <div className="bg-muted/30 p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground">Performance</p>
                    <p className="font-medium text-lg">N/A</p>
                    <p className="text-xs text-muted-foreground">1 Year Returns</p>
                  </div>
                </div>
                
                <Separator />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-medium mb-3">Investment Profile</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <dt className="text-sm text-muted-foreground">Investment Horizon</dt>
                        <dd className="text-sm font-medium">{client.investmentHorizon || "Not specified"}</dd>
                      </div>
                      <div className="space-y-1">
                        <dt className="text-sm text-muted-foreground">Source of Wealth</dt>
                        <dd className="text-sm font-medium">{client.sourceOfWealth || "Not specified"}</dd>
                      </div>
                      <div className="space-y-1">
                        <dt className="text-sm text-muted-foreground">Net Worth</dt>
                        <dd className="text-sm font-medium">{client.netWorth || "Not specified"}</dd>
                      </div>
                      <div className="space-y-1">
                        <dt className="text-sm text-muted-foreground">Liquidity Requirements</dt>
                        <dd className="text-sm font-medium">{client.liquidityRequirements || "Not specified"}</dd>
                      </div>
                      <div className="space-y-1">
                        <dt className="text-sm text-muted-foreground">Foreign Investments</dt>
                        <dd className="text-sm font-medium">{client.foreignInvestments || "No"}</dd>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-3">Transaction Information</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <dt className="text-sm text-muted-foreground">Last Transaction Date</dt>
                        <dd className="text-sm font-medium">{formatDate(client.lastTransactionDate)}</dd>
                      </div>
                      <div className="space-y-1">
                        <dt className="text-sm text-muted-foreground">Total Transactions (YTD)</dt>
                        <dd className="text-sm font-medium">{client.totalTransactionCount || "0"}</dd>
                      </div>
                      <div className="space-y-1">
                        <dt className="text-sm text-muted-foreground">Average Transaction Value</dt>
                        <dd className="text-sm font-medium">
                          {client.averageTransactionValue ? `₹${(client.averageTransactionValue/100000).toFixed(2)} L` : "N/A"}
                        </dd>
                      </div>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <h3 className="font-medium mb-3">Investment Objectives</h3>
                    <div className="flex flex-wrap gap-2">
                      {client.investmentObjectives ? client.investmentObjectives.split(",").map((objective, i) => (
                        <Badge key={i} variant="outline" className="py-1">
                          {objective.trim()}
                        </Badge>
                      )) : <p className="text-sm text-muted-foreground">No objectives specified</p>}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-3">Preferred Products</h3>
                    <div className="flex flex-wrap gap-2">
                      {client.preferredProducts ? client.preferredProducts.split(",").map((product, i) => (
                        <Badge key={i} variant="outline" className="py-1">
                          {product.trim()}
                        </Badge>
                      )) : <p className="text-sm text-muted-foreground">No preferred products specified</p>}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-3">Financial Interests</h3>
                    <div className="flex flex-wrap gap-2">
                      {client.financialInterests ? client.financialInterests.split(",").map((interest, i) => (
                        <Badge key={i} variant="outline" className="py-1">
                          {interest.trim()}
                        </Badge>
                      )) : <p className="text-sm text-muted-foreground">No financial interests specified</p>}
                    </div>
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Family Information Collapsible Card */}
        <Collapsible 
          id="family-information-section"
          open={isFamilyOpen} 
          onOpenChange={setIsFamilyOpen}
          className="space-y-2"
        >
          <Card className="overflow-hidden">
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors py-3 px-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-medium flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Family Information
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsEditFamilyDialogOpen(true);
                      }}
                      className="flex items-center gap-2"
                    >
                      <Edit className="h-4 w-4" />
                      Edit
                    </Button>
                    {isFamilyOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="px-4 pb-4 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-medium mb-3">Family Details</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <dt className="text-sm text-muted-foreground">Marital Status</dt>
                        <dd className="text-sm font-medium">{client.maritalStatus || "Not specified"}</dd>
                      </div>
                      {client.maritalStatus === "Married" && (
                        <div className="space-y-1">
                          <dt className="text-sm text-muted-foreground">Spouse</dt>
                          <dd className="text-sm font-medium">{client.spouseName || "Not specified"}</dd>
                        </div>
                      )}
                      <div className="space-y-1">
                        <dt className="text-sm text-muted-foreground">Dependents</dt>
                        <dd className="text-sm font-medium">{client.dependentsCount !== null ? client.dependentsCount : "Not specified"}</dd>
                      </div>
                      <div className="space-y-1">
                        <dt className="text-sm text-muted-foreground">Family Financial Goals</dt>
                        <dd className="text-sm font-medium">{client.familyFinancialGoals || "Not specified"}</dd>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-3">Nominee Information</h3>
                    {client.nomineeDetails ? (
                      <div className="bg-muted/30 p-4 rounded-lg">
                        {(() => {
                          const nominee = parseJsonData(client.nomineeDetails);
                          return nominee ? (
                            <>
                              <p className="font-medium">{nominee.name}</p>
                              <p className="text-sm text-muted-foreground">Relation: {nominee.relation}</p>
                              <p className="text-sm text-muted-foreground">Share: {nominee.sharePercentage}%</p>
                            </>
                          ) : <p className="text-sm text-muted-foreground">Nominee details not available</p>
                        })()}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No nominee information</p>
                    )}
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="font-medium mb-3">Children Details</h3>
                  {client.childrenDetails ? (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b">
                            <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">Name</th>
                            <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">Gender</th>
                            <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">Age</th>
                          </tr>
                        </thead>
                        <tbody>
                          {parseJsonData(client.childrenDetails)?.map((child: any, i: number) => (
                            <tr key={i} className="border-b">
                              <td className="px-4 py-2 text-sm">{child.name}</td>
                              <td className="px-4 py-2 text-sm">{child.gender}</td>
                              <td className="px-4 py-2 text-sm">{child.age} years</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No children details available</p>
                  )}
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="font-medium mb-3">Insurance Coverage</h3>
                  {client.insuranceCoverage ? (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b">
                            <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">Type</th>
                            <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">Cover Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {parseJsonData(client.insuranceCoverage)?.map((insurance: any, i: number) => (
                            <tr key={i} className="border-b">
                              <td className="px-4 py-2 text-sm">{insurance.type}</td>
                              <td className="px-4 py-2 text-sm">{insurance.coverAmount}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No insurance coverage details available</p>
                  )}
                </div>
              </div>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* KYC & Compliance Collapsible Card */}
        <Collapsible 
          open={isKycOpen} 
          onOpenChange={setIsKycOpen}
          className="space-y-2"
        >
          <Card className="overflow-hidden">
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors py-3 px-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-medium flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    KYC & Compliance
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsEditKycDialogOpen(true);
                      }}
                      className="flex items-center gap-2"
                    >
                      <Edit className="h-4 w-4" />
                      Edit
                    </Button>
                    {isKycOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="px-4 pb-4 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">KYC Status</h3>
                  <Badge variant={getKycStatusBadge(client.kycStatus).color as any} className="flex items-center gap-1">
                    {getKycStatusBadge(client.kycStatus).icon}
                    {client.kycStatus || "Unknown"}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-medium mb-3">KYC Details</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <dt className="text-sm text-muted-foreground">KYC Date</dt>
                        <dd className="text-sm font-medium">{formatDate(client.kycDate)}</dd>
                      </div>
                      <div className="space-y-1">
                        <dt className="text-sm text-muted-foreground">PAN Number</dt>
                        <dd className="text-sm font-medium">{client.panNumber || "Not available"}</dd>
                      </div>
                      <div className="space-y-1">
                        <dt className="text-sm text-muted-foreground">Tax Residency Status</dt>
                        <dd className="text-sm font-medium">{client.taxResidencyStatus || "Not specified"}</dd>
                      </div>
                      <div className="space-y-1">
                        <dt className="text-sm text-muted-foreground">FATCA Status</dt>
                        <dd className="text-sm font-medium">{client.fatcaStatus || "Not specified"}</dd>
                      </div>
                      <div className="space-y-1">
                        <dt className="text-sm text-muted-foreground">Risk Assessment Score</dt>
                        <dd className="text-sm font-medium">{client.riskAssessmentScore ? `${client.riskAssessmentScore}/10` : "Not assessed"}</dd>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-3">Identity Proof</h3>
                    <div className="bg-muted/30 p-4 rounded-lg mb-4">
                      <p className="text-sm text-muted-foreground">Document Type</p>
                      <p className="font-medium">{client.identityProofType || "Not available"}</p>
                      <p className="text-sm font-medium mt-2">{client.identityProofNumber || "Document number not available"}</p>
                    </div>
                    
                    <h3 className="font-medium mb-3">Address Proof</h3>
                    <div className="bg-muted/30 p-4 rounded-lg">
                      <p className="text-sm text-muted-foreground">Document Type</p>
                      <p className="font-medium">{client.addressProofType || "Not available"}</p>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="font-medium mb-3">Tax Planning</h3>
                  <div className="bg-muted/30 p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground">Tax Planning Preferences</p>
                    <p className="font-medium">{client.taxPlanningPreferences || "Not specified"}</p>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium mb-3">Retirement Planning</h3>
                  <div className="bg-muted/30 p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground">Retirement Goals</p>
                    <p className="font-medium">{client.retirementGoals || "Not specified"}</p>
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      </div>

      {/* Edit Personal Information Dialog */}
      <Dialog open={isEditPersonalDialogOpen} onOpenChange={setIsEditPersonalDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Personal Information</DialogTitle>
            <DialogDescription>
              Update the client's personal information. All fields are optional.
            </DialogDescription>
          </DialogHeader>
          <PersonalInfoForm
            initialValues={{
              fullName: client?.fullName || "",
              initials: client?.initials || "",
              email: client?.email || "",
              phone: client?.phone || "",
              dateOfBirth: client?.dateOfBirth ? new Date(client.dateOfBirth).toISOString().split('T')[0] : "",
              gender: client?.gender || "",
              maritalStatus: client?.maritalStatus || "",
              anniversaryDate: client?.anniversaryDate ? new Date(client.anniversaryDate).toISOString().split('T')[0] : "",
              preferredContactMethod: client?.preferredContactMethod || "",
              preferredContactTime: client?.preferredContactTime || "",
              communicationFrequency: client?.communicationFrequency || "",
              homeAddress: client?.homeAddress || "",
              homeCity: client?.homeCity || "",
              homeState: client?.homeState || "",
              homePincode: client?.homePincode || "",
              workAddress: client?.workAddress || "",
              workCity: client?.workCity || "",
              workState: client?.workState || "",
              workPincode: client?.workPincode || "",
              profession: client?.profession || "",
              sectorOfEmployment: client?.sectorOfEmployment || "",
              designation: client?.designation || "",
              companyName: client?.companyName || "",
              annualIncome: client?.annualIncome || "",
              workExperience: client?.workExperience?.toString() || "",
            }}
            onSubmit={(data) => {
              // Format the data for the API
              const updateData: any = {
                fullName: data.fullName,
                initials: data.initials,
                email: data.email,
                phone: data.phone,
                dateOfBirth: data.dateOfBirth || null,
                gender: data.gender || null,
                maritalStatus: data.maritalStatus || null,
                anniversaryDate: data.anniversaryDate || null,
                preferredContactMethod: data.preferredContactMethod || null,
                preferredContactTime: data.preferredContactTime || null,
                communicationFrequency: data.communicationFrequency || null,
                homeAddress: data.homeAddress || null,
                homeCity: data.homeCity || null,
                homeState: data.homeState || null,
                homePincode: data.homePincode || null,
                workAddress: data.workAddress || null,
                workCity: data.workCity || null,
                workState: data.workState || null,
                workPincode: data.workPincode || null,
                profession: data.profession || null,
                sectorOfEmployment: data.sectorOfEmployment || null,
                designation: data.designation || null,
                companyName: data.companyName || null,
                annualIncome: data.annualIncome || null,
                workExperience: data.workExperience ? parseInt(data.workExperience) : null,
              };
              updateClientMutation.mutate(updateData);
              setIsEditPersonalDialogOpen(false);
            }}
            onCancel={() => setIsEditPersonalDialogOpen(false)}
            isLoading={updateClientMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Financial Profile Dialog - Placeholder */}
      <Dialog open={isEditFinancialDialogOpen} onOpenChange={setIsEditFinancialDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Financial Profile</DialogTitle>
            <DialogDescription>
              Update the client's financial profile information.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-4">
              To edit the financial profile, please use the dedicated financial profile page.
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditFinancialDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => {
                setIsEditFinancialDialogOpen(false);
                window.location.hash = `/clients/${clientId}/financial-profile`;
              }}>
                Go to Financial Profile
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Family Information Dialog */}
      <Dialog open={isEditFamilyDialogOpen} onOpenChange={setIsEditFamilyDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Family Information</DialogTitle>
            <DialogDescription>
              Update the client's family information.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const updateData = {
                spouseName: formData.get("spouseName") || null,
                dependentsCount: formData.get("dependentsCount") ? parseInt(formData.get("dependentsCount") as string) : null,
                familyFinancialGoals: formData.get("familyFinancialGoals") || null,
              };
              updateClientMutation.mutate(updateData);
              setIsEditFamilyDialogOpen(false);
            }}
          >
            <div className="py-4 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Spouse Name</label>
                <input
                  type="text"
                  name="spouseName"
                  className="w-full px-3 py-2 border rounded-md"
                  defaultValue={client?.spouseName || ""}
                  placeholder="Enter spouse name"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Dependents Count</label>
                <input
                  type="number"
                  name="dependentsCount"
                  className="w-full px-3 py-2 border rounded-md"
                  defaultValue={client?.dependentsCount || 0}
                  placeholder="Number of dependents"
                  min="0"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Family Financial Goals</label>
                <textarea
                  name="familyFinancialGoals"
                  className="w-full px-3 py-2 border rounded-md"
                  defaultValue={client?.familyFinancialGoals || ""}
                  placeholder="Enter family financial goals"
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditFamilyDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateClientMutation.isPending}>
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit KYC & Compliance Dialog */}
      <Dialog open={isEditKycDialogOpen} onOpenChange={setIsEditKycDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit KYC & Compliance</DialogTitle>
            <DialogDescription>
              Update the client's KYC and compliance information.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const updateData = {
                kycStatus: formData.get("kycStatus") || null,
                panNumber: formData.get("panNumber") || null,
                taxResidencyStatus: formData.get("taxResidencyStatus") || null,
                fatcaStatus: formData.get("fatcaStatus") || null,
              };
              updateClientMutation.mutate(updateData);
              setIsEditKycDialogOpen(false);
            }}
          >
            <div className="py-4 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">KYC Status</label>
                <select
                  name="kycStatus"
                  className="w-full px-3 py-2 border rounded-md"
                  defaultValue={client?.kycStatus || ""}
                >
                  <option value="">Select status</option>
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
                  <option value="expired">Expired</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">PAN Number</label>
                <input
                  type="text"
                  name="panNumber"
                  className="w-full px-3 py-2 border rounded-md"
                  defaultValue={client?.panNumber || ""}
                  placeholder="Enter PAN number"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Tax Residency Status</label>
                <input
                  type="text"
                  name="taxResidencyStatus"
                  className="w-full px-3 py-2 border rounded-md"
                  defaultValue={client?.taxResidencyStatus || ""}
                  placeholder="Enter tax residency status"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">FATCA Status</label>
                <input
                  type="text"
                  name="fatcaStatus"
                  className="w-full px-3 py-2 border rounded-md"
                  defaultValue={client?.fatcaStatus || ""}
                  placeholder="Enter FATCA status"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditKycDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateClientMutation.isPending}>
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </ClientPageLayout>
  );
}