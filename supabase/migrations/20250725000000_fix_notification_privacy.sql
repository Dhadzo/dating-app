-- Fix notification and privacy settings enforcement
-- This migration ensures that notifications respect user preferences
-- and privacy settings are properly enforced

-- Function to check if user wants notifications for a specific type
CREATE OR REPLACE FUNCTION should_create_notification(
  p_user_id uuid,
  p_type text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_notifications jsonb;
BEGIN
  -- Get user's notification preferences
  SELECT notifications INTO user_notifications
  FROM user_settings
  WHERE user_id = p_user_id
  LIMIT 1;
  
  -- If no settings found, default to true (allow notifications)
  IF user_notifications IS NULL THEN
    RETURN true;
  END IF;
  
  -- Check specific notification type
  CASE p_type
    WHEN 'like' THEN
      RETURN COALESCE(user_notifications->>'likes', 'true')::boolean;
    WHEN 'match' THEN
      RETURN COALESCE(user_notifications->>'newMatches', 'true')::boolean;
    WHEN 'message' THEN
      RETURN COALESCE(user_notifications->>'messages', 'true')::boolean;
    ELSE
      RETURN true; -- Default to allowing notifications for unknown types
  END CASE;
END;
$$;

-- Function to get privacy-respecting profile data
CREATE OR REPLACE FUNCTION get_privacy_respecting_profile(
  p_profile_id uuid,
  p_viewer_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  profile_data jsonb;
  privacy_settings jsonb;
BEGIN
  -- Get profile data
  SELECT to_jsonb(p.*) INTO profile_data
  FROM profiles p
  WHERE p.id = p_profile_id;
  
  -- Get privacy settings
  SELECT privacy INTO privacy_settings
  FROM user_settings
  WHERE user_id = p_profile_id
  LIMIT 1;
  
  -- If no privacy settings, return default (show everything)
  IF privacy_settings IS NULL THEN
    RETURN profile_data;
  END IF;
  
  -- Apply privacy settings
  IF COALESCE(privacy_settings->>'showAge', 'true')::boolean = false THEN
    profile_data = profile_data - 'age';
  END IF;
  
  IF COALESCE(privacy_settings->>'showLocation', 'true')::boolean = false THEN
    profile_data = profile_data - 'city';
    profile_data = profile_data - 'state';
  END IF;
  
  IF COALESCE(privacy_settings->>'showOnline', 'true')::boolean = false THEN
    profile_data = profile_data - 'last_seen';
    profile_data = profile_data - 'is_online';
  END IF;
  
  RETURN profile_data;
END;
$$;

-- Update the match creation trigger to respect notification preferences
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
    
    -- Create notifications for both users if match was created (respecting preferences)
    IF match_id IS NOT NULL THEN
      -- Notification for the person who just liked
      IF should_create_notification(NEW.liker_id, 'match') THEN
        PERFORM create_notification(
          NEW.liker_id,
          'match',
          'New Match! 🎉',
          'You and ' || liked_profile.first_name || ' ' || liked_profile.last_name || ' liked each other!',
          jsonb_build_object('match_id', match_id, 'other_user_id', NEW.liked_id)
        );
      END IF;
      
      -- Notification for the person who was liked
      IF should_create_notification(NEW.liked_id, 'match') THEN
        PERFORM create_notification(
          NEW.liked_id,
          'match',
          'New Match! 🎉',
          'You and ' || liker_profile.first_name || ' ' || liker_profile.last_name || ' liked each other!',
          jsonb_build_object('match_id', match_id, 'other_user_id', NEW.liker_id)
        );
      END IF;
    END IF;
  ELSE
    -- Create notification for being liked (respecting preferences)
    IF should_create_notification(NEW.liked_id, 'like') THEN
      SELECT * INTO liker_profile FROM profiles WHERE id = NEW.liker_id;
      
      PERFORM create_notification(
        NEW.liked_id,
        'like',
        'Someone liked you! ❤️',
        liker_profile.first_name || ' ' || liker_profile.last_name || ' liked your profile',
        jsonb_build_object('liker_id', NEW.liker_id)
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Update message notification function to respect preferences
CREATE OR REPLACE FUNCTION create_message_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  sender_profile profiles%ROWTYPE;
BEGIN
  -- Only create notifications for new messages
  IF TG_OP = 'INSERT' THEN
    -- Get sender profile
    SELECT * INTO sender_profile FROM profiles WHERE id = NEW.sender_id;
    
    -- Create notification only if user wants message notifications
    IF should_create_notification(NEW.receiver_id, 'message') THEN
      INSERT INTO notifications (
        user_id,
        type,
        title,
        message,
        data,
        created_at
      ) VALUES (
        NEW.receiver_id,
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

-- Create a view for privacy-respecting profile discovery
CREATE OR REPLACE VIEW privacy_respecting_profiles AS
SELECT 
  p.id,
  p.first_name,
  p.last_name,
  p.profile_complete,
  p.created_at,
  p.updated_at,
  -- Apply privacy settings
  CASE 
    WHEN COALESCE(us.privacy->>'showAge', 'true')::boolean THEN p.age 
    ELSE NULL 
  END as age,
  CASE 
    WHEN COALESCE(us.privacy->>'showLocation', 'true')::boolean THEN p.city 
    ELSE NULL 
  END as city,
  CASE 
    WHEN COALESCE(us.privacy->>'showLocation', 'true')::boolean THEN p.state 
    ELSE NULL 
  END as state,
  p.bio,
  p.interests,
  p.photos,
  p.gender,
  -- Privacy flags for frontend use
  COALESCE(us.privacy->>'showAge', 'true')::boolean as show_age,
  COALESCE(us.privacy->>'showLocation', 'true')::boolean as show_location,
  COALESCE(us.privacy->>'showOnline', 'true')::boolean as show_online
FROM profiles p
LEFT JOIN user_settings us ON p.id = us.user_id
WHERE p.profile_complete = true;

-- Grant access to the view
GRANT SELECT ON privacy_respecting_profiles TO authenticated;
