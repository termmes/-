import React, { useState } from 'react';
import { UserProfile, Story, Product, ReminderItem } from '../types';
import { ProfileAudioPlayer } from './ProfileAudioPlayer';
import { 
  X, 
  Music, 
  Sparkles, 
  Package, 
  ClipboardList, 
  Plus, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  Calendar,
  ExternalLink,
  Upload,
  Disc
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
  onOpenEditProfile?: () => void;
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
  const [newSongTitle, setNewSongTitle] = useState('');
  const [newSongArtist, setNewSongArtist] = useState('');
  const [newSongUrl, setNewSongUrl] = useState('');
  const songFileInputRef = React.useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const hasStories = userStories.length > 0;

  const handleAudioFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 4 * 1024 * 1024) {
      alert("حجم الملف الصوتي كبير جداً (الحد الأقصى 4 ميجابايت). يرجى اختيار مقطع صوتي أصغر.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setNewSongUrl(reader.result as string);
      if (!newSongTitle) {
        setNewSongTitle(file.name.replace(/\.[^/.]+$/, ""));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveSong = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSongUrl.trim()) {
      alert("يرجى اختيار ملف صوتي أو إدخال رابط الأغنية.");
      return;
    }
    if (!onUpdateSong) return;

    setIsUploadingSong(true);
    try {
      await onUpdateSong(
        newSongUrl.trim(),
        newSongTitle.trim() || 'أغنية البروفايل',
        newSongArtist.trim() || profileUser.displayName
      );
      setShowSongUploader(false);
      setNewSongUrl('');
      setNewSongTitle('');
      setNewSongArtist('');
    } catch (err) {
      console.error("Error saving song:", err);
      alert("حدث خطأ أثناء حفظ الأغنية.");
    } finally {
      setIsUploadingSong(false);
    }
  };

  const handleRemoveSongClick = async () => {
    if (!onRemoveSong) return;
    if (window.confirm('هل تريد حذف أغنية البروفايل نهائياً؟')) {
      await onRemoveSong();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
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
                className={`w-24 h-24 sm:w-28 sm:h-28 rounded-full p-1 flex items-center justify-center cursor-pointer transition-transform hover:scale-105 shadow-md ${
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
                  className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-rose-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full border border-white shadow-xs cursor-pointer flex items-center gap-1"
                >
                  <Sparkles className="w-2.5 h-2.5" />
                  <span>ستوري ({userStories.length})</span>
                </div>
              )}
            </div>

            {/* User Meta & Bio */}
            <div className="flex-1 text-center sm:text-right min-w-0 space-y-1.5">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h3 className="text-xl sm:text-2xl font-black text-white drop-shadow-xs">
                  {profileUser.displayName}
                </h3>
                <span className="bg-white/25 backdrop-blur-md text-white text-[11px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1">
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
                  لا توجد نبذة شخصية بعد
                </p>
              )}

              {/* Instagram Stats Counters */}
              <div className="flex items-center justify-center sm:justify-start gap-5 pt-2 text-white">
                <div className="text-center sm:text-right">
                  <div className="text-base sm:text-lg font-black">{userStories.length}</div>
                  <div className="text-[10px] text-white/80">القصص</div>
                </div>
                <div className="h-6 w-[1px] bg-white/30" />
                <div className="text-center sm:text-right">
                  <div className="text-base sm:text-lg font-black">{userProducts.length}</div>
                  <div className="text-[10px] text-white/80">المنتجات</div>
                </div>
                <div className="h-6 w-[1px] bg-white/30" />
                <div className="text-center sm:text-right">
                  <div className="text-base sm:text-lg font-black">{userReminders.length}</div>
                  <div className="text-[10px] text-white/80">الملاحظات</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Music Player Bar (Instagram Profile Track Feature) */}
        <div className="p-4 bg-gray-50 border-b border-gray-100 space-y-2">
          {profileUser.songUrl ? (
            <div className="space-y-2">
              <ProfileAudioPlayer
                songUrl={profileUser.songUrl}
                songTitle={profileUser.songTitle || 'أغنية الملف الشخصي'}
                songArtist={profileUser.songArtist || profileUser.displayName}
                variant="banner"
              />

              {isOwner && (
                <div className="flex items-center justify-end gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setShowSongUploader(!showSongUploader)}
                    className="text-pink-600 hover:text-pink-700 font-bold flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> تغيير الأغنية
                  </button>
                  <span className="text-gray-300">•</span>
                  <button
                    type="button"
                    onClick={handleRemoveSongClick}
                    className="text-red-500 hover:text-red-700 font-bold flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> إزالة الأغنية
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white p-3.5 rounded-2xl border border-dashed border-gray-300 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 text-gray-500">
                <div className="p-2 bg-pink-50 text-pink-600 rounded-xl">
                  <Music className="w-5 h-5" />
                </div>
                <div>
                  <h5 className="text-xs sm:text-sm font-bold text-gray-800">أغنية البروفايل</h5>
                  <p className="text-[11px] text-gray-400">
                    {isOwner ? 'أضف أغنيتك المفضلة ليستمع إليها كل من يزور بروفايلك للأبد' : 'لم يقم المستخدم برفع أغنية للبروفايل بعد'}
                  </p>
                </div>
              </div>

              {isOwner && (
                <button
                  type="button"
                  onClick={() => setShowSongUploader(!showSongUploader)}
                  className="bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-xs shrink-0 cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>+ رفع أغنية</span>
                </button>
              )}
            </div>
          )}

          {/* Song Uploader Form for Owner */}
          {isOwner && showSongUploader && (
            <form onSubmit={handleSaveSong} className="bg-white p-4 rounded-2xl border border-pink-200 shadow-sm space-y-3 mt-2">
              <h4 className="text-xs font-black text-gray-900 flex items-center gap-1.5">
                <Music className="w-4 h-4 text-pink-600" />
                <span>رفع وتعيين أغنية للبروفايل (تظل متاحة للجميع للأبد)</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-1">اسم الأغنية</label>
                  <input
                    type="text"
                    placeholder="مثال: نغمة هادئة / أغنية مميزة"
                    value={newSongTitle}
                    onChange={(e) => setNewSongTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-pink-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-1">اسم الفنان / المنشد</label>
                  <input
                    type="text"
                    placeholder="مثال: فنان / منشد"
                    value={newSongArtist}
                    onChange={(e) => setNewSongArtist(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-600 mb-1">الملف الصوتي (MP3 / Audio)</label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => songFileInputRef.current?.click()}
                    className="px-4 py-2 bg-pink-50 hover:bg-pink-100 text-pink-700 rounded-xl text-xs font-bold border border-pink-200 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    {newSongUrl ? 'تم اختيار الملف الصوتي ✓' : 'اختر ملف MP3 من جهازك'}
                  </button>
                  <input
                    type="file"
                    accept="audio/*"
                    ref={songFileInputRef}
                    onChange={handleAudioFileUpload}
                    className="hidden"
                  />
                  <span className="text-[11px] text-gray-400">أو رابط صوتي مباشر</span>
                </div>
                <input
                  type="url"
                  placeholder="رابط ملف صوتي مباشر (https://...mp3)"
                  value={newSongUrl.startsWith('data:') ? 'تم رفع ملف محلي' : newSongUrl}
                  onChange={(e) => setNewSongUrl(e.target.value)}
                  disabled={newSongUrl.startsWith('data:')}
                  className="w-full mt-1.5 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-pink-500 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowSongUploader(false)}
                  className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isUploadingSong}
                  className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-xs font-black transition-all shadow-xs flex items-center gap-1.5"
                >
                  {isUploadingSong ? 'جاري الحفظ...' : 'حفظ الأغنية بالبروفايل'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Tab Navigation (Instagram Style) */}
        <div className="flex items-center justify-around border-b border-gray-100 bg-white">
          <button
            onClick={() => setActiveTab('stories')}
            className={`flex-1 py-3 text-xs sm:text-sm font-black flex items-center justify-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'stories' 
                ? 'border-pink-600 text-pink-600' 
                : 'border-transparent text-gray-400 hover:text-gray-700'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>القصص واليوميات ({userStories.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('products')}
            className={`flex-1 py-3 text-xs sm:text-sm font-black flex items-center justify-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'products' 
                ? 'border-blue-600 text-blue-600' 
                : 'border-transparent text-gray-400 hover:text-gray-700'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>المنتجات المضافة ({userProducts.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('reminders')}
            className={`flex-1 py-3 text-xs sm:text-sm font-black flex items-center justify-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'reminders' 
                ? 'border-emerald-600 text-emerald-600' 
                : 'border-transparent text-gray-400 hover:text-gray-700'
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            <span>ملاحظات النواقص ({userReminders.length})</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-gray-50/50">
          {/* TAB 1: STORIES */}
          {activeTab === 'stories' && (
            <div className="space-y-4">
              {isOwner && (
                <button
                  type="button"
                  onClick={onOpenAddStory}
                  className="w-full py-3 bg-white hover:bg-pink-50 border-2 border-dashed border-pink-300 text-pink-600 font-bold rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> + نشر قصة (ستوري) جديدة
                </button>
              )}

              {userStories.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {userStories.map((s, idx) => (
                    <div
                      key={s.id}
                      onClick={onOpenStoryViewer}
                      className="group relative aspect-[9/12] rounded-2xl overflow-hidden shadow-xs cursor-pointer border border-gray-200 transition-transform hover:scale-[1.02]"
                    >
                      {s.mediaUrl ? (
                        <img src={s.mediaUrl} alt="Story" className="w-full h-full object-cover" />
                      ) : (
                        <div className={`w-full h-full p-4 flex flex-col justify-center items-center text-center text-white ${s.bgColor || 'bg-gradient-to-tr from-pink-500 to-purple-600'}`}>
                          <p className="text-xs font-black line-clamp-4">{s.caption || 'ستوري'}</p>
                        </div>
                      )}
                      
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-2.5 text-white">
                        <span className="text-[10px] font-medium opacity-90 line-clamp-1">
                          {s.caption || 'قصة'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-gray-400 bg-white rounded-2xl border border-gray-100">
                  <Sparkles className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-xs sm:text-sm font-bold text-gray-600">لا توجد قصص منشورة لهذا الحساب</p>
                  {isOwner && (
                    <button
                      type="button"
                      onClick={onOpenAddStory}
                      className="mt-3 text-xs bg-pink-50 text-pink-600 px-4 py-2 rounded-xl font-bold hover:bg-pink-100 transition-colors"
                    >
                      انشر أول ستوري لك الآن
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PRODUCTS */}
          {activeTab === 'products' && (
            <div className="space-y-3">
              {userProducts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {userProducts.map(p => (
                    <div key={p.id} className="bg-white p-3 rounded-2xl border border-gray-200/80 flex items-center gap-3">
                      <img
                        src={p.imageUrl}
                        alt={p.name}
                        className="w-12 h-12 rounded-xl object-cover border border-gray-100"
                        onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/100x100?text=منتج'; }}
                      />
                      <div className="min-w-0 flex-1">
                        <h5 className="font-black text-xs sm:text-sm text-gray-900 truncate">{p.name}</h5>
                        <p className="text-[11px] text-gray-400">{p.variations?.length || 0} أصناف مسجلة</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-gray-400 bg-white rounded-2xl border border-gray-100">
                  <Package className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-xs sm:text-sm font-bold text-gray-600">لا توجد منتجات مسجلة بواسطة هذا العضو</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: REMINDERS */}
          {activeTab === 'reminders' && (
            <div className="space-y-2">
              {userReminders.length > 0 ? (
                userReminders.map(r => (
                  <div key={r.id} className="bg-white p-3 rounded-xl border border-gray-200/80 flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-gray-800">{r.text}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${r.completed ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                      {r.completed ? 'تم التوفير ✓' : 'مطلوب توفيره'}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 text-gray-400 bg-white rounded-2xl border border-gray-100">
                  <ClipboardList className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-xs sm:text-sm font-bold text-gray-600">لا توجد ملاحظات نواقص مسجلة</p>
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
