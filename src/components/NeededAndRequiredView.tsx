import React, { useState, useEffect } from 'react';
import { Product, ReminderItem } from '../types';
import { db } from '../firebase';
import { 
  collection, 
  doc, 
  onSnapshot, 
  setDoc, 
  deleteDoc, 
  updateDoc, 
  serverTimestamp, 
  query, 
  orderBy 
} from 'firebase/firestore';
import { 
  ClipboardList, 
  Plus, 
  Check, 
  Copy, 
  Trash2, 
  CheckCircle2, 
  Circle, 
  Share2, 
  AlertCircle,
  Sparkles,
  BookOpen,
  ArrowRightLeft,
  Snowflake,
  LayoutGrid,
  UtensilsCrossed,
  Layers,
  ShoppingBag,
  RotateCcw,
  CheckCheck
} from 'lucide-react';
import { User } from 'firebase/auth';
import { formatOutOfStockItemText, formatVariationPriceLabel } from '../utils';

const CATEGORY_NAMES: Record<string, { label: string, color: string, icon: React.ComponentType<{ className?: string }> }> = {
  refrigerator: { label: 'الثلاجة', color: 'bg-cyan-50 text-cyan-700 border-cyan-200', icon: Snowflake },
  stands: { label: 'الستاندات', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: LayoutGrid },
  indomie: { label: 'إندومي', color: 'bg-red-50 text-red-700 border-red-200', icon: UtensilsCrossed },
  cleaners: { label: 'المناديل والمنظفات', color: 'bg-indigo-50 text-indigo-700 border-indigo-200', icon: Sparkles },
};

interface NeededAndRequiredViewProps {
  user: User;
  products: Product[];
  onToggleStock: (productId: string, variationId: string) => void;
}

