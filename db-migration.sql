-- Add price column to courses table
ALTER TABLE courses 
ADD COLUMN price DECIMAL(10,2) DEFAULT 0.00;

-- Add payment_status and payment_amount columns to enrollments table
ALTER TABLE enrollments
ADD COLUMN payment_status VARCHAR(20) DEFAULT 'pending',
ADD COLUMN payment_amount DECIMAL(10,2) DEFAULT 0.00;

-- Update existing courses with default prices (optional)
-- UPDATE courses SET price = 0.00 WHERE price IS NULL;

-- Sample indexes for better query performance
CREATE INDEX idx_course_price ON courses(price);
CREATE INDEX idx_enrollment_payment ON enrollments(payment_status, payment_amount);

-- Sample demonstration data with prices
-- INSERT INTO courses (title, description, teacher_id, thumbnail_url, price)
-- VALUES 
--   ('Web Development Fundamentals', 'Learn the basics of web development', '1234-user-id', 'https://example.com/thumbnail1.jpg', 29.99),
--   ('Data Science Bootcamp', 'Complete data science curriculum', '1234-user-id', 'https://example.com/thumbnail2.jpg', 49.99),
--   ('Mobile App Development', 'Build iOS and Android apps', '1234-user-id', 'https://example.com/thumbnail3.jpg', 39.99),
--   ('JavaScript Mastery', 'Advanced JavaScript concepts', '1234-user-id', 'https://example.com/thumbnail4.jpg', 19.99); 