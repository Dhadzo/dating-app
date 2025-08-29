import React, { useState, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Bell,
  LogOut,
  User,
  Heart,
  Settings,
  ChevronDown,
  Search
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useUnreadNotificationCount } from '../hooks/useUnreadCounts';
import { useCurrentProfile } from '../hooks/useProfiles';
import NotificationsModal from './NotificationsModal';
import ProfileCompletionIndicator from './ProfileCompletionIndicator';

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const notificationButtonRef = useRef<HTMLButtonElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);

  const handleSignOut = async () => {
    setIsSigningOut(true);

    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
      setIsSigningOut(false);
    }
  };

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        userDropdownRef.current &&
        !userDropdownRef.current.contains(event.target as Node)
      ) {
        setShowUserDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  // Get user display info
  const userName =
    user?.user_metadata?.first_name || user?.email?.split('@')[0] || 'User';
  const userFullName =
    user?.user_metadata?.first_name && user?.user_metadata?.last_name
      ? `${user.user_metadata.first_name} ${user.user_metadata.last_name}`
      : userName;

  // Get user avatar from profile or fallback
  // Get user profile data including avatar
  const { data: userProfile } = useCurrentProfile(user?.id);

  // Get user avatar from profile or fallback
  const userAvatar =
    userProfile?.photos && userProfile.photos.length > 0
      ? userProfile.photos[0]
      : 'https://images.pexels.com/photos/3394659/pexels-photo-3394659.jpeg?auto=compress&cs=tinysrgb&w=150';

  // Use React Query hooks for counts
  const { data: unreadCount = 0 } = useUnreadNotificationCount(user?.id);

  // Calculate profile completion
  const calculateProfileCompletion = (profile: any): number => {
    if (!profile) return 0;

    const fields = [
      'first_name',
      'last_name',
      'age',
      'gender',
      'bio',
      'city',
      'state',
      'photos'
    ];

    let completedFields = 0;

    fields.forEach((field) => {
      if (field === 'photos') {
        if (profile[field] && profile[field].length > 0) {
          completedFields++;
        }
      } else if (profile[field] && profile[field].toString().trim() !== '') {
        completedFields++;
      }
    });

    return Math.round((completedFields / fields.length) * 100);
  };

  const profileCompletion = userProfile
    ? calculateProfileCompletion(userProfile)
    : 0;

  return (
    <>
      <header className="bg-white shadow-sm border-b border-gray-100 fixed top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-12 sm:h-14">
            {/* Logo - Far Left */}
            <Link
              to="/app/discover"
              className="flex items-center space-x-2 cursor-pointer hover:opacity-80 transition-opacity flex-shrink-0"
            >
              <Heart className="h-6 w-6 sm:h-8 sm:w-8 text-red-600" />
              <span className="text-xl sm:text-2xl font-semibold text-gray-900">
                ZimConnect
              </span>
            </Link>

            {/* Spacer to push actions to far right */}
            <div className="flex-1"></div>

            {/* Right: Actions - Far Right */}
            <div className="flex items-center space-x-4 sm:space-x-6">
              {/* Profile Completion Indicator (hidden on mobile) */}
              <div className="hidden lg:block">
                <ProfileCompletionIndicator
                  completionPercentage={profileCompletion}
                />
              </div>

              {/* Quick Settings (hidden on mobile) */}
              <Link
                to="/app/settings"
                className="hidden lg:block p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                title="Settings"
              >
                <Settings className="h-5 w-5" />
              </Link>

              {/* Notifications */}
              <button
                ref={notificationButtonRef}
                onClick={() => setShowNotifications(true)}
                className="relative p-1.5 sm:p-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <Bell className="h-5 w-5 sm:h-6 sm:w-6" />
                {unreadCount > 0 && (
                  <div className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 min-w-[12px] h-3 sm:min-w-[16px] sm:h-4 bg-red-500 rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? (
                      <span className="text-white text-xs font-bold">9+</span>
                    ) : (
                      <span className="text-white text-xs font-bold">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                )}
              </button>

              {/* User Dropdown */}
              <div className="relative" ref={userDropdownRef}>
                <button
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  className="flex items-center space-x-2 p-1 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <img
                    src={userAvatar}
                    alt={userName}
                    className="w-6 h-6 sm:w-8 sm:h-8 rounded-full object-cover"
                  />
                  <div className="hidden sm:block text-left">
                    <div className="text-sm font-medium text-gray-700">
                      {userName}
                    </div>
                    <div className="text-xs text-gray-500">View profile</div>
                  </div>
                  <ChevronDown
                    className={`h-4 w-4 text-gray-400 transition-transform ${
                      showUserDropdown ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {/* Dropdown Menu */}
                {showUserDropdown && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                    {/* User Info Header */}
                    <div className="px-4 py-3 border-b border-gray-100">
                      <div className="flex items-center space-x-3">
                        <img
                          src={userAvatar}
                          alt={userName}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div>
                          <div className="font-medium text-gray-900">
                            {userFullName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {user?.email}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="py-2">
                      <Link
                        to="/app/settings"
                        onClick={() => setShowUserDropdown(false)}
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <Settings className="h-4 w-4 mr-3 text-gray-400" />
                        Settings
                      </Link>

                      <Link
                        to="/app/profile"
                        onClick={() => {
                          setShowUserDropdown(false);
                        }}
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <User className="h-4 w-4 mr-3 text-gray-400" />
                        My Profile
                      </Link>

                      <div className="border-t border-gray-100 my-2"></div>

                      <button
                        onClick={() => {
                          setShowUserDropdown(false);
                          handleSignOut();
                        }}
                        disabled={isSigningOut}
                        className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        {isSigningOut ? (
                          <div className="w-4 h-4 mr-3 border-2 border-red-300 border-t-red-600 rounded-full animate-spin"></div>
                        ) : (
                          <LogOut className="h-4 w-4 mr-3" />
                        )}
                        {isSigningOut ? 'Signing out...' : 'Sign Out'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile-only logout button for backup */}
              <button
                onClick={handleSignOut}
                disabled={isSigningOut}
                className="sm:hidden p-1.5 text-gray-600 hover:text-gray-900 transition-colors"
              >
                {isSigningOut ? (
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                ) : (
                  <LogOut className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Modals */}
      <NotificationsModal
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        buttonRef={notificationButtonRef}
      />
    </>
  );
};

export default Header;
