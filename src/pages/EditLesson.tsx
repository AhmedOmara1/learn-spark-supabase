import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/sonner";
import { ArrowLeft, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

// Interface for lesson data
interface LessonData {
  id: string;
  title: string;
  content_url: string;
  video_url?: string; // Using optional field since we're adding this column
  order_index: number;
  course_id: string;
}

const EditLesson = () => {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lesson, setLesson] = useState<LessonData>({
    id: "",
    title: "",
    content_url: "",
    video_url: "",
    order_index: 0,
    course_id: ""
  });
  const [courseTitle, setCourseTitle] = useState("");

  // Fetch lesson data
  useEffect(() => {
    const fetchLessonData = async () => {
      try {
        setLoading(true);
        
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          toast.error("Please log in to edit this lesson");
          navigate("/login");
          return;
        }

        // Get lesson data
        const { data: lessonData, error: lessonError } = await supabase
          .from('lessons')
          .select(`*, courses:course_id(title, teacher_id)`)
          .eq('id', lessonId)
          .single();

        if (lessonError) {
          console.error("Error fetching lesson:", lessonError);
          toast.error("Failed to load lesson data");
          navigate("/dashboard");
          return;
        }

        // Verify that this teacher owns the course
        if (lessonData.courses.teacher_id !== user.id) {
          toast.error("You don't have permission to edit this lesson");
          navigate("/dashboard");
          return;
        }

        // Create a properly typed lesson object from database response
        // Using type assertion to handle potential missing fields
        const typedLessonData: LessonData = {
          id: lessonData.id,
          title: lessonData.title,
          content_url: lessonData.content_url || "",
          // Use optional chaining for the newly added field
          video_url: (lessonData as any).video_url || "",
          order_index: lessonData.order_index,
          course_id: lessonData.course_id
        };
        
        setLesson(typedLessonData);

        setCourseTitle(lessonData.courses.title);
      } catch (error) {
        console.error("Error:", error);
        toast.error("An error occurred while loading the lesson");
        navigate("/dashboard");
      } finally {
        setLoading(false);
      }
    };

    fetchLessonData();
  }, [lessonId, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setLesson(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    if (!lesson.title) {
      toast.error("Please provide a title for the lesson");
      return;
    }

    try {
      setSaving(true);

      const { error } = await supabase
        .from('lessons')
        .update({
          title: lesson.title,
          content_url: lesson.content_url,
          video_url: lesson.video_url
        })
        .eq('id', lessonId);

      if (error) {
        throw error;
      }

      toast.success("Lesson saved successfully!");
      navigate(`/edit-course/${lesson.course_id}`);
    } catch (error) {
      console.error("Error saving lesson:", error);
      toast.error("Failed to save lesson. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow pt-24 pb-16 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow pt-24 pb-16">
        <div className="container mx-auto px-6 max-w-3xl">
          <div className="flex items-center mb-6">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate(`/edit-course/${lesson.course_id}`)}
              className="mr-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Course
            </Button>
            <div>
              <p className="text-sm text-muted-foreground">Course: {courseTitle}</p>
              <h1 className="text-2xl font-bold">Edit Lesson</h1>
            </div>
          </div>
          
          <Card className="shadow-md">
            <CardContent className="p-6">
              <form className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Lesson Title</Label>
                  <Input
                    id="title"
                    name="title"
                    placeholder="e.g., Introduction to HTML"
                    value={lesson.title}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="video_url">Video URL</Label>
                  <Input
                    id="video_url"
                    name="video_url"
                    placeholder="e.g., https://www.youtube.com/watch?v=videoId"
                    value={lesson.video_url}
                    onChange={handleInputChange}
                  />
                  <p className="text-xs text-muted-foreground">
                    Add a YouTube or other video URL for this lesson.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="content_url">Lesson Content</Label>
                  <Textarea
                    id="content_url"
                    name="content_url"
                    placeholder="Enter the content for this lesson..."
                    value={lesson.content_url}
                    onChange={handleInputChange}
                    rows={10}
                  />
                </div>
                
                <div className="flex justify-end pt-4">
                  <Button 
                    type="button" 
                    className="flex items-center"
                    onClick={handleSave}
                    disabled={saving}
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {saving ? "Saving..." : "Save Lesson"}
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

export default EditLesson; 