import React from 'react';
import { CheckCircle, Circle, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ProfileCompletionIndicatorProps {
  completionPercentage: number;
  className?: string;
}

const ProfileCompletionIndicator: React.FC<ProfileCompletionIndicatorProps> = ({
  completionPercentage,
  className = ''
}) => {
  const navigate = useNavigate();

  const getCompletionColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getCompletionIcon = (percentage: number) => {
    if (percentage >= 80) return CheckCircle;
    if (percentage >= 60) return Circle;
    return AlertCircle;
  };

  const getCompletionMessage = (percentage: number) => {
    if (percentage >= 80) return 'Profile complete!';
    if (percentage >= 60) return 'Almost there!';
    return 'Complete your profile';
  };

  const Icon = getCompletionIcon(completionPercentage);

  return (
    <button
      onClick={() => navigate('/app/profile')}
      className={`flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors group ${className}`}
      title={`Profile ${completionPercentage}% complete - Click to edit`}
    >
      <Icon className={`h-4 w-4 ${getCompletionColor(completionPercentage)}`} />
      <div className="hidden sm:block">
        <div className="flex items-center space-x-2">
          <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                completionPercentage >= 80
                  ? 'bg-green-500'
                  : completionPercentage >= 60
                  ? 'bg-yellow-500'
                  : 'bg-red-500'
              }`}
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
          <span
            className={`text-sm font-medium ${getCompletionColor(
              completionPercentage
            )}`}
          >
            {completionPercentage}%
          </span>
        </div>
        <div className={`text-xs ${getCompletionColor(completionPercentage)}`}>
          {getCompletionMessage(completionPercentage)}
        </div>
      </div>
    </button>
  );
};

export default ProfileCompletionIndicator;
