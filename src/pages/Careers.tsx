import React, { useState } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CodeIcon, PenTool, Users, Database, Briefcase, Globe, ChevronRight } from "lucide-react";

// Sample job listings data
const jobListings = [
  {
    id: 1,
    title: "Senior Frontend Developer",
    department: "Engineering",
    location: "San Francisco, CA (Remote Available)",
    type: "Full-time",
    posted: "2 weeks ago",
    description: "We're looking for an experienced Frontend Developer to help us build beautiful, responsive user interfaces for our learning platform.",
    responsibilities: [
      "Build and maintain our React-based web application",
      "Work closely with designers to implement responsive, accessible UI",
      "Write clean, maintainable, and well-tested code",
      "Mentor junior developers and contribute to code reviews"
    ],
    requirements: [
      "5+ years of experience in frontend development",
      "Strong proficiency in React, TypeScript, and modern JavaScript",
      "Experience with state management libraries (Redux, Zustand, etc.)",
      "Understanding of web accessibility standards"
    ],
    icon: <CodeIcon />
  },
  {
    id: 2,
    title: "UX/UI Designer",
    department: "Design",
    location: "New York, NY (Hybrid)",
    type: "Full-time",
    posted: "1 week ago",
    description: "Join our design team to create intuitive, engaging user experiences for our educational platform.",
    responsibilities: [
      "Design user interfaces for web and mobile applications",
      "Create wireframes, prototypes, and high-fidelity mockups",
      "Conduct user research and usability testing",
      "Collaborate with developers to ensure proper implementation"
    ],
    requirements: [
      "3+ years of UX/UI design experience",
      "Proficiency in design tools like Figma or Adobe XD",
      "Portfolio showcasing user-centered design work",
      "Experience designing for educational products is a plus"
    ],
    icon: <PenTool />
  },
  {
    id: 3,
    title: "Content Strategist",
    department: "Content",
    location: "Remote",
    type: "Full-time",
    posted: "3 days ago",
    description: "Help us develop and execute our content strategy to educate and engage our users.",
    responsibilities: [
      "Develop content strategies aligned with business goals",
      "Create editorial calendars and content roadmaps",
      "Work with subject matter experts to create educational content",
      "Analyze content performance and optimize based on data"
    ],
    requirements: [
      "3+ years of content strategy experience",
      "Strong writing and editing skills",
      "Experience in educational content development",
      "Data-driven approach to content optimization"
    ],
    icon: <Users />
  },
  {
    id: 4,
    title: "Data Scientist",
    department: "Data",
    location: "Boston, MA (On-site)",
    type: "Full-time",
    posted: "1 month ago",
    description: "Join our data team to help us understand user behavior and improve our learning platform using data-driven insights.",
    responsibilities: [
      "Analyze user behavior data to identify patterns and insights",
      "Build predictive models to enhance learning outcomes",
      "Create dashboards and reports for stakeholders",
      "Collaborate with product and engineering teams"
    ],
    requirements: [
      "MS or PhD in Computer Science, Statistics, or related field",
      "Experience with Python, R, and SQL",
      "Knowledge of machine learning techniques",
      "Experience with educational technology is a plus"
    ],
    icon: <Database />
  }
];

const departments = ["All", "Engineering", "Design", "Content", "Data"];
const locations = ["All", "Remote", "San Francisco, CA", "New York, NY", "Boston, MA"];

