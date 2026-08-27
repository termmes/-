import React, { useState } from 'react';
import { Product, PageCategory } from '../types';
import { PAGES_CONFIG } from './PageNavigation';
import { 
  X, 
  Copy, 
  Check, 
  Send, 
  Printer, 
  Share2, 
  FileText, 
  Package, 
  AlertTriangle,
  Building2,
  Calendar
} from 'lucide-react';

interface SupplierOrderModalProps {
  products: Product[];
  isOpen: boolean;
  onClose: () => void;
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

  // Group out of stock items by department
  const outOfStockByDept: Record<string, { productName: string; varNames: string[] }[]> = {};

  products.forEach(p => {
    const outOfStockVars = p.variations?.filter(v => v.isOutOfStock) || [];
    if (outOfStockVars.length > 0) {
      const deptKey = p.category || 'stands';
      if (!outOfStockByDept[deptKey]) {
        outOfStockByDept[deptKey] = [];
      }
      outOfStockByDept[deptKey].push({
        productName: p.name,
        varNames: outOfStockVars.map(v => v.name + (v.group === '5' ? ' (5ج)' : v.group === '10' ? ' (10ج)' : ''))
      });
    }
  });

  const totalOutOfStockCount = Object.values(outOfStockByDept).reduce(
    (acc, list) => acc + list.reduce((subAcc, item) => subAcc + item.varNames.length, 0), 0
  );

  const currentDate = new Date().toLocaleDateString('ar-EG', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Generate WhatsApp / Clipboard text
  const generateOrderText = () => {
    let text = `📦 *طلبية نواقص وتوريد - مكتبة وسوبر ماركت الهدى*\n`;
    text += `📅 *التاريخ:* ${currentDate}\n`;
    if (supplierName.trim()) {
      text += `🏢 *المورد / الشركة:* ${supplierName.trim()}\n`;
    }
    text += `----------------------------------------\n\n`;

    Object.entries(outOfStockByDept).forEach(([deptId, items]) => {
      const deptConfig = PAGES_CONFIG.find(p => p.id === deptId) || { title: deptId };
      text += `📁 *[قسم: ${deptConfig.title}]*\n`;
      items.forEach((item, idx) => {
        text += `  ${idx + 1}. ${item.productName}: (${item.varNames.join('، ')})\n`;
      });
      text += `\n`;
    });

    if (customNotes.trim()) {
      text += `📝 *ملاحظات إضافية:* ${customNotes.trim()}\n\n`;
    }

    text += `----------------------------------------\n`;
    text += `📊 *إجمالي الأصناف المطلوبة:* ${totalOutOfStockCount} صنف\n`;
    text += `شكراً لكم، إدارة سوبر ماركت الهدى.`;

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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-700 to-indigo-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-2xl">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black">
                مسودة طلبيات التوريد وكشف النواقص
              </h3>
              <p className="text-xs text-blue-100 mt-0.5">
                تجهيز كشف مرتب ومبوب حسب الأقسام لإرساله للموردين أو طباعته
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-xl transition-colors text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-gray-800 text-xs sm:text-sm">
          
          {/* Inputs Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">اسم المورد / الشركة (اختياري):</label>
              <input
                type="text"
                placeholder="مثال: شركة بيبسي / شيبسي / جهينة..."
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium outline-none focus:bg-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">ملاحظات الطلبية (اختياري):</label>
              <input
                type="text"
                placeholder="مثال: التسليم غداً صباحاً / عاجل..."
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium outline-none focus:bg-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Formatted Preview Box */}
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 font-mono text-xs text-gray-800 whitespace-pre-wrap leading-relaxed max-h-72 overflow-y-auto">
            {totalOutOfStockCount > 0 ? (
              generateOrderText()
            ) : (
              <div className="text-center py-8 text-gray-500 font-sans">
                <Check className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="font-bold text-gray-700">لا توجد نواقص مسجلة حالياً</p>
                <p className="text-xs text-gray-400">جميع الأصناف متوفرة وجاهزة للبيع</p>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 sm:p-5 bg-gray-50 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2.5">
          <div className="text-xs font-bold text-gray-500">
            إجمالي النواقص: <strong className="text-rose-600 font-black">{totalOutOfStockCount}</strong> صنف
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleCopy}
              disabled={totalOutOfStockCount === 0}
              className="px-4 py-2.5 bg-gray-900 hover:bg-gray-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'تم النسخ!' : 'نسخ الرسالة'}</span>
            </button>

            <button
              type="button"
              onClick={handleWhatsApp}
              disabled={totalOutOfStockCount === 0}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Send className="w-4 h-4" />
              <span>إرسال عبر واتساب</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              إغلاق
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
