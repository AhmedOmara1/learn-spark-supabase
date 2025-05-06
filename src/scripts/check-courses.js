// Script to check the courses table structure
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = 'https://jpwmtufhriuajrlwhauf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impwd210dWZocml1YWpybHdoYXVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYyNzk3MTIsImV4cCI6MjA2MTg1NTcxMn0.qyBTOT97eFHGSClbbEAr9xdzX6rvijVSaE3GmHxctr8';
const supabase = createClient(supabaseUrl, supabaseKey);

const checkCoursesTable = async () => {
  try {
    // First just try to get all courses without filtering by price
    console.log('Fetching all courses...');
    const { data: allCourses, error: allCoursesError } = await supabase
      .from('courses')
      .select('*')
      .limit(5);

    if (allCoursesError) {
      console.error('Error fetching courses:', allCoursesError);
    } else {
      console.log('Courses data structure:');
      if (allCourses && allCourses.length > 0) {
        console.log(JSON.stringify(allCourses[0], null, 2));
        
        // Check if price exists in the data
        const hasPrice = 'price' in allCourses[0];
        console.log(`Does price field exist? ${hasPrice ? 'Yes' : 'No'}`);
      } else {
        console.log('No courses found');
      }
    }
    
    // Try to specifically fetch the price column
    console.log('\nFetching courses with price column...');
    const { data: coursesWithPrice, error: priceError } = await supabase
      .from('courses')
      .select('id, title, price')
      .limit(5);
    
    if (priceError) {
      console.error('Error fetching price column:', priceError);
      console.log('\nThe price column does not exist in the database.');
      console.log('You need to add it using the following SQL:');
      console.log('ALTER TABLE courses ADD COLUMN price DECIMAL(10,2) DEFAULT 0.00;');
    } else {
      console.log('Price column exists! Data:');
      console.log(coursesWithPrice);
    }
  } catch (error) {
    console.error('Error checking courses table:', error);
  }
};

checkCoursesTable(); 