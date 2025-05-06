import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Book } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";

const ForgotPassword = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      setFormError(null);
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + "/reset-password",
      });
      
      if (error) {
        console.error("Password reset error:", error);
        setFormError(error.message);
        toast.error(error.message);
        return;
      }
      
      // Success
      setIsSubmitted(true);
      toast.success("Password reset email sent! Please check your inbox.");
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
                Reset Your Password
              </h1>
              <p className="text-muted-foreground text-sm mt-2 text-center">
                {isSubmitted 
                  ? "Check your email for a password reset link"
                  : "Enter your email address to receive a password reset link"
                }
              </p>
            </div>

            {formError && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}

            {!isSubmitted ? (
              <form onSubmit={handleSubmit} className="space-y-5">
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
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full btn-gradient"
                  disabled={isLoading}
                >
                  {isLoading ? "Sending..." : "Send Reset Link"}
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
            ) : (
              <div className="space-y-5">
                <p className="text-center text-sm">
                  We've sent an email to <span className="font-semibold">{email}</span> with instructions to reset your password.
                </p>
                <p className="text-center text-sm text-muted-foreground">
                  If you don't see it in your inbox, please check your spam folder.
                </p>
                <div className="flex justify-center mt-6">
                  <Link to="/login">
                    <Button variant="outline">
                      Back to Login
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default ForgotPassword;
