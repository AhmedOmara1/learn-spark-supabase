# Video Progress Tracking Feature

This document provides information on the new Video Progress Tracking feature that automatically tracks when users watch videos in courses.

## How It Works

The system tracks video progress by:
1. Monitoring how much of each video a user has watched
2. Automatically saving progress at regular intervals (every 10% progress)
3. Marking videos as "completed" when the user reaches 90% or more
4. Showing a progress bar below each video
5. Calculating overall course progress based on completed videos

## Database Requirements

This feature requires adding a `lessons_progress` column to the `enrollments` table. The column stores JSON data that tracks progress for each lesson.

## How to Apply Database Changes

### 1. Prerequisites

Make sure you have:
- Node.js installed
- Supabase access keys with admin privileges

### 2. Add Environment Variables

Create or update your `.env` file with:

```
VITE_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_service_key
```

The service key should have admin privileges and is different from your public key.

### 3. Run the Migration Script

```bash
npm run db:add-lesson-progress
```

This will:
- Add the `lessons_progress` JSONB column to the enrollments table
- Add an `updated_at` timestamp column to track when progress is updated

### 4. Verify the Feature

After applying the changes:
1. Start the application (`npm run dev`)
2. Log in as a student
3. Navigate to a course and play a video
4. Watch the progress bar appear and update as you watch
5. Watch a video to completion to see it marked as completed

## Technical Details

The progress tracking uses:
- YouTube IFrame API to monitor video playback
- Real-time progress updates stored in the database
- Automatic course completion percentage calculation

If you encounter any issues with video tracking, please contact support. 