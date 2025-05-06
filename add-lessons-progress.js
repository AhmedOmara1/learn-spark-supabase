// Script to add lessons_progress column to the enrollments table
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Error: Missing Supabase URL or service key environment variables.');
  console.error('Please add VITE_SUPABASE_URL and SUPABASE_SERVICE_KEY to your .env file.');
  process.exit(1);
}

// Create Supabase client with service key (admin rights)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function addLessonsProgressColumn() {
  try {
    console.log('🔄 Adding lessons_progress column to enrollments table...');
    
    // SQL commands to execute
    const sql = `
      -- Add lessons_progress column to enrollments table
      ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS lessons_progress JSONB DEFAULT '{}'::jsonb;
      
      -- Add updated_at column to track when progress is updated
      ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    `;
    
    // Execute the SQL commands
    const { error } = await supabase.rpc('pgcode', { code: sql });
    
    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }
    
    console.log('✅ Database changes applied successfully!');
    console.log('Lesson progress tracking is now enabled.');
    
  } catch (error) {
    console.error('❌ Error applying database changes:', error.message);
    console.error('Please contact support or try again.');
    process.exit(1);
  }
}

// Run the function
addLessonsProgressColumn(); 