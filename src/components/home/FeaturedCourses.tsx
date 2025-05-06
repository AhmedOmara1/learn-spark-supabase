import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import CourseCard from "@/components/ui/CourseCard";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { CodeIcon, PenTool, LineChart, Database, BookOpen, MousePointerClick, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Define the course type
interface Course {
  id: string;
  title: string;
  description: string;
  teacher_id: string;
  thumbnail_url: string | null;
  price: number | null;
  
  // Additional properties from joins or computed values
  teacher_name?: string;
  category?: string;
  level?: string;
  students_count?: number;
  lessons_count?: number;
}

// Sample categories for non-logged in users with enhanced descriptions
const sampleCategories = [
  {
    id: 1,
    title: "Web Development",
    description: "Master modern frameworks and build responsive web applications from scratch",
    icon: <CodeIcon className="h-10 w-10 text-brand-purple" />,
    popular: true,
  },
  {
    id: 2,
    title: "UI/UX Design",
    description: "Create beautiful interfaces and seamless user experiences with industry tools",
    icon: <PenTool className="h-10 w-10 text-brand-teal" />,
    popular: false,
  },
  {
    id: 3,
    title: "Data Science",
    description: "Learn to analyze complex datasets and build predictive models with Python",
    icon: <Database className="h-10 w-10 text-brand-purple" />,
    popular: true,
  },
  {
    id: 4,
    title: "Digital Marketing",
    description: "Develop comprehensive marketing strategies across multiple digital channels",
    icon: <LineChart className="h-10 w-10 text-brand-teal" />,
    popular: false,
  },
  {
    id: 5,
    title: "Artificial Intelligence",
    description: "Explore neural networks, machine learning models and cutting-edge AI applications",
    icon: <Sparkles className="h-10 w-10 text-brand-purple" />,
    popular: true,
  },
  {
    id: 6,
    title: "Interactive Learning",
    description: "Engage with hands-on projects and real-world scenarios designed for retention",
    icon: <MousePointerClick className="h-10 w-10 text-brand-teal" />,
    popular: false,
  },
];

const FeaturedCourses = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [dbStatus, setDbStatus] = useState("unknown");

  // Function to check database connectivity
  const checkDbConnection = useCallback(async () => {
    try {
      // Simple query to verify database connection
      const { error } = await supabase.from('courses').select('id', { count: 'exact', head: true });
      
      if (error) {
        console.error('Database connection error:', error);
        setDbStatus("error");
        return false;
      }
      
      setDbStatus("connected");
      return true;
    } catch (err) {
      console.error('Database check failed:', err);
      setDbStatus("error");
      return false;
    }
  }, []);

  useEffect(() => {
    // Check for user authentication and fetch courses regardless
    const initialize = async () => {
      try {
        console.log("Initializing FeaturedCourses...");
        // Get auth session
        const { data } = await supabase.auth.getSession();
        const userState = data.session?.user || null;
        console.log("Auth state:", userState ? "Signed in" : "Not signed in");
        setUser(userState);
        
        // Check db connection first
        const dbConnected = await checkDbConnection();
        console.log("Database connected:", dbConnected);
        
        // Always fetch courses
        await fetchFeaturedCourses();
      } catch (error) {
        console.error('Error initializing:', error);
        setLoading(false);
      }
    };
    
    initialize();
    
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth event:", event, session ? "Session exists" : "No session");
      setUser(session?.user || null);
    });
    
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [checkDbConnection]);

  const fetchFeaturedCourses = async () => {
    try {
      console.log("Fetching featured courses...");
      setLoading(true);
      
      // Fetch courses with teacher information
      const { data: coursesData, error } = await supabase
        .from('courses')
        .select(`
          *,
          teacher:teacher_id (name)
        `)
        .limit(3);
      
      console.log("Courses query result:", { 
        success: !error, 
        count: coursesData?.length || 0,
        error: error?.message 
      });
      
      if (error) {
        console.error('Error fetching courses:', error);
        setLoading(false);
        return;
      }

      if (!coursesData || coursesData.length === 0) {
        console.warn('No courses found in the database');
        setLoading(false);
        return;
      }

      // For each course, fetch additional data like lesson count and student count
      const enhancedCourses = await Promise.all(
        coursesData.map(async (course) => {
          // Get lesson count
          const { count: lessonsCount, error: lessonsError } = await supabase
            .from('lessons')
            .select('id', { count: 'exact', head: true })
            .eq('course_id', course.id);
          
          if (lessonsError) {
            console.error('Error fetching lesson count:', lessonsError);
          }
          
          // Get student count
          const { count: studentsCount, error: studentsError } = await supabase
            .from('enrollments')
            .select('id', { count: 'exact', head: true })
            .eq('course_id', course.id);
          
          if (studentsError) {
            console.error('Error fetching student count:', studentsError);
          }
          
          // Set category and level (these would come from the database in a real app)
          // For now, we'll assign them some default values based on course ID
          let category = 'Development';
          let level = 'Beginner';
          
          // Simple logic to assign different categories and levels
          const courseIdNum = parseInt(course.id.replace(/-/g, '').substring(0, 2), 16) % 3;
          if (courseIdNum === 0) {
            category = 'Development';
            level = 'Beginner';
          } else if (courseIdNum === 1) {
            category = 'AI & ML';
            level = 'Intermediate';
          } else {
            category = 'Marketing';
            level = 'All Levels';
          }
          
          return {
            ...course,
            teacher_name: course.teacher?.name || 'Unknown Instructor',
            lessons_count: lessonsCount || 0,
            students_count: studentsCount || 0,
            category,
            level,
            price: course.price || 0
          };
        })
      );
      
      setCourses(enhancedCourses);
    } catch (error) {
      console.error('Error in fetchFeaturedCourses:', error);
      setLoading(false);
    } finally {
      // Ensure loading is set to false no matter what
      setLoading(false);
    }
  };

  // Add useEffect to log state changes
  useEffect(() => {
    console.log("FeaturedCourses state changed:", { 
      loading, 
      coursesCount: courses.length,
      userLoggedIn: !!user,
      dbStatus 
    });
  }, [loading, courses.length, user, dbStatus]);

  return (
    <section className="py-16 lg:py-24 relative">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-5"></div>
      
      {/* Highlight bubbles */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-brand-purple/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-brand-teal/10 rounded-full blur-3xl"></div>
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-center mb-12">
          <div>
            <h2 className="text-3xl font-bold">
              <span className="text-white">Featured</span>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand-purple to-brand-teal"> Courses</span>
            </h2>
            <p className="mt-2 text-muted-foreground">
              Curated learning paths designed by industry experts
            </p>
          </div>
          <Link to="/courses" className="mt-4 md:mt-0">
            <Button variant="outline" className="group">
              View All Courses
              <span className="ml-2 transition-transform group-hover:translate-x-1">→</span>
            </Button>
          </Link>
        </div>

        {loading ? (
          // Enhanced skeleton loading UI with gradient overlay
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card rounded-xl overflow-hidden border border-white/10">
                <div className="relative">
                  <Skeleton className="h-48 w-full" />
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-card/60"></div>
                </div>
                <div className="p-6">
                  <Skeleton className="h-6 w-3/4 mb-4" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3 mb-6" />
                  <Skeleton className="h-4 w-1/3 mb-4" />
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : courses.length > 0 ? (
          // Show courses if available, regardless of login status
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {courses.map((course) => (
              <CourseCard
                key={course.id}
                id={course.id}
                title={course.title}
                description={course.description}
                instructor={course.teacher_name || 'Unknown Instructor'}
                category={course.category || 'Development'}
                level={course.level || 'Beginner'}
                studentsCount={course.students_count || 0}
                lessonsCount={course.lessons_count || 0}
                price={course.price || 0}
                imageSrc={course.thumbnail_url || 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1172&q=80'}
              />
            ))}
          </div>
        ) : (
          // Show categories if no courses are found
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {sampleCategories.map((category) => (
                <Card key={category.id} className="glass-card hover-card overflow-hidden transition-all duration-300 border border-white/10">
                  <CardContent className="p-6">
                    <div className="mb-4 flex justify-between items-start">
                      <div className="p-3 bg-background/60 rounded-lg">
                        {category.icon}
                      </div>
                      {category.popular && (
                        <Badge variant="secondary" className="bg-brand-purple/20 text-brand-purple">
                          Popular
                        </Badge>
                      )}
                    </div>
                    <h3 className="text-xl font-bold mb-2">{category.title}</h3>
                    <p className="text-muted-foreground mb-4 text-sm">{category.description}</p>
                    <Link to="/register">
                      <Button variant="ghost" className="p-0 text-brand-purple group">
                        Explore courses
                        <span className="ml-2 transition-transform group-hover:translate-x-1">→</span>
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            <div className="mt-16 bg-gradient-to-r from-brand-purple/20 to-brand-teal/20 rounded-2xl p-1">
              <div className="bg-card/80 backdrop-blur-sm rounded-xl p-8 flex flex-col md:flex-row items-center gap-8">
                <div className="flex-shrink-0 p-4 bg-brand-purple/10 rounded-full">
                  <BookOpen className="h-12 w-12 text-brand-purple" />
                </div>
                <div className="flex-grow">
                  <h3 className="text-2xl font-bold mb-2">Unlock All Courses</h3>
                  <p className="text-muted-foreground mb-4">
                    Sign up today to access our full library of courses, track your progress, and join our learning community.
                  </p>
                </div>
                <div className="flex-shrink-0 mt-4 md:mt-0">
                  <Link to="/register">
                    <Button size="lg" className="btn-gradient">
                      Get Started Free
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default FeaturedCourses;
