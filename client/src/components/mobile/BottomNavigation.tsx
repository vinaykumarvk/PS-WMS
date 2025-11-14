import React, { useEffect, useState } from 'react';
import { Home, Calendar, CheckSquare, Users, Menu } from 'lucide-react';
import { useMediaQuery } from '@/hooks/use-media-query';
import { useQuery } from '@tanstack/react-query';
import { MobileMenuDrawer } from './mobile-menu-drawer';
import { useIsMobile } from '@/hooks/use-mobile';

interface BottomNavigationProps {
  className?: string;
  onMoreClick?: () => void;
}

const BottomNavigation: React.FC<BottomNavigationProps> = ({ className = '', onMoreClick }) => {
  const [currentPath, setCurrentPath] = useState<string>('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isMobile = useMediaQuery('(max-width: 768px)');

  // Fetch data for notification dots
  const { data: appointments } = useQuery({
    queryKey: ['/api/appointments/today'],
    staleTime: 5 * 60 * 1000,
  });

  const { data: tasks } = useQuery({
    queryKey: ['/api/tasks'],
    staleTime: 5 * 60 * 1000,
  });

  const { data: clients } = useQuery({
    queryKey: ['/api/clients'],
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
  const hasRecentClients = Array.isArray(clients) && clients.some((client: any) => {
    const createdDate = new Date(client.createdAt);
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    return createdDate >= threeDaysAgo;
  });
  
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
  
  const isActive = (path: string): boolean => {
    if (path === '/' && currentPath === '/') return true;
    if (path === '/calendar' && currentPath === '/calendar') return true;
    if (path === '/tasks' && currentPath === '/tasks') return true;
    if (path === '/clients' && (currentPath === '/clients' || currentPath.startsWith('/clients/'))) return true;
    if (path === '/menu' && (
      currentPath === '/prospects' ||
      currentPath === '/announcements' ||
      currentPath === '/analytics' || 
      currentPath === '/products' ||
      currentPath === '/communications' ||
      currentPath === '/talking-points'
    )) return true;
    
    return false;
  };
  
  const navigateTo = (path: string) => {
    window.location.hash = path;
  };
  
  if (!isMobile) {
    return null; // Don't render on non-mobile screens
  }
  
  // Notification dot component
  const NotificationDot = ({ show, className = '' }: { show: boolean; className?: string }) => {
    if (!show) return null;
    return (
      <div className={`absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full ${className}`} />
    );
  };

  return (
    <div className={`fixed bottom-0 left-0 right-0 bg-background border-t border-border flex justify-around items-center h-16 z-50 ${className}`}>
      <button 
        onClick={() => navigateTo('/')}
        className={`flex flex-col items-center justify-center w-full h-full ${isActive('/') ? 'text-primary' : 'text-muted-foreground'}`}
        aria-label="Home"
      >
        <Home size={24} />
        <span className="text-xs mt-1">Home</span>
      </button>
      
      <button 
        onClick={() => navigateTo('/calendar')}
        className={`flex flex-col items-center justify-center w-full h-full ${isActive('/calendar') ? 'text-primary' : 'text-muted-foreground'}`}
        aria-label="Calendar"
      >
        <div className="relative">
          <Calendar size={24} />
          {hasAppointmentsToday && (
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
          )}
        </div>
        <span className="text-xs mt-1">Calendar</span>
      </button>
      
      <button 
        onClick={() => navigateTo('/tasks')}
        className={`flex flex-col items-center justify-center w-full h-full ${isActive('/tasks') ? 'text-primary' : 'text-muted-foreground'}`}
        aria-label="Tasks"
      >
        <div className="relative">
          <CheckSquare size={24} />
          {hasOverdueTasks && (
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
          )}
        </div>
        <span className="text-xs font-medium mt-1">Tasks</span>
      </button>
      
      <button 
        onClick={() => navigateTo('/clients')}
        className={`flex flex-col items-center justify-center w-full h-full ${isActive('/clients') ? 'text-primary' : 'text-muted-foreground'}`}
        aria-label="Clients"
      >
        <div className="relative">
          <Users size={24} />
          {hasRecentClients && (
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full" />
          )}
        </div>
        <span className="text-xs mt-1">Clients</span>
      </button>
      
      <button 
        onClick={() => {
          setIsMenuOpen(true);
          onMoreClick?.();
        }}
        className={`flex flex-col items-center justify-center w-full h-full ${isActive('/menu') ? 'text-primary' : 'text-muted-foreground'} relative`}
        aria-label="More"
      >
        <Menu size={24} />
        <span className="text-xs mt-1">More</span>
      </button>
      
      <MobileMenuDrawer 
        open={isMenuOpen} 
        onOpenChange={setIsMenuOpen}
        currentPath={currentPath}
      />
    </div>
  );
};

export default BottomNavigation;