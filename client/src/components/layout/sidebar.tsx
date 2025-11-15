import { cn } from "@/lib/utils";
import { useEffect, useMemo, useState } from "react";
import {
  navigationWorkspaces,
  type NavigationBadgeKey,
  type NavigationWorkspace,
} from "@/config/navigation";
import { useNavigationIndicators } from "@/hooks/use-navigation-indicators";
import { SidebarGroup, SidebarGroupContent } from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";

export function Sidebar({ mobile = false, onNavigate }: { mobile?: boolean; onNavigate?: () => void }) {
  const [currentPath, setCurrentPath] = useState(window.location.hash.replace(/^#/, '') || '/');
  const indicators = useNavigationIndicators();
  const defaultOpenWorkspaces = useMemo(() => {
    return navigationWorkspaces.reduce<Record<string, boolean>>((acc, workspace) => {
      acc[workspace.id] = workspace.id === "client-management" || workspace.id === "sales-pipeline";
      return acc;
    }, {});
  }, []);
  const [openWorkspaces, setOpenWorkspaces] = useState<Record<string, boolean>>(defaultOpenWorkspaces);

  const toggleWorkspace = (id: string) => {
    setOpenWorkspaces(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const getNotificationStatus = (badgeKey?: NavigationBadgeKey) => {
    if (!badgeKey) return false;
    switch (badgeKey) {
      case 'appointments':
        return indicators.hasAppointmentsToday;
      case 'tasks':
        return indicators.hasOverdueTasks;
      case 'talkingPoints':
        return indicators.hasRecentTalkingPoints;
      case 'announcements':
        return indicators.hasRecentAnnouncements;
      case 'clients':
        return indicators.hasRecentClients;
      default:
        return false;
    }
  };
  
  // Update currentPath when hash changes
  useEffect(() => {
    const handleHashChange = () => {
      setCurrentPath(window.location.hash.replace(/^#/, '') || '/');
    };
    
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);
  
  const handleNavigation = (path: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    window.location.hash = path;
    // Close mobile menu if callback is provided
    if (onNavigate) {
      onNavigate();
    }
  };
  
  const renderWorkspace = (workspace: NavigationWorkspace) => {
    const isOpen = openWorkspaces[workspace.id];
    return (
      <SidebarGroup key={workspace.id} className="bg-background/60 rounded-lg border border-border/50">
        <Collapsible open={isOpen} onOpenChange={() => toggleWorkspace(workspace.id)}>
          <CollapsibleTrigger asChild>
            <button
              className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left transition hover:bg-muted/60"
              type="button"
            >
              <div>
                <p className="text-sm font-semibold text-foreground">{workspace.label}</p>
                {workspace.description && (
                  <p className="text-xs text-muted-foreground">{workspace.description}</p>
                )}
              </div>
              <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen ? "rotate-180" : "rotate-0")} />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarGroupContent className="px-1 pb-2">
              <div className="flex flex-col gap-1">
                {workspace.items.map((item) => {
                  const isActive =
                    item.href === '/order-management'
                      ? currentPath === '/order-management' || currentPath === '/orders'
                      : currentPath === item.href;
                  const hasNotification = getNotificationStatus(item.badgeKey);
                  const notificationColor =
                    item.badgeKey === 'talkingPoints' || item.badgeKey === 'announcements'
                      ? "bg-blue-500"
                      : "bg-red-500";
                  return (
                    <a
                      key={item.id}
                      href={`#${item.href}`}
                      onClick={handleNavigation(item.href)}
                      className={cn(
                        "flex items-center justify-between rounded-md px-2 py-2 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className={cn("h-4 w-4", isActive ? "text-primary-foreground" : "text-muted-foreground")} />
                        <span>{item.label}</span>
                      </div>
                      {hasNotification && (
                        <span className={cn("h-2 w-2 rounded-full", notificationColor)} aria-hidden="true" />
                      )}
                    </a>
                  );
                })}
              </div>
            </SidebarGroupContent>
          </CollapsibleContent>
        </Collapsible>
      </SidebarGroup>
    );
  };
  
  const sidebarInnerContent = (
    <div className="p-3 space-y-3 overflow-y-auto">
      {navigationWorkspaces.map(renderWorkspace)}
    </div>
  );

  if (mobile) {
    return <div className="flex flex-col w-full">{sidebarInnerContent}</div>;
  }

  return (
    <aside className="hidden md:flex md:flex-shrink-0 w-64 border-r border-border bg-background">
      <div className="flex flex-col w-full h-full">{sidebarInnerContent}</div>
    </aside>
  );
}
