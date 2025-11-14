import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { LanguageProvider } from "@/components/i18n/language-provider";
import { AuthProvider } from "@/context/auth-context";

createRoot(document.getElementById("root")!).render(
  <ThemeProvider defaultTheme="light" storageKey="wealth-rm-theme">
    <LanguageProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </LanguageProvider>
  </ThemeProvider>
);
