import React, { useState, useEffect } from 'react';
import { X, Camera, Plus, Loader2, MapPin } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useProfileStore } from '../stores/useProfileStore';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useStates, useCitiesByState } from '../hooks/useLocation';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: {
    name: string;
    age: number;
    location: string;
    avatar: string;
    bio?: string;
    interests?: string[];
  };
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser
}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { setCurrentProfile } = useProfileStore();

  // Parse name and location from currentUser
  const nameParts = currentUser?.name?.split(' ') || [];
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';
  const locationParts = currentUser?.location?.split(', ') || [];
  const city = locationParts[0] || '';
  const state = locationParts[1] || '';

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    age: '',
    city: '',
    state: '',
    bio: '',
    interests: [] as string[]
  });

  const [newInterest, setNewInterest] = useState('');

  // Location hooks
  const { data: states = [] } = useStates();
  const { data: cities = [] } = useCitiesByState(formData.state);

  // Reset city when state changes (only if current city is not in the new state's cities)
  useEffect(() => {
    if (formData.state && formData.city && !cities.includes(formData.city)) {
      setFormData((prev) => ({ ...prev, city: '' }));
    }
  }, [formData.state, cities, formData.city]);

  // React Query mutation for profile update
  const updateProfileMutation = useMutation({
    mutationFn: async (profileData: any) => {
      const { data, error } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', user?.id)
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

      // Close modal on success
      onClose();
    },
    onError: (error) => {
      console.error('Error updating profile:', error);
    }
  });

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen && currentUser) {
      const nameParts = currentUser.name?.split(' ') || [];
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      const locationParts = currentUser.location?.split(', ') || [];
      const city = locationParts[0] || '';
      const state = locationParts[1] || '';

      setFormData({
        firstName: firstName,
        lastName: lastName,
        age: currentUser.age?.toString() || '',
        city: city,
        state: state,
        bio: currentUser.bio || '',
        interests: currentUser.interests || []
      });
    }
  }, [isOpen, currentUser]);

  if (!isOpen || !currentUser) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    try {
      // Get coordinates for the city/state
      let latitude = null;
      let longitude = null;

      if (formData.city && formData.state) {
        try {
          console.log(
            'Getting coordinates for:',
            formData.city,
            formData.state
          );

          const { data: coordsData, error: coordsError } = await supabase
            .from('city_coordinates')
            .select('latitude, longitude')
            .ilike('city', formData.city)
            .ilike('state', formData.state)
            .limit(1)
            .single();

          console.log('Coordinates result:', coordsData, 'Error:', coordsError);

          if (!coordsError && coordsData) {
            latitude = parseFloat(coordsData.latitude);
            longitude = parseFloat(coordsData.longitude);
            console.log('Set coordinates:', { latitude, longitude });
          }
        } catch (error) {
          console.error('Error getting coordinates:', error);
        }
      }

      // Prepare profile data
      const profileData = {
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),
        age: parseInt(formData.age),
        city: formData.city.trim(),
        state: formData.state.trim(),
        bio: formData.bio.trim(),
        interests: formData.interests,
        latitude,
        longitude,
        updated_at: new Date().toISOString()
      };

      // Update profile using React Query mutation
      await updateProfileMutation.mutateAsync(profileData);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const handleInterestAdd = () => {
    if (
      newInterest.trim() &&
      !formData.interests.includes(newInterest.trim())
    ) {
      setFormData((prev) => ({
        ...prev,
        interests: [...prev.interests, newInterest.trim()]
      }));
      setNewInterest('');
    }
  };

  const handleInterestRemove = (interestToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      interests: prev.interests.filter(
        (interest) => interest !== interestToRemove
      )
    }));
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  // Get loading and error states from mutation
  const isLoading = updateProfileMutation.isPending;
  const error = updateProfileMutation.error;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Edit Profile</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-6 w-6 text-gray-600" />
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mx-6 mt-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
            {error instanceof Error
              ? error.message
              : 'An error occurred while updating your profile'}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                First Name
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-600 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Last Name
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-600 focus:border-transparent"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Age
              </label>
              <input
                type="number"
                name="age"
                value={formData.age}
                onChange={handleInputChange}
                min="18"
                max="100"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-600 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                State
              </label>
              <select
                name="state"
                value={formData.state}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-600 focus:border-transparent"
                required
              >
                <option value="">Select State</option>
                {states.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              City
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MapPin className="h-5 w-5 text-gray-400" />
              </div>
              <select
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-600 focus:border-transparent"
                required
              >
                <option value="">
                  {formData.state ? 'Select City' : 'All Cities'}
                </option>
                {cities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bio
            </label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleInputChange}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-600 focus:border-transparent resize-none"
              placeholder="Tell others about yourself..."
            />
          </div>

          {/* Interests */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Interests
            </label>
            <div className="flex space-x-2 mb-3">
              <input
                type="text"
                value={newInterest}
                onChange={(e) => setNewInterest(e.target.value)}
                placeholder="Add an interest..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent"
                onKeyPress={(e) =>
                  e.key === 'Enter' && (e.preventDefault(), handleInterestAdd())
                }
              />
              <button
                type="button"
                onClick={handleInterestAdd}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {formData.interests.map((interest, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-red-50 text-red-600 rounded-full text-sm flex items-center space-x-1"
                >
                  <span>{interest}</span>
                  <button
                    type="button"
                    onClick={() => handleInterestRemove(interest)}
                    className="ml-1 hover:text-red-800"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-3 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Updating...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfileModal;
