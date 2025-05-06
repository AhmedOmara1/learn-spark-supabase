// Script to run direct SQL migration for course price column
import { createClient } from '@supabase/supabase-js';

// Supabase client configuration
const SUPABASE_URL = "https://jpwmtufhriuajrlwhauf.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impwd210dWZocml1YWpybHdoYXVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYyNzk3MTIsImV4cCI6MjA2MTg1NTcxMn0.qyBTOT97eFHGSClbbEAr9xdzX6rvijVSaE3GmHxctr8";

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

const addPriceColumn = async () => {
  try {
    // First check if the column already exists
    const { error: checkError } = await supabase
      .from('courses')
      .select('price')
      .limit(1);

    // If we get an error about the column not existing
    if (checkError && checkError.message.includes('column "price" does not exist')) {
      console.log('Price column does not exist. Adding it now...');
      
      // Use PostgreSQL's SQL to alter the table and add the column
      const { error: alterError } = await supabase
        .rpc('exec_sql', { 
          query: 'ALTER TABLE courses ADD COLUMN price DECIMAL(10,2) DEFAULT 0.00;' 
        });
      
      if (alterError) {
        console.error('Failed to add price column:', alterError);
      } else {
        console.log('Price column added successfully!');
      }
    } else if (checkError) {
      console.error('Error checking for price column:', checkError);
    } else {
      console.log('Price column already exists!');
    }
  } catch (error) {
    console.error('Migration failed:', error);
  }
};

addPriceColumn(); 