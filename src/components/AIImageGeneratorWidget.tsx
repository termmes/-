import React, { useState } from 'react';
import { Sparkles, Loader2, RefreshCw, Check, AlertCircle, Wand2, Image as ImageIcon } from 'lucide-react';

interface AIImageGeneratorWidgetProps {
  productName: string;
  category?: string;
  currentImage?: string;
  onImageGenerated: (imageUrl: string) => void;
  className?: string;
}

export const AIImageGeneratorWidget: React.FC<AIImageGeneratorWidgetProps> = ({
  productName,
  category,
  currentImage,
  onImageGenerated,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [hasApplied, setHasApplied] = useState(false);

  // Generate a smart default prompt when opened or when product name changes
  const getDefaultPrompt = () => {
    const pName = (productName || '').trim();
    if (!pName) return 'صورة واقعية لمنتج سوبر ماركت عالي الجودة على خلفية بيضاء نقية وإضاءة استوديو احترافية';

    // Tailor the prompt based on category or common keywords
    if (pName.includes('كمون') || pName.includes('كزبرة') || pName.includes('فلفل') || pName.includes('شطة') || pName.includes('بهارات') || pName.includes('قرفة') || pName.includes('كركم') || pName.includes('زنجبيل')) {
      return `صورة احترافية لـ ${pName} في عبوة توابل أو برطمان زجاجي نظيف مع رشة من التوابل بجانبه، إضاءة استوديو، خلفية بيضاء واضحة`;
    }
    if (pName.includes('شيبسي') || pName.includes('سناكس') || pName.includes('مقرمشات') || pName.includes('كراتيه')) {
      return `كيس شيبسي سوبر ماركت مغلق وجذاب لمنتج ${pName}، تصميم أنيق مع حبات البطاطس، إضاءة تجارية مشرقة`;
    }
    if (pName.includes('لب') || pName.includes('مكسرات') || pName.includes('فول سوداني') || pName.includes('كاجو') || pName.includes('فستق') || pName.includes('بندق')) {
      return `صحن صغير أنيق يحتوي على ${pName} طازج ومقرمش، تصوير تسويقي لمنتجات السوبرماركت والتسالي، دقة عالية`;
    }
    if (pName.includes('بسكوت') || pName.includes('ويفر') || pName.includes('شوكولاتة') || pName.includes('كيك')) {
      return `علبة أو عبوة ${pName} لذيذة مع قطع ظاهرة بجانب العبوة، تصوير إعلاني للسوبرماركت، خلفية نظيفة ومضيئة`;
    }
    if (pName.includes('عصير') || pName.includes('بيبسي') || pName.includes('كوكاكولا') || pName.includes('مياه') || pName.includes('لبن') || pName.includes('حليب')) {
      return `عبوة أو زجاجة باردة ومنعشة لـ ${pName} مع قطرات ندى خفيفة، تصوير إعلاني عالي الجودة للسوبرماركت`;
    }
    if (pName.includes('إندومي') || pName.includes('نودلز') || pName.includes('مكرونة') || pName.includes('معكرونة')) {
      return `عبوة ${pName} شهية جاهزة للطهي مع خضار، تصوير تجاري عالي الجودة لخلفية السوبر ماركت`;
    }
    if (pName.includes('صابون') || pName.includes('مسحوق') || pName.includes('منظف') || pName.includes('كلور') || pName.includes('شامبو')) {
      return `عبوة منظف أو صابون ${pName} أصلية ولامعة للمنزل، تصوير احترافي ونظيف لمنتجات العناية`;
    }

    return `صورة تجارية احترافية لمنتج "${pName}" بالسوبر ماركت، تغليف أنيق ونظيف، خلفية بيضاء مضاءة في استوديو تصوير إعلاني`;
  };

  const handleOpen = () => {
    if (!isOpen) {
      if (!prompt.trim()) {
        setPrompt(getDefaultPrompt());
      }
      setError(null);
    }
    setIsOpen(!isOpen);
  };

  const handleGenerate = async () => {
    const finalPrompt = prompt.trim() || getDefaultPrompt();
    setIsGenerating(true);
    setError(null);
    setHasApplied(false);

    try {
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: finalPrompt,
          productName: productName.trim() || 'منتج سوبر ماركت',
          category: category || 'stands'
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success || !data.imageUrl) {
        throw new Error(data.error || 'فشل توليد الصورة من خادم الذكاء الاصطناعي.');
      }

      setPreviewImage(data.imageUrl);
      onImageGenerated(data.imageUrl);
      setHasApplied(true);

    } catch (err: any) {
      console.error('Image generation error:', err);
      setError(err.message || 'تعذر توليد الصورة بالذكاء الاصطناعي. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Trigger Button */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleOpen}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer shadow-2xs border ${
            isOpen || previewImage
              ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white border-violet-500 shadow-indigo-200'
              : 'bg-gradient-to-r from-violet-50 to-indigo-50 hover:from-violet-100 hover:to-indigo-100 text-indigo-800 border-indigo-200'
          }`}
          title="توليد صورة احترافية للصنف بالذكاء الاصطناعي"
        >
          <Sparkles className={`w-4 h-4 ${isGenerating ? 'animate-spin text-amber-300' : 'text-amber-500'}`} />
          <span>{isOpen ? 'إخفاء مولّد صور الـ AI' : '✨ توليد صورة بالذكاء الاصطناعي'}</span>
          {previewImage && <span className="bg-white/30 text-white text-[10px] px-1.5 py-0.2 rounded-full">جاهزة ✓</span>}
        </button>

        {productName && !isOpen && !previewImage && (
          <span className="text-[11px] text-gray-500 hidden sm:inline">
            اكتب وصف المنتج والـ AI سيبتكر صورة مناسبة فوراً
          </span>
        )}
      </div>

      {/* Expandable AI Prompt & Generation Panel */}
      {isOpen && (
        <div className="mt-2.5 p-3.5 sm:p-4 bg-gradient-to-br from-indigo-50/90 via-violet-50/60 to-purple-50/80 border border-indigo-200 rounded-2xl shadow-xs transition-all animate-in fade-in duration-200">
          
          <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-indigo-100">
            <div className="flex items-center gap-2 text-xs font-black text-indigo-950">
              <Wand2 className="w-4 h-4 text-indigo-600" />
              <span>مولّد صور المنتجات (Gemini & Imagen AI)</span>
            </div>
            {productName && (
              <button
                type="button"
                onClick={() => setPrompt(getDefaultPrompt())}
                className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 hover:underline cursor-pointer"
                title="استعادة الوصف المقترح تلقائياً بناءً على اسم المنتج"
              >
                <RefreshCw className="w-3 h-3" />
                <span>اقتراح برومبت لـ "{productName}"</span>
              </button>
            )}
          </div>

          <div className="flex flex-col gap-2.5">
            <div>
              <label className="block text-[11px] font-bold text-indigo-900 mb-1">
                اكتب وصف الصورة (البرومبت Prompt) باللغة العربية أو الإنجليزية:
              </label>
              <div className="relative">
                <textarea
                  rows={2}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="مثال: صورة كزبرة ناشفة مطحونة في برطمان بقالة أنيق مع حبوب كزبرة، إضاءة استوديو بيضاء..."
                  className="w-full p-2.5 sm:p-3 bg-white border border-indigo-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-xs sm:text-sm text-gray-800 placeholder-gray-400 font-medium resize-none shadow-2xs"
                  disabled={isGenerating}
                />
              </div>
            </div>

            {/* Error Message if any */}
            {error && (
              <div className="flex items-start gap-2 p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-medium">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-bold">تعذر توليد الصورة:</p>
                  <p className="text-[11px] text-rose-700 mt-0.5">{error}</p>
                </div>
              </div>
            )}

            {/* Generated Preview & Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
              
              {/* Image Preview Box */}
              {(previewImage || currentImage) ? (
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden border-2 border-indigo-400 bg-white shadow-xs shrink-0">
                    <img 
                      src={previewImage || currentImage} 
                      alt="معاينة صورة الصنف" 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    {hasApplied && (
                      <div className="absolute inset-0 bg-emerald-600/20 flex items-center justify-center">
                        <span className="bg-emerald-600 text-white p-0.5 rounded-full shadow-xs">
                          <Check className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-black text-indigo-950 flex items-center gap-1">
                      <ImageIcon className="w-3.5 h-3.5 text-indigo-600" />
                      {hasApplied ? 'تم تطبيق الصورة للمنتج ✓' : 'تم تجهيز الصورة'}
                    </span>
                    <span className="text-[10px] text-gray-500 truncate">
                      سيتم حفظ هذه الصورة مع المنتج عند الضغط على حفظ.
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-[11px] text-gray-500 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>اضغط الزر لتوليد صورة فورية مخصصة للصنف</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className={`w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-black text-xs sm:text-sm text-white transition-all shadow-sm active:scale-95 cursor-pointer ${
                    isGenerating
                      ? 'bg-indigo-400 cursor-not-allowed opacity-90'
                      : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 shadow-indigo-200'
                  }`}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>جاري التوليد بالذكاء الاصطناعي...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>{previewImage ? 'إعادة التوليد ببرومبت جديد' : 'توليد الصورة الآن ✨'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
