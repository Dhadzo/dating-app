import React, { useState, useEffect } from 'react';
import { Bell, Shield, Heart, Trash2, Loader2, MapPin } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
  useUserSettings,
  useUpdateUserSettings
} from '../hooks/useUserSettings';
import { useStates, useCitiesByState } from '../hooks/useLocation';

const Settings = () => {
  const { user } = useAuth();
  const [success, setSuccess] = useState('');

  // React Query hooks for user settings
  const {
    data: existingSettings,
    isLoading: loadingSettings,
    error: settingsError
  } = useUserSettings(user?.id);

  // Mutations for updating/creating settings
  const updateSettings = useUpdateUserSettings();

  // Local state for form data
  const [settings, setSettings] = useState({
    notifications: {
      newMatches: true,
      messages: true,
      likes: false,
      marketing: false
    },
    privacy: {
      showAge: true,
      showLocation: true,
      showOnline: true
    },
    discovery: {
      ageRange: [22, 35],
      showMe: 'everyone',
      stateFilter: '',
      cityFilter: ''
    }
  });

  // Location hooks (after settings state is declared)
  const { data: states = [] } = useStates();
  const { data: cities = [] } = useCitiesByState(
    settings.discovery.stateFilter
  );

  // Update local state when settings are loaded
  React.useEffect(() => {
    if (existingSettings) {
      setSettings({
        notifications: existingSettings.notifications || {
          newMatches: true,
          messages: true,
          likes: false,
          marketing: false
        },
        privacy: existingSettings.privacy || {
          showAge: true,
          showLocation: true,
          showOnline: true
        },
        discovery: existingSettings.discovery || {
          ageRange: [22, 35],
          showMe: 'everyone',
          stateFilter: '',
          cityFilter: ''
        }
      });
    }
  }, [existingSettings]);

  // Reset city when state changes (only if current city is not in the new state's cities)
  useEffect(() => {
    if (
      settings.discovery.stateFilter &&
      settings.discovery.cityFilter &&
      !cities.includes(settings.discovery.cityFilter)
    ) {
      setSettings((prev) => ({
        ...prev,
        discovery: {
          ...prev.discovery,
          cityFilter: ''
        }
      }));
    }
  }, [settings.discovery.stateFilter, cities, settings.discovery.cityFilter]);

  const handleNotificationChange = (key: string) => {
    setSuccess('');
    setSettings({
      ...settings,
      notifications: {
        ...settings.notifications,
        [key]:
          !settings.notifications[key as keyof typeof settings.notifications]
      }
    });
  };

  const handlePrivacyChange = (key: string) => {
    setSuccess('');
    setSettings({
      ...settings,
      privacy: {
        ...settings.privacy,
        [key]: !settings.privacy[key as keyof typeof settings.privacy]
      }
    });
  };

  const handleDiscoveryChange = (key: string, value: any) => {
    setSuccess('');
    setSettings({
      ...settings,
      discovery: {
        ...settings.discovery,
        [key]: value
      }
    });
  };

  const handleSave = async () => {
    if (!user) return;

    try {
      // Always use updateSettings - it now handles both create and update
      await updateSettings.mutateAsync({
        userId: user.id,
        settings: {
          notifications: settings.notifications,
          privacy: settings.privacy,
          discovery: settings.discovery
        }
      });

      setSuccess('Settings saved successfully!');

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      // Error handling is managed by React Query mutations
    }
  };

  // Get loading state from mutations
  const isLoading = updateSettings.isPending;
  const error = updateSettings.error;

  if (loadingSettings) {
    return (
      <div className="no-scroll-page bg-gray-50">
        <main className="py-8 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-12 w-12 animate-spin text-red-600" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="no-scroll-page bg-gray-50">
      {/* Main Content */}
      <main className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          </div>

          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="p-6 space-y-8">
              {/* Success/Error Messages */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                  {error instanceof Error
                    ? error.message
                    : 'An error occurred while saving settings'}
                </div>
              )}

              {success && (
                <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg text-sm">
                  {success}
                </div>
              )}

              {/* Notifications */}
              <div>
                <div className="flex items-center space-x-3 mb-6">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Bell className="h-5 w-5 text-blue-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Notifications
                  </h2>
                </div>
                <div className="space-y-4">
                  {Object.entries(settings.notifications).map(
                    ([key, value]) => (
                      <div
                        key={key}
                        className="flex items-center justify-between py-3"
                      >
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {key === 'newMatches' && 'New Matches'}
                            {key === 'messages' && 'Messages'}
                            {key === 'likes' && 'Likes'}
                            {key === 'marketing' && 'Marketing Emails'}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {key === 'newMatches' &&
                              'Get notified when you have new matches'}
                            {key === 'messages' &&
                              'Get notified about new messages'}
                            {key === 'likes' &&
                              'Get notified when someone likes you'}
                            {key === 'marketing' &&
                              'Receive updates about new features'}
                          </p>
                        </div>
                        <button
                          onClick={() => handleNotificationChange(key)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            value ? 'bg-red-600' : 'bg-gray-200'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              value ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    )
                  )}
                </div>
              </div>

              <div className="border-t border-gray-200"></div>

              {/* Privacy */}
              <div>
                <div className="flex items-center space-x-3 mb-6">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Shield className="h-5 w-5 text-green-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Privacy
                  </h2>
                </div>
                <div className="space-y-4">
                  {Object.entries(settings.privacy).map(([key, value]) => (
                    <div
                      key={key}
                      className="flex items-center justify-between py-3"
                    >
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {key === 'showAge' && 'Show My Age'}
                          {key === 'showLocation' && 'Show My Location'}
                          {key === 'showOnline' && "Show When I'm Online"}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {key === 'showAge' &&
                            'Display your age on your profile'}
                          {key === 'showLocation' &&
                            'Show your city and state to other users'}
                          {key === 'showOnline' &&
                            "Let others see when you're active"}
                        </p>
                      </div>
                      <button
                        onClick={() => handlePrivacyChange(key)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          value ? 'bg-red-600' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            value ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-gray-200"></div>

              {/* Discovery Settings */}
              <div>
                <div className="flex items-center space-x-3 mb-6">
                  <div className="p-2 bg-pink-100 rounded-lg">
                    <Heart className="h-5 w-5 text-pink-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Discovery
                  </h2>
                </div>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Age Range: {settings.discovery.ageRange[0]} -{' '}
                      {settings.discovery.ageRange[1]}
                    </label>
                    <div className="space-y-2">
                      <input
                        type="range"
                        min="18"
                        max="100"
                        value={settings.discovery.ageRange[0]}
                        onChange={(e) =>
                          handleDiscoveryChange('ageRange', [
                            parseInt(e.target.value),
                            settings.discovery.ageRange[1]
                          ])
                        }
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                      />
                      <input
                        type="range"
                        min="18"
                        max="100"
                        value={settings.discovery.ageRange[1]}
                        onChange={(e) =>
                          handleDiscoveryChange('ageRange', [
                            settings.discovery.ageRange[0],
                            parseInt(e.target.value)
                          ])
                        }
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Show Me
                    </label>
                    <select
                      value={settings.discovery.showMe}
                      onChange={(e) =>
                        handleDiscoveryChange('showMe', e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent"
                    >
                      <option value="everyone">Everyone</option>
                      <option value="men">Men</option>
                      <option value="women">Women</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      State Filter
                    </label>
                    <select
                      value={settings.discovery.stateFilter || ''}
                      onChange={(e) =>
                        handleDiscoveryChange('stateFilter', e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent"
                    >
                      <option value="">All States</option>
                      {states.map((state) => (
                        <option key={state} value={state}>
                          {state}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      City Filter
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <MapPin className="h-5 w-5 text-gray-400" />
                      </div>
                      <select
                        value={settings.discovery.cityFilter || ''}
                        onChange={(e) =>
                          handleDiscoveryChange('cityFilter', e.target.value)
                        }
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent"
                      >
                        <option value="">
                          {settings.discovery.stateFilter
                            ? 'All Cities in State'
                            : 'All Cities'}
                        </option>
                        {cities.map((city) => (
                          <option key={city} value={city}>
                            {city}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200"></div>

              {/* Account Actions */}
              <div>
                <div className="flex items-center space-x-3 mb-6">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <Trash2 className="h-5 w-5 text-red-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Danger Zone
                  </h2>
                </div>
                <button className="w-full text-left px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center border border-red-200">
                  <Trash2 className="h-4 w-4 mr-3 text-red-400" />
                  Delete Account
                </button>
              </div>

              {/* Save Button */}
              <div className="pt-6 border-t border-gray-200">
                <button
                  onClick={handleSave}
                  disabled={isLoading}
                  className="w-full px-6 py-3 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    'Save Settings'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Settings;