export const NeededAndRequiredView: React.FC<NeededAndRequiredViewProps> = ({ 
  user, 
  products, 
  onToggleStock 
}) => {
  const [items, setItems] = useState<ReminderItem[]>([]);
  const [newItemText, setNewItemText] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [activeSubTab, setActiveSubTab] = useState<'all_reorder' | 'catalog_shortages' | 'notebook'>('all_reorder');
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addingAll, setAddingAll] = useState(false);

  // Fetch reminders from Firestore
  useEffect(() => {
    const q = query(collection(db, 'reminders'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loadedItems: ReminderItem[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        loadedItems.push({
          id: docSnap.id,
          text: data.text || '',
          completed: !!data.completed,
          createdBy: data.createdBy || '',
          authorName: data.authorName || '',
          createdAt: data.createdAt
        });
      });
      setItems(loadedItems);
    }, (error) => {
      console.error('Error fetching reminders:', error);
    });

    return () => unsubscribe();
  }, []);

  // Compute all current out-of-stock items across catalog
  const catalogShortages = products.flatMap(product => {
    const categoryInfo = product.category && CATEGORY_NAMES[product.category]
      ? CATEGORY_NAMES[product.category]
      : { label: 'عام', color: 'bg-gray-100 text-gray-700 border-gray-200', icon: Layers };

    return product.variations
      .filter(v => v.isOutOfStock)
      .map(variation => ({
        productId: product.id,
        productName: product.name,
        productImage: product.imageUrl,
        variationId: variation.id,
        variationName: variation.name,
        group: variation.group,
        price: variation.price,
        priceLabel: formatVariationPriceLabel(variation),
        category: product.category || 'stands',
        categoryInfo,
        fullName: formatOutOfStockItemText(product.name, variation)
      }));
  });

  const handleAddItem = async (text: string) => {
    if (!text.trim() || isSubmitting) return;

    setIsSubmitting(true);
    const newId = Date.now().toString() + Math.random().toString().slice(2, 6);
    try {
      await setDoc(doc(db, 'reminders', newId), {
        text: text.trim(),
        completed: false,
        createdBy: user.uid,
        authorName: user.displayName || 'مستخدم',
        createdAt: serverTimestamp()
      });
      setNewItemText('');
    } catch (error) {
      console.error('Error adding reminder item:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddShortageToReorder = async (shortageText: string) => {
    // Check if already in notebook list
    const existing = items.find(i => i.text.toLowerCase() === shortageText.toLowerCase() && !i.completed);
    if (existing) {
      alert(`الصنف "${shortageText}" موجود بالفعل في قائمة الطلبية!`);
      return;
    }
    await handleAddItem(shortageText);
  };

  const handleAddAllShortagesToReorder = async () => {
    if (catalogShortages.length === 0) {
      alert('لا توجد نواقص في الأقسام لإضافتها!');
      return;
    }

    setAddingAll(true);
    try {
      const promises = catalogShortages.map(async (shortage, index) => {
        const text = shortage.fullName;
        const exists = items.some(i => i.text.toLowerCase() === text.toLowerCase() && !i.completed);
        if (!exists) {
          const newId = (Date.now() + index).toString();
          return setDoc(doc(db, 'reminders', newId), {
            text,
            completed: false,
            createdBy: user.uid,
            authorName: user.displayName || 'مستخدم',
            createdAt: serverTimestamp()
          });
        }
        return null;
      });

      await Promise.all(promises);
      alert('تمت إضافة جميع نواقص الأقسام إلى دفتر الطلبيات بنجاح!');
    } catch (error) {
      console.error('Error transferring all shortages:', error);
    } finally {
      setAddingAll(false);
    }
  };

  const handleToggleCompleted = async (item: ReminderItem) => {
    try {
      await updateDoc(doc(db, 'reminders', item.id), {
        completed: !item.completed
      });
    } catch (error) {
      console.error('Error toggling reminder item:', error);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      await deleteDoc(doc(db, 'reminders', itemId));
    } catch (error) {
      console.error('Error deleting reminder item:', error);
    }
  };

  const handleClearCompleted = async () => {
    const completedItems = items.filter(i => i.completed);
    if (completedItems.length === 0) return;
    
    if (!window.confirm(`هل أنت متأكد من مسح ${completedItems.length} صنف تم شراؤه؟`)) return;

    try {
      const deletePromises = completedItems.map(item => deleteDoc(doc(db, 'reminders', item.id)));
      await Promise.all(deletePromises);
    } catch (error) {
      console.error('Error clearing completed reminders:', error);
    }
  };

  const handleCopyComprehensiveOrder = () => {
    const pendingNotebook = items.filter(i => !i.completed).map(i => i.text);
    
    // Combine unique list of shortages and notebook items
    const combinedSet = new Set<string>();
    catalogShortages.forEach(s => combinedSet.add(s.fullName));
    pendingNotebook.forEach(t => combinedSet.add(t));

    const allNeeded = Array.from(combinedSet);

    if (allNeeded.length === 0) {
      alert('لا توجد أصناف ناقصة أو مطلوبة حالياً لنسخها!');
      return;
    }

    const dateStr = new Date().toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const formattedText = `📋 *طلبية النواقص والمطلوب للشراء - مكتبة الهدى*\n📅 ${dateStr}\n-------------------------\n` +
      allNeeded.map((item, idx) => `${idx + 1}. ${item}`).join('\n') +
      `\n-------------------------\n📌 إجمالي الأصناف المطلوبة: ${allNeeded.length} صنف\n✅ يُرجى تأكيد توافر الكميات وسرعة التوريد.`;

    navigator.clipboard.writeText(formattedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const filteredItems = items.filter(item => {
    if (filter === 'pending') return !item.completed;
    if (filter === 'completed') return item.completed;
    return true;
  });

  const pendingCount = items.filter(i => !i.completed).length;
  const completedCount = items.filter(i => i.completed).length;

  return (
    <div className="space-y-6 max-w-[2000px] mx-auto w-full" id="needed-and-required-hub">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 text-white p-5 sm:p-8 rounded-3xl shadow-md border border-emerald-600/50">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="p-3.5 sm:p-4 bg-white/20 rounded-2xl backdrop-blur-xs shadow-inner shrink-0">
              <ClipboardList className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-black">المطلوب والنواقص وإعادة الطلب</h2>
                <span className="text-xs bg-white/20 text-white px-3 py-1 rounded-full font-bold">
                  مركز الطلبيات
                </span>
              </div>
              <p className="text-emerald-100 text-xs sm:text-sm lg:text-base mt-1.5 max-w-2xl leading-relaxed">
                صفحة مخصصة لجمع كل النواقص المحددة من الأقسام وتدوين الطلبات لإعادة شرائها وطلبها من الموزعين.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            <button
              type="button"
              onClick={handleCopyComprehensiveOrder}
              className="flex-1 md:flex-initial flex items-center justify-center gap-2 bg-white text-emerald-900 hover:bg-emerald-50 px-5 py-3.5 rounded-2xl font-black text-xs sm:text-sm lg:text-base shadow-md transition-all active:scale-95 whitespace-nowrap min-h-[44px]"
            >
              {copied ? <Check className="w-5 h-5 text-emerald-600" /> : <Share2 className="w-5 h-5" />}
              {copied ? 'تم نسخ الطلبية بالكامل!' : 'نسخ طلبية النواقص (واتساب)'}
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-6 pt-5 border-t border-white/20">
          <div className="bg-white/10 rounded-2xl p-3 sm:p-4 text-center backdrop-blur-2xs">
            <span className="text-emerald-100 text-xs sm:text-sm block mb-1 font-semibold">نواقص الأقسام</span>
            <span className="text-2xl sm:text-3xl lg:text-4xl font-black text-rose-200">{catalogShortages.length}</span>
          </div>
          <div className="bg-white/10 rounded-2xl p-3 sm:p-4 text-center backdrop-blur-2xs">
            <span className="text-emerald-100 text-xs sm:text-sm block mb-1 font-semibold">طلبات قيد الشراء</span>
            <span className="text-2xl sm:text-3xl lg:text-4xl font-black text-amber-200">{pendingCount}</span>
          </div>
          <div className="bg-white/10 rounded-2xl p-3 sm:p-4 text-center backdrop-blur-2xs">
            <span className="text-emerald-100 text-xs sm:text-sm block mb-1 font-semibold">تم شراؤها واستلامها</span>
            <span className="text-2xl sm:text-3xl lg:text-4xl font-black text-emerald-200">{completedCount}</span>
          </div>
          <div className="bg-white/10 rounded-2xl p-3 sm:p-4 text-center backdrop-blur-2xs">
            <span className="text-emerald-100 text-xs sm:text-sm block mb-1 font-semibold">إجمالي دفتر الطلبية</span>
            <span className="text-2xl sm:text-3xl lg:text-4xl font-black text-white">{items.length}</span>
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-2.5 rounded-2xl border border-gray-200/80 shadow-xs">
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveSubTab('all_reorder')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap min-h-[40px] ${
              activeSubTab === 'all_reorder'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>عرض شامل لإعادة الطلب</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('catalog_shortages')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap min-h-[40px] ${
              activeSubTab === 'catalog_shortages'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <AlertCircle className="w-4 h-4" />
            <span>نواقص الأقسام المسجلة</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-black ${
              activeSubTab === 'catalog_shortages' ? 'bg-white/20 text-white' : 'bg-rose-100 text-rose-700'
            }`}>
              {catalogShortages.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('notebook')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap min-h-[40px] ${
              activeSubTab === 'notebook'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>دفتر الملاحظات والطلبات</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-black ${
              activeSubTab === 'notebook' ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-700'
            }`}>
              {pendingCount}
            </span>
          </button>
        </div>

        {catalogShortages.length > 0 && (
          <button
            type="button"
            disabled={addingAll}
            onClick={handleAddAllShortagesToReorder}
            className="flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-colors w-full sm:w-auto justify-center min-h-[40px]"
          >
            <ArrowRightLeft className="w-4 h-4" />
            <span>نقل كل النواقص لدفتر الطلبيات</span>
          </button>
        )}
      </div>

      {/* SUB-VIEW 1: COMBINED / CATALOG SHORTAGES */}
      {(activeSubTab === 'all_reorder' || activeSubTab === 'catalog_shortages') && (
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-rose-500"></div>
              <h3 className="text-base sm:text-lg font-black text-gray-900">
                النواقص المحددة من الأقسام (الثلاجة، الستاندات، إندومي، المنظفات)
              </h3>
            </div>
            <span className="text-xs sm:text-sm text-gray-500 font-bold">
              {catalogShortages.length} صنف غير متوفر
            </span>
          </div>

          {catalogShortages.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-3.5 sm:gap-4">
              {catalogShortages.map((shortage) => {
                const CatIcon = shortage.categoryInfo.icon;
                const isInNotebook = items.some(i => i.text.toLowerCase() === shortage.fullName.toLowerCase() && !i.completed);

                return (
                  <div
                    key={`${shortage.productId}-${shortage.variationId}`}
                    className="bg-white p-3.5 sm:p-4 rounded-2xl border border-rose-100 hover:border-rose-300 shadow-2xs flex items-center justify-between gap-3 transition-all h-full"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={shortage.productImage}
                        alt={shortage.productName}
                        className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl object-cover border border-gray-200 shrink-0"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&q=80&w=150&h=150';
                        }}
                      />
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md border ${shortage.categoryInfo.color}`}>
                            <CatIcon className="w-3 h-3" />
                            {shortage.categoryInfo.label}
                          </span>
                          <span className="text-[10px] font-bold text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded-md">
                            {shortage.priceLabel || (shortage.group === '5' ? '5 جنيه' : shortage.group === '10' ? '10 جنيه' : 'أخرى')}
                          </span>
                        </div>
                        <h4 className="text-sm sm:text-base font-extrabold text-gray-900 truncate">
                          {shortage.productName}
                        </h4>
                        <span className="text-xs font-semibold text-rose-600 truncate">
                          الطعم: {shortage.variationName}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      {/* Add to notebook / reorder */}
                      <button
                        type="button"
                        onClick={() => handleAddShortageToReorder(shortage.fullName)}
                        className={`text-xs px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl font-bold transition-all flex items-center gap-1.5 shadow-2xs min-h-[36px] ${
                          isInNotebook
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        }`}
                        title="إضافة لدفتر المطلوب"
                      >
                        {isInNotebook ? <CheckCheck className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                        {isInNotebook ? 'بالدفتر' : 'أضف للطلبية'}
                      </button>

                      {/* Restock directly */}
                      <button
                        type="button"
                        onClick={() => onToggleStock(shortage.productId, shortage.variationId)}
                        className="text-xs px-2.5 py-1.5 bg-gray-100 hover:bg-emerald-100 hover:text-emerald-800 text-gray-700 rounded-xl font-bold transition-colors min-h-[32px]"
                        title="إرجاع كـ متوفر بالمحل"
                      >
                        توفر الصنف ✓
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white p-8 rounded-3xl border border-dashed border-gray-200 text-center">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-2">
                <Check className="w-6 h-6" />
              </div>
              <h4 className="text-sm sm:text-base font-bold text-gray-800">لا توجد نواقص محددة في الأقسام حالياً</h4>
              <p className="text-xs sm:text-sm text-gray-400 mt-1 max-w-md mx-auto">
                عند تحديد أي صنف كـ "ناقص" في صفحات الثلاجة، الستاندات، إندومي، أو المنظفات، سيظهر هنا مباشرة لإعادة طلبه.
              </p>
            </div>
          )}
        </section>
      )}

      {/* SUB-VIEW 2: NOTEBOOK & MANUAL REORDER FORM */}
      {(activeSubTab === 'all_reorder' || activeSubTab === 'notebook') && (
        <section className="space-y-4 pt-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <h3 className="text-base sm:text-lg font-black text-gray-900">
                دفتر طلبية النواقص والتذكير اليومي (Reorder Notebook)
              </h3>
            </div>
            <span className="text-xs sm:text-sm text-gray-500 font-bold">
              {pendingCount} صنف مطلوب للشراء
            </span>
          </div>

          {/* Quick Input Form */}
          <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-emerald-100">
            <form onSubmit={(e) => { e.preventDefault(); handleAddItem(newItemText); }} className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                id="new-reorder-input"
                placeholder="اكتب صنفاً مطلوباً أو كمية (مثال: 2 كرتونة إندومي فراخ، 30 قطعة بيبسي كانز)..."
                value={newItemText}
                onChange={(e) => setNewItemText(e.target.value)}
                className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-xs sm:text-sm font-medium text-gray-800 placeholder-gray-400 min-w-0 min-h-[44px]"
              />
              <button
                type="submit"
                disabled={isSubmitting || !newItemText.trim()}
                className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-6 sm:px-8 py-3 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-sm active:scale-95 shrink-0 min-h-[44px]"
              >
                <Plus className="w-4 h-4" />
                إضافة للدفتر
              </button>
            </form>
          </div>

          {/* Filter & Actions Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-1">
            <div className="flex items-center gap-1.5 bg-gray-100 p-1.5 rounded-xl w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setFilter('all')}
                className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all min-h-[36px] ${
                  filter === 'all' ? 'bg-white text-gray-900 shadow-2xs' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                الكل ({items.length})
              </button>
              <button
                type="button"
                onClick={() => setFilter('pending')}
                className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all min-h-[36px] ${
                  filter === 'pending' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                المطلوب فقط ({pendingCount})
              </button>
              <button
                type="button"
                onClick={() => setFilter('completed')}
                className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all min-h-[36px] ${
                  filter === 'completed' ? 'bg-white text-gray-700 shadow-2xs' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                تم استلامه ({completedCount})
              </button>
            </div>

            {completedCount > 0 && (
              <button
                type="button"
                onClick={handleClearCompleted}
                className="text-xs sm:text-sm text-red-600 hover:text-red-700 font-bold flex items-center gap-1.5 hover:bg-red-50 px-3.5 py-2 rounded-xl transition-colors self-end sm:self-auto min-h-[36px]"
              >
                <Trash2 className="w-4 h-4" />
                مسح المستلم ({completedCount})
              </button>
            )}
          </div>

          {/* Items List */}
          <div className="space-y-2.5">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                id={`reorder-item-${item.id}`}
                className={`group flex items-center justify-between p-3.5 sm:p-4 rounded-xl border transition-all ${
                  item.completed
                    ? 'bg-gray-50/80 border-gray-200 text-gray-400'
                    : 'bg-white border-emerald-100 hover:border-emerald-300 shadow-2xs text-gray-900'
                }`}
              >
                <div className="flex items-center gap-3.5 flex-1 min-w-0">
                  <button
                    type="button"
                    onClick={() => handleToggleCompleted(item)}
                    className={`p-1 rounded-lg transition-colors shrink-0 ${
                      item.completed 
                        ? 'text-emerald-600 hover:text-emerald-700' 
                        : 'text-gray-300 hover:text-emerald-600'
                    }`}
                    title={item.completed ? 'إلغاء التحديد' : 'تحديد كـ تم شراؤه واستلامه'}
                  >
                    {item.completed ? (
                      <CheckCircle2 className="w-6 h-6 fill-emerald-100 text-emerald-600" />
                    ) : (
                      <Circle className="w-6 h-6" />
                    )}
                  </button>
                  <div className="flex flex-col min-w-0">
                    <span className={`text-xs sm:text-sm lg:text-base font-bold break-words ${
                      item.completed ? 'line-through text-gray-400' : 'text-gray-800'
                    }`}>
                      {item.text}
                    </span>
                    {item.authorName && (
                      <span className="text-[10px] sm:text-xs text-gray-400 mt-0.5">
                        مسجل بواسطة: {item.authorName}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 pr-2">
                  <button
                    type="button"
                    onClick={() => handleDeleteItem(item.id)}
                    className="p-2 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all min-h-[36px] min-w-[36px] flex items-center justify-center"
                    title="حذف من الدفتر"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}

            {filteredItems.length === 0 && (
              <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-200 p-6">
                <BookOpen className="w-12 h-12 text-emerald-400 mx-auto mb-2 opacity-60" />
                <h4 className="text-sm sm:text-base font-bold text-gray-700">
                  {filter === 'completed' ? 'لا توجد طلبات مكتملة' : 'دفتر الطلبيات فارغ حالياً'}
                </h4>
                <p className="text-xs sm:text-sm text-gray-400 mt-1 max-w-sm mx-auto">
                  اكتب الصنف المطلوب بالأعلى أو اضغط على "أضف للطلبية" من قسم النواقص.
                </p>
              </div>
            )}
          </div>
        </section>
      )}

    </div>
  );
};
