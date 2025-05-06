import React, { useState, useEffect } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { Separator } from "@/components/ui/separator";
import { BookOpen, Users, Award, GraduationCap, Lightbulb, Globe } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const About = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getSession();
      setUser(data.session?.user || null);
      setLoading(false);
    };

    getUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleAccountAction = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/register');
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow pt-24 pb-16">
        {/* Hero Section */}
        <div className="relative py-16">
          <div className="absolute inset-0 bg-hero-pattern opacity-10"></div>
          <div className="container mx-auto px-6 relative z-10">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-3xl md:text-5xl font-bold mb-6">About SmartLearn</h1>
              <p className="text-lg text-muted-foreground mb-8">
                We're on a mission to transform education through technology and make quality learning accessible to everyone around the world.
              </p>
            </div>
          </div>
        </div>

        {/* Our Story Section */}
        <div className="container mx-auto px-6 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">Our Story</h2>
              <p className="text-muted-foreground mb-6">
                SmartLearn was founded in 2023 with a simple idea: education should be accessible, engaging, and effective for everyone.
              </p>
              <p className="text-muted-foreground mb-6">
                Our team of educators, technologists, and lifelong learners came together to build a platform that combines cutting-edge technology with proven teaching methodologies.
              </p>
              <p className="text-muted-foreground">
                Today, we're proud to serve thousands of students worldwide, helping them achieve their learning goals and unlock new opportunities through education.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-card-gradient glass-card overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1171&q=80" 
                  alt="Students collaborating" 
                  className="w-full h-48 object-cover"
                />
              </Card>
              <Card className="bg-card-gradient glass-card overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1571260899304-425eee4c7efc?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80" 
                  alt="Online learning" 
                  className="w-full h-48 object-cover"
                />
              </Card>
              <Card className="bg-card-gradient glass-card overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80" 
                  alt="Coding class" 
                  className="w-full h-48 object-cover"
                />
              </Card>
              <Card className="bg-card-gradient glass-card overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=688&q=80" 
                  alt="Proud student" 
                  className="w-full h-48 object-cover"
                />
              </Card>
            </div>
          </div>
        </div>

        <Separator className="max-w-5xl mx-auto" />

        {/* Our Mission Section */}
        <div className="container mx-auto px-6 py-16">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold mb-6">Our Mission</h2>
            <p className="text-lg text-muted-foreground">
              To empower individuals to reach their full potential through accessible, high-quality education that adapts to their unique learning journey.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="bg-card hover-card">
              <CardContent className="p-6 flex flex-col items-center text-center">
                <div className="h-14 w-14 rounded-full bg-brand-purple/20 flex items-center justify-center mb-4">
                  <BookOpen className="h-6 w-6 text-brand-purple" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Quality Content</h3>
                <p className="text-muted-foreground">
                  We collaborate with industry experts to create courses that are comprehensive, up-to-date, and practical.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card hover-card">
              <CardContent className="p-6 flex flex-col items-center text-center">
                <div className="h-14 w-14 rounded-full bg-brand-teal/20 flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-brand-teal" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Community Focus</h3>
                <p className="text-muted-foreground">
                  Learning is better together. We foster communities where students can connect, collaborate, and grow.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card hover-card">
              <CardContent className="p-6 flex flex-col items-center text-center">
                <div className="h-14 w-14 rounded-full bg-brand-purple/20 flex items-center justify-center mb-4">
                  <Globe className="h-6 w-6 text-brand-purple" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Global Access</h3>
                <p className="text-muted-foreground">
                  We believe education should be accessible to everyone, regardless of location or background.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        <Separator className="max-w-5xl mx-auto" />

        {/* Our Team Section */}
        <div className="container mx-auto px-6 py-16">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-6">Meet Our Team</h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Our diverse team brings together expertise in education, technology, and design to create the best learning experience possible.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="bg-card hover-card">
              <CardContent className="p-6 flex flex-col items-center text-center">
                <img 
                  src="https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=687&q=80" 
                  alt="Ahmed Omara" 
                  className="w-24 h-24 rounded-full object-cover mb-4 border-2 border-brand-purple"
                />
                <h3 className="text-lg font-semibold">Ahmed Omara</h3>
                <p className="text-sm text-brand-purple mb-2">CEO & Co-founder</p>
                <p className="text-sm text-muted-foreground">
                  Former education consultant with a passion for accessible learning.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card hover-card">
              <CardContent className="p-6 flex flex-col items-center text-center">
                <img 
                  src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=688&q=80" 
                  alt="Omar Hamid" 
                  className="w-24 h-24 rounded-full object-cover mb-4 border-2 border-brand-teal"
                />
                <h3 className="text-lg font-semibold">Omar Hamid</h3>
                <p className="text-sm text-brand-teal mb-2">CTO & Co-founder</p>
                <p className="text-sm text-muted-foreground">
                  Software engineer with 10+ years experience in educational technology.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card hover-card">
              <CardContent className="p-6 flex flex-col items-center text-center">
                <img 
                  src="https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=687&q=80" 
                  alt="Mohamed Elesh" 
                  className="w-24 h-24 rounded-full object-cover mb-4 border-2 border-brand-purple"
                />
                <h3 className="text-lg font-semibold">Mohamed Elesh</h3>
                <p className="text-sm text-brand-purple mb-2">Head of Content</p>
                <p className="text-sm text-muted-foreground">
                  Former professor with a background in curriculum development.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA Section */}
        <div className="relative py-16 bg-card">
          <div className="absolute inset-0 bg-hero-pattern opacity-10"></div>
          <div className="container mx-auto px-6 relative z-10">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-6">Join Our Learning Community</h2>
              <p className="text-lg text-muted-foreground mb-8">
                Start your learning journey today and discover why thousands of students choose SmartLearn
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg" 
                  className="btn-gradient"
                  onClick={handleAccountAction}
                >
                  {user ? "Go to Dashboard" : "Create Free Account"}
                  </Button>
                <Link to="/courses">
                  <Button size="lg" variant="outline">
                    Browse Courses
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default About;
