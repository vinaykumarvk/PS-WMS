import React, { useMemo } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { X, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { navigationWorkspaces, type NavigationBadgeKey } from '@/config/navigation';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useNavigationIndicators } from '@/hooks/use-navigation-indicators';

interface MobileMenuDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPath?: string;
}

export function MobileMenuDrawer({ open, onOpenChange, currentPath }: MobileMenuDrawerProps) {
  const isMobile = useIsMobile();
  const indicators = useNavigationIndicators();
  const workspaces = useMemo(() => {
    return navigationWorkspaces
      .map(workspace => ({
        ...workspace,
        items: workspace.items.filter(item => !item.platforms || item.platforms.includes("mobile"))
      }))
      .filter(workspace => workspace.items.length > 0);
  }, []);
  
  const handleNavigate = (href: string) => {
    window.location.hash = href;
    onOpenChange(false);
  };

  const isActive = (href: string): boolean => {
    if (!currentPath) return false;
    if (href === '/' && currentPath === '/') return true;
    if (href !== '/' && currentPath.startsWith(href)) return true;
    return false;
  };

  if (!isMobile) {
    return null;
  }

  const getNotificationStatus = (badgeKey?: NavigationBadgeKey) => {
    if (!badgeKey) return false;
    switch (badgeKey) {
      case "appointments":
        return indicators.hasAppointmentsToday;
      case "tasks":
        return indicators.hasOverdueTasks;
      case "talkingPoints":
        return indicators.hasRecentTalkingPoints;
      case "announcements":
        return indicators.hasRecentAnnouncements;
      case "clients":
        return indicators.hasRecentClients;
      default:
        return false;
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-border">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-xl font-semibold">Menu</SheetTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </SheetHeader>
        
        <div className="overflow-y-auto h-full px-4 py-4 space-y-4">
          {workspaces.map((workspace) => (
            <Collapsible
              key={workspace.id}
              defaultOpen={workspace.id === "client-management"}
              className="rounded-2xl border border-border bg-card/60 px-3 py-2"
            >
              <CollapsibleTrigger asChild>
                <button className="group flex w-full items-center justify-between text-left">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{workspace.label}</p>
                    {workspace.description && (
                      <p className="text-xs text-muted-foreground">{workspace.description}</p>
                    )}
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground transition group-data-[state=open]:rotate-180" />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-3 pt-3">
                {workspace.quickLinks?.length ? (
                  <div className="flex flex-wrap gap-2">
                    {workspace.quickLinks.map((link) => (
                      <button
                        key={`${workspace.id}-${link.label}`}
                        onClick={() => handleNavigate(link.href)}
                        className="rounded-full border border-dashed border-border px-3 py-1 text-xs font-medium text-muted-foreground hover:border-primary hover:text-primary"
                      >
                        {link.label}
                      </button>
                    ))}
                  </div>
                ) : null}
                <div className="flex flex-col gap-2">
                  {workspace.items.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.href);
                    const showNotification = getNotificationStatus(item.badgeKey);
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleNavigate(item.href)}
                        className={cn(
                          "flex items-center justify-between rounded-xl border px-3 py-3 text-left transition",
                          active ? "border-primary bg-primary/5" : "border-border bg-background hover:bg-muted/60"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <span className={cn(
                            "flex h-10 w-10 items-center justify-center rounded-full border",
                            active ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground"
                          )}>
                            <Icon className="h-5 w-5" />
                          </span>
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold text-foreground">{item.label}</span>
                            {item.description && (
                              <span className="text-xs text-muted-foreground">{item.description}</span>
                            )}
                          </div>
                        </div>
                        {showNotification && (
                          <span className="h-2 w-2 rounded-full bg-red-500" aria-hidden="true" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