const Careers = () => {
  const [selectedDepartment, setSelectedDepartment] = useState("All");
  const [selectedLocation, setSelectedLocation] = useState("All");
  const [activeTab, setActiveTab] = useState("openings");
  const [selectedJob, setSelectedJob] = useState<number | null>(null);
  
  // Filter jobs based on selection
  const filteredJobs = jobListings.filter(job => {
    const matchesDepartment = selectedDepartment === "All" || job.department === selectedDepartment;
    const matchesLocation = selectedLocation === "All" || job.location.includes(selectedLocation);
    return matchesDepartment && matchesLocation;
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow pt-24 pb-16">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">Join Our Team</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              We're on a mission to transform education through technology. Come build the future of learning with us.
            </p>
          </div>

          {/* Values section */}
          <div className="max-w-5xl mx-auto mb-20">
            <h2 className="text-2xl font-bold text-center mb-8">Our Values</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="glass-card">
                <CardContent className="p-6 text-center">
                  <div className="flex justify-center mb-4">
                    <div className="h-12 w-12 rounded-full bg-brand-purple/20 flex items-center justify-center">
                      <Users className="h-6 w-6 text-brand-purple" />
                    </div>
                  </div>
                  <h3 className="font-semibold mb-2">Student-First Thinking</h3>
                  <p className="text-sm text-muted-foreground">
                    We prioritize learner success in every decision we make, creating experiences that truly empower education.
                  </p>
                </CardContent>
              </Card>
              
              <Card className="glass-card">
                <CardContent className="p-6 text-center">
                  <div className="flex justify-center mb-4">
                    <div className="h-12 w-12 rounded-full bg-brand-teal/20 flex items-center justify-center">
                      <Globe className="h-6 w-6 text-brand-teal" />
                    </div>
                  </div>
                  <h3 className="font-semibold mb-2">Accessible Education</h3>
                  <p className="text-sm text-muted-foreground">
                    We believe quality education should be available to everyone, regardless of background or circumstance.
                  </p>
                </CardContent>
              </Card>
              
              <Card className="glass-card">
                <CardContent className="p-6 text-center">
                  <div className="flex justify-center mb-4">
                    <div className="h-12 w-12 rounded-full bg-brand-purple/20 flex items-center justify-center">
                      <Briefcase className="h-6 w-6 text-brand-purple" />
                    </div>
                  </div>
                  <h3 className="font-semibold mb-2">Continuous Growth</h3>
                  <p className="text-sm text-muted-foreground">
                    We foster a culture of learning, where every team member has opportunities to develop and advance their skills.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Benefits section */}
          <div className="max-w-5xl mx-auto mb-20">
            <h2 className="text-2xl font-bold text-center mb-8">Why Work With Us</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-secondary/30 rounded-lg p-5 flex items-start">
                <div className="h-8 w-8 rounded-full bg-brand-purple/20 flex items-center justify-center mr-4 mt-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-brand-purple" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium mb-1">Competitive Compensation</h3>
                  <p className="text-sm text-muted-foreground">Salary and equity packages that reward your contribution to our mission</p>
                </div>
              </div>
              
              <div className="bg-secondary/30 rounded-lg p-5 flex items-start">
                <div className="h-8 w-8 rounded-full bg-brand-purple/20 flex items-center justify-center mr-4 mt-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-brand-purple" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium mb-1">Comprehensive Healthcare</h3>
                  <p className="text-sm text-muted-foreground">Medical, dental, and vision coverage for you and your dependents</p>
                </div>
              </div>
              
              <div className="bg-secondary/30 rounded-lg p-5 flex items-start">
                <div className="h-8 w-8 rounded-full bg-brand-purple/20 flex items-center justify-center mr-4 mt-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-brand-purple" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium mb-1">Flexible Work Arrangements</h3>
                  <p className="text-sm text-muted-foreground">Remote, hybrid, and in-office options to fit your lifestyle</p>
                </div>
              </div>
              
              <div className="bg-secondary/30 rounded-lg p-5 flex items-start">
                <div className="h-8 w-8 rounded-full bg-brand-purple/20 flex items-center justify-center mr-4 mt-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-brand-purple" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium mb-1">Paid Time Off</h3>
                  <p className="text-sm text-muted-foreground">Generous vacation policy and paid holidays to rest and recharge</p>
                </div>
              </div>
              
              <div className="bg-secondary/30 rounded-lg p-5 flex items-start">
                <div className="h-8 w-8 rounded-full bg-brand-purple/20 flex items-center justify-center mr-4 mt-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-brand-purple" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium mb-1">Professional Development</h3>
                  <p className="text-sm text-muted-foreground">Learning stipend and dedicated time for career growth</p>
                </div>
              </div>
              
              <div className="bg-secondary/30 rounded-lg p-5 flex items-start">
                <div className="h-8 w-8 rounded-full bg-brand-purple/20 flex items-center justify-center mr-4 mt-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-brand-purple" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium mb-1">401(k) Matching</h3>
                  <p className="text-sm text-muted-foreground">Retirement plan with employer matching to secure your future</p>
                </div>
              </div>
            </div>
          </div>

          {/* Job listings section */}
          <div className="max-w-5xl mx-auto">
            <Tabs defaultValue="openings" value={activeTab} onValueChange={setActiveTab}>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Open Positions</h2>
                <TabsList>
                  <TabsTrigger value="openings">Current Openings</TabsTrigger>
                  <TabsTrigger value="internships">Internships</TabsTrigger>
                </TabsList>
              </div>
              
              <TabsContent value="openings">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="md:w-1/4">
                    <h3 className="font-medium mb-3">Filter By:</h3>
                    
                    <div className="mb-6">
                      <h4 className="text-sm font-medium mb-2">Department</h4>
                      <div className="space-y-2">
                        {departments.map(dept => (
                          <div 
                            key={dept} 
                            className={`text-sm px-3 py-2 rounded-md cursor-pointer transition-colors ${
                              selectedDepartment === dept 
                                ? 'bg-brand-purple/20 text-brand-purple' 
                                : 'hover:bg-secondary'
                            }`}
                            onClick={() => setSelectedDepartment(dept)}
                          >
                            {dept}
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium mb-2">Location</h4>
                      <div className="space-y-2">
                        {locations.map(loc => (
                          <div 
                            key={loc} 
                            className={`text-sm px-3 py-2 rounded-md cursor-pointer transition-colors ${
                              selectedLocation === loc 
                                ? 'bg-brand-purple/20 text-brand-purple' 
                                : 'hover:bg-secondary'
                            }`}
                            onClick={() => setSelectedLocation(loc)}
                          >
                            {loc}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="md:w-3/4">
                    {selectedJob === null ? (
                      <>
                        {filteredJobs.length > 0 ? (
                          <div className="space-y-4">
                            {filteredJobs.map(job => (
                              <Card key={job.id} className="glass-card hover-card cursor-pointer" onClick={() => setSelectedJob(job.id)}>
                                <CardContent className="p-6">
                                  <div className="flex items-start">
                                    <div className="h-10 w-10 rounded-full bg-brand-purple/20 flex items-center justify-center mr-4">
                                      {job.icon}
                                    </div>
                                    
                                    <div className="flex-1">
                                      <div className="flex justify-between items-start">
                                        <h3 className="font-semibold mb-1">{job.title}</h3>
                                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                                      </div>
                                      
                                      <p className="text-sm text-muted-foreground mb-3">
                                        {job.description}
                                      </p>
                                      
                                      <div className="flex flex-wrap gap-2">
                                        <Badge variant="secondary">{job.department}</Badge>
                                        <Badge variant="secondary">{job.location}</Badge>
                                        <Badge variant="secondary">{job.type}</Badge>
                                        <Badge variant="outline" className="ml-auto">Posted {job.posted}</Badge>
                                      </div>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-12 bg-secondary/30 rounded-xl">
                            <h3 className="font-medium mb-2">No positions found</h3>
                            <p className="text-sm text-muted-foreground">
                              Try adjusting your filters or check back later for new openings
                            </p>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        {(() => {
                          const job = jobListings.find(j => j.id === selectedJob);
                          if (!job) return null;
                          
                          return (
                            <div>
                              <button 
                                className="flex items-center text-sm text-brand-purple mb-4 hover:underline"
                                onClick={() => setSelectedJob(null)}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                                </svg>
                                Back to listings
                              </button>
                              
                              <Card className="glass-card mb-6">
                                <CardContent className="p-6">
                                  <div className="flex items-start">
                                    <div className="h-12 w-12 rounded-full bg-brand-purple/20 flex items-center justify-center mr-4">
                                      {job.icon}
                                    </div>
                                    
                                    <div>
                                      <h2 className="text-2xl font-bold mb-1">{job.title}</h2>
                                      <div className="flex flex-wrap gap-2 mb-4">
                                        <Badge variant="secondary">{job.department}</Badge>
                                        <Badge variant="secondary">{job.location}</Badge>
                                        <Badge variant="secondary">{job.type}</Badge>
                                      </div>
                                      
                                      <p className="text-muted-foreground">
                                        {job.description}
                                      </p>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                <Card>
                                  <CardContent className="p-6">
                                    <h3 className="font-semibold mb-4">Responsibilities</h3>
                                    <ul className="space-y-2">
                                      {job.responsibilities.map((resp, index) => (
                                        <li key={index} className="flex items-start">
                                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-brand-purple mr-2 shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                          </svg>
                                          <span className="text-sm">{resp}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </CardContent>
                                </Card>
                                
                                <Card>
                                  <CardContent className="p-6">
                                    <h3 className="font-semibold mb-4">Requirements</h3>
                                    <ul className="space-y-2">
                                      {job.requirements.map((req, index) => (
                                        <li key={index} className="flex items-start">
                                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-brand-purple mr-2 shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                          </svg>
                                          <span className="text-sm">{req}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </CardContent>
                                </Card>
                              </div>
                              
                              <div className="flex justify-center">
                                <Button className="btn-gradient">
                                  Apply for this position
                                </Button>
                              </div>
                            </div>
                          );
                        })()}
                      </>
                    )}
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="internships">
                <div className="text-center py-12 bg-secondary/30 rounded-xl">
                  <h3 className="font-medium mb-2">Internship Program</h3>
                  <p className="text-sm text-muted-foreground max-w-lg mx-auto mb-6">
                    Our internship program runs every summer. Applications for Summer 2025 will open in January.
                    Join our talent network to be notified when applications open.
                  </p>
                  <Button className="btn-gradient">Join Talent Network</Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Careers; 