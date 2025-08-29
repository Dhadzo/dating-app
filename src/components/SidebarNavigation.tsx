import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Heart, MessageCircle, User, Settings, ThumbsUp } from 'lucide-react';

const SidebarNavigation = () => {
  const location = useLocation();

  const navItems = [
    {
      path: '/app/discover',
      icon: Heart,
      label: 'Discover',
      active:
        location.pathname === '/app/discover' || location.pathname === '/app'
    },
    {
      path: '/app/matches',
      icon: MessageCircle,
      label: 'Matches',
      active: location.pathname === '/app/matches'
    },
    {
      path: '/app/profile',
      icon: User,
      label: 'Profile',
      active: location.pathname === '/app/profile'
    },
    {
      path: '/app/likes',
      icon: ThumbsUp,
      label: 'Likes',
      active: location.pathname === '/app/likes'
    },
    {
      path: '/app/settings',
      icon: Settings,
      label: 'Settings',
      active: location.pathname === '/app/settings'
    }
  ];

  return (
    <div className="hidden lg:fixed lg:top-0 lg:left-4 lg:flex lg:flex-col w-64 bg-white border-r border-gray-200 h-screen z-30">
      {/* Navigation Items */}
      <nav className="flex-1 p-6 pt-20 sm:pt-24">
        <div className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  item.active
                    ? 'bg-red-50 text-red-600 border-r-2 border-r-red-600'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon
                  className={`h-5 w-5 ${
                    item.active ? 'text-red-600' : 'text-gray-500'
                  }`}
                />
                <span
                  className={`font-medium ${
                    item.active ? 'text-red-600' : 'text-gray-700'
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default SidebarNavigation;
