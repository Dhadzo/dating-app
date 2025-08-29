import React, { useState } from 'react';
import {
  Camera,
  Upload,
  Loader2,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useUserProfile } from '../hooks/useUserProfile';
import { supabase } from '../lib/supabase';

import EditProfileModal from '../components/EditProfileModal';

const Profile = () => {
  const { user } = useAuth();
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Use React Query hook for user profile
  const {
    data: userProfile,
    isLoading: profileLoading,
    refetch: refreshProfile
  } = useUserProfile(user?.id);

  // Photo carousel state
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  const handleEditProfileClose = () => {
    setShowEditProfile(false);
    refreshProfile(); // Refresh data when modal closes
  };

  // Photo navigation functions
  const nextPhoto = () => {
    if (
      userProfile?.photos &&
      currentPhotoIndex < userProfile.photos.length - 1
    ) {
      setCurrentPhotoIndex(currentPhotoIndex + 1);
    }
  };

  const prevPhoto = () => {
    if (currentPhotoIndex > 0) {
      setCurrentPhotoIndex(currentPhotoIndex - 1);
    }
  };

  // Reset photo index when profile data changes
  React.useEffect(() => {
    if (userProfile?.photos) {
      setCurrentPhotoIndex(0);
    }
  }, [userProfile?.photos]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploadingPhoto(true);

    try {
      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/profile-${Date.now()}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(fileName, file);

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const {
        data: { publicUrl }
      } = supabase.storage.from('profile-photos').getPublicUrl(fileName);

      // Update profile with new photo URL
      const currentPhotos = userProfile?.photos || [];
      const updatedPhotos = [
        publicUrl,
        ...currentPhotos.filter((photo) => photo !== publicUrl)
      ];

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          photos: updatedPhotos,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) {
        throw updateError;
      }

      // Refresh profile data
      refreshProfile();
    } catch (error) {
      console.error('Error uploading photo:', error);
      alert('Failed to upload photo. Please try again.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Handle photo deletion
  const handlePhotoDelete = async (photoUrl: string) => {
    if (!user || !userProfile?.photos) return;

    try {
      // Remove photo from profile
      const updatedPhotos = userProfile.photos.filter(
        (photo) => photo !== photoUrl
      );

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          photos: updatedPhotos,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) {
        throw updateError;
      }

      // Reset photo index if we're viewing the deleted photo
      if (currentPhotoIndex >= updatedPhotos.length) {
        setCurrentPhotoIndex(Math.max(0, updatedPhotos.length - 1));
      }

      // Refresh profile data
      refreshProfile();
    } catch (error) {
      console.error('Error deleting photo:', error);
      alert('Failed to delete photo. Please try again.');
    }
  };

  if (profileLoading) {
    return (
      <div className="no-scroll-page bg-gray-50">
        <main className="py-8 px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto">
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-12 w-12 animate-spin text-red-600" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Current user data from profile or fallback
  const currentUser = userProfile
    ? {
        name:
          `${userProfile.first_name || ''} ${
            userProfile.last_name || ''
          }`.trim() || 'User',
        age: userProfile.age || 'Age not set',
        location:
          userProfile.city && userProfile.state
            ? `${userProfile.city}, ${userProfile.state}`
            : userProfile.city || userProfile.state || 'Location not set',
        avatar:
          userProfile.photos?.[0] ||
          'https://images.pexels.com/photos/3394659/pexels-photo-3394659.jpeg?auto=compress&cs=tinysrgb&w=150',
        bio: userProfile.bio || 'No bio available',
        interests: userProfile.interests || []
      }
    : {
        name:
          user?.user_metadata?.first_name && user?.user_metadata?.last_name
            ? `${user.user_metadata.first_name} ${user.user_metadata.last_name}`
            : user?.email?.split('@')[0] || 'User',
        age: user?.user_metadata?.age || 'Age not set',
        location:
          user?.user_metadata?.city && user?.user_metadata?.state
            ? `${user.user_metadata.city}, ${user.user_metadata.state}`
            : user?.user_metadata?.city ||
              user?.user_metadata?.state ||
              'Location not set',
        avatar:
          'https://images.pexels.com/photos/3394659/pexels-photo-3394659.jpeg?auto=compress&cs=tinysrgb&w=150',
        bio: 'Complete your profile to add a bio',
        interests: []
      };

  return (
    <div className="no-scroll-page bg-gray-50">
      {/* Main Content */}
      <main className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            {/* Enhanced Photo Carousel */}
            <div className="relative h-64 bg-gradient-to-r from-red-600 to-pink-500">
              {/* Main Photo Display */}
              <div className="relative h-full">
                {userProfile?.photos && userProfile.photos.length > 0 ? (
                  <img
                    src={userProfile.photos[currentPhotoIndex]}
                    alt={`${currentUser.name} - Photo ${currentPhotoIndex + 1}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Camera className="h-16 w-16 text-white/60" />
                  </div>
                )}

                {/* Photo Navigation Arrows */}
                {userProfile?.photos && userProfile.photos.length > 1 && (
                  <>
                    <button
                      onClick={prevPhoto}
                      disabled={currentPhotoIndex === 0}
                      className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm rounded-full p-2 hover:bg-white transition-all disabled:opacity-50 disabled:cursor-not-allowed z-10"
                    >
                      <ChevronLeft className="h-5 w-5 text-gray-600" />
                    </button>
                    <button
                      onClick={nextPhoto}
                      disabled={
                        currentPhotoIndex === userProfile.photos.length - 1
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm rounded-full p-2 hover:bg-white transition-all disabled:opacity-50 disabled:cursor-not-allowed z-10"
                    >
                      <ChevronRight className="h-5 w-5 text-gray-600" />
                    </button>
                  </>
                )}

                {/* Photo Counter */}
                {userProfile?.photos && userProfile.photos.length > 1 && (
                  <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-sm rounded-full px-3 py-1">
                    <span className="text-xs font-medium text-white">
                      {currentPhotoIndex + 1} / {userProfile.photos.length}
                    </span>
                  </div>
                )}

                {/* Add Photo Button */}
                <label className="absolute bottom-4 right-4 bg-white rounded-full p-3 shadow-lg cursor-pointer hover:bg-gray-50 transition-colors z-10">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                    disabled={uploadingPhoto}
                  />
                  {uploadingPhoto ? (
                    <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                  ) : (
                    <Camera className="h-5 w-5 text-gray-600" />
                  )}
                </label>
              </div>

              {/* User Info Overlay */}
              <div className="absolute bottom-4 left-6 text-white">
                <h2 className="text-2xl font-bold mb-1">{currentUser.name}</h2>
                <p className="text-pink-100">
                  {currentUser.age} • {currentUser.location}
                </p>
              </div>
            </div>

            {/* Photo Thumbnails */}
            {userProfile?.photos && userProfile.photos.length > 0 && (
              <div className="p-4 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-700">Photos</h3>
                  <span className="text-xs text-gray-500">
                    {userProfile.photos.length} photo
                    {userProfile.photos.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="flex space-x-3 overflow-x-auto pb-2">
                  {userProfile.photos.map((photo, index) => (
                    <div key={index} className="relative flex-shrink-0">
                      <button
                        onClick={() => setCurrentPhotoIndex(index)}
                        className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                          index === currentPhotoIndex
                            ? 'border-red-500 scale-105'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <img
                          src={photo}
                          alt={`Photo ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>

                      {/* Delete Button */}
                      <button
                        onClick={() => handlePhotoDelete(photo)}
                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center hover:bg-red-600 transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  About Me
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {currentUser.bio}
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Interests
                </h3>
                <div className="flex flex-wrap gap-2">
                  {currentUser.interests.map((interest, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-red-50 text-red-600 rounded-full text-sm"
                    >
                      {interest}
                    </span>
                  ))}
                  {currentUser.interests.length === 0 && (
                    <span className="text-gray-500 text-sm">
                      No interests added yet
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <button
                  className="w-full bg-gradient-to-r from-red-600 to-pink-500 text-white py-3 px-4 rounded-xl font-medium hover:shadow-lg transition-all"
                  onClick={() => setShowEditProfile(true)}
                >
                  Edit Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modals */}
      {userProfile && (
        <EditProfileModal
          isOpen={showEditProfile}
          onClose={handleEditProfileClose}
          currentUser={currentUser}
        />
      )}
    </div>
  );
};

export default Profile;
