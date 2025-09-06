import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useUserSettings } from '../hooks/useUserSettings';
import { useDiscoverProfilesPaginatedSmart } from '../hooks/useProfiles';

// Test component to demonstrate pagination functionality
const PaginationTest: React.FC = () => {
  const { user } = useAuth();
  const [pageSize, setPageSize] = useState(5); // Small page size for testing

  // Get user settings for filtering
  const { data: userSettings } = useUserSettings(user?.id);

  const filters = {
    gender: userSettings?.discovery?.showMe || 'everyone',
    ageRange: userSettings?.discovery?.ageRange || [22, 35],
    stateFilter: userSettings?.discovery?.stateFilter || '',
    cityFilter: userSettings?.discovery?.cityFilter || '',
    interests: userSettings?.discovery?.interests || []
  };

  // Use the paginated smart hook
  const {
    data: profiles = [],
    isLoading,
    error,
    loadMore,
    hasMore,
    isLoadingMore,
    refetch
  } = useDiscoverProfilesPaginatedSmart(filters, user?.id, pageSize);

  // Simple intersection observer for infinite scroll
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  // Simple intersection observer implementation
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Load more when the load more element comes into view
  useEffect(() => {
    if (inView && hasMore && !isLoadingMore) {
      loadMore();
    }
  }, [inView, hasMore, isLoadingMore, loadMore]);

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    // Refetch with new page size
    refetch();
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">
        Pagination & Advanced Caching Test
      </h2>

      {/* Controls */}
      <div className="bg-gray-100 p-4 rounded-lg mb-6">
        <div className="flex gap-4 items-center mb-4">
          <label className="font-semibold">Page Size:</label>
          <select
            value={pageSize}
            onChange={(e) => handlePageSizeChange(Number(e.target.value))}
            className="px-3 py-1 border rounded"
          >
            <option value={3}>3 profiles</option>
            <option value={5}>5 profiles</option>
            <option value={10}>10 profiles</option>
            <option value={15}>15 profiles</option>
          </select>
        </div>

        <div className="flex gap-4">
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Refresh Data
          </button>
          <button
            onClick={loadMore}
            disabled={!hasMore || isLoadingMore}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400"
          >
            {isLoadingMore ? 'Loading...' : 'Load More'}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <h3 className="font-semibold text-blue-800 mb-2">Pagination Stats</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-600">Total Profiles</p>
            <p className="font-mono text-lg">{profiles.length}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Page Size</p>
            <p className="font-mono text-lg">{pageSize}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Has More</p>
            <p className="font-mono text-lg">{hasMore ? 'Yes' : 'No'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Loading More</p>
            <p className="font-mono text-lg">{isLoadingMore ? 'Yes' : 'No'}</p>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2">Loading profiles...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-4 mb-6">
          <p className="text-red-800">Error: {error.message}</p>
        </div>
      )}

      {/* Profiles Grid */}
      {!isLoading && !error && (
        <div className="space-y-4">
          <h3 className="font-semibold">Profiles ({profiles.length} loaded)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {profiles.map((profile, index) => (
              <div key={profile.id} className="border rounded-lg p-4">
                <div className="aspect-square bg-gray-200 rounded-lg mb-3 flex items-center justify-center">
                  {profile.photos && profile.photos.length > 0 ? (
                    <img
                      src={profile.photos[0]}
                      alt={profile.displayName}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <span className="text-gray-400">No photo</span>
                  )}
                </div>
                <h4 className="font-semibold">{profile.displayName}</h4>
                <p className="text-sm text-gray-600">
                  {profile.displayLocation}
                </p>
                {profile.bio && (
                  <p className="text-sm mt-2 line-clamp-2">{profile.bio}</p>
                )}
                <p className="text-xs text-gray-400 mt-2">Index: {index}</p>
              </div>
            ))}
          </div>

          {/* Load More Trigger */}
          {hasMore && (
            <div ref={loadMoreRef} className="text-center py-8">
              {isLoadingMore ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500"></div>
                  <span className="ml-2">Loading more profiles...</span>
                </div>
              ) : (
                <p className="text-gray-500">
                  Scroll down to load more profiles
                </p>
              )}
            </div>
          )}

          {/* End of Results */}
          {!hasMore && profiles.length > 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No more profiles to load</p>
            </div>
          )}
        </div>
      )}

      {/* Instructions */}
      <div className="mt-8 bg-yellow-50 p-4 rounded-lg">
        <h3 className="font-semibold text-yellow-800 mb-2">How to Test:</h3>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>• Change page size to see different loading patterns</li>
          <li>• Scroll down to trigger infinite scroll</li>
          <li>• Click "Load More" to manually load next page</li>
          <li>
            • Check browser DevTools Network tab to see pagination requests
          </li>
          <li>• Notice how only new profiles are loaded, not all profiles</li>
        </ul>
      </div>
    </div>
  );
};

export default PaginationTest;
