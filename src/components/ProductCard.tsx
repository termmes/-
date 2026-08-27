import React, { useState, useRef } from 'react';
import { Product, Variation } from '../types';
import { ProductSettingsModal } from './ProductSettingsModal';
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
  Package,
  Settings,
  Edit2,
  Check,
  X
} from 'lucide-react';

const CATEGORY_NAMES: Record<string, { label: string, color: string, icon: React.ComponentType<{ className?: string }> }> = {
  refrigerator: { label: 'الثلاجة', color: 'bg-cyan-50 text-cyan-700 border-cyan-200', icon: Snowflake },
  stands: { label: 'الستاندات', color: 'bg-amber-700/10 text-amber-800 border-amber-300', icon: LayoutGrid },
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
  onUpdateProduct?: (productId: string, updates: { name: string; category: string; imageUrl: string; variations: Variation[] }) => Promise<void>;
  onRenameProduct?: (productId: string, newName: string) => Promise<void>;
  isOwner: boolean;
  isSupervisor?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onAddVariation,
  onToggleStock,
  onDeleteProduct,
  onDeleteVariation,
  onUpdateImage,
  onChangeCategory,
  onUpdateProduct,
  onRenameProduct,
  isOwner,
  isSupervisor = false
}) => {
  const canManage = isOwner || isSupervisor;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newVarNames, setNewVarNames] = useState<{ '5': string, '10': string, 'other': string }>({ '5': '', '10': '', 'other': '' });
  const [expandedGroups, setExpandedGroups] = useState<{ '5': boolean, '10': boolean, 'other': boolean }>({ '5': false, '10': false, 'other': false });
  const [isUpdatingImage, setIsUpdatingImage] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isInlineEditingName, setIsInlineEditingName] = useState(false);
  const [inlineName, setInlineName] = useState(product.name);

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

  const handleSaveInlineRename = async () => {
    if (!inlineName.trim()) {
      setInlineName(product.name);
      setIsInlineEditingName(false);
      return;
    }

    if (inlineName.trim() !== product.name) {
      if (onRenameProduct) {
        await onRenameProduct(product.id, inlineName.trim());
      } else if (onUpdateProduct) {
        await onUpdateProduct(product.id, {
          name: inlineName.trim(),
          category: product.category || 'stands',
          imageUrl: product.imageUrl,
          variations: product.variations || []
        });
      }
    }
    setIsInlineEditingName(false);
  };

  const handleAdd = (e: React.FormEvent, group: '5' | '10' | 'other') => {
    e.preventDefault();
    if (!newVarNames[group].trim()) return;
    onAddVariation(product.id, newVarNames[group], group);
    setNewVarNames(prev => ({ ...prev, [group]: '' }));
    setExpandedGroups(prev => ({ ...prev, [group]: true }));
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
            <div className="space-y-2 mb-2.5 mt-2">
              {groupVars.map(variation => (
                <div 
                  key={variation.id} 
                  id={`var-${variation.id}`}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between p-2.5 sm:p-3 gap-2 rounded-xl border transition-all ${
                    variation.isOutOfStock 
                      ? 'bg-red-50/90 border-red-200' 
                      : 'bg-white border-gray-200 shadow-2xs hover:border-gray-300'
                  }`}
                >
                  <span className={`text-xs sm:text-sm lg:text-base leading-snug break-words min-w-0 font-bold flex-1 ${
                    variation.isOutOfStock ? 'text-red-700' : 'text-gray-800'
                  }`}>
                    {variation.name}
                  </span>
                  <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-gray-100/80 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => onToggleStock(product.id, variation.id)}
                      className={`flex-1 sm:flex-initial text-xs sm:text-sm px-3 py-2 sm:px-3.5 sm:py-2 rounded-xl font-black transition-all shadow-2xs active:scale-95 min-h-[42px] flex items-center justify-center cursor-pointer ${
                        variation.isOutOfStock 
                          ? 'bg-red-600 text-white hover:bg-red-700' 
                          : 'bg-emerald-50 border border-emerald-300 text-emerald-700 hover:bg-emerald-100'
                      }`}
                      title={variation.isOutOfStock ? 'اضغط لتحويله إلى متوفر' : 'اضغط لتسجيله كنواقص'}
                    >
                      {variation.isOutOfStock ? 'ناقص (Out of Stock)' : 'متوفر (In Stock)'}
                    </button>
                    {canManage && (
                      <button
                        type="button"
                        onClick={() => onDeleteVariation(product.id, variation.id)}
                        className="text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors p-2 rounded-xl min-h-[42px] min-w-[42px] flex items-center justify-center cursor-pointer"
                        title="حذف هذا الصنف"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {groupVars.length === 0 && (
                <p className="text-xs text-gray-400 italic text-center py-2.5 bg-white rounded-xl border border-dashed border-gray-200">
                  لا توجد أطعمة أو أصناف مضافة
                </p>
              )}
            </div>
            <form onSubmit={(e) => handleAdd(e, groupId)} className="flex gap-2">
              <input
                type="text"
                placeholder={`إضافة صنف لـ ${title}...`}
                value={newVarNames[groupId]}
                onChange={(e) => setNewVarNames(prev => ({ ...prev, [groupId]: e.target.value }))}
                className="flex-1 px-3.5 py-2 text-xs sm:text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white min-w-0 min-h-[40px]"
              />
              <button
                type="submit"
                disabled={!newVarNames[groupId].trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 text-white px-4 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-xs shrink-0 active:scale-95 min-h-[40px]"
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
      className="bg-white rounded-2xl shadow-sm border border-gray-200/90 overflow-hidden flex flex-col transition-all hover:shadow-md h-full"
    >
      {/* Product Image & Badges */}
      <div className="relative h-48 sm:h-52 md:h-56 lg:h-52 xl:h-56 2xl:h-64 bg-gray-100 group">
        <img 
          src={product.imageUrl} 
          alt={product.name} 
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&q=80&w=300&h=300';
          }}
        />

        {/* Category Pill Tag */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5">
          <span className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border shadow-xs backdrop-blur-xs ${categoryMeta.color}`}>
            <CategoryIcon className="w-3.5 h-3.5" />
            {categoryMeta.label}
          </span>
        </div>

        {isUpdatingImage && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center backdrop-blur-xs">
            <span className="text-xs font-bold text-gray-800 bg-white px-4 py-2 rounded-full shadow-sm">جاري تحديث الصورة...</span>
          </div>
        )}

        {canManage && (
          <div className="absolute top-3 right-3 flex gap-1.5 opacity-100 sm:opacity-90 sm:group-hover:opacity-100 transition-all">
            <button 
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 sm:p-2.5 bg-white/95 hover:bg-blue-50 text-gray-700 hover:text-blue-600 rounded-xl cursor-pointer shadow-sm transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center border border-gray-100" 
              title="إعدادات وتعديل المنتج (الاسم، القسم، الصورة، الأصناف)"
              disabled={isUpdatingImage}
            >
              <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
            </button>
            <button 
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 sm:p-2.5 bg-white/95 hover:bg-blue-50 text-gray-700 hover:text-blue-600 rounded-xl cursor-pointer shadow-sm transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center border border-gray-100" 
              title="تغيير صورة المنتج سريعا"
              disabled={isUpdatingImage}
            >
              <ImagePlus className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageEdit} disabled={isUpdatingImage} />
            <button 
              type="button" 
              onClick={() => onDeleteProduct(product.id)}
              className="p-2 sm:p-2.5 bg-white/95 hover:bg-red-50 text-gray-700 hover:text-red-600 rounded-xl shadow-sm transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center border border-gray-100"
              title="حذف المنتج بالكامل"
              disabled={isUpdatingImage}
            >
              <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        )}
      </div>
      
      {/* Product Content */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div className="mb-3.5 flex items-start justify-between gap-2">
          {/* Editable Product Title */}
          {isInlineEditingName ? (
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              <input
                type="text"
                value={inlineName}
                onChange={(e) => setInlineName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveInlineRename();
                  if (e.key === 'Escape') {
                    setInlineName(product.name);
                    setIsInlineEditingName(false);
                  }
                }}
                autoFocus
                className="w-full px-2.5 py-1.5 bg-blue-50/60 border-2 border-blue-500 rounded-xl text-sm sm:text-base font-black text-gray-900 outline-none"
                placeholder="اسم المنتج الجديد..."
              />
              <button
                type="button"
                onClick={handleSaveInlineRename}
                className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs shrink-0"
                title="تأكيد وحفظ الاسم"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setInlineName(product.name);
                  setIsInlineEditingName(false);
                }}
                className="p-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl shrink-0"
                title="إلغاء"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 group/title flex-1 min-w-0">
              <h3 className="text-base sm:text-lg lg:text-xl font-black text-gray-900 leading-tight truncate">
                {product.name}
              </h3>
              {canManage && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setInlineName(product.name);
                      setIsInlineEditingName(true);
                    }}
                    className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="تعديل اسم المنتج سريعاً"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsSettingsOpen(true)}
                    className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="فتح إعدادات المنتج"
                  >
                    <Settings className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Change Category Dropdown for Owner / Supervisor */}
          {canManage && onChangeCategory && !isInlineEditingName && (
            <div className="relative shrink-0">
              <select
                value={product.category || 'stands'}
                onChange={(e) => onChangeCategory(product.id, e.target.value)}
                className="text-xs font-bold bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-1.5 text-gray-600 hover:bg-gray-100 outline-none cursor-pointer"
                title="تغيير القسم / الصفحة"
              >
                <option value="refrigerator">❄️ الثلاجات والمشروبات</option>
                <option value="stands">🏷️ الستاندات والسناكس</option>
                <option value="indomie">🍜 إندومي ومعكرونة</option>
                <option value="paper_tissues">🧻 المناديل والورقيات</option>
                <option value="cleaners">🧼 المنظفات والعناية</option>
                <option value="grocery">🥫 البقالة والمعلبات</option>
                <option value="spices_nuts">🍬 العطارة والتسالي</option>
              </select>
            </div>
          )}
        </div>
        
        <div className="flex-1 flex flex-col gap-2">
          {renderGroup('5', 'فئة 5 جنيه', 'Price: 5')}
          {renderGroup('10', 'فئة 10 جنيه', 'Price: 10')}
          {renderGroup('other', 'فئات أخرى / أحجام متنوعة', 'Other')}
        </div>
      </div>

      {/* Product Settings & Full Edit Modal */}
      {isSettingsOpen && (
        <ProductSettingsModal
          product={product}
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          onSave={async (productId, updates) => {
            if (onUpdateProduct) {
              await onUpdateProduct(productId, updates);
            }
          }}
          onDeleteProduct={async (productId) => {
            await onDeleteProduct(productId);
          }}
        />
      )}
    </div>
  );
};
