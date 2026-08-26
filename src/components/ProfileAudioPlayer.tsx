import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Music, Volume2, VolumeX, Disc, AlertCircle } from 'lucide-react';
import { getAudioFromLocalStore } from '../audioStorage';

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
  const [resolvedSrc, setResolvedSrc] = useState<string>('');

  // Resolve audio source (check if local storage key or direct URL)
  useEffect(() => {
    let isMounted = true;
    const resolveSource = async () => {
      if (!songUrl) {
        setResolvedSrc('');
        return;
      }

      if (songUrl.startsWith('local:')) {
        const key = songUrl.replace('local:', '');
        const localBlobUrl = await getAudioFromLocalStore(key);
        if (isMounted) {
          if (localBlobUrl) {
            setResolvedSrc(localBlobUrl);
          } else {
            // If not found in this device's IndexedDB, fallback or show error
            setResolvedSrc('');
            setHasError(true);
          }
        }
      } else {
        if (isMounted) {
          setResolvedSrc(songUrl);
          setHasError(false);
        }
      }
    };

    resolveSource();
    return () => {
      isMounted = false;
    };
  }, [songUrl]);

  // Handle autoplay when resolved source is ready
  useEffect(() => {
    if (resolvedSrc && autoPlay && audioRef.current) {
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => setIsPlaying(true))
          .catch((err) => {
            console.log("Autoplay was prevented by browser policy, waiting for user click:", err);
            setIsPlaying(false);
          });
      }
    }
  }, [resolvedSrc, autoPlay]);

  if (!songUrl) return null;

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play()
        .then(() => {
          setIsPlaying(true);
          setHasError(false);
        })
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
      setHasError(false);
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
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer select-none transition-all ${
          isPlaying 
            ? 'bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-sm' 
            : 'bg-gray-100 hover:bg-pink-50 text-gray-700 border border-gray-200'
        }`}
        title="استمع لأغنية الملف الشخصي"
      >
        {resolvedSrc && (
          <audio
            ref={audioRef}
            src={resolvedSrc}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={handleEnded}
            onError={() => setHasError(true)}
            preload="metadata"
          />
        )}
        
        <div className={`p-1 rounded-full ${isPlaying ? 'bg-white/20' : 'bg-gray-300 text-gray-700'}`}>
          {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 fill-current ml-0.5" />}
        </div>

        <div className="flex items-center gap-1.5 max-w-[130px] truncate">
          <Music className="w-3 h-3 shrink-0" />
          <span className="truncate">{songTitle}</span>
        </div>
      </div>
    );
  }

  // Banner Variant (Instagram Profile Header Style)
  return (
    <div className="relative overflow-hidden rounded-2xl bg-zinc-950 text-white p-3 sm:p-4 border border-zinc-800 shadow-md">
      {resolvedSrc && (
        <audio
          ref={audioRef}
          src={resolvedSrc}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleEnded}
          onError={() => setHasError(true)}
          preload="metadata"
        />
      )}

      <div className="flex items-center justify-between gap-3">
        {/* Left: Vinyl Disc + Song Info */}
        <div className="flex items-center gap-3 min-w-0">
          <button 
            type="button"
            onClick={togglePlay}
            className={`relative p-2.5 rounded-full bg-gradient-to-tr from-pink-500 via-rose-500 to-amber-500 text-white shadow-md shrink-0 transition-transform active:scale-95 cursor-pointer ${
              isPlaying ? 'rotate-12' : ''
            }`}
          >
            <Disc className="w-5 h-5" />
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full">
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
            </div>
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-pink-400 bg-pink-500/10 px-2 py-0.5 rounded-md border border-pink-500/20 flex items-center gap-1">
                <Music className="w-2.5 h-2.5" /> أغنية البروفايل
              </span>
              {hasError && (
                <span className="text-[10px] text-amber-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> جاري التحميل أو تعذر التشغيل
                </span>
              )}
            </div>
            <h4 className="text-sm font-bold truncate text-zinc-100 mt-0.5">
              {songTitle}
            </h4>
            <p className="text-xs text-zinc-400 truncate">
              {songArtist || 'موسيقى'}
            </p>
          </div>
        </div>

        {/* Right: Equalizer & Play Button */}
        <div className="flex items-center gap-2 shrink-0">
          {isPlaying && (
            <div className="hidden sm:flex items-end gap-1 h-4 px-2 bg-pink-500/10 rounded-md border border-pink-500/20">
              <span className="w-1 bg-pink-400 rounded-full h-2"></span>
              <span className="w-1 bg-pink-400 rounded-full h-3.5"></span>
              <span className="w-1 bg-pink-400 rounded-full h-2.5"></span>
            </div>
          )}

          <button
            type="button"
            onClick={toggleMute}
            className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition-colors cursor-pointer"
            title={isMuted ? 'إلغاء الكتم' : 'كتم الصوت'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={togglePlay}
            className="p-2.5 bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white rounded-xl shadow-md transition-all active:scale-90 flex items-center justify-center cursor-pointer font-bold"
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

      {/* Progress Bar */}
      <div className="mt-2.5 flex items-center gap-2 text-[10px] text-zinc-400 font-mono">
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
