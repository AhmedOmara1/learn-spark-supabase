// NOTE: This feature requires running the database migration script:
// npm run db:add-lesson-progress
// See README-VIDEO-PROGRESS.md for details

// Add TypeScript definitions for YouTube API
declare global {
  interface Window {
    YT: {
      Player: any;
      PlayerState: {
        ENDED: 0;
        PLAYING: 1;
        PAUSED: 2;
        BUFFERING: 3;
        CUED: 5;
      };
    };
  }
}

// Update the enrollment interface to include lessons_progress
interface Enrollment {
  id: string;
  user_id: string;
  course_id: string;
  progress: number;
  lessons_progress?: {[key: string]: number};
  created_at: string;
  updated_at?: string;
}

import React, { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Book, Clock, Users, Award, Check, ChevronDown, ChevronRight, Play } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Type for course items (could be either lessons or quizzes)
type CourseItem = {
  id: string;
  title: string;
  [key: string]: any; // Allow any other properties
};

// Type for syllabus section
type SyllabusSection = {
  title: string;
  items: CourseItem[];
  type: "lessons" | "quizzes";
  duration: string;
};

const CourseDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [course, setCourse] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isTeacher, setIsTeacher] = useState(false);
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [quizResults, setQuizResults] = useState<{[key: string]: any[]}>({});
  const [lessonProgress, setLessonProgress] = useState<{[key: string]: number}>({});
  const [updatingProgress, setUpdatingProgress] = useState(false);
  const videoRefs = useRef<{[key: string]: HTMLIFrameElement}>({});
  const playerReadyState = useRef<{[key: string]: boolean}>({});
  const completedLessonsRef = useRef<Set<string>>(new Set());
  const notificationTimeoutRef = useRef<any>(null);
  
  // Function to update lesson progress in database
  const updateLessonProgress = async (lessonId: string, progress: number) => {
    if (!user || !isEnrolled || updatingProgress) return;
    
    try {
      setUpdatingProgress(true);
      
      // Get current enrollment data
      const { data: enrollmentData, error: enrollmentError } = await supabase
        .from('enrollments')
        .select('id, progress, lessons_progress')
        .eq('user_id', user.id)
        .eq('course_id', id)
        .single();
        
      if (enrollmentError) {
        console.error("Error fetching enrollment:", enrollmentError);
        return;
      }
      
      // Cast enrollment data to Enrollment type
      const enrollment = enrollmentData as Enrollment;
      
      // Update or create lessons_progress object
      let lessonsProgress = enrollment.lessons_progress || {};
      lessonsProgress[lessonId] = progress;
      
      // Calculate overall course progress
      // If using the first section for lessons
      const lessonsSection = course.syllabus.find((s: any) => s.type === "lessons");
      if (lessonsSection) {
        const totalLessons = lessonsSection.items.length;
        const completedLessons = Object.values(lessonsProgress).filter(
          (p: any) => p >= 90
        ).length;
        
        // Calculate overall progress as percentage of completed lessons
        const overallProgress = Math.round((completedLessons / totalLessons) * 100);
        
        // Update enrollment record with new progress
        const { error: updateError } = await supabase
          .from('enrollments')
          .update({
            progress: overallProgress,
            lessons_progress: lessonsProgress,
            updated_at: new Date().toISOString()
          })
          .eq('id', enrollment.id);
          
        if (updateError) {
          console.error("Error updating progress:", updateError);
        } else {
          console.log(`Progress updated: Lesson ${lessonId} - ${progress}%, Overall ${overallProgress}%`);
          
          // Show toast notification when milestone reached, but only once per lesson
          if (progress >= 90 && !completedLessonsRef.current.has(lessonId)) {
            // Clear any existing notification timeout
            if (notificationTimeoutRef.current) {
              clearTimeout(notificationTimeoutRef.current);
            }
            
            // Set a new timeout to prevent multiple notifications in quick succession
            notificationTimeoutRef.current = setTimeout(() => {
              toast.success("Lesson completed! Your progress has been updated.", {
                id: `lesson-complete-${lessonId}`, // Use an ID to prevent duplicates
                duration: 3000 // Show for 3 seconds
              });
              // Add to completed lessons set
              completedLessonsRef.current.add(lessonId);
            }, 300);
          }
        }
      }
      
      // Update local state
      setLessonProgress(prev => ({
        ...prev,
        [lessonId]: progress
      }));
      
    } catch (err) {
      console.error("Error updating lesson progress:", err);
    } finally {
      setUpdatingProgress(false);
    }
  };
  
  // Handle YouTube player API interactions
  useEffect(() => {
    // Load YouTube API
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    
    // Initialize tracking for videos when they become active
    const setupVideoTracking = (lessonId: string, videoElement: HTMLIFrameElement) => {
      // Store reference to the iframe
      videoRefs.current[lessonId] = videoElement;
      
      // Create YouTube Player API connection when iframe is loaded
      videoElement.addEventListener('load', () => {
        // Wait for YouTube API to be ready
        const checkYT = setInterval(() => {
          if (window.YT && window.YT.Player) {
            clearInterval(checkYT);
            
            // Initialize player
            try {
              const player = new window.YT.Player(videoElement, {
                events: {
                  'onReady': () => {
                    playerReadyState.current[lessonId] = true;
                    console.log(`Player ready for lesson ${lessonId}`);
                  },
                  'onStateChange': (event: any) => {
                    // YT.PlayerState.ENDED = 0
                    if (event.data === 0) {
                      // Video ended - mark as 100% complete
                      updateLessonProgress(lessonId, 100);
                    }
                    
                    // YT.PlayerState.PLAYING = 1
                    if (event.data === 1) {
                      // Start progress tracking
                      const trackProgress = setInterval(() => {
                        // If player is no longer available or not playing, clear interval
                        if (!playerReadyState.current[lessonId] || !player || player.getPlayerState() !== 1) {
                          clearInterval(trackProgress);
                          return;
                        }
                        
                        const duration = player.getDuration();
                        const currentTime = player.getCurrentTime();
                        
                        if (duration > 0) {
                          const progressPercent = Math.round((currentTime / duration) * 100);
                          
                          // Update progress every 5% change
                          const storedProgress = lessonProgress[lessonId] || 0;
                          if (progressPercent > storedProgress && progressPercent % 5 === 0) {
                            updateLessonProgress(lessonId, progressPercent);
                          }
                        }
                      }, 5000); // Check every 5 seconds
                    }
                  }
                }
              });
            } catch (err) {
              console.error("Error initializing YouTube player:", err);
            }
          }
        }, 300);
      });
    };
    
    // Cleanup function
    return () => {
      // Clean up player references
      playerReadyState.current = {};
    };
  }, []);
  
  // Fetch course data and check enrollment status
  useEffect(() => {
    const fetchCourseAndEnrollmentStatus = async () => {
      if (!id) return;
      
      try {
        setIsLoading(true);
        
        // Get current user
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        setUser(currentUser);
        
        // If user is logged in, check their role
        if (currentUser) {
          // Get user profile data
          const { data: profile, error: profileError } = await supabase
            .from('users')
            .select('role')
            .eq('id', currentUser.id)
            .single();
            
          if (!profileError && profile) {
            // Check if user is a teacher
            setIsTeacher(profile.role === "teacher");
          }
          
          // Fetch quiz results for the user
          const { data: resultsData, error: resultsError } = await supabase
            .from('results')
            .select('quiz_id, score, created_at')
            .eq('user_id', currentUser.id)
            .order('created_at', { ascending: false });
            
          if (!resultsError && resultsData) {
            // Create a map of quiz_id to array of results
            const resultsMap: {[key: string]: any[]} = {};
            
            // Process all results and ensure none are filtered out
            resultsData.forEach(result => {
              if (!resultsMap[result.quiz_id]) {
                resultsMap[result.quiz_id] = [];
              }
              
              // Add formatted date to each result
              const resultDate = new Date(result.created_at);
              resultsMap[result.quiz_id].push({
                ...result,
                formattedDate: resultDate.toLocaleDateString('en-US', {
                  month: 'short', 
                  day: 'numeric',
                  year: 'numeric'
                }),
                formattedTime: resultDate.toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit'
                })
              });
            });
            
            // Sort each quiz's results by date (newest first)
            Object.keys(resultsMap).forEach(quizId => {
              resultsMap[quizId].sort((a, b) => 
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
              );
            });
            
            setQuizResults(resultsMap);
          }
          
          // Fetch enrollment data including lesson progress
          const { data: enrollmentData } = await supabase
            .from('enrollments')
            .select('*, lessons_progress')
            .eq('user_id', currentUser.id)
            .eq('course_id', id)
            .single();
          
          setIsEnrolled(!!enrollmentData);
          
          // Set lesson progress if available
          if (enrollmentData?.lessons_progress) {
            setLessonProgress(enrollmentData.lessons_progress as {[key: string]: number});
          }
        }
        
        // Fetch course data
        const { data: courseData, error: courseError } = await supabase
          .from('courses')
          .select(`
            *,
            teacher:teacher_id(id, name, avatar_url)
          `)
          .eq('id', id)
          .single();
        
        if (courseError) {
          console.error("Error fetching course:", courseError);
          setError("Failed to load course data");
          return;
        }
        
        // Fetch lessons for this course
        const { data: lessonsData, error: lessonsError } = await supabase
          .from('lessons')
            .select('*')
            .eq('course_id', id)
          .order('order_index', { ascending: true });
          
        if (lessonsError) {
          console.error("Error fetching lessons:", lessonsError);
        }
        
        // Fetch quizzes for this course
        const { data: quizzesData, error: quizzesError } = await supabase
          .from('quizzes')
          .select('*')
          .eq('course_id', id);
          
        if (quizzesError) {
          console.error("Error fetching quizzes:", quizzesError);
        }
        
        // Fetch student count for this course
        const { data: enrollmentsData } = await supabase
          .from('enrollments')
          .select('id')
          .eq('course_id', id);
        
        // Calculate total duration (in a real app, this would be stored in the lessons)
        const totalLessons = lessonsData ? lessonsData.length : 0;
        const totalQuizzes = quizzesData ? quizzesData.length : 0;
        const totalDuration = `${totalLessons + totalQuizzes} hours`;
        
        // Generate syllabus from lessons and quizzes data
        const syllabus: SyllabusSection[] = [
          {
            title: "Course Content",
            items: lessonsData || [],
            type: "lessons",
            duration: `${totalLessons} hours`
          }
        ];
        
        // Add quizzes as a separate section if there are any
        if (quizzesData && quizzesData.length > 0) {
          syllabus.push({
            title: "Quizzes",
            items: quizzesData || [],
            type: "quizzes",
            duration: `${totalQuizzes} quizzes`
          });
        }
        
        // Format course data
        const formattedCourse = {
          ...courseData,
          instructor: courseData.teacher ? courseData.teacher.name : "Unknown Instructor",
          instructorTitle: "Instructor",
          instructorBio: "Experienced instructor with passion for teaching.",
          instructorImage: courseData.teacher?.avatar_url || "https://via.placeholder.com/150", 
          studentsCount: enrollmentsData?.length || 0,
          lessonsCount: totalLessons,
          quizzesCount: totalQuizzes,
          duration: totalDuration,
          lastUpdated: new Date(courseData.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
          level: "Beginner",
          category: "Development",
          price: courseData.price || 0,
          syllabus: syllabus,
          features: [
            "24/7 access to all course materials",
            "Hands-on exercises and projects",
            "Certificate upon completion",
            "Lifetime access to course updates",
            "Access to student community forum"
          ],
          imageSrc: courseData.thumbnail_url || "https://via.placeholder.com/800x400"
        };
        
        setCourse(formattedCourse);
      } catch (err) {
        console.error("Error:", err);
        setError("An error occurred while loading the course");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCourseAndEnrollmentStatus();
  }, [id]);
  
  const handleEnroll = async () => {
    // Check if user is logged in
    if (!user) {
      toast.error("Please log in to enroll in this course");
      navigate("/login");
      return;
    }
    
    try {
      setIsEnrolling(true);
      
      // Check if already enrolled
    if (isEnrolled) {
      navigate("/dashboard");
      return;
    }
      
      // Create enrollment record
      const { error } = await supabase
        .from('enrollments')
        .insert([
          { 
            user_id: user.id, 
            course_id: id,
            progress: 0
          }
        ]);
      
      if (error) {
        throw error;
      }
      
      setIsEnrolled(true);
      toast.success("Successfully enrolled in the course!");
      
      // Redirect to dashboard
      setTimeout(() => {
      navigate("/dashboard");
      }, 2000);
    } catch (err) {
      console.error("Error enrolling:", err);
      toast.error("Failed to enroll in the course. Please try again.");
    } finally {
      setIsEnrolling(false);
    }
  };
  
  const handleItemClick = (itemId: string) => {
    // If clicking the active item, close it
    if (activeItemId === itemId) {
      setActiveItemId(null);
    } else {
      // Otherwise, set this item as active
      setActiveItemId(itemId);
    }
  };
  
  const getYouTubeVideoId = (url: string) => {
    if (!url) return null;
    
    // Regular expression to extract YouTube video ID
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    
    return (match && match[2].length === 11) ? match[2] : null;
  };
  
  // Add a function to handle starting a quiz
  const handleStartQuiz = (quizId: string) => {
    if (isEnrolled) {
      // Navigate to the quiz page
      navigate(`/quiz/${quizId}`);
    } else {
      toast.error("Please enroll in the course to take this quiz");
    }
  };
  
  // Function to handle when a video iframe is rendered
  const handleVideoIframeRef = (lessonId: string) => (iframe: HTMLIFrameElement | null) => {
    if (iframe && isEnrolled) {
      setupVideoTracking(lessonId, iframe);
    }
  };
  
  // Setup video tracking function
  const setupVideoTracking = (lessonId: string, iframe: HTMLIFrameElement) => {
    // Store reference to the iframe
    videoRefs.current[lessonId] = iframe;
    
    // Add load event listener to wait for iframe to be ready
    if (iframe.contentWindow) {
      // If already loaded
      initYouTubePlayer(lessonId, iframe);
    } else {
      // Wait for load
      iframe.onload = () => initYouTubePlayer(lessonId, iframe);
    }
  };
  
  // Initialize YouTube player
  const initYouTubePlayer = (lessonId: string, iframe: HTMLIFrameElement) => {
    // Check if YouTube API is available
    if (window.YT && window.YT.Player) {
      try {
        // YouTube iframe API requires the iframe id
        if (!iframe.id) {
          iframe.id = `youtube-player-${lessonId}`;
        }
        
        new window.YT.Player(iframe.id, {
          events: {
            'onReady': () => {
              playerReadyState.current[lessonId] = true;
              console.log(`Player ready for lesson ${lessonId}`);
            },
            'onStateChange': (event: any) => handlePlayerStateChange(event, lessonId)
          }
        });
      } catch (err) {
        console.error("Error initializing YouTube player:", err);
      }
    } else {
      console.log("YouTube API not yet available");
    }
  };
  
  // Handle player state changes
  const handlePlayerStateChange = (event: any, lessonId: string) => {
    // YT.PlayerState.ENDED = 0
    if (event.data === 0) {
      // Video ended - mark as 100% complete
      updateLessonProgress(lessonId, 100);
    }
    
    // YT.PlayerState.PLAYING = 1
    if (event.data === 1) {
      // Get player instance
      const player = event.target;
      
      // Start progress tracking
      const trackProgress = setInterval(() => {
        // If player is no longer available or not playing, clear interval
        if (!player || player.getPlayerState() !== 1) {
          clearInterval(trackProgress);
          return;
        }
        
        const duration = player.getDuration();
        const currentTime = player.getCurrentTime();
        
        if (duration > 0) {
          const progressPercent = Math.round((currentTime / duration) * 100);
          
          // Update progress less frequently to avoid too many database calls
          // Only update at 25%, 50%, 75%, and 90+%
          const storedProgress = lessonProgress[lessonId] || 0;
          const checkpoints = [25, 50, 75, 90, 100];
          
          // Only update if we've passed a new checkpoint
          const passedCheckpoint = checkpoints.find(cp => progressPercent >= cp && storedProgress < cp);
          if (passedCheckpoint) {
            updateLessonProgress(lessonId, progressPercent);
          }
        }
      }, 5000); // Check every 5 seconds
    }
  };
  
  // Add cleanup on component unmount
  useEffect(() => {
    return () => {
      // Clean up any pending timeouts
      if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current);
      }
    };
  }, []);
  
  if (isLoading) {
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
  
  if (error) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow pt-24 pb-16 flex items-center justify-center">
          <Alert variant="destructive" className="max-w-lg">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </main>
        <Footer />
          </div>
    );
  }
  
  if (!course) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow pt-24 pb-16 flex items-center justify-center">
          <p className="text-muted-foreground">Course not found</p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow pt-24 pb-16">
        {/* Course Hero */}
        <div className="bg-card py-12 border-b">
          <div className="container mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div>
                <div className="mb-4">
                  <span className="inline-block bg-secondary text-xs px-2 py-1 rounded-full mb-2">
                    {course.category}
                  </span>
                  <h1 className="text-3xl md:text-4xl font-bold">{course.title}</h1>
                  <p className="text-muted-foreground mt-4">{course.description}</p>
                </div>
                
                <div className="flex items-center mb-6">
                  <img 
                    src={course.instructorImage} 
                    alt={course.instructor} 
                    className="w-12 h-12 rounded-full mr-4 object-cover"
                  />
                  <div>
                    <p className="font-medium text-brand-purple">{course.instructor}</p>
                    <p className="text-sm text-muted-foreground">{course.instructorTitle}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <div className="flex flex-col items-center">
                    <Users className="text-brand-purple mb-2 h-5 w-5" />
                    <p className="text-sm font-medium">{course.studentsCount} students</p>
                  </div>
                  <div className="flex flex-col items-center">
                    <Book className="text-brand-teal mb-2 h-5 w-5" />
                    <p className="text-sm font-medium">{course.lessonsCount} lessons</p>
                  </div>
                  <div className="flex flex-col items-center">
                    <Clock className="text-brand-purple mb-2 h-5 w-5" />
                    <p className="text-sm font-medium">{course.duration}</p>
                  </div>
                  <div className="flex flex-col items-center">
                    <Award className="text-brand-teal mb-2 h-5 w-5" />
                    <p className="text-sm font-medium">Certificate</p>
                  </div>
                </div>
                
                {isTeacher ? (
                  course.teacher_id === user?.id && (
                    <Button 
                      className="btn-gradient" 
                      onClick={() => navigate(`/edit-course/${id}`)}
                    >
                      Edit Course
                    </Button>
                  )
                ) : (
                <Button 
                  className="btn-gradient" 
                  onClick={handleEnroll}
                  disabled={isEnrolling}
                >
                  {isEnrolling ? "Enrolling..." : isEnrolled ? "Go to Dashboard" : "Enroll Now"}
                </Button>
                )}
              </div>
              <div>
                <div className="rounded-xl overflow-hidden">
                  <img 
                    src={course.imageSrc} 
                    alt={course.title} 
                    className="w-full h-full object-cover object-center"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="container mx-auto px-4 md:px-6 py-12 max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {/* Course Syllabus */}
              <div className="mb-12">
                <h2 className="text-2xl font-bold mb-6">Course Curriculum</h2>
                <div className="space-y-4">
                  {course.syllabus.map((section, index) => (
                    <Card key={index} className="bg-card hover-card">
                      <CardContent className="p-0">
                        <div className="p-4 flex justify-between items-center">
                          <div>
                            <h3 className="font-medium text-lg">{section.title}</h3>
                            <p className="text-sm text-muted-foreground">
                              {section.items.length} {section.type === "quizzes" ? "quizzes" : "lessons"} • {section.duration}
                            </p>
                          </div>
                          <div className="bg-secondary rounded-full h-8 w-8 flex items-center justify-center">
                            <span className="text-xs">{index + 1}</span>
                          </div>
                        </div>
                        <Separator />
                        <div className="p-4">
                          <ul className="space-y-6">
                            {section.items.map((item, idx) => (
                              <li key={idx} className="space-y-4">
                                <div 
                                  className="flex items-center gap-2 text-sm cursor-pointer hover:bg-secondary/20 p-2 rounded-md transition-colors"
                                  onClick={() => handleItemClick(item.id)}
                                >
                                  {activeItemId === item.id ? (
                                    <ChevronDown className={`h-5 w-5 ${section.type === "quizzes" ? "text-brand-teal" : "text-brand-purple"}`} />
                                  ) : (
                                    <ChevronRight className={`h-5 w-5 ${section.type === "quizzes" ? "text-brand-teal" : "text-brand-purple"}`} />
                                  )}
                                  <span className="flex-1 font-medium">{item.title}</span>
                                  
                                  {section.type === "lessons" && item.video_url && (
                                    <Play className="h-4 w-4 text-brand-purple" />
                                  )}
                                  
                                  {section.type === "quizzes" && (
                                    <span className="text-xs bg-brand-teal/20 text-brand-teal px-2 py-1 rounded-full">
                                      Quiz
                                    </span>
                                  )}
                                </div>
                                
                                {/* Display lesson content when active */}
                                {section.type === "lessons" && activeItemId === item.id && (
                                  <div className="mt-3">
                                    {item.video_url && (
                                      <div className="bg-card border rounded-lg overflow-hidden mb-4 shadow-md">
                                        <div className="p-2 bg-secondary/30 border-b flex justify-between items-center">
                                          <h4 className="font-medium text-sm truncate">{item.title}</h4>
                                          {getYouTubeVideoId(item.video_url) && (
                                            <a 
                                              href={`https://www.youtube.com/watch?v=${getYouTubeVideoId(item.video_url)}`} 
                                              target="_blank" 
                                              rel="noopener noreferrer" 
                                              className="text-xs bg-secondary px-2 py-1 rounded flex items-center hover:bg-secondary/80 transition-colors"
                                            >
                                              <span className="hidden sm:inline mr-1">YouTube</span> ↗
                                            </a>
                                          )}
                                        </div>
                                        {getYouTubeVideoId(item.video_url) ? (
                                          <div className="relative">
                                            <iframe
                                              id={`youtube-player-${item.id}`}
                                              width="100%"
                                              height="480"
                                              src={`https://www.youtube.com/embed/${getYouTubeVideoId(item.video_url)}?rel=0&enablejsapi=1`}
                                              title={item.title}
                                              frameBorder="0"
                                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                                              allowFullScreen
                                              className="aspect-video"
                                              ref={handleVideoIframeRef(item.id)}
                                            ></iframe>
                                            {lessonProgress[item.id] > 0 && (
                                              <div className="mt-2 px-3">
                                                <div className="text-xs text-muted-foreground mb-1 flex justify-between">
                                                  <span>Your progress</span>
                                                  <span>{lessonProgress[item.id]}%</span>
                                                </div>
                                                <div className="w-full bg-secondary/50 rounded-full h-1.5">
                                                  <div 
                                                    className="bg-brand-purple h-1.5 rounded-full transition-all" 
                                                    style={{ width: `${lessonProgress[item.id]}%` }}
                                                  ></div>
                                                </div>
                                                {lessonProgress[item.id] >= 90 && (
                                                  <div className="text-xs text-green-600 mt-1 flex items-center gap-1">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                                      <polyline points="22 4 12 14.01 9 11.01"></polyline>
                                                    </svg>
                                                    Completed
                                                  </div>
                                                )}
                                              </div>
                                            )}
                                          </div>
                                        ) : (
                                          <div className="p-3 bg-secondary/10 rounded-md text-sm">
                                            <a href={item.video_url} target="_blank" rel="noopener noreferrer" className="text-brand-purple hover:underline flex items-center">
                                              <Play className="h-4 w-4 mr-2" /> Watch video
                                            </a>
                                          </div>
                                        )}
                                        {getYouTubeVideoId(item.video_url) && (
                                          <div className="p-2 border-t bg-secondary/10 flex justify-end">
                                            <a 
                                              href={`https://www.y2mate.com/youtube/${getYouTubeVideoId(item.video_url)}`}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="text-xs text-brand-purple flex items-center gap-1 hover:underline"
                                            >
                                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3">
                                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                                <polyline points="7 10 12 15 17 10"></polyline>
                                                <line x1="12" y1="15" x2="12" y2="3"></line>
                                              </svg>
                                              Download this video
                                            </a>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                    
                                    {item.content_url && (
                                      <div className="mt-3 p-3 bg-secondary/10 rounded-md text-sm">
                                        <p className="text-muted-foreground whitespace-pre-line">
                                          {item.content_url}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                )}
                                
                                {/* Display quiz content when active */}
                                {section.type === "quizzes" && activeItemId === item.id && (
                                  <div className="pl-6">
                                    <div className="p-3 bg-secondary/10 rounded-md text-sm">
                                      <p className="font-medium mb-2">
                                        {item.questions ? 
                                          `${Array.isArray(item.questions) ? item.questions.length : 0} questions` 
                                          : "No questions available"}
                                      </p>
                                      
                                      {/* Show previous quiz results if available */}
                                      {quizResults[item.id] && quizResults[item.id].length > 0 && (
                                        <div className="mb-3">
                                          <p className="font-medium text-brand-teal mb-1">
                                            Your Quiz Attempts:
                                          </p>
                                          <div className="space-y-2">
                                            {quizResults[item.id].map((result, idx) => (
                                              <div 
                                                key={idx} 
                                                className={`p-2 rounded-md flex justify-between ${
                                                  result.score === 100 
                                                    ? "bg-green-500/20 border border-green-500" 
                                                    : "bg-brand-teal/10"
                                                }`}
                                              >
                                                <div>
                                                  <span className="font-medium">
                                                    Attempt {idx + 1}
                                                    {result.score === 100 && " ★"}
                                                  </span>
                                                  <span className="text-xs text-muted-foreground ml-2">
                                                    {result.formattedDate} at {result.formattedTime}
                                                  </span>
                                                </div>
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                                  result.score === 100 ? "bg-green-500 text-white" :
                                                  result.score >= 80 ? "bg-green-500/20 text-green-600" :
                                                  result.score >= 60 ? "bg-amber-500/20 text-amber-600" :
                                                  "bg-red-500/20 text-red-600"
                                                }`}>
                                                  {result.score}%
                                                </span>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                      
                                      {isEnrolled ? (
                                        <Button 
                                          size="sm" 
                                          className="bg-brand-teal hover:bg-brand-teal/90 text-white"
                                          onClick={() => handleStartQuiz(item.id)}
                                        >
                                          {quizResults[item.id] ? "Retake Quiz" : "Start Quiz"}
                                        </Button>
                                      ) : (
                                        <p className="text-muted-foreground">Enroll in the course to take this quiz</p>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
              
              {/* Instructor Bio */}
              <div>
                <h2 className="text-2xl font-bold mb-6">About the Instructor</h2>
                <Card className="bg-card hover-card">
                  <CardContent className="p-6">
                    <div className="flex items-center mb-4">
                      <img 
                        src={course.instructorImage} 
                        alt={course.instructor} 
                        className="w-16 h-16 rounded-full mr-4 object-cover border-2 border-brand-purple"
                      />
                      <div>
                        <h3 className="font-bold text-lg">{course.instructor}</h3>
                        <p className="text-sm text-muted-foreground">{course.instructorTitle}</p>
                      </div>
                    </div>
                    <p className="text-muted-foreground">
                      {course.instructorBio}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
            
            {/* Sidebar */}
            <div>
              <Card className="sticky top-24 bg-card hover-card">
                <CardContent className="p-6">
                  <div className="text-center mb-6">
                    <p className="text-3xl font-bold mb-2">${parseFloat(course.price).toFixed(2)}</p>
                    
                    {isTeacher ? (
                      course.teacher_id === user?.id && (
                        <Button 
                          className="w-full btn-gradient" 
                          onClick={() => navigate(`/edit-course/${id}`)}
                        >
                          Edit Course
                        </Button>
                      )
                    ) : (
                      <Button 
                        className="w-full btn-gradient" 
                        onClick={handleEnroll}
                        disabled={isEnrolling}
                      >
                        {isEnrolling ? "Enrolling..." : isEnrolled ? "Go to Dashboard" : "Enroll Now"}
                      </Button>
                    )}
                  </div>
                  
                  <div className="mt-6">
                    <h3 className="font-bold mb-4">This course includes:</h3>
                  <ul className="space-y-3">
                      {course.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center">
                          <Check className="h-4 w-4 text-brand-teal mr-2 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  </div>
                  
                  <div className="mt-6 text-center">
                    <p className="text-xs text-muted-foreground">
                      Last updated: {course.lastUpdated}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CourseDetail;
