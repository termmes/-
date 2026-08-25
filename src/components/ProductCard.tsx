import React, { useState, useRef } from 'react';
import { Product, Variation } from '../types';
import { 
  ImagePlus, 
  Trash2, 
  ChevronDown, 
  ChevronRight, 
  Tag, 
  Snowflake, 
  LayoutGrid, 
  UtensilsCrossed, 
  Sparkles,
  Package
} from 'lucide-react';

const CATEGORY_NAMES: Record<string, { label: string, color: string, icon: React.ComponentType<{ className?: string }> }> = {
  refrigerator: { label: 'الثلاجة', color: 'bg-cyan-50 text-cyan-700 border-cyan-200', icon: Snowflake },
  stands: { label: 'الستاندات', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: LayoutGrid },
  indomie: { label: 'إندومي', color: 'bg-red-50 text-red-700 border-red-200', icon: UtensilsCrossed },
  cleaners: { label: 'المناديل والمنظفات', color: 'bg-indigo-50 text-indigo-700 border-indigo-200', icon: Sparkles },
};

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
            width = Math.round((width * maxHeight) / height);
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

interface ProductCardProps {
  product: Product;
  onAddVariation: (productId: string, name: string, group: '5' | '10' | 'other') => void;
  onToggleStock: (productId: string, variationId: string) => void;
  onDeleteProduct: (productId: string) => void;
  onDeleteVariation: (productId: string, variationId: string) => void;
  onUpdateImage: (productId: string, newImageUrl: string) => void;
  onChangeCategory?: (productId: string, newCategory: string) => void;
  isOwner: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onAddVariation,
  onToggleStock,
  onDeleteProduct,
  onDeleteVariation,
  onUpdateImage,
  onChangeCategory,
  isOwner
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newVarNames, setNewVarNames] = useState<{ '5': string, '10': string, 'other': string }>({ '5': '', '10': '', 'other': '' });
  const [expandedGroups, setExpandedGroups] = useState<{ '5': boolean, '10': boolean, 'other': boolean }>({ '5': true, '10': true, 'other': true });
  const [isUpdatingImage, setIsUpdatingImage] = useState(false);
  const [isChangingCat, setIsChangingCat] = useState(false);

  const handleImageEdit = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setIsUpdatingImage(true);
        const compressedBase64 = await compressImage(file, 800, 800, 0.7);
        await onUpdateImage(product.id, compressedBase64);
      } catch (error) {
        console.error("Error updating image:", error);
        alert("Failed to update image. Please try a smaller file.");
      } finally {
        setIsUpdatingImage(false);
      }
    }
  };

  const handleAdd = (e: React.FormEvent, group: '5' | '10' | 'other') => {
    e.preventDefault();
    if (!newVarNames[group].trim()) return;
    onAddVariation(product.id, newVarNames[group], group);
    setNewVarNames(prev => ({ ...prev, [group]: '' }));
  };

  const categoryMeta = product.category && CATEGORY_NAMES[product.category] 
    ? CATEGORY_NAMES[product.category]
    : { label: 'عام', color: 'bg-gray-100 text-gray-700 border-gray-200', icon: Package };
  const CategoryIcon = categoryMeta.icon;

  const renderGroup = (groupId: '5' | '10' | 'other', title: string, subtitle: string) => {
    const groupVars = product.variations.filter(v => 
      v.group === groupId || (!v.group && groupId === 'other')
    );
    const isExpanded = expandedGroups[groupId];

    return (
      <div className="mb-3 last:mb-0 bg-gray-50/70 rounded-xl border border-gray-100 overflow-hidden">
        <button 
          type="button"
          onClick={() => setExpandedGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }))}
          className="w-full p-2.5 sm:p-3 flex items-center justify-between hover:bg-gray-100/60 transition-colors"
        >
          <div className="flex items-center gap-2">
            {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />}
            <h4 className="text-xs sm:text-sm font-bold text-gray-800 flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${groupId === '5' ? 'bg-emerald-500' : groupId === '10' ? 'bg-blue-500' : 'bg-purple-500'}`}></div>
              {title}
            </h4>
            <span className="text-[10px] text-gray-400 font-normal">({subtitle})</span>
          </div>
          <span className="text-xs font-bold text-gray-500 bg-white px-2 py-0.5 rounded-full border border-gray-200">
            {groupVars.length}
          </span>
        </button>
        
        {isExpanded && (
          <div className="p-2.5 sm:p-3 pt-0 border-t border-gray-100/60 mt-1">
            <div className="space-y-1.5 mb-2.5 mt-2">
              {groupVars.map(variation => (
                <div 
                  key={variation.id} 
                  id={`var-${variation.id}`}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between p-2 sm:p-2.5 gap-2 rounded-lg border transition-all ${
                    variation.isOutOfStock 
                      ? 'bg-red-50/90 border-red-200' 
                      : 'bg-white border-gray-200 shadow-2xs'
                  }`}
                >
                  <span className={`text-xs sm:text-sm leading-snug break-words min-w-0 font-medium ${
                    variation.isOutOfStock ? 'text-red-700 font-semibold' : 'text-gray-700'
                  }`}>
                    {variation.name}
                  </span>
                  <div className="flex items-center justify-end gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => onToggleStock(product.id, variation.id)}
                      className={`text-xs px-2.5 py-1.5 sm:px-3 sm:py-1 rounded-md font-bold transition-all shadow-2xs active:scale-95 ${
                        variation.isOutOfStock 
                          ? 'bg-red-600 text-white hover:bg-red-700' 
                          : 'bg-emerald-50 border border-emerald-300 text-emerald-700 hover:bg-emerald-100'
                      }`}
                      title={variation.isOutOfStock ? 'اضغط لتحويله إلى متوفر' : 'اضغط لتسجيله كنواقص'}
                    >
                      {variation.isOutOfStock ? 'ناقص (Out of Stock)' : 'متوفر (In Stock)'}
                    </button>
                    {isOwner && (
                      <button
                        type="button"
                        onClick={() => onDeleteVariation(product.id, variation.id)}
                        className="text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors p-1.5 rounded-md"
                        title="حذف هذا الصنف"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {groupVars.length === 0 && (
                <p className="text-[11px] text-gray-400 italic text-center py-2 bg-white rounded-lg border border-dashed border-gray-200">
                  لا توجد أطعمة أو أصناف مضافة
                </p>
              )}
            </div>
            <form onSubmit={(e) => handleAdd(e, groupId)} className="flex gap-1.5">
              <input
                type="text"
                placeholder={`إضافة صنف لـ ${title}...`}
                value={newVarNames[groupId]}
                onChange={(e) => setNewVarNames(prev => ({ ...prev, [groupId]: e.target.value }))}
                className="flex-1 px-3 py-1.5 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white min-w-0"
              />
              <button
                type="submit"
                disabled={!newVarNames[groupId].trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 text-white px-3 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all shadow-xs shrink-0 active:scale-95"
              >
                إضافة
              </button>
            </form>
          </div>
        )}
      </div>
    );
  };

  return (
    <div 
      id={`product-card-${product.id}`}
      className="bg-white rounded-2xl shadow-sm border border-gray-200/90 overflow-hidden flex flex-col transition-all hover:shadow-md"
    >
      {/* Product Image & Badges */}
      <div className="relative h-44 sm:h-48 bg-gray-100 group">
        <img 
          src={product.imageUrl} 
          alt={product.name} 
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&q=80&w=300&h=300';
          }}
        />

        {/* Category Pill Tag */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
          <span className={`flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full border shadow-2xs backdrop-blur-xs ${categoryMeta.color}`}>
            <CategoryIcon className="w-3 h-3" />
            {categoryMeta.label}
          </span>
        </div>

        {isUpdatingImage && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center backdrop-blur-xs">
            <span className="text-xs font-bold text-gray-800 bg-white px-3 py-1.5 rounded-full shadow-sm">جاري تحديث الصورة...</span>
          </div>
        )}

        {isOwner && (
          <div className="absolute top-2.5 right-2.5 flex gap-1.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all">
            <button 
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 bg-white/95 hover:bg-blue-50 text-gray-700 hover:text-blue-600 rounded-xl cursor-pointer shadow-sm transition-colors" 
              title="تغيير صورة المنتج"
              disabled={isUpdatingImage}
            >
              <ImagePlus className="w-4 h-4" />
            </button>
            <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageEdit} disabled={isUpdatingImage} />
            <button 
              type="button"
              onClick={() => onDeleteProduct(product.id)}
              className="p-2 bg-white/95 hover:bg-red-50 text-gray-700 hover:text-red-600 rounded-xl shadow-sm transition-colors"
              title="حذف المنتج بالكامل"
              disabled={isUpdatingImage}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
      
      {/* Product Content */}
      <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between">
        <div className="mb-3 flex items-start justify-between gap-2">
          <h3 className="text-base sm:text-lg font-extrabold text-gray-900 leading-tight">
            {product.name}
          </h3>

          {/* Change Category Dropdown for Owner */}
          {isOwner && onChangeCategory && (
            <div className="relative shrink-0">
              <select
                value={product.category || 'stands'}
                onChange={(e) => onChangeCategory(product.id, e.target.value)}
                className="text-[11px] font-semibold bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 text-gray-600 hover:bg-gray-100 outline-none cursor-pointer"
                title="تغيير القسم / الصفحة"
              >
                <option value="refrigerator">❄️ الثلاجة</option>
                <option value="stands">🏷️ الستاندات</option>
                <option value="indomie">🍜 إندومي</option>
                <option value="cleaners">🧼 المنظفات</option>
              </select>
            </div>
          )}
        </div>
        
        <div className="flex-1 flex flex-col gap-1.5">
          {renderGroup('5', 'فئة 5 جنيه', 'Price: 5')}
          {renderGroup('10', 'فئة 10 جنيه', 'Price: 10')}
          {renderGroup('other', 'فئات أخرى / أحجام متنوعة', 'Other')}
        </div>
      </div>
    </div>
  );
};
