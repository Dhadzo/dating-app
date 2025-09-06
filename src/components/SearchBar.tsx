import React, { useState, useRef, useEffect } from 'react';
import { Search, X, MapPin, User } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useUIStore } from '../stores/useUIStore';

interface SearchResult {
  id: string;
  first_name: string;
  last_name: string;
  age: number | null;
  city: string | null;
  state: string | null;
  photos: string[];
  fullProfile: any; // Complete profile data for the modal
}

interface SearchBarProps {
  className?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({ className = '' }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const { setSelectedProfile } = useUIStore();

  // Close search when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setResults([]);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search function
  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      // Use the same privacy-respecting view as the Discover page
      const { data, error } = await supabase
        .from('privacy_respecting_profiles')
        .select('*') // Get all fields for complete profile data
        .or(
          `first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%,city.ilike.%${searchQuery}%,state.ilike.%${searchQuery}%`
        )
        .limit(5);

      if (error) {
        console.error('Search error:', error);
        setResults([]);
      } else {
        // Transform results to match SearchResult interface for display
        const transformedResults = (data || []).map((profile) => ({
          id: profile.id,
          first_name: profile.first_name,
          last_name: profile.last_name,
          age: profile.show_age ? profile.age : null,
          city: profile.show_location ? profile.city : null,
          state: profile.show_location ? profile.state : null,
          photos: profile.photos || [],
          // Store the complete profile data for the modal
          fullProfile: profile
        }));
        setResults(transformedResults);
      }
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle input change with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (query.trim()) {
        handleSearch(query);
        setIsOpen(true);
      } else {
        setResults([]);
        setIsOpen(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  const handleResultClick = (profile: SearchResult) => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
    // Pass the complete profile data to the modal
    setSelectedProfile(profile.fullProfile);
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
  };

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
        <input
          type="text"
          placeholder="Search profiles..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.trim() && setIsOpen(true)}
          className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-red-500 focus:border-red-500 bg-white text-sm transition-all"
        />
        {query && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isOpen && (results.length > 0 || isLoading) && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-gray-500">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mx-auto mb-2"></div>
              <p className="text-xs">Searching...</p>
            </div>
          ) : results.length > 0 ? (
            <div className="py-2">
              {results.map((result) => (
                <button
                  key={result.id}
                  onClick={() => handleResultClick(result)}
                  className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center space-x-3 transition-colors"
                >
                  <div className="flex-shrink-0">
                    {result.photos && result.photos.length > 0 ? (
                      <img
                        src={result.photos[0]}
                        alt={`${result.first_name} ${result.last_name}`}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                        <User className="h-4 w-4 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate text-sm">
                      {result.first_name} {result.last_name}
                    </div>
                    <div className="text-xs text-gray-500 flex items-center">
                      <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
                      {result.city && result.state
                        ? `${result.city}, ${result.state}`
                        : 'Location hidden'}
                    </div>
                  </div>
                  <div className="text-xs text-gray-400">
                    {result.age ? result.age : 'Age hidden'}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-gray-500">
              <p className="text-xs">No profiles found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
