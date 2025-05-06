# How to Add the Video URL Column to the Lessons Table

To add video support for lessons, you need to run the following SQL commands in the Supabase SQL Editor:

```sql
-- Add video_url column to lessons table
ALTER TABLE lessons 
ADD COLUMN video_url TEXT DEFAULT NULL;

-- Create index for better query performance
CREATE INDEX idx_lesson_video_url ON lessons(video_url);
```

## Steps to Run the Migration:

1. Log in to your Supabase dashboard at https://app.supabase.com/
2. Select your project (jpwmtufhriuajrlwhauf)
3. Go to the SQL Editor (in the left sidebar)
4. Create a new query
5. Paste the SQL commands above
6. Click "Run" to execute the commands

After running these commands, the video URL functionality for lessons will work correctly.

## Note on Implementation

This migration adds a new `video_url` column to the lessons table that enables:

1. Adding YouTube or other video platform URLs when creating lessons
2. Displaying video content in the lesson view for students
3. Allowing teachers to edit video content for existing lessons

The updated course editor UI now includes fields for adding and editing video URLs for each lesson. 