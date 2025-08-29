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
    <div className="no-scroll-page bg-gradient-to-br from-gray-50 to-gray-100/50">
      {/* Mobile Search Button - Only visible on mobile */}
      <div className="lg:hidden fixed top-16 right-4 z-40">
        <button
          onClick={() => setShowMobileSearch(true)}
          className="bg-white/95 backdrop-blur-sm text-gray-700 p-3 rounded-full shadow-professional hover:shadow-professional-lg transition-all duration-300 border border-gray-100/50 hover:border-gray-200 hover:scale-105"
          title="Search Profiles"
        >
          <Search className="h-5 w-5 text-gray-600" />
        </button>
      </div>

      {/* Main Content */}
      <main className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-12 gap-8">
            {/* Left Spacer - Accounts for existing navigation sidebar */}
            {/* <div className="hidden lg:block lg:col-span-1"></div> */}

            {/* Main Profile Card Area */}
            <div className="col-span-12 lg:col-span-8 lg:pr-4">
              {/* Loading State */}
              {isLoading && (
                <div className="flex flex-col justify-center items-center py-20">
                  <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-professional-xl p-10 max-w-sm mx-auto border border-white/20">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 to-pink-500/20 rounded-full blur-xl"></div>
                      <Loader2 className="relative h-12 w-12 animate-spin text-red-600 mx-auto mb-6" />
                    </div>
                    <p className="text-gray-700 font-medium text-center text-lg">Finding amazing profiles...</p>
                    <p className="text-gray-500 text-sm text-center mt-2">Discovering your perfect matches</p>
                  </div>
                </div>
              )}

              {/* Error State */}
              {error && (
                <div className="text-center py-16">
                  <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-professional-xl p-10 max-w-md mx-auto border border-red-100/50">
                    <div className="relative mb-6">
                      <div className="absolute inset-0 bg-red-500/10 rounded-full blur-xl"></div>
                      <X className="relative h-14 w-14 text-red-500 mx-auto" />
                    </div>
                    <h3 className="text-2xl font-semibold text-gray-900 mb-4 tracking-tight">
                      Something went wrong
                    </h3>
                    <p className="text-gray-600 mb-8 leading-relaxed text-lg">
                      We couldn't load profiles right now
                    </p>
                    <button
                      onClick={() => refetch()}
                      className="btn-professional bg-gradient-to-r from-red-600 to-red-700 text-white py-4 px-8 rounded-2xl font-semibold hover:from-red-700 hover:to-red-800 shadow-professional-lg hover:shadow-professional-xl transform hover:scale-105 transition-all duration-300"
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              )}

              {/* No Profiles State */}
              {!isLoading && !error && profiles.length === 0 && (
                <div className="text-center py-16">
                  <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-professional-xl p-10 max-w-md mx-auto border border-gray-100/50">
                    <div className="relative mb-6">
                      <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-pink-500/10 rounded-full blur-xl"></div>
                      <Heart className="relative h-14 w-14 text-gray-300 mx-auto" />
                    </div>
                    <h3 className="text-2xl font-semibold text-gray-900 mb-4 tracking-tight">
                      No profiles available
                    </h3>
                    <p className="text-gray-600 mb-8 leading-relaxed text-lg">
                      Check back later for new profiles
                    </p>
                    <button
                      onClick={() => refetch()}
                      className="btn-professional bg-gradient-to-r from-red-600 to-red-700 text-white py-4 px-8 rounded-2xl font-semibold hover:from-red-700 hover:to-red-800 shadow-professional-lg hover:shadow-professional-xl transform hover:scale-105 transition-all duration-300"
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
                  <div className="text-center py-16">
                    <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-professional-xl p-10 max-w-md mx-auto border border-gray-100/50">
                      <div className="relative mb-6">
                        <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-full blur-xl"></div>
                        <Heart className="relative h-14 w-14 text-gray-300 mx-auto" />
                      </div>
                      <h3 className="text-2xl font-semibold text-gray-900 mb-4 tracking-tight">
                        You've seen all profiles
                      </h3>
                      <p className="text-gray-600 mb-8 leading-relaxed text-lg">
                        Check back later for new profiles
                      </p>
                      <button
                        onClick={() => {
                          setCurrentProfileIndex(0);
                          refetch();
                        }}
                        className="btn-professional bg-gradient-to-r from-red-600 to-red-700 text-white py-4 px-8 rounded-2xl font-semibold hover:from-red-700 hover:to-red-800 shadow-professional-lg hover:shadow-professional-xl transform hover:scale-105 transition-all duration-300"
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
                    <div className="text-center mb-8">
                      <div className="inline-flex items-center bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm border border-gray-100/50">
                        <div className="w-2 h-2 bg-gradient-to-r from-red-500 to-pink-500 rounded-full mr-3 animate-pulse"></div>
                        <p className="text-gray-600 font-medium text-sm tracking-wide">
                        {currentProfileIndex + 1} of {profiles.length}
                        </p>
                      </div>
                    </div>

                    {/* Profile Card */}
                    <div className="relative">
                      {/* Subtle background glow */}
                      <div className="absolute -inset-1 bg-gradient-to-r from-red-500/5 to-pink-500/5 rounded-3xl blur-sm"></div>
                      
                      <div className="relative bg-white rounded-3xl shadow-professional-xl overflow-hidden border border-gray-100/50 card-professional backdrop-blur-sm">
                      {/* Profile Image */}
                      <div
                        className="relative h-96 bg-gradient-to-br from-gray-50 to-gray-100 cursor-pointer group overflow-hidden"
                        onClick={() => handleProfileClick(currentProfile)}
                      >
                        {currentProfile.photos &&
                        currentProfile.photos.length > 0 ? (
                          <img
                            src={currentProfile.photos[0]}
                            alt={currentProfile.displayName || 'Profile'}
                            className="w-full h-full object-cover transition-all duration-500 group-hover:scale-110 group-hover:brightness-110"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 via-gray-100 to-gray-150">
                            <div className="relative">
                              <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 to-pink-500/20 rounded-full blur-xl"></div>
                              <Heart className="relative h-20 w-20 text-gray-400" />
                            </div>
                          </div>
                        )}

                        {/* Subtle overlay for better text readability */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                        {/* Skip Button - Top Right */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSkip();
                          }}
                          disabled={currentProfileIndex >= profiles.length - 1}
                          className="absolute top-6 right-6 bg-white/95 backdrop-blur-sm text-gray-700 hover:bg-white transition-all duration-300 p-3 rounded-full shadow-professional hover:shadow-professional-lg disabled:opacity-50 disabled:cursor-not-allowed z-10 border border-white/30 hover:scale-110"
                        >
                          <SkipForward className="h-5 w-5 text-gray-600" />
                        </button>

                        {/* Profile Info Overlay */}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-8">
                          <div className="text-white">
                            <h2 className="text-3xl font-bold mb-3 tracking-tight leading-tight">
                              {currentProfile.displayName ||
                                `${currentProfile.first_name} ${currentProfile.last_name}`}
                            </h2>

                            {/* Age and Location */}
                            {currentProfile.showLocation && (
                              <div className="flex items-center text-white/95 mb-4">
                                <div className="bg-white/20 backdrop-blur-sm rounded-full p-1.5 mr-3">
                                  <MapPin className="h-4 w-4" />
                                </div>
                                <span className="text-base font-medium">
                                  {currentProfile.displayLocation ||
                                    `${currentProfile.city}, ${currentProfile.state}`}
                                </span>
                              </div>
                            )}

                            {/* Bio Preview */}
                            {currentProfile.bio && (
                              <p className="text-base text-white/95 line-clamp-2 mb-5 leading-relaxed font-normal">
                                {currentProfile.bio}
                              </p>
                            )}

                            {/* Interests Tags */}
                            {currentProfile.interests &&
                              currentProfile.interests.length > 0 && (
                                <div className="flex flex-wrap gap-2.5 mb-6">
                                  {currentProfile.interests
                                    .slice(0, 4)
                                    .map((interest: string, index: number) => (
                                      <span
                                        key={index}
                                        className="px-4 py-2 bg-white/30 backdrop-blur-sm text-white text-sm font-medium rounded-full border border-white/50 shadow-sm hover:bg-white/40 transition-all duration-200"
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
                            <div className="flex space-x-4 pt-3">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePass();
                                }}
                                disabled={isPassing}
                                className="flex-1 bg-white/95 backdrop-blur-sm text-gray-700 py-4 px-5 rounded-2xl font-semibold hover:bg-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center z-10 shadow-professional hover:shadow-professional-lg border border-white/40 hover:scale-105"
                              >
                                {isPassing ? (
                                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                                ) : (
                                  <X className="h-5 w-5 mr-2" />
                                )}
                                Pass
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleLike();
                                }}
                                disabled={isLiking}
                                className="flex-1 bg-gradient-to-r from-red-600 to-pink-600 text-white py-4 px-5 rounded-2xl font-semibold hover:from-red-700 hover:to-pink-700 hover:shadow-professional-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center z-10 shadow-professional-lg hover:scale-105"
                              >
                                {isLiking ? (
                                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                                ) : (
                                  <Heart className="h-5 w-5 mr-2" />
                                )}
                                Like
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                      </div>
                    </div>
                  </>
                )}
            </div>

            {/* Right Sidebar - Hidden on mobile and tablet */}
            <div className="hidden lg:block lg:col-span-4 lg:pl-4">
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
