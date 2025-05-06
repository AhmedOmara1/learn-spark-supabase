-- Drop the existing constraint on results table
ALTER TABLE results DROP CONSTRAINT IF EXISTS results_user_id_quiz_id_key;

-- Create a new table structure for quiz results that allows multiple attempts
CREATE TABLE IF NOT EXISTS results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  answers JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add appropriate indexes for performance
CREATE INDEX IF NOT EXISTS idx_results_user_id ON results(user_id);
CREATE INDEX IF NOT EXISTS idx_results_quiz_id ON results(quiz_id);
CREATE INDEX IF NOT EXISTS idx_results_created_at ON results(created_at);

-- Create a new view to easily get the latest attempt per quiz for a user
CREATE OR REPLACE VIEW latest_quiz_results AS
SELECT DISTINCT ON (user_id, quiz_id)
  id,
  user_id,
  quiz_id,
  score,
  answers,
  created_at
FROM results
ORDER BY user_id, quiz_id, created_at DESC;

-- Add a trigger to update user achievements when a perfect score is achieved
CREATE OR REPLACE FUNCTION update_perfect_quiz_achievement()
RETURNS TRIGGER AS $$
BEGIN
  -- When a user gets a 100% score, mark the Perfect Quiz achievement
  IF NEW.score = 100 THEN
    -- Check if the achievement table exists (this is just placeholder logic)
    -- In a real implementation, update the user's achievements table
    RAISE NOTICE 'User % earned Perfect Quiz achievement', NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to handle achievement updates
DROP TRIGGER IF EXISTS perfect_quiz_achievement_trigger ON results;
CREATE TRIGGER perfect_quiz_achievement_trigger
AFTER INSERT ON results
FOR EACH ROW
EXECUTE FUNCTION update_perfect_quiz_achievement(); 