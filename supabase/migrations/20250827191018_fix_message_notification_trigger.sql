-- Fix the message notification trigger function
-- The function expects NEW.receiver_id but messages table doesn't have receiver_id column
-- We need to calculate the receiver_id from the match data like the original version

CREATE OR REPLACE FUNCTION create_message_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  sender_profile profiles%ROWTYPE;
  receiver_id uuid;
BEGIN
  -- Only create notifications for new messages
  IF TG_OP = 'INSERT' THEN
    -- Get sender profile
    SELECT * INTO sender_profile FROM profiles WHERE id = NEW.sender_id;
    
    -- Calculate the receiver ID (the other person in the match)
    SELECT 
      CASE 
        WHEN matches.user1_id = NEW.sender_id THEN matches.user2_id
        ELSE matches.user1_id
      END INTO receiver_id
    FROM matches 
    WHERE matches.id = NEW.match_id;
    
    -- Create notification only if user wants message notifications
    IF should_create_notification(receiver_id, 'message') THEN
      INSERT INTO notifications (
        user_id,
        type,
        title,
        message,
        data,
        created_at
      ) VALUES (
        receiver_id,
        'message',
        'New Message 💬',
        sender_profile.first_name || ' ' || sender_profile.last_name || ' sent you a message',
        jsonb_build_object(
          'sender_id', NEW.sender_id,
          'message_id', NEW.id,
          'match_id', NEW.match_id
        ),
        NOW()
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;
