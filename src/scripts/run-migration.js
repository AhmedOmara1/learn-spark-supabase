// Script to run database migration
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Import environment variables
const SUPABASE_URL = "https://jpwmtufhriuajrlwhauf.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impwd210dWZocml1YWpybHdoYXVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYyNzk3MTIsImV4cCI6MjA2MTg1NTcxMn0.qyBTOT97eFHGSClbbEAr9xdzX6rvijVSaE3GmHxctr8";

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function runMigration() {
  try {
    console.log('Reading migration SQL file...');
    // Get the directory name using ES modules approach
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    const migrationPath = path.join(__dirname, '../../db-migration-bio.sql');
    console.log('Migration path:', migrationPath);
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('Migration SQL content:');
    console.log(migrationSQL);

    // Manually define the statements from the bio migration file
    const statements = [
      'ALTER TABLE users ADD COLUMN bio TEXT DEFAULT NULL',
      'CREATE INDEX idx_user_id ON users(id)'
    ];

    console.log(`Found ${statements.length} SQL statements to execute`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      if (!stmt) continue;

      console.log(`Executing statement ${i + 1}/${statements.length}...`);
      console.log(stmt); // Log the full statement

      try {
        // Execute the SQL directly
        const { error } = await supabase.rpc('exec_sql', { query: stmt });

        if (error) {
          console.error(`Error executing statement ${i + 1}:`, error);
          if (error.message && (
              error.message.includes('already exists') ||
              error.message.includes('duplicate key')
            )) {
            console.log('Object appears to already exist, continuing...');
          } else {
            throw error;
          }
        } else {
          console.log(`Statement ${i + 1} executed successfully`);
        }
      } catch (stmtError) {
        console.error(`Error executing statement ${i + 1}:`, stmtError);
        if (stmtError.message && (
            stmtError.message.includes('already exists') ||
            stmtError.message.includes('duplicate key')
          )) {
          console.log('Object appears to already exist, continuing...');
        } else {
          throw stmtError;
        }
      }
    }

    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();