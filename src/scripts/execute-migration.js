// Script to run direct SQL migration for course price column
import { createClient } from '@supabase/supabase-js';

// Supabase client configuration
const SUPABASE_URL = "https://jpwmtufhriuajrlwhauf.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impwd210dWZocml1YWpybHdoYXVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYyNzk3MTIsImV4cCI6MjA2MTg1NTcxMn0.qyBTOT97eFHGSClbbEAr9xdzX6rvijVSaE3GmHxctr8";

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function addPriceColumn() {
  console.log('Attempting to add price column to courses table...');
  
  try {
    // Execute SQL directly to add the price column
    const { data, error } = await supabase
      .from('courses')
      .select('price')
      .limit(1);
    
    if (error) {
      if (error.message.includes('column "price" does not exist')) {
        console.log('Price column does not exist. Adding it now...');
        
        // Use PostgreSQL client function to execute raw SQL
        const { error: alterError } = await supabase.rpc('add_course_price_column');
        
        if (alterError) {
          console.error('Failed to add price column:', alterError);
        } else {
          console.log('Price column added successfully!');
        }
      } else {
        console.error('Error checking for price column:', error);
      }
    } else {
      console.log('Price column already exists:', data);
    }
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

addPriceColumn(); 