import { useEffect, useState } from 'react';
import { format } from 'date-fns';

export interface StreamingMessageProps {
  content: string;
  timestamp?: Date;
  isComplete?: boolean;
  className?: string;
}

export function StreamingMessage({ 
  content, 
  timestamp = new Date(), 
  isComplete = false, 
  className = '' 
}: StreamingMessageProps) {
  const [displayedContent, setDisplayedContent] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  // Typing animation effect
  useEffect(() => {
    if (currentIndex < content.length) {
      const timer = setTimeout(() => {
        setDisplayedContent(content.slice(0, currentIndex + 1));
        setCurrentIndex(currentIndex + 1);
      }, 20); // Adjust speed as needed

      return () => clearTimeout(timer);
    } else {
      setDisplayedContent(content);
    }
  }, [content, currentIndex]);

  // Reset when content changes
  useEffect(() => {
    setCurrentIndex(0);
    setDisplayedContent('');
  }, [content]);

  return (
    <div className={`flex justify-start mb-4 ${className}`}>
      <div className="max-w-[70%] rounded-lg px-4 py-2 bg-gray-100 text-gray-900 mr-auto">
        {/* Streaming Content */}
        <div className="whitespace-pre-wrap break-words">
          {displayedContent}
          {!isComplete && (
            <span className="inline-block w-2 h-2 bg-blue-500 rounded-full animate-pulse ml-1" />
          )}
        </div>

        {/* Timestamp */}
        <div className="text-xs text-gray-500 mt-1">
          {format(timestamp, 'HH:mm')}
        </div>

        {/* Progress indicator */}
        {!isComplete && content.length > 0 && (
          <div className="mt-2">
            <div className="w-full bg-gray-200 rounded-full h-1">
              <div 
                className="bg-blue-500 h-1 rounded-full transition-all duration-200"
                style={{ width: `${(displayedContent.length / content.length) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
