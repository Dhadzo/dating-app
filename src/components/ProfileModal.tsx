import React, { useState } from 'react';
import {
  X,
  MapPin,
  Heart,
  MessageCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Camera
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLikeProfile, usePassProfile } from '../hooks/useProfiles';
import { useUIStore } from '../stores/useUIStore';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: any; // Using any for now since profile structure varies
}

const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  profile
}) => {
  const { user } = useAuth();
  const { setSelectedChatMatch, setShowVideoCall } = useUIStore();

  // Photo gallery state
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  // React Query mutations
  const likeProfile = useLikeProfile();
  const passProfile = usePassProfile();

  if (!isOpen || !profile) return null;

  // Handle like action
  const handleLike = async () => {
    if (!user || !profile.id) return;

    try {
      await likeProfile.mutateAsync({
        profileId: profile.id,
        userId: user.id
      });
      onClose(); // Close modal after successful like
    } catch (error) {
      console.error('Error liking profile:', error);
    }
  };

  // Handle pass action
  const handlePass = async () => {
    if (!profile.id) return;

    try {
      await passProfile.mutateAsync({ profileId: profile.id });
      onClose(); // Close modal after successful pass
    } catch (error) {
      console.error('Error passing profile:', error);
    }
  };

  // Handle start chat (if it's a match)
  const handleStartChat = () => {
    // This would typically check if there's a match first
    // For now, we'll just close the modal
    onClose();
  };

  // Photo navigation functions
  const nextPhoto = () => {
    if (profile.photos && currentPhotoIndex < profile.photos.length - 1) {
      setCurrentPhotoIndex(currentPhotoIndex + 1);
    }
  };

  const prevPhoto = () => {
    if (currentPhotoIndex > 0) {
      setCurrentPhotoIndex(currentPhotoIndex - 1);
    }
  };

  // Reset photo index when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setCurrentPhotoIndex(0);
    }
  }, [isOpen]);

  // Get profile display data
  const displayName =
    profile.displayName ||
    (profile.first_name && profile.last_name
      ? `${profile.first_name} ${profile.last_name}`
      : 'Unknown');

  // Only show age if it's not already included in displayName and showAge is true
  const shouldShowAge =
    profile.showAge !== false &&
    profile.age &&
    !displayName.includes(profile.age.toString());
  const displayAge = shouldShowAge ? `, ${profile.age}` : '';

  const displayLocation =
    profile.displayLocation ||
    (profile.showLocation && profile.city && profile.state
      ? `${profile.city}, ${profile.state}`
      : 'Location hidden');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
      <div className="bg-white rounded-2xl max-w-sm sm:max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="relative">
          {/* Main Profile Image */}
          <div className="relative h-64 sm:h-80 bg-gray-100 rounded-t-2xl overflow-hidden">
            {profile.photos && profile.photos.length > 0 ? (
              <img
                src={profile.photos[currentPhotoIndex]}
                alt={displayName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Camera className="h-16 w-16 text-gray-400" />
              </div>
            )}

            {/* Photo Navigation Arrows */}
            {profile.photos && profile.photos.length > 1 && (
              <>
                <button
                  onClick={prevPhoto}
                  disabled={currentPhotoIndex === 0}
                  className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm rounded-full p-2 hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-5 w-5 text-gray-600" />
                </button>
                <button
                  onClick={nextPhoto}
                  disabled={currentPhotoIndex === profile.photos.length - 1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm rounded-full p-2 hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="h-5 w-5 text-gray-600" />
                </button>
              </>
            )}

            {/* Photo Counter */}
            {profile.photos && profile.photos.length > 1 && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-sm rounded-full px-3 py-1">
                <span className="text-xs font-medium text-white">
                  {currentPhotoIndex + 1} / {profile.photos.length}
                </span>
              </div>
            )}

            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 sm:top-4 sm:right-4 bg-white/90 backdrop-blur-sm rounded-full p-1.5 sm:p-2 hover:bg-white transition-colors"
            >
              <X className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600" />
            </button>

            {/* Distance Badge */}
            {profile.distance && (
              <div className="absolute top-3 left-3 sm:top-4 sm:left-4 bg-white/90 backdrop-blur-sm rounded-full px-2 sm:px-3 py-1">
                <span className="text-xs sm:text-sm font-medium text-gray-700">
                  {profile.distance}
                </span>
              </div>
            )}
          </div>

          {/* Photo Thumbnails */}
          {profile.photos && profile.photos.length > 1 && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
              <div className="flex justify-center space-x-2">
                {profile.photos.map((photo: string, index: number) => (
                  <button
                    key={index}
                    onClick={() => setCurrentPhotoIndex(index)}
                    className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                      index === currentPhotoIndex
                        ? 'border-white scale-110'
                        : 'border-white/50 hover:border-white/80'
                    }`}
                  >
                    <img
                      src={photo}
                      alt={`Photo ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Profile Header */}
          <div className="text-center sm:text-left">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              {displayName}
              {displayAge}
            </h2>
            {profile.showLocation !== false &&
              displayLocation !== 'Location hidden' && (
                <div className="flex items-center justify-center sm:justify-start text-gray-600">
                  <MapPin className="h-4 w-4 mr-2" />
                  <span className="text-base">{displayLocation}</span>
                </div>
              )}
          </div>

          {profile.bio && (
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <span className="w-2 h-2 bg-red-500 rounded-full mr-3"></span>
                About
              </h3>
              <p className="text-gray-700 leading-relaxed text-base">
                {profile.bio}
              </p>
            </div>
          )}

          {profile.interests && profile.interests.length > 0 && (
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                Interests
              </h3>
              <div className="flex flex-wrap gap-2">
                {profile.interests.map((interest: string, index: number) => (
                  <span
                    key={index}
                    className="px-3 py-2 bg-white text-gray-700 rounded-lg text-sm font-medium border border-gray-200 hover:border-gray-300 transition-colors"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Main Action Buttons */}
          <div className="flex space-x-4 pt-4">
            <button
              onClick={handlePass}
              disabled={passProfile.isPending}
              className="flex-1 bg-gray-100 text-gray-700 py-4 px-6 rounded-xl text-base font-semibold hover:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-sm hover:shadow-md"
            >
              {passProfile.isPending ? (
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
              ) : (
                <>
                  <X className="h-5 w-5 mr-2" />
                  Pass
                </>
              )}
            </button>
            <button
              onClick={handleLike}
              disabled={likeProfile.isPending}
              className="flex-1 py-4 px-6 rounded-xl text-base font-semibold transition-all flex items-center justify-center space-x-2 bg-gradient-to-r from-red-600 to-pink-600 text-white hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {likeProfile.isPending ? (
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
              ) : (
                <>
                  <Heart className="h-5 w-5 mr-2" />
                  Like
                </>
              )}
            </button>
          </div>

          {/* Additional Actions */}
          <div className="flex space-x-2 pt-2">
            <button
              onClick={handleStartChat}
              className="flex-1 bg-blue-50 text-blue-600 py-2 px-4 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors flex items-center justify-center"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Start Chat
            </button>
            <button
              onClick={() => setShowVideoCall(true)}
              className="flex-1 bg-green-50 text-green-600 py-2 px-4 rounded-lg text-sm font-medium hover:bg-green-100 transition-colors flex items-center justify-center"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Video Call
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
