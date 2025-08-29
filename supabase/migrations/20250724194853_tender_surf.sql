/*
  # Create function to delete match and messages

  1. New Functions
    - `delete_match_and_messages` - Safely deletes a match and all its messages
    
  2. Security
    - Function runs with security definer to bypass RLS
    - Checks that the requesting user is part of the match before deletion
*/

CREATE OR REPLACE FUNCTION delete_match_and_messages(
  p_match_id uuid,
  p_user_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  match_exists boolean := false;
BEGIN
  -- Check if the user is part of this match
  SELECT EXISTS(
    SELECT 1 FROM matches 
    WHERE id = p_match_id 
    AND (user1_id = p_user_id OR user2_id = p_user_id)
  ) INTO match_exists;
  
  -- If user is not part of the match, return false
  IF NOT match_exists THEN
    RETURN false;
  END IF;
  
  -- Delete all messages for this match
  DELETE FROM messages WHERE match_id = p_match_id;
  
  -- Delete the match
  DELETE FROM matches WHERE id = p_match_id;
  
  RETURN true;
END;
$$;