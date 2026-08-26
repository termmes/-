import React, { useState, useRef } from 'react';
import { Product, Variation } from '../types';
import { 
  X, 
  Save, 
  Settings, 
  ImagePlus, 
  Trash2, 
  Tag, 
  FolderSync, 
  Check, 
  Sparkles,
  AlertCircle
} from 'lucide-react';

interface ProductSettingsModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
  onSave: (productId: string, updates: { name: string; category: string; imageUrl: string; variations: Variation[] }) => Promise<void>;
  onDeleteProduct: (productId: string) => Promise<void>;
}

const compressImage = (file: File, maxWidth: number, maxHeight: number, quality: number = 0.7): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((height * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
};

export const ProductSettingsModal: React.FC<ProductSettingsModalProps> = ({
  product,
  isOpen,
  onClose,
  onSave,
  onDeleteProduct
}) => {
  if (!isOpen) return null;

  const [name, setName] = useState(product.name);
  const [category, setCategory] = useState(product.category || 'stands');
  const [imageUrl, setImageUrl] = useState(product.imageUrl);
  const [variations, setVariations] = useState<Variation[]>(product.variations || []);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setIsUploadingImage(true);
        const compressedBase64 = await compressImage(file, 800, 800, 0.7);
        setImageUrl(compressedBase64);
      } catch (err) {
        console.error('Error compressing image:', err);
        alert('حدث خطأ أثناء معالجة الصورة. يرجى تجربة صورة أصغر.');
      } finally {
        setIsUploadingImage(false);
      }
    }
  };

  const handleVariationNameChange = (variationId: string, newVarName: string) => {
    setVariations(prev => prev.map(v => v.id === variationId ? { ...v, name: newVarName } : v));
  };

  const handleVariationGroupChange = (variationId: string, newGroup: '5' | '10' | 'other') => {
    setVariations(prev => prev.map(v => v.id === variationId ? { ...v, group: newGroup } : v));
  };

  const handleRemoveVariation = (variationId: string) => {
    setVariations(prev => prev.filter(v => v.id !== variationId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setIsSaving(true);
      await onSave(product.id, {
        name: name.trim(),
        category,
        imageUrl,
        variations
      });
      setSuccessMessage('تم حفظ التعديلات بنجاح!');
      setTimeout(() => {
        setSuccessMessage('');
        onClose();
      }, 700);
    } catch (error) {
      console.error('Error saving product settings:', error);
      alert('حدث خطأ أثناء حفظ الإعدادات.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`هل أنت متأكد من حذف منتج "${product.name}" نهائياً مع كافة أصنافه؟`)) return;
    try {
      setIsDeleting(true);
      await onDeleteProduct(product.id);
      onClose();
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('حدث خطأ أثناء حذف المنتج.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-gray-100 w-full max-w-xl overflow-hidden my-auto flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 sm:p-5 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-xs">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black leading-tight">إعدادات وتعديل المنتج</h3>
              <p className="text-xs text-blue-100">تعديل الاسم، القسم، الصورة، والأصناف</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-xl transition-colors text-white/90 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">
          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* 1. Product Name */}
          <div className="space-y-1.5">
            <label className="block text-xs sm:text-sm font-black text-gray-800">
              اسم المنتج (مثال: شيبسي كرانشي / كرانشي / بيبسي كانز):
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="اسم المنتج..."
              className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-sm font-bold text-gray-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              required
            />
            <p className="text-[11px] text-gray-400">
              يمكنك تغيير اسم المنتج في أي وقت وسيتم تحديثه في كل الأقسام وقوائم النواقص فوراً.
            </p>
          </div>

          {/* 2. Category */}
          <div className="space-y-1.5">
            <label className="block text-xs sm:text-sm font-black text-gray-800 flex items-center gap-1.5">
              <FolderSync className="w-4 h-4 text-blue-600" />
              <span>القسم والتصنيف:</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-sm font-bold text-gray-800 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
            >
              <option value="refrigerator">❄️ الثلاجة</option>
              <option value="stands">🏷️ الستاندات (شيبسي / مقرمشات)</option>
              <option value="indomie">🍜 إندومي</option>
              <option value="cleaners">🧼 المناديل والمنظفات</option>
            </select>
          </div>

          {/* 3. Product Image */}
          <div className="space-y-2">
            <label className="block text-xs sm:text-sm font-black text-gray-800 flex items-center gap-1.5">
              <ImagePlus className="w-4 h-4 text-blue-600" />
              <span>صورة المنتج:</span>
            </label>
            
            <div className="flex items-center gap-4 bg-gray-50 p-3 rounded-2xl border border-gray-200">
              <img
                src={imageUrl}
                alt={name}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover border border-gray-300 shrink-0 bg-white"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&q=80&w=300&h=300';
                }}
              />
              <div className="flex-1 space-y-2 min-w-0">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingImage}
                    className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs"
                  >
                    <ImagePlus className="w-4 h-4" />
                    <span>{isUploadingImage ? 'جاري الرفع...' : 'رفع صورة جديدة'}</span>
                  </button>
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleImageFile}
                    className="hidden"
                  />
                </div>
                <input
                  type="text"
                  value={imageUrl.startsWith('data:') ? 'تم تحميل صورة مخصصة من الجهاز' : imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  disabled={imageUrl.startsWith('data:')}
                  placeholder="رابط صورة مباشر..."
                  className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-600 outline-none truncate"
                />
              </div>
            </div>
          </div>

          {/* 4. Variations & Tastes Manager */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs sm:text-sm font-black text-gray-800 flex items-center gap-1.5">
                <Tag className="w-4 h-4 text-blue-600" />
                <span>أصناف ونكهات المنتج ({variations.length}):</span>
              </label>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {variations.map((v) => (
                <div 
                  key={v.id}
                  className="flex items-center gap-2 bg-gray-50 p-2.5 rounded-xl border border-gray-200"
                >
                  <input
                    type="text"
                    value={v.name}
                    onChange={(e) => handleVariationNameChange(v.id, e.target.value)}
                    className="flex-1 px-2.5 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-bold text-gray-800 outline-none focus:ring-2 focus:ring-blue-500 min-w-0"
                    placeholder="اسم الصنف / الطعم..."
                  />

                  <select
                    value={v.group || 'other'}
                    onChange={(e) => handleVariationGroupChange(v.id, e.target.value as '5' | '10' | 'other')}
                    className="px-2 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-bold text-gray-700 outline-none cursor-pointer shrink-0"
                  >
                    <option value="5">5 جنيه</option>
                    <option value="10">10 جنيه</option>
                    <option value="other">أخرى</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => handleRemoveVariation(v.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                    title="حذف هذا الصنف"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}

              {variations.length === 0 && (
                <p className="text-xs text-gray-400 italic text-center py-3 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  لا توجد أصناف مضافة لهذا المنتج بعد. يمكنك إضافتها من بطاقة المنتج.
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting || isSaving}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl text-xs sm:text-sm font-bold transition-colors border border-red-200"
            >
              <Trash2 className="w-4 h-4" />
              <span>{isDeleting ? 'جاري الحذف...' : 'حذف المنتج'}</span>
            </button>

            <div className="w-full sm:w-auto flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-initial px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs sm:text-sm font-bold transition-colors"
              >
                إلغاء
              </button>

              <button
                type="submit"
                disabled={isSaving || !name.trim()}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-sm active:scale-95 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'جاري الحفظ...' : 'حفظ التعديلات'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
