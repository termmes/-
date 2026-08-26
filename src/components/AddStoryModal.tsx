import React, { useState, useRef } from 'react';
import { X, ImagePlus, Type, Sparkles, Send, Check } from 'lucide-react';
import { compressImage } from '../utils';

interface AddStoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostStory: (data: { mediaUrl?: string; caption?: string; bgColor?: string }) => Promise<void>;
  userPhoto?: string;
  userName: string;
}

const BG_GRADIENTS = [
  { id: 'insta', label: 'إنستجرام', class: 'bg-gradient-to-tr from-amber-500 via-rose-600 to-purple-700' },
  { id: 'sunset', label: 'غروب', class: 'bg-gradient-to-br from-orange-500 via-pink-600 to-rose-700' },
  { id: 'ocean', label: 'محيط', class: 'bg-gradient-to-br from-blue-600 via-cyan-600 to-teal-500' },
  { id: 'emerald', label: 'زمردي', class: 'bg-gradient-to-br from-emerald-600 via-teal-700 to-cyan-900' },
  { id: 'midnight', label: 'ليلي', class: 'bg-gradient-to-br from-slate-900 via-purple-950 to-neutral-900' },
];

export const AddStoryModal: React.FC<AddStoryModalProps> = ({
  isOpen,
  onClose,
  onPostStory,
  userPhoto,
  userName
}) => {
  const [storyType, setStoryType] = useState<'photo' | 'text'>('photo');
  const [mediaUrl, setMediaUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [selectedBg, setSelectedBg] = useState(BG_GRADIENTS[0].class);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // Compress for story (HD quality but lightweight under 600KB)
      const compressed = await compressImage(file, 900, 1600, 0.75);
      setMediaUrl(compressed);
    } catch (err) {
      console.error("Image compression error:", err);
      alert("تعذر معالجة الصورة، يرجى اختيار صورة أصغر.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (storyType === 'photo' && !mediaUrl) {
      alert("يرجى اختيار صورة للستوري أو التحويل لكتابة نص.");
      return;
    }
    if (storyType === 'text' && !caption.trim()) {
      alert("يرجى كتابة نص للستوري.");
      return;
    }

    setIsSubmitting(true);
    try {
      await onPostStory({
        mediaUrl: storyType === 'photo' ? mediaUrl : undefined,
        caption: caption.trim() || undefined,
        bgColor: storyType === 'text' ? selectedBg : undefined
      });
      onClose();
    } catch (err) {
      console.error("Error posting story:", err);
      alert("حدث خطأ أثناء نشر الستوري.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border border-gray-100 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-pink-50 via-rose-50 to-amber-50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-tr from-amber-500 via-rose-600 to-purple-600 text-white rounded-xl shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-gray-900">إضافة قصة جديدة (Story)</h3>
              <p className="text-xs text-gray-500">شارك يومياتك أو أفكارك مع باقي الأعضاء</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-white/80 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {/* Type Selector Tabs */}
          <div className="flex items-center p-1 bg-gray-100 rounded-2xl">
            <button
              type="button"
              onClick={() => setStoryType('photo')}
              className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition-all ${
                storyType === 'photo' 
                  ? 'bg-white text-gray-900 shadow-xs' 
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <ImagePlus className="w-4 h-4 text-pink-600" /> قصة صورة (Photo)
            </button>
            <button
              type="button"
              onClick={() => setStoryType('text')}
              className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition-all ${
                storyType === 'text' 
                  ? 'bg-white text-gray-900 shadow-xs' 
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <Type className="w-4 h-4 text-purple-600" /> قصة نصية / أفكار (Text)
            </button>
          </div>

          {/* Story Preview / Upload Zone */}
          {storyType === 'photo' ? (
            <div className="space-y-3">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={`relative aspect-[9/12] max-h-[280px] w-full mx-auto rounded-2xl overflow-hidden border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all ${
                  mediaUrl 
                    ? 'border-transparent bg-black' 
                    : 'border-pink-300 bg-pink-50/50 hover:bg-pink-50'
                }`}
              >
                {mediaUrl ? (
                  <>
                    <img src={mediaUrl} alt="Story preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <span className="text-white text-xs font-bold bg-black/60 px-3 py-1.5 rounded-xl">تغيير الصورة</span>
                    </div>
                  </>
                ) : (
                  <div className="text-center p-6 text-pink-600 space-y-2">
                    <div className="p-3 bg-white text-pink-600 rounded-2xl shadow-xs inline-block">
                      <ImagePlus className="w-8 h-8" />
                    </div>
                    <p className="font-bold text-sm text-gray-800">اضغط لاختيار صورة من جهازك</p>
                    <p className="text-xs text-gray-400">تدعم جميع صيغ الصور بجودة عالية</p>
                  </div>
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleImageUpload}
                className="hidden"
              />

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">وصف أو تعليق على الصورة (اختياري)</label>
                <input
                  type="text"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="اكتب تعليقاً على الستوري..."
                  maxLength={150}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm font-medium outline-none focus:bg-white focus:ring-2 focus:ring-pink-500"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Background gradient picker */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">اختر لون الخلفية:</label>
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {BG_GRADIENTS.map((bg) => (
                    <button
                      key={bg.id}
                      type="button"
                      onClick={() => setSelectedBg(bg.class)}
                      className={`w-9 h-9 rounded-xl ${bg.class} shrink-0 transition-transform flex items-center justify-center shadow-xs ${
                        selectedBg === bg.class ? 'scale-110 ring-2 ring-purple-600 ring-offset-2' : 'opacity-80 hover:opacity-100'
                      }`}
                      title={bg.label}
                    >
                      {selectedBg === bg.class && <Check className="w-4 h-4 text-white drop-shadow" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Text Preview Box */}
              <div className={`relative aspect-[9/12] max-h-[280px] w-full rounded-2xl overflow-hidden p-6 flex flex-col items-center justify-center text-center shadow-inner ${selectedBg}`}>
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="ما الذي تفكر فيه؟ اكتب هنا..."
                  rows={4}
                  maxLength={250}
                  className="w-full bg-transparent text-white placeholder-white/60 text-lg sm:text-xl font-black text-center resize-none outline-none drop-shadow-md"
                  autoFocus
                />
                <span className="text-[10px] text-white/70 absolute bottom-3 left-3">
                  {caption.length}/250 حرف
                </span>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-gradient-to-r from-amber-500 via-rose-600 to-purple-600 hover:from-amber-600 hover:via-rose-700 hover:to-purple-700 text-white rounded-2xl font-black text-sm transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 min-h-[46px]"
            >
              <Send className="w-4 h-4 ml-1" />
              {isSubmitting ? 'جاري نشر الستوري...' : 'نشر الستوري الآن'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
