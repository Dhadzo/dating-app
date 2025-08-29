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
    <div className="no-scroll-page bg-gray-50">
      {/* Mobile Search Button - Only visible on mobile */}
      <div className="lg:hidden fixed top-16 right-4 z-40">
        <button
          onClick={() => setShowMobileSearch(true)}
          className="bg-white text-gray-700 p-3 rounded-full shadow-professional hover:shadow-professional-lg transition-all duration-200 border border-gray-100 hover:border-gray-200"
          title="Search Profiles"
        >
          <Search className="h-5 w-5 text-gray-600" />
        </button>
      </div>

      {/* Main Content */}
      <main className="py-8 px-4 sm:px-6 lg:px-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-12 gap-7">
            {/* Left Spacer - Accounts for existing navigation sidebar */}
            {/* <div className="hidden lg:block lg:col-span-1"></div> */}

            {/* Main Profile Card Area */}
            <div className="col-span-12 lg:col-span-8">
              {/* Loading State */}
              {isLoading && (
                <div className="flex flex-col justify-center items-center py-16">
                  <div className="bg-white rounded-2xl shadow-professional p-8 max-w-sm mx-auto">
                    <Loader2 className="h-10 w-10 animate-spin text-red-600 mx-auto mb-4" />
                    <p className="text-gray-600 font-medium text-center">Finding amazing profiles...</p>
                  </div>
                </div>
              )}

              {/* Error State */}
              {error && (
                <div className="text-center py-12">
                  <div className="bg-white rounded-2xl shadow-professional-lg p-8 max-w-md mx-auto border border-gray-100">
                    <X className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">
                      Something went wrong
                    </h3>
                    <p className="text-gray-600 mb-6 leading-relaxed">
                      We couldn't load profiles right now
                    </p>
                    <button
                      onClick={() => refetch()}
                      className="btn-professional bg-red-600 text-white py-3 px-6 rounded-xl font-medium hover:bg-red-700 shadow-professional hover:shadow-professional-lg"
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              )}

              {/* No Profiles State */}
              {!isLoading && !error && profiles.length === 0 && (
                <div className="text-center py-12">
                  <div className="bg-white rounded-2xl shadow-professional-lg p-8 max-w-md mx-auto border border-gray-100">
                    <Heart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">
                      No profiles available
                    </h3>
                    <p className="text-gray-600 mb-6 leading-relaxed">
                      Check back later for new profiles
                    </p>
                    <button
                      onClick={() => refetch()}
                      className="btn-professional bg-red-600 text-white py-3 px-6 rounded-xl font-medium hover:bg-red-700 shadow-professional hover:shadow-professional-lg"
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
                  <div className="text-center py-12">
                    <div className="bg-white rounded-2xl shadow-professional-lg p-8 max-w-md mx-auto border border-gray-100">
                      <Heart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-900 mb-3">
                        You've seen all profiles
                      </h3>
                      <p className="text-gray-600 mb-6 leading-relaxed">
                        Check back later for new profiles
                      </p>
                      <button
                        onClick={() => {
                          setCurrentProfileIndex(0);
                          refetch();
                        }}
                        className="btn-professional bg-red-600 text-white py-3 px-6 rounded-xl font-medium hover:bg-red-700 shadow-professional hover:shadow-professional-lg"
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
                    {/* Profile Counter - Keep this for user context */}
                    <div className="text-center mb-6">
                      <p className="text-gray-500 font-medium text-sm tracking-wide">
                        {currentProfileIndex + 1} of {profiles.length}
                      </p>
                    </div>

                    {/* Profile Card */}
                    <div className="bg-white rounded-2xl shadow-professional-xl overflow-hidden border border-gray-100 card-professional">
                      {/* Profile Image */}
                      <div
                        className="relative h-80 bg-gray-100 cursor-pointer group"
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
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
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
                          className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm text-gray-700 hover:bg-white transition-all duration-200 p-2.5 rounded-full shadow-professional hover:shadow-professional-lg disabled:opacity-50 disabled:cursor-not-allowed z-10 border border-white/20"
                        >
                          <SkipForward className="h-4 w-4 text-gray-600" />
                        </button>

                        {/* Profile Info Overlay */}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/85 via-black/50 to-transparent p-6">
                          <div className="text-white">
                            <h2 className="text-2xl font-bold mb-2 tracking-tight">
                              {currentProfile.displayName ||
                                `${currentProfile.first_name} ${currentProfile.last_name}`}
                            </h2>

                            {/* Age and Location */}
                            {currentProfile.showLocation && (
                              <div className="flex items-center text-white/95 mb-3">
                                <MapPin className="h-4 w-4 mr-2" />
                                <span className="text-sm font-medium">
                                  {currentProfile.displayLocation ||
                                    `${currentProfile.city}, ${currentProfile.state}`}
                                </span>
                              </div>
                            )}

                            {/* Bio Preview */}
                            {currentProfile.bio && (
                              <p className="text-sm text-white/95 line-clamp-2 mb-4 leading-relaxed font-normal">
                                {currentProfile.bio}
                              </p>
                            )}

                            {/* Interests Tags */}
                            {currentProfile.interests &&
                              currentProfile.interests.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-5">
                                  {currentProfile.interests
                                    .slice(0, 4)
                                    .map((interest: string, index: number) => (
                                      <span
                                        key={index}
                                        className="px-3 py-1.5 bg-white/25 backdrop-blur-sm text-white text-xs font-medium rounded-full border border-white/40 shadow-sm"
                                      >
                                        {interest}
                                      </span>
                                    ))}
                                  {currentProfile.interests.length > 4 && (
                                    <span className="px-3 py-1.5 bg-white/25 backdrop-blur-sm text-white text-xs font-medium rounded-full border border-white/40 shadow-sm">
                                      +{currentProfile.interests.length - 4}{' '}
                                      more
                                    </span>
                                  )}
                                </div>
                              )}

                            {/* Action Buttons */}
                            <div className="flex space-x-3 pt-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePass();
                                }}
                                disabled={isPassing}
                                className="flex-1 bg-white/95 backdrop-blur-sm text-gray-700 py-3.5 px-4 rounded-xl font-semibold hover:bg-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center z-10 shadow-professional hover:shadow-professional-lg border border-white/30"
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
                                className="flex-1 bg-gradient-to-r from-red-600 to-pink-600 text-white py-3.5 px-4 rounded-xl font-semibold hover:shadow-professional-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center z-10 shadow-professional"
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
                    </div>
                  </>
                )}
            </div>

            {/* Right Sidebar - Hidden on mobile and tablet */}
            <div className="hidden lg:block lg:col-span-4">
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
