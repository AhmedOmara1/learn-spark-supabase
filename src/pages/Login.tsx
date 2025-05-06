import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Book } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";

const Login = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
    setFormError(null); // Clear error when user makes changes
  };

  const handleRememberChange = (checked: boolean) => {
    setFormData(prev => ({ ...prev, rememberMe: checked }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Login form submitted");
    
    // Check if email and password are provided
    if (!formData.email || !formData.password) {
      setFormError("Email and password are required");
      toast.error("Email and password are required");
      return;
    }
    
    try {
      setIsLoading(true);
      setFormError(null);
      
      // Add a small delay to ensure the UI updates
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });
      
      if (error) {
        console.error("Login error:", error);
        setFormError(error.message);
        toast.error(error.message);
        return;
      }
      
      // Success - user logged in
      if (data.user) {
        toast.success("Login successful!");
        navigate("/dashboard");
      }
    } catch (err) {
      const error = err as Error;
      console.error("Login error:", error);
      setFormError(error.message || "An unexpected error occurred");
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Add global error handling
  useEffect(() => {
    const originalConsoleError = console.error;
    
    // Override console.error
    console.error = (...args) => {
      // Call original console.error
      originalConsoleError(...args);
      
      // Log the error for debugging
      const errorMessage = args.join(' ');
      console.log('Console error intercepted:', errorMessage);
    };
    
    // Restore original on unmount
    return () => {
      console.error = originalConsoleError;
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow flex items-center justify-center py-16 px-4 relative">
        <div className="absolute inset-0 bg-hero-pattern opacity-10 z-0"></div>
        <Card className="max-w-md w-full glass-card z-20 mx-auto relative">
          <CardContent className="p-8">
            <div className="flex flex-col items-center mb-6">
              <Book className="h-10 w-10 text-brand-purple mb-2" />
              <h1 className="text-2xl font-bold">
                Login to SmartLearn
              </h1>
              <p className="text-muted-foreground text-sm mt-2">
                Welcome back! Enter your details to access your account
              </p>
            </div>

            {formError && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}

            <form 
              onSubmit={handleSubmit} 
              className="space-y-5"
              style={{ position: 'relative', zIndex: 30 }}
            >
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  required
                  className="bg-secondary/50"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="text-sm font-medium">
                    Password
                  </label>
                  <Link to="/forgot-password" className="text-xs text-brand-purple hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  required
                  className="bg-secondary/50"
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="remember" 
                  checked={formData.rememberMe}
                  onCheckedChange={handleRememberChange}
                />
                <label
                  htmlFor="remember"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Remember me
                </label>
              </div>

              <button 
                type="submit" 
                className="w-full h-10 px-4 py-2 rounded-md font-medium text-white cursor-pointer bg-gradient-to-r from-brand-purple to-brand-teal hover:from-brand-purple-light hover:to-brand-teal-light transition-all duration-300"
                disabled={isLoading}
                onClick={(e) => {
                  e.preventDefault();
                  handleSubmit(e);
                }}
              >
                {isLoading ? "Signing in..." : "Sign in"}
              </button>

              <div className="text-center mt-6">
                <p className="text-sm text-muted-foreground">
                  Don't have an account?{" "}
                  <Link to="/register" className="text-brand-purple hover:underline">
                    Register
                  </Link>
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default Login;
