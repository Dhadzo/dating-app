import React, { useState } from 'react';
import {
  X,
  Send,
  Phone,
  Video,
  MoreVertical,
  Heart,
  Loader2
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useMatchMessages, useSendMessage } from '../hooks/useMatches';
import { useUIStore } from '../stores/useUIStore';

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: {
    id: number;
    name: string;
    avatar: string;
    lastMessage?: string;
    time?: string;
  };
}

const ChatModal: React.FC<ChatModalProps> = ({ isOpen, onClose, match }) => {
  const { user } = useAuth();
  const { setShowVideoCall } = useUIStore();
  const [message, setMessage] = useState('');

  // React Query hooks for messages
  const {
    data: messages = [],
    isLoading: messagesLoading,
    error: messagesError
  } = useMatchMessages(match.id, user?.id);

  // Send message mutation
  const sendMessage = useSendMessage();

  if (!isOpen) return null;

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !user) return;

    const messageText = message.trim();
    setMessage(''); // Clear input immediately for better UX

    try {
      await sendMessage.mutateAsync({
        matchId: match.id,
        senderId: user.id,
        content: messageText
      });
    } catch (error) {
      console.error('Error sending message:', error);
      // Could add toast notification here
    }
  };

  // Transform messages for display
  const transformedMessages = messages.map((msg) => ({
    id: msg.id,
    text: msg.content,
    sender: msg.sender_id === user?.id ? 'me' : 'them',
    time: new Date(msg.created_at).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    })
  }));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-2xl max-w-sm sm:max-w-2xl w-full h-[85vh] sm:h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <img
              src={match.avatar}
              alt={match.name}
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover"
            />
            <div>
              <h3 className="text-sm sm:text-base font-semibold text-gray-900">
                {match.name}
              </h3>
              <p className="text-xs sm:text-sm text-green-600">Online now</p>
            </div>
          </div>

          <div className="flex items-center space-x-1 sm:space-x-2">
            <button className="p-1.5 sm:p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
              <Phone className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
            <button
              onClick={() => setShowVideoCall(true)}
              className="p-1.5 sm:p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            >
              <Video className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
            <button className="p-1.5 sm:p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
              <MoreVertical className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4">
          {messagesLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-red-600" />
            </div>
          ) : messagesError ? (
            <div className="text-center py-8 text-red-600">
              <p>Error loading messages</p>
            </div>
          ) : transformedMessages.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No messages yet</p>
              <p className="text-sm">Start the conversation!</p>
            </div>
          ) : (
            transformedMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${
                  msg.sender === 'me' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-xs sm:max-w-sm lg:max-w-md px-3 sm:px-4 py-2 rounded-2xl ${
                    msg.sender === 'me'
                      ? 'bg-gradient-to-r from-red-600 to-pink-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <p className="text-xs sm:text-sm">{msg.text}</p>
                  <p
                    className={`text-xs mt-1 ${
                      msg.sender === 'me' ? 'text-red-100' : 'text-gray-500'
                    }`}
                  >
                    {msg.time}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Message Input */}
        <div className="p-3 sm:p-4 border-t border-gray-200">
          <form onSubmit={handleSendMessage} className="flex space-x-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type a message..."
              disabled={sendMessage.isPending}
              className="flex-1 px-3 sm:px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-red-600 focus:border-transparent text-sm sm:text-base"
            />
            <button
              type="submit"
              disabled={!message.trim() || sendMessage.isPending}
              className="p-2 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-full hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {sendMessage.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin text-white" />
              ) : (
                <Send className="h-4 w-4 sm:h-5 sm:w-5" />
              )}
            </button>
          </form>
        </div>

        {/* Match Info */}
        <div className="px-3 sm:px-4 pb-3 sm:pb-4">
          <div className="bg-red-50 rounded-lg p-2 sm:p-3 flex items-center space-x-2">
            <Heart className="h-3 w-3 sm:h-4 sm:h-4 text-red-600" />
            <span className="text-xs sm:text-sm text-red-600">
              You and {match.name} liked each other!
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatModal;
