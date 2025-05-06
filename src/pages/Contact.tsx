import React, { useState } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/sonner";
import { Mail, Phone, MapPin } from "lucide-react";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simple validation
    if (!formData.name || !formData.email || !formData.message) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    setIsSubmitting(true);
    
    // Simulate form submission
    try {
      // In a real app, this would be an API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success("Your message has been sent! We'll contact you soon.");
      setFormData({
        name: "",
        email: "",
        subject: "",
        message: ""
      });
    } catch (error) {
      toast.error("Failed to send your message. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow pt-24 pb-16">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">Contact Us</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Have questions or need assistance? We're here to help! Reach out to our team using the form below.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="md:col-span-1 space-y-8">
              <Card className="glass-card">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <Mail className="h-6 w-6 text-brand-purple shrink-0 mt-1" />
                    <div>
                      <h3 className="font-medium mb-2">Email Us</h3>
                      <p className="text-sm text-muted-foreground mb-1">For general inquiries:</p>
                      <a href="mailto:info@smartlearn.com" className="text-sm text-brand-purple hover:underline">
                        info@smartlearn.com
                      </a>
                      <p className="text-sm text-muted-foreground mt-3 mb-1">For support:</p>
                      <a href="mailto:support@smartlearn.com" className="text-sm text-brand-purple hover:underline">
                        support@smartlearn.com
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <Phone className="h-6 w-6 text-brand-purple shrink-0 mt-1" />
                    <div>
                      <h3 className="font-medium mb-2">Call Us</h3>
                      <p className="text-sm text-muted-foreground mb-1">Customer Service:</p>
                      <a href="tel:+1-800-123-4567" className="text-sm text-brand-purple hover:underline">
                        +1 (800) 123-4567
                      </a>
                      <p className="text-sm text-muted-foreground mt-3 mb-1">Technical Support:</p>
                      <a href="tel:+1-800-765-4321" className="text-sm text-brand-purple hover:underline">
                        +1 (800) 765-4321
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <MapPin className="h-6 w-6 text-brand-purple shrink-0 mt-1" />
                    <div>
                      <h3 className="font-medium mb-2">Visit Us</h3>
                      <p className="text-sm text-muted-foreground">
                        123 Learning Street<br />
                        Education Park<br />
                        San Francisco, CA 94105<br />
                        United States
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="md:col-span-2">
              <Card className="glass-card">
                <CardContent className="p-8">
                  <h2 className="text-xl font-semibold mb-6">Send Us a Message</h2>

                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label htmlFor="name" className="text-sm font-medium">
                          Full Name <span className="text-destructive">*</span>
                        </label>
                        <Input
                          id="name"
                          name="name"
                          placeholder="John Doe"
                          className="bg-secondary/50"
                          value={formData.name}
                          onChange={handleChange}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="email" className="text-sm font-medium">
                          Email Address <span className="text-destructive">*</span>
                        </label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          placeholder="john@example.com"
                          className="bg-secondary/50"
                          value={formData.email}
                          onChange={handleChange}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="subject" className="text-sm font-medium">
                        Subject
                      </label>
                      <Input
                        id="subject"
                        name="subject"
                        placeholder="How can we help you?"
                        className="bg-secondary/50"
                        value={formData.subject}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="message" className="text-sm font-medium">
                        Message <span className="text-destructive">*</span>
                      </label>
                      <Textarea
                        id="message"
                        name="message"
                        placeholder="Please describe your inquiry in detail..."
                        className="bg-secondary/50 min-h-32"
                        value={formData.message}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    <Button 
                      type="submit" 
                      className="btn-gradient w-full md:w-auto"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Sending..." : "Send Message"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="mt-20 max-w-5xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card className="glass-card">
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-2">How do I reset my password?</h3>
                  <p className="text-sm text-muted-foreground">
                    You can reset your password by clicking on the "Forgot Password" link on the login page. Follow the instructions sent to your email to create a new password.
                  </p>
                </CardContent>
              </Card>
              
              <Card className="glass-card">
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-2">How can I enroll in a course?</h3>
                  <p className="text-sm text-muted-foreground">
                    Browse our course catalog, select the course you're interested in, and click the "Enroll" button. You'll need to create an account or log in to complete the enrollment process.
                  </p>
                </CardContent>
              </Card>
              
              <Card className="glass-card">
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-2">Are there any free courses available?</h3>
                  <p className="text-sm text-muted-foreground">
                    Yes, we offer several free introductory courses. Filter the course catalog by "Free" to see all available options.
                  </p>
                </CardContent>
              </Card>
              
              <Card className="glass-card">
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-2">How do I get a certificate?</h3>
                  <p className="text-sm text-muted-foreground">
                    Certificates are issued automatically upon successful completion of a course. You'll find your certificates in the "Achievements" section of your dashboard.
                  </p>
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

export default Contact; 