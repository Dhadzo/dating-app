import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Heart, MessageCircle, User, Settings, ThumbsUp } from 'lucide-react';

const BottomNavigation = () => {
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
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="flex justify-around items-center h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                item.active
                  ? 'text-red-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon
                className={`h-6 w-6 mb-1 ${
                  item.active ? 'text-red-600' : 'text-gray-500'
                }`}
              />
              <span
                className={`text-xs font-medium ${
                  item.active ? 'text-red-600' : 'text-gray-500'
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNavigation;
