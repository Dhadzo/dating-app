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
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="bg-white rounded-2xl shadow-professional-lg p-6 border border-gray-100 card-professional">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 tracking-tight">
          Search Profiles
        </h3>
        <SearchBar />
      </div>

      {/* Location Settings */}
      <div className="bg-white rounded-2xl shadow-professional-lg p-6 border border-gray-100 card-professional">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 tracking-tight">Location</h3>
        <LocationIndicator onLocationChange={onLocationFilterChange} />
      </div>

      {/* Profile Stats */}
      <div className="bg-white rounded-2xl shadow-professional-lg p-6 border border-gray-100 card-professional">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center tracking-tight">
          <TrendingUp className="h-4 w-4 mr-2 text-red-600" />
          Your Stats
        </h3>

        <div className="space-y-3">
          {/* Matches */}
          <div className="flex items-center justify-between py-1">
            <div className="flex items-center">
              <Heart className="h-4 w-4 text-red-600 mr-2" />
              <span className="text-sm text-gray-700 font-medium">Matches</span>
            </div>
            <span className="text-sm font-bold text-gray-900">
              {matchCount}
            </span>
          </div>

          {/* Likes Received */}
          <div className="flex items-center justify-between py-1">
            <div className="flex items-center">
              <Eye className="h-4 w-4 text-blue-600 mr-2" />
              <span className="text-sm text-gray-700 font-medium">Likes Received</span>
            </div>
            <span className="text-sm font-bold text-gray-900">
              {likesReceived}
            </span>
          </div>

          {/* Likes Given */}
          <div className="flex items-center justify-between py-1">
            <div className="flex items-center">
              <Heart className="h-4 w-4 text-pink-600 mr-2" />
              <span className="text-sm text-gray-700 font-medium">Likes Given</span>
            </div>
            <span className="text-sm font-bold text-gray-900">
              {likesGiven}
            </span>
          </div>

          {/* Success Rate */}
          <div className="flex items-center justify-between py-1">
            <div className="flex items-center">
              <TrendingUp className="h-4 w-4 text-green-600 mr-2" />
              <span className="text-sm text-gray-700 font-medium">Success Rate</span>
            </div>
            <span className="text-sm font-bold text-gray-900">
              {matchSuccessRate}%
            </span>
          </div>

          {/* Profile Completion */}
          <div className="pt-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-600 font-medium">Profile Completion</span>
              <span className="text-xs font-bold text-gray-900">
                {profileCompletion}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-red-600 to-pink-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${profileCompletion}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl shadow-professional-lg p-6 border border-gray-100 card-professional">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 tracking-tight">
          Quick Actions
        </h3>

        <div className="space-y-1">
          {quickActions.map((action, index) => (
            <button
              key={index}
              onClick={action.action}
              className="w-full flex items-center p-3 rounded-lg hover:bg-gray-50 transition-all duration-200 group border border-transparent hover:border-gray-100"
            >
              <action.icon className={`h-4 w-4 mr-3 ${action.color}`} />
              <span className="text-sm text-gray-700 group-hover:text-gray-900 font-medium">
                {action.label}
              </span>
              <ArrowRight className="h-3 w-3 ml-auto text-gray-400 group-hover:text-gray-600 transition-colors duration-200" />
            </button>
          ))}
        </div>
      </div>

      {/* Discovery Tips */}
      <div className="bg-white rounded-2xl shadow-professional-lg p-6 border border-gray-100 card-professional">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center tracking-tight">
          <Lightbulb className="h-4 w-4 mr-2 text-yellow-600" />
          Tips for Success
        </h3>

        <div className="space-y-4">
          {tips.map((tip, index) => (
            <div key={index} className="flex items-start space-x-3">
              <tip.icon className={`h-4 w-4 mt-0.5 ${tip.color}`} />
              <div>
                <h4 className="text-sm font-semibold text-gray-900 tracking-tight">
                  {tip.title}
                </h4>
                <p className="text-xs text-gray-600 mt-1.5 leading-relaxed font-normal">
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
