import React, { useState, useEffect } from 'react';
import { X, Mic, MicOff, Video, VideoOff, Phone } from 'lucide-react';
import { useUIStore } from '../stores/useUIStore';

interface VideoCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: {
    name: string;
    avatar: string;
  };
}

const VideoCallModal: React.FC<VideoCallModalProps> = ({
  isOpen,
  onClose,
  match
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  // Get video call state from Zustand store
  const { showVideoCall, setShowVideoCall } = useUIStore();

  useEffect(() => {
    if (!isOpen) return;

    const timer = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);

    return () => {
      clearInterval(timer);
      setCallDuration(0);
    };
  }, [isOpen]);

  // Handle close with store integration
  const handleClose = () => {
    setShowVideoCall(false);
    onClose();
  };

  if (!isOpen) return null;

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
        <div className="flex items-center space-x-3 text-white">
          <img
            src={match.avatar}
            alt={match.name}
            className="w-10 h-10 rounded-full object-cover"
          />
          <div>
            <h3 className="font-semibold">{match.name}</h3>
            <p className="text-sm text-gray-300">
              {formatDuration(callDuration)}
            </p>
          </div>
        </div>
        <button
          onClick={handleClose}
          className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
        >
          <X className="h-6 w-6 text-white" />
        </button>
      </div>

      {/* Video Area */}
      <div className="flex-1 relative">
        {/* Remote Video */}
        <div className="w-full h-full bg-gray-900 flex items-center justify-center">
          <img
            src={match.avatar}
            alt={match.name}
            className="w-48 h-48 rounded-full object-cover"
          />
        </div>

        {/* Local Video (Picture in Picture) */}
        <div className="absolute top-20 right-4 w-32 h-24 bg-gray-800 rounded-lg overflow-hidden">
          {!isVideoOff ? (
            <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <span className="text-white text-xs">You</span>
            </div>
          ) : (
            <div className="w-full h-full bg-gray-700 flex items-center justify-center">
              <VideoOff className="h-6 w-6 text-gray-400" />
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className={`p-4 rounded-full transition-colors ${
              isMuted
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-white/20 hover:bg-white/30'
            }`}
          >
            {isMuted ? (
              <MicOff className="h-6 w-6 text-white" />
            ) : (
              <Mic className="h-6 w-6 text-white" />
            )}
          </button>

          <button
            onClick={handleClose}
            className="p-4 bg-red-600 rounded-full hover:bg-red-700 transition-colors"
          >
            <Phone className="h-6 w-6 text-white transform rotate-[135deg]" />
          </button>

          <button
            onClick={() => setIsVideoOff(!isVideoOff)}
            className={`p-4 rounded-full transition-colors ${
              isVideoOff
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-white/20 hover:bg-white/30'
            }`}
          >
            {isVideoOff ? (
              <VideoOff className="h-6 w-6 text-white" />
            ) : (
              <Video className="h-6 w-6 text-white" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoCallModal;
