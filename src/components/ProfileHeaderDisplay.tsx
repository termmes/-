import React from 'react';
import { ProfileCustomization } from '../types';
import { BANNER_THEMES, AVATAR_FRAMES, AVATAR_SHAPES, PROFILE_BADGES } from '../profileThemes';
import { CheckCircle2, Sparkles } from 'lucide-react';

interface ProfileHeaderDisplayProps {
  displayName: string;
  photoUrl: string;
  bio?: string;
  customization?: ProfileCustomization;
  isOwner?: boolean;
  onEditAvatarClick?: () => void;
  size?: 'normal' | 'compact' | 'large';
  showEditButton?: boolean;
  extraAction?: React.ReactNode;
}

export const ProfileHeaderDisplay: React.FC<ProfileHeaderDisplayProps> = ({
  displayName,
  photoUrl,
  bio,
  customization,
  onEditAvatarClick,
  size = 'normal',
  showEditButton = false,
  extraAction
}) => {
  // Resolve Banner Theme
  const themeId = customization?.bannerTheme || 'classic-blue';
  const matchedTheme = BANNER_THEMES.find(t => t.id === themeId) || BANNER_THEMES[BANNER_THEMES.length - 1];
  
  // Resolve Custom Banner Image if set
  const customBannerUrl = customization?.bannerCustomUrl;

  // Resolve Avatar Frame
  const frameId = customization?.avatarFrame || 'classic-white';
  const matchedFrame = AVATAR_FRAMES.find(f => f.id === frameId) || AVATAR_FRAMES[AVATAR_FRAMES.length - 2];

  // Resolve Avatar Shape
  const shapeId = customization?.avatarShape || 'circle';
  const matchedShape = AVATAR_SHAPES.find(s => s.id === shapeId) || AVATAR_SHAPES[0];

  // Resolve Animated Effect
  const effectId = customization?.animatedEffect || matchedTheme.effect || 'none';

  // Resolve Badge
  const badgeTitle = customization?.badgeTitle || 'عضو معتمد';
  const badgeIcon = customization?.badgeIcon || '🛡️';
  const badgeColor = customization?.badgeColor || '#3b82f6';

  // Shape class helpers
  const getShapeClass = () => {
    switch (shapeId) {
      case 'squircle':
        return 'rounded-3xl';
      case 'hexagon':
        return 'clip-hexagon rounded-none';
      case 'diamond':
        return 'rounded-xl rotate-45';
      case 'shield':
        return 'clip-shield rounded-none';
      case 'circle':
      default:
        return 'rounded-full';
    }
  };

  const getOuterShapeClass = () => {
    switch (shapeId) {
      case 'squircle':
        return 'rounded-3xl';
      case 'hexagon':
        return 'clip-hexagon';
      case 'diamond':
        return 'rounded-2xl rotate-45';
      case 'shield':
        return 'clip-shield';
      case 'circle':
      default:
        return 'rounded-full';
    }
  };

  const avatarSizeClass = size === 'large' 
    ? 'w-24 h-24 sm:w-28 sm:h-28' 
    : size === 'compact' 
      ? 'w-14 h-14' 
      : 'w-20 h-20 sm:w-24 sm:h-24';

  return (
    <div className={`relative overflow-hidden ${matchedTheme.backgroundClass} p-4 sm:p-6 transition-all duration-500 select-none`}>
      
      {/* 1. Custom Background Image if specified */}
      {customBannerUrl && (
        <div 
          className="absolute inset-0 bg-cover bg-center z-0 opacity-40 mix-blend-overlay"
          style={{ backgroundImage: `url(${customBannerUrl})` }}
        />
      )}

      {/* 2. Animated Particle / Grid / Ambient Canvas Effects */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        
        {/* Effect: Cyber Grid 3D */}
        {effectId === 'cyber-grid' && (
          <div className="absolute inset-0 opacity-30 animate-cyber-grid" />
        )}

        {/* Effect: Floating Stars & Nebula */}
        {effectId === 'stars' && (
          <div className="absolute inset-0">
            <div className="absolute top-2 left-1/4 w-1.5 h-1.5 bg-white rounded-full animate-float-star shadow-[0_0_8px_white]" />
            <div className="absolute top-8 left-3/4 w-2 h-2 bg-indigo-300 rounded-full animate-float-star delay-300 shadow-[0_0_10px_#818cf8]" />
            <div className="absolute bottom-4 left-1/3 w-1 h-1 bg-sky-200 rounded-full animate-float-star delay-700 shadow-[0_0_6px_#38bdf8]" />
            <div className="absolute top-1/2 right-1/5 w-2 h-2 bg-purple-300 rounded-full animate-float-star delay-500 shadow-[0_0_8px_#c084fc]" />
            <div className="absolute top-4 right-1/3 w-1.5 h-1.5 bg-yellow-100 rounded-full animate-float-star delay-1000 shadow-[0_0_8px_#fde047]" />
          </div>
        )}

        {/* Effect: Rising Fire Sparks & Embers */}
        {effectId === 'sparks' && (
          <div className="absolute inset-0">
            <div className="absolute bottom-0 left-1/5 w-2 h-2 bg-amber-400 rounded-full animate-rise-spark shadow-[0_0_10px_#f59e0b]" />
            <div className="absolute bottom-0 left-2/5 w-1.5 h-1.5 bg-red-500 rounded-full animate-rise-spark delay-300 shadow-[0_0_8px_#ef4444]" />
            <div className="absolute bottom-0 left-3/5 w-2.5 h-2.5 bg-orange-400 rounded-full animate-rise-spark delay-700 shadow-[0_0_12px_#fb923c]" />
            <div className="absolute bottom-0 left-4/5 w-1.5 h-1.5 bg-yellow-300 rounded-full animate-rise-spark delay-500 shadow-[0_0_8px_#fde047]" />
          </div>
        )}

        {/* Effect: Matrix Digital Rain */}
        {effectId === 'matrix' && (
          <div className="absolute inset-0 flex justify-around opacity-40 font-mono text-[10px] text-emerald-400 leading-tight select-none">
            <div className="animate-matrix-stream">0110<br/>1001<br/>1101</div>
            <div className="animate-matrix-stream delay-300">1010<br/>0101<br/>1110</div>
            <div className="animate-matrix-stream delay-700">0011<br/>1100<br/>0111</div>
            <div className="animate-matrix-stream delay-500">1101<br/>1011<br/>1001</div>
          </div>
        )}

        {/* Effect: Sakura Falling Petals */}
        {effectId === 'sakura' && (
          <div className="absolute inset-0">
            <div className="absolute top-0 left-1/6 w-3 h-2 bg-pink-300/80 rounded-full animate-sakura-petal shadow-xs" />
            <div className="absolute top-0 left-1/2 w-3.5 h-2.5 bg-rose-300/90 rounded-full animate-sakura-petal delay-700 shadow-xs" />
            <div className="absolute top-0 left-5/6 w-2.5 h-2 bg-pink-200/80 rounded-full animate-sakura-petal delay-1000 shadow-xs" />
          </div>
        )}

        {/* Effect: Aurora Light Waves */}
        {effectId === 'aurora' && (
          <div className="absolute -inset-10 bg-gradient-to-r from-teal-500/20 via-emerald-500/25 to-indigo-500/20 blur-xl animate-aurora-glow" />
        )}

        {/* Effect: Neon Bubbles */}
        {effectId === 'bubbles' && (
          <div className="absolute inset-0">
            <div className="absolute bottom-0 left-1/4 w-4 h-4 rounded-full border border-cyan-400/60 bg-cyan-400/10 animate-neon-bubble shadow-[0_0_8px_#06b6d4]" />
            <div className="absolute bottom-0 left-1/2 w-6 h-6 rounded-full border border-purple-400/60 bg-purple-400/10 animate-neon-bubble delay-500 shadow-[0_0_10px_#a855f7]" />
            <div className="absolute bottom-0 left-3/4 w-3 h-3 rounded-full border border-pink-400/60 bg-pink-400/10 animate-neon-bubble delay-1000 shadow-[0_0_6px_#f43f5e]" />
          </div>
        )}

      </div>

      {/* 3. Header Content Container */}
      <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-4">
        
        {/* Avatar with Customized Ring & Shape */}
        <div className="relative shrink-0 group">
          <div className={`transition-all duration-300 flex items-center justify-center ${matchedFrame.frameClass} ${getOuterShapeClass()}`}>
            <div className={`${avatarSizeClass} overflow-hidden bg-black/40 ${getShapeClass()} flex items-center justify-center`}>
              <img
                src={photoUrl || 'https://www.gravatar.com/avatar/?d=mp'}
                alt={displayName}
                className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 ${shapeId === 'diamond' ? '-rotate-45 scale-125' : ''}`}
                onError={(e) => { (e.target as HTMLImageElement).src = 'https://www.gravatar.com/avatar/?d=mp'; }}
              />
            </div>
          </div>

          {/* Edit photo button if requested */}
          {showEditButton && onEditAvatarClick && (
            <button
              type="button"
              onClick={onEditAvatarClick}
              className="absolute -bottom-1 -right-1 p-2 bg-white text-gray-800 rounded-full shadow-lg hover:bg-gray-100 hover:scale-110 active:scale-95 transition-all cursor-pointer border border-gray-200 z-20"
              title="تغيير الصورة الشخصية"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            </button>
          )}
        </div>

        {/* Name, Badge, and Bio */}
        <div className="text-center sm:text-right flex-1 min-w-0 space-y-1.5">
          
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <h2 className="text-lg sm:text-2xl font-black tracking-tight drop-shadow-sm truncate">
              {displayName || 'مستخدم'}
            </h2>

            {/* Custom Role / Title Badge */}
            <span 
              className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-xs backdrop-blur-md border ${matchedTheme.badgeBg}`}
              style={customization?.badgeColor ? { borderColor: `${badgeColor}80` } : {}}
            >
              <span>{badgeIcon}</span>
              <span>{badgeTitle}</span>
            </span>

            <CheckCircle2 className="w-4 h-4 fill-blue-500 text-white shrink-0" />
          </div>

          <p className="text-xs sm:text-sm font-medium leading-relaxed max-w-xl opacity-90">
            {bio || 'أضف نبذة شخصية لتعريف الأعضاء باهتماماتك ونشاطك...'}
          </p>

          {extraAction && (
            <div className="pt-1">
              {extraAction}
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
