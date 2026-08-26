import React, { useState, useEffect, useRef } from 'react';
import { User } from 'firebase/auth';
import { UserProfile, ProfileCustomization } from '../types';
import { db } from '../firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { compressImage } from '../utils';
import { ProfileHeaderDisplay } from './ProfileHeaderDisplay';
import { 
  BANNER_THEMES, 
  AVATAR_FRAMES, 
  AVATAR_SHAPES, 
  ANIMATED_EFFECTS, 
  PROFILE_BADGES, 
  TRENDING_PRESETS,
  BannerThemeOption,
  AvatarFrameOption,
  TrendingPreset
} from '../profileThemes';
import { 
  Settings, 
  ImagePlus, 
  Save, 
  Download, 
  CheckCircle2, 
  Sparkles,
  Palette,
  Layers,
  CircleDot,
  Wand2,
  Upload,
  User as UserIcon,
  Flame,
  Gamepad2,
  Crown,
  Eye,
  RefreshCw,
  Sliders,
  ShieldAlert
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
  // Basic info state
  const [displayName, setDisplayName] = useState(profile?.displayName || user.displayName || '');
  const [photoUrl, setPhotoUrl] = useState(profile?.photoUrl || user.photoURL || '');
  const [bio, setBio] = useState(profile?.bio || '');

  // Customization state
  const [bannerTheme, setBannerTheme] = useState<string>(profile?.customization?.bannerTheme || 'classic-blue');
  const [bannerCustomUrl, setBannerCustomUrl] = useState<string>(profile?.customization?.bannerCustomUrl || '');
  const [avatarFrame, setAvatarFrame] = useState<string>(profile?.customization?.avatarFrame || 'classic-white');
  const [avatarShape, setAvatarShape] = useState<'circle' | 'squircle' | 'hexagon' | 'diamond' | 'shield'>(
    profile?.customization?.avatarShape || 'circle'
  );
  const [animatedEffect, setAnimatedEffect] = useState<'none' | 'stars' | 'sparks' | 'cyber-grid' | 'matrix' | 'sakura' | 'aurora' | 'bubbles'>(
    profile?.customization?.animatedEffect || 'none'
  );
  const [badgeTitle, setBadgeTitle] = useState<string>(profile?.customization?.badgeTitle || 'عضو معتمد');
  const [badgeIcon, setBadgeIcon] = useState<string>(profile?.customization?.badgeIcon || '🛡️');
  const [badgeColor, setBadgeColor] = useState<string>(profile?.customization?.badgeColor || '#3b82f6');

  // Studio tabs
  const [studioTab, setStudioTab] = useState<'presets' | 'banner' | 'frame' | 'effects' | 'badge' | 'account'>('presets');

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const bannerFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName || user.displayName || '');
      setPhotoUrl(profile.photoUrl || user.photoURL || '');
      setBio(profile.bio || '');

      if (profile.customization) {
        setBannerTheme(profile.customization.bannerTheme || 'classic-blue');
        setBannerCustomUrl(profile.customization.bannerCustomUrl || '');
        setAvatarFrame(profile.customization.avatarFrame || 'classic-white');
        setAvatarShape(profile.customization.avatarShape || 'circle');
        setAnimatedEffect(profile.customization.animatedEffect || 'none');
        setBadgeTitle(profile.customization.badgeTitle || 'عضو معتمد');
        setBadgeIcon(profile.customization.badgeIcon || '🛡️');
        setBadgeColor(profile.customization.badgeColor || '#3b82f6');
      }
    }
  }, [profile, user]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressedBase64 = await compressImage(file, 300, 300, 0.65);
        setPhotoUrl(compressedBase64);
      } catch (error) {
        console.error("Error compressing avatar image:", error);
        alert("تعذر معالجة الصورة. يرجى اختيار صورة أخرى.");
      }
    }
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploadingBanner(true);
      try {
        const compressedBase64 = await compressImage(file, 1200, 400, 0.7);
        setBannerCustomUrl(compressedBase64);
      } catch (error) {
        console.error("Error compressing banner image:", error);
        alert("تعذر رفع خلفية الغلاف. يرجى اختيار صورة أخرى.");
      } finally {
        setIsUploadingBanner(false);
      }
    }
  };

  // Apply Trending Preset
  const handleApplyTrendingPreset = (preset: TrendingPreset) => {
    setBannerTheme(preset.bannerTheme);
    setAvatarFrame(preset.avatarFrame);
    setAvatarShape(preset.avatarShape);
    setAnimatedEffect(preset.animatedEffect);
    setBadgeTitle(preset.badgeTitle);
    setBadgeIcon(preset.badgeIcon);
    setBadgeColor(preset.badgeColor);
  };

  const handleSaveProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const customizationData: ProfileCustomization = {
        bannerTheme,
        bannerCustomUrl,
        avatarFrame,
        avatarShape,
        cardTheme: 'glass',
        animatedEffect,
        badgeTitle: badgeTitle.trim() || 'عضو معتمد',
        badgeIcon: badgeIcon.trim() || '🛡️',
        badgeColor,
        fontStyle: 'default'
      };

      await updateDoc(doc(db, 'users', user.uid), {
        displayName: displayName.trim(),
        photoUrl,
        bio: bio.trim(),
        customization: customizationData,
        // Ensure old audio keys are cleanly wiped
        songUrl: '',
        songTitle: '',
        songArtist: '',
        clipStartTime: 0,
        clipDuration: 0,
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

  // Current customization object for live header preview
  const liveCustomization: ProfileCustomization = {
    bannerTheme,
    bannerCustomUrl,
    avatarFrame,
    avatarShape,
    cardTheme: 'glass',
    animatedEffect,
    badgeTitle: badgeTitle || 'عضو معتمد',
    badgeIcon: badgeIcon || '🛡️',
    badgeColor
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* PWA Install Banner */}
      {canInstall && (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
          <div>
            <h3 className="font-bold text-sm sm:text-base">تثبيت تطبيق مكتبه الهدى</h3>
            <p className="text-blue-100 text-xs mt-0.5">ثبّت التطبيق على هاتفك للوصول السريع والعمل بأفضل أداء وسرعة.</p>
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

      {/* Main Profile Studio Card */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-200/80 overflow-hidden">
        
        {/* Top Header: Live Interactive Banner Preview */}
        <div className="relative">
          <div className="flex items-center justify-between px-4 py-2.5 bg-gray-900 text-white text-[11px] font-bold">
            <span className="flex items-center gap-1.5 text-cyan-400">
              <Eye className="w-3.5 h-3.5" /> معاينة مباشرة لمظهر ملفك الشخصي
            </span>
            <span className="text-gray-400">يتغير فورياً عند اختيار أي خيار بالأسفل</span>
          </div>

          <ProfileHeaderDisplay
            displayName={displayName}
            photoUrl={photoUrl}
            bio={bio}
            customization={liveCustomization}
            showEditButton={true}
            onEditAvatarClick={() => fileInputRef.current?.click()}
          />
        </div>

        {/* Hidden File Inputs */}
        <input 
          type="file" 
          accept="image/*" 
          className="hidden" 
          ref={fileInputRef} 
          onChange={handleImageUpload} 
        />
        <input 
          type="file" 
          accept="image/*" 
          className="hidden" 
          ref={bannerFileInputRef} 
          onChange={handleBannerUpload} 
        />

        {/* Navigation Tabs for Customization Studio */}
        <div className="flex border-b border-gray-200 bg-gray-50/80 overflow-x-auto no-scrollbar">
          
          <button
            type="button"
            onClick={() => setStudioTab('presets')}
            className={`px-4 py-3 text-xs sm:text-sm font-bold flex items-center gap-1.5 border-b-2 whitespace-nowrap transition-all cursor-pointer ${
              studioTab === 'presets'
                ? 'border-blue-600 text-blue-600 bg-white shadow-2xs'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <Wand2 className="w-4 h-4 text-purple-600" />
            <span>السمات الرائجة</span>
            <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.2 rounded-full font-black">جديد</span>
          </button>

          <button
            type="button"
            onClick={() => setStudioTab('banner')}
            className={`px-4 py-3 text-xs sm:text-sm font-bold flex items-center gap-1.5 border-b-2 whitespace-nowrap transition-all cursor-pointer ${
              studioTab === 'banner'
                ? 'border-blue-600 text-blue-600 bg-white shadow-2xs'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <Palette className="w-4 h-4 text-amber-500" />
            <span>خلفيات الألعاب والغلاف</span>
          </button>

          <button
            type="button"
            onClick={() => setStudioTab('frame')}
            className={`px-4 py-3 text-xs sm:text-sm font-bold flex items-center gap-1.5 border-b-2 whitespace-nowrap transition-all cursor-pointer ${
              studioTab === 'frame'
                ? 'border-blue-600 text-blue-600 bg-white shadow-2xs'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <CircleDot className="w-4 h-4 text-cyan-500" />
            <span>شريط وإطار الصورة</span>
          </button>

          <button
            type="button"
            onClick={() => setStudioTab('effects')}
            className={`px-4 py-3 text-xs sm:text-sm font-bold flex items-center gap-1.5 border-b-2 whitespace-nowrap transition-all cursor-pointer ${
              studioTab === 'effects'
                ? 'border-blue-600 text-blue-600 bg-white shadow-2xs'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <Sparkles className="w-4 h-4 text-pink-500" />
            <span>الأشكال والرسوم المتحركة</span>
          </button>

          <button
            type="button"
            onClick={() => setStudioTab('badge')}
            className={`px-4 py-3 text-xs sm:text-sm font-bold flex items-center gap-1.5 border-b-2 whitespace-nowrap transition-all cursor-pointer ${
              studioTab === 'badge'
                ? 'border-blue-600 text-blue-600 bg-white shadow-2xs'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <Crown className="w-4 h-4 text-yellow-500" />
            <span>الشارات والألقاب</span>
          </button>

          <button
            type="button"
            onClick={() => setStudioTab('account')}
            className={`px-4 py-3 text-xs sm:text-sm font-bold flex items-center gap-1.5 border-b-2 whitespace-nowrap transition-all cursor-pointer ${
              studioTab === 'account'
                ? 'border-blue-600 text-blue-600 bg-white shadow-2xs'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <UserIcon className="w-4 h-4 text-blue-600" />
            <span>بيانات الحساب</span>
          </button>

        </div>

        {/* Tab Contents */}
        <div className="p-5 sm:p-7 space-y-6">

          {/* ============================================================== */}
          {/* TAB 1: TRENDING ALL-IN-ONE PRESETS */}
          {/* ============================================================== */}
          {studioTab === 'presets' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-gray-900 flex items-center gap-2">
                  <Wand2 className="w-4 h-4 text-purple-600" /> سمات رائجة جاهزة ومجهزة بنقرة واحدة
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  اختر سمة متكاملة تضم الخلفية، شريط إطار الصورة المتوهج، المؤثرات المتحركة، والشارة الخاصة بنقرة واحدة.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {TRENDING_PRESETS.map((preset) => {
                  const isSelected = bannerTheme === preset.bannerTheme && avatarFrame === preset.avatarFrame;
                  return (
                    <div
                      key={preset.id}
                      onClick={() => handleApplyTrendingPreset(preset)}
                      className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected 
                          ? 'border-blue-600 bg-blue-50/50 shadow-md ring-2 ring-blue-500/20' 
                          : 'border-gray-200 hover:border-gray-300 hover:shadow-xs bg-white'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gray-900 flex items-center justify-center text-xl shrink-0 shadow-xs">
                          {preset.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <h4 className="font-bold text-xs sm:text-sm text-gray-900">{preset.name}</h4>
                            {isSelected && (
                              <span className="text-[10px] font-black bg-blue-600 text-white px-2 py-0.5 rounded-md">
                                مفعّل ✓
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">
                            {preset.tagline}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between text-[11px]">
                        <span className="font-bold text-gray-600 flex items-center gap-1">
                          {preset.badgeIcon} {preset.badgeTitle}
                        </span>
                        <span className="text-blue-600 font-bold">تطبيق السمة ←</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 2: BANNER THEMES & GAMING BACKGROUNDS */}
          {/* ============================================================== */}
          {studioTab === 'banner' && (
            <div className="space-y-6">
              
              {/* Custom Upload Banner Option */}
              <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-gray-900 flex items-center gap-1.5">
                    <Upload className="w-4 h-4 text-blue-600" /> رفع صورة غلاف مخصصة من جهازك
                  </h4>
                  <p className="text-[11px] text-gray-600 mt-0.5">
                    يمكنك رفع صورة عالية الجودة أو صورة لعبتك المفضلة كخلفية لملفك الشخصي.
                  </p>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    disabled={isUploadingBanner}
                    onClick={() => bannerFileInputRef.current?.click()}
                    className="flex-1 sm:flex-none px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <ImagePlus className="w-3.5 h-3.5" />
                    {isUploadingBanner ? 'جاري الرفع...' : 'اختيار صورة من الهاتف/الجهاز'}
                  </button>

                  {bannerCustomUrl && (
                    <button
                      type="button"
                      onClick={() => setBannerCustomUrl('')}
                      className="px-3 py-2 bg-white text-rose-600 border border-rose-200 hover:bg-rose-50 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      إلغاء الصورة المخصصة
                    </button>
                  )}
                </div>
              </div>

              {/* Preset Backgrounds Grid */}
              <div>
                <h4 className="text-xs sm:text-sm font-extrabold text-gray-900 mb-3 flex items-center gap-2">
                  <Gamepad2 className="w-4 h-4 text-indigo-600" /> خلفيات الألعاب والأنمي والسمات الفضائية
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {BANNER_THEMES.map((theme) => {
                    const isSelected = bannerTheme === theme.id;
                    return (
                      <div
                        key={theme.id}
                        onClick={() => {
                          setBannerTheme(theme.id);
                          if (theme.effect) setAnimatedEffect(theme.effect);
                        }}
                        className={`p-3 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected 
                            ? 'border-blue-600 bg-blue-50/50 shadow-md ring-2 ring-blue-500/20' 
                            : 'border-gray-200 hover:border-gray-300 hover:shadow-xs bg-white'
                        }`}
                      >
                        <div className="space-y-2">
                          <div className={`h-14 rounded-xl bg-gradient-to-r ${theme.previewGradient} flex items-center justify-center p-2 shadow-inner`}>
                            <span className="text-white font-black text-xs drop-shadow-md text-center">
                              {theme.name}
                            </span>
                          </div>

                          <div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-gray-900">{theme.name}</span>
                              {isSelected && (
                                <span className="text-[10px] font-bold text-blue-600 bg-blue-100 px-1.5 py-0.2 rounded">محدد</span>
                              )}
                            </div>
                            <p className="text-[11px] text-gray-500 line-clamp-2 mt-0.5">
                              {theme.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 3: AVATAR FRAMES & RINGS */}
          {/* ============================================================== */}
          {studioTab === 'frame' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-gray-900 flex items-center gap-2">
                  <CircleDot className="w-4 h-4 text-cyan-600" /> شريط وإطار صورة الملف الشخصي المتوهج
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  اختر الشريط الدائري أو الإطار النيون المحيط بصورتك الشخصية لتمييز حسابك بين الأعضاء.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {AVATAR_FRAMES.map((frame) => {
                  const isSelected = avatarFrame === frame.id;
                  return (
                    <div
                      key={frame.id}
                      onClick={() => setAvatarFrame(frame.id)}
                      className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-3.5 ${
                        isSelected 
                          ? 'border-blue-600 bg-blue-50/50 shadow-md ring-2 ring-blue-500/20' 
                          : 'border-gray-200 hover:border-gray-300 hover:shadow-xs bg-white'
                      }`}
                    >
                      {/* Frame Mini Preview */}
                      <div className="w-12 h-12 rounded-full bg-zinc-950 flex items-center justify-center shrink-0">
                        <div className={`w-8 h-8 rounded-full overflow-hidden flex items-center justify-center ${frame.previewClass}`}>
                          <img
                            src={photoUrl || 'https://www.gravatar.com/avatar/?d=mp'}
                            alt="Mini"
                            className="w-full h-full object-cover rounded-full"
                          />
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-gray-900 truncate">{frame.name}</h4>
                          {isSelected && (
                            <span className="text-[10px] font-bold text-blue-600 bg-blue-100 px-1.5 py-0.2 rounded shrink-0">محدد</span>
                          )}
                        </div>
                        <p className="text-[11px] text-gray-500 line-clamp-2 mt-0.5">
                          {frame.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 4: SHAPES & PARTICLE ANIMATIONS */}
          {/* ============================================================== */}
          {studioTab === 'effects' && (
            <div className="space-y-6">
              
              {/* Avatar Shapes */}
              <div>
                <h4 className="text-xs sm:text-sm font-extrabold text-gray-900 mb-2.5 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-purple-600" /> شكل وهندسة صورة الملف الشخصي
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
                  {AVATAR_SHAPES.map((shape) => {
                    const isSelected = avatarShape === shape.id;
                    return (
                      <button
                        key={shape.id}
                        type="button"
                        onClick={() => setAvatarShape(shape.id)}
                        className={`p-3 rounded-2xl border-2 transition-all cursor-pointer flex flex-col items-center justify-center gap-2 text-center ${
                          isSelected 
                            ? 'border-blue-600 bg-blue-50/50 shadow-md ring-2 ring-blue-500/20' 
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className={`w-10 h-10 bg-gray-900 text-white flex items-center justify-center ${shape.shapeClass}`}>
                          <UserIcon className="w-5 h-5" />
                        </div>
                        <span className="text-[11px] font-bold text-gray-800">{shape.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Animated Particle Overlay Effects */}
              <div>
                <h4 className="text-xs sm:text-sm font-extrabold text-gray-900 mb-2.5 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-pink-600" /> الرسوم والمؤثرات الجزيئية المتحركة
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {ANIMATED_EFFECTS.map((eff) => {
                    const isSelected = animatedEffect === eff.id;
                    return (
                      <div
                        key={eff.id}
                        onClick={() => setAnimatedEffect(eff.id)}
                        className={`p-3 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-2.5 ${
                          isSelected 
                            ? 'border-blue-600 bg-blue-50/50 shadow-md ring-2 ring-blue-500/20' 
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <span className="text-2xl shrink-0">{eff.icon}</span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-gray-900 truncate">{eff.name}</span>
                            {isSelected && <span className="text-[10px] text-blue-600 font-bold">✓</span>}
                          </div>
                          <p className="text-[10px] text-gray-500 mt-0.5 line-clamp-2">
                            {eff.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 5: BADGES & TITLES */}
          {/* ============================================================== */}
          {studioTab === 'badge' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-gray-900 flex items-center gap-2">
                  <Crown className="w-4 h-4 text-amber-500" /> الشارات والألقاب الشرفية
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  اختر لقباً مميزاً يظهر بجانب اسمك في البروفايل وقائمة الأعضاء.
                </p>
              </div>

              {/* Quick Select Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
                {PROFILE_BADGES.map((b) => {
                  const isSelected = badgeTitle === b.title;
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => {
                        setBadgeTitle(b.title);
                        setBadgeIcon(b.icon);
                        setBadgeColor(b.color);
                      }}
                      className={`p-3 rounded-2xl border-2 transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 text-center ${
                        isSelected 
                          ? 'border-blue-600 bg-blue-50/50 shadow-md ring-2 ring-blue-500/20' 
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <span className="text-2xl">{b.icon}</span>
                      <span className="text-xs font-bold text-gray-800">{b.title}</span>
                    </button>
                  );
                })}
              </div>

              {/* Custom Badge Input */}
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-3">
                <h4 className="text-xs font-bold text-gray-700">أو اكتب لقباً وأيقونة مخصصة بالكامل:</h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">نص اللقب (Title)</label>
                    <input
                      type="text"
                      value={badgeTitle}
                      onChange={(e) => setBadgeTitle(e.target.value)}
                      placeholder="مثال: خبير المبيعات، بطل الكفاءة..."
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
                      maxLength={30}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">أيقونة الرمز (Emoji / Icon)</label>
                    <input
                      type="text"
                      value={badgeIcon}
                      onChange={(e) => setBadgeIcon(e.target.value)}
                      placeholder="👑 أو ⚡ أو 🎮..."
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
                      maxLength={5}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 6: BASIC ACCOUNT DETAILS */}
          {/* ============================================================== */}
          {studioTab === 'account' && (
            <div className="space-y-4">
              <div className="border-b border-gray-100 pb-3">
                <h3 className="text-sm sm:text-base font-bold text-gray-900 flex items-center gap-2">
                  <UserIcon className="w-4 h-4 text-blue-600" /> تعديل بيانات الحساب الأساسية
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
                  rows={3}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none text-xs sm:text-sm font-medium resize-none" 
                  placeholder="اكتب نبذة عن دورك أو اهتماماتك أو خبرتك..."
                  maxLength={300}
                />
              </div>
            </div>
          )}

          {/* Success Toast Banner */}
          {saveSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>تم حفظ وتحديث طابع وسمات الملف الشخصي بنجاح!</span>
            </div>
          )}

          {/* Global Save Button */}
          <div className="pt-2">
            <button 
              type="button" 
              onClick={() => handleSaveProfile()}
              disabled={isSaving} 
              className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 hover:from-blue-700 hover:to-sky-700 text-white px-4 py-3.5 rounded-xl font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm active:scale-95 cursor-pointer min-h-[46px]"
            >
              <Save className="w-4 h-4" /> {isSaving ? 'جاري الحفظ وتطبيق التعديلات...' : 'حفظ ونشر التخصيص للملف الشخصي'}
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};
