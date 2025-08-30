import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Heart,
  Users,
  Eye,
  Settings,
  Edit3,
  MessageCircle,
  TrendingUp,
  Lightbulb,
  Star,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useMatchCount } from '../hooks/useMatchCount';
import { useLikesReceived } from '../hooks/useLikesReceived';
import { useLikedProfiles } from '../hooks/useProfiles';
import { useCurrentProfile } from '../hooks/useProfiles';
import SearchBar from './SearchBar';
import LocationIndicator from './LocationIndicator';

interface DiscoverSidebarProps {
  onLocationFilterChange?: (state: string, city: string) => void;
}

const DiscoverSidebar: React.FC<DiscoverSidebarProps> = ({
  onLocationFilterChange
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Get user stats
  const { data: matchCount = 0 } = useMatchCount(user?.id);
  const { data: likesReceived = 0 } = useLikesReceived(user?.id);
  const { data: likedProfiles = [] } = useLikedProfiles(user?.id);
  const { data: userProfile } = useCurrentProfile(user?.id);

  // Calculate stats
  const likesGiven = likedProfiles.length;
  const matchSuccessRate =
    likesGiven > 0 ? Math.round((matchCount / likesGiven) * 100) : 0;
  const profileCompletion = userProfile
    ? calculateProfileCompletion(userProfile)
    : 0;

  // Quick actions
  const quickActions = [
    {
      icon: Edit3,
      label: 'Edit Profile',
      action: () => navigate('/app/profile'),
      color: 'text-blue-600'
    },
    {
      icon: MessageCircle,
      label: 'View Matches',
      action: () => navigate('/app/matches'),
      color: 'text-green-600'
    },
    {
      icon: Settings,
      label: 'Discovery Settings',
      action: () => navigate('/app/settings'),
      color: 'text-purple-600'
    }
  ];

  // Discovery tips
  const tips = [
    {
      icon: Lightbulb,
      title: 'Add More Photos',
      description: 'Profiles with 4+ photos get 3x more likes',
      color: 'text-yellow-600'
    },
    {
      icon: Star,
      title: 'Complete Your Bio',
      description: 'A detailed bio increases match quality',
      color: 'text-orange-600'
    },
    {
      icon: TrendingUp,
      title: 'Be Active Daily',
      description: 'Active users get shown to more people',
      color: 'text-green-600'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Search Bar */}
      <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-professional-xl p-8 border border-gray-100/50">
        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
          <div className="w-2.5 h-2.5 bg-gradient-to-r from-red-500 to-pink-500 rounded-full mr-4"></div>
          Search Profiles
        </h3>
        <SearchBar />
      </div>

      {/* Location Settings */}
      <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-professional-xl p-8 border border-gray-100/50">
        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
          <div className="w-2.5 h-2.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mr-4"></div>
          Location
        </h3>
        <LocationIndicator onLocationChange={onLocationFilterChange} />
      </div>

      {/* Profile Stats */}
      <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-professional-xl p-8 border border-gray-100/50">
        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-2.5 rounded-xl mr-4">
            <TrendingUp className="h-4 w-4 text-white" />
          </div>
          Your Stats
        </h3>

        <div className="space-y-4">
          {/* Matches */}
          <div className="flex items-center justify-between py-3 px-4 rounded-xl hover:bg-gray-50/80 transition-colors duration-200">
            <div className="flex items-center">
              <div className="bg-red-50 p-2.5 rounded-xl mr-4">
                <Heart className="h-4 w-4 text-red-600" />
              </div>
              <span className="text-gray-800 font-medium">Matches</span>
            </div>
            <span className="text-lg font-semibold text-gray-900 bg-gray-50 px-4 py-2 rounded-xl">
              {matchCount}
            </span>
          </div>

          {/* Likes Received */}
          <div className="flex items-center justify-between py-3 px-4 rounded-xl hover:bg-gray-50/80 transition-colors duration-200">
            <div className="flex items-center">
              <div className="bg-blue-50 p-2.5 rounded-xl mr-4">
                <Eye className="h-4 w-4 text-blue-600" />
              </div>
              <span className="text-gray-800 font-medium">Likes Received</span>
            </div>
            <span className="text-lg font-semibold text-gray-900 bg-gray-50 px-4 py-2 rounded-xl">
              {likesReceived}
            </span>
          </div>

          {/* Likes Given */}
          <div className="flex items-center justify-between py-3 px-4 rounded-xl hover:bg-gray-50/80 transition-colors duration-200">
            <div className="flex items-center">
              <div className="bg-pink-50 p-2.5 rounded-xl mr-4">
                <Heart className="h-4 w-4 text-pink-600" />
              </div>
              <span className="text-gray-800 font-medium">Likes Given</span>
            </div>
            <span className="text-lg font-semibold text-gray-900 bg-gray-50 px-4 py-2 rounded-xl">
              {likesGiven}
            </span>
          </div>

          {/* Success Rate */}
          <div className="flex items-center justify-between py-3 px-4 rounded-xl hover:bg-gray-50/80 transition-colors duration-200">
            <div className="flex items-center">
              <div className="bg-green-50 p-2.5 rounded-xl mr-4">
                <TrendingUp className="h-4 w-4 text-green-600" />
              </div>
              <span className="text-gray-800 font-medium">Success Rate</span>
            </div>
            <span className="text-lg font-semibold text-gray-900 bg-gray-50 px-4 py-2 rounded-xl">
              {matchSuccessRate}%
            </span>
          </div>

          {/* Profile Completion */}
          <div className="pt-5 border-t border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-700 font-medium">Profile Completion</span>
              <span className="text-sm font-semibold text-gray-900 bg-gray-50 px-3 py-1.5 rounded-xl">
                {profileCompletion}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-red-600 to-pink-600 h-3.5 rounded-full transition-all duration-700 shadow-sm"
                style={{ width: `${profileCompletion}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-professional-xl p-8 border border-gray-100/50">
        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
          <div className="w-2.5 h-2.5 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full mr-4"></div>
          Quick Actions
        </h3>

        <div className="space-y-3">
          {quickActions.map((action, index) => (
            <button
              key={index}
              onClick={action.action}
              className="w-full flex items-center p-4 rounded-xl hover:bg-gray-50/80 transition-all duration-300 group border border-transparent hover:border-gray-200/50 hover:shadow-professional"
            >
              <div className="bg-gray-50 group-hover:bg-white p-2.5 rounded-xl mr-4 transition-colors duration-200">
                <action.icon className={`h-4 w-4 ${action.color}`} />
              </div>
              <span className="text-gray-800 group-hover:text-gray-900 font-medium">
                {action.label}
              </span>
              <ArrowRight className="h-4 w-4 ml-auto text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1.5 transition-all duration-200" />
            </button>
          ))}
        </div>
      </div>

      {/* Discovery Tips */}
      <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-professional-xl p-8 border border-gray-100/50">
        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
          <div className="bg-gradient-to-r from-yellow-500 to-orange-500 p-2.5 rounded-xl mr-4">
            <Lightbulb className="h-4 w-4 text-white" />
          </div>
          Tips for Success
        </h3>

        <div className="space-y-6">
          {tips.map((tip, index) => (
            <div key={index} className="flex items-start space-x-4 p-4 rounded-xl hover:bg-gray-50/50 transition-colors duration-200">
              <div className="bg-gray-50 p-2.5 rounded-xl mt-0.5">
                <tip.icon className={`h-4 w-4 ${tip.color}`} />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">
                  {tip.title}
                </h4>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {tip.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Helper function to calculate profile completion percentage
function calculateProfileCompletion(profile: any): number {
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
}

export default DiscoverSidebar;
