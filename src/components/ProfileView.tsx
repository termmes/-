import React, { useState, useEffect, useRef } from 'react';
import { User } from 'firebase/auth';
import { UserProfile, ProfileCustomization } from '../types';
import { db } from '../firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { compressImage } from '../utils';
import { ProfileHeaderDisplay } from './ProfileHeaderDisplay';
import { 
  BANNER_THEMES, 
  AVATAR_FRAMES, 
  AVATAR_SHAPES, 
  AVATAR_ROTATE_ANIMATIONS,
  AVATAR_FILTERS,
  AVATAR_ZOOM_OPTIONS,
  ANIMATED_EFFECTS, 
  PROFILE_BADGES, 
  TRENDING_PRESETS,
  TrendingPreset
} from '../profileThemes';
import { 
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
  ShieldAlert,
  RotateCw,
  Camera,
  Trash2,
  Check
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
  const [avatarRotateAnimation, setAvatarRotateAnimation] = useState<string>(
    profile?.customization?.avatarRotateAnimation || 'none'
  );
  const [avatarFilter, setAvatarFilter] = useState<string>(
    profile?.customization?.avatarFilter || 'none'
  );
  const [avatarZoom, setAvatarZoom] = useState<'normal' | 'zoom-110' | 'zoom-125' | 'tilt-right' | 'tilt-left'>(
    profile?.customization?.avatarZoom || 'normal'
  );
  const [animatedEffect, setAnimatedEffect] = useState<any>(
    profile?.customization?.animatedEffect || 'none'
  );
  const [badgeTitle, setBadgeTitle] = useState<string>(profile?.customization?.badgeTitle || 'عضو معتمد');
  const [badgeIcon, setBadgeIcon] = useState<string>(profile?.customization?.badgeIcon || '🛡️');
  const [badgeColor, setBadgeColor] = useState<string>(profile?.customization?.badgeColor || '#3b82f6');

  // Studio tab state
  const [studioTab, setStudioTab] = useState<'presets' | 'avatar' | 'banner' | 'effects' | 'badge' | 'account'>('presets');
  const [themeFilterCategory, setThemeFilterCategory] = useState<string>('all');

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
        setAvatarRotateAnimation(profile.customization.avatarRotateAnimation || 'none');
        setAvatarFilter(profile.customization.avatarFilter || 'none');
        setAvatarZoom(profile.customization.avatarZoom || 'normal');
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
        const compressedBase64 = await compressImage(file, 300, 300, 0.7);
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
    setAvatarRotateAnimation(preset.avatarRotateAnimation || 'none');
    setAvatarFilter(preset.avatarFilter || 'none');
    setAnimatedEffect(preset.animatedEffect);
    setBadgeTitle(preset.badgeTitle);
    setBadgeIcon(preset.badgeIcon);
    setBadgeColor(preset.badgeColor);
  };

  // Smart Randomizer for instant inspiration
  const handleRandomizeStyle = () => {
    const randomTheme = BANNER_THEMES[Math.floor(Math.random() * BANNER_THEMES.length)];
    const randomFrame = AVATAR_FRAMES[Math.floor(Math.random() * AVATAR_FRAMES.length)];
    const randomShape = AVATAR_SHAPES[Math.floor(Math.random() * AVATAR_SHAPES.length)];
    const randomRotate = AVATAR_ROTATE_ANIMATIONS[Math.floor(Math.random() * AVATAR_ROTATE_ANIMATIONS.length)];
    const randomFilter = AVATAR_FILTERS[Math.floor(Math.random() * AVATAR_FILTERS.length)];
    const randomEffect = ANIMATED_EFFECTS[Math.floor(Math.random() * ANIMATED_EFFECTS.length)];
    const randomBadge = PROFILE_BADGES[Math.floor(Math.random() * PROFILE_BADGES.length)];

    setBannerTheme(randomTheme.id);
    setAvatarFrame(randomFrame.id);
    setAvatarShape(randomShape.id);
    setAvatarRotateAnimation(randomRotate.id);
    setAvatarFilter(randomFilter.id);
    setAnimatedEffect(randomEffect.id);
    setBadgeTitle(randomBadge.title);
    setBadgeIcon(randomBadge.icon);
    setBadgeColor(randomBadge.color);
  };

  // Reset to default
  const handleResetToDefault = () => {
    setBannerTheme('classic-blue');
    setBannerCustomUrl('');
    setAvatarFrame('classic-white');
    setAvatarShape('circle');
    setAvatarRotateAnimation('none');
    setAvatarFilter('none');
    setAvatarZoom('normal');
    setAnimatedEffect('none');
    setBadgeTitle('عضو معتمد');
    setBadgeIcon('🛡️');
    setBadgeColor('#3b82f6');
  };

  const handleSaveProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const customizationData: ProfileCustomization = {
        bannerTheme: bannerTheme || 'classic-blue',
        bannerCustomUrl: bannerCustomUrl || '',
        avatarFrame: avatarFrame || 'classic-white',
        avatarShape: avatarShape || 'circle',
        avatarRotateAnimation: (avatarRotateAnimation as any) || 'none',
        avatarFilter: (avatarFilter as any) || 'none',
        avatarZoom: avatarZoom || 'normal',
        cardTheme: 'glass',
        animatedEffect: animatedEffect || 'none',
        badgeTitle: badgeTitle.trim() || 'عضو معتمد',
        badgeIcon: badgeIcon.trim() || '🛡️',
        badgeColor: badgeColor || '#3b82f6',
        fontStyle: 'default'
      };

      const profilePayload = {
        uid: user.uid,
        displayName: displayName.trim() || user.displayName || 'مستخدم',
        photoUrl: photoUrl || user.photoURL || 'https://www.gravatar.com/avatar/?d=mp',
        bio: bio.trim(),
        email: user.email || '',
        customization: customizationData,
        updatedAt: serverTimestamp()
      };

      await setDoc(doc(db, 'users', user.uid), profilePayload, { merge: true });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("حدث خطأ أثناء حفظ التعديلات. يرجى المحاولة مرة أخرى.");
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
    avatarRotateAnimation: avatarRotateAnimation as any,
    avatarFilter: avatarFilter as any,
    avatarZoom,
    cardTheme: 'glass',
    animatedEffect,
    badgeTitle: badgeTitle || 'عضو معتمد',
    badgeIcon: badgeIcon || '🛡️',
    badgeColor
  };

  const filteredThemes = themeFilterCategory === 'all'
    ? BANNER_THEMES
    : BANNER_THEMES.filter(t => t.category === themeFilterCategory);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 sm:pb-8">
      
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
        <div className="relative border-b border-gray-200">
          <div className="flex items-center justify-between px-4 py-2.5 bg-gray-900 text-white text-[11px] font-bold">
            <span className="flex items-center gap-1.5 text-cyan-400">
              <Eye className="w-3.5 h-3.5" /> معاينة مباشرة لمظهر ملفك الشخصي
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRandomizeStyle}
                className="text-[10px] bg-white/10 hover:bg-white/20 text-yellow-300 hover:text-yellow-200 px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                title="تطبيق ستايل عشوائي ملهم"
              >
                <Sparkles className="w-3 h-3" /> اقتراح ستايل ذكي
              </button>
              <button
                type="button"
                onClick={handleResetToDefault}
                className="text-[10px] bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                title="استعادة المظهر الافتراضي"
              >
                <RefreshCw className="w-3 h-3" /> استعادة
              </button>
            </div>
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

        {/* Studio Modern Navigation Tabs */}
        <div className="bg-gray-50 border-b border-gray-200 p-2 sm:p-3 overflow-x-auto flex gap-1.5 no-scrollbar">
          
          <button
            type="button"
            onClick={() => setStudioTab('presets')}
            className={`px-3.5 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 transition-all shrink-0 cursor-pointer ${
              studioTab === 'presets' 
                ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-md shadow-amber-500/20' 
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            <Crown className="w-4 h-4" />
            <span>السمات الرائجة الجاهزة</span>
          </button>

          <button
            type="button"
            onClick={() => setStudioTab('avatar')}
            className={`px-3.5 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 transition-all shrink-0 cursor-pointer ${
              studioTab === 'avatar' 
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' 
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            <RotateCw className="w-4 h-4" />
            <span>تخصيص ولفة الصورة</span>
          </button>

          <button
            type="button"
            onClick={() => setStudioTab('banner')}
            className={`px-3.5 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 transition-all shrink-0 cursor-pointer ${
              studioTab === 'banner' 
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' 
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            <Palette className="w-4 h-4" />
            <span>خلفيات الغلاف والسمات</span>
          </button>

          <button
            type="button"
            onClick={() => setStudioTab('effects')}
            className={`px-3.5 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 transition-all shrink-0 cursor-pointer ${
              studioTab === 'effects' 
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' 
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>مؤثرات الحركة والخلفية</span>
          </button>

          <button
            type="button"
            onClick={() => setStudioTab('badge')}
            className={`px-3.5 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 transition-all shrink-0 cursor-pointer ${
              studioTab === 'badge' 
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' 
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            <CircleDot className="w-4 h-4" />
            <span>الشارة واللقب</span>
          </button>

          <button
            type="button"
            onClick={() => setStudioTab('account')}
            className={`px-3.5 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 transition-all shrink-0 cursor-pointer ${
              studioTab === 'account' 
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' 
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            <UserIcon className="w-4 h-4" />
            <span>البيانات الأساسية</span>
          </button>

        </div>

        {/* Tab Body Content */}
        <div className="p-4 sm:p-6 space-y-6">

          {/* TAB 1: ALL-IN-ONE TRENDING PRESETS */}
          {studioTab === 'presets' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-black text-gray-900 flex items-center gap-2">
                    <Crown className="w-4 h-4 text-amber-500" /> السمات الرائجة الشاملة الجاهزة بنقرة واحدة
                  </h4>
                  <p className="text-xs text-gray-500 mt-0.5">
                    تطبيق ستايل متكامل يشمل خلفية الغلاف، حركة لفة الصورة، الإطار، الفلتر، والشارة المتميزة فوراً.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {TRENDING_PRESETS.map((preset) => {
                  const isCurrent = bannerTheme === preset.bannerTheme && avatarFrame === preset.avatarFrame;
                  return (
                    <div
                      key={preset.id}
                      onClick={() => handleApplyTrendingPreset(preset)}
                      className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between group relative overflow-hidden ${
                        isCurrent 
                          ? 'border-amber-500 bg-amber-50/40 shadow-md ring-2 ring-amber-400/30' 
                          : 'border-gray-200 hover:border-gray-300 bg-white hover:shadow-xs'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-gray-900 to-gray-800 flex items-center justify-center text-xl shadow-inner shrink-0">
                            {preset.icon}
                          </div>
                          <div>
                            <h5 className="text-xs sm:text-sm font-black text-gray-900 group-hover:text-amber-600 transition-colors">
                              {preset.name}
                            </h5>
                            <span className="text-[10px] text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-md font-bold mt-1 inline-block">
                              {preset.badgeIcon} {preset.badgeTitle}
                            </span>
                          </div>
                        </div>

                        {isCurrent && (
                          <span className="bg-amber-500 text-white p-1 rounded-full text-xs">
                            <Check className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-gray-600 mt-2.5 leading-relaxed">
                        {preset.tagline}
                      </p>

                      <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between text-[10px] text-gray-400">
                        <span className="text-blue-600 font-bold group-hover:underline">
                          تطبيق السمة بالكامل ←
                        </span>
                        <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-medium">
                          جاهز بنقرة واحدة
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: AVATAR & PHOTO CUSTOMIZATION STUDIO */}
          {studioTab === 'avatar' && (
            <div className="space-y-6">

              {/* 1. Avatar Rotation Animations */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs sm:text-sm font-black text-gray-900 flex items-center gap-2">
                    <RotateCw className="w-4 h-4 text-blue-600" /> أنماط وأشكال لفة ودوران الصورة (Rotate & Spin)
                  </h4>
                  <span className="text-[10px] bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded-md">
                    {AVATAR_ROTATE_ANIMATIONS.length} خيارات دوران
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
                  {AVATAR_ROTATE_ANIMATIONS.map((rotate) => {
                    const isSelected = avatarRotateAnimation === rotate.id;
                    return (
                      <button
                        type="button"
                        key={rotate.id}
                        onClick={() => setAvatarRotateAnimation(rotate.id)}
                        className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-2 group ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50/60 shadow-xs ring-2 ring-blue-500/20'
                            : 'border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50'
                        }`}
                      >
                        {/* Live mini animated circle */}
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white text-base shadow-sm relative overflow-hidden">
                          <div className={`w-8 h-8 rounded-full border-2 border-dashed border-white flex items-center justify-center ${rotate.animationClass}`}>
                            <span>{rotate.icon}</span>
                          </div>
                        </div>

                        <div className="space-y-0.5">
                          <div className={`text-[11px] font-black ${isSelected ? 'text-blue-700' : 'text-gray-800'}`}>
                            {rotate.name}
                          </div>
                          <div className="text-[9px] text-gray-400 line-clamp-1">
                            {rotate.description}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Photo Color Filters & FX */}
              <div className="space-y-3 pt-3 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs sm:text-sm font-black text-gray-900 flex items-center gap-2">
                    <Camera className="w-4 h-4 text-purple-600" /> فلاتر ومؤثرات ألوان الصورة (Photo Filters & FX)
                  </h4>
                  <span className="text-[10px] bg-purple-50 text-purple-700 font-bold px-2 py-0.5 rounded-md">
                    {AVATAR_FILTERS.length} فلاتر حصرية
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
                  {AVATAR_FILTERS.map((filter) => {
                    const isSelected = avatarFilter === filter.id;
                    return (
                      <button
                        type="button"
                        key={filter.id}
                        onClick={() => setAvatarFilter(filter.id)}
                        className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
                          isSelected
                            ? 'border-purple-600 bg-purple-50/60 shadow-xs ring-2 ring-purple-500/20'
                            : 'border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50'
                        }`}
                      >
                        {/* Filtered sample thumbnail */}
                        <div className="w-9 h-9 rounded-xl overflow-hidden bg-gray-200 shadow-xs border border-gray-100 flex items-center justify-center">
                          <img
                            src={photoUrl || 'https://www.gravatar.com/avatar/?d=mp'}
                            alt=""
                            className={`w-full h-full object-cover ${filter.filterClass}`}
                          />
                        </div>

                        <div className="text-[11px] font-black text-gray-800 line-clamp-1">
                          {filter.name}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Photo Zoom & Tilt */}
              <div className="space-y-3 pt-3 border-t border-gray-100">
                <h4 className="text-xs sm:text-sm font-black text-gray-900 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-emerald-600" /> نسبة التقريب والميلان (Zoom & Tilt)
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {AVATAR_ZOOM_OPTIONS.map((zoom) => {
                    const isSelected = avatarZoom === zoom.id;
                    return (
                      <button
                        type="button"
                        key={zoom.id}
                        onClick={() => setAvatarZoom(zoom.id)}
                        className={`py-2 px-3 rounded-xl border text-center text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                          isSelected
                            ? 'border-emerald-600 bg-emerald-50 text-emerald-800 shadow-xs'
                            : 'border-gray-200 hover:border-gray-300 bg-white text-gray-700'
                        }`}
                      >
                        <span>{zoom.icon}</span>
                        <span>{zoom.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4. Avatar Shapes */}
              <div className="space-y-3 pt-3 border-t border-gray-100">
                <h4 className="text-xs sm:text-sm font-black text-gray-900 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-amber-600" /> شكل إطار الصورة (Avatar Shape)
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                  {AVATAR_SHAPES.map((shape) => {
                    const isSelected = avatarShape === shape.id;
                    return (
                      <button
                        type="button"
                        key={shape.id}
                        onClick={() => setAvatarShape(shape.id)}
                        className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-2 ${
                          isSelected
                            ? 'border-amber-600 bg-amber-50/60 shadow-xs ring-2 ring-amber-500/20'
                            : 'border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50'
                        }`}
                      >
                        <div className={`w-8 h-8 bg-amber-500 ${shape.shapeClass} flex items-center justify-center text-white shadow-xs`} />
                        <span className="text-[11px] font-bold text-gray-800">{shape.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 5. Avatar Ring Frames */}
              <div className="space-y-3 pt-3 border-t border-gray-100">
                <h4 className="text-xs sm:text-sm font-black text-gray-900 flex items-center gap-2">
                  <CircleDot className="w-4 h-4 text-rose-600" /> شريط وإطار التوهج (Rings & Frames)
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {AVATAR_FRAMES.map((frame) => {
                    const isSelected = avatarFrame === frame.id;
                    return (
                      <button
                        type="button"
                        key={frame.id}
                        onClick={() => setAvatarFrame(frame.id)}
                        className={`p-3 rounded-2xl border text-right transition-all cursor-pointer flex items-center gap-3 ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50/60 shadow-xs ring-2 ring-blue-500/20'
                            : 'border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50'
                        }`}
                      >
                        <div className={`w-9 h-9 shrink-0 flex items-center justify-center ${frame.frameClass} rounded-full`}>
                          <div className="w-6 h-6 rounded-full bg-gray-900" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold text-gray-900 truncate">{frame.name}</div>
                          <div className="text-[10px] text-gray-500 line-clamp-1">{frame.description}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 6. Upload Photo Button */}
              <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-gray-50 p-4 rounded-2xl">
                <div>
                  <h5 className="text-xs font-bold text-gray-900">تغيير الصورة الشخصية</h5>
                  <p className="text-[11px] text-gray-500">ارفع صورة من جهازك بدقة عالية وسيتم تحسينها وضغطها فوراً.</p>
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
                >
                  <Upload className="w-4 h-4" /> اختيار صورة من الجهاز
                </button>
              </div>

            </div>
          )}

          {/* TAB 3: THEMES & BANNER BACKGROUNDS */}
          {studioTab === 'banner' && (
            <div className="space-y-5">
              
              {/* Category Filter Pills */}
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h4 className="text-xs sm:text-sm font-black text-gray-900">مكتبة السمات وخلفيات الغلاف</h4>
                  <p className="text-[11px] text-gray-500">اختر طابعك المفضل أو ارفع غلافاً مخصصاً بالكامل.</p>
                </div>

                <div className="flex gap-1 overflow-x-auto no-scrollbar">
                  {[
                    { id: 'all', label: 'الكل' },
                    { id: 'gaming', label: '🎮 ألعاب وسايبر' },
                    { id: 'animated', label: '✨ فضاء وحركة' },
                    { id: 'luxury', label: '👑 فخامة وذهب' },
                    { id: 'trending', label: '🌸 تريند وأنيمي' },
                    { id: 'nature', label: '🌿 طبيعة وبحار' }
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setThemeFilterCategory(cat.id)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                        themeFilterCategory === cat.id
                          ? 'bg-blue-600 text-white shadow-2xs'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Themes Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {filteredThemes.map((theme) => {
                  const isSelected = bannerTheme === theme.id && !bannerCustomUrl;
                  return (
                    <div
                      key={theme.id}
                      onClick={() => {
                        setBannerTheme(theme.id);
                        setBannerCustomUrl('');
                        if (theme.effect) setAnimatedEffect(theme.effect);
                      }}
                      className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between group ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/40 shadow-sm ring-2 ring-blue-400/20'
                          : 'border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50'
                      }`}
                    >
                      <div>
                        {/* Gradient preview bar */}
                        <div className={`h-10 rounded-xl bg-gradient-to-r ${theme.previewGradient} shadow-xs mb-2.5 relative overflow-hidden flex items-center justify-center`}>
                          <span className="text-white text-xs font-black drop-shadow-md">
                            {theme.name.split(' ')[0]}
                          </span>
                        </div>

                        <h5 className="text-xs font-black text-gray-900 group-hover:text-blue-600 transition-colors">
                          {theme.name}
                        </h5>
                        <p className="text-[10px] text-gray-500 mt-1 leading-relaxed">
                          {theme.description}
                        </p>
                      </div>

                      <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between text-[10px]">
                        <span className={`font-bold ${isSelected ? 'text-blue-600' : 'text-gray-400'}`}>
                          {isSelected ? '✓ السمة الحالية' : 'اختيار'}
                        </span>
                        <span className="text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                          {theme.category}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Custom Cover Upload Section */}
              <div className="pt-4 border-t border-gray-100 bg-gray-50 p-4 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="text-xs font-bold text-gray-900">رفع صورة غلاف مخصصة (Custom Cover)</h5>
                    <p className="text-[11px] text-gray-500">يمكنك رفع أي صورة خلفية تعجبك لعرضها كغلاف للملف الشخصي.</p>
                  </div>

                  <div className="flex items-center gap-2">
                    {bannerCustomUrl && (
                      <button
                        type="button"
                        onClick={() => setBannerCustomUrl('')}
                        className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer text-xs font-bold flex items-center gap-1"
                        title="إلغاء الصورة المخصصة"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> إزالة الغلاف
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => bannerFileInputRef.current?.click()}
                      disabled={isUploadingBanner}
                      className="px-4 py-2 bg-gray-900 hover:bg-black text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
                    >
                      <ImagePlus className="w-4 h-4" /> {isUploadingBanner ? 'جاري المعالجة...' : 'رفع غلاف من جهازك'}
                    </button>
                  </div>
                </div>

                {bannerCustomUrl && (
                  <div className="h-20 rounded-xl overflow-hidden border border-gray-200 relative">
                    <img src={bannerCustomUrl} alt="Cover Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center text-white text-xs font-bold">
                      تم تفعيل الغلاف المخصص ✓
                    </div>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 4: ANIMATED BACKGROUND TEMPLATES & EFFECTS */}
          {studioTab === 'effects' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs sm:text-sm font-black text-gray-900 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-cyan-500" /> قوالب ومؤثرات الحركة في الخلفية (Ambient FX)
                  </h4>
                  <p className="text-[11px] text-gray-500">جزيئات حية ورسوم متحركة تضفي طابعاً سينمائياً فائق الفخامة.</p>
                </div>
                <span className="text-[10px] bg-cyan-50 text-cyan-700 font-bold px-2 py-0.5 rounded-md">
                  {ANIMATED_EFFECTS.length} مؤثرات
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {ANIMATED_EFFECTS.map((eff) => {
                  const isSelected = animatedEffect === eff.id;
                  return (
                    <div
                      key={eff.id}
                      onClick={() => setAnimatedEffect(eff.id)}
                      className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between group ${
                        isSelected
                          ? 'border-cyan-500 bg-cyan-50/40 shadow-xs ring-2 ring-cyan-400/20'
                          : 'border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-2xl p-2 bg-gray-100 rounded-xl group-hover:scale-110 transition-transform">
                          {eff.icon}
                        </span>
                        <div>
                          <h5 className="text-xs font-black text-gray-900 group-hover:text-cyan-600 transition-colors">
                            {eff.name}
                          </h5>
                          <p className="text-[10px] text-gray-500 mt-1 leading-relaxed">
                            {eff.description}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between text-[10px]">
                        <span className={`font-bold ${isSelected ? 'text-cyan-600' : 'text-gray-400'}`}>
                          {isSelected ? '✓ مفعّل حالياً' : 'تفعيل'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 5: BADGES & TITLES */}
          {studioTab === 'badge' && (
            <div className="space-y-5">
              
              <div>
                <h4 className="text-xs sm:text-sm font-black text-gray-900 flex items-center gap-2">
                  <Crown className="w-4 h-4 text-amber-500" /> الشارات والألقاب الشرفية السريعة
                </h4>
                <p className="text-[11px] text-gray-500 mt-0.5">اختر شارة جاهزة أو اكتب لقباً خاصاً بك يظهر بجانب اسمك في البروفايل وبطاقات المجتمع.</p>
              </div>

              {/* Ready Badge Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
                {PROFILE_BADGES.map((badge) => {
                  const isSelected = badgeTitle === badge.title;
                  return (
                    <button
                      type="button"
                      key={badge.id}
                      onClick={() => {
                        setBadgeTitle(badge.title);
                        setBadgeIcon(badge.icon);
                        setBadgeColor(badge.color);
                      }}
                      className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
                        isSelected
                          ? 'border-amber-500 bg-amber-50 shadow-xs ring-2 ring-amber-400/20'
                          : 'border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50'
                      }`}
                    >
                      <span className="text-xl">{badge.icon}</span>
                      <span className="text-[11px] font-black text-gray-800 line-clamp-1">{badge.title}</span>
                    </button>
                  );
                })}
              </div>

              {/* Custom Badge Inputs */}
              <div className="pt-4 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-3 gap-3 bg-gray-50 p-4 rounded-2xl">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">اللقب أو الصفة المخصصة</label>
                  <input
                    type="text"
                    value={badgeTitle}
                    onChange={(e) => setBadgeTitle(e.target.value)}
                    placeholder="مثال: خبير التوريد، أسطورة النظام..."
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">الأيقونة (إيموجي)</label>
                  <input
                    type="text"
                    value={badgeIcon}
                    onChange={(e) => setBadgeIcon(e.target.value)}
                    placeholder="🛡️ أو ⚡ أو 🎮"
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">لون التوهج والإطار</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={badgeColor}
                      onChange={(e) => setBadgeColor(e.target.value)}
                      className="w-10 h-8 rounded-lg cursor-pointer border border-gray-200"
                    />
                    <span className="text-xs text-gray-500 font-mono">{badgeColor}</span>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 6: BASIC ACCOUNT DETAILS */}
          {studioTab === 'account' && (
            <div className="space-y-4 max-w-xl">
              <div>
                <label className="block text-xs font-black text-gray-800 mb-1.5">الاسم الظاهر للأعضاء</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="اسمك أو لقبك..."
                  className="w-full px-3.5 py-2.5 bg-gray-50 hover:bg-gray-100/70 focus:bg-white border border-gray-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-gray-800 mb-1.5">النبذة التعريفية (Bio)</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  placeholder="اكتب نبذة قصيرة عن نشاطك أو اهتماماتك..."
                  className="w-full px-3.5 py-2.5 bg-gray-50 hover:bg-gray-100/70 focus:bg-white border border-gray-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
                />
              </div>

              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs text-gray-500 space-y-1">
                <div className="flex items-center justify-between">
                  <span>البريد الإلكتروني:</span>
                  <strong className="text-gray-800 font-mono">{user.email || 'غير متوفر'}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span>معرف المستخدم UID:</span>
                  <span className="text-[10px] font-mono text-gray-400 truncate max-w-[200px]">{user.uid}</span>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Save Bar Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          
          <div className="flex items-center gap-2">
            {saveSuccess && (
              <span className="text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 animate-bounce">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> تم حفظ كافة التعديلات بنجاح في حسابك!
              </span>
            )}
            {!saveSuccess && (
              <span className="text-xs text-gray-500 font-medium">
                تأكد من الضغط على حفظ لتثبيت كافة التخصيصات والسمات.
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => handleSaveProfile()}
            disabled={isSaving}
            className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>جاري الحفظ الآمن...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>حفظ التغييرات في حسابي</span>
              </>
            )}
          </button>
        </div>

      </div>

    </div>
  );
};
