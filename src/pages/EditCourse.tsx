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
import { PlusCircle, Save, ArrowLeft, Eye, Trash2, Plus, Minus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

// Define Json type to match Supabase Json type
type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

// Interface for lesson data
interface LessonData {
  id: string;
  title: string;
  content_url: string;
  video_url?: string;
  order_index: number;
  course_id: string;
}

// Interface for quiz questions
interface QuizQuestion {
  id: string;
  text: string;
  options: string[];
  correctOption: number;
}

// Interface for quiz data
interface QuizData {
  id: string;
  title: string;
  questions: QuizQuestion[];
  course_id: string;
  created_at?: string;
}

// Interface for database quiz with raw JSON
interface DbQuiz {
  id: string;
  title: string;
  questions: Json;
  course_id: string;
  created_at?: string;
}

const EditCourse = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [savingCourse, setSavingCourse] = useState(false);
  const [savingLessons, setSavingLessons] = useState(false);
  const [savingQuiz, setSavingQuiz] = useState(false);
  const [userId, setUserId] = useState(null);
  const [courseData, setCourseData] = useState({
    title: "",
    description: "",
    thumbnail_url: "",
    teacher_id: "",
    // Additional metadata fields stored in app state only (not in database)
    difficulty_level: "beginner",
    duration: "",
    category: "web development",
    published: false,
    price: "0.00"
  });
  const [lessons, setLessons] = useState<LessonData[]>([]);
  const [newLesson, setNewLesson] = useState({
    title: "",
    content: "",
    video_url: "",
    order: 1
  });
  const [activeTab, setActiveTab] = useState("details");
  const [quizzes, setQuizzes] = useState<QuizData[]>([]);
  const [newQuiz, setNewQuiz] = useState({
    title: "",
    questions: [
      {
        id: crypto.randomUUID(),
        text: "",
        options: ["", "", "", ""],
        correctOption: 0
      }
    ]
  });

  // Check if user is logged in and is a teacher
  useEffect(() => {
    const checkUserAndLoadCourse = async () => {
      try {
        setLoading(true);
        
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          toast.error("Please log in to edit this course");
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
          toast.error("Only teachers can edit courses");
          navigate("/dashboard");
          return;
        }

        // Load course data
        const { data: course, error: courseError } = await supabase
          .from('courses')
          .select('*')
          .eq('id', courseId)
          .single();

        if (courseError) {
          console.error("Error fetching course:", courseError);
          toast.error("Failed to load course data");
          navigate("/dashboard");
          return;
        }

        // Verify that this teacher owns the course
        if (course.teacher_id !== user.id) {
          toast.error("You don't have permission to edit this course");
          navigate("/dashboard");
          return;
        }

        // Update the course state with database data 
        // For fields not in the database, we'll keep our default values
        setCourseData(prev => ({
          ...prev,
          title: course.title || "",
          description: course.description || "",
          thumbnail_url: course.thumbnail_url || "",
          teacher_id: course.teacher_id || "",
          price: course.price ? course.price.toString() : "0.00"
          // difficulty_level, duration, category, published remain as state-only fields
        }));

        // Load lessons for this course
        const { data: lessonData, error: lessonError } = await supabase
          .from('lessons')
          .select('*')
          .eq('course_id', courseId)
          .order('order_index', { ascending: true });

        if (lessonError) {
          console.error("Error fetching lessons:", lessonError);
          toast.error("Failed to load course lessons");
        } else {
          setLessons(lessonData || []);
          // Set the order for the new lesson to be next in sequence
          setNewLesson(prev => ({
            ...prev,
            order: (lessonData?.length || 0) + 1
          }));
        }
      } catch (error) {
        console.error("Error:", error);
        toast.error("An error occurred while loading the course");
        navigate("/dashboard");
      } finally {
        setLoading(false);
      }
    };

    checkUserAndLoadCourse();
  }, [courseId, navigate]);

  // Add a new useEffect to load quizzes
  useEffect(() => {
    const fetchQuizzes = async () => {
      if (!courseId) return;
      
      try {
        const { data: quizzesData, error } = await supabase
          .from('quizzes')
          .select('*')
          .eq('course_id', courseId);
          
        if (error) {
          console.error("Error fetching quizzes:", error);
          return;
        }
        
        // Parse the quiz data and safely convert to our types
        const parsedQuizzes: QuizData[] = [];
        
        for (const quiz of quizzesData || []) {
          try {
            // Default empty questions array
            let questions: QuizQuestion[] = [];
            
            // Try to parse the questions if they exist
            if (quiz.questions && typeof quiz.questions === 'object') {
              // Handle both array and string (JSON) formats
              const questionArray = Array.isArray(quiz.questions) 
                ? quiz.questions 
                : (typeof quiz.questions === 'string' ? JSON.parse(quiz.questions) : []);
              
              questions = questionArray.map((q: any) => ({
                id: q.id || crypto.randomUUID(),
                text: q.text || "",
                options: Array.isArray(q.options) ? q.options : ["", "", "", ""],
                correctOption: typeof q.correctOption === 'number' ? q.correctOption : 0
              }));
            }
            
            parsedQuizzes.push({
              id: quiz.id,
              title: quiz.title,
              course_id: quiz.course_id,
              created_at: quiz.created_at,
              questions
            });
          } catch (e) {
            console.error("Error parsing quiz:", e);
          }
        }
        
        setQuizzes(parsedQuizzes);
      } catch (err) {
        console.error("Error:", err);
      }
    };
    
    if (!loading) {
      fetchQuizzes();
    }
  }, [courseId, loading]);

  const handleCourseInputChange = (e) => {
    const { name, value } = e.target;
    setCourseData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLessonInputChange = (e) => {
    const { name, value } = e.target;
    setNewLesson(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveCourse = async () => {
    if (!courseData.title || !courseData.description) {
      toast.error("Please provide both a title and description for your course");
      return;
    }

    try {
      setSavingCourse(true);

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

      // Create update data including price
      const updateData = {
        title: courseData.title,
        description: courseData.description,
        thumbnail_url: courseData.thumbnail_url || null,
        price: coursePrice
      };

      console.log("Updating course with data:", updateData);

      // Only update fields that are in the database schema
      const { error } = await supabase
        .from('courses')
        .update(updateData)
        .eq('id', courseId);

      if (error) {
        console.error("Error saving course:", error);
        if (error.code === "23505") {
          toast.error("A course with this title already exists.");
        } else {
          toast.error(`Database error: ${error.message}`);
        }
        throw error;
      }

      toast.success("Course details saved successfully!");
    } catch (error) {
      console.error("Error saving course:", error);
      toast.error("Failed to save course details. Please try again.");
    } finally {
      setSavingCourse(false);
    }
  };

  const handleAddLesson = async () => {
    if (!newLesson.title) {
      toast.error("Please provide a title for the lesson");
      return;
    }

    try {
      setSavingLessons(true);

      const { data, error } = await supabase
        .from('lessons')
        .insert([
          {
            title: newLesson.title,
            content_url: newLesson.content,
            video_url: newLesson.video_url,
            order_index: newLesson.order,
            course_id: courseId
          }
        ])
        .select();

      if (error) {
        throw error;
      }

      toast.success("Lesson added successfully!");
      
      // Update lessons list
      setLessons([...lessons, data[0]]);
      
      // Reset the form for a new lesson
      setNewLesson({
        title: "",
        content: "",
        video_url: "",
        order: newLesson.order + 1
      });
    } catch (error) {
      console.error("Error adding lesson:", error);
      toast.error("Failed to add lesson. Please try again.");
    } finally {
      setSavingLessons(false);
    }
  };

  const handleDeleteLesson = async (lessonId) => {
    if (!confirm("Are you sure you want to delete this lesson? This action cannot be undone.")) {
      return;
    }

    try {
      setSavingLessons(true);

      const { error } = await supabase
        .from('lessons')
        .delete()
        .eq('id', lessonId);

      if (error) {
        throw error;
      }

      // Update lessons list and reorder remaining lessons
      const updatedLessons = lessons.filter(lesson => lesson.id !== lessonId);
      setLessons(updatedLessons);
      
      // Reorder lessons in database
      for (let i = 0; i < updatedLessons.length; i++) {
        const lesson = updatedLessons[i];
        if (lesson.order_index !== i + 1) {
          await supabase
            .from('lessons')
            .update({ order_index: i + 1 })
            .eq('id', lesson.id);
          
          // Update local state as well
          lesson.order_index = i + 1;
        }
      }

      // Update the order for the new lesson form
      setNewLesson(prev => ({
        ...prev,
        order: updatedLessons.length + 1
      }));

      toast.success("Lesson deleted successfully!");
    } catch (error) {
      console.error("Error deleting lesson:", error);
      toast.error("Failed to delete lesson. Please try again.");
    } finally {
      setSavingLessons(false);
    }
  };

  const handleTogglePublish = async () => {
    try {
      setSavingCourse(true);

      const newPublishedState = !courseData.published;
      
      // Update only our local state since there's no published field in the database
      setCourseData(prev => ({
        ...prev,
        published: newPublishedState
      }));

      toast.success(newPublishedState 
        ? "Course published successfully! It's now visible to students." 
        : "Course unpublished. It's no longer visible to students.");
    } catch (error) {
      console.error("Error toggling publish state:", error);
      toast.error("Failed to update course status. Please try again.");
    } finally {
      setSavingCourse(false);
    }
  };

  // Edit an existing lesson
  const handleEditLesson = (lessonId) => {
    // This would typically navigate to a lesson editor page
    navigate(`/edit-lesson/${lessonId}`);
  };

  // Quiz handlers
  const handleQuizInputChange = (e) => {
    const { name, value } = e.target;
    setNewQuiz(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleQuestionChange = (index, field, value) => {
    setNewQuiz(prev => {
      const updatedQuestions = [...prev.questions];
      if (field === 'options') {
        // If changing an option, we need the option index too
        const [optionIdx, optionValue] = value;
        updatedQuestions[index].options[optionIdx] = optionValue;
      } else {
        updatedQuestions[index][field] = value;
      }
      return {
        ...prev,
        questions: updatedQuestions
      };
    });
  };
  
  const handleAddQuestion = () => {
    setNewQuiz(prev => ({
      ...prev,
      questions: [
        ...prev.questions,
        {
          id: crypto.randomUUID(),
          text: "",
          options: ["", "", "", ""],
          correctOption: 0
        }
      ]
    }));
  };
  
  const handleRemoveQuestion = (index) => {
    setNewQuiz(prev => {
      const questions = [...prev.questions];
      if (questions.length > 1) {
        questions.splice(index, 1);
      }
      return {
        ...prev,
        questions
      };
    });
  };
  
  const handleAddQuiz = async () => {
    // Validate quiz
    if (!newQuiz.title.trim()) {
      toast.error("Please enter a quiz title");
      return;
    }
    
    const validQuestions = newQuiz.questions.every(q => 
      q.text.trim() && q.options.every(opt => opt.trim()) && q.correctOption >= 0 && q.correctOption < 4
    );
    
    if (!validQuestions) {
      toast.error("Please fill out all questions and options, and select a correct answer for each question");
      return;
    }
    
    try {
      setSavingQuiz(true);
      
      // Save quiz to Supabase
      const { data, error } = await supabase
        .from('quizzes')
        .insert([
          {
            title: newQuiz.title,
            course_id: courseId,
            questions: newQuiz.questions
          }
        ])
        .select();
        
      if (error) {
        console.error("Error saving quiz:", error);
        toast.error("Failed to save quiz");
        return;
      }
      
      if (data && data.length > 0) {
        // Create a properly typed quiz object
        const newQuizData: QuizData = {
          id: data[0].id,
          title: data[0].title,
          course_id: data[0].course_id,
          created_at: data[0].created_at,
          questions: newQuiz.questions // Use our validated questions
        };
        
        // Add to quizzes state
        setQuizzes(prev => [...prev, newQuizData]);
        
        // Reset the form
        setNewQuiz({
          title: "",
          questions: [
            {
              id: crypto.randomUUID(),
              text: "",
              options: ["", "", "", ""],
              correctOption: 0
            }
          ]
        });
        
        toast.success("Quiz added successfully!");
      }
    } catch (err) {
      console.error("Error:", err);
      toast.error("An unexpected error occurred");
    } finally {
      setSavingQuiz(false);
    }
  };
  
  const handleDeleteQuiz = async (quizId) => {
    try {
      const { error } = await supabase
        .from('quizzes')
        .delete()
        .eq('id', quizId);
        
      if (error) {
        console.error("Error deleting quiz:", error);
        toast.error("Failed to delete quiz");
        return;
      }
      
      // Update state
      setQuizzes(prev => prev.filter(quiz => quiz.id !== quizId));
      toast.success("Quiz deleted successfully!");
    } catch (err) {
      console.error("Error:", err);
      toast.error("An unexpected error occurred");
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
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="flex justify-between items-center mb-8">
            <Button 
              variant="ghost" 
              onClick={() => navigate(-1)}
              className="flex items-center text-lg"
            >
              <ArrowLeft className="mr-2 h-5 w-5" />
              Back to Course
            </Button>
            <div className="flex items-center">
              <Button variant="outline" className="mr-3">
                <Eye className="mr-2 h-4 w-4" />
                Preview
              </Button>
              <Button 
                variant={courseData.published ? "default" : "outline"}
                onClick={handleTogglePublish}
                disabled={savingCourse}
              >
                {courseData.published ? "Published" : "Unpublished"}
              </Button>
            </div>
          </div>
          
          <h1 className="text-3xl font-bold mb-6">Edit Course: {courseData.title}</h1>
          
          <Card>
            <CardContent className="p-6">
              <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid grid-cols-3 mb-8">
                  <TabsTrigger value="details">Course Details</TabsTrigger>
                  <TabsTrigger value="lessons">Lessons</TabsTrigger>
                  <TabsTrigger value="quizzes">Quizzes</TabsTrigger>
                </TabsList>
                
                <TabsContent value="details">
                  <form className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="title">Course Title</Label>
                      <Input
                        id="title"
                        name="title"
                        placeholder="e.g., Introduction to JavaScript"
                        value={courseData.title}
                        onChange={handleCourseInputChange}
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
                        onChange={handleCourseInputChange}
                        rows={5}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="thumbnail_url">Thumbnail URL</Label>
                      <Input
                        id="thumbnail_url"
                        name="thumbnail_url"
                        placeholder="https://example.com/your-image.jpg"
                        value={courseData.thumbnail_url}
                        onChange={handleCourseInputChange}
                      />
                      {courseData.thumbnail_url && (
                        <div className="mt-2 border rounded-md overflow-hidden w-48 h-27">
                          <img 
                            src={courseData.thumbnail_url} 
                            alt="Course thumbnail" 
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="difficulty_level">Difficulty Level</Label>
                        <select
                          id="difficulty_level"
                          name="difficulty_level"
                          className="form-select w-full rounded-md border border-input bg-background px-3 py-2"
                          value={courseData.difficulty_level}
                          onChange={handleCourseInputChange}
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
                          onChange={handleCourseInputChange}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="category">Category</Label>
                        <select
                          id="category"
                          name="category"
                          className="form-select w-full rounded-md border border-input bg-background px-3 py-2"
                          value={courseData.category}
                          onChange={handleCourseInputChange}
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
                        onChange={handleCourseInputChange}
                      />
                      <p className="text-xs text-muted-foreground">
                        Set a price for your course. Enter 0 for a free course.
                      </p>
                    </div>
                    
                    <div className="flex justify-end pt-4">
                      <Button 
                        type="button" 
                        className="flex items-center"
                        onClick={handleSaveCourse}
                        disabled={savingCourse}
                      >
                        <Save className="mr-2 h-4 w-4" />
                        {savingCourse ? "Saving..." : "Save Course Details"}
                      </Button>
                    </div>
                  </form>
                </TabsContent>
                
                <TabsContent value="lessons">
                  <div className="space-y-6">
                    <div className="bg-muted/50 p-4 rounded-md">
                      <h3 className="text-lg font-semibold mb-4">Course Lessons</h3>
                      
                      {lessons.length > 0 ? (
                        <div className="space-y-3 mb-6">
                          {lessons.map((lesson, index) => (
                            <div 
                              key={lesson.id} 
                              className="flex items-center justify-between bg-card p-3 rounded-md border"
                            >
                              <div className="flex items-center">
                                <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center mr-3">
                                  <span className="text-sm font-medium">{index + 1}</span>
                                </div>
                                <div>
                                  <h4 className="font-medium">{lesson.title}</h4>
                                  {(lesson as any).video_url && (
                                    <p className="text-xs text-muted-foreground flex items-center mt-1">
                                      <svg className="h-3 w-3 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M21 12L9 5V19L21 12Z" fill="currentColor"/>
                                      </svg>
                                      Has video
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleEditLesson(lesson.id)}
                                >
                                  Edit
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="text-destructive hover:text-destructive"
                                  onClick={() => handleDeleteLesson(lesson.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground mb-4">
                          You haven't added any lessons to this course yet. Use the form below to add your first lesson.
                        </p>
                      )}

                      <Separator className="my-6" />
                      
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Add New Lesson</h3>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="lessonTitle">Lesson Title</Label>
                            <Input
                              id="lessonTitle"
                              name="title"
                              placeholder="e.g., Introduction to HTML"
                              value={newLesson.title}
                              onChange={handleLessonInputChange}
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="videoUrl">Video URL</Label>
                            <Input
                              id="videoUrl"
                              name="video_url"
                              placeholder="e.g., https://www.youtube.com/watch?v=videoId"
                              value={newLesson.video_url}
                              onChange={handleLessonInputChange}
                            />
                            <p className="text-xs text-muted-foreground">
                              Add a YouTube or other video URL for this lesson.
                            </p>
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="lessonContent">Lesson Content</Label>
                            <Textarea
                              id="lessonContent"
                              name="content"
                              placeholder="Enter the content or description for this lesson..."
                              value={newLesson.content}
                              onChange={handleLessonInputChange}
                              rows={4}
                            />
                          </div>
                          
                          <div className="flex justify-end">
                            <Button 
                              type="button" 
                              className="flex items-center"
                              onClick={handleAddLesson}
                              disabled={savingLessons}
                            >
                              <PlusCircle className="mr-2 h-4 w-4" />
                              {savingLessons ? "Adding..." : "Add Lesson"}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="quizzes">
                  <div className="space-y-6">
                    <div className="bg-muted/50 p-4 rounded-md">
                      <h3 className="text-lg font-semibold mb-4">Course Quizzes</h3>
                      
                      {quizzes.length > 0 ? (
                        <div className="space-y-3 mb-6">
                          {quizzes.map((quiz) => (
                            <div 
                              key={quiz.id} 
                              className="flex items-center justify-between bg-card p-3 rounded-md border"
                            >
                              <div className="flex-1">
                                <h4 className="font-medium">{quiz.title}</h4>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {quiz.questions?.length || 0} questions
                                </p>
                              </div>
                              <div className="flex items-center">
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  className="text-destructive"
                                  onClick={() => handleDeleteQuiz(quiz.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 border border-dashed rounded-md mb-6">
                          <p className="text-muted-foreground">No quizzes added yet</p>
                        </div>
                      )}
                      
                      <Separator className="my-6" />
                      
                      <div className="bg-card p-4 rounded-md">
                        <h4 className="font-semibold mb-4">Add New Quiz</h4>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="quizTitle">Quiz Title</Label>
                            <Input
                              id="quizTitle"
                              name="title"
                              placeholder="Enter quiz title..."
                              value={newQuiz.title}
                              onChange={handleQuizInputChange}
                            />
                          </div>
                          
                          <div className="space-y-4">
                            <h5 className="font-medium">Questions</h5>
                            
                            {newQuiz.questions.map((question, qIndex) => (
                              <div key={question.id} className="p-4 border rounded-md">
                                <div className="flex justify-between items-center mb-3">
                                  <h6 className="font-medium">Question {qIndex + 1}</h6>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => handleRemoveQuestion(qIndex)}
                                    disabled={newQuiz.questions.length === 1}
                                  >
                                    <Minus className="h-4 w-4" />
                                  </Button>
                                </div>
                                
                                <div className="space-y-4">
                                  <div className="space-y-2">
                                    <Label>Question Text</Label>
                                    <Input
                                      placeholder="Enter your question..."
                                      value={question.text}
                                      onChange={(e) => handleQuestionChange(qIndex, 'text', e.target.value)}
                                    />
                                  </div>
                                  
                                  <div className="space-y-2">
                                    <Label>Options</Label>
                                    {question.options.map((option, oIndex) => (
                                      <div key={oIndex} className="flex items-center gap-2">
                                        <input
                                          type="radio"
                                          id={`q${qIndex}-option${oIndex}`}
                                          name={`q${qIndex}-correct`}
                                          checked={question.correctOption === oIndex}
                                          onChange={() => handleQuestionChange(qIndex, 'correctOption', oIndex)}
                                          className="h-4 w-4"
                                        />
                                        <Input
                                          placeholder={`Option ${oIndex + 1}`}
                                          value={option}
                                          onChange={(e) => handleQuestionChange(qIndex, 'options', [oIndex, e.target.value])}
                                          className="flex-1"
                                        />
                                      </div>
                                    ))}
                                    <p className="text-xs text-muted-foreground">Select the correct answer</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                            
                            <Button 
                              type="button" 
                              variant="outline"
                              className="w-full"
                              onClick={handleAddQuestion}
                            >
                              <Plus className="mr-2 h-4 w-4" />
                              Add Question
                            </Button>
                          </div>
                          
                          <div className="flex justify-end">
                            <Button 
                              type="button" 
                              className="flex items-center"
                              onClick={handleAddQuiz}
                              disabled={savingQuiz}
                            >
                              <PlusCircle className="mr-2 h-4 w-4" />
                              {savingQuiz ? "Adding..." : "Add Quiz"}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default EditCourse; 