import React, { useState } from 'react';
import { Product, Variation, PageCategory } from '../types';
import { PAGES_CONFIG } from './PageNavigation';
import { 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertTriangle, 
  Package, 
  Edit3, 
  Trash2, 
  Plus, 
  ChevronRight,
  ExternalLink,
  Layers,
  Sparkles,
  Tag,
  Eye,
  SlidersHorizontal,
  X
} from 'lucide-react';
import { ProductSettingsModal } from './ProductSettingsModal';

interface QuickInventoryTableProps {
  products: Product[];
  currentUserId: string;
  isSupervisor: boolean;
  onToggleStock: (productId: string, variationId: string) => Promise<void>;
  onDeleteProduct: (productId: string) => Promise<void>;
  onDeleteVariation: (productId: string, variationId: string) => Promise<void>;
  onAddVariation: (productId: string, variationName: string, group: '5' | '10' | 'other') => Promise<void>;
  onUpdateProduct: (productId: string, updates: { name: string; category: string; imageUrl: string; variations: Variation[] }) => Promise<void>;
}

export const QuickInventoryTable: React.FC<QuickInventoryTableProps> = ({
  products,
  currentUserId,
  isSupervisor,
  onToggleStock,
  onDeleteProduct,
  onDeleteVariation,
  onAddVariation,
  onUpdateProduct
}) => {
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [stockStatusFilter, setStockStatusFilter] = useState<'all' | 'in_stock' | 'out_of_stock'>('all');
  const [priceGroupFilter, setPriceGroupFilter] = useState<'all' | '5' | '10' | 'other'>('all');
  const [selectedProductForModal, setSelectedProductForModal] = useState<Product | null>(null);
  
  // Quick Add variation state
  const [quickAddProductId, setQuickAddProductId] = useState<string | null>(null);
  const [quickAddName, setQuickAddName] = useState('');
  const [quickAddGroup, setQuickAddGroup] = useState<'5' | '10' | 'other'>('5');

  // Filter products
  const filteredProducts = products.filter(product => {
    // Search query
    if (search.trim()) {
      const matchName = product.name.toLowerCase().includes(search.toLowerCase());
      const matchVar = product.variations?.some(v => v.name.toLowerCase().includes(search.toLowerCase()));
      if (!matchName && !matchVar) return false;
    }

    // Department filter
    if (selectedDept !== 'all') {
      const pCat = product.category || 'stands';
      if (pCat !== selectedDept) return false;
    }

    // Stock status filter
    if (stockStatusFilter === 'out_of_stock') {
      const hasOutOfStock = product.variations?.some(v => v.isOutOfStock);
      if (!hasOutOfStock) return false;
    } else if (stockStatusFilter === 'in_stock') {
      const hasOutOfStock = product.variations?.some(v => v.isOutOfStock);
      if (hasOutOfStock && product.variations?.every(v => v.isOutOfStock)) return false;
    }

    // Price group filter
    if (priceGroupFilter !== 'all') {
      const hasGroup = product.variations?.some(v => (v.group || 'other') === priceGroupFilter);
      if (!hasGroup) return false;
    }

    return true;
  });

  const handleQuickAddVariation = async (productId: string) => {
    if (!quickAddName.trim()) return;
    await onAddVariation(productId, quickAddName.trim(), quickAddGroup);
    setQuickAddName('');
    setQuickAddProductId(null);
  };

  const getDeptInfo = (cat?: string) => {
    return PAGES_CONFIG.find(p => p.id === (cat || 'stands')) || PAGES_CONFIG[0];
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-200/90 shadow-2xs overflow-hidden flex flex-col space-y-4 p-4 sm:p-6">
      
      {/* Table Header Controls */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pb-3 border-b border-gray-100">
        <div>
          <h3 className="text-base sm:text-lg font-black text-gray-900 flex items-center gap-2">
            <span>جدول الجرد السريع وإدارة المخزون</span>
            <span className="text-xs bg-blue-100 text-blue-800 font-bold px-2.5 py-0.5 rounded-full">
              {filteredProducts.length} منتج
            </span>
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            تحديث فوري لحالة التوفر وتغيير الأقسام والأسعار بضغطة زر واحدة
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="بحث فوري في كل الأصناف والأطعمة..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Filter Chips Bar */}
      <div className="flex flex-wrap items-center gap-2 pt-1 pb-1">
        
        {/* Department Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          <span className="text-xs font-bold text-gray-400 ml-1 shrink-0">القسم:</span>
          
          <button
            type="button"
            onClick={() => setSelectedDept('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              selectedDept === 'all'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-gray-100 hover:bg-gray-200/80 text-gray-700'
            }`}
          >
            الكل
          </button>

          {PAGES_CONFIG.filter(p => p.id !== 'all' && p.id !== 'needed').map(dept => (
            <button
              key={dept.id}
              type="button"
              onClick={() => setSelectedDept(dept.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 ${
                selectedDept === dept.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-gray-100 hover:bg-gray-200/80 text-gray-700'
              }`}
            >
              <span>{dept.title}</span>
            </button>
          ))}
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1.5 mr-auto">
          <span className="text-xs font-bold text-gray-400 ml-1">الحالة:</span>
          
          <button
            type="button"
            onClick={() => setStockStatusFilter('all')}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              stockStatusFilter === 'all' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700'
            }`}
          >
            الكل
          </button>

          <button
            type="button"
            onClick={() => setStockStatusFilter('out_of_stock')}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
              stockStatusFilter === 'out_of_stock' ? 'bg-rose-600 text-white' : 'bg-rose-50 text-rose-700 border border-rose-200'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>النواقص فقط</span>
          </button>

          <button
            type="button"
            onClick={() => setStockStatusFilter('in_stock')}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
              stockStatusFilter === 'in_stock' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>المتوفر فقط</span>
          </button>
        </div>

      </div>

      {/* Responsive Table Container */}
      <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
        <table className="w-full text-right border-collapse min-w-[700px]">
          <thead>
            <tr className="bg-gray-50/80 border-b border-gray-200 text-gray-600 text-xs font-black">
              <th className="p-3.5 pr-4 w-12">#</th>
              <th className="p-3.5">المنتج والصورة</th>
              <th className="p-3.5">القسم</th>
              <th className="p-3.5">الأطعمة / الأحجام وحالة التوفر</th>
              <th className="p-3.5 text-center w-28">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-xs sm:text-sm">
            {filteredProducts.map((product, idx) => {
              const deptInfo = getDeptInfo(product.category);
              const DeptIcon = deptInfo.icon;
              const canManage = isSupervisor || product.ownerId === currentUserId;
              const outOfStockVars = product.variations?.filter(v => v.isOutOfStock) || [];

              return (
                <tr key={product.id} className="hover:bg-blue-50/20 transition-colors group">
                  
                  {/* Row index */}
                  <td className="p-3.5 pr-4 text-xs font-bold text-gray-400 align-top pt-4">
                    {idx + 1}
                  </td>

                  {/* Product Info */}
                  <td className="p-3.5 align-top">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gray-100 border border-gray-200 overflow-hidden shrink-0 flex items-center justify-center">
                        <img 
                          src={product.imageUrl} 
                          alt={product.name} 
                          className="w-full h-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&q=80&w=150&h=150'; }}
                        />
                      </div>
                      <div>
                        <div className="font-black text-gray-900 text-sm sm:text-base">
                          {product.name}
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                          <span>{product.variations?.length || 0} طعم/حجم</span>
                          {outOfStockVars.length > 0 && (
                            <span className="text-rose-600 font-bold bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                              {outOfStockVars.length} ناقص
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Department */}
                  <td className="p-3.5 align-top pt-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold border ${deptInfo.bgColor} ${deptInfo.color} ${deptInfo.borderColor}`}>
                      <DeptIcon className="w-3.5 h-3.5" />
                      <span>{deptInfo.title}</span>
                    </span>
                  </td>

                  {/* Variations & Stock Quick Toggles */}
                  <td className="p-3.5 align-top">
                    <div className="flex flex-wrap gap-1.5 items-center">
                      {product.variations?.map((v) => (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => onToggleStock(product.id, v.id)}
                          className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 cursor-pointer select-none active:scale-95 ${
                            v.isOutOfStock
                              ? 'bg-red-50 hover:bg-red-100 text-red-700 border-red-300 ring-1 ring-red-400'
                              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
                          }`}
                          title={`اضغط للتحويل إلى ${v.isOutOfStock ? 'متوفر' : 'ناقص'}`}
                        >
                          <span className={`w-2 h-2 rounded-full ${v.isOutOfStock ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`} />
                          <span className="font-extrabold">{v.name}</span>
                          <span className="text-[10px] opacity-75">
                            {v.group === '5' ? '(5 ج)' : v.group === '10' ? '(10 ج)' : ''}
                          </span>
                          <span className="text-[10px] font-black underline mr-0.5">
                            {v.isOutOfStock ? 'ناقص' : 'متوفر'}
                          </span>
                        </button>
                      ))}

                      {product.variations?.length === 0 && (
                        <span className="text-xs text-gray-400 italic">لا توجد أطعمة مضافة بعد</span>
                      )}

                      {/* Quick Add Inline Variation */}
                      {canManage && (
                        quickAddProductId === product.id ? (
                          <div className="flex items-center gap-1 bg-blue-50 p-1 rounded-xl border border-blue-200">
                            <input
                              type="text"
                              placeholder="اسم الطعم..."
                              value={quickAddName}
                              onChange={(e) => setQuickAddName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleQuickAddVariation(product.id);
                                if (e.key === 'Escape') setQuickAddProductId(null);
                              }}
                              className="px-2 py-1 bg-white border border-blue-300 rounded-lg text-xs font-bold outline-none w-28"
                              autoFocus
                            />
                            <select
                              value={quickAddGroup}
                              onChange={(e) => setQuickAddGroup(e.target.value as any)}
                              className="px-1.5 py-1 bg-white border border-blue-300 rounded-lg text-[10px] font-bold text-gray-700"
                            >
                              <option value="5">5 ج</option>
                              <option value="10">10 ج</option>
                              <option value="other">أخرى</option>
                            </select>
                            <button
                              type="button"
                              onClick={() => handleQuickAddVariation(product.id)}
                              className="px-2 py-1 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700"
                            >
                              +
                            </button>
                            <button
                              type="button"
                              onClick={() => setQuickAddProductId(null)}
                              className="p-1 text-gray-400 hover:text-gray-600"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setQuickAddProductId(product.id);
                              setQuickAddName('');
                            }}
                            className="px-2 py-1 bg-gray-50 hover:bg-blue-50 text-gray-500 hover:text-blue-700 border border-dashed border-gray-300 hover:border-blue-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                            <span>طعم جديد</span>
                          </button>
                        )
                      )}
                    </div>
                  </td>

                  {/* Actions Column */}
                  <td className="p-3.5 align-top pt-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      {canManage && (
                        <>
                          <button
                            type="button"
                            onClick={() => setSelectedProductForModal(product)}
                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors cursor-pointer"
                            title="تعديل تفاصيل الصنف بالكامل"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => onDeleteProduct(product.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                            title="حذف المنتج نهائياً"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>

                </tr>
              );
            })}

            {filteredProducts.length === 0 && (
              <tr>
                <td colSpan={5} className="py-12 text-center text-gray-400">
                  <Package className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                  <p className="font-bold text-gray-600">لا توجد أصناف مطابقة لمعايير البحث</p>
                  <p className="text-xs text-gray-400 mt-1">جرب تغيير شروط الفلترة أو تفريغ خانة البحث</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Settings Modal */}
      {selectedProductForModal && (
        <ProductSettingsModal
          product={selectedProductForModal}
          isOpen={Boolean(selectedProductForModal)}
          onClose={() => setSelectedProductForModal(null)}
          onSave={async (productId, updates) => {
            await onUpdateProduct(productId, updates);
            setSelectedProductForModal(null);
          }}
          onDeleteProduct={async (productId) => {
            await onDeleteProduct(productId);
            setSelectedProductForModal(null);
          }}
        />
      )}
    </div>
  );
};
