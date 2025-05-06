import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";

const CreateCourse = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState(null);
  const [courseData, setCourseData] = useState({
    title: "",
    description: "",
    thumbnail_url: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1172&q=80", // Default thumbnail
    difficulty_level: "beginner",
    duration: "4 weeks",
    category: "web development",
    price: "29.99" // Adding price field with default value
  });

  // Check if user is logged in and is a teacher
  useEffect(() => {
    const checkUserRole = async () => {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          toast.error("Please log in to create a course");
          navigate("/login");
          return;
        }

        setUserId(user.id);

        // Get user profile data
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();
        
        if (profileError) {
          console.error("Error fetching profile:", profileError);
          toast.error("Failed to verify user role");
          return;
        }

        // Check if user is a teacher
        if (profile?.role !== "teacher") {
          toast.error("Only teachers can create courses");
          navigate("/dashboard");
          return;
        }
      } catch (error) {
        console.error("Error checking user role:", error);
        toast.error("An error occurred. Please try again.");
        navigate("/dashboard");
      }
    };

    checkUserRole();
  }, [navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCourseData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!courseData.title || !courseData.description) {
      toast.error("Please provide both a title and description for your course");
      return;
    }

    try {
      setLoading(true);

      // Make sure userId is available
      if (!userId) {
        toast.error("User authentication error. Please log in again.");
        navigate("/login");
        return;
      }

      // Parse price with validation
      let coursePrice = 0;
      try {
        coursePrice = parseFloat(courseData.price);
        if (isNaN(coursePrice) || coursePrice < 0) {
          coursePrice = 0;
        }
      } catch (parseError) {
        console.error("Price parsing error:", parseError);
        coursePrice = 0;
      }

      // Create course data object with all fields including price
      const courseDataToInsert = { 
        title: courseData.title,
        description: courseData.description,
        thumbnail_url: courseData.thumbnail_url || null,
        teacher_id: userId,
        price: coursePrice
      };
      
      console.log("Creating course with data:", courseDataToInsert);
      
      // Insert course with price
      const { data, error } = await supabase
        .from('courses')
        .insert([courseDataToInsert])
        .select()
        .single();

      if (error) {
        console.error("Error details:", error);
        // Provide more specific error message based on error code
        if (error.code === "23503") {
          toast.error("Database foreign key constraint error. Please check your teacher ID.");
        } else if (error.code === "23505") {
          toast.error("A course with this title already exists.");
        } else {
          toast.error(`Database error: ${error.message}`);
        }
        throw error;
      }

      if (!data || !data.id) {
        toast.error("Course was created but returned invalid data.");
        return;
      }

      toast.success("Course created successfully!");
      navigate(`/edit-course/${data.id}`);
    } catch (error) {
      console.error("Error creating course:", error);
      toast.error("Failed to create course. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow pt-24 pb-16">
        <div className="container mx-auto px-6 max-w-3xl">
          <h1 className="text-3xl font-bold mb-6">Create New Course</h1>
          
          <Card className="shadow-md">
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Course Title</Label>
                  <Input
                    id="title"
                    name="title"
                    placeholder="e.g., Introduction to JavaScript"
                    value={courseData.title}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Course Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Provide a detailed description of your course..."
                    value={courseData.description}
                    onChange={handleInputChange}
                    rows={5}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Describe what students will learn from this course, prerequisites, and expected outcomes.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="thumbnail_url">Thumbnail URL</Label>
                  <Input
                    id="thumbnail_url"
                    name="thumbnail_url"
                    placeholder="https://example.com/your-image.jpg"
                    value={courseData.thumbnail_url}
                    onChange={handleInputChange}
                  />
                  <p className="text-xs text-muted-foreground">
                    Provide a URL to an image that represents your course (16:9 ratio recommended).
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="difficulty_level">Difficulty Level</Label>
                    <select
                      id="difficulty_level"
                      name="difficulty_level"
                      className="form-select w-full rounded-md border border-input bg-background px-3 py-2"
                      value={courseData.difficulty_level}
                      onChange={handleInputChange}
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="duration">Estimated Duration</Label>
                    <Input
                      id="duration"
                      name="duration"
                      placeholder="e.g., 4 weeks"
                      value={courseData.duration}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <select
                      id="category"
                      name="category"
                      className="form-select w-full rounded-md border border-input bg-background px-3 py-2"
                      value={courseData.category}
                      onChange={handleInputChange}
                    >
                      <option value="web development">Web Development</option>
                      <option value="data science">Data Science</option>
                      <option value="mobile development">Mobile Development</option>
                      <option value="ui/ux design">UI/UX Design</option>
                      <option value="machine learning">Machine Learning</option>
                      <option value="programming languages">Programming Languages</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="price">Course Price ($)</Label>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="e.g., 29.99"
                    value={courseData.price}
                    onChange={handleInputChange}
                  />
                  <p className="text-xs text-muted-foreground">
                    Set a price for your course. Enter 0 for a free course.
                  </p>
                </div>
                
                <div className="flex justify-end space-x-4 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => navigate("/dashboard")}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    className="btn-gradient"
                    disabled={loading}
                  >
                    {loading ? "Creating..." : "Create Course"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CreateCourse; 