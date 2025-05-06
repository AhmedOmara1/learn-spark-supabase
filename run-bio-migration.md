# How to Add the Bio Column to the Users Table

The profile update is failing because the `bio` column doesn't exist in the `users` table. To fix this issue, you need to run the following SQL commands in the Supabase SQL Editor:

```sql
-- Add bio column to users table
ALTER TABLE users 
ADD COLUMN bio TEXT DEFAULT NULL;

-- Create index for better query performance
CREATE INDEX idx_user_id ON users(id);
```

## Steps to Run the Migration:

1. Log in to your Supabase dashboard at https://app.supabase.com/
2. Select your project (jpwmtufhriuajrlwhauf)
3. Go to the SQL Editor (in the left sidebar)
4. Create a new query
5. Paste the SQL commands above
6. Click "Run" to execute the commands

After running these commands, the profile update functionality should work correctly.

## Temporary Workaround

Until you can run the migration, the application has been modified to not include the `bio` field in the profile update. This should allow you to update your name and avatar URL without errors.
