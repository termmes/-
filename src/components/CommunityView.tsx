import React, { useState, useEffect } from 'react';
import { UserProfile, Story, Product, ReminderItem } from '../types';
import { db, auth } from '../firebase';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  deleteDoc, 
  doc, 
  updateDoc, 
  serverTimestamp, 
  query, 
  orderBy 
} from 'firebase/firestore';
import { InstagramStoriesBar } from './InstagramStoriesBar';
import { StoryViewerModal } from './StoryViewerModal';
import { AddStoryModal } from './AddStoryModal';
import { InstagramProfileModal } from './InstagramProfileModal';
import { ProfileAudioPlayer } from './ProfileAudioPlayer';
import { 
  Users, 
  Sparkles, 
  Music, 
  Plus, 
  ExternalLink, 
  Search, 
  CheckCircle2, 
  Package, 
  ClipboardList 
} from 'lucide-react';

interface CommunityViewProps {
  currentUserId: string;
  currentUserProfile: UserProfile | null;
  products: Product[];
}

export const CommunityView: React.FC<CommunityViewProps> = ({
  currentUserId,
  currentUserProfile,
  products
}) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [reminders, setReminders] = useState<ReminderItem[]>([]);
  
  // Modals state
  const [isAddStoryOpen, setIsAddStoryOpen] = useState(false);
  const [viewerUserIdx, setViewerUserIdx] = useState<number | null>(null);
  const [selectedProfileUser, setSelectedProfileUser] = useState<UserProfile | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch Users
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
      setUsers(snapshot.docs.map(d => ({ uid: d.id, ...d.data() } as UserProfile)));
    }, (error) => {
      console.error('Error fetching users:', error);
    });
    return () => unsubscribe();
  }, []);

  // Fetch Stories
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'stories'), (snapshot) => {
      const loaded = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Story));
      // Sort newest first
      loaded.sort((a, b) => {
        const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
        const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
        return timeB - timeA;
      });
      setStories(loaded);
    }, (error) => {
      console.error('Error fetching stories:', error);
    });
    return () => unsubscribe();
  }, []);

  // Fetch Reminders
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'reminders'), (snapshot) => {
      setReminders(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ReminderItem)));
    }, (error) => {
      console.error('Error fetching reminders:', error);
    });
    return () => unsubscribe();
  }, []);

  // Group stories by userId
  const storiesByUserId: Record<string, Story[]> = {};
  stories.forEach((s) => {
    if (!storiesByUserId[s.userId]) {
      storiesByUserId[s.userId] = [];
    }
    storiesByUserId[s.userId].push(s);
  });

  const userListWithStories = Object.keys(storiesByUserId).map((uid) => {
    const u = users.find(user => user.uid === uid);
    const userStories = storiesByUserId[uid];
    return {
      userId: uid,
      authorName: u?.displayName || userStories[0]?.authorName || 'مستخدم',
      authorPhoto: u?.photoUrl || userStories[0]?.authorPhoto || '',
      stories: userStories
    };
  });

  const handlePostStory = async (data: { mediaUrl?: string; caption?: string; bgColor?: string }) => {
    if (!currentUserId) return;
    await addDoc(collection(db, 'stories'), {
      userId: currentUserId,
      authorName: currentUserProfile?.displayName || 'مستخدم',
      authorPhoto: currentUserProfile?.photoUrl || '',
      mediaUrl: data.mediaUrl || null,
      caption: data.caption || null,
      bgColor: data.bgColor || null,
      createdAt: serverTimestamp()
    });
  };

  const handleDeleteStory = async (storyId: string) => {
    await deleteDoc(doc(db, 'stories', storyId));
  };

  const handleUpdateSong = async (songUrl: string, songTitle: string, songArtist: string) => {
    if (!currentUserId) return;
    await updateDoc(doc(db, 'users', currentUserId), {
      songUrl,
      songTitle,
      songArtist,
      updatedAt: serverTimestamp()
    });
  };

  const handleRemoveSong = async () => {
    if (!currentUserId) return;
    await updateDoc(doc(db, 'users', currentUserId), {
      songUrl: '',
      songTitle: '',
      songArtist: '',
      updatedAt: serverTimestamp()
    });
  };

  const filteredUsers = users.filter(u => 
    u.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.bio?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      {/* Top Banner & Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600 text-white p-5 sm:p-6 rounded-3xl shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-black">
              مجتمع الأعضاء
            </span>
            <span className="bg-amber-400/30 text-amber-200 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
              Instagram Style
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black mt-1.5 flex items-center gap-2">
            <Users className="w-6 h-6" /> بروفايلات وقصص الأعضاء
          </h2>
          <p className="text-white/80 text-xs sm:text-sm mt-1 max-w-xl">
            تصفح بروفايلات المستخدمين، شاهد الستوريات اليومية، واستمع لأغاني البروفايل الدائمة الخاصة بكل عضو!
          </p>
        </div>

        <button
          onClick={() => setIsAddStoryOpen(true)}
          className="bg-white text-rose-600 hover:bg-rose-50 px-5 py-3 rounded-2xl font-black text-xs sm:text-sm transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>+ نشر ستوري جديد</span>
        </button>
      </div>

      {/* Instagram Stories Bar */}
      <InstagramStoriesBar
        stories={stories}
        users={users}
        currentUserId={currentUserId}
        currentUserProfile={currentUserProfile}
        onOpenStoryViewer={(idx) => setViewerUserIdx(idx)}
        onOpenAddStory={() => setIsAddStoryOpen(true)}
      />

      {/* Search & Users Counter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="بحث عن عضو أو بالنبذة الشخصية..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pr-10 pl-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm outline-none focus:bg-white focus:ring-2 focus:ring-pink-500 font-medium"
          />
        </div>

        <div className="flex items-center gap-2 text-xs font-bold text-gray-600">
          <span className="bg-pink-50 text-pink-700 px-3 py-1.5 rounded-xl border border-pink-100">
            {filteredUsers.length} مستخدم مسجل
          </span>
          <span className="bg-purple-50 text-purple-700 px-3 py-1.5 rounded-xl border border-purple-100">
            {stories.length} قصة منشورة
          </span>
        </div>
      </div>

      {/* Instagram User Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {filteredUsers.map((u) => {
          const userStories = storiesByUserId[u.uid] || [];
          const userProducts = products.filter(p => p.ownerId === u.uid);
          const userReminders = reminders.filter(r => r.createdBy === u.uid);
          const hasStories = userStories.length > 0;
          const isMe = u.uid === currentUserId;

          return (
            <div 
              key={u.uid}
              className="bg-white rounded-3xl shadow-sm border border-gray-100/90 overflow-hidden hover:shadow-md transition-all flex flex-col justify-between group"
            >
              {/* Card Header Gradient */}
              <div className="h-16 bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 relative p-3 flex justify-end">
                {isMe && (
                  <span className="bg-black/30 backdrop-blur-md text-white text-[10px] font-black px-2 py-0.5 rounded-full border border-white/20">
                    أنت (حسابك)
                  </span>
                )}
              </div>

              {/* Avatar & Main Info */}
              <div className="px-5 pb-5 -mt-10 flex-1 flex flex-col">
                <div className="flex items-end justify-between mb-3">
                  {/* Avatar with Instagram Ring if has stories */}
                  <div className="relative">
                    <div 
                      onClick={() => {
                        if (hasStories) {
                          const idx = userListWithStories.findIndex(g => g.userId === u.uid);
                          if (idx !== -1) setViewerUserIdx(idx);
                        } else {
                          setSelectedProfileUser(u);
                        }
                      }}
                      className={`w-20 h-20 rounded-full p-1 flex items-center justify-center cursor-pointer transition-transform hover:scale-105 bg-white ${
                        hasStories 
                          ? 'ring-3 ring-pink-500 ring-offset-2 animate-[pulse_3s_infinite]' 
                          : 'ring-2 ring-gray-100'
                      }`}
                      title={hasStories ? 'اضغط لمشاهدة الستوري' : 'اضغط لعرض البروفايل'}
                    >
                      <img
                        src={u.photoUrl || 'https://www.gravatar.com/avatar/?d=mp'}
                        alt={u.displayName}
                        className="w-full h-full rounded-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).src = 'https://www.gravatar.com/avatar/?d=mp'; }}
                      />
                    </div>

                    {hasStories && (
                      <span className="absolute -bottom-1 -right-1 bg-gradient-to-tr from-pink-500 to-rose-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full border border-white">
                        ستوري
                      </span>
                    )}
                  </div>

                  {/* Profile Song Pill Player if available */}
                  {u.songUrl && (
                    <ProfileAudioPlayer
                      songUrl={u.songUrl}
                      songTitle={u.songTitle || 'أغنية البروفايل'}
                      songArtist={u.songArtist || u.displayName}
                      variant="pill"
                    />
                  )}
                </div>

                {/* Name & Bio */}
                <div className="space-y-1 mb-3">
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-black text-base text-gray-900 truncate">
                      {u.displayName}
                    </h3>
                    <CheckCircle2 className="w-4 h-4 text-rose-500 shrink-0" />
                  </div>
                  
                  {u.bio ? (
                    <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                      {u.bio}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-400 italic">
                      عضو فعال في مكتبه الهدى
                    </p>
                  )}
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-1 bg-gray-50/80 p-2.5 rounded-2xl text-center text-xs font-bold text-gray-600 mb-4 mt-auto">
                  <div>
                    <span className="block text-gray-900 font-black">{userStories.length}</span>
                    <span className="text-[10px] text-gray-400">قصص</span>
                  </div>
                  <div className="border-r border-l border-gray-200">
                    <span className="block text-gray-900 font-black">{userProducts.length}</span>
                    <span className="text-[10px] text-gray-400">منتجات</span>
                  </div>
                  <div>
                    <span className="block text-gray-900 font-black">{userReminders.length}</span>
                    <span className="text-[10px] text-gray-400">ملاحظات</span>
                  </div>
                </div>

                {/* Action button */}
                <button
                  type="button"
                  onClick={() => setSelectedProfileUser(u)}
                  className="w-full py-2.5 bg-gradient-to-r from-gray-900 to-zinc-900 hover:from-pink-600 hover:to-rose-600 text-white rounded-xl text-xs font-black transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-pink-400" />
                  <span>عرض البروفايل والأغاني (Instagram)</span>
                </button>
              </div>
            </div>
          );
        })}

        {filteredUsers.length === 0 && (
          <div className="col-span-full py-16 text-center text-gray-400 bg-white rounded-3xl border border-dashed border-gray-200">
            <Users className="w-10 h-10 mx-auto mb-2 text-gray-300" />
            <p className="font-bold text-gray-700">لا يوجد أعضاء يطابقون البحث</p>
          </div>
        )}
      </div>

      {/* Story Viewer Modal */}
      {viewerUserIdx !== null && (
        <StoryViewerModal
          storiesByUser={userListWithStories}
          initialUserIndex={viewerUserIdx}
          currentUserId={currentUserId}
          onClose={() => setViewerUserIdx(null)}
          onDeleteStory={handleDeleteStory}
        />
      )}

      {/* Add Story Modal */}
      {isAddStoryOpen && (
        <AddStoryModal
          isOpen={isAddStoryOpen}
          onClose={() => setIsAddStoryOpen(false)}
          onPostStory={handlePostStory}
          userPhoto={currentUserProfile?.photoUrl}
          userName={currentUserProfile?.displayName || 'أنا'}
        />
      )}

      {/* Full Instagram Profile Modal */}
      {selectedProfileUser && (
        <InstagramProfileModal
          profileUser={selectedProfileUser}
          currentUserId={currentUserId}
          isOwner={selectedProfileUser.uid === currentUserId}
          userStories={storiesByUserId[selectedProfileUser.uid] || []}
          userProducts={products.filter(p => p.ownerId === selectedProfileUser.uid)}
          userReminders={reminders.filter(r => r.createdBy === selectedProfileUser.uid)}
          isOpen={!!selectedProfileUser}
          onClose={() => setSelectedProfileUser(null)}
          onOpenStoryViewer={() => {
            const idx = userListWithStories.findIndex(g => g.userId === selectedProfileUser.uid);
            if (idx !== -1) {
              setViewerUserIdx(idx);
            }
          }}
          onOpenAddStory={() => setIsAddStoryOpen(true)}
          onUpdateSong={handleUpdateSong}
          onRemoveSong={handleRemoveSong}
        />
      )}

    </div>
  );
};
