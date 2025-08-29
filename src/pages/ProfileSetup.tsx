import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Camera, Plus, X, Upload, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useProfileStore } from '../stores/useProfileStore';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useCreateUserSettings } from '../hooks/useUserSettings';

const ProfileSetup = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { setCurrentProfile } = useProfileStore();

  const [currentStep, setCurrentStep] = useState(1);
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    bio: '',
    interests: [] as string[],
    occupation: '',
    education: '',
    height: '',
    relationshipGoals: '',
    children: '',
    smoking: '',
    drinking: '',
    religion: ''
  });

  const availableInterests = [
    'Technology',
    'Cooking',
    'Travel',
    'Music',
    'Fitness',
    'Photography',
    'Reading',
    'Dancing',
    'Hiking',
    'Art',
    'Sports',
    'Movies',
    'Fashion',
    'Gaming',
    'Volunteering',
    'Business',
    'Nature',
    'Culture',
    'Food',
    'Adventure',
    'Family',
    'Career',
    'Learning',
    'Creativity'
  ];

  // React Query mutation for profile creation/update
  const createProfileMutation = useMutation({
    mutationFn: async (profileData: any) => {
      const { data, error } = await supabase
        .from('profiles')
        .upsert(profileData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      // Update local profile store
      setCurrentProfile(data);

      // Invalidate and refetch profile queries
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
    },
    onError: (error) => {
      console.error('Error creating profile:', error);
    }
  });

  // React Query mutation for user metadata update
  const updateUserMetadataMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.auth.updateUser({
        data: { profile_complete: true }
      });
      if (error) throw error;
    },
    onSuccess: () => {
      // Invalidate profile query to refresh data
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
    onError: (error) => {
      console.error('Error updating user metadata:', error);
    }
  });

  // React Query mutation for creating user settings
  const createUserSettingsMutation = useCreateUserSettings();

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach((file) => {
        if (photos.length + photoUrls.length < 6) {
          setPhotos((prev) => [...prev, file]);

          // Create preview URL
          const reader = new FileReader();
          reader.onload = (event) => {
            if (event.target?.result) {
              setPhotoUrls((prev) => [...prev, event.target!.result as string]);
            }
          };
          reader.readAsDataURL(file);
        }
      });
    }
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
    setPhotoUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleInterestToggle = (interest: string) => {
    setFormData((prev) => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter((i) => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleNext = () => {
    if (currentStep === 1 && photos.length === 0 && photoUrls.length === 0) {
      // Show error for step 1
      return;
    }
    if (currentStep === 2 && !formData.bio.trim()) {
      // Show error for step 2
      return;
    }
    if (currentStep === 3 && formData.interests.length === 0) {
      // Show error for step 3
      return;
    }

    if (currentStep < 4) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const uploadPhotos = async (): Promise<string[]> => {
    const uploadedUrls: string[] = [];

    // If no photos to upload, return empty array
    if (photos.length === 0) {
      return uploadedUrls;
    }

    for (let i = 0; i < photos.length; i++) {
      const file = photos[i];
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}/${Date.now()}-${i}.${fileExt}`;

      try {
        const { data, error } = await supabase.storage
          .from('profile-photos')
          .upload(fileName, file);

        if (error) {
          console.error('Error uploading photo:', error);
          throw error;
        }

        // Get public URL
        const {
          data: { publicUrl }
        } = supabase.storage.from('profile-photos').getPublicUrl(fileName);

        uploadedUrls.push(publicUrl);
      } catch (error) {
        console.error('Photo upload failed:', error);
        // For now, continue without this photo rather than failing completely
        continue;
      }
    }

    return uploadedUrls;
  };

  const handleSubmit = async () => {
    if (!user?.id) {
      console.error('No user ID available');
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare profile data first (without photos)
      const profileData = {
        id: user.id,
        first_name: user?.user_metadata?.first_name || '',
        last_name: user?.user_metadata?.last_name || '',
        bio: formData.bio,
        age: user?.user_metadata?.age || null,
        gender: user?.user_metadata?.gender || '',
        city: user?.user_metadata?.city || '',
        state: user?.user_metadata?.state || '',
        occupation: formData.occupation,
        education: formData.education,
        height: formData.height,
        relationship_goals: formData.relationshipGoals,
        children: formData.children,
        religion: formData.religion,
        interests: formData.interests,
        photos: [], // Will be updated after upload
        profile_complete: true
      };

      // Step 1: Upload photos first (if any)
      let uploadedPhotoUrls: string[] = [];
      if (photos.length > 0) {
        uploadedPhotoUrls = await uploadPhotos();
      }

      // Step 2: Create profile with photos
      const finalProfileData = {
        ...profileData,
        photos: uploadedPhotoUrls
      };
      await createProfileMutation.mutateAsync(finalProfileData);

      // Step 3: Create user settings (after profile exists)
      await createUserSettingsMutation.mutateAsync(user.id);

      // Step 4: Update user metadata
      await updateUserMetadataMutation.mutateAsync();

      // All operations completed successfully - navigate to discover page
      navigate('/app/discover');
    } catch (err) {
      console.error('Error saving profile:', err);
      // Error handling is managed by React Query mutations
      // User will see error state in the UI
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get loading state from mutations and our submission state
  const isLoading =
    isSubmitting ||
    createProfileMutation.isPending ||
    createUserSettingsMutation.isPending ||
    updateUserMetadataMutation.isPending;
  const error =
    createProfileMutation.error ||
    createUserSettingsMutation.error ||
    updateUserMetadataMutation.error;

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Add Your Photos
        </h2>
        <p className="text-gray-600">Show your personality with great photos</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="aspect-square relative">
            {photoUrls[index] ? (
              <div className="relative w-full h-full">
                <img
                  src={photoUrls[index]}
                  alt={`Photo ${index + 1}`}
                  className="w-full h-full object-cover rounded-xl"
                />
                <button
                  onClick={() => removePhoto(index)}
                  className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
                {index === 0 && (
                  <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                    Main Photo
                  </div>
                )}
              </div>
            ) : (
              <label className="w-full h-full border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-red-600 hover:bg-red-50 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                  multiple
                />
                {index === 0 ? (
                  <>
                    <Camera className="h-8 w-8 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-600">Main Photo</span>
                  </>
                ) : (
                  <>
                    <Plus className="h-6 w-6 text-gray-400 mb-1" />
                    <span className="text-xs text-gray-500">Add Photo</span>
                  </>
                )}
              </label>
            )}
          </div>
        ))}
      </div>

      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="font-medium text-blue-900 mb-2">Photo Tips:</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Use recent photos that clearly show your face</li>
          <li>• Include a variety: close-ups, full body, and activity shots</li>
          <li>• Smile and look approachable</li>
          <li>• Avoid group photos as your main picture</li>
        </ul>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Tell Your Story
        </h2>
        <p className="text-gray-600">Write a bio that shows your personality</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          About Me
        </label>
        <textarea
          name="bio"
          value={formData.bio}
          onChange={handleChange}
          rows={6}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-600 focus:border-transparent resize-none"
          placeholder="Tell potential matches about yourself, your interests, what you're looking for..."
        />
        <div className="text-right text-sm text-gray-500 mt-1">
          {formData.bio.length}/500
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Occupation
          </label>
          <input
            type="text"
            name="occupation"
            value={formData.occupation}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-600 focus:border-transparent"
            placeholder="Your job title"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Education
          </label>
          <input
            type="text"
            name="education"
            value={formData.education}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-600 focus:border-transparent"
            placeholder="Your education background"
          />
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Your Interests
        </h2>
        <p className="text-gray-600">Select interests that represent you</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {availableInterests.map((interest) => (
          <button
            key={interest}
            type="button"
            onClick={() => handleInterestToggle(interest)}
            className={`px-4 py-3 rounded-xl text-sm font-medium transition-all ${
              formData.interests.includes(interest)
                ? 'bg-red-600 text-white shadow-lg'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {interest}
          </button>
        ))}
      </div>

      <div className="text-center text-sm text-gray-600">
        Selected: {formData.interests.length} interests
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Additional Details
        </h2>
        <p className="text-gray-600">Help others get to know you better</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Height
          </label>
          <input
            type="text"
            name="height"
            value={formData.height}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-600 focus:border-transparent"
            placeholder={'e.g., 5\'8"'}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Looking For
          </label>
          <select
            name="relationshipGoals"
            value={formData.relationshipGoals}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-600 focus:border-transparent"
          >
            <option value="">Select...</option>
            <option value="serious">Serious Relationship</option>
            <option value="casual">Casual Dating</option>
            <option value="friendship">Friendship</option>
            <option value="marriage">Marriage</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Children
          </label>
          <select
            name="children"
            value={formData.children}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-600 focus:border-transparent"
          >
            <option value="">Select...</option>
            <option value="none">No Children</option>
            <option value="have">Have Children</option>
            <option value="want">Want Children</option>
            <option value="maybe">Maybe Children</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Religion
          </label>
          <input
            type="text"
            name="religion"
            value={formData.religion}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-600 focus:border-transparent"
            placeholder="Your religious beliefs"
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Heart className="h-8 w-8 text-red-600" />
              <span className="text-2xl font-bold text-gray-900">
                ZimConnect
              </span>
            </div>
            <div className="text-sm text-gray-600">Step {currentStep} of 4</div>
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-2 bg-gray-200 rounded-full">
            <div
              className="h-2 bg-gradient-to-r from-red-600 to-pink-600 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / 4) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm mb-6">
                <div className="flex items-center">
                  <X className="h-4 w-4 mr-2 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Profile creation failed</p>
                    <p className="text-red-500 mt-1">
                      {error instanceof Error
                        ? error.message
                        : 'An error occurred while saving your profile. Please try again.'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Step Validation Errors */}
            {currentStep === 1 &&
              photos.length === 0 &&
              photoUrls.length === 0 && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm mb-6">
                  Please add at least one photo to continue
                </div>
              )}

            {currentStep === 2 && !formData.bio.trim() && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm mb-6">
                Please write a bio to continue
              </div>
            )}

            {currentStep === 3 && formData.interests.length === 0 && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm mb-6">
                Please select at least one interest to continue
              </div>
            )}

            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
            {currentStep === 4 && renderStep4()}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
              <button
                onClick={handleBack}
                disabled={currentStep === 1}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Back
              </button>

              <button
                onClick={handleNext}
                disabled={isLoading}
                className="px-8 py-3 bg-gradient-to-r from-red-600 to-pink-500 text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    {isSubmitting ? 'Creating your profile...' : 'Saving...'}
                  </>
                ) : currentStep === 4 ? (
                  'Complete Profile'
                ) : (
                  'Next'
                )}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProfileSetup;
