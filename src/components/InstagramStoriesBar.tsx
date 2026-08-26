import React from 'react';
import { Story, UserProfile } from '../types';
import { Plus, Sparkles } from 'lucide-react';

interface InstagramStoriesBarProps {
  stories: Story[];
  users: UserProfile[];
  currentUserId: string;
  currentUserProfile?: UserProfile | null;
  onOpenStoryViewer: (userIndex: number) => void;
  onOpenAddStory: () => void;
}

export const InstagramStoriesBar: React.FC<InstagramStoriesBarProps> = ({
  stories,
  users,
  currentUserId,
  currentUserProfile,
  onOpenStoryViewer,
  onOpenAddStory
}) => {
  // Group stories by userId
  const storiesByUserId: Record<string, Story[]> = {};
  stories.forEach((s) => {
    if (!storiesByUserId[s.userId]) {
      storiesByUserId[s.userId] = [];
    }
    storiesByUserId[s.userId].push(s);
  });

  // List of users who have stories
  const userListWithStories = Object.keys(storiesByUserId).map((uid) => {
    const user = users.find(u => u.uid === uid);
    const userStories = storiesByUserId[uid];
    return {
      userId: uid,
      authorName: user?.displayName || userStories[0]?.authorName || 'مستخدم',
      authorPhoto: user?.photoUrl || userStories[0]?.authorPhoto || '',
      stories: userStories
    };
  });

  const currentUserHasStory = Boolean(storiesByUserId[currentUserId]?.length);

  return (
    <div className="bg-white p-3.5 sm:p-4 rounded-3xl shadow-sm border border-gray-100/80 mb-6">
      <div className="flex items-center gap-4 overflow-x-auto scrollbar-thin pb-1 px-1">
        
        {/* First Item: My Story / Add Story */}
        <div 
          onClick={onOpenAddStory}
          className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer group select-none"
        >
          <div className="relative">
            <div className={`w-16 h-16 sm:w-18 sm:h-18 rounded-full p-0.5 flex items-center justify-center transition-transform group-hover:scale-105 ${
              currentUserHasStory 
                ? 'bg-gradient-to-tr from-amber-400 via-rose-500 to-purple-600' 
                : 'border-2 border-dashed border-pink-400 bg-pink-50'
            }`}>
              <img
                src={currentUserProfile?.photoUrl || 'https://www.gravatar.com/avatar/?d=mp'}
                alt="My Story"
                className="w-full h-full rounded-full object-cover border-2 border-white"
                onError={(e) => { (e.target as HTMLImageElement).src = 'https://www.gravatar.com/avatar/?d=mp'; }}
              />
            </div>
            
            <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-gradient-to-tr from-pink-500 to-rose-600 text-white rounded-full flex items-center justify-center border-2 border-white shadow-xs">
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
            </div>
          </div>
          <span className="text-[11px] sm:text-xs font-black text-gray-800 group-hover:text-pink-600 transition-colors">
            ستوري جديد
          </span>
        </div>

        {/* Separator if there are other stories */}
        {userListWithStories.length > 0 && (
          <div className="h-10 w-[1px] bg-gray-200 shrink-0 mx-1" />
        )}

        {/* Stories from other users */}
        {userListWithStories.map((group, idx) => {
          const isMe = group.userId === currentUserId;
          return (
            <div
              key={group.userId}
              onClick={() => onOpenStoryViewer(idx)}
              className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer group select-none"
            >
              <div className="relative">
                <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-full p-0.5 bg-gradient-to-tr from-amber-400 via-rose-500 to-purple-600 flex items-center justify-center transition-transform group-hover:scale-105 shadow-xs animate-[pulse_3s_infinite]">
                  <img
                    src={group.authorPhoto || 'https://www.gravatar.com/avatar/?d=mp'}
                    alt={group.authorName}
                    className="w-full h-full rounded-full object-cover border-2 border-white"
                    onError={(e) => { (e.target as HTMLImageElement).src = 'https://www.gravatar.com/avatar/?d=mp'; }}
                  />
                </div>
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-black/75 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full border border-white/20">
                  {group.stories.length}
                </div>
              </div>
              <span className="text-[11px] sm:text-xs font-bold text-gray-700 max-w-[70px] truncate text-center group-hover:text-pink-600 transition-colors">
                {isMe ? 'قصصي' : group.authorName}
              </span>
            </div>
          );
        })}

        {userListWithStories.length === 0 && (
          <div className="flex items-center gap-2 text-xs text-gray-400 py-2 pr-2">
            <Sparkles className="w-4 h-4 text-pink-400 shrink-0" />
            <span>لا توجد قصص نشطة بعد. كن أول من ينشر ستوري!</span>
          </div>
        )}

      </div>
    </div>
  );
};
