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
  ShieldCheck,
  Store
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
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200/90 shadow-2xs space-y-4">
      {/* Title & Quick Info */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-blue-50 text-blue-700 rounded-xl">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-gray-900">
              ملخص المخزون والأقسام
            </h2>
            <p className="text-xs text-gray-500">
              متابعة مباشرة لحالة البضائع والنواقص والطلبيات
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

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        
        {/* 1. Total Products & Varieties */}
        <div className="bg-slate-50/80 p-3.5 sm:p-4 rounded-xl border border-gray-200/80 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500">إجمالي الأصناف</span>
            <Package className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-gray-900">{products.length}</span>
            <span className="text-xs text-gray-500 font-medium">({totalVariations} صنف)</span>
          </div>
        </div>

        {/* 2. In Stock */}
        <div className="bg-emerald-50/50 p-3.5 sm:p-4 rounded-xl border border-emerald-100 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800">المتوفر للبيع</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-emerald-700">{inStockCount}</span>
            <span className="text-xs text-emerald-600 font-medium">صنف</span>
          </div>
        </div>

        {/* 3. Out of Stock */}
        <div 
          onClick={() => onFilterOutOfStock?.()}
          className={`p-3.5 sm:p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
            outOfStockCount > 0 
              ? 'bg-rose-50/70 border-rose-200 hover:border-rose-300' 
              : 'bg-gray-50 border-gray-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-800">النواقص الحالية</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-black text-rose-600">{outOfStockCount}</span>
              <span className="text-xs text-rose-500 font-medium">ناقص</span>
            </div>
            {outOfStockCount > 0 && (
              <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-md">
                عرض
              </span>
            )}
          </div>
        </div>

        {/* 4. Needed Notebook Items */}
        <div 
          onClick={() => onOpenNeeded?.()}
          className="bg-indigo-50/50 p-3.5 sm:p-4 rounded-xl border border-indigo-100 hover:border-indigo-200 transition-all cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-800">دفتر الطلبيات</span>
            <ClipboardList className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-black text-indigo-700">{remindersCount}</span>
              <span className="text-xs text-indigo-600 font-medium">ملاحظة</span>
            </div>
            <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-md">
              فتح
            </span>
          </div>
        </div>

      </div>

      {/* Department Breakdown Mini-Bar */}
      <div className="pt-1 flex items-center gap-2 overflow-x-auto no-scrollbar">
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
              className="px-3 py-1.5 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-right flex items-center gap-1.5 text-xs font-bold text-gray-700 whitespace-nowrap transition-colors cursor-pointer shrink-0"
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
  );
};
