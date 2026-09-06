import React, { useState, useMemo } from 'react';
import { Product, PageCategory } from '../types';
import { PAGES_CONFIG } from './PageNavigation';
import { formatOutOfStockItemText, formatVariationPriceLabel } from '../utils';
import { 
  X, 
  Copy, 
  Check, 
  Send, 
  Printer, 
  FileText, 
  Layers,
  Filter,
  CheckCircle2,
  Tag,
  Store,
  AlertOctagon,
  ChevronLeft,
  Calendar,
  Building2,
  Sparkles
} from 'lucide-react';

interface SupplierOrderModalProps {
  products: Product[];
  isOpen: boolean;
  onClose: () => void;
}

interface OutOfStockVariationItem {
  id: string;
  name: string;
  group?: '5' | '10' | 'other';
  price?: number;
  priceLabel: string;
  fullName: string;
}

interface OutOfStockProductGroup {
  productId: string;
  productName: string;
  category: string;
  imageUrl?: string;
  variations: OutOfStockVariationItem[];
}

export const SupplierOrderModal: React.FC<SupplierOrderModalProps> = ({
  products,
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  const [copied, setCopied] = useState(false);
  const [supplierName, setSupplierName] = useState('');
  const [customNotes, setCustomNotes] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'cards' | 'text'>('cards');
  const [textStyle, setTextStyle] = useState<'grouped' | 'numbered'>('grouped');

  // Process and group out-of-stock items cleanly
  const outOfStockByDept = useMemo(() => {
    const grouped: Record<string, OutOfStockProductGroup[]> = {};

    products.forEach(p => {
      const outOfStockVars = p.variations?.filter(v => v.isOutOfStock) || [];
      if (outOfStockVars.length > 0) {
        const deptKey = p.category || 'stands';
        if (!grouped[deptKey]) {
          grouped[deptKey] = [];
        }

        grouped[deptKey].push({
          productId: p.id,
          productName: p.name,
          category: deptKey,
          imageUrl: p.imageUrl,
          variations: outOfStockVars.map(v => {
            const priceLabel = formatVariationPriceLabel(v);
            return {
              id: v.id,
              name: v.name,
              group: v.group,
              price: v.price,
              priceLabel,
              fullName: formatOutOfStockItemText(p.name, v)
            };
          })
        });
      }
    });

    return grouped;
  }, [products]);

  // Filtered by selected department if requested
  const filteredDepartments = useMemo(() => {
    if (selectedDeptFilter === 'all') {
      return outOfStockByDept;
    }
    if (outOfStockByDept[selectedDeptFilter]) {
      return { [selectedDeptFilter]: outOfStockByDept[selectedDeptFilter] };
    }
    return {};
  }, [outOfStockByDept, selectedDeptFilter]);

  // Count total out-of-stock variations
  const totalOutOfStockCount = useMemo(() => {
    return Object.values(filteredDepartments).reduce(
      (acc, list) => acc + list.reduce((subAcc, item) => subAcc + item.variations.length, 0),
      0
    );
  }, [filteredDepartments]);

  const allAvailableDeptKeys = useMemo(() => {
    return Object.keys(outOfStockByDept);
  }, [outOfStockByDept]);

  const currentDate = new Date().toLocaleDateString('ar-EG', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Generate clean, readable WhatsApp & Clipboard text with line-by-line items and clear separators
  const generateOrderText = () => {
    let text = `📦 *طلبـيـة نـواقـص وتـوريـد*\n`;
    text += `📅 *التاريخ:* ${currentDate}\n`;
    if (supplierName.trim()) {
      text += `🏢 *المورد / الشركة:* ${supplierName.trim()}\n`;
    }
    text += `═══════════════════════════════════\n\n`;

    if (textStyle === 'grouped') {
      // Grouped format: Each Department, then each Product with its flavors listed row-by-row with clean dividers
      Object.entries(filteredDepartments).forEach(([deptId, prodList]) => {
        const deptConfig = PAGES_CONFIG.find(p => p.id === deptId) || { title: deptId };
        text += `📁 *[ قسم: ${deptConfig.title} ]*\n`;
        text += `───────────────────────────────────\n`;

        prodList.forEach((prod, prodIdx) => {
          text += `🔹 *${prod.productName}:*\n`;
          prod.variations.forEach((v) => {
            const priceTag = v.priceLabel ? ` (${v.priceLabel})` : '';
            text += `   ❌ ${v.name}${priceTag}\n`;
          });

          // Distinct separator between different products of the same department
          if (prodIdx < prodList.length - 1) {
            text += `   - - - - - - - - - - - - - - - - - -\n`;
          }
        });

        text += `═══════════════════════════════════\n\n`;
      });
    } else {
      // Numbered sequential format: Item-by-item direct list
      let itemNumber = 1;
      Object.entries(filteredDepartments).forEach(([deptId, prodList]) => {
        const deptConfig = PAGES_CONFIG.find(p => p.id === deptId) || { title: deptId };
        text += `📁 *[ قسم: ${deptConfig.title} ]*\n`;
        text += `───────────────────────────────────\n`;

        prodList.forEach(prod => {
          prod.variations.forEach(v => {
            const priceTag = v.priceLabel ? ` [${v.priceLabel}]` : '';
            text += `${itemNumber}. ${v.fullName || `${prod.productName} - ${v.name}`}${priceTag} ❌\n`;
            itemNumber++;
          });
        });

        text += `═══════════════════════════════════\n\n`;
      });
    }

    if (customNotes.trim()) {
      text += `📝 *ملاحظات الطلبية:* ${customNotes.trim()}\n\n`;
    }

    text += `📊 *إجمالي الأصناف المطلوبة:* ${totalOutOfStockCount} صنف\n`;
    text += `✨ تم استخراج الطلبية عبر نظام إدارة السوبر ماركت.`;

    return text;
  };

  const handleCopy = () => {
    const text = generateOrderText();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent(generateOrderText());
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-700 via-indigo-700 to-indigo-800 text-white flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black tracking-tight">
                  كشف وطلبية التوريد للموزعين
                </h3>
                <span className="bg-white/20 text-white text-[11px] font-black px-2 py-0.5 rounded-full">
                  {totalOutOfStockCount} صنف ناقص
                </span>
              </div>
              <p className="text-xs text-blue-100 mt-0.5 font-medium">
                تنسيق النواقص صنف تحت صنف مع فواصل واضحة ومحددة لسهولة القراءة
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-xl transition-colors text-white cursor-pointer"
            title="إغلاق النافذة"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Controls Bar */}
        <div className="bg-gray-50/90 border-b border-gray-200/80 p-3 sm:p-4 space-y-3 shrink-0">
          {/* Supplier Name & Notes Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="relative">
              <label className="block text-[11px] font-bold text-gray-700 mb-1 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-blue-600" />
                <span>اسم المورد أو الشركة (اختياري):</span>
              </label>
              <input
                type="text"
                placeholder="مثال: شركة بيبسي / شيبسي / جهينة / مندوب الثلاجة..."
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
              />
            </div>

            <div className="relative">
              <label className="block text-[11px] font-bold text-gray-700 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                <span>ملاحظات الطلبية (اختياري):</span>
              </label>
              <input
                type="text"
                placeholder="مثال: تسليم غداً صباحاً / عاجل / مع الفاتورة..."
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
              />
            </div>
          </div>

          {/* Department Filter & View Switcher */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-gray-200/60">
            {/* Department Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
              <span className="text-[11px] font-bold text-gray-500 flex items-center gap-1 shrink-0">
                <Filter className="w-3 h-3 text-gray-400" />
                <span>القسم:</span>
              </span>

              <button
                type="button"
                onClick={() => setSelectedDeptFilter('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  selectedDeptFilter === 'all'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                جميع الأقسام ({Object.values(outOfStockByDept).reduce((a, l) => a + l.reduce((s, i) => s + i.variations.length, 0), 0)})
              </button>

              {allAvailableDeptKeys.map(deptKey => {
                const conf = PAGES_CONFIG.find(p => p.id === deptKey);
                const count = (outOfStockByDept[deptKey] || []).reduce((acc, i) => acc + i.variations.length, 0);
                const isSelected = selectedDeptFilter === deptKey;
                return (
                  <button
                    key={deptKey}
                    type="button"
                    onClick={() => setSelectedDeptFilter(deptKey)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    {conf ? conf.title.split(' ')[0] : deptKey} ({count})
                  </button>
                );
              })}
            </div>

            {/* View Mode Toggle (Cards View vs WhatsApp Text View) */}
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-gray-200 shadow-2xs shrink-0">
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'cards'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                بطاقات منظمة
              </button>
              <button
                type="button"
                onClick={() => setViewMode('text')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'text'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                نص الواتساب
              </button>
            </div>
          </div>
        </div>

        {/* Modal Body: Organized Content */}
        <div className="p-3 sm:p-5 overflow-y-auto flex-1 space-y-4 text-gray-800">
          
          {totalOutOfStockCount === 0 ? (
            <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2.5" />
              <h4 className="text-base font-extrabold text-gray-800">لا توجد نواقص في هذا القسم حالياً</h4>
              <p className="text-xs text-gray-400 mt-1">جميع الأصناف متوفرة وجاهزة للبيع في المتجر</p>
            </div>
          ) : viewMode === 'cards' ? (
            /* CARDS & STRUCTURED LIST VIEW (صنف تحت صنف مع فواصل واضحة) */
            <div className="space-y-4">
              {Object.entries(filteredDepartments).map(([deptKey, prodList]) => {
                const deptConfig = PAGES_CONFIG.find(p => p.id === deptKey) || {
                  title: deptKey,
                  color: 'text-blue-600',
                  bgColor: 'bg-blue-50',
                  borderColor: 'border-blue-200',
                  icon: Store
                };
                const DeptIcon = deptConfig.icon;
                const deptCount = prodList.reduce((acc, p) => acc + p.variations.length, 0);

                return (
                  <div 
                    key={deptKey}
                    className="bg-white rounded-2xl border-2 border-gray-200 overflow-hidden shadow-xs"
                  >
                    {/* Department Header Banner */}
                    <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 bg-white rounded-xl shadow-2xs border border-gray-200">
                          <DeptIcon className={`w-4 h-4 ${deptConfig.color || 'text-blue-600'}`} />
                        </div>
                        <h4 className="text-sm sm:text-base font-black text-gray-900">
                          قسم: {deptConfig.title}
                        </h4>
                      </div>
                      <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                        {deptCount} صنف ناقص
                      </span>
                    </div>

                    {/* Products & Variations List (صنف تحت صنف مع فواصل ممتازة) */}
                    <div className="divide-y divide-gray-200">
                      {prodList.map((prod, pIdx) => (
                        <div 
                          key={prod.productId || pIdx} 
                          className="p-3.5 sm:p-4 hover:bg-gray-50/50 transition-colors"
                        >
                          {/* Product Title Bar with Badge */}
                          <div className="flex items-center justify-between gap-2 mb-2.5">
                            <div className="flex items-center gap-2">
                              {prod.imageUrl ? (
                                <img 
                                  src={prod.imageUrl} 
                                  alt={prod.productName} 
                                  className="w-8 h-8 rounded-lg object-cover border border-gray-200 shrink-0" 
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700 font-black text-xs shrink-0">
                                  {pIdx + 1}
                                </div>
                              )}
                              <div>
                                <h5 className="text-sm font-black text-gray-900 leading-tight">
                                  {prod.productName}
                                </h5>
                                <span className="text-[10px] text-gray-400 font-bold">
                                  {prod.variations.length} {prod.variations.length === 1 ? 'نوع أو طعم ناقص' : 'أنواع أو أطعمة ناقصة'}
                                </span>
                              </div>
                            </div>

                            <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
                              صنف #{pIdx + 1}
                            </span>
                          </div>

                          {/* Variations Under this Product: Row by Row (صنف تحت صنف) */}
                          <div className="space-y-1.5 pr-2 sm:pr-4 border-r-2 border-indigo-200">
                            {prod.variations.map((v, vIdx) => (
                              <div
                                key={v.id || vIdx}
                                className="flex items-center justify-between gap-2 p-2 rounded-xl bg-rose-50/70 border border-rose-200/80 text-rose-950"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="w-2 h-2 rounded-full bg-rose-600 shrink-0 animate-pulse" />
                                  <span className="text-xs sm:text-sm font-bold truncate">
                                    {v.name}
                                  </span>
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0">
                                  {v.priceLabel && (
                                    <span className="text-[11px] font-black px-2 py-0.5 rounded-md bg-white border border-rose-300 text-rose-800 shadow-2xs">
                                      {v.priceLabel}
                                    </span>
                                  )}
                                  <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-rose-600 text-white">
                                    ناقص ❌
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* RAW TEXT / WHATSAPP PREVIEW VIEW */
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2 pb-1">
                <span className="text-xs font-bold text-gray-600">
                  نمط نص الرسالة:
                </span>
                <div className="flex items-center gap-1 text-xs">
                  <button
                    type="button"
                    onClick={() => setTextStyle('grouped')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      textStyle === 'grouped'
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    مبوب بالأقسام والفواصل (مستحسن)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTextStyle('numbered')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      textStyle === 'numbered'
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    قائمة رقمية متسلسلة (1، 2، 3)
                  </button>
                </div>
              </div>

              <div className="bg-gray-900 text-gray-100 rounded-2xl p-4 font-mono text-xs leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto border border-gray-800 shadow-inner selection:bg-blue-600 selection:text-white">
                {generateOrderText()}
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer Actions */}
        <div className="p-3.5 sm:p-5 bg-gray-50 border-t border-gray-200 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-600">
              إجمالي الأصناف:
            </span>
            <span className="px-2.5 py-1 rounded-xl bg-rose-100 text-rose-800 font-black text-xs sm:text-sm border border-rose-200">
              {totalOutOfStockCount} صنف مطلوب
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handlePrint}
              disabled={totalOutOfStockCount === 0}
              className="px-3.5 py-2.5 bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs disabled:opacity-50"
              title="طباعة الكشف على ورقة A4"
            >
              <Printer className="w-4 h-4 text-gray-600" />
              <span className="hidden sm:inline">طباعة الكشف</span>
            </button>

            <button
              type="button"
              onClick={handleCopy}
              disabled={totalOutOfStockCount === 0}
              className="px-4 py-2.5 bg-gray-900 hover:bg-gray-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'تم النسخ بنجاح!' : 'نسخ الكشف'}</span>
            </button>

            <button
              type="button"
              onClick={handleWhatsApp}
              disabled={totalOutOfStockCount === 0}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
            >
              <Send className="w-4 h-4" />
              <span>إرسال واتساب</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              إغلاق
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
