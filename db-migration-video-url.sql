-- Add video_url column to lessons table
ALTER TABLE lessons 
ADD COLUMN video_url TEXT DEFAULT NULL;
 
-- Create index for better query performance
CREATE INDEX idx_lesson_video_url ON lessons(video_url); 