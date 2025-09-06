import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useUserSettings } from '../hooks/useUserSettings';
import { useDiscoverProfiles } from '../hooks/useProfiles';
import { useDiscoverProfilesOptimized } from '../hooks/useProfiles';

// Test component to compare old vs optimized profile discovery
const ProfileDiscoveryTest: React.FC = () => {
  const { user } = useAuth();
  const [testMode, setTestMode] = useState<'old' | 'optimized'>('old');
  const [performanceMetrics, setPerformanceMetrics] = useState<{
    old: { startTime: number; endTime: number; duration: number } | null;
    optimized: { startTime: number; endTime: number; duration: number } | null;
  }>({ old: null, optimized: null });

  // Get user settings for filtering
  const { data: userSettings } = useUserSettings(user?.id);

  const filters = {
    gender: userSettings?.discovery?.showMe || 'everyone',
    ageRange: userSettings?.discovery?.ageRange || [22, 35],
    stateFilter: userSettings?.discovery?.stateFilter || '',
    cityFilter: userSettings?.discovery?.cityFilter || '',
    interests: userSettings?.discovery?.interests || []
  };

  // Old hook
  const {
    data: oldProfiles = [],
    isLoading: oldLoading,
    error: oldError,
    refetch: refetchOld
  } = useDiscoverProfiles(filters, user?.id);

  // Optimized hook
  const {
    data: optimizedProfiles = [],
    isLoading: optimizedLoading,
    error: optimizedError,
    refetch: refetchOptimized
  } = useDiscoverProfilesOptimized(filters, user?.id);

  const runPerformanceTest = async (mode: 'old' | 'optimized') => {
    const startTime = performance.now();

    if (mode === 'old') {
      await refetchOld();
    } else {
      await refetchOptimized();
    }

    const endTime = performance.now();
    const duration = endTime - startTime;

    setPerformanceMetrics((prev) => ({
      ...prev,
      [mode]: { startTime, endTime, duration }
    }));
  };

  const currentProfiles = testMode === 'old' ? oldProfiles : optimizedProfiles;
  const currentLoading = testMode === 'old' ? oldLoading : optimizedLoading;
  const currentError = testMode === 'old' ? oldError : optimizedError;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">
        Profile Discovery Performance Test
      </h2>

      {/* Test Controls */}
      <div className="bg-gray-100 p-4 rounded-lg mb-6">
        <div className="flex gap-4 mb-4">
          <button
            onClick={() => setTestMode('old')}
            className={`px-4 py-2 rounded ${
              testMode === 'old'
                ? 'bg-blue-500 text-white'
                : 'bg-white text-gray-700 border'
            }`}
          >
            Test Original Query
          </button>
          <button
            onClick={() => setTestMode('optimized')}
            className={`px-4 py-2 rounded ${
              testMode === 'optimized'
                ? 'bg-green-500 text-white'
                : 'bg-white text-gray-700 border'
            }`}
          >
            Test Optimized Query
          </button>
        </div>

        <div className="flex gap-4">
          <button
            onClick={() => runPerformanceTest('old')}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Test Original Performance
          </button>
          <button
            onClick={() => runPerformanceTest('optimized')}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Test Optimized Performance
          </button>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-2">Original Query</h3>
          {performanceMetrics.old ? (
            <div>
              <p>
                Duration:{' '}
                <span className="font-mono">
                  {performanceMetrics.old.duration.toFixed(2)}ms
                </span>
              </p>
              <p>
                Profiles loaded:{' '}
                <span className="font-mono">{oldProfiles.length}</span>
              </p>
            </div>
          ) : (
            <p className="text-gray-500">
              Click "Test Original Performance" to measure
            </p>
          )}
        </div>

        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="font-semibold text-green-800 mb-2">Optimized Query</h3>
          {performanceMetrics.optimized ? (
            <div>
              <p>
                Duration:{' '}
                <span className="font-mono">
                  {performanceMetrics.optimized.duration.toFixed(2)}ms
                </span>
              </p>
              <p>
                Profiles loaded:{' '}
                <span className="font-mono">{optimizedProfiles.length}</span>
              </p>
            </div>
          ) : (
            <p className="text-gray-500">
              Click "Test Optimized Performance" to measure
            </p>
          )}
        </div>
      </div>

      {/* Performance Comparison */}
      {performanceMetrics.old && performanceMetrics.optimized && (
        <div className="bg-yellow-50 p-4 rounded-lg mb-6">
          <h3 className="font-semibold text-yellow-800 mb-2">
            Performance Comparison
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p>Speed Improvement:</p>
              <p className="font-mono text-lg">
                {(
                  ((performanceMetrics.old.duration -
                    performanceMetrics.optimized.duration) /
                    performanceMetrics.old.duration) *
                  100
                ).toFixed(1)}
                % faster
              </p>
            </div>
            <div>
              <p>Time Saved:</p>
              <p className="font-mono text-lg">
                {(
                  performanceMetrics.old.duration -
                  performanceMetrics.optimized.duration
                ).toFixed(2)}
                ms
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Current Results */}
      <div className="bg-white border rounded-lg p-4">
        <h3 className="font-semibold mb-4">
          Current Mode:{' '}
          {testMode === 'old' ? 'Original Query' : 'Optimized Query'}
        </h3>

        {currentLoading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-2">Loading profiles...</p>
          </div>
        )}

        {currentError && (
          <div className="bg-red-50 border border-red-200 rounded p-4 mb-4">
            <p className="text-red-800">Error: {currentError.message}</p>
          </div>
        )}

        {!currentLoading && !currentError && (
          <div>
            <p className="mb-4">Found {currentProfiles.length} profiles</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {currentProfiles.slice(0, 6).map((profile) => (
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
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileDiscoveryTest;
