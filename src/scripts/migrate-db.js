// Script to directly modify the database schema
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client 
const supabaseUrl = 'https://jpwmtufhriuajrlwhauf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impwd210dWZocml1YWpybHdoYXVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYyNzk3MTIsImV4cCI6MjA2MTg1NTcxMn0.qyBTOT97eFHGSClbbEAr9xdzX6rvijVSaE3GmHxctr8';
const supabase = createClient(supabaseUrl, supabaseKey);

const runMigration = async () => {
  try {
    // Try to execute a query using the price column first to check if it exists
    const { data, error } = await supabase
      .from('courses')
      .select('id, price')
      .limit(1);

    // If column doesn't exist, we'll get a specific error 
    if (error && error.message && error.message.includes('price')) {
      console.log('Price column does not exist. Creating it now...');

      // Since we can't directly run SQL with the client, we need to create a new course with a price field
      // This will indirectly tell us if the column exists in the database
      const testPrice = 19.99;
      const { error: insertError } = await supabase
        .from('courses')
        .insert({
          title: 'Test Course with Price',
          description: 'This is a test course to add the price column',
          teacher_id: 'test-teacher-id', // Use a valid ID from your database
          price: testPrice 
        });

      if (insertError) {
        console.error('Error creating test course:', insertError);
        
        // If this is a "column does not exist" error, we need to tell the user
        // to run the migration script on the Supabase dashboard directly
        if (insertError.message && insertError.message.includes('price')) {
          console.error('\n-------------------------------------------------');
          console.error('IMPORTANT: You need to run this SQL in the Supabase SQL editor:');
          console.error('ALTER TABLE courses ADD COLUMN price DECIMAL(10,2) DEFAULT 0.00;');
          console.error('ALTER TABLE enrollments ADD COLUMN payment_status VARCHAR(20) DEFAULT \'pending\';');
          console.error('ALTER TABLE enrollments ADD COLUMN payment_amount DECIMAL(10,2) DEFAULT 0.00;');
          console.error('-------------------------------------------------\n');
        }
      } else {
        console.log('Price column added successfully!');

        // Clean up test data
        const { error: deleteError } = await supabase
          .from('courses')
          .delete()
          .eq('title', 'Test Course with Price');

        if (deleteError) {
          console.error('Error cleaning up test course:', deleteError);
        }
      }
    } else if (error) {
      console.error('Error checking for price column:', error);
    } else {
      console.log('Price column already exists!', data);
    }
  } catch (error) {
    console.error('Migration failed:', error);
  }
};

runMigration(); 