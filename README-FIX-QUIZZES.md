# Fix for Quiz Attempts and 100% Scores

This document provides instructions to fix the issue where quiz attempts with 100% scores are not being properly recorded in the database.

## The Problem

The current database schema has a unique constraint on the `results` table that prevents a user from having multiple quiz attempts for the same quiz. This is causing:

1. Users can't retake quizzes multiple times
2. 100% scores aren't showing up in quiz history
3. The "Retake Quiz" button not working correctly

## The Solution

We need to modify the database schema to remove this constraint and allow multiple quiz attempts per user per quiz.

## How to Apply the Fix

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

### 3. Install Dependencies

```bash
npm install
```

### 4. Run the Fix Script

```bash
npm run db:fix-quiz-results
```

This will:
- Remove the unique constraint on the `results` table
- Add proper indexes for performance
- Allow multiple quiz attempts per user

### 5. Verify the Fix

After applying the fix:
1. Start the application (`npm run dev`)
2. Log in as a student
3. Take a quiz and get 100% score
4. Check that the attempt appears in the course detail page
5. Try taking the quiz again to verify that multiple attempts work

## What Changed?

1. The database schema was modified to support multiple quiz attempts
2. The Quiz component now properly creates new attempts each time
3. The CourseDetail component properly displays all attempts including perfect scores

If you encounter any issues, please contact support. 