-- Create learning_goals table to store user learning goals
CREATE TABLE IF NOT EXISTS learning_goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  progress INTEGER NOT NULL DEFAULT 0,
  target INTEGER NOT NULL DEFAULT 100,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Order for displaying goals
  display_order INTEGER NOT NULL DEFAULT 0
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_learning_goals_user_id ON learning_goals(user_id);

-- Add a trigger to update 'updated_at' timestamp automatically
CREATE OR REPLACE FUNCTION update_learning_goals_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_learning_goals_timestamp
BEFORE UPDATE ON learning_goals
FOR EACH ROW
EXECUTE FUNCTION update_learning_goals_timestamp();

-- Insert some default learning goals for existing users
INSERT INTO learning_goals (user_id, title, progress, target, display_order)
SELECT 
  id,
  'Complete ReactJS Course',
  60,
  100,
  1
FROM users;

INSERT INTO learning_goals (user_id, title, progress, target, display_order)
SELECT 
  id,
  'Finish Frontend Bootcamp',
  25,
  100,
  2
FROM users;

INSERT INTO learning_goals (user_id, title, progress, target, display_order)
SELECT 
  id,
  'Build Portfolio Project',
  10,
  100,
  3
FROM users;

-- Create row-level security policies
ALTER TABLE learning_goals ENABLE ROW LEVEL SECURITY;

-- Policy for users to view only their own learning goals
CREATE POLICY learning_goals_select_policy
  ON learning_goals
  FOR SELECT
  USING (user_id = auth.uid());

-- Policy for users to insert only their own learning goals
CREATE POLICY learning_goals_insert_policy
  ON learning_goals
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Policy for users to update only their own learning goals
CREATE POLICY learning_goals_update_policy
  ON learning_goals
  FOR UPDATE
  USING (user_id = auth.uid());

-- Policy for users to delete only their own learning goals
CREATE POLICY learning_goals_delete_policy
  ON learning_goals
  FOR DELETE
  USING (user_id = auth.uid()); 