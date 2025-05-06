import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Book } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isValidResetLink, setIsValidResetLink] = useState(true);

  useEffect(() => {
    // Check if we have a hash fragment which means we've arrived via a password reset link
    const checkResetLink = async () => {
      const hash = window.location.hash;
      if (!hash || !hash.includes('type=recovery')) {
        setIsValidResetLink(false);
        toast.error("Invalid password reset link. Please request a new one.");
      }
    };

    checkResetLink();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setFormError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setFormError("Password must be at least 8 characters long");
      return;
    }
    
    try {
      setIsLoading(true);
      setFormError(null);
      
      const { error } = await supabase.auth.updateUser({
        password: password
      });
      
      if (error) {
        console.error("Password reset error:", error);
        setFormError(error.message);
        toast.error(error.message);
        return;
      }
      
      // Success
      toast.success("Password successfully reset! You can now log in with your new password.");
      navigate("/login");
    } catch (err) {
      const error = err as Error;
      console.error("Password reset error:", error);
      setFormError(error.message || "An unexpected error occurred");
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow flex items-center justify-center py-16 px-4">
        <div className="absolute inset-0 bg-hero-pattern opacity-10 z-0"></div>
        <Card className="max-w-md w-full glass-card z-10 mx-auto">
          <CardContent className="p-8">
            <div className="flex flex-col items-center mb-6">
              <Book className="h-10 w-10 text-brand-purple mb-2" />
              <h1 className="text-2xl font-bold">
                Create New Password
              </h1>
              <p className="text-muted-foreground text-sm mt-2 text-center">
                Please enter a new secure password for your account
              </p>
            </div>

            {formError && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}

            {!isValidResetLink ? (
              <div className="space-y-5">
                <p className="text-center">
                  This password reset link is invalid or has expired.
                </p>
                <div className="flex justify-center mt-6">
                  <Link to="/forgot-password">
                    <Button className="btn-gradient">
                      Request New Reset Link
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium">
                    New Password
                  </label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    required
                    minLength={8}
                    className="bg-secondary/50"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Must be at least 8 characters long
                  </p>
                </div>

                <div className="space-y-2">
                  <label htmlFor="confirmPassword" className="text-sm font-medium">
                    Confirm New Password
                  </label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    required
                    className="bg-secondary/50"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full btn-gradient"
                  disabled={isLoading}
                >
                  {isLoading ? "Resetting Password..." : "Reset Password"}
                </Button>

                <div className="text-center mt-6">
                  <p className="text-sm text-muted-foreground">
                    Remember your password?{" "}
                    <Link to="/login" className="text-brand-purple hover:underline">
                      Back to Login
                    </Link>
                  </p>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default ResetPassword;
