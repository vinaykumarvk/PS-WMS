import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { 
  Home, 
  Users, 
  UserPlus, 
  Calendar, 
  CheckSquare, 
  BarChart2, 
  Package, 
  Settings, 
  HelpCircle,
  FileText,
  MessageSquare,
  Bell,
  X,
  ShoppingCart,
  Zap,
  Repeat,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface MenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  badge?: number;
  onClick?: () => void;
}

interface MobileMenuDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPath?: string;
}

const menuItems: MenuItem[] = [
  { id: 'home', label: 'Home', icon: Home, href: '/' },
  { id: 'clients', label: 'Clients', icon: Users, href: '/clients' },
  { id: 'prospects', label: 'Prospects', icon: UserPlus, href: '/prospects' },
  { id: 'calendar', label: 'Calendar', icon: Calendar, href: '/calendar' },
  { id: 'tasks', label: 'Tasks', icon: CheckSquare, href: '/tasks' },
  { id: 'products', label: 'Products', icon: Package, href: '/products' },
  { id: 'order-management', label: 'Orders', icon: ShoppingCart, href: '/order-management' },
  { id: 'sip-builder', label: 'SIP Builder', icon: Repeat, href: '/sip-builder' },
  { id: 'automation', label: 'Automation', icon: Zap, href: '/automation' },
  { id: 'analytics', label: 'Analytics', icon: BarChart2, href: '/analytics' },
  { id: 'communications', label: 'Communications', icon: MessageSquare, href: '/communications' },
  { id: 'announcements', label: 'Announcements', icon: Bell, href: '/announcements' },
  { id: 'talking-points', label: 'Talking Points', icon: FileText, href: '/talking-points' },
  { id: 'help', label: 'Help Center', icon: HelpCircle, href: '/help-center' },
  { id: 'settings', label: 'Settings', icon: Settings, href: '/settings' },
];

export function MobileMenuDrawer({ open, onOpenChange, currentPath }: MobileMenuDrawerProps) {
  const isMobile = useIsMobile();
  
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
        
        <div className="overflow-y-auto h-full px-6 py-4">
          <div className="grid grid-cols-2 gap-3">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigate(item.href)}
                  className={cn(
                    'flex flex-col items-center justify-center gap-2 p-4 rounded-lg border-2 transition-all',
                    'hover:bg-muted active:scale-95',
                    active
                      ? 'border-primary bg-primary/5'
                      : 'border-border bg-card'
                  )}
                >
                  <div className="relative">
                    <Icon className={cn(
                      'h-6 w-6',
                      active ? 'text-primary' : 'text-muted-foreground'
                    )} />
                    {item.badge && item.badge > 0 && (
                      <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center">
                        {item.badge > 9 ? '9+' : item.badge}
                      </span>
                    )}
                  </div>
                  <span className={cn(
                    'text-xs font-medium text-center',
                    active ? 'text-primary' : 'text-muted-foreground'
                  )}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

