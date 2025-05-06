-- Create user_activities table to track student activities
CREATE TABLE user_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  activity_type VARCHAR(50) NOT NULL, -- lesson_completed, quiz_completed, course_enrolled, etc.
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES lessons(id) ON DELETE SET NULL,
  quiz_id UUID REFERENCES quizzes(id) ON DELETE SET NULL,
  score INTEGER, -- For quiz results
  metadata JSONB, -- For any additional data
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Make sure the activity is linked to at least one course, lesson, or quiz
  CONSTRAINT activity_link_check CHECK (
    course_id IS NOT NULL OR
    lesson_id IS NOT NULL OR
    quiz_id IS NOT NULL
  )
);

-- Create indexes for better performance
CREATE INDEX idx_user_activities_user_id ON user_activities(user_id);
CREATE INDEX idx_user_activities_course_id ON user_activities(course_id);
CREATE INDEX idx_user_activities_type ON user_activities(activity_type);
CREATE INDEX idx_user_activities_created_at ON user_activities(created_at);

-- Track lesson completion
CREATE OR REPLACE FUNCTION track_lesson_completed()
RETURNS TRIGGER AS $$
BEGIN
  -- When a user completes a lesson, add an activity record
  IF NEW.progress >= 100 AND OLD.progress < 100 THEN
    INSERT INTO user_activities (user_id, activity_type, course_id, lesson_id)
    VALUES (NEW.user_id, 'lesson_completed', NEW.course_id, NEW.lesson_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Track quiz completion
CREATE OR REPLACE FUNCTION track_quiz_completed()
RETURNS TRIGGER AS $$
BEGIN
  -- When a user completes a quiz, add an activity record
  INSERT INTO user_activities (user_id, activity_type, quiz_id, course_id, score)
  VALUES (NEW.user_id, 'quiz_completed', NEW.quiz_id, 
         (SELECT course_id FROM quizzes WHERE id = NEW.quiz_id), 
         NEW.score);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Track course enrollment
CREATE OR REPLACE FUNCTION track_course_enrolled()
RETURNS TRIGGER AS $$
BEGIN
  -- When a user enrolls in a course, add an activity record
  INSERT INTO user_activities (user_id, activity_type, course_id)
  VALUES (NEW.user_id, 'course_enrolled', NEW.course_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER after_lesson_completed
  AFTER UPDATE ON user_lessons
  FOR EACH ROW
  EXECUTE FUNCTION track_lesson_completed();

CREATE TRIGGER after_quiz_completed
  AFTER INSERT ON results
  FOR EACH ROW
  EXECUTE FUNCTION track_quiz_completed();

CREATE TRIGGER after_course_enrolled
  AFTER INSERT ON enrollments
  FOR EACH ROW
  EXECUTE FUNCTION track_course_enrolled();

-- Sample data (commented out)
/*
INSERT INTO user_activities (user_id, activity_type, course_id, lesson_id)
VALUES 
  ('user-id-here', 'lesson_completed', 'course-id-here', 'lesson-id-here'),
  ('user-id-here', 'quiz_completed', 'course-id-here', NULL),
  ('user-id-here', 'course_enrolled', 'course-id-here', NULL);
*/ 