import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Eye, EyeOff } from "lucide-react";
import primesoftLogo from "../assets/primesoft-logo.svg";

export default function LoginPage() {
  const { login, isAuthenticating, authError, user } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Load saved credentials on component mount
  useEffect(() => {
    const savedCredentials = localStorage.getItem("wealthforce_credentials");
    if (savedCredentials) {
      try {
        const { username: savedUsername, password: savedPassword } = JSON.parse(savedCredentials);
        setUsername(savedUsername);
        setPassword(savedPassword);
        setRememberMe(true);
      } catch (error) {
        console.error("Error loading saved credentials:", error);
      }
    } else {
      // Auto-populate for testing during development
      setUsername("rm1@primesoft.net");
      setPassword("password@123");
      setRememberMe(true);
    }
  }, []);

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      if (user.role === "Question Manager" || user.role === "question_manager") {
        window.location.hash = "/qm-portal";
      } else {
        window.location.hash = "/";
      }
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await login(username, password);
      
      // Save credentials if remember me is checked
      if (rememberMe) {
        localStorage.setItem("wealthforce_credentials", JSON.stringify({
          username,
          password
        }));
      } else {
        localStorage.removeItem("wealthforce_credentials");
      }
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-4">
          <div className="flex flex-col items-center justify-center mb-4">
            <div className="flex flex-col items-center text-center mb-4">
              <img src={primesoftLogo} alt="ABC Bank" className="h-12 w-auto mb-3" />
              <div className="flex flex-col items-center">
                <h1 className="text-primary text-base font-bold leading-tight">
                  ABC Bank
                </h1>
                <span className="text-primary/70 dark:text-primary/60 text-sm font-medium leading-tight">
                  Wealth Management System
                </span>
              </div>
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-center">Sign In</CardTitle>
          <CardDescription className="text-center">
            Access your wealth management application
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {authError && (
              <Alert variant="destructive">
                <AlertDescription>{authError}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="username">Email Address</Label>
              <Input
                id="username"
                type="email"
                placeholder="rm1@primesoft.net"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={isAuthenticating}
                className="transition-all duration-200"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isAuthenticating}
                  className="transition-all duration-200 pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isAuthenticating}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  )}
                </Button>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="remember"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(!!checked)}
                disabled={isAuthenticating}
              />
              <Label 
                htmlFor="remember" 
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Remember my credentials
              </Label>
            </div>
            
            <Button
              type="submit"
              className="w-full"
              disabled={isAuthenticating}
            >
              {isAuthenticating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
