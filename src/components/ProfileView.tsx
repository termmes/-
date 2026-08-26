import React, { useState, useEffect, useRef } from 'react';
import { User } from 'firebase/auth';
import { UserProfile, Story } from '../types';
import { db } from '../firebase';
import { doc, updateDoc, serverTimestamp, collection, onSnapshot, query, where, deleteDoc } from 'firebase/firestore';
import { compressImage } from '../utils';
import { saveAudioToLocalStore, deleteAudioFromLocalStore, AUDIO_PRESETS } from '../audioStorage';
import { ProfileAudioPlayer } from './ProfileAudioPlayer';
import { AddStoryModal } from './AddStoryModal';
import { StoryViewerModal } from './StoryViewerModal';
import { 
  Settings, 
  ImagePlus, 
  Save, 
  Download, 
  Music, 
  Upload, 
  Trash2, 
  Sparkles, 
  CheckCircle2, 
  Plus, 
  Volume2, 
  Radio, 
  Check, 
  Loader2 
} from 'lucide-react';

interface ProfileViewProps {
  user: User;
  profile: UserProfile | null;
  onInstallClick: () => void;
  canInstall: boolean;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  user,
  profile,
  onInstallClick,
  canInstall
}) => {
  const [displayName, setDisplayName] = useState(profile?.displayName || user.displayName || '');
  const [photoUrl, setPhotoUrl] = useState(profile?.photoUrl || user.photoURL || '');
  const [bio, setBio] = useState(profile?.bio || '');
  
  // Profile Song State
  const [songUrl, setSongUrl] = useState(profile?.songUrl || '');
  const [songTitle, setSongTitle] = useState(profile?.songTitle || '');
  const [songArtist, setSongArtist] = useState(profile?.songArtist || '');
  const [isUploadingAudio, setIsUploadingAudio] = useState(false);
  const [autoPlayNewSong, setAutoPlayNewSong] = useState(false);
  
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [myStories, setMyStories] = useState<Story[]>([]);
  const [isAddStoryOpen, setIsAddStoryOpen] = useState(false);
  const [isViewingStory, setIsViewingStory] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const songFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName || '');
      setPhotoUrl(profile.photoUrl || '');
      setBio(profile.bio || '');
      setSongUrl(profile.songUrl || '');
      setSongTitle(profile.songTitle || '');
      setSongArtist(profile.songArtist || '');
    }
  }, [profile]);

  // Fetch own stories
  useEffect(() => {
    if (!user.uid) return;
    const q = query(collection(db, 'stories'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMyStories(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Story)));
    }, (err) => {
      console.error("Error fetching my stories:", err);
    });
    return () => unsubscribe();
  }, [user.uid]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressedBase64 = await compressImage(file, 300, 300, 0.65);
        setPhotoUrl(compressedBase64);
      } catch (error) {
        console.error("Error compressing image:", error);
        alert("تعذر معالجة الصورة. يرجى اختيار صورة أخرى.");
      }
    }
  };

  // Instant Audio Upload & Auto-Play handling
  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingAudio(true);

    try {
      // 1. Save to high-speed client IndexedDB
      const localKey = `profile_song_${user.uid}`;
      const objectUrl = await saveAudioToLocalStore(localKey, file);

      const detectedTitle = file.name.replace(/\.[^/.]+$/, "");
      const detectedArtist = displayName || 'موسيقى البروفايل';
      const storageSongUrl = `local:${localKey}`;

      // 2. Clear the file input from device / DOM immediately
      if (songFileInputRef.current) {
        songFileInputRef.current.value = '';
      }

      // 3. Update local state
      setSongUrl(objectUrl); // For immediate instant playback
      setSongTitle(detectedTitle);
      setSongArtist(detectedArtist);
      setAutoPlayNewSong(true);

      // 4. Save to Firestore profile
      await updateDoc(doc(db, 'users', user.uid), {
        songUrl: storageSongUrl,
        songTitle: detectedTitle,
        songArtist: detectedArtist,
        updatedAt: serverTimestamp()
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to upload audio:", err);
      alert("حدث خطأ أثناء معالجة الملف الصوتي.");
    } finally {
      setIsUploadingAudio(false);
    }
  };

  const handleSelectPresetSong = async (preset: typeof AUDIO_PRESETS[0]) => {
    setIsUploadingAudio(true);
    try {
      setSongUrl(preset.url);
      setSongTitle(preset.title);
      setSongArtist(preset.artist);
      setAutoPlayNewSong(true);

      await updateDoc(doc(db, 'users', user.uid), {
        songUrl: preset.url,
        songTitle: preset.title,
        songArtist: preset.artist,
        updatedAt: serverTimestamp()
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Error setting preset song:", err);
    } finally {
      setIsUploadingAudio(false);
    }
  };

  const handleRemoveSong = async () => {
    if (window.confirm('هل تريد إزالة أغنية البروفايل؟')) {
      try {
        await deleteAudioFromLocalStore(`profile_song_${user.uid}`);
        setSongUrl('');
        setSongTitle('');
        setSongArtist('');
        setAutoPlayNewSong(false);

        await updateDoc(doc(db, 'users', user.uid), {
          songUrl: '',
          songTitle: '',
          songArtist: '',
          updatedAt: serverTimestamp()
        });
      } catch (err) {
        console.error("Error removing song:", err);
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        displayName: displayName.trim(),
        photoUrl,
        bio: bio.trim(),
        songUrl: songUrl.startsWith('blob:') ? `local:profile_song_${user.uid}` : songUrl.trim(),
        songTitle: songTitle.trim(),
        songArtist: songArtist.trim(),
        updatedAt: serverTimestamp()
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("حدث خطأ أثناء حفظ التعديلات.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteStory = async (storyId: string) => {
    await deleteDoc(doc(db, 'stories', storyId));
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      
      {/* PWA Install Banner */}
      {canInstall && (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
          <div>
            <h3 className="font-bold text-sm sm:text-base">تثبيت تطبيق مكتبه الهدى</h3>
            <p className="text-blue-100 text-xs mt-0.5">ثبّت التطبيق على هاتفك للوصول السريع ومتابعة الستوريات والأصناف بخفة وسرعة.</p>
          </div>
          <button
            onClick={onInstallClick}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white text-blue-700 hover:bg-blue-50 px-4 py-2 rounded-xl font-bold text-xs transition-all whitespace-nowrap shadow-xs active:scale-95 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            تثبيت التطبيق
          </button>
        </div>
      )}

      {/* Profile Card Header */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-200/80 overflow-hidden">
        
        {/* Banner with Profile details */}
        <div className="bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 p-5 sm:p-7 text-white">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
            
            {/* Avatar with Stories Ring */}
            <div className="relative shrink-0">
              <div 
                onClick={() => {
                  if (myStories.length > 0) setIsViewingStory(true);
                  else setIsAddStoryOpen(true);
                }}
                className={`w-22 h-22 sm:w-26 sm:h-26 rounded-full p-1 flex items-center justify-center cursor-pointer transition-transform hover:scale-105 shadow-md ${
                  myStories.length > 0
                    ? 'bg-gradient-to-tr from-amber-300 via-white to-pink-200 ring-4 ring-white/50'
                    : 'bg-white/20'
                }`}
                title={myStories.length > 0 ? 'مشاهدة ستورياتك' : 'إضافة ستوري'}
              >
                <img 
                  src={photoUrl || 'https://www.gravatar.com/avatar/?d=mp'} 
                  alt="Profile" 
                  className="w-full h-full rounded-full object-cover border-2 border-white" 
                  onError={(e) => { (e.target as HTMLImageElement).src = 'https://www.gravatar.com/avatar/?d=mp'; }}
                />
              </div>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 p-2 bg-white text-pink-600 rounded-full shadow-md hover:bg-pink-50 transition-colors cursor-pointer"
                title="تغيير الصورة الشخصية"
              >
                <ImagePlus className="w-4 h-4" />
              </button>
              <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageUpload} />
            </div>

            <div className="text-center sm:text-right flex-1 space-y-1">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <h2 className="text-lg sm:text-xl font-black">{displayName || 'مستخدم'}</h2>
                <CheckCircle2 className="w-4 h-4 fill-white text-rose-500" />
              </div>
              
              <p className="text-xs sm:text-sm text-white/90 leading-relaxed max-w-md">
                {bio || 'أضف نبذة شخصية عنك لتظهر لجميع الأعضاء...'}
              </p>

              <div className="flex items-center justify-center sm:justify-start gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddStoryOpen(true)}
                  className="bg-white/25 hover:bg-white/35 backdrop-blur-md text-white text-xs font-bold px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> + ستوري جديد ({myStories.length})
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Live Audio Player in Profile (Replaces Upload UI with Player and starts playing) */}
        {songUrl ? (
          <div className="p-4 bg-zinc-950 text-white border-b border-zinc-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-pink-400 flex items-center gap-1">
                <Music className="w-3.5 h-3.5" /> أغنية البروفايل الحالية (يستمع إليها زوار حسابك للأبد):
              </span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => songFileInputRef.current?.click()}
                  className="text-xs text-pink-400 hover:text-pink-300 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" /> تغيير الأغنية
                </button>
                <span className="text-zinc-600">•</span>
                <button
                  type="button"
                  onClick={handleRemoveSong}
                  className="text-xs text-red-400 hover:text-red-300 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" /> إزالة
                </button>
              </div>
            </div>
            
            <ProfileAudioPlayer
              songUrl={songUrl}
              songTitle={songTitle || 'أغنية البروفايل'}
              songArtist={songArtist || displayName}
              variant="banner"
              autoPlay={autoPlayNewSong}
            />
          </div>
        ) : (
          /* Upload Audio Card if no song set */
          <div className="p-4 sm:p-5 bg-pink-50/40 border-b border-pink-100/70">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-pink-600 text-white rounded-2xl shadow-xs">
                  <Music className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-gray-900">أغنية البروفايل الدائمة (Instagram Song)</h4>
                  <p className="text-[11px] text-gray-500 mt-0.5">ارفع أغنية أو مقطع صوتي، وستحل مكانها فوراً المشغلة مع زر التشغيل وتعمل تلقائياً.</p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  disabled={isUploadingAudio}
                  onClick={() => songFileInputRef.current?.click()}
                  className="flex-1 sm:flex-none px-4 py-2.5 bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  {isUploadingAudio ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>جاري المعالجة...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      <span>رفع ملف MP3 من الجهاز</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Quick Audio Presets */}
            <div className="mt-3 pt-3 border-t border-pink-100/60">
              <span className="text-[10px] font-bold text-gray-500 block mb-1.5">أو اختر مقطع صوتي هادئ بضغطة واحدة:</span>
              <div className="flex flex-wrap gap-2">
                {AUDIO_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPresetSong(preset)}
                    className="px-3 py-1.5 bg-white hover:bg-pink-50 text-gray-700 hover:text-pink-700 border border-gray-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                  >
                    <Radio className="w-3 h-3 text-pink-500" />
                    <span>{preset.title}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Hidden Audio File Input */}
        <input
          type="file"
          accept="audio/*"
          ref={songFileInputRef}
          onChange={handleAudioUpload}
          className="hidden"
        />

        {/* Edit Form */}
        <form onSubmit={handleSave} className="p-5 sm:p-7 space-y-5">
          <div className="border-b border-gray-100 pb-3">
            <h3 className="text-sm sm:text-base font-bold text-gray-900 flex items-center gap-2">
              <Settings className="w-4 h-4 text-blue-600" /> تعديل بيانات الحساب والبروفايل
            </h3>
          </div>

          {/* Display Name */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">الاسم المعروض (Display Name)</label>
            <input 
              type="text" 
              value={displayName} 
              onChange={e => setDisplayName(e.target.value)} 
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none text-xs sm:text-sm font-bold" 
              placeholder="اسمك الكامل أو اللقب..."
              required 
              maxLength={100}
            />
          </div>

          {/* Bio */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">النبذة الشخصية (Bio)</label>
            <textarea 
              value={bio} 
              onChange={e => setBio(e.target.value)} 
              rows={2}
              className="w-full px-3.5 py-2 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none text-xs sm:text-sm font-medium resize-none" 
              placeholder="اكتب نبذة قصيرة عنك أو وظيفتك أو اهتماماتك..."
              maxLength={300}
            />
          </div>

          {/* Success Toast Banner */}
          {saveSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>تم حفظ وتحديث البروفايل والمقطع الصوتي بنجاح!</span>
            </div>
          )}

          {/* Save Button */}
          <button 
            type="submit" 
            disabled={isSaving} 
            className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-3 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm active:scale-95 cursor-pointer min-h-[44px]"
          >
            <Save className="w-4 h-4" /> {isSaving ? 'جاري الحفظ...' : 'حفظ التعديلات'}
          </button>
        </form>
      </div>

      {/* Stories Management Section */}
      <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-200/80 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-gray-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-pink-600" /> قصصك ويومياتك المنشورة (Stories)
            </h3>
            <p className="text-[11px] text-gray-500 mt-0.5">
              يمكنك استعراض قصصك الحالية أو إضافة وحذف أي ستوري
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsAddStoryOpen(true)}
            className="bg-pink-50 text-pink-700 hover:bg-pink-100 px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> نشر ستوري
          </button>
        </div>

        {myStories.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
            {myStories.map(s => (
              <div key={s.id} className="relative aspect-[9/12] rounded-2xl overflow-hidden shadow-2xs border border-gray-200 group">
                {s.mediaUrl ? (
                  <img src={s.mediaUrl} alt="Story" className="w-full h-full object-cover" loading="lazy" />
                ) : (
                  <div className={`w-full h-full p-3 flex flex-col items-center justify-center text-center text-white ${s.bgColor || 'bg-gradient-to-tr from-pink-500 to-purple-600'}`}>
                    <p className="text-xs font-bold line-clamp-3">{s.caption || 'ستوري'}</p>
                  </div>
                )}
                
                <button
                  type="button"
                  onClick={() => handleDeleteStory(s.id)}
                  className="absolute top-2 left-2 p-1.5 bg-black/60 hover:bg-red-600 text-white rounded-lg transition-colors cursor-pointer"
                  title="حذف هذا الستوري"
                >
                  <Trash2 className="w-3 h-3" />
                </button>

                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent text-white text-[10px] font-bold truncate">
                  {s.caption || 'قصة'}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-gray-400 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
            <Sparkles className="w-6 h-6 mx-auto mb-1 text-gray-300" />
            <p className="text-xs font-bold text-gray-600">لا توجد لديك قصص نشطة حالياً</p>
            <button
              type="button"
              onClick={() => setIsAddStoryOpen(true)}
              className="mt-2 text-xs bg-pink-600 text-white px-3.5 py-1.5 rounded-xl font-bold hover:bg-pink-700 transition-colors cursor-pointer"
            >
              + إضافة أول ستوري الآن
            </button>
          </div>
        )}
      </div>

      {/* Story Viewer for own stories */}
      {isViewingStory && myStories.length > 0 && (
        <StoryViewerModal
          storiesByUser={[{
            userId: user.uid,
            authorName: displayName,
            authorPhoto: photoUrl,
            stories: myStories
          }]}
          initialUserIndex={0}
          currentUserId={user.uid}
          onClose={() => setIsViewingStory(false)}
          onDeleteStory={handleDeleteStory}
        />
      )}

      {/* Add Story Modal */}
      {isAddStoryOpen && (
        <AddStoryModal
          isOpen={isAddStoryOpen}
          onClose={() => setIsAddStoryOpen(false)}
          onPostStory={async (data) => {
            const { addDoc } = await import('firebase/firestore');
            await addDoc(collection(db, 'stories'), {
              userId: user.uid,
              authorName: displayName || 'مستخدم',
              authorPhoto: photoUrl || '',
              mediaUrl: data.mediaUrl || null,
              caption: data.caption || null,
              bgColor: data.bgColor || null,
              createdAt: serverTimestamp()
            });
          }}
          userPhoto={photoUrl}
          userName={displayName || 'أنا'}
        />
      )}

    </div>
  );
};
