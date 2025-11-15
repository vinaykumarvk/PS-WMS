import { cn } from "@/lib/utils";
import { primaryMobileShortcuts, findNavigationItem, moreMenuItem } from "@/config/navigation";
import { useEffect, useMemo, useState } from "react";

export function MobileNav() {
  const [currentPath, setCurrentPath] = useState(window.location.hash.replace(/^#/, '') || '/');
  const navigationItems = useMemo(() => {
    const items = primaryMobileShortcuts
      .map((id) => findNavigationItem(id))
      .filter((item): item is NonNullable<ReturnType<typeof findNavigationItem>> => Boolean(item));
    return [...items, moreMenuItem];
  }, []);
  
  // Update currentPath when hash changes
  useEffect(() => {
    const handleHashChange = () => {
      setCurrentPath(window.location.hash.replace(/^#/, '') || '/');
    };
    
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleMoreClick = (e: React.MouseEvent) => {
    e.preventDefault();
    // This could open a drawer with more menu items
    // For now, navigate to settings
    window.location.hash = "/settings";
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border z-10 safe-area-bottom">
      <div className="grid grid-cols-5 h-16">
        {navigationItems.map((item) => {
          const isMoreItem = item.id === "more";
          const isActive = isMoreItem ? false : currentPath === item.href;
          
          return isMoreItem ? (
            <button
              key={item.id}
              onClick={handleMoreClick}
              className={cn(
                "flex flex-col items-center justify-center space-y-1 p-1",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <item.icon className={cn(
                "h-5 w-5 sm:h-6 sm:w-6",
                isActive ? "text-primary" : "text-muted-foreground"
              )} />
              <span className="text-[10px] sm:text-xs">{item.label}</span>
            </button>
          ) : (
            <a
              key={item.id}
              href={`#${item.href}`}
              onClick={(e) => {
                e.preventDefault();
                window.location.hash = item.href;
              }}
              className={cn(
                "flex flex-col items-center justify-center space-y-1 p-1",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <item.icon className={cn(
                "h-5 w-5 sm:h-6 sm:w-6",
                isActive ? "text-primary" : "text-muted-foreground"
              )} />
              <span className="text-[10px] sm:text-xs">{item.label}</span>
            </a>
          );
        })}
      </div>
    </nav>
  );
}
