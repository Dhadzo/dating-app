import React, { useState, useRef, useEffect } from 'react';
import { MapPin, ChevronDown, Check, X } from 'lucide-react';
import { useStates, useCitiesByState } from '../hooks/useLocation';

interface LocationIndicatorProps {
  className?: string;
  onLocationChange?: (state: string, city: string) => void;
}

const LocationIndicator: React.FC<LocationIndicatorProps> = ({
  className = '',
  onLocationChange
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tempState, setTempState] = useState('');
  const [tempCity, setTempCity] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get location data
  const { data: states = [] } = useStates();
  const { data: cities = [] } = useCitiesByState(tempState);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get current temporary location
  const currentLocation =
    tempState && tempCity
      ? `${tempCity}, ${tempState}`
      : tempState
      ? tempState
      : 'All locations';

  const handleLocationChange = (newState: string, newCity: string) => {
    setTempState(newState);
    setTempCity(newCity);
    setIsOpen(false);

    // Notify parent component of the change
    if (onLocationChange) {
      onLocationChange(newState, newCity);
    }
  };

  const clearLocationFilter = () => {
    setTempState('');
    setTempCity('');

    // Notify parent component to clear the filter
    if (onLocationChange) {
      onLocationChange('', '');
    }
  };

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <div className="flex items-center space-x-1">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center space-x-1 px-3 py-2 text-sm rounded-lg transition-colors ${
            tempState || tempCity
              ? 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <MapPin className="h-4 w-4" />
          <span className="hidden sm:inline truncate max-w-32">
            {currentLocation}
          </span>
          <ChevronDown
            className={`h-3 w-3 transition-transform ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        {/* Clear button - only show when filter is active */}
        {(tempState || tempCity) && (
          <button
            onClick={clearLocationFilter}
            className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded transition-colors"
            title="Clear location filter"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Location Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-72 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="p-3 border-b border-gray-100">
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-medium text-gray-900">
                Filter by Location
              </h3>
              <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
                Temporary
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Filter profiles by location (clears when you leave this page)
            </p>
          </div>

          <div className="max-h-64 overflow-y-auto">
            {/* Popular States */}
            <div className="p-2">
              <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                Popular States
              </h4>
              <div className="space-y-1">
                {['Georgia', 'California', 'Texas', 'New York', 'Florida'].map(
                  (state) => (
                    <button
                      key={state}
                      onClick={() => handleLocationChange(state, '')}
                      className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 rounded flex items-center justify-between"
                    >
                      <span>{state}</span>
                      {tempState === state && !tempCity && (
                        <Check className="h-4 w-4 text-green-600" />
                      )}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Cities in selected state */}
            {tempState && cities.length > 0 && (
              <div className="p-2 border-t border-gray-100">
                <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                  Cities in {tempState}
                </h4>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {cities.slice(0, 10).map((city) => (
                    <button
                      key={city}
                      onClick={() => handleLocationChange(tempState, city)}
                      className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 rounded flex items-center justify-between"
                    >
                      <span>{city}</span>
                      {tempCity === city && (
                        <Check className="h-4 w-4 text-green-600" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="p-3 border-t border-gray-100">
            <button
              onClick={clearLocationFilter}
              className="w-full text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Clear location filter
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationIndicator;
