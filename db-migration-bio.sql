-- Add bio column to users table
ALTER TABLE users 
ADD COLUMN bio TEXT DEFAULT NULL;

-- Create index for better query performance
CREATE INDEX idx_user_id ON users(id); 