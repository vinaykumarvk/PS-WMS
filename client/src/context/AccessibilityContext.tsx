import React, { createContext, useContext, useState, useEffect } from 'react';

interface AccessibilityContextType {
  highContrastMode: boolean;
  toggleHighContrastMode: () => void;
  screenReaderOptimized: boolean;
  toggleScreenReaderOptimized: () => void;
  reducedMotion: boolean;
  toggleReducedMotion: () => void;
  fontSize: "normal" | "large" | "extra-large";
  setFontSize: (size: "normal" | "large" | "extra-large") => void;
}

const AccessibilityContext = createContext<AccessibilityContextType>({
  highContrastMode: false,
  toggleHighContrastMode: () => {},
  screenReaderOptimized: false,
  toggleScreenReaderOptimized: () => {},
  reducedMotion: false,
  toggleReducedMotion: () => {},
  fontSize: "normal",
  setFontSize: () => {},
});

export const useAccessibility = () => useContext(AccessibilityContext);

export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [highContrastMode, setHighContrastMode] = useState(false);
  const [screenReaderOptimized, setScreenReaderOptimized] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(() => {
    // Check system preference for reduced motion
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });
  const [fontSize, setFontSizeState] = useState<"normal" | "large" | "extra-large">(() => {
    const saved = localStorage.getItem('wealthrm_font_size');
    return (saved as "normal" | "large" | "extra-large") || "normal";
  });
  
  // Initialize state from localStorage on mount
  useEffect(() => {
    const savedHighContrast = localStorage.getItem('wealthrm_high_contrast');
    const savedScreenReader = localStorage.getItem('wealthrm_screen_reader');
    
    if (savedHighContrast) {
      setHighContrastMode(savedHighContrast === 'true');
    }
    
    if (savedScreenReader) {
      setScreenReaderOptimized(savedScreenReader === 'true');
    }
  }, []);

  // Listen for system reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = (e: MediaQueryListEvent) => {
      setReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);
  
  // Apply high contrast mode to the document body
  useEffect(() => {
    if (highContrastMode) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
    
    // Save preference to localStorage
    localStorage.setItem('wealthrm_high_contrast', String(highContrastMode));
  }, [highContrastMode]);
  
  // Apply screen reader optimizations
  useEffect(() => {
    if (screenReaderOptimized) {
      document.documentElement.classList.add('screen-reader-optimized');
    } else {
      document.documentElement.classList.remove('screen-reader-optimized');
    }
    
    // Save preference to localStorage
    localStorage.setItem('wealthrm_screen_reader', String(screenReaderOptimized));
  }, [screenReaderOptimized]);

  // Apply reduced motion
  useEffect(() => {
    if (reducedMotion) {
      document.documentElement.classList.add('reduce-motion');
    } else {
      document.documentElement.classList.remove('reduce-motion');
    }
  }, [reducedMotion]);

  // Apply font size
  useEffect(() => {
    document.documentElement.classList.remove('font-normal', 'font-large', 'font-extra-large');
    document.documentElement.classList.add(`font-${fontSize}`);
    localStorage.setItem('wealthrm_font_size', fontSize);
  }, [fontSize]);
  
  const toggleHighContrastMode = () => {
    setHighContrastMode(prev => !prev);
  };
  
  const toggleScreenReaderOptimized = () => {
    setScreenReaderOptimized(prev => !prev);
  };

  const toggleReducedMotion = () => {
    setReducedMotion(prev => !prev);
  };

  const setFontSize = (size: "normal" | "large" | "extra-large") => {
    setFontSizeState(size);
  };
  
  return (
    <AccessibilityContext.Provider 
      value={{ 
        highContrastMode, 
        toggleHighContrastMode,
        screenReaderOptimized,
        toggleScreenReaderOptimized,
        reducedMotion,
        toggleReducedMotion,
        fontSize,
        setFontSize,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
};