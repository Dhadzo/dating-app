import React from 'react';
import { Heart, Zap, Users, X, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLikedProfiles, useUnlikeProfile } from '../hooks/useProfiles';
import { useUIStore } from '../stores/useUIStore';
import ProfileModal from '../components/ProfileModal';

const Likes = () => {
  const { user } = useAuth();
  const { selectedProfile, setSelectedProfile } = useUIStore();

  // React Query hooks for data fetching
  const {
    data: likedProfiles = [],
    isLoading,
    error,
    refetch
  } = useLikedProfiles(user?.id);

  // Unlike profile mutation
  const unlikeProfile = useUnlikeProfile();

  const handleUnlike = async (profileId: string) => {
    if (!user) return;

    try {
      await unlikeProfile.mutateAsync({
        profileId,
        userId: user.id
      });

      // The mutation will automatically update the cache
      // No need to manually update local state
    } catch (error) {
      console.error('Error unliking profile:', error);
      // Could add toast notification here
    }
  };

  const handleProfileClick = (profile: any) => {
    setSelectedProfile(profile);
  };

  // Transform profiles for display
  const transformedProfiles = likedProfiles.map((like) => ({
    id: like.liked_id,
    name:
      like.liked_profile.displayName ||
      `${like.liked_profile.first_name} ${like.liked_profile.last_name}`,
    age: like.liked_profile.showAge ? like.liked_profile.age : null,
    location: like.liked_profile.displayLocation || 'Location hidden',
    avatar:
      like.liked_profile.photos && like.liked_profile.photos.length > 0
        ? like.liked_profile.photos[0]
        : 'https://images.pexels.com/photos/3394659/pexels-photo-3394659.jpeg?auto=compress&cs=tinysrgb&w=400',
    bio: like.liked_profile.bio || 'No bio available',
    interests: like.liked_profile.interests || [],
    likedAt: new Date(like.created_at).toLocaleDateString(),
    // Add the full profile data for modal
    profile: like.liked_profile
  }));

  return (
    <div className="no-scroll-page bg-gray-50">
      {/* Main Content */}
      <main className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              People You've Liked
            </h2>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-12 w-12 animate-spin text-red-600" />
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="text-center py-12">
              <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md mx-auto">
                <X className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Something went wrong
                </h3>
                <p className="text-gray-600 mb-4">
                  We couldn't load your liked profiles
                </p>
                <button
                  onClick={() => refetch()}
                  className="bg-red-600 text-white py-3 px-6 rounded-xl font-medium hover:bg-red-700 transition-all"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}

          {/* Liked Profiles Grid */}
          {!isLoading && !error && transformedProfiles.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {transformedProfiles.map((profile) => (
                <div
                  key={profile.id}
                  className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 cursor-pointer"
                  onClick={() => handleProfileClick(profile.profile)}
                >
                  <div className="relative">
                    <img
                      src={profile.avatar}
                      alt={profile.name}
                      className="w-full h-48 object-cover"
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUnlike(profile.id);
                      }}
                      disabled={unlikeProfile.isPending}
                      className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm rounded-full p-1.5 hover:bg-white transition-colors disabled:opacity-50"
                    >
                      {unlikeProfile.isPending ? (
                        <Loader2 className="h-3 w-3 animate-spin text-gray-600" />
                      ) : (
                        <X className="h-3 w-3 text-gray-600" />
                      )}
                    </button>
                  </div>

                  <div className="p-3">
                    <h3 className="text-sm font-semibold text-gray-900 truncate mb-1">
                      {profile.name}
                    </h3>
                    <p className="text-xs text-gray-500">
                      Liked on {profile.likedAt}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !error && transformedProfiles.length === 0 && (
            <div className="text-center py-12">
              <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md mx-auto">
                <Heart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No likes yet
                </h3>
                <p className="text-gray-600 mb-4">
                  Start exploring profiles and like people you're interested in!
                </p>
                <button
                  onClick={() => (window.location.href = '/discover')}
                  className="bg-gradient-to-r from-red-600 to-pink-600 text-white py-3 px-6 rounded-xl font-medium hover:shadow-lg transition-all"
                >
                  Start Discovering
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Profile Modal */}
      {selectedProfile && (
        <ProfileModal
          isOpen={!!selectedProfile}
          onClose={() => setSelectedProfile(null)}
          profile={selectedProfile}
        />
      )}
    </div>
  );
};

export default Likes;
