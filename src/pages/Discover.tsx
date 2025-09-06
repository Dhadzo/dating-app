import React, { useState, useEffect } from 'react';
import { MapPin, Heart, X, Loader2, SkipForward, Search } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
  useDiscoverProfiles,
  useLikeProfile,
  usePassProfile
} from '../hooks/useProfiles';
import { useUserSettings } from '../hooks/useUserSettings';
import { useUIStore } from '../stores/useUIStore';

import ProfileModal from '../components/ProfileModal';
import DiscoverSidebar from '../components/DiscoverSidebar';
import MobileSearchModal from '../components/MobileSearchModal';

const Discover = () => {
  const { user } = useAuth();
  const { selectedProfile, setSelectedProfile } = useUIStore();

  // Local state for current profile index and loading states
  const [currentProfileIndex, setCurrentProfileIndex] = useState(0);
  const [isLiking, setIsLiking] = useState(false);
  const [isPassing, setIsPassing] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);

  // Temporary location filter state
  const [tempLocationFilter, setTempLocationFilter] = useState<{
    state: string;
    city: string;
  }>({ state: '', city: '' });

  // Get user settings for filtering
  const { data: userSettings } = useUserSettings(user?.id);

  // Build filters from user settings and temporary location filter
  const filters = {
    gender: userSettings?.discovery?.showMe || 'everyone',
    ageRange: userSettings?.discovery?.ageRange || [22, 35],
    // Use temporary location filter if set, otherwise fall back to user settings
    stateFilter:
      tempLocationFilter.state || userSettings?.discovery?.stateFilter || '',
    cityFilter:
      tempLocationFilter.city || userSettings?.discovery?.cityFilter || '',
    interests: userSettings?.discovery?.interests || []
  };

  // Fetch discoverable profiles using React Query
  const {
    data: profiles = [],
    isLoading,
    error,
    refetch
  } = useDiscoverProfiles(filters, user?.id);

  // Mutations for like/pass actions
  const likeProfile = useLikeProfile();
  const passProfile = usePassProfile();

  // Current profile to display
  const currentProfile = profiles[currentProfileIndex];

  // Effect to handle when profiles array changes (profiles removed)
  useEffect(() => {
    // If current index is beyond the array length, reset to the last valid index
    if (currentProfileIndex >= profiles.length && profiles.length > 0) {
      setCurrentProfileIndex(profiles.length - 1);
    }
    // If profiles array is empty, reset index to 0
    else if (profiles.length === 0) {
      setCurrentProfileIndex(0);
    }
  }, [profiles.length, currentProfileIndex]);

  // Handle temporary location filter changes
  const handleLocationFilterChange = (state: string, city: string) => {
    setTempLocationFilter({ state, city });
    // Reset profile index when filter changes
    setCurrentProfileIndex(0);
  };

  // Clear temporary location filter when navigating away from Discover page
  useEffect(() => {
    // Clear filter when component unmounts (navigating away)
    return () => {
      setTempLocationFilter({ state: '', city: '' });
    };
  }, []);

  // Handle like action
  const handleLike = async () => {
    if (!user || !currentProfile) return;

    setIsLiking(true);
    try {
      await likeProfile.mutateAsync({
        profileId: currentProfile.id,
        userId: user.id
      });

      // Move to next profile, but don't go beyond the array length
      // The profile will be removed from the array, so we need to check the new length
      setCurrentProfileIndex((prev) => {
        const newLength = profiles.length - 1; // Profile will be removed
        return prev < newLength ? prev + 1 : prev;
      });
    } catch (error) {
      console.error('Error liking profile:', error);
    } finally {
      setIsLiking(false);
    }
  };

  // Handle pass action
  const handlePass = async () => {
    if (!currentProfile) return;

    setIsPassing(true);
    try {
      await passProfile.mutateAsync({ profileId: currentProfile.id });

      // Move to next profile, but don't go beyond the array length
      // The profile will be removed from the array, so we need to check the new length
      setCurrentProfileIndex((prev) => {
        const newLength = profiles.length - 1; // Profile will be removed
        return prev < newLength ? prev + 1 : prev;
      });
    } catch (error) {
      console.error('Error passing profile:', error);
    } finally {
      setIsPassing(false);
    }
  };

  // Handle profile selection for modal
  const handleProfileClick = (profile: any) => {
    setSelectedProfile(profile);
  };

  // Handle skip to next profile
  const handleSkip = () => {
    if (currentProfileIndex < profiles.length - 1) {
      setCurrentProfileIndex((prev) => prev + 1);
    }
  };

  return (
    <div className="h-screen bg-gradient-to-br from-gray-50 to-gray-100/50 overflow-hidden">
      {/* Mobile Search Button - Only visible on mobile */}
      <div className="lg:hidden fixed top-20 right-4 z-40">
        <button
          onClick={() => setShowMobileSearch(true)}
          className="bg-white text-gray-700 p-3 rounded-full shadow-sm hover:shadow-md transition-all duration-200 border border-gray-200"
          title="Search Profiles"
        >
          <Search className="h-5 w-5 text-gray-600" />
        </button>
      </div>

      {/* Main Content */}
      <main className="h-full pt-20 pb-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="h-full grid grid-cols-12 gap-6">

            {/* Main Profile Card Area */}
            <div className="col-span-12 lg:col-span-7 flex flex-col">
              {/* Loading State */}
              {isLoading && (
                <div className="flex flex-col justify-center items-center h-full">
                  <div className="bg-white rounded-2xl p-8 max-w-sm mx-auto">
                    <Loader2 className="h-12 w-12 animate-spin text-red-600 mx-auto mb-4" />
                    <h3 className="text-gray-900 font-medium text-center mb-2">Finding profiles...</h3>
                    <p className="text-gray-600 text-center text-sm">Discovering your matches</p>
                  </div>
                </div>
              )}

              {/* Error State */}
              {error && (
                <div className="flex items-center justify-center h-full">
                  <div className="bg-white rounded-2xl p-8 max-w-sm mx-auto text-center">
                    <X className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Something went wrong
                    </h3>
                    <p className="text-gray-600 mb-6 text-sm">
                      We couldn't load profiles right now
                    </p>
                    <button
                      onClick={() => refetch()}
                      className="bg-red-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-red-700 transition-colors"
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              )}

              {/* No Profiles State */}
              {!isLoading && !error && profiles.length === 0 && (
                <div className="flex items-center justify-center h-full">
                  <div className="bg-white rounded-2xl p-8 max-w-sm mx-auto text-center">
                    <Heart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No profiles available
                    </h3>
                    <p className="text-gray-600 mb-6 text-sm">
                      Check back later for new profiles
                    </p>
                    <button
                      onClick={() => refetch()}
                      className="bg-red-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-red-700 transition-colors"
                    >
                      Refresh
                    </button>
                  </div>
                </div>
              )}

              {/* No More Profiles to Show */}
              {!isLoading &&
                !error &&
                profiles.length > 0 &&
                currentProfileIndex >= profiles.length && (
                  <div className="flex items-center justify-center h-full">
                    <div className="bg-white rounded-2xl p-8 max-w-sm mx-auto text-center">
                      <Heart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        You've seen all profiles
                      </h3>
                      <p className="text-gray-600 mb-6 text-sm">
                        Check back later for new profiles
                      </p>
                      <button
                        onClick={() => {
                          setCurrentProfileIndex(0);
                          refetch();
                        }}
                        className="bg-red-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-red-700 transition-colors"
                      >
                        Start Over
                      </button>
                    </div>
                  </div>
                )}

              {/* Profile Card - Only show when we have profiles and current index is valid */}
              {!isLoading &&
                !error &&
                profiles.length > 0 &&
                currentProfileIndex < profiles.length &&
                currentProfile && (
                  <>
                    {/* Profile Card */}
                    <div className="flex-1 flex items-center justify-center">
                      <div className="w-full max-w-md mx-auto">
                        {/* Profile Counter */}
                        <div className="text-center mb-4">
                          <div className="inline-flex items-center bg-white px-4 py-2 rounded-full border border-gray-200">
                            <div className="w-2 h-2 bg-red-500 rounded-full mr-3"></div>
                            <span className="text-gray-700 font-medium text-sm">
                              {currentProfileIndex + 1} of {profiles.length}
                            </span>
                          </div>
                        </div>
                      
                        {/* Profile Card */}
                        <div className="bg-white rounded-2xl overflow-hidden border border-gray-200">
                          {/* Profile Image */}
                          <div
                            className="relative h-96 bg-gray-100 cursor-pointer group overflow-hidden"
                            onClick={() => handleProfileClick(currentProfile)}
                          >
                            {currentProfile.photos &&
                            currentProfile.photos.length > 0 ? (
                              <img
                                src={currentProfile.photos[0]}
                                alt={currentProfile.displayName || 'Profile'}
                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gray-100">
                                <Heart className="h-16 w-16 text-gray-400" />
                              </div>
                            )}

                            {/* Skip Button - Top Right */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSkip();
                              }}
                              disabled={currentProfileIndex >= profiles.length - 1}
                              className="absolute top-4 right-4 bg-white text-gray-700 p-2 rounded-full border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <SkipForward className="h-4 w-4" />
                            </button>

                            {/* Profile Info Overlay */}
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                              <div className="text-white">
                                <h2 className="text-xl font-semibold mb-2">
                                  {currentProfile.displayName ||
                                    `${currentProfile.first_name} ${currentProfile.last_name}`}
                                </h2>

                                {/* Age and Location */}
                                {currentProfile.showLocation && (
                                  <div className="flex items-center text-white/90 mb-3">
                                    <MapPin className="h-4 w-4 mr-2" />
                                    <span className="text-sm">
                                      {currentProfile.displayLocation ||
                                        `${currentProfile.city}, ${currentProfile.state}`}
                                    </span>
                                  </div>
                                )}

                                {/* Bio Preview */}
                                {currentProfile.bio && (
                                  <p className="text-sm text-white/90 line-clamp-2 mb-3">
                                    {currentProfile.bio}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                          </div>

                          {/* Profile Details */}
                          <div className="p-6">
                            {/* Interests */}
                            {currentProfile.interests &&
                              currentProfile.interests.length > 0 && (
                                <div className="mb-4">
                                  <div className="flex flex-wrap gap-2">
                                    {currentProfile.interests
                                      .slice(0, 3)
                                      .map((interest: string, index: number) => (
                                        <span
                                          key={index}
                                          className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                                        >
                                          {interest}
                                        </span>
                                      ))}
                                    {currentProfile.interests.length > 3 && (
                                      <span className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full">
                                        +{currentProfile.interests.length - 3}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}

                            {/* Action Buttons */}
                            <div className="flex space-x-3">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePass();
                                }}
                                disabled={isPassing}
                                className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-xl font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                              >
                                {isPassing ? (
                                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                ) : (
                                  <X className="h-4 w-4 mr-2" />
                                )}
                                Pass
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleLike();
                                }}
                                disabled={isLiking}
                                className="flex-1 bg-red-600 text-white py-3 px-4 rounded-xl font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                              >
                                {isLiking ? (
                                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                ) : (
                                  <Heart className="h-4 w-4 mr-2" />
                                )}
                                Like
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                  </>
                )}
            </div>

            {/* Right Sidebar - Compact design */}
            <div className="hidden lg:block lg:col-span-5">
              <DiscoverSidebar
                onLocationFilterChange={handleLocationFilterChange}
              />
            </div>
          </div>
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

      {/* Mobile Search Modal */}
      <MobileSearchModal
        isOpen={showMobileSearch}
        onClose={() => setShowMobileSearch(false)}
      />
    </div>
  );
};

export default Discover;
