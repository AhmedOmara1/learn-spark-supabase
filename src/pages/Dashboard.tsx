import React, { useState, useEffect, useMemo, useCallback } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Book, GraduationCap, User, Settings, CheckCircle, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";
import { useNavigate } from "react-router-dom";
import TeacherDashboard from "./TeacherDashboard";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

// Define default state values to avoid reinitializing objects on each render
const defaultUserData = {
  id: "",
    name: "",
    email: "",
    role: "student",
    joined: "",
    avatarUrl: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=687&q=80"
};

const defaultAchievements = [
  { title: "First Course Completed", description: "Complete your first course", achieved: false, icon: "🏆" },
  { title: "Fast Learner", description: "Complete 5 lessons in a day", achieved: false, icon: "⚡" },
    { title: "Knowledge Seeker", description: "Enroll in 3 different courses", achieved: false, icon: "🔍" },
    { title: "Perfect Quiz", description: "Score 100% on any quiz", achieved: false, icon: "🎯" }
  ];

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("courses");
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(defaultUserData);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [isTeacher, setIsTeacher] = useState(false);
  const [recentActivities, setRecentActivities] = useState([]);
  const [quizResults, setQuizResults] = useState([]);
  const [achievements, setAchievements] = useState(defaultAchievements);
  const [learningGoals, setLearningGoals] = useState([]);
  const [isEditingGoals, setIsEditingGoals] = useState(false);
  const navigate = useNavigate();

  // Move data processing to a separate function to keep the effect cleaner
  const processEnrollmentData = useCallback((userEnrollments, profile, user, currentQuizResults = []) => {
    // We'll derive activities from enrollments rather than querying a separate table
    if (userEnrollments && userEnrollments.length > 0) {
      // Create activity entries from enrollments data
      const derivedActivities = [];
      
      // Generate activities from enrollment data
      userEnrollments.forEach((enrollment, index) => {
        const courseTitle = enrollment.courses?.title || 'Unknown Course';
        const enrollmentDate = new Date(enrollment.created_at);
        
        // Add enrollment activity
        derivedActivities.push({
          type: 'course_enrolled',
          course: courseTitle,
          item: null,
          time: formatRelativeTime(enrollmentDate),
          score: null
        });
        
        // If the course has progress, add a completed lesson activity
        if (enrollment.progress > 0) {
          // Create a lesson completion activity that happened after enrollment
          const lessonDate = new Date(enrollmentDate);
          lessonDate.setDate(lessonDate.getDate() + 1); // One day after enrollment
          
          derivedActivities.push({
            type: 'lesson_completed',
            course: courseTitle,
            item: `${courseTitle} Introduction`,
            time: formatRelativeTime(lessonDate),
            score: null
          });
          
          // For some courses, add quiz completion
          if (index % 2 === 0) {
            const quizDate = new Date(lessonDate);
            quizDate.setDate(quizDate.getDate() + 2); // Two days after lesson
            
            // Find a matching quiz result if available from passed quiz results
            const matchingQuizResult = currentQuizResults.find(result => 
              result.courseId === enrollment.course_id
            );
            
            // If there's a matching quiz, use its actual date
            const quizTimestamp = matchingQuizResult 
              ? new Date(matchingQuizResult.created_at)
              : quizDate;
            
            derivedActivities.push({
              type: 'quiz_completed',
              course: courseTitle,
              item: `${courseTitle} Basics Quiz`,
              time: formatRelativeTime(quizTimestamp),
              score: matchingQuizResult ? `${matchingQuizResult.score}%` : '85%'
            });
          }
        }
      });
      
      // Add any recent quiz results that might not be associated with enrolled courses
      currentQuizResults.forEach(result => {
        // Check if we already have this quiz in the activities
        const existingActivity = derivedActivities.find(activity => 
          activity.type === 'quiz_completed' && 
          activity.course === result.courseTitle &&
          activity.item?.includes(result.quizTitle)
        );
        
        // If not already in activities, add it
        if (!existingActivity) {
          derivedActivities.push({
            type: 'quiz_completed',
            course: result.courseTitle,
            item: result.quizTitle,
            time: formatRelativeTime(new Date(result.created_at)),
            score: `${result.score}%`
          });
        }
      });
      
      // Sort activities by time (most recent first)
      derivedActivities.sort((a, b) => {
        const dateA = getDateFromTimeString(a.time);
        const dateB = getDateFromTimeString(b.time);
        return dateA > dateB ? -1 : dateA < dateB ? 1 : 0;
      });
      
      // Limit to 5 most recent activities
      setRecentActivities(derivedActivities.slice(0, 5));

      // Calculate achievements based on enrollments and activities
      const updatedAchievements = [...defaultAchievements];
      
      // Check "Knowledge Seeker" achievement - enroll in 3 different courses
      if (userEnrollments.length >= 3) {
        const knowledgeSeekerIndex = updatedAchievements.findIndex(a => a.title === "Knowledge Seeker");
        if (knowledgeSeekerIndex !== -1) {
          updatedAchievements[knowledgeSeekerIndex].achieved = true;
        }
      }
      
      // Check for completed courses for "First Course Completed" achievement
      const completedCourses = userEnrollments.filter(enrollment => enrollment.progress >= 100);
      if (completedCourses.length > 0) {
        const firstCourseIndex = updatedAchievements.findIndex(a => a.title === "First Course Completed");
        if (firstCourseIndex !== -1) {
          updatedAchievements[firstCourseIndex].achieved = true;
        }
      }
      
      // Check "Fast Learner" based on recent enrollments
      const recentEnrollments = userEnrollments.filter(enrollment => {
        const enrollDate = new Date(enrollment.created_at);
        const now = new Date();
        const daysDiff = Math.floor((now.getTime() - enrollDate.getTime()) / (1000 * 60 * 60 * 24));
        return daysDiff < 7; // Enrolled in the last week
      });
      
      if (recentEnrollments.length >= 2) {
        const fastLearnerIndex = updatedAchievements.findIndex(a => a.title === "Fast Learner");
        if (fastLearnerIndex !== -1) {
          updatedAchievements[fastLearnerIndex].achieved = true;
        }
      }
      
      // "Perfect Quiz" achievement - check for 100% quiz scores
      const perfectQuiz = currentQuizResults.some(result => result.score === 100);
      if (perfectQuiz) {
        const perfectQuizIndex = updatedAchievements.findIndex(a => a.title === "Perfect Quiz");
        if (perfectQuizIndex !== -1) {
          updatedAchievements[perfectQuizIndex].achieved = true;
        }
      }
      
      setAchievements(updatedAchievements);
    }

    // Format enrolled courses data
    const formattedCourses = userEnrollments?.map(enrollment => ({
      id: enrollment.course_id,
      title: enrollment.courses?.title || "Untitled Course",
      progress: enrollment.progress || 0,
      lastAccessed: "Recently", // This would be replaced with actual data when available
      nextLesson: "Next lesson", // This would be replaced with actual data when available
      instructor: "Instructor", // This would be replaced with actual data when available
      imageSrc: enrollment.courses?.thumbnail_url || "https://images.unsplash.com/photo-1498050108023-c5249f4df085?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1172&q=80"
    })) || [];

    // Format joined date
    const joinedDate = profile?.created_at 
      ? new Date(profile.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
      : "Recently";

    // Update state with user data
    setUserData({
      id: user.id,
      name: profile?.name || user.email?.split('@')[0] || "Student",
      email: user.email || "",
      role: profile?.role || "student",
      joined: joinedDate,
      avatarUrl: profile?.avatar_url || "https://images.unsplash.com/photo-1599566150163-29194dcaad36?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=687&q=80"
    });
    
    setEnrolledCourses(formattedCourses);
  }, []);

  // Check user role first - separate this from the data fetching for better performance
  useEffect(() => {
    let isMounted = true;
    
    // Force exit loading state after a timeout
    const loadingTimeout = setTimeout(() => {
      if (loading && isMounted) {
        console.log("Dashboard loading timed out - forcing exit from loading state");
        setLoading(false);
        toast.error("Had trouble loading some data. Please refresh if information is missing.");
      }
    }, 8000); // Increase timeout to 8 seconds
    
    // First check the authentication state - this is critical
    const checkAuthAndInitialize = async () => {
      try {
        // First check if user is authenticated
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("Auth session error:", sessionError);
          if (isMounted) {
            toast.error("Authentication error. Please log in again.");
            navigate("/login");
          }
          return;
        }
        
        if (!session || !session.user) {
          // Redirect to login if no session
          if (isMounted) {
            console.log("No active session, redirecting to login");
            navigate("/login");
          }
          return;
        }
        
        // Get user's role first - this is more lightweight
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('role')
          .eq('id', session.user.id)
          .single();
          
        // Set the teacher flag based on role
        if (!profileError && profile) {
          const isUserTeacher = profile.role === 'teacher';
          if (isMounted) {
            setIsTeacher(isUserTeacher);
            
            // If teacher, redirect to teacher dashboard
            if (isUserTeacher) {
              setLoading(false);
              return;
            }
          }
        } else if (profileError && profileError.code === "PGRST116") {
          // Profile doesn't exist, create one
          try {
            await supabase.from('users').insert([{
              id: session.user.id,
              name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || "",
              email: session.user.email || "",
              role: "student",
              avatar_url: `https://api.dicebear.com/6.x/initials/svg?seed=${session.user.email?.split('@')[0] || "User"}`
            }]);
          } catch (createError) {
            console.error("Error creating user profile:", createError);
          }
        }
        
        // Now proceed with the main data fetch
        if (isMounted) {
          fetchUserData(session.user);
        }
      } catch (error) {
        console.error("Authentication check error:", error);
        if (isMounted) {
          setLoading(false);
          toast.error("Authentication service error. Please try again.");
        }
      }
    };
    
    const fetchUserData = async (user) => {
      // Skip fetching data if user isn't available
      if (!user) {
        if (isMounted) setLoading(false);
        return;
      }

      try {
        if (isMounted) setLoading(true);
        
        // Get user profile data with caching
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (profileError) {
          console.error("Error fetching profile:", profileError);
          
          // If error is server-related, handle it more gracefully
          if (profileError.code?.startsWith('PGRST')) {
            if (isMounted) toast.error("Database connection issue. Using limited functionality.");
            
            // Set minimal user data so interface is still usable
            setUserData({
              id: user.id,
              name: user.email?.split('@')[0] || "User",
              email: user.email || "",
              role: "student",
              joined: "Recently",
              avatarUrl: defaultUserData.avatarUrl
            });
            
            setLoading(false);
            return;
          }
          
          if (isMounted) toast.error("Failed to load user profile");
        }

        // Use error-handling parallel requests
        let userEnrollments = [];
        let quizResultsData = [];
        
        try {
          // Use parallel requests to improve loading time
          const [enrollmentsResponse, quizResultsResponse] = await Promise.all([
        // Get user enrollments with course details
            supabase
          .from('enrollments')
          .select(`
            *,
            courses:course_id (*)
          `)
              .eq('user_id', user.id),
              
            // Fetch quiz results
            supabase
              .from('results')
              .select(`
                *,
                quizzes:quiz_id (title, course_id)
              `)
              .eq('user_id', user.id)
              .order('created_at', { ascending: false })
          ]);

          const { data: enrollmentsData, error: enrollmentsError } = enrollmentsResponse;
          const { data: quizData, error: quizResultsError } = quizResultsResponse;

        if (enrollmentsError) {
          console.error("Error fetching enrollments:", enrollmentsError);
            if (isMounted) toast.error("Failed to load enrolled courses");
          } else {
            userEnrollments = enrollmentsData || [];
          }
          
          if (quizResultsError) {
            console.error("Error fetching quiz results:", quizResultsError);
          } else {
            quizResultsData = quizData || [];
          }
        } catch (fetchError) {
          console.error("Network error during data fetch:", fetchError);
          if (isMounted) toast.error("Network issue encountered. Some data may be missing.");
        }
        
        // Process quiz results if available
        if (quizResultsData.length > 0 && isMounted) {
          // Format quiz results and group by quiz_id to identify multiple attempts
          const quizAttemptsMap = new Map();
          
          quizResultsData.forEach(result => {
            // Find course title from enrollments
            const course = userEnrollments?.find(enrollment => 
              enrollment.course_id === result.quizzes?.course_id
            )?.courses;
            
            // Get date in human readable format
            const attemptDate = new Date(result.created_at);
            const formattedDate = attemptDate.toLocaleDateString('en-US', { 
              year: 'numeric', month: 'short', day: 'numeric' 
            });
            const formattedTime = attemptDate.toLocaleTimeString('en-US', {
              hour: '2-digit', minute: '2-digit'
            });
            
            // Add attempt to the map
            if (!quizAttemptsMap.has(result.quiz_id)) {
              quizAttemptsMap.set(result.quiz_id, []);
            }
            
            quizAttemptsMap.get(result.quiz_id).push({
              id: result.id,
              quizId: result.quiz_id,
              quizTitle: result.quizzes?.title || "Untitled Quiz",
              courseId: result.quizzes?.course_id,
              courseTitle: course?.title || "Unknown Course",
              score: result.score,
              date: formattedDate,
              time: formattedTime,
              answers: result.answers,
              created_at: result.created_at
            });
          });
          
          // Convert map to array and add attempt numbers
          const formattedResults = [];
          quizAttemptsMap.forEach(attempts => {
            // Sort attempts by date (newest first)
            attempts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            
            // Add attempt number
            attempts.forEach((attempt, index) => {
              formattedResults.push({
                ...attempt,
                attemptNumber: attempts.length - index,
                totalAttempts: attempts.length
              });
            });
          });
          
          setQuizResults(formattedResults);
        } else if (isMounted) {
          // Set empty quiz results to avoid undefined
          setQuizResults([]);
        }

        // Process the data only if the component is still mounted
        if (isMounted && userEnrollments.length > 0) {
          // Process and update remaining state
          processEnrollmentData(userEnrollments, profile, user, quizResultsData);
        } else if (isMounted) {
          // Handle case where there are no enrollments
          setEnrolledCourses([]);
          setRecentActivities([]);
          
          if (profile) {
            // Still update user data even if no enrollments
        const joinedDate = profile?.created_at 
          ? new Date(profile.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
          : "Recently";

        setUserData({
              id: user.id,
          name: profile?.name || user.email?.split('@')[0] || "Student",
          email: user.email || "",
          role: profile?.role || "student",
          joined: joinedDate,
              avatarUrl: profile?.avatar_url || defaultUserData.avatarUrl
        });
          }
        }
      } catch (error) {
        console.error("Error:", error);
        if (isMounted) {
        toast.error("Failed to load dashboard data");
          // Reset states to ensure UI is usable even after error
          setEnrolledCourses([]);
          setRecentActivities([]);
        }
      } finally {
        if (isMounted) setLoading(false);
        clearTimeout(loadingTimeout);
      }
    };

    // Start the authentication and initialization process
    checkAuthAndInitialize();
    
    return () => {
      isMounted = false;
      clearTimeout(loadingTimeout);
    };
  }, [navigate, processEnrollmentData]);

  // Effect to update activities when quiz results change
  useEffect(() => {
    // Update activities when we have quiz results but no activities or on quiz results change
    if (quizResults.length > 0 && !loading) {
      // Get current user
      const fetchCurrentUserData = async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;
          
          // Get profile and enrollments
          const [profileResponse, enrollmentsResponse] = await Promise.all([
            supabase.from('users').select('*').eq('id', user.id).single(),
            supabase.from('enrollments')
              .select(`*, courses:course_id (*)`)
              .eq('user_id', user.id)
          ]);
          
          if (enrollmentsResponse.error) {
            console.error("Error fetching enrollments:", enrollmentsResponse.error);
            return;
          }
          
          // Regenerate activities with new quiz results
          processEnrollmentData(
            enrollmentsResponse.data, 
            profileResponse.data, 
            user,
            quizResults
          );
        } catch (error) {
          console.error("Error updating activities:", error);
        }
      };
      
      fetchCurrentUserData();
    }
  }, [quizResults.length, loading, processEnrollmentData]);

  // Fetch user's learning goals
  useEffect(() => {
    const fetchLearningGoals = async () => {
      if (isTeacher) return;
      
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        
        const { data, error } = await supabase
          .from('learning_goals')
          .select('*')
          .eq('user_id', user.id)
          .order('display_order', { ascending: true });
          
        if (error) {
          console.error("Error fetching learning goals:", error);
          // If the table doesn't exist yet, use default goals
          if (error.code === "42P01") { // table doesn't exist
            setLearningGoals([
              { id: "1", title: "Complete ReactJS Course", progress: 60, target: 100, display_order: 1 },
              { id: "2", title: "Finish Frontend Bootcamp", progress: 25, target: 100, display_order: 2 },
              { id: "3", title: "Build Portfolio Project", progress: 10, target: 100, display_order: 3 },
            ]);
          }
          return;
        }
        
        if (data && data.length > 0) {
          setLearningGoals(data);
        } else {
          // Set default goals if none exist
          setLearningGoals([
            { id: "1", title: "Complete ReactJS Course", progress: 60, target: 100, display_order: 1 },
            { id: "2", title: "Finish Frontend Bootcamp", progress: 25, target: 100, display_order: 2 },
            { id: "3", title: "Build Portfolio Project", progress: 10, target: 100, display_order: 3 },
          ]);
        }
      } catch (error) {
        console.error("Error in fetchLearningGoals:", error);
      }
    };
    
    fetchLearningGoals();
  }, [isTeacher]);
  
  // Handle goal progress update
  const handleGoalProgressChange = (id, newProgress) => {
    // Update local state
    setLearningGoals(prevGoals => 
      prevGoals.map(goal => 
        goal.id === id ? { ...goal, progress: newProgress } : goal
      )
    );
  };
  
  // Save updated goals to database
  const saveGoals = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in to update goals");
        return;
      }
      
      // Try to determine if learning_goals table exists
      const { error: checkError } = await supabase
        .from('learning_goals')
        .select('id')
        .limit(1);
        
      if (checkError && checkError.code === "42P01") {
        // Table doesn't exist, show message to run migration
        toast.error("Learning goals database not set up. Please run the migrations first.");
        setIsEditingGoals(false);
        return;
      }
      
      // First try to update existing goals
      for (const goal of learningGoals) {
        if (goal.id && !goal.id.startsWith("temp_")) {
          const { error } = await supabase
            .from('learning_goals')
            .update({ 
              title: goal.title,
              progress: goal.progress,
              target: goal.target,
              display_order: goal.display_order
            })
            .eq('id', goal.id);
            
          if (error) {
            console.error("Error updating goal:", error);
            toast.error(`Failed to update goal: ${goal.title}`);
            return;
          }
        } else {
          // This is a new goal, insert it
          const { error } = await supabase
            .from('learning_goals')
            .insert({
              user_id: user.id,
              title: goal.title,
              progress: goal.progress,
              target: goal.target,
              display_order: goal.display_order
            });
            
          if (error) {
            console.error("Error creating goal:", error);
            toast.error(`Failed to create goal: ${goal.title}`);
            return;
          }
        }
      }
      
      toast.success("Learning goals updated successfully!");
      setIsEditingGoals(false);
      
      // Refresh goals from the database
      const { data, error } = await supabase
        .from('learning_goals')
        .select('*')
        .eq('user_id', user.id)
        .order('display_order', { ascending: true });
        
      if (!error && data) {
        setLearningGoals(data);
      }
      
    } catch (error) {
      console.error("Error saving goals:", error);
      toast.error("Failed to save goals. Please try again.");
    }
  };
  
  // Add a new goal
  const addGoal = () => {
    const newGoal = {
      id: `temp_${Date.now()}`,
      title: "New Learning Goal",
      progress: 0,
      target: 100,
      display_order: learningGoals.length + 1
    };
    
    setLearningGoals([...learningGoals, newGoal]);
  };
  
  // Remove a goal
  const removeGoal = async (id) => {
    // If it's a temporary ID (not saved to DB yet)
    if (id.startsWith("temp_")) {
      setLearningGoals(prevGoals => prevGoals.filter(goal => goal.id !== id));
      return;
    }
    
    try {
      const { error } = await supabase
        .from('learning_goals')
        .delete()
        .eq('id', id);
        
      if (error) {
        console.error("Error deleting goal:", error);
        toast.error("Failed to delete goal");
        return;
      }
      
      setLearningGoals(prevGoals => prevGoals.filter(goal => goal.id !== id));
      toast.success("Goal removed");
    } catch (error) {
      console.error("Error removing goal:", error);
      toast.error("Failed to remove goal");
    }
  };

  // Memoize the Achievement Card for better performance
  const AchievementCard = useCallback(({ achievement }) => {
  return (
      <Card className={`hover-card ${achievement.achieved ? 'border-green-500/50' : 'opacity-60'}`}>
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xl mb-1">{achievement.icon}</div>
              <h3 className="font-bold">{achievement.title}</h3>
              <p className="text-muted-foreground text-sm">{achievement.description}</p>
            </div>
            {achievement.achieved ? (
              <span className="bg-green-500/20 text-green-500 text-xs px-2 py-1 rounded-full font-medium">
                Achieved
              </span>
            ) : (
              <span className="bg-secondary text-xs px-2 py-1 rounded-full font-medium">
                In Progress
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }, []);

  // Memoize the CourseCard component
  const CourseCard = useCallback(({ course }) => {
    return (
      <Card key={course.id} className="overflow-hidden hover-card border-border bg-card">
        <div className="flex flex-col md:flex-row h-full">
          <div className="w-full md:w-1/3 h-40 md:h-auto relative">
            <img
              src={course.imageSrc}
              alt={course.title}
              className="absolute inset-0 w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 p-6">
            <h3 className="font-bold text-lg mb-1">{course.title}</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Instructor: {course.instructor} • Last accessed: {course.lastAccessed}
            </p>
            <div className="mb-3">
              <div className="flex justify-between text-sm mb-1">
                <span>Progress</span>
                <span>{course.progress}%</span>
                </div>
              <Progress value={course.progress} />
            </div>
            <div className="flex justify-between items-center mt-4">
              <Button variant="outline" size="sm" onClick={() => navigate(`/courses/${course.id}`)}>
                Continue Learning
                  </Button>
              <span className="text-sm text-muted-foreground">Next: {course.nextLesson}</span>
                </div>
              </div>
            </div>
      </Card>
    );
  }, [navigate]);

  // Memoize activity items
  const ActivityItem = useCallback(({ activity }) => {
    return (
      <div className="py-3 px-4 hover:bg-secondary/40 rounded-lg transition-colors">
        <div className="flex gap-4">
          <div className="w-8 h-8 rounded-full bg-brand-purple/10 flex items-center justify-center shrink-0">
            {activity.type === 'course_enrolled' && (
              <Book className="h-4 w-4 text-brand-purple" />
            )}
            {activity.type === 'lesson_completed' && (
              <CheckCircle className="h-4 w-4 text-green-500" />
            )}
            {activity.type === 'quiz_completed' && (
              <FileText className="h-4 w-4 text-blue-500" />
            )}
          </div>
          <div>
            <p className="font-medium">
              {activity.type === 'course_enrolled' && 'Enrolled in '}
              {activity.type === 'lesson_completed' && 'Completed lesson in '}
              {activity.type === 'quiz_completed' && 'Completed quiz in '}
              <span className="font-semibold">{activity.course}</span>
            </p>
            {activity.item && (
              <p className="text-sm text-muted-foreground">{activity.item}</p>
            )}
            {activity.score && (
              <p className="text-sm">Score: <span className="text-green-500 font-medium">{activity.score}</span></p>
            )}
            <p className="text-sm text-muted-foreground">{activity.time}</p>
          </div>
        </div>
      </div>
    );
  }, []);

  // Use useMemo for the tabbed content sections
  const coursesTabContent = useMemo(() => (
            <TabsContent value="courses">
              <div className="space-y-8">
                <div>
                  <h2 className="text-xl font-bold mb-4">Your Enrolled Courses</h2>
                  {loading ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {[1, 2].map(i => (
                        <Card key={i} className="animate-pulse">
                          <div className="h-40 bg-secondary"></div>
                        </Card>
                      ))}
                    </div>
                  ) : enrolledCourses.length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {enrolledCourses.map((course) => (
                <CourseCard key={course.id} course={course} />
                      ))}
                    </div>
                  ) : (
            <div className="text-center py-12">
              <div className="h-20 w-20 bg-secondary/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Book className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">No courses yet</h3>
              <p className="text-muted-foreground max-w-md mx-auto mb-6">
                You haven't enrolled in any courses yet. Browse our course catalog to find something that interests you.
              </p>
              <Button onClick={() => navigate('/courses')}>
                Browse Courses
              </Button>
                    </div>
                  )}
                </div>

                <div>
                  <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
          <Card>
            <CardContent className="p-2">
              {loading ? (
                <div className="space-y-4 p-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex gap-4 animate-pulse">
                      <div className="w-8 h-8 rounded-full bg-secondary"></div>
                      <div className="space-y-2 flex-1">
                        <div className="h-4 bg-secondary rounded w-3/4"></div>
                        <div className="h-3 bg-secondary rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentActivities.length > 0 ? (
                <div>
                      {recentActivities.map((activity, index) => (
                    <React.Fragment key={index}>
                      <ActivityItem activity={activity} />
                      {index < recentActivities.length - 1 && (
                        <Separator />
                      )}
                    </React.Fragment>
                  ))}
                          </div>
              ) : (
                <div className="text-center py-8">
                  <div className="flex items-center justify-center mb-3">
                    <FileText className="h-8 w-8 text-muted-foreground" />
                            </div>
                  <p className="text-muted-foreground mb-2">No recent activity</p>
                  <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                    Complete lessons and quizzes to see your activity here
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-3"
                    onClick={() => window.location.reload()}
                  >
                    Refresh Dashboard
                  </Button>
                          </div>
              )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
  ), [loading, enrolledCourses, recentActivities, navigate, CourseCard, ActivityItem]);

  const achievementsTabContent = useMemo(() => (
            <TabsContent value="achievements">
      <div>
        <h2 className="text-xl font-bold mb-4">Your Learning Achievements</h2>
        {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map(i => (
              <Card key={i} className="animate-pulse">
                <div className="h-28 bg-secondary"></div>
              </Card>
            ))}
                      </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {achievements.map((achievement, index) => (
              <AchievementCard key={index} achievement={achievement} />
            ))}
          </div>
                        )}
                      </div>
      
      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">Quiz Results</h2>
        <Card>
          <CardContent className="p-6">
            {loading ? (
              <div className="space-y-4">
                {[1, 2].map(i => (
                  <div key={i} className="animate-pulse">
                    <div className="h-5 bg-secondary rounded w-1/2 mb-2"></div>
                    <div className="h-4 bg-secondary rounded w-1/4 mb-4"></div>
                    <div className="h-4 bg-secondary rounded w-full"></div>
                  </div>
                ))}
              </div>
            ) : quizResults.length > 0 ? (
              <div className="space-y-6">
                {quizResults.slice(0, 3).map((result) => (
                  <div key={result.id}>
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-bold">{result.quizTitle}</h3>
                      <Badge variant={result.score >= 70 ? "secondary" : "outline"} className={result.score >= 70 ? "bg-green-500 hover:bg-green-500/80 text-white" : ""}>
                        {result.score}%
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {result.courseTitle} • {result.date} • Attempt {result.attemptNumber} of {result.totalAttempts}
                    </p>
                    <Progress value={result.score} className={result.score >= 70 ? "bg-green-200" : ""} />
                  </div>
                ))}
                
                {quizResults.length > 3 && (
                  <Button variant="outline" className="w-full">
                    View All Quiz Results
                  </Button>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-lg mb-2">No quiz results yet</div>
                <p className="text-muted-foreground">
                  Complete quizzes to track your learning progress.
                </p>
              </div>
            )}
                    </CardContent>
                  </Card>
              </div>
            </TabsContent>
  ), [loading, achievements, quizResults, AchievementCard]);

  const profileTabContent = useMemo(() => (
            <TabsContent value="profile">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                  <Card className="hover-card">
                    <CardContent className="p-6 text-center">
                      {loading ? (
                        <div className="flex flex-col items-center space-y-4">
                          <div className="h-32 w-32 rounded-full bg-secondary animate-pulse"></div>
                          <div className="h-6 w-32 bg-secondary animate-pulse"></div>
                        </div>
                      ) : (
                        <>
                          <div className="mb-4 flex justify-center">
                            <img
                              src={userData.avatarUrl}
                              alt={userData.name}
                              className="rounded-full h-32 w-32 object-cover border-4 border-brand-purple/30"
                            />
                          </div>
                          <h2 className="text-xl font-bold">{userData.name}</h2>
                          <p className="text-muted-foreground">{userData.role}</p>
                          <p className="text-sm mt-1">Member since {userData.joined}</p>
                        </>
                      )}
                      
                      <Separator className="my-6" />
                      
                      <div className="space-y-2 text-left">
                        <div>
                          <p className="text-sm font-medium">Email</p>
                          <p className="text-sm text-muted-foreground">{userData.email}</p>
                        </div>
                      </div>
                      
              <Button className="mt-6 w-full" variant="outline" onClick={() => navigate('/account-settings')}>
                        Edit Profile
                      </Button>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="lg:col-span-2">
                  <Card className="hover-card">
                    <CardContent className="p-6">
                      <h3 className="font-bold text-lg mb-4">Learning Statistics</h3>
                      
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-secondary/50 p-4 rounded-lg text-center">
                          <p className="text-muted-foreground text-sm">Courses Enrolled</p>
                          <p className="text-2xl font-bold">{enrolledCourses.length}</p>
                        </div>
                        <div className="bg-secondary/50 p-4 rounded-lg text-center">
                          <p className="text-muted-foreground text-sm">Completed Courses</p>
                          <p className="text-2xl font-bold">
                            {enrolledCourses.filter(course => course.progress >= 100).length}
                          </p>
                        </div>
                        <div className="bg-secondary/50 p-4 rounded-lg text-center">
                          <p className="text-muted-foreground text-sm">Hours Learned</p>
                          <p className="text-2xl font-bold">12</p>
                        </div>
                        <div className="bg-secondary/50 p-4 rounded-lg text-center">
                          <p className="text-muted-foreground text-sm">Achievements</p>
                          <p className="text-2xl font-bold">
                            {achievements.filter(a => a.achieved).length}/{achievements.length}
                          </p>
                        </div>
                      </div>
                      
              <div className="flex justify-between items-center">
                      <h3 className="font-bold text-lg mb-4">Learning Goals</h3>
                {isEditingGoals && (
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={addGoal}
                    >
                      Add Goal
                    </Button>
                  </div>
                )}
              </div>
              
              <div className="space-y-3">
                {isEditingGoals ? (
                  // Editable goals
                  learningGoals.map((goal) => (
                    <div key={goal.id} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Input 
                          value={goal.title}
                          onChange={(e) => {
                            setLearningGoals(prevGoals => 
                              prevGoals.map(g => 
                                g.id === goal.id ? { ...g, title: e.target.value } : g
                              )
                            );
                          }}
                          className="flex-1"
                        />
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => removeGoal(goal.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-100"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 6h18"></path>
                            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                          </svg>
                        </Button>
                          </div>
                      <div className="flex items-center gap-2 mb-2">
                        <Input 
                          type="number"
                          min="0"
                          max="100"
                          value={goal.progress}
                          onChange={(e) => handleGoalProgressChange(goal.id, parseInt(e.target.value))}
                          className="w-16"
                        />
                        <span className="text-sm text-muted-foreground">%</span>
                        <Progress value={goal.progress} className="flex-1" />
                        </div>
                    </div>
                  ))
                ) : (
                  // Display-only goals
                  learningGoals.map((goal) => (
                    <div key={goal.id}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium">{goal.title}</span>
                        <span>{goal.progress}%</span>
                      </div>
                      <Progress value={goal.progress} />
                    </div>
                  ))
                )}
              </div>
              
              <Button 
                className="mt-6 w-full" 
                variant="outline"
                onClick={() => {
                  if (isEditingGoals) {
                    saveGoals();
                  } else {
                    setIsEditingGoals(true);
                  }
                }}
              >
                {isEditingGoals ? "Save Goals" : "Update Learning Goals"}
              </Button>
              
              {isEditingGoals && (
                <Button 
                  className="mt-2 w-full" 
                  variant="ghost"
                  onClick={() => setIsEditingGoals(false)}
                >
                  Cancel
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </TabsContent>
  ), [loading, userData, enrolledCourses, achievements, navigate, learningGoals, isEditingGoals]);

  // If the user is a teacher, show the teacher dashboard
  if (isTeacher) {
    return <TeacherDashboard />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow pt-24 pb-16">
          <div className="container mx-auto px-6">
            {/* Dashboard Hero */}
            <div className="mb-10">
              <div className="glass-card rounded-xl p-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-hero-pattern opacity-10"></div>
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
                  <div className="h-20 w-20 rounded-full bg-secondary animate-pulse"></div>
                  <div className="md:flex-1 text-center md:text-left">
                    <div className="h-8 w-64 bg-secondary animate-pulse mx-auto md:mx-0 mb-2"></div>
                    <p className="text-muted-foreground">
                      Loading your dashboard...
                    </p>
                  </div>
                  <Button variant="outline" onClick={() => window.location.reload()}>
                    <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
                    Reload
                  </Button>
                </div>
              </div>
            </div>

            {/* Recovery section */}
            <div className="text-center mb-8">
              <p className="text-muted-foreground mb-4">Taking longer than expected?</p>
              <div className="flex gap-4 justify-center">
                <Button onClick={() => {
                  // Force exit loading state
                  setLoading(false);
                  toast.success("Loading bypassed - some data may be incomplete");
                }}>
                  Skip Loading
                </Button>
                <Button variant="outline" onClick={() => window.location.reload()}>
                  Refresh Page
                </Button>
              </div>
            </div>

            {/* Skeleton Content */}
            <Tabs defaultValue="courses" className="space-y-6">
              <TabsList className="grid grid-cols-3 gap-4 bg-card p-1">
                <TabsTrigger value="courses" className="flex items-center gap-2">
                  <Book className="h-4 w-4" /> My Courses
                </TabsTrigger>
                <TabsTrigger value="achievements" className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" /> Achievements
                </TabsTrigger>
                <TabsTrigger value="profile" className="flex items-center gap-2">
                  <User className="h-4 w-4" /> Profile
                </TabsTrigger>
              </TabsList>

              <TabsContent value="courses">
                <div className="space-y-8">
                  <div>
                    <h2 className="text-xl font-bold mb-4">Your Enrolled Courses</h2>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {[1, 2].map(i => (
                        <Card key={i} className="animate-pulse">
                          <div className="h-40 bg-secondary"></div>
                        </Card>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
                    <Card>
                      <CardContent className="p-2">
                        <div className="space-y-4 p-4">
                          {[1, 2, 3].map(i => (
                            <div key={i} className="flex gap-4 animate-pulse">
                              <div className="w-8 h-8 rounded-full bg-secondary"></div>
                              <div className="space-y-2 flex-1">
                                <div className="h-4 bg-secondary rounded w-3/4"></div>
                                <div className="h-3 bg-secondary rounded w-1/2"></div>
                              </div>
                            </div>
                          ))}
                        </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
            </Tabs>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow pt-24 pb-16">
        <div className="container mx-auto px-6">
          {/* Dashboard Hero */}
          <div className="mb-10">
            <div className="glass-card rounded-xl p-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-hero-pattern opacity-10"></div>
              <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
                {loading ? (
                  <div className="h-20 w-20 rounded-full bg-secondary animate-pulse"></div>
                ) : (
                  <img
                    src={userData.avatarUrl}
                    alt={userData.name}
                    className="rounded-full h-20 w-20 object-cover border-4 border-brand-purple/30"
                  />
                )}
                <div className="md:flex-1 text-center md:text-left">
                  {loading ? (
                    <div className="h-8 w-64 bg-secondary animate-pulse mx-auto md:mx-0 mb-2"></div>
                  ) : (
                    <h1 className="text-2xl md:text-3xl font-bold mb-1">Welcome back, {userData.name}!</h1>
                  )}
                  <p className="text-muted-foreground">
                    Continue your learning journey where you left off.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => navigate('/account-settings')}>
                    <Settings className="mr-2 h-4 w-4" /> Account Settings
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Dashboard Tabs */}
          <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid grid-cols-3 gap-4 bg-card p-1">
              <TabsTrigger value="courses" className="flex items-center gap-2">
                <Book className="h-4 w-4" /> My Courses
              </TabsTrigger>
              <TabsTrigger value="achievements" className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4" /> Achievements
              </TabsTrigger>
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <User className="h-4 w-4" /> Profile
              </TabsTrigger>
            </TabsList>

            {/* Tabs Content */}
            {coursesTabContent}
            {achievementsTabContent}
            {profileTabContent}
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
};

// Optimize utility functions by memoizing them with useCallback
const formatRelativeTime = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  
  // Only show "just now" if it was actually very recent (within 30 seconds)
  // This prevents activities from always showing "just now"
  if (diffSecs < 30) {
    return 'just now';
  } else if (diffSecs < 60) {
    return `${diffSecs} seconds ago`;
  } else if (diffMins < 60) {
    return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  } else if (diffDays < 7) {
    return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  } else if (diffWeeks < 4) {
    return `${diffWeeks} week${diffWeeks === 1 ? '' : 's'} ago`;
  } else if (diffMonths < 12) {
    return `${diffMonths} month${diffMonths === 1 ? '' : 's'} ago`;
  } else {
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }
};

const getDateFromTimeString = (timeString: string): Date => {
  // Extract any number followed by time unit (minute, hour, day, week, month) ago
  const regex = /(\d+)\s+(minute|hour|day|week|month)s?\s+ago/;
  const match = timeString.match(regex);
  
  if (match) {
    const amount = parseInt(match[1]);
    const unit = match[2];
    
    const now = new Date();
    let timestamp = new Date(now);
    
    switch (unit) {
      case 'minute':
        timestamp.setMinutes(now.getMinutes() - amount);
        break;
      case 'hour':
        timestamp.setHours(now.getHours() - amount);
        break;
      case 'day':
        timestamp.setDate(now.getDate() - amount);
        break;
      case 'week':
        timestamp.setDate(now.getDate() - (amount * 7));
        break;
      case 'month':
        timestamp.setMonth(now.getMonth() - amount);
        break;
    }
    
    return timestamp;
  }
  
  // If format is not matched, assume it's recent
  return new Date();
};

export default React.memo(Dashboard);
