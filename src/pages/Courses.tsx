import React, { useState, useEffect } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import CourseCard from "@/components/ui/CourseCard";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, Lock, ArrowRight, RotateCw, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { toast } from "@/components/ui/sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Cache key for course data
const COURSES_CACHE_KEY = 'smartlearn_courses_data';
const COURSES_CACHE_TIMEOUT = 15 * 60 * 1000; // 15 minutes

const Courses = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [levelFilter, setLevelFilter] = useState("all");
  const [coursesData, setCoursesData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  // Handle user authentication and course fetching
  useEffect(() => {
    // Try to load cached courses first
    const cachedData = loadCoursesFromCache();
    if (cachedData) {
      console.log("Loaded courses from cache");
      setCoursesData(cachedData);
      setIsLoading(false);
    }
    
    const getUser = async () => {
      try {
        console.log("Checking user session...");
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Session retrieval error:", error);
          // Still attempt to fetch courses without user
          fetchCourses(null);
          return;
        }
        
        const user = data?.session?.user || null;
        setUser(user);
        
        // Fetch courses with the user information
        fetchCourses(user);
      } catch (error) {
        console.error("Error in getUser:", error);
        setIsLoading(false);
        setError("Error checking authentication. Please try again.");
      }
    };
    
    getUser();
    
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state change:", event);
      const newUser = session?.user || null;
      setUser(newUser);
      
      // Re-fetch courses data if auth status changes
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        fetchCourses(newUser);
      } else if (event === 'SIGNED_OUT') {
        // Clear cached data on sign out
        localStorage.removeItem(COURSES_CACHE_KEY);
      }
    });
    
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Load courses from localStorage cache
  const loadCoursesFromCache = () => {
    try {
      const cachedDataStr = localStorage.getItem(COURSES_CACHE_KEY);
      if (!cachedDataStr) return null;
      
      const { data, timestamp } = JSON.parse(cachedDataStr);
      const now = new Date().getTime();
      
      // Check if cache is still valid
      if (now - timestamp < COURSES_CACHE_TIMEOUT && data && data.length > 0) {
        return data;
      }
      
      // Clear expired cache
      localStorage.removeItem(COURSES_CACHE_KEY);
      return null;
    } catch (err) {
      console.error("Error loading from cache:", err);
      return null;
    }
  };

  // Cache courses in localStorage
  const saveCourseDataToCache = (data: any[]) => {
    try {
      const cacheData = {
        timestamp: new Date().getTime(),
        data: data
      };
      localStorage.setItem(COURSES_CACHE_KEY, JSON.stringify(cacheData));
    } catch (err) {
      console.error("Error saving to cache:", err);
    }
  };

  // Fetch courses from Supabase
  const fetchCourses = async (currentUser: any | null) => {
    try {
      console.log("Fetching courses with user:", currentUser?.id || "not logged in");
      setIsLoading(true);
      setError(null);
      setIsRetrying(false);
      
      // Get all courses with a single database call
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select(`
          id,
          title,
          description,
          thumbnail_url,
          price,
          teacher_id,
          teacher:teacher_id(id, name)
        `);
      
      if (coursesError) {
        console.error("Error fetching courses:", coursesError);
        throw new Error(`Database error: ${coursesError.message}`);
      }
      
      if (!coursesData) {
        console.error("Query returned undefined data");
        throw new Error("Database returned undefined data");
      }
      
      if (coursesData.length === 0) {
        console.warn("No courses found in database");
        setIsLoading(false);
        setError("No courses found in the database. Please check back later.");
        return;
      }
      
      console.log(`Successfully fetched ${coursesData.length} courses`);
      
      // Use batched queries for better performance
      const courseIds = coursesData.map(course => course.id);
      
      // Get all lesson counts in a single query
      const { data: allLessons, error: lessonsError } = await supabase
        .from('lessons')
        .select('course_id, id')
        .in('course_id', courseIds);
        
      if (lessonsError) {
        console.error("Error fetching lessons:", lessonsError);
      }
      
      // Get all enrollment counts in a single query
      const { data: allEnrollments, error: enrollmentsError } = await supabase
        .from('enrollments')
        .select('course_id, id')
        .in('course_id', courseIds);
        
      if (enrollmentsError) {
        console.error("Error fetching enrollments:", enrollmentsError);
      }
      
      // Process lessons and enrollments data
      const lessonCountByCourseId: Record<string, number> = {};
      const enrollmentCountByCourseId: Record<string, number> = {};
      
      if (allLessons) {
        allLessons.forEach(lesson => {
          lessonCountByCourseId[lesson.course_id] = (lessonCountByCourseId[lesson.course_id] || 0) + 1;
        });
      }
      
      if (allEnrollments) {
        allEnrollments.forEach(enrollment => {
          enrollmentCountByCourseId[enrollment.course_id] = (enrollmentCountByCourseId[enrollment.course_id] || 0) + 1;
        });
      }
      
      // Format courses using the batched data
      const formattedCourses = coursesData.map(course => {
        // Set default values for category and level based on course ID
        const categories = ["Development", "Design", "Marketing", "AI & ML", "Data Science", "Business"];
        const levels = ["Beginner", "Intermediate", "Advanced", "All Levels"];
        
        // Use hash of course ID to consistently assign the same category/level
        const hashCode = course.id.split('').reduce((a, b) => {
          return a + b.charCodeAt(0);
        }, 0);
        
        const category = categories[hashCode % categories.length];
        const level = levels[Math.floor(hashCode / 13) % levels.length];
        
        return {
          id: course.id,
          title: course.title,
          description: course.description,
          instructor: course.teacher ? course.teacher.name : "Unknown Instructor",
          category: category,
          level: level,
          studentsCount: enrollmentCountByCourseId[course.id] || 0,
          lessonsCount: lessonCountByCourseId[course.id] || 0,
          price: course.price || 0,
          imageSrc: course.thumbnail_url || "https://images.unsplash.com/photo-1498050108023-c5249f4df085?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1172&q=80"
        };
      });
      
      // Save data to state and cache
      setCoursesData(formattedCourses);
      saveCourseDataToCache(formattedCourses);
      toast.success("Courses loaded successfully");
    } catch (err) {
      console.error("Error in fetchCourses:", err);
      setError(`Failed to load courses: ${err instanceof Error ? err.message : 'Unknown error'}`);
      
      // Use cached data if available
      const cachedData = loadCoursesFromCache();
      if (cachedData) {
        setCoursesData(cachedData);
        toast.warning("Using cached course data due to connection issues");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Retry fetching courses
  const handleRetry = () => {
    setRetryCount(retryCount + 1);
    setIsRetrying(true);
    fetchCourses(user);
  };

  // Get unique categories and levels for filters
  const categories = [...new Set(coursesData.map(course => course.category))];
  const levels = [...new Set(coursesData.map(course => course.level))];

  // Filter courses based on search and filters
  const filteredCourses = coursesData.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        course.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        course.instructor.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === "all" || course.category === categoryFilter;
    const matchesLevel = levelFilter === "all" || course.level === levelFilter;
    
    return matchesSearch && matchesCategory && matchesLevel;
  });

  const handleClearFilters = () => {
    setSearchTerm("");
    setCategoryFilter("all");
    setLevelFilter("all");
  };

  // Sample course categories for non-logged in users
  const sampleCategories = [
    {
      title: "Web Development",
      description: "Learn frontend and backend technologies to build modern web applications",
      count: 42,
      image: "https://images.unsplash.com/photo-1593720213428-28a5b9e94613?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80"
    },
    {
      title: "Data Science",
      description: "Master data analysis, visualization, and machine learning techniques",
      count: 38,
      image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80"
    },
    {
      title: "Mobile Development",
      description: "Create native and cross-platform mobile applications",
      count: 27,
      image: "https://images.unsplash.com/photo-1555774698-0b77e0d5fac6?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80"
    },
    {
      title: "UI/UX Design",
      description: "Design intuitive user interfaces and exceptional user experiences",
      count: 24,
      image: "https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80"
    },
    {
      title: "Cloud Computing",
      description: "Learn AWS, Azure, and Google Cloud infrastructure and services",
      count: 19,
      image: "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80"
    },
    {
      title: "Cybersecurity",
      description: "Protect systems and networks from digital attacks",
      count: 23,
      image: "https://images.unsplash.com/photo-1510511233900-1982d92bd835?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80"
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow pt-24 pb-16">
        <div className="container mx-auto px-6">
          <div className="text-center mb-10">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">Explore Our Courses</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Discover a wide range of courses taught by expert instructors
            </p>
          </div>

          {user ? (
            <>
              {/* Search and Filter Section */}
              <div className="bg-card rounded-xl p-6 mb-10 glass-card">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="col-span-1 md:col-span-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        placeholder="Search courses, instructors..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 bg-secondary/50"
                      />
                    </div>
                  </div>
                  <div>
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                      <SelectTrigger className="bg-secondary/50">
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>{category}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Select value={levelFilter} onValueChange={setLevelFilter}>
                      <SelectTrigger className="bg-secondary/50">
                        <SelectValue placeholder="Level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Levels</SelectItem>
                        {levels.map((level) => (
                          <SelectItem key={level} value={level}>{level}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {(searchTerm || categoryFilter !== "all" || levelFilter !== "all") && (
                  <div className="mt-4 flex items-center justify-between">
                    <p className="text-sm">
                      Showing {filteredCourses.length} of {coursesData.length} courses
                    </p>
                    <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                      Clear Filters
                    </Button>
                  </div>
                )}
              </div>

              {/* Courses Grid */}
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                  <p className="text-muted-foreground">Loading courses...</p>
                </div>
              ) : error ? (
                <div className="text-center py-8 mb-8">
                  <Alert variant="destructive" className="max-w-xl mx-auto mb-6">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    <AlertDescription>
                      {error}
                    </AlertDescription>
                  </Alert>
                  <Button 
                    onClick={handleRetry} 
                    variant="default" 
                    size="lg"
                    disabled={isRetrying}
                    className="mb-6"
                  >
                    {isRetrying ? (
                      <>
                        <RotateCw className="mr-2 h-4 w-4 animate-spin" />
                        Retrying...
                      </>
                    ) : (
                      <>
                        <RotateCw className="mr-2 h-4 w-4" />
                        Retry Loading Courses
                      </>
                    )}
                  </Button>
                  
                  {coursesData.length > 0 && (
                    <>
                      <p className="text-muted-foreground mb-6">Showing previously loaded courses:</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {coursesData.map((course) => (
                          <CourseCard key={course.id} {...course} />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              ) : filteredCourses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {filteredCourses.map((course) => (
                    <CourseCard key={course.id} {...course} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <h3 className="text-xl font-medium mb-2">No courses found</h3>
                  <p className="text-muted-foreground">
                    Try adjusting your search or filter criteria
                  </p>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Sign-up prompt for non-logged in users */}
              <div className="glass-card rounded-xl p-8 mb-16">
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <div className="h-16 w-16 rounded-full bg-brand-purple/20 flex items-center justify-center">
                    <Lock className="h-8 w-8 text-brand-purple" />
                  </div>
                  <div className="flex-1 text-center md:text-left">
                    <h3 className="text-xl font-bold mb-2">Sign Up to Browse Our Full Catalog</h3>
                    <p className="text-muted-foreground mb-4">
                      Create a free account to access all our courses, track your progress, and earn certificates.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                      <Link to="/register">
                        <Button className="btn-gradient">Sign Up Free</Button>
                      </Link>
                      <Link to="/login">
                        <Button variant="outline">Log In</Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                  <p className="text-muted-foreground">Loading course categories...</p>
                </div>
              ) : (
                <>
                  {/* Sample Categories */}
                  <h2 className="text-2xl font-bold mb-6">Popular Categories</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sampleCategories.map((category, index) => (
                      <Card key={index} className="overflow-hidden hover-card">
                        <div className="h-48 relative">
                          <img 
                            src={category.image} 
                            alt={category.title} 
                            className="h-full w-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent"></div>
                          <div className="absolute bottom-4 left-4">
                            <h3 className="text-xl font-bold text-white">{category.title}</h3>
                            <p className="text-sm text-white/80">{category.count} courses</p>
                          </div>
                        </div>
                        <CardContent className="p-6">
                          <p className="text-sm text-muted-foreground mb-4">{category.description}</p>
                          <Link to="/register" className="inline-flex items-center text-sm text-brand-purple hover:underline">
                            Browse courses <ArrowRight className="ml-1 h-4 w-4" />
                          </Link>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Courses;
