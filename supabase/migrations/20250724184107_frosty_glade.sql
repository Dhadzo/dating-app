-- Add function to create message notifications
CREATE OR REPLACE FUNCTION create_message_notification()
RETURNS TRIGGER AS $$
DECLARE
  sender_profile profiles%ROWTYPE;
  receiver_id uuid;
BEGIN
  -- Get sender profile info
  SELECT * INTO sender_profile FROM profiles WHERE id = NEW.sender_id;
  
  -- Get the receiver ID (the other person in the match)
  SELECT 
    CASE 
      WHEN matches.user1_id = NEW.sender_id THEN matches.user2_id
      ELSE matches.user1_id
    END INTO receiver_id
  FROM matches 
  WHERE matches.id = NEW.match_id;
  
  -- Create notification for the receiver
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    data
  ) VALUES (
    receiver_id,
    'message',
    'New Message',
    sender_profile.first_name || ' sent you a message',
    jsonb_build_object(
      'match_id', NEW.match_id,
      'sender_id', NEW.sender_id,
      'sender_name', sender_profile.first_name || ' ' || sender_profile.last_name
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for message notifications
DROP TRIGGER IF EXISTS create_message_notification_trigger ON messages;
CREATE TRIGGER create_message_notification_trigger
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION create_message_notification();

-- Add location coordinates to profiles table for distance calculation
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

-- Function to calculate distance between two points using Haversine formula
CREATE OR REPLACE FUNCTION calculate_distance(
  lat1 DECIMAL, lon1 DECIMAL, 
  lat2 DECIMAL, lon2 DECIMAL
) RETURNS INTEGER AS $$
DECLARE
  earth_radius CONSTANT DECIMAL := 3959; -- Earth radius in miles
  dlat DECIMAL;
  dlon DECIMAL;
  a DECIMAL;
  c DECIMAL;
  distance DECIMAL;
BEGIN
  -- Convert degrees to radians
  dlat := RADIANS(lat2 - lat1);
  dlon := RADIANS(lon2 - lon1);
  
  -- Haversine formula
  a := SIN(dlat/2) * SIN(dlat/2) + 
       COS(RADIANS(lat1)) * COS(RADIANS(lat2)) * 
       SIN(dlon/2) * SIN(dlon/2);
  c := 2 * ATAN2(SQRT(a), SQRT(1-a));
  distance := earth_radius * c;
  
  RETURN ROUND(distance)::INTEGER;
END;
$$ LANGUAGE plpgsql;

-- Function to get approximate coordinates for a city/state
CREATE OR REPLACE FUNCTION get_city_coordinates(city_name TEXT, state_name TEXT)
RETURNS TABLE(lat DECIMAL, lng DECIMAL) AS $$
BEGIN
  -- This is a simplified version - in production you'd use a geocoding service
  -- For now, return approximate coordinates for major cities
  RETURN QUERY
  SELECT 
    CASE 
      WHEN LOWER(city_name) = 'atlanta' AND LOWER(state_name) = 'georgia' THEN 33.7490::DECIMAL
      WHEN LOWER(city_name) = 'new york' AND LOWER(state_name) = 'new york' THEN 40.7128::DECIMAL
      WHEN LOWER(city_name) = 'los angeles' AND LOWER(state_name) = 'california' THEN 34.0522::DECIMAL
      WHEN LOWER(city_name) = 'chicago' AND LOWER(state_name) = 'illinois' THEN 41.8781::DECIMAL
      WHEN LOWER(city_name) = 'houston' AND LOWER(state_name) = 'texas' THEN 29.7604::DECIMAL
      WHEN LOWER(city_name) = 'phoenix' AND LOWER(state_name) = 'arizona' THEN 33.4484::DECIMAL
      WHEN LOWER(city_name) = 'philadelphia' AND LOWER(state_name) = 'pennsylvania' THEN 39.9526::DECIMAL
      WHEN LOWER(city_name) = 'san antonio' AND LOWER(state_name) = 'texas' THEN 29.4241::DECIMAL
      WHEN LOWER(city_name) = 'san diego' AND LOWER(state_name) = 'california' THEN 32.7157::DECIMAL
      WHEN LOWER(city_name) = 'dallas' AND LOWER(state_name) = 'texas' THEN 32.7767::DECIMAL
      WHEN LOWER(city_name) = 'miami' AND LOWER(state_name) = 'florida' THEN 25.7617::DECIMAL
      WHEN LOWER(city_name) = 'boston' AND LOWER(state_name) = 'massachusetts' THEN 42.3601::DECIMAL
      WHEN LOWER(city_name) = 'seattle' AND LOWER(state_name) = 'washington' THEN 47.6062::DECIMAL
      WHEN LOWER(city_name) = 'denver' AND LOWER(state_name) = 'colorado' THEN 39.7392::DECIMAL
      WHEN LOWER(city_name) = 'washington' AND LOWER(state_name) = 'district of columbia' THEN 38.9072::DECIMAL
      ELSE 39.8283::DECIMAL -- Default to center of US
    END,
    CASE 
      WHEN LOWER(city_name) = 'atlanta' AND LOWER(state_name) = 'georgia' THEN -84.3880::DECIMAL
      WHEN LOWER(city_name) = 'new york' AND LOWER(state_name) = 'new york' THEN -74.0060::DECIMAL
      WHEN LOWER(city_name) = 'los angeles' AND LOWER(state_name) = 'california' THEN -118.2437::DECIMAL
      WHEN LOWER(city_name) = 'chicago' AND LOWER(state_name) = 'illinois' THEN -87.6298::DECIMAL
      WHEN LOWER(city_name) = 'houston' AND LOWER(state_name) = 'texas' THEN -95.3698::DECIMAL
      WHEN LOWER(city_name) = 'phoenix' AND LOWER(state_name) = 'arizona' THEN -112.0740::DECIMAL
      WHEN LOWER(city_name) = 'philadelphia' AND LOWER(state_name) = 'pennsylvania' THEN -75.1652::DECIMAL
      WHEN LOWER(city_name) = 'san antonio' AND LOWER(state_name) = 'texas' THEN -98.4936::DECIMAL
      WHEN LOWER(city_name) = 'san diego' AND LOWER(state_name) = 'california' THEN -117.1611::DECIMAL
      WHEN LOWER(city_name) = 'dallas' AND LOWER(state_name) = 'texas' THEN -96.7970::DECIMAL
      WHEN LOWER(city_name) = 'miami' AND LOWER(state_name) = 'florida' THEN -80.1918::DECIMAL
      WHEN LOWER(city_name) = 'boston' AND LOWER(state_name) = 'massachusetts' THEN -71.0589::DECIMAL
      WHEN LOWER(city_name) = 'seattle' AND LOWER(state_name) = 'washington' THEN -122.3321::DECIMAL
      WHEN LOWER(city_name) = 'denver' AND LOWER(state_name) = 'colorado' THEN -104.9903::DECIMAL
      WHEN LOWER(city_name) = 'washington' AND LOWER(state_name) = 'district of columbia' THEN -77.0369::DECIMAL
      ELSE -98.5795::DECIMAL -- Default to center of US
    END;
END;
$$ LANGUAGE plpgsql;