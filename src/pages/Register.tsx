
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Book } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";

const Register = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "student",
    termsAccepted: false
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
    setFormError(null); // Clear error when user makes changes
  };

  const handleRoleChange = (value: string) => {
    setFormData(prev => ({ ...prev, role: value }));
    setFormError(null); // Clear error when user makes changes
  };

  const handleTermsChange = (checked: boolean) => {
    setFormData(prev => ({ ...prev, termsAccepted: checked }));
    setFormError(null); // Clear error when user makes changes
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.termsAccepted) {
      setFormError("Please accept the terms and conditions");
      toast.error("Please accept the terms and conditions");
      return;
    }
    
    try {
      setIsLoading(true);
      setFormError(null);
      
      // Register the user with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.name,
            role: formData.role,
          },
        },
      });
      
      if (error) {
        console.error("Auth error:", error);
        setFormError(error.message);
        toast.error(error.message);
        return;
      }
      
      // Success - user created in auth system
      if (data.user) {
        // First check if the user already exists in the users table
        const { data: existingUser } = await supabase
          .from('users')
          .select('id')
          .eq('id', data.user.id)
          .single();
          
        if (!existingUser) {
          // Only create profile if it doesn't exist
          const { error: profileError } = await supabase
            .from('users')
            .insert([
              {
                id: data.user.id,
                name: formData.name,
                email: formData.email,
                role: formData.role,
              },
            ]);
            
          if (profileError) {
            console.error("Profile creation error:", profileError);
            // Don't block signup if profile creation fails - we'll handle this on login
            console.log("User created in auth but profile creation failed. Will attempt to fix on login.");
          }
        }
        
        toast.success("Registration successful! Please check your email to verify your account.");
        navigate("/login");
      }
    } catch (err) {
      const error = err as Error;
      console.error("Registration error:", error);
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
                Create Your Account
              </h1>
              <p className="text-muted-foreground text-sm mt-2">
                Join SmartLearn to start your learning journey
              </p>
            </div>

            {formError && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">
                  Full Name
                </label>
                <Input
                  id="name"
                  placeholder="John Doe"
                  required
                  className="bg-secondary/50"
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>

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
                <label htmlFor="password" className="text-sm font-medium">
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  required
                  minLength={8}
                  className="bg-secondary/50"
                  value={formData.password}
                  onChange={handleChange}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Password must be at least 8 characters long
                </p>
              </div>

              <div className="space-y-2">
                <label htmlFor="role" className="text-sm font-medium">
                  I want to join as
                </label>
                <Select value={formData.role} onValueChange={handleRoleChange}>
                  <SelectTrigger className="bg-secondary/50">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Role</SelectLabel>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="teacher">Teacher</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="terms" 
                  checked={formData.termsAccepted}
                  onCheckedChange={handleTermsChange}
                />
                <label
                  htmlFor="terms"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  I agree to the{" "}
                  <Link to="/terms" className="text-brand-purple hover:underline">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link to="/privacy" className="text-brand-purple hover:underline">
                    Privacy Policy
                  </Link>
                </label>
              </div>

              <Button 
                type="submit" 
                className="w-full btn-gradient"
                disabled={isLoading}
              >
                {isLoading ? "Creating Account..." : "Create Account"}
              </Button>

              <div className="text-center mt-4">
                <p className="text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <Link to="/login" className="text-brand-purple hover:underline">
                    Log in
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

export default Register;
