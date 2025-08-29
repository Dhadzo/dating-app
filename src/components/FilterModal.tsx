import React, { useState } from 'react';
import { X, Filter } from 'lucide-react';

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyFilters: (filters: any) => void;
}

const FilterModal: React.FC<FilterModalProps> = ({ isOpen, onClose, onApplyFilters }) => {
  const [filters, setFilters] = useState({
    ageRange: [22, 35],
    maxDistance: 25,
    interests: [] as string[],
    location: ''
  });

  const availableInterests = [
    'Technology', 'Cooking', 'Travel', 'Music', 'Fitness', 'Photography',
    'Reading', 'Dancing', 'Hiking', 'Art', 'Sports', 'Movies'
  ];

  if (!isOpen) return null;

  const handleInterestToggle = (interest: string) => {
    setFilters({
      ...filters,
      interests: filters.interests.includes(interest)
        ? filters.interests.filter(i => i !== interest)
        : [...filters.interests, interest]
    });
  };

  const handleApply = () => {
    onApplyFilters(filters);
    onClose();
  };

  const handleReset = () => {
    setFilters({
      ageRange: [18, 50],
      maxDistance: 50,
      interests: [],
      location: ''
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Filter Profiles</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Age Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Age Range: {filters.ageRange[0]} - {filters.ageRange[1]}
            </label>
            <div className="space-y-2">
              <input
                type="range"
                min="18"
                max="65"
                value={filters.ageRange[0]}
                onChange={(e) => setFilters({
                  ...filters,
                  ageRange: [parseInt(e.target.value), filters.ageRange[1]]
                })}
                className="w-full"
              />
              <input
                type="range"
                min="18"
                max="65"
                value={filters.ageRange[1]}
                onChange={(e) => setFilters({
                  ...filters,
                  ageRange: [filters.ageRange[0], parseInt(e.target.value)]
                })}
                className="w-full"
              />
            </div>
          </div>

          {/* Distance */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Maximum Distance: {filters.maxDistance} miles
            </label>
            <input
              type="range"
              min="1"
              max="100"
              value={filters.maxDistance}
              onChange={(e) => setFilters({
                ...filters,
                maxDistance: parseInt(e.target.value)
              })}
              className="w-full"
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
            <input
              type="text"
              value={filters.location}
              onChange={(e) => setFilters({
                ...filters,
                location: e.target.value
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent"
              placeholder="City, State"
            />
          </div>

          {/* Interests */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Interests</label>
            <div className="grid grid-cols-2 gap-2">
              {availableInterests.map((interest) => (
                <button
                  key={interest}
                  type="button"
                  onClick={() => handleInterestToggle(interest)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filters.interests.includes(interest)
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {interest}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4 border-t border-gray-200">
            <button
              onClick={handleReset}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Reset
            </button>
            <button
              onClick={handleApply}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-xl hover:shadow-lg transition-all"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterModal;