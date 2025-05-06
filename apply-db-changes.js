// Script to apply database changes to support multiple quiz attempts
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read environment variables from .env file
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

async function applyDatabaseChanges() {
  try {
    console.log('🔄 Applying database changes to support multiple quiz attempts...');
    
    // SQL commands to execute
    const sql = `
      -- Drop the existing constraint on results table
      ALTER TABLE results DROP CONSTRAINT IF EXISTS results_user_id_quiz_id_key;
      
      -- Add appropriate indexes for performance
      CREATE INDEX IF NOT EXISTS idx_results_user_id ON results(user_id);
      CREATE INDEX IF NOT EXISTS idx_results_quiz_id ON results(quiz_id);
      CREATE INDEX IF NOT EXISTS idx_results_created_at ON results(created_at);
    `;
    
    // Execute the SQL commands
    const { error } = await supabase.rpc('pgcode', { code: sql });
    
    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }
    
    console.log('✅ Database changes applied successfully!');
    console.log('Multiple quiz attempts per user are now supported.');
    console.log('Quiz attempts with 100% score will now be properly tracked.');
    
  } catch (error) {
    console.error('❌ Error applying database changes:', error.message);
    console.error('Please contact support or try again.');
    process.exit(1);
  }
}

// Run the function
applyDatabaseChanges(); 