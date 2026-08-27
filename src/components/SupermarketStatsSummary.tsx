import React from 'react';
import { Product, ReminderItem, PageCategory } from '../types';
import { PAGES_CONFIG } from './PageNavigation';
import { 
  Package, 
  CheckCircle2, 
  AlertTriangle, 
  ClipboardList, 
  TrendingUp, 
  Boxes, 
  Layers, 
  ArrowUpRight,
  ShieldCheck
} from 'lucide-react';

interface SupermarketStatsSummaryProps {
  products: Product[];
  remindersCount: number;
  onSelectDepartment?: (dept: PageCategory | 'all') => void;
  onSelectCategory?: (dept: PageCategory | 'all') => void;
  onFilterOutOfStock?: () => void;
  onOpenNeeded?: () => void;
  onOpenSupplierOrders?: () => void;
}

export const SupermarketStatsSummary: React.FC<SupermarketStatsSummaryProps> = ({
  products,
  remindersCount,
  onSelectDepartment,
  onSelectCategory,
  onFilterOutOfStock,
  onOpenNeeded,
  onOpenSupplierOrders
}) => {
  const handleSelectDept = (dept: PageCategory | 'all') => {
    if (onSelectDepartment) onSelectDepartment(dept);
    else if (onSelectCategory) onSelectCategory(dept);
  };

  // Total variations calculation
  const totalVariations = products.reduce((acc, p) => acc + (p.variations?.length || 0), 0);
  
  // Total out of stock variations
  const outOfStockCount = products.reduce((acc, p) => 
    acc + (p.variations?.filter(v => v.isOutOfStock).length || 0), 0
  );

  const inStockCount = Math.max(0, totalVariations - outOfStockCount);
  const inStockRate = totalVariations > 0 ? Math.round((inStockCount / totalVariations) * 100) : 100;

  // Active departments with at least 1 product
  const activeDepartmentsCount = PAGES_CONFIG.filter(
    p => p.id !== 'all' && p.id !== 'needed' && products.some(prod => prod.category === p.id)
  ).length;

  return (
    <div className="bg-white rounded-3xl p-4 sm:p-6 border border-gray-200/90 shadow-2xs space-y-4">
      {/* Title & Quick Info */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-blue-50 text-blue-700 rounded-xl">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-gray-900">
              المركز الإداري ومؤشرات المخزون
            </h2>
            <p className="text-xs text-gray-400">
              نظرة عامة على حالة توفر الأصناف، الأقسام، وطلبيات التوريد الفورية
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>نسبة التوفر: {inStockRate}%</span>
          </span>
        </div>
      </div>

      {/* KPI Cards Grid - Responsive from 320px mobile to 4K TV */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
        
        {/* 1. Total Products & Varieties */}
        <div className="bg-gradient-to-br from-slate-50 to-gray-50/80 p-3 sm:p-4 rounded-2xl border border-gray-200/80 flex flex-col justify-between min-h-[90px] sm:min-h-[105px]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-bold text-gray-500">إجمالي الأصناف</span>
            <div className="p-1.5 sm:p-2 bg-blue-100/60 text-blue-700 rounded-xl">
              <Package className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-1.5 flex flex-wrap items-baseline gap-1">
            <span className="text-xl sm:text-2xl lg:text-3xl font-black text-gray-900">{products.length}</span>
            <span className="text-[10px] sm:text-xs text-gray-500 font-medium truncate">منتج ({totalVariations})</span>
          </div>
        </div>

        {/* 2. In Stock */}
        <div className="bg-gradient-to-br from-emerald-50/50 to-teal-50/30 p-3 sm:p-4 rounded-2xl border border-emerald-100 flex flex-col justify-between min-h-[90px] sm:min-h-[105px]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-bold text-emerald-800">المتوفر</span>
            <div className="p-1.5 sm:p-2 bg-emerald-100 text-emerald-700 rounded-xl">
              <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-1.5 flex flex-wrap items-baseline gap-1">
            <span className="text-xl sm:text-2xl lg:text-3xl font-black text-emerald-700">{inStockCount}</span>
            <span className="text-[10px] sm:text-xs text-emerald-600 font-medium truncate">جاهز للبيع</span>
          </div>
        </div>

        {/* 3. Out of Stock */}
        <div 
          onClick={() => onFilterOutOfStock?.()}
          className={`p-3 sm:p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between min-h-[90px] sm:min-h-[105px] ${
            outOfStockCount > 0 
              ? 'bg-gradient-to-br from-rose-50/70 to-red-50/50 border-rose-200 hover:border-rose-300 shadow-2xs' 
              : 'bg-gray-50 border-gray-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-bold text-rose-800">النواقص</span>
            <div className="p-1.5 sm:p-2 bg-rose-100 text-rose-700 rounded-xl">
              <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-1.5 flex items-baseline justify-between">
            <div className="flex flex-wrap items-baseline gap-1">
              <span className="text-xl sm:text-2xl lg:text-3xl font-black text-rose-600">{outOfStockCount}</span>
              <span className="text-[10px] sm:text-xs text-rose-500 font-medium truncate">ناقص</span>
            </div>
            {outOfStockCount > 0 && (
              <span className="text-[9px] sm:text-[10px] font-black text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded-md">
                عرض
              </span>
            )}
          </div>
        </div>

        {/* 4. Needed Notebook Items */}
        <div 
          onClick={() => onOpenNeeded?.()}
          className="bg-gradient-to-br from-indigo-50/50 to-blue-50/30 p-3 sm:p-4 rounded-2xl border border-indigo-100 hover:border-indigo-200 transition-all cursor-pointer flex flex-col justify-between min-h-[90px] sm:min-h-[105px]"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-bold text-indigo-800">دفتر الطلبيات</span>
            <div className="p-1.5 sm:p-2 bg-indigo-100 text-indigo-700 rounded-xl">
              <ClipboardList className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-1.5 flex items-baseline justify-between">
            <div className="flex flex-wrap items-baseline gap-1">
              <span className="text-xl sm:text-2xl lg:text-3xl font-black text-indigo-700">{remindersCount}</span>
              <span className="text-[10px] sm:text-xs text-indigo-600 font-medium truncate">ملاحظة</span>
            </div>
            <span className="text-[9px] sm:text-[10px] font-black text-indigo-700 bg-indigo-100 px-1.5 py-0.5 rounded-md">
              فتح
            </span>
          </div>
        </div>

      </div>

      {/* Department Breakdown Mini-Bar */}
      <div className="pt-2">
        <span className="text-xs font-bold text-gray-500 mb-2 block">توزيع الأصناف على أقسام السوبر ماركت:</span>
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {PAGES_CONFIG.filter(p => p.id !== 'all' && p.id !== 'needed').map((dept) => {
            const count = products.filter(p => p.category === dept.id || (!p.category && dept.id === 'stands')).length;
            const deptOutOfStock = products
              .filter(p => p.category === dept.id || (!p.category && dept.id === 'stands'))
              .reduce((acc, p) => acc + (p.variations?.filter(v => v.isOutOfStock).length || 0), 0);
            
            const Icon = dept.icon;

            return (
              <button
                key={dept.id}
                type="button"
                onClick={() => handleSelectDept(dept.id)}
                className="px-3 py-1.5 rounded-xl border border-gray-200 bg-gray-50/70 hover:bg-gray-100 text-right flex items-center gap-2 text-xs font-bold text-gray-700 whitespace-nowrap transition-colors cursor-pointer shrink-0"
              >
                <Icon className={`w-3.5 h-3.5 ${dept.color}`} />
                <span>{dept.title}</span>
                <span className="bg-white border border-gray-200 px-1.5 py-0.2 rounded-md text-[10px] text-gray-600">
                  {count}
                </span>
                {deptOutOfStock > 0 && (
                  <span className="bg-red-500 text-white px-1.5 py-0.2 rounded-md text-[10px]">
                    {deptOutOfStock} ناقص
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
