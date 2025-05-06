import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Save, Shield, User, Key } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Define types for user data and password data
interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar_url: string | null;
  bio?: string | null;
}

interface PasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const AccountSettings = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const [userData, setUserData] = useState<UserData>({
    id: "",
    name: "",
    email: "",
    role: "",
    avatar_url: "",
    bio: ""
  });

  const [passwordData, setPasswordData] = useState<PasswordData>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);

        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
          console.error("Auth error:", authError);
          toast.error("Please log in to view your account settings");
          navigate("/login");
          return;
        }

        console.log("Current user:", user);

        // Get user profile data
        let { data: profile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError) {
          console.error("Error fetching profile:", profileError);

          // Check if the error is because the profile doesn't exist
          if (profileError.code === "PGRST116") {
            // Profile doesn't exist, create it
            console.log("Profile not found, creating new profile");

            const { error: createError } = await supabase
              .from('users')
              .insert([
                {
                  id: user.id,
                  name: user.user_metadata?.full_name || user.email?.split('@')[0] || "",
                  email: user.email || "",
                  role: user.user_metadata?.role || "student",
                  avatar_url: "https://api.dicebear.com/6.x/initials/svg?seed=" + (user.user_metadata?.full_name || user.email?.split('@')[0] || "User"),
                  bio: ""
                }
              ]);

            if (createError) {
              console.error("Error creating profile:", createError);
              toast.error("Failed to create user profile");
              return;
            }

            // Fetch the newly created profile
            const { data: newProfile, error: newProfileError } = await supabase
              .from('users')
              .select('*')
              .eq('id', user.id)
              .single();

            if (newProfileError) {
              console.error("Error fetching new profile:", newProfileError);
              toast.error("Failed to load profile data");
              return;
            }

            profile = newProfile;
          } else {
            toast.error("Failed to load profile data");
            return;
          }
        }

        console.log("User profile:", profile);

        // Update state with user data
        setUserData({
          id: user.id,
          name: profile?.name || "",
          email: user.email || "",
          role: profile?.role || "student",
          avatar_url: profile?.avatar_url || "https://api.dicebear.com/6.x/initials/svg?seed=" + profile?.name,
          bio: profile?.bio || ""
        });
      } catch (error) {
        console.error("Error fetching user data:", error);
        toast.error("An error occurred while loading your account settings");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setUserData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);

      // Log the user data being sent for debugging
      console.log("Updating profile with data:", {
        id: userData.id,
        name: userData.name,
        avatar_url: userData.avatar_url,
        bio: userData.bio
      });

      // Make sure we have a valid user ID
      if (!userData.id) {
        console.error("Missing user ID for profile update");
        toast.error("User ID is missing. Please try refreshing the page.");
        return;
      }

      // Update the user profile with only fields that exist in the database
      // Removing bio field as it doesn't exist in the database schema
      const { error } = await supabase
        .from('users')
        .update({
          name: userData.name,
          avatar_url: userData.avatar_url,
          // Include email and role to ensure all required fields are present
          email: userData.email,
          role: userData.role
        })
        .eq('id', userData.id);

      if (error) {
        console.error("Error updating profile:", error);

        // Provide more specific error messages based on the error code
        if (error.code === "42501") {
          toast.error("Permission denied. You don't have access to update this profile.");
        } else if (error.code === "23505") {
          toast.error("Email already exists. Please use a different email address.");
        } else if (error.code === "42703" || error.message?.includes("column") && error.message?.includes("does not exist")) {
          // This is the error we're getting when the bio column doesn't exist
          toast.error("Database schema mismatch. Please contact support to run the necessary migrations.");
          console.error("Database schema error - bio column may not exist. Need to run db-migration-bio.sql");
        } else if (error.message) {
          toast.error(`Update failed: ${error.message}`);
        } else {
          toast.error("Failed to update profile. Please try again.");
        }
        return;
      }

      toast.success("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);

      // Handle different types of errors
      if (error instanceof Error) {
        toast.error(`Error: ${error.message}`);
      } else {
        toast.error("An unexpected error occurred. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePassword = async () => {
    // Password validation
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New passwords don't match");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }

    if (!passwordData.currentPassword) {
      toast.error("Current password is required");
      return;
    }

    try {
      setSaving(true);
      
      // Add a timeout to prevent UI from being stuck indefinitely
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Request timed out. Please try again.")), 15000);
      });

      // First, verify the current password by signing in with it
      const signInPromise = supabase.auth.signInWithPassword({
        email: userData.email,
        password: passwordData.currentPassword,
      });

      // Race the auth request with a timeout
      const { error: signInError } = await Promise.race([
        signInPromise,
        timeoutPromise
      ]) as any;

      if (signInError) {
        console.error("Current password verification failed:", signInError);
        toast.error("Current password is incorrect");
        return;
      }

      // Now update the password with timeout
      const updatePasswordPromise = supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      const { error } = await Promise.race([
        updatePasswordPromise,
        timeoutPromise
      ]) as any;

      if (error) {
        throw error;
      }

      // Refresh the session to maintain authentication state
      await supabase.auth.refreshSession();
      
      // Reset password fields
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });

      toast.success("Password updated successfully!");
    } catch (error: any) {
      console.error("Error updating password:", error);
      
      // More specific error handling
      if (error.message?.includes("timeout")) {
        toast.error("Password update timed out. Please try again later.");
      } else if (error.message?.includes("network")) {
        toast.error("Network error. Please check your connection and try again.");
      } else if (error.message?.includes("auth")) {
        toast.error("Authentication error: Please try logging out and back in");
      } else if (error.message?.includes("password")) {
        toast.error("Password error: " + error.message);
      } else {
        toast.error("Failed to update password: " + (error.message || "Unknown error"));
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteAccount = async () => {
    // Check if confirmation text matches
    if (deleteConfirmText !== "DELETE") {
      toast.error("Please type DELETE to confirm account deletion");
      return;
    }

    try {
      setIsDeleting(true);

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        toast.error("Authentication error. Please try logging in again.");
        return;
      }

      // Delete user data from all tables in a specific order to maintain referential integrity
      
      // 1. Delete user's learning goals if the table exists
      try {
        await supabase.from('learning_goals').delete().eq('user_id', user.id);
      } catch (error) {
        console.error("Error deleting learning goals:", error);
        // Continue if table doesn't exist
      }

      // 2. Delete enrollments (this will cascade to related data)
      const { error: enrollmentsError } = await supabase
        .from('enrollments')
        .delete()
        .eq('user_id', user.id);
      
      if (enrollmentsError) {
        console.error("Error deleting enrollments:", enrollmentsError);
      }

      // 3. Delete quiz results
      const { error: resultsError } = await supabase
        .from('results')
        .delete()
        .eq('user_id', user.id);
      
      if (resultsError) {
        console.error("Error deleting quiz results:", resultsError);
      }

      // 4. Delete user profile
      const { error: profileError } = await supabase
        .from('users')
        .delete()
        .eq('id', user.id);
      
      if (profileError) {
        console.error("Error deleting user profile:", profileError);
        toast.error("Failed to delete account data. Please contact support.");
        setIsDeleting(false);
        return;
      }

      // 5. Finally, delete the auth user account
      const { error: authError } = await supabase.auth.admin.deleteUser(user.id);
      
      if (authError) {
        // If admin API fails, try the user self-deletion method
        const { error: selfDeleteError } = await supabase.rpc('delete_user');
        
        if (selfDeleteError) {
          console.error("Error deleting auth account:", selfDeleteError);
          toast.error("Failed to delete your account completely. Some data might remain.");
          setIsDeleting(false);
          return;
        }
      }

      // Sign out the user
      await supabase.auth.signOut();
      
      // Show success message and redirect to home
      toast.success("Your account has been deleted successfully");
      navigate("/");
      
    } catch (error) {
      console.error("Error in account deletion process:", error);
      toast.error("Account deletion failed. Please try again or contact support.");
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow pt-24 pb-16 flex items-center justify-center">
          <p>Loading account settings...</p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow pt-24 pb-16">
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="flex items-center mb-8">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/dashboard")}
              className="mr-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
            </Button>
            <h1 className="text-3xl font-bold">Account Settings</h1>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-8">
              <TabsTrigger value="profile" className="gap-2">
                <User className="h-4 w-4" /> Profile
              </TabsTrigger>
              <TabsTrigger value="password" className="gap-2">
                <Key className="h-4 w-4" /> Password
              </TabsTrigger>
              <TabsTrigger value="account" className="gap-2">
                <Shield className="h-4 w-4" /> Account
              </TabsTrigger>
            </TabsList>

            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle>Your Profile</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex flex-col md:flex-row gap-8">
                    <div className="md:w-1/3 flex flex-col items-center">
                      <Avatar className="w-32 h-32 mb-4">
                        <AvatarImage src={userData.avatar_url || ""} alt={userData.name} />
                        <AvatarFallback>{userData.name?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="text-center mb-4">
                        <h3 className="font-medium">{userData.name}</h3>
                        <p className="text-sm text-muted-foreground">{userData.role}</p>
                      </div>
                      <Input
                        placeholder="Avatar URL"
                        name="avatar_url"
                        value={userData.avatar_url || ""}
                        onChange={handleInputChange}
                        className="mb-2"
                      />
                      <p className="text-xs text-muted-foreground text-center">
                        Enter a URL to an image or use a service like Gravatar
                      </p>
                    </div>

                    <div className="md:w-2/3 space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                          id="name"
                          name="name"
                          value={userData.name}
                          onChange={handleInputChange}
                          placeholder="Enter your full name"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                          id="email"
                          name="email"
                          value={userData.email}
                          disabled
                          className="bg-secondary/30"
                        />
                        <p className="text-xs text-muted-foreground">
                          Email address cannot be changed directly. Please contact support.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="bio">About Me</Label>
                        <Textarea
                          id="bio"
                          name="bio"
                          value={userData.bio || ""}
                          onChange={handleInputChange}
                          placeholder="Tell others about yourself..."
                          rows={4}
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex justify-end">
                    <Button
                      onClick={handleSaveProfile}
                      disabled={saving}
                      className="flex items-center"
                    >
                      {saving ? "Saving..." : "Save Profile"}
                      {!saving && <Save className="ml-2 h-4 w-4" />}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="password">
              <Card>
                <CardHeader>
                  <CardTitle>Change Password</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4 max-w-md mx-auto">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <Input
                        id="currentPassword"
                        name="currentPassword"
                        type="password"
                        value={passwordData.currentPassword}
                        onChange={handlePasswordChange}
                        placeholder="Enter your current password"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input
                        id="newPassword"
                        name="newPassword"
                        type="password"
                        value={passwordData.newPassword}
                        onChange={handlePasswordChange}
                        placeholder="Enter new password"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={handlePasswordChange}
                        placeholder="Confirm new password"
                      />
                    </div>

                    <Button
                      onClick={handleUpdatePassword}
                      disabled={saving}
                      className="w-full"
                    >
                      {saving ? (
                        <>
                          <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
                          Updating...
                        </>
                      ) : "Update Password"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="account">
              <Card>
                <CardHeader>
                  <CardTitle>Account Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium mb-2">Account Type</h3>
                      <div className="flex items-center p-4 bg-secondary/20 rounded-md">
                        <div className="flex-1">
                          <p className="font-medium">{userData.role === "teacher" ? "Teacher Account" : "Student Account"}</p>
                          <p className="text-sm text-muted-foreground">
                            {userData.role === "teacher"
                              ? "You can create and manage courses"
                              : "You can enroll in courses and track your learning progress"}
                          </p>
                        </div>
                        {userData.role === "student" && (
                          <Button variant="outline" size="sm" onClick={() => toast.info("Teacher access request sent!")}>
                            Request Teacher Access
                          </Button>
                        )}
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h3 className="font-medium mb-2 text-destructive">Danger Zone</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 border border-destructive/20 rounded-md">
                          <div>
                            <p className="font-medium">Delete Account</p>
                            <p className="text-sm text-muted-foreground">
                              Permanently delete your account and all associated data
                            </p>
                          </div>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={handleDeleteAccount}
                          >
                            Delete Account
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
      <Dialog open={isDeleteDialogOpen} onOpenChange={() => setIsDeleteDialogOpen(false)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Account</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete your account? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteAccount}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AccountSettings;