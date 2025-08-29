/*
  # Add notifications system and matching functions

  1. New Tables
    - `notifications`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to profiles)
      - `type` (text - match, like, message, etc.)
      - `title` (text)
      - `message` (text)
      - `read` (boolean, default false)
      - `data` (jsonb - additional data)
      - `created_at` (timestamp)

  2. Functions
    - Function to create notifications
    - Function to mark notifications as read

  3. Security
    - Enable RLS on notifications table
    - Add policies for users to read/update their own notifications
*/

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  read boolean DEFAULT false,
  data jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read own notifications"
  ON notifications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON notifications
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);

-- Function to create notification
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id uuid,
  p_type text,
  p_title text,
  p_message text,
  p_data jsonb DEFAULT '{}'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  notification_id uuid;
BEGIN
  INSERT INTO notifications (user_id, type, title, message, data)
  VALUES (p_user_id, p_type, p_title, p_message, p_data)
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$;

-- Function to mark notification as read
CREATE OR REPLACE FUNCTION mark_notification_read(notification_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE notifications 
  SET read = true 
  WHERE id = notification_id AND user_id = auth.uid();
END;
$$;

-- Function to mark all notifications as read for a user
CREATE OR REPLACE FUNCTION mark_all_notifications_read()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE notifications 
  SET read = true 
  WHERE user_id = auth.uid() AND read = false;
END;
$$;

-- Update the match creation trigger to create notifications
CREATE OR REPLACE FUNCTION create_match_on_mutual_like()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  mutual_like_exists boolean;
  match_id uuid;
  liker_profile profiles%ROWTYPE;
  liked_profile profiles%ROWTYPE;
BEGIN
  -- Check if there's a mutual like
  SELECT EXISTS(
    SELECT 1 FROM likes 
    WHERE liker_id = NEW.liked_id 
    AND liked_id = NEW.liker_id
  ) INTO mutual_like_exists;
  
  -- If mutual like exists, create a match
  IF mutual_like_exists THEN
    -- Get profile information
    SELECT * INTO liker_profile FROM profiles WHERE id = NEW.liker_id;
    SELECT * INTO liked_profile FROM profiles WHERE id = NEW.liked_id;
    
    -- Create match (ensure consistent ordering)
    INSERT INTO matches (user1_id, user2_id)
    VALUES (
      LEAST(NEW.liker_id, NEW.liked_id),
      GREATEST(NEW.liker_id, NEW.liked_id)
    )
    ON CONFLICT (user1_id, user2_id) DO NOTHING
    RETURNING id INTO match_id;
    
    -- Create notifications for both users if match was created
    IF match_id IS NOT NULL THEN
      -- Notification for the person who just liked
      PERFORM create_notification(
        NEW.liker_id,
        'match',
        'New Match! 🎉',
        'You and ' || liked_profile.first_name || ' ' || liked_profile.last_name || ' liked each other!',
        jsonb_build_object('match_id', match_id, 'other_user_id', NEW.liked_id)
      );
      
      -- Notification for the person who was liked
      PERFORM create_notification(
        NEW.liked_id,
        'match',
        'New Match! 🎉',
        'You and ' || liker_profile.first_name || ' ' || liker_profile.last_name || ' liked each other!',
        jsonb_build_object('match_id', match_id, 'other_user_id', NEW.liker_id)
      );
    END IF;
  ELSE
    -- Create notification for being liked
    SELECT * INTO liker_profile FROM profiles WHERE id = NEW.liker_id;
    
    PERFORM create_notification(
      NEW.liked_id,
      'like',
      'Someone liked you! ❤️',
      liker_profile.first_name || ' ' || liker_profile.last_name || ' liked your profile',
      jsonb_build_object('liker_id', NEW.liker_id)
    );
  END IF;
  
  RETURN NEW;
END;
$$;