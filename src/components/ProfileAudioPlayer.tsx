import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Music, Volume2, VolumeX, Disc } from 'lucide-react';

interface ProfileAudioPlayerProps {
  songUrl?: string;
  songTitle?: string;
  songArtist?: string;
  variant?: 'pill' | 'banner' | 'card';
  autoPlay?: boolean;
}

export const ProfileAudioPlayer: React.FC<ProfileAudioPlayerProps> = ({
  songUrl,
  songTitle = 'أغنية الملف الشخصي',
  songArtist = 'موسيقى',
  variant = 'banner',
  autoPlay = false
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      setCurrentTime(0);
      setHasError(false);
    }
  }, [songUrl]);

  if (!songUrl) return null;

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch((err) => {
          console.error("Audio playback error:", err);
          setHasError(true);
          setIsPlaying(false);
        });
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration || 0);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const newTime = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds === 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Compact Pill Variant (for Community list cards)
  if (variant === 'pill') {
    return (
      <div 
        onClick={togglePlay}
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer select-none transition-all shadow-xs ${
          isPlaying 
            ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white animate-pulse' 
            : 'bg-gradient-to-r from-gray-100 to-gray-200 hover:from-pink-50 hover:to-rose-100 text-gray-700 border border-gray-200'
        }`}
        title="استمع لأغنية الملف الشخصي"
      >
        <audio
          ref={audioRef}
          src={songUrl}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleEnded}
          onError={() => setHasError(true)}
          preload="metadata"
        />
        
        <div className={`p-1 rounded-full ${isPlaying ? 'bg-white/20' : 'bg-gray-300 text-gray-700'}`}>
          {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 fill-current ml-0.5" />}
        </div>

        <div className="flex items-center gap-1.5 max-w-[140px] truncate">
          <Music className={`w-3 h-3 shrink-0 ${isPlaying ? 'animate-bounce' : ''}`} />
          <span className="truncate">{songTitle}</span>
        </div>

        {isPlaying && (
          <div className="flex items-end gap-0.5 h-3 ml-1">
            <span className="w-0.5 bg-white rounded-full animate-[bounce_0.8s_infinite] h-2"></span>
            <span className="w-0.5 bg-white rounded-full animate-[bounce_0.6s_infinite] h-3"></span>
            <span className="w-0.5 bg-white rounded-full animate-[bounce_1s_infinite] h-1.5"></span>
          </div>
        )}
      </div>
    );
  }

  // Banner Variant (Instagram Profile Header Style)
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-neutral-900 via-zinc-900 to-neutral-950 text-white p-3.5 sm:p-4 border border-zinc-800 shadow-md">
      <audio
        ref={audioRef}
        src={songUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        onError={() => setHasError(true)}
        preload="metadata"
      />

      <div className="flex items-center justify-between gap-3">
        {/* Left: Vinyl Disc animation + Song Info */}
        <div className="flex items-center gap-3 min-w-0">
          <div 
            onClick={togglePlay}
            className={`relative cursor-pointer p-2.5 rounded-full bg-gradient-to-tr from-pink-500 via-rose-500 to-amber-500 text-white shadow-lg shrink-0 transition-transform active:scale-95 ${
              isPlaying ? 'animate-[spin_4s_linear_infinite]' : ''
            }`}
          >
            <Disc className="w-5 h-5" />
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-full opacity-0 hover:opacity-100 transition-opacity">
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
            </div>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-pink-400 bg-pink-500/10 px-2 py-0.5 rounded-md border border-pink-500/20 flex items-center gap-1">
                <Music className="w-2.5 h-2.5" /> أغنية البروفايل
              </span>
              {hasError && <span className="text-[10px] text-red-400">تعذر تشغيل الملف</span>}
            </div>
            <h4 className="text-sm sm:text-base font-black truncate text-zinc-100 mt-0.5">
              {songTitle}
            </h4>
            <p className="text-xs text-zinc-400 truncate">
              {songArtist || 'موسيقى'}
            </p>
          </div>
        </div>

        {/* Right: Equalizer Animation & Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {isPlaying && (
            <div className="hidden sm:flex items-end gap-1 h-5 px-2 bg-pink-500/10 rounded-lg border border-pink-500/20">
              <span className="w-1 bg-pink-400 rounded-full animate-[bounce_0.7s_infinite] h-2.5"></span>
              <span className="w-1 bg-pink-400 rounded-full animate-[bounce_0.5s_infinite] h-5"></span>
              <span className="w-1 bg-pink-400 rounded-full animate-[bounce_0.9s_infinite] h-3.5"></span>
              <span className="w-1 bg-pink-400 rounded-full animate-[bounce_0.6s_infinite] h-4"></span>
            </div>
          )}

          <button
            type="button"
            onClick={toggleMute}
            className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition-colors"
            title={isMuted ? 'إلغاء الكتم' : 'كتم الصوت'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={togglePlay}
            className="p-2.5 bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white rounded-xl shadow-md transition-all active:scale-90 flex items-center justify-center"
            title={isPlaying ? 'إيقاف' : 'تشغيل الأغنية'}
          >
            {isPlaying ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4 fill-current ml-0.5" />
            )}
          </button>
        </div>
      </div>

      {/* Progress Bar Scrubbing */}
      <div className="mt-3 flex items-center gap-2 text-[10px] text-zinc-400 font-mono">
        <span>{formatTime(currentTime)}</span>
        <div className="relative flex-1 flex items-center">
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-pink-500 hover:accent-pink-400"
          />
        </div>
        <span>{formatTime(duration)}</span>
      </div>
    </div>
  );
};
