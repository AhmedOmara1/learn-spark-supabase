# Learning Goals Migration Guide

This migration adds support for user learning goals to track their personal learning objectives.

## What it does

- Creates a new `learning_goals` table to store user learning goals
- Adds security policies to ensure users can only access their own learning goals
- Creates default learning goals for existing users
- Implements automatic timestamps for goal updates

## How to run

1. Connect to your Supabase project using the CLI:

```bash
supabase link --project-ref your-project-ref
```

2. Run the migration:

```bash
supabase db push db-migration-learning-goals.sql
```

Or run it directly in the Supabase SQL editor:

1. Open your Supabase project dashboard
2. Go to the SQL Editor tab
3. Copy the contents of `db-migration-learning-goals.sql`
4. Paste into the SQL Editor
5. Click "Run"

## Verification

After running the migration, verify it worked correctly:

```sql
SELECT * FROM learning_goals LIMIT 10;
```

You should see learning goals populated for existing users. 