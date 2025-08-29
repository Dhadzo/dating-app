/*
  # Create messaging system

  1. New Tables
    - `messages`
      - `id` (uuid, primary key)
      - `match_id` (uuid, foreign key to matches)
      - `sender_id` (uuid, foreign key to profiles)
      - `content` (text)
      - `created_at` (timestamp)
      - `read_at` (timestamp, nullable)

  2. Security
    - Enable RLS on `messages` table
    - Add policies for users to send/read messages in their matches

  3. Functions
    - Function to get match between two users
    - Function to mark messages as read
*/

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  read_at timestamptz
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_messages_match_id ON messages(match_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);

-- Enable RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for messages
CREATE POLICY "Users can read messages in their matches"
  ON messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM matches 
      WHERE matches.id = messages.match_id 
      AND (matches.user1_id = auth.uid() OR matches.user2_id = auth.uid())
    )
  );

CREATE POLICY "Users can send messages in their matches"
  ON messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM matches 
      WHERE matches.id = messages.match_id 
      AND (matches.user1_id = auth.uid() OR matches.user2_id = auth.uid())
    )
  );

CREATE POLICY "Users can update their own messages"
  ON messages
  FOR UPDATE
  TO authenticated
  USING (sender_id = auth.uid());

-- Function to get match between two users
CREATE OR REPLACE FUNCTION get_match_between_users(user1 uuid, user2 uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  match_id uuid;
BEGIN
  SELECT id INTO match_id
  FROM matches
  WHERE (user1_id = user1 AND user2_id = user2)
     OR (user1_id = user2 AND user2_id = user1);
  
  RETURN match_id;
END;
$$;

-- Function to mark messages as read
CREATE OR REPLACE FUNCTION mark_messages_as_read(p_match_id uuid, p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE messages 
  SET read_at = now()
  WHERE match_id = p_match_id 
    AND sender_id != p_user_id 
    AND read_at IS NULL;
END;
$$;

-- Function to get unread message count for a user
CREATE OR REPLACE FUNCTION get_unread_message_count(p_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  unread_count integer;
BEGIN
  SELECT COUNT(*)::integer INTO unread_count
  FROM messages m
  JOIN matches mt ON m.match_id = mt.id
  WHERE (mt.user1_id = p_user_id OR mt.user2_id = p_user_id)
    AND m.sender_id != p_user_id
    AND m.read_at IS NULL;
  
  RETURN COALESCE(unread_count, 0);
END;
$$;

-- Update notification creation function to not reveal names for likes
CREATE OR REPLACE FUNCTION create_match_on_mutual_like()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  existing_like_id uuid;
  match_id uuid;
  liker_name text;
  liked_name text;
BEGIN
  -- Check if the liked user has already liked the liker
  SELECT id INTO existing_like_id
  FROM likes
  WHERE liker_id = NEW.liked_id AND liked_id = NEW.liker_id;

  IF existing_like_id IS NOT NULL THEN
    -- It's a match! Create the match record
    INSERT INTO matches (user1_id, user2_id)
    VALUES (
      LEAST(NEW.liker_id, NEW.liked_id),
      GREATEST(NEW.liker_id, NEW.liked_id)
    )
    RETURNING id INTO match_id;

    -- Get user names for match notifications
    SELECT CONCAT(first_name, ' ', last_name) INTO liker_name
    FROM profiles WHERE id = NEW.liker_id;
    
    SELECT CONCAT(first_name, ' ', last_name) INTO liked_name
    FROM profiles WHERE id = NEW.liked_id;

    -- Create match notifications for both users (with names)
    INSERT INTO notifications (user_id, type, title, message, data)
    VALUES 
      (NEW.liker_id, 'match', 'New Match!', 
       'You matched with ' || liked_name || '! Start chatting now.', 
       jsonb_build_object('match_id', match_id, 'other_user_id', NEW.liked_id)),
      (NEW.liked_id, 'match', 'New Match!', 
       'You matched with ' || liker_name || '! Start chatting now.', 
       jsonb_build_object('match_id', match_id, 'other_user_id', NEW.liker_id));
  ELSE
    -- Just a like, create notification without revealing name
    INSERT INTO notifications (user_id, type, title, message, data)
    VALUES (NEW.liked_id, 'like', 'Someone liked you!', 
            'Someone liked your profile. Like them back to start chatting!', 
            jsonb_build_object('liker_id', NEW.liker_id));
  END IF;

  RETURN NEW;
END;
$$;