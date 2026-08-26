import React, { useState, useEffect, useRef } from 'react';
import { User } from 'firebase/auth';
import { UserProfile, Story } from '../types';
import { db } from '../firebase';
import { doc, updateDoc, serverTimestamp, collection, onSnapshot, query, where, deleteDoc } from 'firebase/firestore';
import { compressImage } from '../utils';
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
  Disc, 
  Plus, 
  Volume2, 
  Info 
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
        const compressedBase64 = await compressImage(file, 400, 400, 0.7);
        setPhotoUrl(compressedBase64);
      } catch (error) {
        console.error("Error compressing image:", error);
        alert("تعذر معالجة الصورة. يرجى اختيار صورة أصغر.");
      }
    }
  };

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 4 * 1024 * 1024) {
      alert("حجم الملف الصوتي كبير (أقصى حجم 4MB). يرجى اختيار ملف أصغر.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setSongUrl(reader.result as string);
      if (!songTitle) {
        setSongTitle(file.name.replace(/\.[^/.]+$/, ""));
      }
      if (!songArtist) {
        setSongArtist(displayName || 'موسيقى');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveSong = () => {
    if (window.confirm('هل تريد إزالة أغنية البروفايل؟')) {
      setSongUrl('');
      setSongTitle('');
      setSongArtist('');
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
        songUrl: songUrl.trim(),
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
    <div className="max-w-3xl mx-auto space-y-6">
      
      {/* PWA Install Banner */}
      {canInstall && (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-3xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
          <div>
            <h3 className="font-extrabold text-base sm:text-lg">تثبيت تطبيق مكتبه الهدى</h3>
            <p className="text-blue-100 text-xs mt-0.5">ثبّت التطبيق على هاتفك للوصول السريع ومتابعة الستوريات والأصناف.</p>
          </div>
          <button
            onClick={onInstallClick}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white text-blue-700 hover:bg-blue-50 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap shadow-sm active:scale-95"
          >
            <Download className="w-4 h-4" />
            تثبيت التطبيق
          </button>
        </div>
      )}

      {/* Main Instagram Profile Card & Live Preview */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-200/80 overflow-hidden">
        
        {/* Instagram Profile Header Banner */}
        <div className="bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 p-6 text-white">
          <div className="flex flex-col sm:flex-row items-center gap-5">
            <div className="relative">
              <div 
                onClick={() => {
                  if (myStories.length > 0) setIsViewingStory(true);
                  else setIsAddStoryOpen(true);
                }}
                className={`w-24 h-24 sm:w-28 sm:h-28 rounded-full p-1 flex items-center justify-center cursor-pointer transition-transform hover:scale-105 shadow-md ${
                  myStories.length > 0
                    ? 'bg-gradient-to-tr from-amber-300 via-white to-pink-200 ring-4 ring-white/50 animate-[pulse_3s_infinite]'
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
                className="absolute -bottom-1 -right-1 p-2 bg-white text-pink-600 rounded-full shadow-md hover:bg-pink-50 transition-colors"
                title="تغيير الصورة الشخصية"
              >
                <ImagePlus className="w-4 h-4" />
              </button>
              <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageUpload} />
            </div>

            <div className="text-center sm:text-right flex-1 space-y-1">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <h2 className="text-xl sm:text-2xl font-black">{displayName || 'مستخدم'}</h2>
                <CheckCircle2 className="w-4 h-4 fill-white text-rose-500" />
              </div>
              
              <p className="text-xs sm:text-sm text-white/90 leading-relaxed max-w-md">
                {bio || 'أضف نبذة شخصية عنك لتظهر لجميع الأعضاء...'}
              </p>

              <div className="flex items-center justify-center sm:justify-start gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddStoryOpen(true)}
                  className="bg-white/25 hover:bg-white/35 backdrop-blur-md text-white text-xs font-black px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> + ستوري جديد ({myStories.length})
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Live Audio Preview in Profile if song exists */}
        {songUrl && (
          <div className="p-4 bg-gray-900 text-white border-b border-zinc-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-pink-400 flex items-center gap-1">
                <Music className="w-3.5 h-3.5" /> معاينة أغنية بروفايلك الحالية:
              </span>
              <button
                type="button"
                onClick={handleRemoveSong}
                className="text-xs text-red-400 hover:text-red-300 font-bold flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" /> إزالة الأغنية
              </button>
            </div>
            <ProfileAudioPlayer
              songUrl={songUrl}
              songTitle={songTitle || 'أغنية البروفايل'}
              songArtist={songArtist || displayName}
              variant="banner"
            />
          </div>
        )}

        {/* Edit Form */}
        <form onSubmit={handleSave} className="p-6 sm:p-8 space-y-6">
          <div className="border-b border-gray-100 pb-4">
            <h3 className="text-base font-black text-gray-900 flex items-center gap-2">
              <Settings className="w-5 h-5 text-blue-600" /> تعديل بيانات الحساب والبروفايل
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              عدّل معلوماتك الشخصية وأغنية البروفايل الدائمة التي يستمع إليها الأعضاء
            </p>
          </div>

          {/* Display Name */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">الاسم المعروض (Display Name)</label>
            <input 
              type="text" 
              value={displayName} 
              onChange={e => setDisplayName(e.target.value)} 
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none text-sm font-bold" 
              placeholder="اسمك الكامل أو اللقب..."
              required 
              maxLength={100}
            />
          </div>

          {/* Bio */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">النبذة الشخصية (Bio)</label>
            <textarea 
              value={bio} 
              onChange={e => setBio(e.target.value)} 
              rows={3}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none text-xs sm:text-sm font-medium resize-none" 
              placeholder="اكتب نبذة قصيرة عنك أو وظيفتك أو اهتماماتك..."
              maxLength={300}
            />
            <span className="text-[10px] text-gray-400 block text-left mt-1">{bio.length}/300 حرف</span>
          </div>

          {/* SECTION: Permanent Profile Song Upload (Instagram Music) */}
          <div className="bg-pink-50/50 p-4 sm:p-5 rounded-2xl border border-pink-200/80 space-y-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className="text-sm font-black text-gray-900 flex items-center gap-2">
                  <div className="p-1.5 bg-pink-600 text-white rounded-lg">
                    <Music className="w-4 h-4" />
                  </div>
                  <span>أغنية البروفايل الدائمة (Instagram Profile Song)</span>
                </h4>
                <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                  ارفع مقطعك الصوتي أو أغنيتك المفضلة، وستظل متاحة في بروفايلك مدى الحياة ليستمع إليها أي شخص يزور حسابك، إلا إذا قمت بتغييرها أو حذفها.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">اسم الأغنية / المقطع</label>
                <input
                  type="text"
                  placeholder="مثال: نغمة هادئة / أغنية مميزة"
                  value={songTitle}
                  onChange={(e) => setSongTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">اسم الفنان / المنشد</label>
                <input
                  type="text"
                  placeholder="مثال: فنان / منشد"
                  value={songArtist}
                  onChange={(e) => setSongArtist(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">الملف الصوتي (MP3 / Audio)</label>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <button
                  type="button"
                  onClick={() => songFileInputRef.current?.click()}
                  className="px-4 py-2.5 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  {songUrl ? 'تغيير الملف الصوتي' : 'رفع ملف MP3 من الجهاز'}
                </button>
                <input
                  type="file"
                  accept="audio/*"
                  ref={songFileInputRef}
                  onChange={handleAudioUpload}
                  className="hidden"
                />
                
                {songUrl && (
                  <button
                    type="button"
                    onClick={handleRemoveSong}
                    className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-xl text-xs font-bold transition-colors border border-red-200"
                  >
                    حذف الأغنية
                  </button>
                )}
              </div>

              <div className="mt-2">
                <input
                  type="url"
                  placeholder="أو ضع رابط مباشر لملف صوتي (https://...mp3)"
                  value={songUrl.startsWith('data:') ? 'تم رفع ملف MP3 من جهازك بنجاح ✓' : songUrl}
                  onChange={(e) => setSongUrl(e.target.value)}
                  disabled={songUrl.startsWith('data:')}
                  className="w-full px-3.5 py-2 bg-white border border-gray-300 rounded-xl text-xs font-mono outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>
            </div>
          </div>

          {/* Success Toast Banner */}
          {saveSuccess && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 animate-fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>تم حفظ وتحديث البروفايل وأغنية الحساب بنجاح!</span>
            </div>
          )}

          {/* Save Button */}
          <button 
            type="submit" 
            disabled={isSaving} 
            className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-3.5 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-md active:scale-95 cursor-pointer min-h-[48px]"
          >
            <Save className="w-4 h-4" /> {isSaving ? 'جاري الحفظ...' : 'حفظ ونشر التعديلات'}
          </button>
        </form>
      </div>

      {/* Stories Management Section */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200/80 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-black text-gray-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-pink-600" /> قصصك ويومياتك المنشورة (Stories)
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              يمكنك استعراض قصصك الحالية أو إضافة وحذف أي ستوري
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsAddStoryOpen(true)}
            className="bg-pink-50 text-pink-700 hover:bg-pink-100 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" /> نشر ستوري
          </button>
        </div>

        {myStories.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            {myStories.map(s => (
              <div key={s.id} className="relative aspect-[9/12] rounded-2xl overflow-hidden shadow-xs border border-gray-200 group">
                {s.mediaUrl ? (
                  <img src={s.mediaUrl} alt="Story" className="w-full h-full object-cover" />
                ) : (
                  <div className={`w-full h-full p-3 flex flex-col items-center justify-center text-center text-white ${s.bgColor || 'bg-gradient-to-tr from-pink-500 to-purple-600'}`}>
                    <p className="text-xs font-black line-clamp-3">{s.caption || 'ستوري'}</p>
                  </div>
                )}
                
                <button
                  type="button"
                  onClick={() => handleDeleteStory(s.id)}
                  className="absolute top-2 left-2 p-1.5 bg-black/60 hover:bg-red-600 text-white rounded-lg transition-colors cursor-pointer"
                  title="حذف هذا الستوري"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>

                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent text-white text-[10px] font-bold">
                  {s.caption || 'قصة'}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
            <Sparkles className="w-8 h-8 mx-auto mb-1.5 text-gray-300" />
            <p className="text-xs font-bold text-gray-600">لا توجد لديك قصص نشطة حالياً</p>
            <button
              type="button"
              onClick={() => setIsAddStoryOpen(true)}
              className="mt-2 text-xs bg-pink-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-pink-700 transition-colors cursor-pointer"
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
