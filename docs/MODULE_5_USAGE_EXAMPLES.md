# Module 5: Modern UI/UX - Usage Examples

This document provides practical examples for using all Module 5 features.

---

## Table of Contents

1. [Theme System](#theme-system)
2. [Accessibility Features](#accessibility-features)
3. [Internationalization (i18n)](#internationalization-i18n)
4. [Animations](#animations)
5. [Complete Integration Example](#complete-integration-example)

---

## Theme System

### Basic Theme Usage

```tsx
import { useTheme } from "@/hooks/use-theme";
import { ThemeToggle } from "@/components/theme/theme-toggle";

function Header() {
  const { theme, isDark, toggleTheme } = useTheme();
  
  return (
    <header className={isDark ? "bg-gray-900" : "bg-white"}>
      <ThemeToggle />
      <p>Current theme: {theme}</p>
    </header>
  );
}
```

### Conditional Styling Based on Theme

```tsx
import { useTheme } from "@/hooks/use-theme";

function Card() {
  const { isDark } = useTheme();
  
  return (
    <div className={cn(
      "p-4 rounded-lg",
      isDark ? "bg-gray-800 text-white" : "bg-white text-gray-900"
    )}>
      Card content
    </div>
  );
}
```

---

## Accessibility Features

### Skip Link

```tsx
import { SkipLink } from "@/components/accessibility";

function App() {
  return (
    <>
      <SkipLink href="#main-content" />
      <nav>Navigation</nav>
      <main id="main-content">Main content</main>
    </>
  );
}
```

### Focus Trap (for Modals)

```tsx
import { FocusTrap } from "@/components/accessibility";
import { useState } from "react";

function Modal() {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50">
          <FocusTrap active={isOpen}>
            <div className="modal-content">
              <h2>Modal Title</h2>
              <button onClick={() => setIsOpen(false)}>Close</button>
            </div>
          </FocusTrap>
        </div>
      )}
    </>
  );
}
```

### Accessibility Hook Usage

```tsx
import { useAccessibilityEnhanced } from "@/hooks/use-accessibility";
import { useEffect } from "react";

function MyComponent() {
  const {
    highContrastMode,
    toggleHighContrastMode,
    reducedMotion,
    fontSize,
    setFontSize,
    announce,
    skipToMain,
  } = useAccessibilityEnhanced();
  
  useEffect(() => {
    // Announce important changes to screen readers
    announce("Page loaded successfully", "polite");
  }, [announce]);
  
  return (
    <div>
      <button onClick={toggleHighContrastMode}>
        {highContrastMode ? "Disable" : "Enable"} High Contrast
      </button>
      
      <select value={fontSize} onChange={(e) => setFontSize(e.target.value)}>
        <option value="normal">Normal</option>
        <option value="large">Large</option>
        <option value="extra-large">Extra Large</option>
      </select>
      
      <button onClick={skipToMain}>Skip to Main Content</button>
    </div>
  );
}
```

### Keyboard Shortcuts

```tsx
import { KeyboardShortcuts } from "@/components/accessibility";

function MyPage() {
  const shortcuts = [
    {
      shortcut: "ctrl+k",
      description: "Open search",
      action: () => {
        // Open search modal
        console.log("Search opened");
      },
    },
    {
      shortcut: "ctrl+/",
      description: "Show help",
      action: () => {
        // Show help dialog
        console.log("Help shown");
      },
    },
  ];
  
  return (
    <KeyboardShortcuts shortcuts={shortcuts}>
      <div>Page content</div>
    </KeyboardShortcuts>
  );
}
```

### Screen Reader Only Content

```tsx
import { ScreenReaderOnly } from "@/components/accessibility";

function Button() {
  return (
    <button>
      <span>Save</span>
      <ScreenReaderOnly>
        Click to save your changes
      </ScreenReaderOnly>
    </button>
  );
}
```

---

## Internationalization (i18n)

### Basic Translation Usage

```tsx
import { useI18n } from "@/hooks/use-i18n";

function MyComponent() {
  const { t, language } = useI18n();
  
  return (
    <div>
      <h1>{t("common.welcome")}</h1>
      <button>{t("common.save")}</button>
      <p>Current language: {language}</p>
    </div>
  );
}
```

### Parameterized Translations

```tsx
// In en.json:
// "greeting": "Hello, {{name}}! You have {{count}} messages."

function Greeting({ name, count }: { name: string; count: number }) {
  const { t } = useI18n();
  
  return (
    <p>
      {t("greeting", { name, count })}
    </p>
  );
}
```

### Language Switcher

```tsx
import { LanguageSwitcher } from "@/components/i18n/language-switcher";

function Header() {
  return (
    <header>
      <nav>
        <LanguageSwitcher />
      </nav>
    </header>
  );
}
```

### Conditional Content Based on Language

```tsx
import { useI18n } from "@/hooks/use-i18n";

function MyComponent() {
  const { language } = useI18n();
  
  return (
    <div>
      {language === "hi" ? (
        <p>हिंदी में सामग्री</p>
      ) : (
        <p>English content</p>
      )}
    </div>
  );
}
```

---

## Animations

### Fade In Animation

```tsx
import { FadeIn } from "@/components/animations";

function MyComponent() {
  return (
    <FadeIn direction="up" delay={100} duration={500}>
      <div>This content will fade in from below</div>
    </FadeIn>
  );
}
```

### Slide In Animation (Scroll Triggered)

```tsx
import { SlideIn } from "@/components/animations";

function MyComponent() {
  return (
    <SlideIn direction="left" trigger="scroll" distance={50}>
      <div>This content will slide in when scrolled into view</div>
    </SlideIn>
  );
}
```

### Page Transition

```tsx
import { PageTransition } from "@/components/animations";

function MyPage() {
  return (
    <PageTransition>
      <h1>Page Title</h1>
      <p>Page content</p>
    </PageTransition>
  );
}
```

### Staggered Children Animation

```tsx
import { StaggerChildren } from "@/components/animations";

function List() {
  const items = ["Item 1", "Item 2", "Item 3", "Item 4"];
  
  return (
    <StaggerChildren staggerDelay={100}>
      {items.map((item, index) => (
        <div key={index} className="card">
          {item}
        </div>
      ))}
    </StaggerChildren>
  );
}
```

### Combining Animations

```tsx
import { FadeIn, SlideIn } from "@/components/animations";

function CardGrid() {
  return (
    <div className="grid grid-cols-3 gap-4">
      <FadeIn direction="up" delay={0}>
        <SlideIn direction="left" trigger="scroll">
          <div className="card">Card 1</div>
        </SlideIn>
      </FadeIn>
      
      <FadeIn direction="up" delay={100}>
        <SlideIn direction="left" trigger="scroll">
          <div className="card">Card 2</div>
        </SlideIn>
      </FadeIn>
      
      <FadeIn direction="up" delay={200}>
        <SlideIn direction="left" trigger="scroll">
          <div className="card">Card 3</div>
        </SlideIn>
      </FadeIn>
    </div>
  );
}
```

---

## Complete Integration Example

### App Setup (main.tsx)

```tsx
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { LanguageProvider } from "@/components/i18n/language-provider";
import { AccessibilityProvider } from "@/context/AccessibilityContext";
import { AuthProvider } from "@/context/auth-context";
import { SkipLink } from "@/components/accessibility";

createRoot(document.getElementById("root")!).render(
  <ThemeProvider defaultTheme="light" storageKey="wealth-rm-theme">
    <LanguageProvider>
      <AccessibilityProvider>
        <AuthProvider>
          <SkipLink />
          <App />
        </AuthProvider>
      </AccessibilityProvider>
    </LanguageProvider>
  </ThemeProvider>
);
```

### Complete Component Example

```tsx
import { useTheme } from "@/hooks/use-theme";
import { useI18n } from "@/hooks/use-i18n";
import { useAccessibilityEnhanced } from "@/hooks/use-accessibility";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { FadeIn, PageTransition } from "@/components/animations";
import { SkipLink } from "@/components/accessibility";

function App() {
  const { t } = useI18n();
  const { announce } = useAccessibilityEnhanced();
  
  useEffect(() => {
    announce(t("common.welcome"), "polite");
  }, [announce, t]);
  
  return (
    <PageTransition>
      <SkipLink />
      <header className="flex justify-between items-center p-4">
        <h1>{t("navigation.dashboard")}</h1>
        <div className="flex gap-2">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </header>
      
      <main id="main-content">
        <FadeIn direction="up" delay={100}>
          <div className="card">
            <h2>{t("orderManagement.title")}</h2>
            <p>{t("common.loading")}</p>
          </div>
        </FadeIn>
      </main>
    </PageTransition>
  );
}
```

---

## Best Practices

1. **Always use translations** for user-facing text
2. **Respect reduced motion** - animations automatically respect this preference
3. **Provide skip links** for keyboard users
4. **Use focus traps** for modals and dialogs
5. **Announce important changes** to screen readers
6. **Test with keyboard navigation** regularly
7. **Use semantic HTML** with proper ARIA labels
8. **Cache translations** - they're automatically cached after first load

---

## Troubleshooting

### Theme not persisting
- Check localStorage is enabled
- Verify storageKey matches in ThemeProvider

### Translations not loading
- Check translation file paths
- Verify language code matches file name
- Check browser console for import errors

### Animations not respecting reduced motion
- Verify AccessibilityProvider is wrapping your app
- Check that `.reduce-motion` class is applied to documentElement

### Focus trap not working
- Ensure FocusTrap is wrapping the correct container
- Verify `active` prop is set correctly
- Check that focusable elements exist inside the trap

---

**For more information, see:** `MODULE_5_IMPLEMENTATION.md`

