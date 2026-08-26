import React, { useState, useEffect, useRef } from 'react';
import { Story } from '../types';
import { X, Trash2, ChevronLeft, ChevronRight, Clock, Sparkles } from 'lucide-react';

interface StoryViewerModalProps {
  storiesByUser: { userId: string; authorName: string; authorPhoto?: string; stories: Story[] }[];
  initialUserIndex: number;
  currentUserId: string;
  onClose: () => void;
  onDeleteStory: (storyId: string) => Promise<void>;
}

export const StoryViewerModal: React.FC<StoryViewerModalProps> = ({
  storiesByUser,
  initialUserIndex,
  currentUserId,
  onClose,
  onDeleteStory
}) => {
  const [currentUserIdx, setCurrentUserIdx] = useState(initialUserIndex);
  const [currentStoryIdx, setCurrentStoryIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const activeUserGroup = storiesByUser[currentUserIdx];
  const activeStory = activeUserGroup?.stories[currentStoryIdx];
  const progressTimerRef = useRef<number | null>(null);

  const STORY_DURATION = 5000; // 5 seconds per story
  const INTERVAL = 50; // update progress every 50ms

  useEffect(() => {
    setCurrentStoryIdx(0);
    setProgress(0);
  }, [currentUserIdx]);

  useEffect(() => {
    setProgress(0);
  }, [currentStoryIdx]);

  useEffect(() => {
    if (!activeStory || isPaused) return;

    progressTimerRef.current = window.setInterval(() => {
      setProgress((prev) => {
        const next = prev + (INTERVAL / STORY_DURATION) * 100;
        if (next >= 100) {
          handleNextStory();
          return 0;
        }
        return next;
      });
    }, INTERVAL);

    return () => {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    };
  }, [activeStory, currentStoryIdx, currentUserIdx, isPaused]);

  if (!activeUserGroup || !activeStory) {
    return null;
  }

  const handleNextStory = () => {
    if (currentStoryIdx < activeUserGroup.stories.length - 1) {
      setCurrentStoryIdx(prev => prev + 1);
      setProgress(0);
    } else if (currentUserIdx < storiesByUser.length - 1) {
      setCurrentUserIdx(prev => prev + 1);
      setCurrentStoryIdx(0);
      setProgress(0);
    } else {
      onClose();
    }
  };

  const handlePrevStory = () => {
    if (currentStoryIdx > 0) {
      setCurrentStoryIdx(prev => prev - 1);
      setProgress(0);
    } else if (currentUserIdx > 0) {
      setCurrentUserIdx(prev => prev - 1);
      setCurrentStoryIdx(storiesByUser[currentUserIdx - 1].stories.length - 1);
      setProgress(0);
    }
  };

  const handleDelete = async () => {
    if (!activeStory || isDeleting) return;
    if (window.confirm('هل أنت متأكد من رغبتك في حذف هذه القصة (الستوري)؟')) {
      setIsDeleting(true);
      try {
        await onDeleteStory(activeStory.id);
        // After deletion, if no more stories in this group:
        if (activeUserGroup.stories.length <= 1) {
          if (storiesByUser.length <= 1) {
            onClose();
          } else {
            handleNextStory();
          }
        } else {
          handleNextStory();
        }
      } catch (err) {
        console.error("Error deleting story:", err);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const formatStoryTime = (createdAt: any) => {
    if (!createdAt) return 'الآن';
    const date = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
    const diffHours = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60));
    if (diffHours < 1) return 'منذ قليل';
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;
    const diffDays = Math.floor(diffHours / 24);
    return `منذ ${diffDays} يوم`;
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-0 sm:p-4 select-none"
      onMouseDown={() => setIsPaused(true)}
      onMouseUp={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      {/* Close button on top right of screen */}
      <button
        onClick={onClose}
        className="absolute top-4 left-4 z-50 p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors cursor-pointer"
        title="إغلاق الستوري"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Main Story Container - Instagram Aspect Ratio (9:16 mobile look) */}
      <div className="relative w-full h-full sm:h-[88vh] sm:max-w-[420px] sm:rounded-3xl overflow-hidden bg-zinc-950 flex flex-col justify-between shadow-2xl border border-zinc-800">
        
        {/* Top Story Header */}
        <div className="absolute top-0 left-0 right-0 z-30 p-3.5 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
          {/* Segmented Progress Bars */}
          <div className="flex items-center gap-1.5 mb-3">
            {activeUserGroup.stories.map((s, idx) => {
              let segmentProgress = 0;
              if (idx < currentStoryIdx) segmentProgress = 100;
              else if (idx === currentStoryIdx) segmentProgress = progress;
              return (
                <div key={s.id || idx} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-white transition-all duration-75"
                    style={{ width: `${segmentProgress}%` }}
                  />
                </div>
              );
            })}
          </div>

          {/* User Info Bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-0.5 rounded-full bg-gradient-to-tr from-amber-400 via-rose-500 to-purple-600">
                <img
                  src={activeUserGroup.authorPhoto || 'https://www.gravatar.com/avatar/?d=mp'}
                  alt={activeUserGroup.authorName}
                  className="w-9 h-9 rounded-full object-cover border border-white"
                  onError={(e) => { (e.target as HTMLImageElement).src = 'https://www.gravatar.com/avatar/?d=mp'; }}
                />
              </div>
              <div>
                <h4 className="text-white font-black text-sm drop-shadow-sm flex items-center gap-1.5">
                  {activeUserGroup.authorName}
                  <span className="text-[10px] text-white/70 font-normal">
                    • {formatStoryTime(activeStory.createdAt)}
                  </span>
                </h4>
                <span className="text-[10px] text-pink-300 font-bold">
                  قصة {currentStoryIdx + 1} من {activeUserGroup.stories.length}
                </span>
              </div>
            </div>

            {/* Delete button for story owner */}
            {activeStory.userId === currentUserId && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="p-2 text-white/80 hover:text-red-400 hover:bg-white/10 rounded-full transition-colors"
                title="حذف هذه القصة"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Story Media / Content Body */}
        <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
          {activeStory.mediaUrl ? (
            <img
              src={activeStory.mediaUrl}
              alt="Story"
              className="w-full h-full object-cover object-center"
            />
          ) : (
            <div 
              className={`w-full h-full flex flex-col items-center justify-center p-8 text-center ${
                activeStory.bgColor || 'bg-gradient-to-br from-purple-700 via-rose-600 to-amber-500'
              }`}
            >
              <div className="p-3 bg-white/20 backdrop-blur-md rounded-full mb-4 text-white">
                <Sparkles className="w-8 h-8" />
              </div>
              <p className="text-white text-xl sm:text-2xl font-black leading-relaxed drop-shadow-md max-w-xs">
                {activeStory.caption || 'يوميات جديدة ✨'}
              </p>
            </div>
          )}

          {/* Left / Right Tap Zones */}
          <div 
            onClick={handlePrevStory}
            className="absolute top-0 bottom-0 left-0 w-1/3 z-20 cursor-pointer"
            title="السابق"
          />
          <div 
            onClick={handleNextStory}
            className="absolute top-0 bottom-0 right-0 w-2/3 z-20 cursor-pointer"
            title="التالي"
          />
        </div>

        {/* Bottom Caption Overlay if image story has caption */}
        {activeStory.mediaUrl && activeStory.caption && (
          <div className="absolute bottom-0 left-0 right-0 z-30 p-4 pt-12 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
            <p className="text-white text-sm sm:text-base font-bold text-center drop-shadow-md bg-black/40 backdrop-blur-md py-2.5 px-4 rounded-2xl border border-white/10">
              {activeStory.caption}
            </p>
          </div>
        )}

        {/* Desktop Navigation Chevrons */}
        <button
          onClick={handlePrevStory}
          className="hidden sm:flex absolute -left-12 top-1/2 -translate-y-1/2 p-2 bg-white/10 hover:bg-white/30 text-white rounded-full transition-colors"
          title="القصة السابقة"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <button
          onClick={handleNextStory}
          className="hidden sm:flex absolute -right-12 top-1/2 -translate-y-1/2 p-2 bg-white/10 hover:bg-white/30 text-white rounded-full transition-colors"
          title="القصة التالية"
        >
          <ChevronRight className="w-6 h-6" />
        </button>

      </div>
    </div>
  );
};
