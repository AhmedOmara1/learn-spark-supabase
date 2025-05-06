import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";
import { AlertCircle, Bell } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Define simpler types with optional properties to avoid errors
interface CourseData {
  course: {
    title: string;
    level: string;
    total_lessons: number;
    progress: number;
  } | null;
  lessons: Array<{
    id: string;
    title: string;
    status: 'completed' | 'in_progress' | 'upcoming';
  }>;
}

const WELCOME_STORAGE_KEY = 'smartlearn_welcome_shown';
const LOGIN_TIMESTAMP_KEY = 'smartlearn_login_timestamp';
const WELCOME_TIMEOUT_MS = 1000 * 60 * 60; // 1 hour timeout for welcome message
const SESSION_LOGIN_KEY = 'smartlearn_just_logged_in'; // New key to track fresh logins

const Hero = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [courseData, setCourseData] = useState<CourseData>({
    course: null,
    lessons: []
  });
  const [showWelcome, setShowWelcome] = useState(false);
  const [userName, setUserName] = useState("");

  // Show welcome notification if user is logged in
  const showWelcomeNotification = () => {
    // Only show welcome message if we have a fresh login
    const justLoggedIn = sessionStorage.getItem(SESSION_LOGIN_KEY) === 'true';
    
    if (justLoggedIn) {
      setShowWelcome(true);
      // Create timeout to hide welcome message
      setTimeout(() => {
        setShowWelcome(false);
      }, 8000);
      
      // Clear the login flag so it doesn't show again on refresh
      sessionStorage.removeItem(SESSION_LOGIN_KEY);
    }
  };

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session?.user) {
        setUser(data.session.user);
        fetchUserName(data.session.user.id);
        fetchUserCourseData(data.session.user.id);
      } else {
        setUser(null);
      }
      setLoading(false);
      
      // Check if we need to show welcome message
      showWelcomeNotification();
    };

    getUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth event:", event);
      if (event === 'SIGNED_IN') {
        setUser(session?.user || null);
        if (session?.user) {
          fetchUserName(session.user.id);
          
          // Set the just logged in flag in session storage
          sessionStorage.setItem(SESSION_LOGIN_KEY, 'true');
          
          // Show welcome message for fresh login
          setShowWelcome(true);
          setTimeout(() => {
            setShowWelcome(false);
          }, 8000);
          
          toast.success("Successfully signed in!");
          fetchUserCourseData(session.user.id);
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setShowWelcome(false);
        // Clear session storage
        sessionStorage.removeItem(SESSION_LOGIN_KEY);
      } else {
        setUser(session?.user || null);
        if (session?.user) {
          fetchUserCourseData(session.user.id);
        }
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const fetchUserName = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('name, email')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('Error fetching user data:', error);
        // Fallback to email from auth
        setUserName(user?.email || "there");
        return;
      }
      
      // Use name if available, otherwise use email
      setUserName(data?.name || data?.email || user?.email || "there");
    } catch (error) {
      console.error('Error in fetchUserName:', error);
      setUserName(user?.email || "there");
    }
  };

  const fetchUserCourseData = async (userId: string) => {
    try {
      // Fetch the user's most recent enrollment with course details
      const { data: enrollments, error: enrollmentsError } = await supabase
        .from('enrollments')
        .select(`
          *,
          courses:course_id (*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (enrollmentsError || !enrollments || enrollments.length === 0) {
        console.error('Error fetching enrollments:', enrollmentsError);
        return;
      }
      
      const enrollment = enrollments[0];
      
      // Make sure the courses object exists and has expected properties
      if (!enrollment.courses || typeof enrollment.courses !== 'object') {
        console.error('Invalid course data in enrollment');
        return;
      }
      
      // Extract course information
      const courseInfo = {
        title: enrollment.courses.title || 'Untitled Course',
        level: 'Intermediate', // Hardcoded since it's not in the database
        total_lessons: 0, // Will count from lessons data
        progress: enrollment.progress || 0
      };
      
      // Fetch lessons for this course
      const { data: lessons, error: lessonsError } = await supabase
        .from('lessons')
        .select('id, title, order_index, content_url')
        .eq('course_id', enrollment.course_id)
        .order('order_index', { ascending: true });
      
      if (lessonsError) {
        console.error('Error fetching lessons:', lessonsError);
        return;
      }
      
      // Update total lessons count
      if (lessons) {
        courseInfo.total_lessons = lessons.length;
      }
      
      // Format lessons with status
      const formattedLessons = lessons ? lessons.map((lesson, index) => {
        // Determine lesson status based on progress
        let status: 'completed' | 'in_progress' | 'upcoming' = 'upcoming';
        const progress = enrollment.progress || 0;
        
        if (lessons.length > 0) {
          if (index === 0 && progress === 0) {
            status = 'in_progress';
          } else if ((index / lessons.length) * 100 <= progress) {
            status = 'completed';
          } else if ((index - 1) / lessons.length * 100 <= progress) {
            status = 'in_progress';
          }
        }
        
        return {
          id: lesson.id,
          title: lesson.title,
          status
        };
      }) : [];
      
      // Update state with the course data
      setCourseData({
        course: courseInfo,
        lessons: formattedLessons
      });
      
    } catch (error) {
      console.error('Error fetching course data:', error);
    }
  };

  const handleSignUpAction = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/register');
    }
  };
  
  return (
    <div className="relative pt-28 pb-20 lg:pt-36 lg:pb-28 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-hero-pattern opacity-20"></div>
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-brand-purple/20 rounded-full blur-3xl"></div>
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-brand-teal/20 rounded-full blur-3xl"></div>

      {/* Welcome Alert */}
      {showWelcome && user && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md">
          <Alert className="bg-brand-purple/90 text-white border-brand-teal animate-fade-in">
            <Bell className="h-4 w-4" />
            <AlertTitle className="font-bold">Welcome back, {userName}!</AlertTitle>
            <AlertDescription>
              You are now signed in. Continue your learning journey.
            </AlertDescription>
          </Alert>
        </div>
      )}

      <div className="container mx-auto px-6 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          <div className="flex-1 text-center lg:text-left">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
              <span className="text-white">Learn Anything,</span>
              <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand-purple to-brand-teal">
                Anywhere, Anytime
              </span>
            </h1>
            <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-xl mx-auto lg:mx-0">
              An intelligent online platform designed to enhance your learning journey
              with interactive courses, progress tracking, and personalized feedback.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link to="/courses">
                <Button size="lg" className="btn-gradient">
                  Browse Courses
                </Button>
              </Link>
              <Button size="lg" variant="outline" onClick={handleSignUpAction}>
                {user ? "Go to Dashboard" : "Sign Up Free"}
              </Button>
            </div>
          </div>

          <div className="flex-1 w-full max-w-lg">
            <div className="relative">
              <div className="absolute inset-0 bg-brand-purple/30 blur-2xl rounded-full"></div>
              <div className="relative glass-card rounded-2xl overflow-hidden border border-white/10">
                <div className="p-1 bg-gradient-to-br from-brand-purple/20 to-brand-teal/20 rounded-2xl">
                  <div className="bg-card rounded-xl p-6">
                    {user && courseData.course ? (
                      <>
                        {/* User welcome banner */}
                        <div className="mb-4 p-3 bg-brand-purple/10 rounded-lg border border-brand-purple/20">
                          <p className="text-sm font-medium text-white">
                            Welcome back, {userName}! 👋
                          </p>
                        </div>
                        
                        <div className="flex items-center justify-between mb-6">
                          <div>
                            <h3 className="text-lg font-semibold">{courseData.course.title}</h3>
                            <p className="text-sm text-muted-foreground">
                              {courseData.course.level} • {courseData.course.total_lessons} lessons
                            </p>
                          </div>
                          <div className="h-10 w-10 rounded-full bg-brand-purple/20 flex items-center justify-center">
                            <span className="text-brand-purple">{courseData.course.progress}%</span>
                          </div>
                        </div>
                        <div className="space-y-4">
                          {courseData.lessons.slice(0, 3).map((lesson, index) => (
                            <div key={lesson.id} className="bg-secondary h-14 rounded-md flex items-center px-4 gap-3">
                              <div className={`h-6 w-6 rounded-full flex items-center justify-center ${
                                lesson.status === 'completed' ? 'bg-brand-purple/30' : 
                                lesson.status === 'in_progress' ? 'bg-brand-teal/30' : 
                                'bg-secondary'
                              }`}>
                                {lesson.status === 'completed' && (
                                  <svg className="h-3 w-3 text-brand-purple" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
                                  </svg>
                                )}
                                {lesson.status === 'in_progress' && (
                                  <svg className="h-3 w-3 text-brand-teal" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clipRule="evenodd" />
                                  </svg>
                                )}
                                {lesson.status === 'upcoming' && (
                                  <span className="text-xs text-muted-foreground">{index + 1}</span>
                                )}
                              </div>
                              <div>
                                <p className="text-sm font-medium">{lesson.title}</p>
                                <p className="text-xs text-muted-foreground">
                                  {lesson.status === 'completed' ? 'Completed' : 
                                   lesson.status === 'in_progress' ? 'In Progress' : 
                                   'Coming up'}
                                </p>
                              </div>
                            </div>
                          ))}
                          {courseData.lessons.length === 0 && (
                            <div className="text-sm text-muted-foreground text-center py-4">
                              No lessons available yet
                            </div>
                          )}
                        </div>
                      </>
                    ) : (
                      // Replace the mock data with an image and clean content for non-logged in users
                      <div className="text-center py-6">
                        <div className="flex justify-center mb-6">
                          <svg width="120" height="120" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-brand-purple">
                            <path d="M12 6.25278V19.2528M12 6.25278C10.8321 5.47686 9.24649 5 7.5 5C5.75351 5 4.16789 5.47686 3 6.25278V19.2528C4.16789 18.4769 5.75351 18 7.5 18C9.24649 18 10.8321 18.4769 12 19.2528M12 6.25278C13.1679 5.47686 14.7535 5 16.5 5C18.2465 5 19.8321 5.47686 21 6.25278V19.2528C19.8321 18.4769 18.2465 18 16.5 18C14.7535 18 13.1679 18.4769 12 19.2528" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                        <h3 className="text-xl font-bold mb-2">Start Learning Today</h3>
                        <p className="text-muted-foreground mb-6">
                          Sign in to access your courses and track your progress
                        </p>
                        <Button onClick={handleSignUpAction} className="btn-gradient w-full">
                          {user ? "Go to Dashboard" : "Sign Up Free"}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div className="p-6 rounded-xl bg-gradient-to-br from-brand-purple/10 to-transparent border border-brand-purple/20">
            <div className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-full bg-brand-purple/20">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg" className="text-brand-purple">
                <path d="M12 6.25278V19.2528M12 6.25278C10.8321 5.47686 9.24649 5 7.5 5C5.75351 5 4.16789 5.47686 3 6.25278V19.2528C4.16789 18.4769 5.75351 18 7.5 18C9.24649 18 10.8321 18.4769 12 19.2528M12 6.25278C13.1679 5.47686 14.7535 5 16.5 5C18.2465 5 19.8321 5.47686 21 6.25278V19.2528C19.8321 18.4769 18.2465 18 16.5 18C14.7535 18 13.1679 18.4769 12 19.2528" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Interactive Courses</h3>
            <p className="text-muted-foreground">Engaging content with hands-on exercises and interactive lessons designed for effective learning</p>
          </div>
          
          <div className="p-6 rounded-xl bg-gradient-to-br from-brand-teal/10 to-transparent border border-brand-teal/20">
            <div className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-full bg-brand-teal/20">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg" className="text-brand-teal">
                <path d="M9.31 18L2.39 11.08C1.87 10.56 1.87 9.72 2.39 9.19L9.31 2.27C9.83 1.75 10.67 1.75 11.19 2.27L18.11 9.19C18.63 9.71 18.63 10.55 18.11 11.07L11.19 17.99C10.67 18.51 9.83 18.51 9.31 17.99V18Z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M7 11L11 7L17 13L13 17L7 11Z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M8 14H16V22H8V14Z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">AI-Powered Learning</h3>
            <p className="text-muted-foreground">Advanced algorithms that adapt to your learning style and pace for a personalized experience</p>
          </div>
          
          <div className="p-6 rounded-xl bg-gradient-to-br from-brand-purple/10 to-transparent border border-brand-purple/20">
            <div className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-full bg-brand-purple/20">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg" className="text-brand-purple">
                <path d="M17 20H7C4.79086 20 3 18.2091 3 16V8C3 5.79086 4.79086 4 7 4H17C19.2091 4 21 5.79086 21 8V16C21 18.2091 19.2091 20 17 20Z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 14C13.1046 14 14 13.1046 14 12C14 10.8954 13.1046 10 12 10C10.8954 10 10 10.8954 10 12C10 13.1046 10.8954 14 12 14Z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 8V10" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 14V16" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M16 12H14" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M10 12H8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Community Support</h3>
            <p className="text-muted-foreground">Connect with peers and mentors to collaborate, share insights, and enhance your learning experience</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
