import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingOverlayProps {
  isVisible: boolean;
  message: string;
  zIndex?: string;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isVisible,
  message,
  zIndex = 'z-[60]'
}) => {
  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 bg-black/50 flex items-center justify-center ${zIndex}`}
    >
      <div className="bg-white rounded-lg p-6 flex items-center shadow-lg">
        <Loader2 className="h-6 w-6 animate-spin mr-3 text-red-600" />
        <span className="text-gray-900 font-medium">{message}</span>
      </div>
    </div>
  );
};

export default LoadingOverlay;
