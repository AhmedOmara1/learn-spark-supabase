import React, { useState, useEffect } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Book, GraduationCap, User, Settings, PlusCircle, Edit, Users, BarChart, Mail, Search, Calendar, CheckCircle2, X, Award } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";
import { useNavigate, Link } from "react-router-dom";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs as StudentTabs, TabsContent as StudentTabsContent, TabsList as StudentTabsList, TabsTrigger as StudentTabsTrigger } from "@/components/ui/tabs";

// Interface for quiz result
interface QuizResult {
  id: string;
  quizId: string;
  quizTitle: string;
  score: number;
  date: string;
  time: string;
}

// Interface for student data
interface Student {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  enrolledCourses: number;
  lastActive: string;
  progress: number;
  coursesEnrolled: {
    id: string;
    title: string;
    progress: number;
  }[];
  quizResults?: QuizResult[];
}

const TeacherDashboard = () => {
  const [activeTab, setActiveTab] = useState("courses");
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState({
    name: "",
    email: "",
    role: "Teacher",
    joined: "",
    avatarUrl: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=687&q=80",
    totalStudents: 0
  });
  const [teacherCourses, setTeacherCourses] = useState([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentDetailsOpen, setStudentDetailsOpen] = useState(false);
  const [studentDetailsLoading, setStudentDetailsLoading] = useState(false);
  const navigate = useNavigate();

  // Fetch teacher data and courses
  useEffect(() => {
    const fetchTeacherData = async () => {
      try {
        setLoading(true);
        
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          navigate("/login");
          return;
        }

        // Get user profile data
        let { data: profile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (profileError) {
          console.error("Error fetching profile:", profileError);
          
          // If profile doesn't exist, create it with teacher role
          if (profileError.code === "PGRST116") {
            console.log("Profile not found, creating teacher profile");
            
            const { data: newProfile, error: createError } = await supabase
              .from('users')
              .insert([{
                id: user.id,
                name: user.user_metadata?.full_name || user.email?.split('@')[0] || "Teacher",
                email: user.email || "",
                role: "teacher",
                avatar_url: "https://api.dicebear.com/6.x/initials/svg?seed=" + (user.user_metadata?.full_name || user.email?.split('@')[0] || "Teacher")
              }])
              .select()
              .single();
              
            if (createError) {
              console.error("Error creating profile:", createError);
              toast.error("Failed to create teacher profile");
              navigate("/dashboard");
              return;
            }
            
            profile = newProfile;
          } else {
            toast.error("Failed to load user profile");
            navigate("/dashboard");
            return;
          }
        }

        // Verify the user is a teacher
        if (profile?.role !== "teacher") {
          console.error("User is not a teacher, redirecting to dashboard");
          toast.error("Access denied: Teacher privileges required");
          navigate("/dashboard");
          return;
        }

        // Get courses created by this teacher
        const { data: teacherCoursesData, error: coursesError } = await supabase
          .from('courses')
          .select(`
            *,
            enrollments:enrollments(count)
          `)
          .eq('teacher_id', user.id);

        if (coursesError) {
          console.error("Error fetching courses:", coursesError);
          toast.error("Failed to load your courses");
        }

        // Format courses data
        const formattedCourses = teacherCoursesData?.map(course => {
          // Get enrollment count for this course
          const enrollmentCount = course.enrollments?.length || 0;
          
          return {
            id: course.id,
            title: course.title,
            description: course.description,
            studentCount: enrollmentCount,
            created: new Date(course.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
            imageSrc: course.thumbnail_url || "https://images.unsplash.com/photo-1498050108023-c5249f4df085?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1172&q=80"
          };
        }) || [];
        
        // Get all enrollments for teacher's courses to fetch students
        const courseIds = teacherCoursesData?.map(course => course.id) || [];
        
        if (courseIds.length > 0) {
          // Fetch all enrollments for the teacher's courses
          const { data: enrollmentsData, error: enrollmentsError } = await supabase
            .from('enrollments')
            .select(`
              *,
              users:user_id(*),
              courses:course_id(id, title)
            `)
            .in('course_id', courseIds);
            
          if (enrollmentsError) {
            console.error("Error fetching enrollments:", enrollmentsError);
          } else {
            // Process enrollments to get unique students with their courses
            const studentMap = new Map<string, Student>();
            
            // Process each enrollment to build student data
            enrollmentsData?.forEach(enrollment => {
              const studentId = enrollment.user_id;
              const userData = enrollment.users;
              const courseData = enrollment.courses;
              
              // Skip if user data is missing
              if (!userData) return;
              
              // Get or create student entry
              if (!studentMap.has(studentId)) {
                studentMap.set(studentId, {
                  id: studentId,
                  name: userData.name || "Unknown",
                  email: userData.email || "",
                  avatar_url: userData.avatar_url,
                  enrolledCourses: 0,
                  lastActive: new Date(enrollment.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
                  progress: 0,
                  coursesEnrolled: []
                });
              }
              
              // Get the student object
              const student = studentMap.get(studentId)!;
              
              // Increment enrolled courses count
              student.enrolledCourses += 1;
              
              // Add course info
              student.coursesEnrolled.push({
                id: courseData.id,
                title: courseData.title,
                progress: enrollment.progress || 0
              });
              
              // Update average progress
              student.progress = student.coursesEnrolled.reduce((acc, course) => acc + course.progress, 0) / student.coursesEnrolled.length;
            });
            
            // Convert map to array
            const studentArray = Array.from(studentMap.values());
            setStudents(studentArray);
            setFilteredStudents(studentArray);
            
            // Get total student count
            const totalStudentsCount = studentArray.length;
            
            // Format joined date
            const joinedDate = profile?.created_at 
              ? new Date(profile.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
              : "Recently";

            // Update state with user data
            setUserData({
              name: profile?.name || user.email?.split('@')[0] || "Teacher",
              email: user.email || "",
              role: "Teacher",
              joined: joinedDate,
              avatarUrl: profile?.avatar_url || "https://images.unsplash.com/photo-1599566150163-29194dcaad36?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=687&q=80",
              totalStudents: totalStudentsCount
            });
          }
        } else {
          // No courses, so no students
          setUserData({
            name: profile?.name || user.email?.split('@')[0] || "Teacher",
            email: user.email || "",
            role: "Teacher",
            joined: profile?.created_at 
              ? new Date(profile.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
              : "Recently",
            avatarUrl: profile?.avatar_url || "https://images.unsplash.com/photo-1599566150163-29194dcaad36?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=687&q=80",
            totalStudents: 0
          });
        }
        
        setTeacherCourses(formattedCourses);
      } catch (error) {
        console.error("Error:", error);
        toast.error("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchTeacherData();
  }, [navigate]);

  // Filter students when search query changes
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredStudents(students);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = students.filter(student => 
        student.name.toLowerCase().includes(query) || 
        student.email.toLowerCase().includes(query) ||
        student.coursesEnrolled.some(course => course.title.toLowerCase().includes(query))
      );
      setFilteredStudents(filtered);
    }
  }, [searchQuery, students]);

  const handleCreateCourse = () => {
    navigate("/create-course");
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Function to get initials from name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Function to get progress color class
  const getProgressColorClass = (progress: number) => {
    if (progress < 30) return "text-red-500";
    if (progress < 70) return "text-amber-500";
    return "text-green-500";
  };

  // Add a new function to fetch student details including quiz results
  const handleViewStudentDetails = async (studentId: string) => {
    try {
      setStudentDetailsLoading(true);
      
      // Find the base student data from our existing state
      const student = students.find(s => s.id === studentId);
      
      if (!student) {
        toast.error("Student not found");
        return;
      }
      
      // Fetch quiz results for this student
      const { data: quizResultsData, error: quizResultsError } = await supabase
        .from('results')
        .select(`
          *,
          quizzes:quiz_id (title, course_id)
        `)
        .eq('user_id', studentId);
        
      if (quizResultsError) {
        console.error("Error fetching quiz results:", quizResultsError);
        toast.error("Failed to load quiz results");
      }
      
      // Process quiz results
      const formattedQuizResults: QuizResult[] = quizResultsData?.map(result => {
        const attemptDate = new Date(result.created_at);
        return {
          id: result.id,
          quizId: result.quiz_id,
          quizTitle: result.quizzes?.title || "Untitled Quiz",
          score: result.score,
          date: attemptDate.toLocaleDateString('en-US', { 
            year: 'numeric', month: 'short', day: 'numeric' 
          }),
          time: attemptDate.toLocaleTimeString('en-US', {
            hour: '2-digit', minute: '2-digit'
          })
        };
      }) || [];
      
      // Set the selected student with quiz results
      const enrichedStudent: Student = {
        ...student,
        quizResults: formattedQuizResults
      };
      
      setSelectedStudent(enrichedStudent);
      setStudentDetailsOpen(true);
    } catch (err) {
      console.error("Error fetching student details:", err);
      toast.error("Failed to load student details");
    } finally {
      setStudentDetailsLoading(false);
    }
  };

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
                    Manage your courses and students from your teacher dashboard.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline">
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
              <TabsTrigger value="students" className="flex items-center gap-2">
                <Users className="h-4 w-4" /> Students
              </TabsTrigger>
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <User className="h-4 w-4" /> Profile
              </TabsTrigger>
            </TabsList>

            {/* Courses Tab */}
            <TabsContent value="courses">
              <div className="space-y-8">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold">Your Courses</h2>
                  <Button onClick={handleCreateCourse} className="btn-gradient">
                    <PlusCircle className="mr-2 h-4 w-4" /> Create New Course
                  </Button>
                </div>

                {loading ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {[1, 2].map(i => (
                      <Card key={i} className="animate-pulse">
                        <div className="h-40 bg-secondary"></div>
                      </Card>
                    ))}
                  </div>
                ) : teacherCourses.length > 0 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {teacherCourses.map((course) => (
                      <Card key={course.id} className="overflow-hidden hover-card border-border bg-card">
                        <div className="flex flex-col md:flex-row h-full">
                          <div className="w-full md:w-1/3 h-40 md:h-auto relative">
                            <img
                              src={course.imageSrc}
                              alt={course.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <CardContent className="flex-1 p-4 flex flex-col">
                            <div>
                              <h3 className="font-semibold text-lg mb-1">{course.title}</h3>
                              <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                                {course.description}
                              </p>
                            </div>
                            <div className="mt-auto space-y-4">
                              <div className="flex justify-between text-sm">
                                <span>{course.studentCount} students enrolled</span>
                                <span className="text-muted-foreground">Created: {course.created}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <Button size="sm" variant="outline" onClick={() => navigate(`/edit-course/${course.id}`)}>
                                  <Edit className="mr-1 h-3 w-3" /> Edit Course
                                </Button>
                                <Button size="sm" onClick={() => navigate(`/courses/${course.id}`)}>View Course</Button>
                              </div>
                            </div>
                          </CardContent>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 border border-dashed rounded-lg">
                    <h3 className="text-lg font-medium mb-2">You haven't created any courses yet</h3>
                    <p className="text-muted-foreground mb-4">Create your first course to start teaching on the platform</p>
                    <Button onClick={handleCreateCourse} className="btn-gradient">
                      <PlusCircle className="mr-2 h-4 w-4" /> Create Your First Course
                    </Button>
                  </div>
                )}

                <Separator />

                <div>
                  <h2 className="text-xl font-bold mb-4">Teaching Analytics</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="hover-card">
                      <CardContent className="p-6 flex flex-col items-center justify-center h-full">
                        <div className="h-12 w-12 rounded-full bg-brand-purple/20 flex items-center justify-center mb-4">
                          <Book className="h-6 w-6 text-brand-purple" />
                        </div>
                        <h3 className="text-3xl font-bold mb-1">{teacherCourses.length}</h3>
                        <p className="text-muted-foreground text-sm">Total Courses</p>
                      </CardContent>
                    </Card>
                    
                    <Card className="hover-card">
                      <CardContent className="p-6 flex flex-col items-center justify-center h-full">
                        <div className="h-12 w-12 rounded-full bg-brand-teal/20 flex items-center justify-center mb-4">
                          <Users className="h-6 w-6 text-brand-teal" />
                        </div>
                        <h3 className="text-3xl font-bold mb-1">{userData.totalStudents || 0}</h3>
                        <p className="text-muted-foreground text-sm">Total Students</p>
                      </CardContent>
                    </Card>
                    
                    <Card className="hover-card">
                      <CardContent className="p-6 flex flex-col items-center justify-center h-full">
                        <div className="h-12 w-12 rounded-full bg-brand-purple/20 flex items-center justify-center mb-4">
                          <BarChart className="h-6 w-6 text-brand-purple" />
                        </div>
                        <h3 className="text-3xl font-bold mb-1">
                          {teacherCourses.reduce((sum, course) => sum + course.studentCount, 0)}
                        </h3>
                        <p className="text-muted-foreground text-sm">Total Enrollments</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Students Tab */}
            <TabsContent value="students">
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold">Your Students</h2>
                  <div className="w-64 relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Search students..." 
                      value={searchQuery}
                      onChange={handleSearchChange}
                      className="pl-8"
                    />
                  </div>
                </div>

                {loading ? (
                  <div className="flex justify-center py-10">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                  </div>
                ) : filteredStudents.length > 0 ? (
                  <Card>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Student</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Enrolled Courses</TableHead>
                          <TableHead>Progress</TableHead>
                          <TableHead>Last Active</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredStudents.map((student) => (
                          <TableRow key={student.id}>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-3">
                                <Avatar>
                                  {student.avatar_url ? (
                                    <AvatarImage src={student.avatar_url} alt={student.name} />
                                  ) : (
                                    <AvatarFallback>{getInitials(student.name)}</AvatarFallback>
                                  )}
                                </Avatar>
                                <span>{student.name}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Mail className="h-4 w-4 text-muted-foreground" />
                                <span>{student.email}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                {student.coursesEnrolled.map((course, index) => (
                                  <Badge key={index} variant="outline" className="mr-1">
                                    {course.title}
                                  </Badge>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span className={getProgressColorClass(student.progress)}>
                                  {Math.round(student.progress)}%
                                </span>
                                <Progress 
                                  value={student.progress} 
                                  className={`h-2 w-16 ${
                                    student.progress < 30 ? "bg-red-100" : 
                                    student.progress < 70 ? "bg-amber-100" : 
                                    "bg-green-100"
                                  }`}
                                  style={{
                                    "--progress-foreground": student.progress < 30 ? "rgb(239 68 68)" : 
                                      student.progress < 70 ? "rgb(245 158 11)" : 
                                      "rgb(34 197 94)"
                                  } as React.CSSProperties}
                                />
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span>{student.lastActive}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleViewStudentDetails(student.id)}
                                disabled={studentDetailsLoading}
                              >
                                {studentDetailsLoading && student.id === selectedStudent?.id ? (
                                  <span className="h-4 w-4 border-2 border-t-transparent border-white rounded-full animate-spin mr-2"></span>
                                ) : null}
                                View Details
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="p-6 text-center">
                      {searchQuery ? (
                        <div className="py-10">
                          <div className="mx-auto w-12 h-12 rounded-full bg-secondary flex items-center justify-center mb-4">
                            <Search className="h-6 w-6 text-muted-foreground" />
                          </div>
                          <h3 className="text-lg font-medium mb-2">No students found</h3>
                          <p className="text-muted-foreground">
                            No students match your search criteria. Try a different search term.
                          </p>
                        </div>
                      ) : (
                        <div className="py-10">
                          <div className="mx-auto w-12 h-12 rounded-full bg-secondary flex items-center justify-center mb-4">
                            <Users className="h-6 w-6 text-muted-foreground" />
                          </div>
                          <h3 className="text-lg font-medium mb-2">No students yet</h3>
                          <p className="text-muted-foreground mb-4">
                            You don't have any students enrolled in your courses yet. 
                            Create compelling courses to attract students!
                          </p>
                          <Button onClick={handleCreateCourse} className="btn-gradient">
                            <PlusCircle className="mr-2 h-4 w-4" /> Create a Course
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            {/* Profile Tab */}
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
                          <p className="text-brand-purple">{userData.role}</p>
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
                      
                      <Button className="mt-6 w-full" variant="outline">
                        Edit Profile
                      </Button>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="lg:col-span-2">
                  <Card className="hover-card">
                    <CardContent className="p-6">
                      <h3 className="font-bold text-lg mb-4">Teaching Statistics</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div className="bg-secondary/50 p-4 rounded-lg text-center">
                          <p className="text-muted-foreground text-sm">Courses Created</p>
                          <p className="text-2xl font-bold">{teacherCourses.length}</p>
                        </div>
                        <div className="bg-secondary/50 p-4 rounded-lg text-center">
                          <p className="text-muted-foreground text-sm">Total Students</p>
                          <p className="text-2xl font-bold">{userData.totalStudents || 0}</p>
                        </div>
                      </div>
                      
                      <h3 className="font-bold text-lg mb-4">Teacher Bio</h3>
                      
                      <p className="text-muted-foreground mb-4">
                        This is where your public teacher bio would appear to students. 
                        Add information about your expertise, teaching style, and qualifications.
                      </p>
                      
                      <Button>Edit Bio</Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />

      {/* Add the student details dialog */}
      <Dialog open={studentDetailsOpen} onOpenChange={setStudentDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedStudent && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    {selectedStudent.avatar_url ? (
                      <AvatarImage src={selectedStudent.avatar_url} alt={selectedStudent.name} />
                    ) : (
                      <AvatarFallback>{getInitials(selectedStudent.name)}</AvatarFallback>
                    )}
                  </Avatar>
                  <span className="text-xl font-bold">{selectedStudent.name}</span>
                </DialogTitle>
                <DialogDescription className="flex items-center gap-1 text-sm">
                  <Mail className="h-4 w-4" /> {selectedStudent.email}
                </DialogDescription>
              </DialogHeader>
              
              <StudentTabs defaultValue="overview" className="mt-4">
                <StudentTabsList className="grid grid-cols-3 gap-4 bg-card p-1">
                  <StudentTabsTrigger value="overview" className="flex items-center gap-2">
                    <User className="h-4 w-4" /> Overview
                  </StudentTabsTrigger>
                  <StudentTabsTrigger value="courses" className="flex items-center gap-2">
                    <Book className="h-4 w-4" /> Courses
                  </StudentTabsTrigger>
                  <StudentTabsTrigger value="quiz-results" className="flex items-center gap-2">
                    <Award className="h-4 w-4" /> Quiz Results
                  </StudentTabsTrigger>
                </StudentTabsList>
                
                <StudentTabsContent value="overview" className="space-y-4 mt-4">
                  <Card>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-lg mb-3">Student Statistics</h3>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="flex flex-col items-center p-3 bg-secondary/20 rounded-md">
                          <span className="text-2xl font-bold">{selectedStudent.enrolledCourses}</span>
                          <span className="text-sm text-muted-foreground">Courses</span>
                        </div>
                        <div className="flex flex-col items-center p-3 bg-secondary/20 rounded-md">
                          <span className={`text-2xl font-bold ${getProgressColorClass(selectedStudent.progress)}`}>
                            {Math.round(selectedStudent.progress)}%
                          </span>
                          <span className="text-sm text-muted-foreground">Avg. Progress</span>
                        </div>
                        <div className="flex flex-col items-center p-3 bg-secondary/20 rounded-md">
                          <span className="text-2xl font-bold">{selectedStudent.quizResults?.length || 0}</span>
                          <span className="text-sm text-muted-foreground">Quizzes Taken</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-lg mb-3">Last Activity</h3>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" /> {selectedStudent.lastActive}
                      </div>
                    </CardContent>
                  </Card>
                </StudentTabsContent>
                
                <StudentTabsContent value="courses" className="space-y-4 mt-4">
                  <h3 className="font-semibold text-lg">Enrolled Courses</h3>
                  {selectedStudent.coursesEnrolled.length > 0 ? (
                    <div className="space-y-3">
                      {selectedStudent.coursesEnrolled.map((course, index) => (
                        <Card key={index}>
                          <CardContent className="p-4">
                            <div className="flex justify-between items-center">
                              <h4 className="font-medium">{course.title}</h4>
                              <div className={`text-sm font-semibold px-3 py-1 rounded-full ${
                                course.progress >= 80 ? "bg-green-500/20 text-green-600" :
                                course.progress >= 60 ? "bg-amber-500/20 text-amber-600" :
                                "bg-red-500/20 text-red-600"
                              }`}>
                                {course.progress}%
                              </div>
                            </div>
                            <div className="mt-2">
                              <div className="text-xs text-muted-foreground mb-1">Progress</div>
                              <Progress 
                                value={course.progress} 
                                className="h-2"
                                style={{
                                  "--progress-foreground": course.progress < 30 ? "rgb(239 68 68)" : 
                                    course.progress < 70 ? "rgb(245 158 11)" : 
                                    "rgb(34 197 94)"
                                } as React.CSSProperties}
                              />
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10 border border-dashed rounded-lg">
                      <p className="text-muted-foreground">No courses found</p>
                    </div>
                  )}
                </StudentTabsContent>
                
                <StudentTabsContent value="quiz-results" className="space-y-4 mt-4">
                  <h3 className="font-semibold text-lg">Quiz Results</h3>
                  {selectedStudent.quizResults && selectedStudent.quizResults.length > 0 ? (
                    <div className="space-y-3">
                      {selectedStudent.quizResults.map((result, index) => (
                        <Card key={index}>
                          <CardContent className="p-4">
                            <div className="flex justify-between items-center">
                              <div>
                                <h4 className="font-medium">{result.quizTitle}</h4>
                                <p className="text-sm text-muted-foreground">
                                  {result.date} at {result.time}
                                </p>
                              </div>
                              <div className={`text-sm font-semibold px-3 py-1 rounded-full ${
                                result.score >= 80 ? "bg-green-500/20 text-green-600" :
                                result.score >= 60 ? "bg-amber-500/20 text-amber-600" :
                                "bg-red-500/20 text-red-600"
                              }`}>
                                {result.score}%
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10 border border-dashed rounded-lg">
                      <p className="text-muted-foreground">No quiz results found</p>
                    </div>
                  )}
                </StudentTabsContent>
              </StudentTabs>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TeacherDashboard; 