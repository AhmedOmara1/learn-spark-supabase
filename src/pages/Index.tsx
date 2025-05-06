import React, { useState, useEffect } from "react";
import Hero from "@/components/home/Hero";
import FeaturedCourses from "@/components/home/FeaturedCourses";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Book, GraduationCap, Users, Shield } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        setUser(data.session?.user || null);
      } catch (error) {
        console.error("Error getting user session:", error);
      } finally {
        setLoading(false);
      }
    };

    getUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth state changed:", event);
      setUser(session?.user || null);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleGetStartedAction = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/register');
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">
        <Hero />
        <FeaturedCourses />

        {/* How It Works Section */}
        <section className="py-16 bg-card">
          <div className="container mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold">How SmartLearn Works</h2>
              <p className="mt-2 text-muted-foreground max-w-2xl mx-auto">
                Our platform makes learning accessible, engaging, and effective for everyone
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <div className="bg-card-gradient glass-card p-8 rounded-xl text-center flex flex-col items-center">
                <div className="h-14 w-14 rounded-full bg-brand-purple/20 flex items-center justify-center mb-4">
                  <Book className="h-6 w-6 text-brand-purple" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Browse Courses</h3>
                <p className="text-muted-foreground">
                  Explore our diverse library of courses taught by industry experts
                </p>
              </div>

              <div className="bg-card-gradient glass-card p-8 rounded-xl text-center flex flex-col items-center">
                <div className="h-14 w-14 rounded-full bg-brand-teal/20 flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-brand-teal" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Engage & Learn</h3>
                <p className="text-muted-foreground">
                  Participate in interactive lessons, quizzes, and discussions
                </p>
              </div>

              <div className="bg-card-gradient glass-card p-8 rounded-xl text-center flex flex-col items-center">
                <div className="h-14 w-14 rounded-full bg-brand-purple/20 flex items-center justify-center mb-4">
                  <GraduationCap className="h-6 w-6 text-brand-purple" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Earn Certificates</h3>
                <p className="text-muted-foreground">
                  Complete courses and receive certificates to showcase your skills
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Trust & Security Section */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto glass-card p-8 rounded-xl">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="h-16 w-16 rounded-full bg-brand-purple/20 flex items-center justify-center">
                  <Shield className="h-8 w-8 text-brand-purple" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Your Privacy Matters</h3>
                  <p className="text-muted-foreground mb-2">
                    We don't show any course data or personal information until you've created an account and logged in.
                    Your learning journey is private and secure with us.
                  </p>
                  <div className="flex gap-4 mt-4">
                    <Link to="/privacy">
                      <Button variant="outline" size="sm">Privacy Policy</Button>
                    </Link>
                    <Link to="/terms">
                      <Button variant="outline" size="sm">Terms of Service</Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 lg:py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-hero-pattern opacity-10"></div>
          <div className="container mx-auto px-6 relative z-10">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl lg:text-4xl font-bold mb-6">
                Ready to Start Your Learning Journey?
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Join thousands of students and instructors on SmartLearn today and transform your skills
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="btn-gradient" onClick={handleGetStartedAction}>
                  {user ? "Go to Dashboard" : "Get Started Free"}
                </Button>
                <Link to="/courses">
                  <Button size="lg" variant="outline">
                    Learn More
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Index;
