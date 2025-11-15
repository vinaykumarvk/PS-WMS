import React, { useEffect, useMemo, useState } from 'react';
import { useMediaQuery } from '@/hooks/use-media-query';
import { MobileMenuDrawer } from './mobile-menu-drawer';
import { bottomNavPrimaryItems, findNavigationItem, moreMenuItem, type NavigationItem } from '@/config/navigation';
import { useNavigationIndicators } from '@/hooks/use-navigation-indicators';

interface BottomNavigationProps {
  className?: string;
  onMoreClick?: () => void;
}

const BottomNavigation: React.FC<BottomNavigationProps> = ({ className = '', onMoreClick }) => {
  const [currentPath, setCurrentPath] = useState<string>('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isMobile = useMediaQuery('(max-width: 768px)');
  const indicators = useNavigationIndicators();
  const navigationItems = useMemo(() => {
    const primaryItems: NavigationItem[] = bottomNavPrimaryItems
      .map((id) => findNavigationItem(id))
      .filter((item): item is NavigationItem => Boolean(item));
    return [...primaryItems, moreMenuItem];
  }, []);
  
  useEffect(() => {
    // Initialize with current hash path
    const hash = window.location.hash.replace(/^#/, '') || '/';
    setCurrentPath(hash);
    
    // Listen for hash changes
    const handleHashChange = () => {
      const path = window.location.hash.replace(/^#/, '') || '/';
      setCurrentPath(path);
    };
    
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);
  
  const isActive = (item: NavigationItem): boolean => {
    switch (item.id) {
      case 'dashboard':
        return currentPath === '/';
      case 'calendar':
        return currentPath === '/calendar';
      case 'tasks':
        return currentPath === '/tasks';
      case 'clients':
        return currentPath === '/clients' || currentPath.startsWith('/clients/');
      case 'more':
        return (
      currentPath === '/prospects' ||
      currentPath === '/announcements' ||
      currentPath === '/analytics' || 
      currentPath === '/products' ||
      currentPath === '/communications' ||
      currentPath === '/talking-points'
    );
      default:
        return currentPath === item.href;
    }
  };
  
  const navigateTo = (path: string) => {
    window.location.hash = path;
  };
  
  if (!isMobile) {
    return null; // Don't render on non-mobile screens
  }
  
  return (
    <div className={`fixed bottom-0 left-0 right-0 bg-background border-t border-border flex justify-around items-center h-16 z-50 ${className}`}>
      {navigationItems.map((item) => {
        const active = isActive(item);
        const showIndicator =
          (item.id === 'calendar' && indicators.hasAppointmentsToday) ||
          (item.id === 'tasks' && indicators.hasOverdueTasks) ||
          (item.id === 'clients' && indicators.hasRecentClients);
        const indicatorColor = item.id === 'clients' ? 'bg-green-500' : 'bg-red-500';
        const handleClick = () => {
          if (item.id === 'more') {
            setIsMenuOpen(true);
            onMoreClick?.();
          } else {
            navigateTo(item.href);
          }
        };
        return (
          <button
            key={item.id}
            onClick={handleClick}
            className={`flex flex-col items-center justify-center w-full h-full ${active ? 'text-primary' : 'text-muted-foreground'}`}
            aria-label={item.label}
          >
            <div className="relative">
              <item.icon size={24} />
              {showIndicator && (
                <div className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${indicatorColor}`} />
              )}
            </div>
            <span className={`text-xs mt-1 ${item.id === 'tasks' ? 'font-medium' : ''}`}>{item.label}</span>
          </button>
        );
      })}
      
      <MobileMenuDrawer 
        open={isMenuOpen} 
        onOpenChange={setIsMenuOpen}
        currentPath={currentPath}
      />
    </div>
  );
};

export default BottomNavigation;
