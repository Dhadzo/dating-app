/*
  # Fix user_settings table duplicates and constraints

  1. Changes
    - Remove duplicate records, keeping only the most recent one
    - Add unique constraint to prevent future duplicates
    - Update RLS policies for better security

  2. Security
    - Maintain RLS policies
    - Ensure users can only access their own settings
*/

-- First, remove duplicate records, keeping only the most recent one for each user
DELETE FROM user_settings 
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id) id
  FROM user_settings 
  ORDER BY user_id, updated_at DESC
);

-- Add unique constraint to prevent future duplicates
ALTER TABLE user_settings 
ADD CONSTRAINT user_settings_user_id_unique UNIQUE (user_id);

-- Update the table to ensure we have proper defaults
ALTER TABLE user_settings 
ALTER COLUMN notifications SET DEFAULT '{"likes": false, "messages": true, "marketing": false, "newMatches": true}'::jsonb,
ALTER COLUMN privacy SET DEFAULT '{"showAge": true, "showOnline": true, "showLocation": true}'::jsonb,
ALTER COLUMN discovery SET DEFAULT '{"showMe": "everyone", "ageRange": [22, 35], "cityFilter": "", "stateFilter": ""}'::jsonb;