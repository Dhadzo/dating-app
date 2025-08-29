import React, { useRef } from 'react';
import {
  Heart,
  MessageCircle,
  User,
  Settings,
  Search,
  Filter,
  Bell,
  LogOut,
  Phone,
  Video,
  Send,
  Zap
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useUIStore } from '../stores/useUIStore';
import { useProfileStore } from '../stores/useProfileStore';
import { useCurrentProfile } from '../hooks/useProfiles';
import { useMatches } from '../hooks/useMatches';

import EditProfileModal from '../components/EditProfileModal';
import SettingsModal from '../components/SettingsModal';
import ChatModal from '../components/ChatModal';
import NotificationsModal from '../components/NotificationsModal';
import ProfileModal from '../components/ProfileModal';
import SearchModal from '../components/SearchModal';
import FilterModal from '../components/FilterModal';
import VideoCallModal from '../components/VideoCallModal';
import LikesModal from '../components/LikesModal';

const Home = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const notificationButtonRef = useRef<HTMLButtonElement>(null);

  // Zustand stores
  const {
    activeTab,
    setActiveTab,
    showEditProfile,
    setShowEditProfile,
    showSettings,
    setShowSettings,
    showNotifications,
    setShowNotifications,
    selectedProfile,
    setSelectedProfile,
    showSearch,
    setShowSearch,
    showFilter,
    setShowFilter,
    selectedChatMatch,
    setSelectedChatMatch,
    showVideoCall,
    setShowVideoCall,
    showLikes,
    setShowLikes,
    searchQuery,
    setSearchQuery,
    activeFilters,
    setActiveFilters
  } = useUIStore();

  // Profile store
  const { currentProfile, setCurrentProfile } = useProfileStore();

  // React Query hooks
  const { data: userProfile, isLoading: profileLoading } = useCurrentProfile(
    user?.id
  );
  const { data: matches = [] } = useMatches(user?.id);

  // Update profile store when data changes
  React.useEffect(() => {
    if (userProfile && !currentProfile) {
      setCurrentProfile(userProfile);
    }
  }, [userProfile, currentProfile, setCurrentProfile]);

  // Clear selected chat match if it no longer exists in matches
  React.useEffect(() => {
    if (selectedChatMatch && matches.length > 0) {
      const matchStillExists = matches.some(
        (match) => match.id === selectedChatMatch.matchId
      );
      if (!matchStillExists) {
        setSelectedChatMatch(null);
      }
    }
  }, [matches, selectedChatMatch, setSelectedChatMatch]);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Current user data from profile or fallback
  const currentUser = userProfile
    ? {
        name: `${userProfile.first_name} ${userProfile.last_name}`,
        age: userProfile.age,
        location: `${userProfile.city}, ${userProfile.state}`,
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
        age: user?.user_metadata?.age || 25,
        location:
          user?.user_metadata?.city && user?.user_metadata?.state
            ? `${user.user_metadata.city}, ${user.user_metadata.state}`
            : 'Location not set',
        avatar:
          'https://images.pexels.com/photos/3394659/pexels-photo-3394659.jpeg?auto=compress&cs=tinysrgb&w=150',
        bio: 'Complete your profile to add a bio',
        interests: []
      };

  const renderDiscoverTab = () => (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Discover</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowSearch(true)}
            className="p-2 bg-white rounded-full shadow-md hover:shadow-lg transition-shadow"
          >
            <Search className="h-5 w-5 text-gray-600" />
          </button>
          <button
            onClick={() => setShowFilter(true)}
            className="p-2 bg-white rounded-full shadow-md hover:shadow-lg transition-shadow"
          >
            <Filter className="h-5 w-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Active filters indicator */}
      {(searchQuery || activeFilters) && (
        <div className="mb-4 flex flex-wrap gap-2">
          {searchQuery && (
            <span className="inline-flex items-center px-3 py-1 bg-red-50 text-red-600 rounded-full text-sm">
              Search: "{searchQuery}"
              <button
                onClick={() => setSearchQuery('')}
                className="ml-2 text-red-400 hover:text-red-600"
              >
                ×
              </button>
            </span>
          )}
          {activeFilters && (
            <span className="inline-flex items-center px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-sm">
              Filters applied
              <button
                onClick={() => setActiveFilters(null)}
                className="ml-2 text-blue-400 hover:text-blue-600"
              >
                ×
              </button>
            </span>
          )}
        </div>
      )}

      <div className="text-center py-12">
        <div className="text-gray-400 mb-4">
          <Search className="h-12 w-12 mx-auto" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Discover Tab</h3>
        <p className="text-gray-600">
          This will be replaced with the refactored Discover component
        </p>
      </div>
    </div>
  );

  const renderMatchesTab = () => (
    <div className="flex h-[calc(100vh-200px)] bg-white rounded-lg shadow-lg overflow-hidden max-w-5xl mx-auto">
      {/* Left Sidebar - Matches List */}
      <div className="w-72 border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Messages</h2>
        </div>

        <div className="flex-1 overflow-y-auto">
          {matches.length > 0 ? (
            matches.map((match) => (
              <div
                key={match.id}
                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                  selectedChatMatch?.id === match.id
                    ? 'bg-red-50 border-r-2 border-r-red-600'
                    : ''
                }`}
                onClick={() => setSelectedChatMatch(match)}
              >
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <img
                      src={
                        match.otherProfile?.photos?.[0] ||
                        'https://images.pexels.com/photos/3394659/pexels-photo-3394659.jpeg?auto=compress&cs=tinysrgb&w=100'
                      }
                      alt={match.otherProfile?.first_name || 'Unknown'}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium truncate text-gray-900">
                        {match.otherProfile?.first_name || 'Unknown'}
                      </h3>
                    </div>
                    <p className="text-sm truncate text-gray-600">
                      Click to start chatting
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-4 text-center text-gray-500">
              <MessageCircle className="h-8 w-8 mx-auto mb-2" />
              <p>No matches yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Right Side - Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedChatMatch ? (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <MessageCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Chat with{' '}
                {selectedChatMatch.otherProfile?.first_name || 'Unknown'}
              </h3>
              <p className="text-gray-600">
                Chat functionality will be implemented here
              </p>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <MessageCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Select a conversation
              </h3>
              <p className="text-gray-600">
                Choose from your existing conversations or start a new one
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderProfileTab = () => (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="relative h-48 bg-gradient-to-r from-red-600 to-pink-600">
          <div className="absolute bottom-4 left-6 flex items-end space-x-4">
            <div className="relative">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-24 h-24 rounded-full border-4 border-white object-cover"
              />
            </div>
            <div className="text-white pb-2">
              <h2 className="text-2xl font-bold">{currentUser.name}</h2>
              <p className="text-red-100">
                {currentUser.age} • {currentUser.location}
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              About Me
            </h3>
            <p className="text-gray-600 leading-relaxed">{currentUser.bio}</p>
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
              className="w-full bg-gradient-to-r from-red-600 to-pink-600 text-white py-3 px-4 rounded-xl font-medium hover:shadow-lg transition-all"
              onClick={() => setShowEditProfile(true)}
            >
              Edit Profile
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className="w-full border border-gray-300 text-gray-700 py-3 px-4 rounded-xl font-medium hover:bg-gray-50 transition-colors"
            >
              Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Heart className="h-8 w-8 text-red-600" />
              <span className="text-2xl font-bold text-gray-900">
                ZimConnect
              </span>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowLikes(true)}
                className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <Heart className="h-6 w-6" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
              </button>

              <button
                ref={notificationButtonRef}
                onClick={() => setShowNotifications(true)}
                className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <Bell className="h-6 w-6" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
              </button>

              <div className="flex items-center space-x-2">
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-8 h-8 rounded-full object-cover"
                />
                <span className="text-sm font-medium text-gray-700">
                  {currentUser.name.split(' ')[0]}
                </span>
              </div>

              <button
                onClick={handleSignOut}
                className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {['discover', 'matches', 'profile', 'likes'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab
                    ? 'border-red-600 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="py-8 px-4 sm:px-6 lg:px-8">
        {activeTab === 'discover' && renderDiscoverTab()}
        {activeTab === 'matches' && renderMatchesTab()}
        {activeTab === 'profile' && renderProfileTab()}
        {activeTab === 'likes' && (
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <Heart className="h-16 w-16 text-red-600 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                People Who Liked You
              </h2>
              <p className="text-gray-600">
                See who's interested and like them back to start chatting!
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
                >
                  <div className="relative">
                    <div className="w-full h-64 bg-gradient-to-br from-red-100 to-pink-100 flex items-center justify-center">
                      <div className="text-center">
                        <Heart className="h-12 w-12 text-red-400 mx-auto mb-2" />
                        <p className="text-red-600 font-medium">
                          Someone likes you!
                        </p>
                      </div>
                    </div>
                    <div className="absolute top-4 right-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                      <Zap className="h-4 w-4 inline mr-1" />
                      Premium
                    </div>
                  </div>

                  <div className="p-6">
                    <p className="text-gray-600 text-sm mb-4">
                      Upgrade to Premium to see who liked you and get unlimited
                      likes!
                    </p>

                    <button className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white py-3 px-4 rounded-xl font-medium hover:shadow-lg transition-all">
                      Upgrade to Premium
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modals */}
        <EditProfileModal
          isOpen={showEditProfile}
          onClose={() => setShowEditProfile(false)}
          currentUser={currentUser}
        />

        <SettingsModal
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
        />

        <NotificationsModal
          isOpen={showNotifications}
          onClose={() => setShowNotifications(false)}
          buttonRef={notificationButtonRef}
        />

        {selectedProfile && (
          <ProfileModal
            isOpen={!!selectedProfile}
            onClose={() => setSelectedProfile(null)}
            profile={selectedProfile}
          />
        )}

        <SearchModal
          isOpen={showSearch}
          onClose={() => setShowSearch(false)}
          onSearch={setSearchQuery}
        />

        <FilterModal
          isOpen={showFilter}
          onClose={() => setShowFilter(false)}
          onApplyFilters={setActiveFilters}
        />

        <VideoCallModal
          isOpen={showVideoCall}
          onClose={() => setShowVideoCall(false)}
          match={selectedChatMatch || { name: 'Unknown', avatar: '' }}
        />

        <LikesModal isOpen={showLikes} onClose={() => setShowLikes(false)} />
      </main>
    </div>
  );
};

export default Home;
