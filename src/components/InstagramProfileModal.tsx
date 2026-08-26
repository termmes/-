import React, { useState } from 'react';
import { UserProfile, Story, Product, ReminderItem } from '../types';
import { ProfileAudioPlayer } from './ProfileAudioPlayer';
import { saveAudioToLocalStore, AUDIO_PRESETS } from '../audioStorage';
import { 
  X, 
  Sparkles, 
  Package, 
  ClipboardList, 
  Plus, 
  Music, 
  CheckCircle2, 
  Upload, 
  Trash2, 
  Edit3, 
  Radio, 
  Loader2 
} from 'lucide-react';

interface InstagramProfileModalProps {
  profileUser: UserProfile;
  currentUserId: string;
  isOwner: boolean;
  userStories: Story[];
  userProducts: Product[];
  userReminders: ReminderItem[];
  isOpen: boolean;
  onClose: () => void;
  onOpenStoryViewer: () => void;
  onOpenAddStory: () => void;
  onOpenEditProfile: () => void;
  onUpdateSong?: (songUrl: string, songTitle: string, songArtist: string) => Promise<void>;
  onRemoveSong?: () => Promise<void>;
}

export const InstagramProfileModal: React.FC<InstagramProfileModalProps> = ({
  profileUser,
  currentUserId,
  isOwner,
  userStories,
  userProducts,
  userReminders,
  isOpen,
  onClose,
  onOpenStoryViewer,
  onOpenAddStory,
  onOpenEditProfile,
  onUpdateSong,
  onRemoveSong
}) => {
  const [activeTab, setActiveTab] = useState<'stories' | 'products' | 'reminders'>('stories');
  const [isUploadingSong, setIsUploadingSong] = useState(false);
  const [showSongUploader, setShowSongUploader] = useState(false);
  const [autoPlaySong, setAutoPlaySong] = useState(false);
  const songFileInputRef = React.useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const hasStories = userStories.length > 0;

  // Instant Audio Upload & Auto-Play handling
  const handleAudioFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingSong(true);

    try {
      // 1. Save to local IndexedDB store
      const localKey = `profile_song_${profileUser.uid}`;
      await saveAudioToLocalStore(localKey, file);

      // 2. Clear file input from device / DOM
      if (songFileInputRef.current) {
        songFileInputRef.current.value = '';
      }

      const songTitle = file.name.replace(/\.[^/.]+$/, "");
      const songArtist = profileUser.displayName || 'موسيقى البروفايل';
      const storageSongUrl = `local:${localKey}`;

      // 3. Update in database
      if (onUpdateSong) {
        await onUpdateSong(storageSongUrl, songTitle, songArtist);
      }

      // 4. Hide uploader immediately & trigger autoplay
      setShowSongUploader(false);
      setAutoPlaySong(true);
    } catch (err) {
      console.error("Error saving audio file:", err);
      alert("حدث خطأ أثناء معالجة الملف الصوتي.");
    } finally {
      setIsUploadingSong(false);
    }
  };

  const handleSelectPreset = async (preset: typeof AUDIO_PRESETS[0]) => {
    if (!onUpdateSong) return;
    setIsUploadingSong(true);
    try {
      await onUpdateSong(preset.url, preset.title, preset.artist);
      setShowSongUploader(false);
      setAutoPlaySong(true);
    } catch (err) {
      console.error("Error selecting preset:", err);
    } finally {
      setIsUploadingSong(false);
    }
  };

  const handleRemoveSongClick = async () => {
    if (!onRemoveSong) return;
    if (window.confirm('هل تريد حذف أغنية البروفايل؟')) {
      await onRemoveSong();
      setAutoPlaySong(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl border border-gray-100 flex flex-col max-h-[92vh]">
        
        {/* Profile Header Banner (Instagram Theme) */}
        <div className="relative bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 p-4 sm:p-6 text-white shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 left-4 p-2 bg-black/30 hover:bg-black/50 text-white rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 pt-2">
            {/* Avatar with Instagram Stories Ring */}
            <div className="relative shrink-0">
              <div 
                onClick={() => {
                  if (hasStories) onOpenStoryViewer();
                  else if (isOwner) onOpenAddStory();
                }}
                className={`w-22 h-22 sm:w-26 sm:h-26 rounded-full p-1 flex items-center justify-center cursor-pointer transition-transform hover:scale-105 shadow-md ${
                  hasStories 
                    ? 'bg-gradient-to-tr from-amber-300 via-white to-pink-200 ring-4 ring-white/40' 
                    : 'bg-white/20'
                }`}
                title={hasStories ? 'اضغط لمشاهدة الستوري' : isOwner ? 'أضف ستوري جديد' : ''}
              >
                <img
                  src={profileUser.photoUrl || 'https://www.gravatar.com/avatar/?d=mp'}
                  alt={profileUser.displayName}
                  className="w-full h-full rounded-full object-cover border-2 border-white"
                  onError={(e) => { (e.target as HTMLImageElement).src = 'https://www.gravatar.com/avatar/?d=mp'; }}
                />
              </div>

              {/* Story Badge indicator */}
              {hasStories && (
                <div 
                  onClick={onOpenStoryViewer}
                  className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-rose-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full border border-white shadow-xs cursor-pointer flex items-center gap-1 whitespace-nowrap"
                >
                  <Sparkles className="w-2.5 h-2.5" />
                  <span>ستوري ({userStories.length})</span>
                </div>
              )}
            </div>

            {/* User Meta & Bio */}
            <div className="flex-1 text-center sm:text-right min-w-0 space-y-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h3 className="text-lg sm:text-xl font-bold text-white drop-shadow-xs">
                  {profileUser.displayName}
                </h3>
                <span className="bg-white/25 backdrop-blur-md text-white text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 fill-white text-rose-500" />
                  عضو معتمد
                </span>
              </div>

              {profileUser.bio ? (
                <p className="text-white/90 text-xs sm:text-sm font-medium leading-relaxed max-w-md">
                  {profileUser.bio}
                </p>
              ) : (
                <p className="text-white/70 text-xs italic">
                  لم تتم إضافة نبذة شخصية بعد.
                </p>
              )}

              {/* Stats Counters */}
              <div className="flex items-center justify-center sm:justify-start gap-4 pt-2">
                <div className="text-center bg-black/20 backdrop-blur-sm px-3 py-1 rounded-xl">
                  <div className="text-sm font-black">{userStories.length}</div>
                  <div className="text-[10px] text-white/80">القصص</div>
                </div>
                <div className="text-center bg-black/20 backdrop-blur-sm px-3 py-1 rounded-xl">
                  <div className="text-sm font-black">{userProducts.length}</div>
                  <div className="text-[10px] text-white/80">الأصناف</div>
                </div>
                <div className="text-center bg-black/20 backdrop-blur-sm px-3 py-1 rounded-xl">
                  <div className="text-sm font-black">{userReminders.length}</div>
                  <div className="text-[10px] text-white/80">الملاحظات</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Music Player Bar (Replaces upload list with Player & Play Button) */}
        <div className="p-3.5 bg-gray-50 border-b border-gray-100 space-y-2">
          {profileUser.songUrl && !showSongUploader ? (
            <div className="space-y-1.5">
              <ProfileAudioPlayer
                songUrl={profileUser.songUrl}
                songTitle={profileUser.songTitle || 'أغنية الملف الشخصي'}
                songArtist={profileUser.songArtist || profileUser.displayName}
                variant="banner"
                autoPlay={autoPlaySong}
              />

              {isOwner && (
                <div className="flex items-center justify-end gap-3 text-xs pt-1">
                  <button
                    type="button"
                    onClick={() => songFileInputRef.current?.click()}
                    className="text-pink-600 hover:text-pink-700 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" /> تغيير الأغنية
                  </button>
                  <span className="text-gray-300">•</span>
                  <button
                    type="button"
                    onClick={handleRemoveSongClick}
                    className="text-red-500 hover:text-red-700 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> إزالة الأغنية
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white p-3.5 rounded-2xl border border-dashed border-gray-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 text-gray-500">
                <div className="p-2 bg-pink-50 text-pink-600 rounded-xl">
                  <Music className="w-5 h-5" />
                </div>
                <div>
                  <h5 className="text-xs sm:text-sm font-bold text-gray-800">أغنية البروفايل</h5>
                  <p className="text-[11px] text-gray-500">
                    {isOwner ? 'ارفع مقطعك الصوتي وسيتم تشغيله فوراً في بروفايلك' : 'لم يقم المستخدم برفع أغنية للبروفايل بعد'}
                  </p>
                </div>
              </div>

              {isOwner && (
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    disabled={isUploadingSong}
                    onClick={() => songFileInputRef.current?.click()}
                    className="flex-1 sm:flex-none bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center justify-center gap-1.5 shadow-xs shrink-0 cursor-pointer disabled:opacity-50"
                  >
                    {isUploadingSong ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>جاري المعالجة...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-3.5 h-3.5" />
                        <span>+ رفع ملف MP3 من الجهاز</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Quick Presets for Profile Owner */}
          {isOwner && !profileUser.songUrl && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-[10px] font-bold text-gray-500">أو اختر مقطع جاهز:</span>
              {AUDIO_PRESETS.map(preset => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  className="px-2.5 py-1 bg-white hover:bg-pink-50 text-gray-700 hover:text-pink-700 border border-gray-200 rounded-lg text-[11px] font-medium flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                >
                  <Radio className="w-3 h-3 text-pink-500" />
                  <span>{preset.title}</span>
                </button>
              ))}
            </div>
          )}

          {/* Hidden File Input */}
          <input
            type="file"
            accept="audio/*"
            ref={songFileInputRef}
            onChange={handleAudioFileUpload}
            className="hidden"
          />
        </div>

        {/* Content Navigation Tabs */}
        <div className="flex border-b border-gray-200 bg-white">
          <button
            type="button"
            onClick={() => setActiveTab('stories')}
            className={`flex-1 py-3 text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'stories' 
                ? 'border-pink-600 text-pink-600 bg-pink-50/40' 
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>القصص ({userStories.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('products')}
            className={`flex-1 py-3 text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'products' 
                ? 'border-pink-600 text-pink-600 bg-pink-50/40' 
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>الأصناف ({userProducts.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('reminders')}
            className={`flex-1 py-3 text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'reminders' 
                ? 'border-pink-600 text-pink-600 bg-pink-50/40' 
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            <span>النواقص ({userReminders.length})</span>
          </button>
        </div>

        {/* Tab Content Areas */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1">
          {/* TAB 1: STORIES */}
          {activeTab === 'stories' && (
            <div>
              {userStories.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {userStories.map((story) => (
                    <div 
                      key={story.id} 
                      onClick={onOpenStoryViewer}
                      className="relative aspect-[9/12] rounded-2xl overflow-hidden shadow-2xs border border-gray-200 cursor-pointer group hover:scale-[1.02] transition-transform"
                    >
                      {story.mediaUrl ? (
                        <img 
                          src={story.mediaUrl} 
                          alt="Story" 
                          className="w-full h-full object-cover" 
                          loading="lazy"
                        />
                      ) : (
                        <div className={`w-full h-full p-4 flex flex-col items-center justify-center text-center text-white ${story.bgColor || 'bg-gradient-to-tr from-pink-500 to-purple-600'}`}>
                          <p className="text-xs sm:text-sm font-bold line-clamp-4 leading-relaxed">
                            {story.caption || 'ستوري'}
                          </p>
                        </div>
                      )}

                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20 flex flex-col justify-between p-3 opacity-90 group-hover:opacity-100 transition-opacity">
                        <span className="text-[10px] text-white/90 font-medium">
                          {story.createdAt?.toDate ? new Date(story.createdAt.toDate()).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                        {story.caption && (
                          <p className="text-white text-xs font-bold truncate">
                            {story.caption}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-gray-400 space-y-2">
                  <Sparkles className="w-8 h-8 mx-auto text-gray-300" />
                  <p className="text-xs font-bold text-gray-600">لا توجد قصص منشورة لهذا العضو حالياً</p>
                  {isOwner && (
                    <button
                      type="button"
                      onClick={() => { onClose(); onOpenAddStory(); }}
                      className="text-xs bg-pink-600 hover:bg-pink-700 text-white font-bold px-4 py-2 rounded-xl transition-colors cursor-pointer"
                    >
                      + إضافة ستوري جديد
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PRODUCTS */}
          {activeTab === 'products' && (
            <div>
              {userProducts.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {userProducts.map((prod) => (
                    <div key={prod.id} className="bg-white rounded-2xl p-3 border border-gray-200 shadow-2xs space-y-2">
                      <div className="aspect-square rounded-xl bg-gray-100 overflow-hidden">
                        <img 
                          src={prod.imageUrl || 'https://placehold.co/150'} 
                          alt={prod.name} 
                          className="w-full h-full object-cover" 
                          loading="lazy"
                        />
                      </div>
                      <h4 className="text-xs font-bold text-gray-900 truncate">{prod.name}</h4>
                      <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md font-medium">
                        {prod.variations?.length || 0} أنواع/أحجام
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-gray-400">
                  <Package className="w-8 h-8 mx-auto text-gray-300 mb-1" />
                  <p className="text-xs font-bold text-gray-600">لم يقم العضو بإضافة أصناف بعد</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: REMINDERS / NOTES */}
          {activeTab === 'reminders' && (
            <div>
              {userReminders.length > 0 ? (
                <div className="space-y-2">
                  {userReminders.map((rem) => (
                    <div key={rem.id} className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between text-xs">
                      <span className="font-medium text-gray-800">{rem.text}</span>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${rem.completed ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {rem.completed ? 'تم التوفير ✓' : 'قيد الانتظار'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-gray-400">
                  <ClipboardList className="w-8 h-8 mx-auto text-gray-300 mb-1" />
                  <p className="text-xs font-bold text-gray-600">لا توجد ملاحظات أو نواقص مسجلة</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          {isOwner ? (
            <button
              type="button"
              onClick={() => { onClose(); onOpenEditProfile(); }}
              className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" /> تعديل البروفايل والصورة
            </button>
          ) : (
            <span className="text-[11px] text-gray-400">ملف تعريف مستخدم مكتبه الهدى</span>
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            إغلاق
          </button>
        </div>

      </div>
    </div>
  );
};
