/*
  # Optimize Profile Discovery Queries - Phase 1
  
  This migration adds database indexes to optimize the profile discovery queries
  for better performance when scaling to 500+ users.
  
  Indexes added:
  1. Composite index for gender + age filtering
  2. Composite index for location filtering  
  3. Index for profile completion status
  4. Index for created_at ordering
  5. Composite index for likes queries
*/

-- Index for gender and age filtering (most common filters)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_gender_age_complete 
ON profiles(gender, age, profile_complete) 
WHERE profile_complete = true;

-- Index for location filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_state_city_complete 
ON profiles(state, city, profile_complete) 
WHERE profile_complete = true;

-- Index for created_at ordering (for discovery sorting)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_created_at_complete 
ON profiles(created_at DESC, profile_complete) 
WHERE profile_complete = true;

-- Composite index for likes queries (liker_id + liked_id)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_likes_liker_liked 
ON likes(liker_id, liked_id);

-- Index for likes by liker_id (for excluding already liked profiles)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_likes_liker_id 
ON likes(liker_id);

-- Index for user_settings privacy queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_settings_user_id 
ON user_settings(user_id);

-- Add comment explaining the optimization
COMMENT ON INDEX idx_profiles_gender_age_complete IS 'Optimizes profile discovery queries with gender and age filters';
COMMENT ON INDEX idx_profiles_state_city_complete IS 'Optimizes profile discovery queries with location filters';
COMMENT ON INDEX idx_profiles_created_at_complete IS 'Optimizes profile discovery queries with date ordering';
COMMENT ON INDEX idx_likes_liker_liked IS 'Optimizes likes queries for mutual like detection';
COMMENT ON INDEX idx_likes_liker_id IS 'Optimizes queries to exclude already liked profiles';
