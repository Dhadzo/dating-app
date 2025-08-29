import React from 'react';
import { X, Heart, MessageCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface LikesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LikesModal: React.FC<LikesModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [likes, setLikes] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const loadLikes = async () => {
      if (!user || !isOpen) return;

      try {
        // For now, show some profiles as people who liked you
        // In a real app, you'd have a likes table
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .neq('id', user.id)
          .eq('profile_complete', true)
          .limit(5);

        if (error) {
          console.error('Error loading likes:', error);
        } else {
          const transformedLikes = data.map(profile => ({
            id: profile.id,
            name: `${profile.first_name} ${profile.last_name}`,
            age: profile.age,
            location: `${profile.city}, ${profile.state}`,
            avatar: profile.photos && profile.photos.length > 0 
              ? profile.photos[0] 
              : 'https://images.pexels.com/photos/3394659/pexels-photo-3394659.jpeg?auto=compress&cs=tinysrgb&w=150',
            time: '2 hours ago'
          }));
          setLikes(transformedLikes);
        }
      } catch (error) {
        console.error('Error loading likes:', error);
      } finally {
        setLoading(false);
      }
    };

    loadLikes();
  }, [user, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
      <div className="bg-white rounded-2xl max-w-sm sm:max-w-md w-full max-h-[85vh] sm:max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
          <h2 className="text-lg sm:text-2xl font-bold text-gray-900">People Who Liked You</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600" />
          </button>
        </div>

        <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
            </div>
          ) : likes.length > 0 ? likes.map((like) => (
            <div key={like.id} className="flex items-center space-x-3 sm:space-x-4 p-3 sm:p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <img
                src={like.avatar}
                alt={like.name}
                className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover"
              />
              <div className="flex-1">
                <h3 className="text-sm sm:text-base font-semibold text-gray-900">{like.name}, {like.age}</h3>
                <p className="text-xs sm:text-sm text-gray-600">{like.location}</p>
                <p className="text-xs text-gray-500 mt-1">{like.time}</p>
              </div>
              <div className="flex space-x-1 sm:space-x-2">
                <button className="p-1.5 sm:p-2 bg-gray-200 rounded-full hover:bg-gray-300 transition-colors">
                  <X className="h-3 w-3 sm:h-4 sm:w-4 text-gray-600" />
                </button>
                <button className="p-1.5 sm:p-2 bg-red-600 rounded-full hover:bg-red-700 transition-colors">
                  <Heart className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                </button>
              </div>
            </div>
          )) : (
            <div className="text-center py-8 text-gray-500">
              <Heart className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No likes yet</p>
              <p className="text-sm">Keep swiping to get more likes!</p>
            </div>
          )}
        </div>

        <div className="p-3 sm:p-4 border-t border-gray-200">
          <p className="text-xs sm:text-sm text-gray-600 text-center">
            Like someone back to start a conversation!
          </p>
        </div>
      </div>
    </div>
  );
};

export default LikesModal;