import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/sonner";
import { ArrowLeft, CreditCard } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const Payment = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [course, setCourse] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState("credit-card");
  const [paymentInfo, setPaymentInfo] = useState({
    cardNumber: "",
    cardName: "",
    expiryDate: "",
    cvv: "",
  });

  // Fetch course data
  useEffect(() => {
    const fetchCourseData = async () => {
      try {
        setLoading(true);
        
        // Get current user
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        
        if (!currentUser) {
          toast.error("Please log in to proceed with payment");
          navigate("/login");
          return;
        }
        
        setUser(currentUser);
        
        // Fetch course data
        const { data: courseData, error: courseError } = await supabase
          .from('courses')
          .select(`
            *,
            teacher:teacher_id(name)
          `)
          .eq('id', courseId)
          .single();
        
        if (courseError) {
          console.error("Error fetching course:", courseError);
          toast.error("Failed to load course data");
          navigate("/courses");
          return;
        }
        
        // Check if user is already enrolled
        const { data: enrollmentData } = await supabase
          .from('enrollments')
          .select('*')
          .eq('user_id', currentUser.id)
          .eq('course_id', courseId)
          .single();
        
        if (enrollmentData) {
          toast.info("You are already enrolled in this course");
          navigate(`/courses/${courseId}`);
          return;
        }
        
        // Set course data
        setCourse(courseData);
        
        // If course is free, redirect to course detail page
        if (!courseData.price || parseFloat(courseData.price) === 0) {
          toast.info("This course is free. No payment needed.");
          navigate(`/courses/${courseId}`);
          return;
        }
      } catch (error) {
        console.error("Error:", error);
        toast.error("An error occurred. Please try again.");
        navigate("/courses");
      } finally {
        setLoading(false);
      }
    };
    
    fetchCourseData();
  }, [courseId, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPaymentInfo((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePaymentMethodChange = (method) => {
    setPaymentMethod(method);
  };

  const validatePaymentInfo = () => {
    if (paymentMethod === "credit-card") {
      if (!paymentInfo.cardNumber || paymentInfo.cardNumber.length < 16) {
        toast.error("Please enter a valid card number");
        return false;
      }
      if (!paymentInfo.cardName) {
        toast.error("Please enter the cardholder name");
        return false;
      }
      if (!paymentInfo.expiryDate || !paymentInfo.expiryDate.includes("/")) {
        toast.error("Please enter a valid expiry date (MM/YY)");
        return false;
      }
      if (!paymentInfo.cvv || paymentInfo.cvv.length < 3) {
        toast.error("Please enter a valid CVV code");
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validatePaymentInfo()) {
      return;
    }
    
    try {
      setProcessing(true);
      
      // This would be where you integrate with a payment processor like Stripe
      // For this demo, we'll simulate a successful payment
      
      // After payment success, create enrollment
      const { error: enrollError } = await supabase
        .from('enrollments')
        .insert([
          { 
            user_id: user.id, 
            course_id: courseId,
            progress: 0,
            completed: false,
            payment_status: "completed",
            payment_amount: course.price
          }
        ]);
      
      if (enrollError) {
        throw enrollError;
      }
      
      toast.success("Payment successful! You are now enrolled in the course.");
      navigate(`/dashboard`);
    } catch (error) {
      console.error("Payment error:", error);
      toast.error("Failed to process payment. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
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

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow pt-24 pb-16">
        <div className="container mx-auto px-6 max-w-5xl">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate(`/courses/${courseId}`)}
            className="mb-8"
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Course
          </Button>
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Payment Form */}
            <div className="lg:col-span-8">
              <h1 className="text-3xl font-bold mb-6">Complete Your Purchase</h1>
              
              <Card className="bg-card shadow-md mb-6">
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Payment Method</h2>
                  
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="credit-card"
                        name="payment-method"
                        value="credit-card"
                        checked={paymentMethod === "credit-card"}
                        onChange={() => handlePaymentMethodChange("credit-card")}
                        className="h-4 w-4 text-brand-purple"
                      />
                      <Label htmlFor="credit-card" className="flex items-center">
                        <CreditCard className="h-4 w-4 mr-2" />
                        Credit / Debit Card
                      </Label>
                    </div>
                    
                    {paymentMethod === "credit-card" && (
                      <form className="space-y-4 mt-6" onSubmit={handleSubmit}>
                        <div className="space-y-2">
                          <Label htmlFor="cardNumber">Card Number</Label>
                          <Input 
                            id="cardNumber"
                            name="cardNumber"
                            placeholder="1234 5678 9012 3456"
                            value={paymentInfo.cardNumber}
                            onChange={handleInputChange}
                            maxLength={16}
                            className="font-mono"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="cardName">Cardholder Name</Label>
                          <Input 
                            id="cardName"
                            name="cardName"
                            placeholder="John Doe"
                            value={paymentInfo.cardName}
                            onChange={handleInputChange}
                          />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="expiryDate">Expiry Date</Label>
                            <Input 
                              id="expiryDate"
                              name="expiryDate"
                              placeholder="MM/YY"
                              value={paymentInfo.expiryDate}
                              onChange={handleInputChange}
                              maxLength={5}
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="cvv">CVV</Label>
                            <Input 
                              id="cvv"
                              name="cvv"
                              placeholder="123"
                              value={paymentInfo.cvv}
                              onChange={handleInputChange}
                              maxLength={4}
                              type="password"
                            />
                          </div>
                        </div>
                        
                        <div className="pt-4">
                          <Button 
                            type="submit" 
                            className="btn-gradient w-full"
                            disabled={processing}
                          >
                            {processing ? "Processing..." : `Pay $${parseFloat(course.price).toFixed(2)}`}
                          </Button>
                          <p className="text-xs text-center mt-2 text-muted-foreground">
                            Your payment is secure and encrypted
                          </p>
                        </div>
                      </form>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Order Summary */}
            <div className="lg:col-span-4">
              <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
              
              <Card className="bg-card shadow-md">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 rounded-md overflow-hidden bg-muted flex-shrink-0">
                        <img 
                          src={course.thumbnail_url || "https://via.placeholder.com/150"} 
                          alt={course.title} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <h3 className="font-medium">{course.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          by {course.teacher?.name || "Unknown Instructor"}
                        </p>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Original Price</span>
                        <span>${parseFloat(course.price).toFixed(2)}</span>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="flex justify-between font-bold">
                      <span>Total</span>
                      <span className="text-brand-purple">${parseFloat(course.price).toFixed(2)}</span>
                    </div>
                    
                    <div className="pt-4 text-xs text-muted-foreground">
                      <p>By completing your purchase, you agree to our <a href="/terms" className="text-brand-purple underline">Terms of Service</a> and <a href="/privacy" className="text-brand-purple underline">Privacy Policy</a>.</p>
                    </div>
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

export default Payment; 