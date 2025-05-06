import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

// Interface for quiz question
interface QuizQuestion {
  id: string;
  text: string;
  options: string[];
  correctOption: number;
}

// Interface for quiz
interface Quiz {
  id: string;
  title: string;
  questions: QuizQuestion[];
  course_id: string;
  created_at?: string;
}

const Quiz = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [user, setUser] = useState<any>(null);
  
  // Fetch quiz data
  useEffect(() => {
    const fetchQuizData = async () => {
      if (!quizId) return;
      
      try {
        setLoading(true);
        
        // Get current user
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        
        if (!currentUser) {
          toast.error("Please log in to take this quiz");
          navigate("/login");
          return;
        }
        
        setUser(currentUser);
        
        // Fetch quiz data
        const { data: quizData, error: quizError } = await supabase
          .from('quizzes')
          .select('*')
          .eq('id', quizId)
          .single();
        
        if (quizError) {
          console.error("Error fetching quiz:", quizError);
          setError("Failed to load quiz data");
          return;
        }
        
        // Check if user is enrolled in the course
        const { data: enrollmentData, error: enrollmentError } = await supabase
          .from('enrollments')
          .select('*')
          .eq('user_id', currentUser.id)
          .eq('course_id', quizData.course_id)
          .single();
        
        if (enrollmentError || !enrollmentData) {
          setError("You must be enrolled in this course to take the quiz");
          return;
        }
        
        // Initialize user answers array with -1 (no answer) for each question
        const questions = Array.isArray(quizData.questions) 
          ? quizData.questions.map((q: any) => ({
              id: q.id || crypto.randomUUID(),
              text: q.text || "",
              options: Array.isArray(q.options) ? q.options : [],
              correctOption: typeof q.correctOption === 'number' ? q.correctOption : 0
            }))
          : [];
        const initialAnswers = Array(questions.length).fill(-1);
        setUserAnswers(initialAnswers);
        
        // Format quiz data
        const formattedQuiz: Quiz = {
          id: quizData.id,
          title: quizData.title,
          questions: questions,
          course_id: quizData.course_id,
          created_at: quizData.created_at
        };
        
        setQuiz(formattedQuiz);
      } catch (err) {
        console.error("Error:", err);
        setError("An error occurred while loading the quiz");
      } finally {
        setLoading(false);
      }
    };
    
    fetchQuizData();
  }, [quizId, navigate]);
  
  // Handle selecting an answer
  const handleSelectAnswer = (optionIndex: number) => {
    const updatedAnswers = [...userAnswers];
    updatedAnswers[currentQuestion] = optionIndex;
    setUserAnswers(updatedAnswers);
  };
  
  // Navigate to next question
  const handleNextQuestion = () => {
    if (currentQuestion < (quiz?.questions.length || 0) - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };
  
  // Navigate to previous question
  const handlePreviousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };
  
  // Submit quiz and calculate score
  const handleSubmitQuiz = async () => {
    if (!quiz || !user) return;
    
    // Calculate score
    let correctAnswers = 0;
    quiz.questions.forEach((question, index) => {
      if (userAnswers[index] === question.correctOption) {
        correctAnswers++;
      }
    });
    
    const scorePercentage = Math.round((correctAnswers / quiz.questions.length) * 100);
    setScore(scorePercentage);
    
    try {
      // Create a more structured object for answers for better JSON compatibility
      const formattedAnswers = userAnswers.map((answer, index) => ({
        questionId: quiz.questions[index].id,
        selectedOption: answer,
        correct: answer === quiz.questions[index].correctOption
      }));

      console.log("Saving quiz result with data:", {
        quiz_id: quiz.id,
        user_id: user.id,
        score: scorePercentage,
        answers: formattedAnswers
      });

      // Always insert a new quiz attempt to preserve history
      const { data, error } = await supabase
        .from('results')
        .insert([
          {
            quiz_id: quiz.id,
            user_id: user.id,
            score: scorePercentage,
            answers: formattedAnswers,
            created_at: new Date().toISOString() // Ensure timestamp is current
          }
        ])
        .select();
      
      if (error) {
        // If there's a unique constraint error, we need to modify our approach
        if (error.code === '23505') { // PostgreSQL unique constraint violation code
          console.log("Detected unique constraint issue, adjusting approach");
          
          // Check for existing results 
          const { data: existingData, error: checkError } = await supabase
            .from('results')
            .select('id')
            .eq('user_id', user.id)
            .eq('quiz_id', quiz.id)
            .single();
            
          if (checkError && checkError.code !== 'PGRST116') { // Not found is actually expected
            console.error("Error checking for existing result:", checkError);
          }
          
          if (existingData) {
            // Delete the existing record first
            const { error: deleteError } = await supabase
              .from('results')
              .delete()
              .eq('id', existingData.id);
              
            if (deleteError) {
              console.error("Error deleting existing quiz result:", deleteError);
              toast.error(`Failed to update quiz result: ${deleteError.message || 'Unknown error'}`);
            } else {
              // Now try insert again
              const { data: retryData, error: retryError } = await supabase
                .from('results')
                .insert([
                  {
                    quiz_id: quiz.id,
                    user_id: user.id,
                    score: scorePercentage,
                    answers: formattedAnswers,
                    created_at: new Date().toISOString()
                  }
                ]);
                
              if (retryError) {
                console.error("Error on retry insert:", retryError);
                toast.error(`Failed to save quiz result: ${retryError.message || 'Unknown error'}`);
              } else {
                console.log("Successfully saved quiz result after delete+insert");
                toast.success(`Quiz completed! Your score: ${scorePercentage}%`);
                
                // Show special messages for perfect scores
                if (scorePercentage === 100) {
                  toast.success("🎯 Perfect score! You've unlocked the Perfect Quiz achievement!");
                } else if (scorePercentage >= 80) {
                  toast.success("Great job! You've mastered this quiz!");
                }
              }
            }
          }
        } else {
          // Handle other types of errors
          console.error("Error saving quiz result:", error);
          toast.error(`Failed to save quiz result: ${error.message || 'Unknown error'}`);
          
          // Try with simpler data structure if it looks like a JSON issue
          if (error.message?.includes('json') || error.message?.includes('type')) {
            const { error: simpleError } = await supabase
              .from('results')
              .insert([
                {
                  quiz_id: quiz.id,
                  user_id: user.id,
                  score: scorePercentage,
                  answers: JSON.stringify(formattedAnswers) // Try stringified version
                }
              ]);
            
            if (simpleError) {
              console.error("Simplified insert also failed:", simpleError);
            } else {
              console.log("Saved with simplified data structure");
              toast.success(`Quiz completed! Your score: ${scorePercentage}%`);
            }
          }
        }
      } else {
        console.log("Quiz result saved successfully:", data);
        // Show success message
        toast.success(`Quiz completed! Your score: ${scorePercentage}%`);
        
        // If perfect score (100%), show special message
        if (scorePercentage === 100) {
          toast.success("🎯 Perfect score! You've unlocked the Perfect Quiz achievement!");
        } else if (scorePercentage >= 80) {
          toast.success("Great job! You've mastered this quiz!");
        }
      }
      
      // Show results regardless of save success
      setShowResults(true);
    } catch (err: any) {
      console.error("Error submitting quiz:", err);
      toast.error(`An error occurred while submitting the quiz: ${err.message || 'Unknown error'}`);
      // Still show results even if saving failed
      setShowResults(true);
    }
  };
  
  // Return to course
  const handleReturnToCourse = () => {
    navigate(`/courses/${quiz?.course_id}`);
  };
  
  // Retake quiz
  const handleRetakeQuiz = () => {
    // Reset quiz state
    setCurrentQuestion(0);
    setUserAnswers(Array(quiz?.questions.length || 0).fill(-1));
    setShowResults(false);
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
  
  if (error) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow pt-24 pb-16 flex items-center justify-center">
          <Alert variant="destructive" className="max-w-lg">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </main>
        <Footer />
      </div>
    );
  }
  
  if (!quiz) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow pt-24 pb-16 flex items-center justify-center">
          <p className="text-muted-foreground">Quiz not found</p>
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
          {showResults ? (
            <Card className="max-w-3xl mx-auto">
              <CardContent className="p-6">
                <h1 className="text-2xl font-bold mb-6">Quiz Results</h1>
                
                <div className="text-center py-8">
                  <div className={`text-4xl font-bold mb-4 ${
                    score >= 80 ? "text-green-600" : 
                    score >= 60 ? "text-amber-600" : 
                    "text-red-600"
                  }`}>
                    {score}%
                  </div>
                  <p className="text-xl mb-2">
                    {score >= 80 ? "Great job!" : 
                     score >= 60 ? "Good effort!" : 
                     "Keep practicing!"}
                  </p>
                  <p className="text-muted-foreground mb-8">
                    You answered {quiz.questions.filter((q, idx) => userAnswers[idx] === q.correctOption).length} out of {quiz.questions.length} questions correctly
                  </p>
                  
                  <div className="flex justify-center gap-3">
                    <Button onClick={handleReturnToCourse} className="btn-gradient">
                      Return to Course
                    </Button>
                    <Button onClick={handleRetakeQuiz} variant="outline">
                      Retake Quiz
                    </Button>
                  </div>
                </div>
                
                <Separator className="my-8" />
                
                <h2 className="text-xl font-bold mb-4">Review Questions</h2>
                
                <div className="space-y-6">
                  {quiz.questions.map((question, idx) => (
                    <div key={question.id || idx} className="bg-secondary/10 rounded-md p-4">
                      <p className="font-medium mb-3">
                        {idx + 1}. {question.text}
                      </p>
                      <div className="space-y-2 pl-4">
                        {question.options.map((option, optIdx) => (
                          <div key={optIdx} className={`p-2 rounded-md flex items-center gap-2 ${
                            optIdx === question.correctOption 
                              ? "bg-green-500/20" 
                              : optIdx === userAnswers[idx] && optIdx !== question.correctOption
                                ? "bg-red-500/20"
                                : ""
                          }`}>
                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-secondary text-xs">
                              {String.fromCharCode(65 + optIdx)}
                            </span>
                            <span>{option}</span>
                            {optIdx === question.correctOption && (
                              <span className="text-green-600 ml-auto">✓ Correct</span>
                            )}
                            {optIdx === userAnswers[idx] && optIdx !== question.correctOption && (
                              <span className="text-red-600 ml-auto">✗ Incorrect</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="max-w-3xl mx-auto">
              <CardContent className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h1 className="text-2xl font-bold">{quiz.title}</h1>
                  <span className="text-sm text-muted-foreground">
                    Question {currentQuestion + 1} of {quiz.questions.length}
                  </span>
                </div>
                
                <div className="mb-8">
                  <div className="w-full bg-secondary/50 rounded-full h-2">
                    <div 
                      className="bg-brand-purple h-2 rounded-full transition-all" 
                      style={{ width: `${((currentQuestion + 1) / quiz.questions.length) * 100}%` }}
                    ></div>
                  </div>
                </div>
                
                {quiz.questions.length > 0 && currentQuestion < quiz.questions.length && (
                  <div>
                    <p className="text-lg font-medium mb-6">
                      {quiz.questions[currentQuestion].text}
                    </p>
                    
                    <div className="space-y-3 mb-8">
                      {quiz.questions[currentQuestion].options.map((option, idx) => (
                        <div 
                          key={idx}
                          className={`p-3 rounded-md border cursor-pointer hover:bg-secondary/20 transition-colors ${
                            userAnswers[currentQuestion] === idx ? "border-brand-purple bg-brand-purple/10" : "border-border"
                          }`}
                          onClick={() => handleSelectAnswer(idx)}
                        >
                          <div className="flex items-center gap-3">
                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-secondary text-xs">
                              {String.fromCharCode(65 + idx)}
                            </span>
                            <span>{option}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex justify-between">
                      <Button 
                        variant="outline" 
                        onClick={handlePreviousQuestion}
                        disabled={currentQuestion === 0}
                      >
                        Previous
                      </Button>
                      
                      {currentQuestion === quiz.questions.length - 1 ? (
                        <Button 
                          className="bg-brand-teal hover:bg-brand-teal/90 text-white"
                          onClick={handleSubmitQuiz}
                          disabled={userAnswers.some(answer => answer === -1)}
                        >
                          Submit Quiz
                        </Button>
                      ) : (
                        <Button 
                          onClick={handleNextQuestion}
                          disabled={userAnswers[currentQuestion] === -1}
                        >
                          Next
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Quiz; 