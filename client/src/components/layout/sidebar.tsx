import { useAuth } from "@/context/auth-context";
import { cn } from "@/lib/utils";
import {
  Home,
  Users,
  TrendingUp,
  Calendar,
  CheckSquare,
  BarChart2,
  Package,
  Settings,
  FileText,
  Lightbulb,
  Bell,
  ShoppingCart,
  HelpCircle,
  Zap,
  Repeat,
} from "lucide-react";
import primesoftLogo from "../../assets/primesoft-logo.svg";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";

const navigationItems = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Clients", href: "/clients", icon: Users },
  { name: "Prospects", href: "/prospects", icon: TrendingUp },
  { name: "Calendar", href: "/calendar", icon: Calendar },
  { name: "Tasks", href: "/tasks", icon: CheckSquare },
  { name: "Notes", href: "/communications", icon: FileText },
  { name: "Insights", href: "/talking-points", icon: Lightbulb },
  { name: "Updates", href: "/announcements", icon: Bell },
  { name: "Products", href: "/products", icon: Package },
  { name: "Order Management", href: "/order-management", icon: ShoppingCart },
  { name: "SIP Builder", href: "/sip-builder", icon: Repeat },
  { name: "Automation", href: "/automation", icon: Zap },
  { name: "Analytics", href: "/analytics", icon: BarChart2 },
  { name: "Help Center", href: "/help-center", icon: HelpCircle },
];

export function Sidebar({ mobile = false, onNavigate }: { mobile?: boolean; onNavigate?: () => void }) {
  const { user } = useAuth();
  const [currentPath, setCurrentPath] = useState(window.location.hash.replace(/^#/, '') || '/');

  // Fetch data for notification dots
  const { data: appointments } = useQuery({
    queryKey: ['/api/appointments/today'],
    staleTime: 5 * 60 * 1000,
  });

  const { data: tasks } = useQuery({
    queryKey: ['/api/tasks'],
    staleTime: 5 * 60 * 1000,
  });

  const { data: talkingPoints } = useQuery({
    queryKey: ['/api/talking-points'],
    staleTime: 5 * 60 * 1000,
  });

  const { data: announcements } = useQuery({
    queryKey: ['/api/announcements'],
    staleTime: 5 * 60 * 1000,
  });

  // Calculate notification indicators
  const hasAppointmentsToday = Array.isArray(appointments) && appointments.length > 0;
  const hasOverdueTasks = Array.isArray(tasks) && tasks.some((task: any) => {
    const dueDate = new Date(task.dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return dueDate <= today && task.status !== 'completed';
  });
  const hasRecentTalkingPoints = Array.isArray(talkingPoints) && talkingPoints.some((point: any) => {
    const createdDate = new Date(point.created_at);
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    return createdDate >= threeDaysAgo && point.is_active;
  });
  const hasRecentAnnouncements = Array.isArray(announcements) && announcements.some((announcement: any) => {
    const createdDate = new Date(announcement.created_at);
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    return createdDate >= threeDaysAgo && announcement.is_active;
  });

  // Notification dot helper function
  const getNotificationStatus = (href: string) => {
    switch (href) {
      case '/calendar':
        return hasAppointmentsToday;
      case '/tasks':
        return hasOverdueTasks;
      case '/talking-points':
        return hasRecentTalkingPoints;
      case '/announcements':
        return hasRecentAnnouncements;
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
  
  const sidebarContent = (
    <div className={cn("flex flex-col w-full md:w-64 border-r border-unified bg-background text-foreground h-full transition-colors duration-300")}>

      
      {/* Navigation Links */}
      <nav className="flex-1 px-2 py-4 bg-background space-y-1 overflow-y-auto transition-colors duration-300">
        {navigationItems.map((item) => {
          // Handle order-management routes: both /order-management and /orders should be active
          const isActive = item.href === '/order-management' 
            ? (currentPath === '/order-management' || currentPath === '/orders')
            : currentPath === item.href;
          const hasNotification = getNotificationStatus(item.href);
          
          return (
            <a
              key={item.name}
              href={`#${item.href}`}
              onClick={handleNavigation(item.href)}
              className={cn(
                "group flex items-center justify-between px-2 py-2 text-sm font-medium rounded-md relative transition-all duration-300 focus-enhanced",
                isActive
                  ? "brand-accent-bg text-primary-foreground font-semibold shadow-sm"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground interactive-hover"
              )}
            >
              <div className="flex items-center">
                <div className="relative mr-3">
                  <item.icon
                    className={cn(
                      "h-5 w-5 transition-colors duration-300",
                      isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"
                    )}
                  />
                  {hasNotification && (
                    <div className={cn(
                      "absolute -top-1 -right-1 w-2 h-2 rounded-full",
                      item.href === '/talking-points' || item.href === '/announcements' 
                        ? "bg-blue-500" 
                        : "bg-red-500"
                    )} />
                  )}
                </div>
                {item.name}
              </div>
            </a>
          );
        })}
      </nav>
    </div>
  );
  
  // If it's for mobile, just return the content
  if (mobile) {
    return sidebarContent;
  }
  
  // For desktop, wrap it in the aside element with the appropriate classes
  return (
    <aside className="hidden md:flex md:flex-shrink-0">
      {sidebarContent}
    </aside>
  );
}
