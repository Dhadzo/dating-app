/*
  # Fix city coordinates table and function

  1. Create proper city_coordinates table
  2. Insert sample data for testing
  3. Fix the get_city_coordinates function
*/

-- Drop existing table if it exists
DROP TABLE IF EXISTS city_coordinates;

-- Create city_coordinates table
CREATE TABLE city_coordinates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  city text NOT NULL,
  state text NOT NULL,
  latitude numeric(10,8) NOT NULL,
  longitude numeric(11,8) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_city_coordinates_city ON city_coordinates(city);
CREATE INDEX idx_city_coordinates_state ON city_coordinates(state);
CREATE INDEX idx_city_coordinates_city_state ON city_coordinates(city, state);

-- Insert sample data for major US cities
INSERT INTO city_coordinates (city, state, latitude, longitude) VALUES
-- Georgia cities
('Atlanta', 'Georgia', 33.7490, -84.3880),
('Augusta', 'Georgia', 33.4735, -82.0105),
('Columbus', 'Georgia', 32.4609, -84.9877),
('Savannah', 'Georgia', 32.0835, -81.0998),
('Athens', 'Georgia', 33.9519, -83.3576),
('Sandy Springs', 'Georgia', 33.9304, -84.3733),
('Roswell', 'Georgia', 34.0232, -84.3616),
('Macon', 'Georgia', 32.8407, -83.6324),
('Johns Creek', 'Georgia', 34.0289, -84.1986),
('Albany', 'Georgia', 31.5804, -84.1557),
('Warner Robins', 'Georgia', 32.6130, -83.6243),
('Alpharetta', 'Georgia', 34.0754, -84.2941),
('Marietta', 'Georgia', 33.9526, -84.5499),
('Valdosta', 'Georgia', 30.8327, -83.2785),
('Smyrna', 'Georgia', 33.8840, -84.5144),
('Dunwoody', 'Georgia', 33.9462, -84.3346),

-- Major US cities
('New York', 'New York', 40.7128, -74.0060),
('Los Angeles', 'California', 34.0522, -118.2437),
('Chicago', 'Illinois', 41.8781, -87.6298),
('Houston', 'Texas', 29.7604, -95.3698),
('Phoenix', 'Arizona', 33.4484, -112.0740),
('Philadelphia', 'Pennsylvania', 39.9526, -75.1652),
('San Antonio', 'Texas', 29.4241, -98.4936),
('San Diego', 'California', 32.7157, -117.1611),
('Dallas', 'Texas', 32.7767, -96.7970),
('San Jose', 'California', 37.3382, -121.8863),
('Austin', 'Texas', 30.2672, -97.7431),
('Jacksonville', 'Florida', 30.3322, -81.6557),
('Fort Worth', 'Texas', 32.7555, -97.3308),
('Charlotte', 'North Carolina', 35.2271, -80.8431),
('Seattle', 'Washington', 47.6062, -122.3321),
('Denver', 'Colorado', 39.7392, -104.9903),
('El Paso', 'Texas', 31.7619, -106.4850),
('Detroit', 'Michigan', 42.3314, -83.0458),
('Washington', 'District of Columbia', 38.9072, -77.0369),
('Boston', 'Massachusetts', 42.3601, -71.0589),
('Memphis', 'Tennessee', 35.1495, -90.0490),
('Nashville', 'Tennessee', 36.1627, -86.7816),
('Portland', 'Oregon', 45.5152, -122.6784),
('Oklahoma City', 'Oklahoma', 35.4676, -97.5164),
('Las Vegas', 'Nevada', 36.1699, -115.1398),
('Louisville', 'Kentucky', 38.2527, -85.7585),
('Baltimore', 'Maryland', 39.2904, -76.6122),
('Milwaukee', 'Wisconsin', 43.0389, -87.9065),
('Albuquerque', 'New Mexico', 35.0844, -106.6504),
('Tucson', 'Arizona', 32.2226, -110.9747),
('Fresno', 'California', 36.7378, -119.7871),
('Mesa', 'Arizona', 33.4152, -111.8315),
('Sacramento', 'California', 38.5816, -121.4944),
('Kansas City', 'Missouri', 39.0997, -94.5786),
('Miami', 'Florida', 25.7617, -80.1918),
('Raleigh', 'North Carolina', 35.7796, -78.6382),
('Omaha', 'Nebraska', 41.2565, -95.9345),
('Long Beach', 'California', 33.7701, -118.1937),
('Virginia Beach', 'Virginia', 36.8529, -75.9780),
('Oakland', 'California', 37.8044, -122.2711),
('Minneapolis', 'Minnesota', 44.9778, -93.2650),
('Tulsa', 'Oklahoma', 36.1540, -95.9928),
('Arlington', 'Texas', 32.7357, -97.1081),
('Tampa', 'Florida', 27.9506, -82.4572),
('New Orleans', 'Louisiana', 29.9511, -90.0715),
('Wichita', 'Kansas', 37.6872, -97.3301),
('Cleveland', 'Ohio', 41.4993, -81.6944),
('Bakersfield', 'California', 35.3733, -119.0187),
('Aurora', 'Colorado', 39.7294, -104.8319),
('Anaheim', 'California', 33.8366, -117.9143),
('Honolulu', 'Hawaii', 21.3099, -157.8581),
('Santa Ana', 'California', 33.7455, -117.8677),
('Riverside', 'California', 33.9533, -117.3962),
('Corpus Christi', 'Texas', 27.8006, -97.3964),
('Lexington', 'Kentucky', 38.0406, -84.5037),
('Stockton', 'California', 37.9577, -121.2908),
('Henderson', 'Nevada', 36.0395, -114.9817),
('Saint Paul', 'Minnesota', 44.9537, -93.0900),
('St. Louis', 'Missouri', 38.6270, -90.1994),
('Cincinnati', 'Ohio', 39.1031, -84.5120),
('Pittsburgh', 'Pennsylvania', 40.4406, -79.9959);

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS get_city_coordinates(text, text);

-- Create function to get city coordinates
CREATE OR REPLACE FUNCTION get_city_coordinates(city_name text, state_name text)
RETURNS TABLE(lat numeric, lng numeric) AS $$
BEGIN
  RETURN QUERY
  SELECT latitude as lat, longitude as lng
  FROM city_coordinates
  WHERE LOWER(city) = LOWER(city_name) 
    AND LOWER(state) = LOWER(state_name)
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;