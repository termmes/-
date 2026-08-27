import React, { useState, useRef, useEffect } from 'react';
import { PageCategory } from '../types';
import { 
  Snowflake, 
  LayoutGrid, 
  ClipboardList, 
  UtensilsCrossed, 
  Sparkles, 
  ChevronDown, 
  Layers,
  Package,
  Scroll,
  ShoppingBag,
  Coffee,
  Store
} from 'lucide-react';

export interface PageInfo {
  id: PageCategory | 'all';
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  borderColor: string;
}

export const PAGES_CONFIG: PageInfo[] = [
  {
    id: 'refrigerator',
    title: 'الثلاجات والمشروبات',
    subtitle: 'المشروبات، الألبان، الأجبان، والمثلجات',
    icon: Snowflake,
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-50 hover:bg-cyan-100',
    borderColor: 'border-cyan-200'
  },
  {
    id: 'stands',
    title: 'الستاندات والسناكس',
    subtitle: 'الشيبسي، المقرمشات، البسكويت، والحلويات',
    icon: LayoutGrid,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50 hover:bg-amber-100',
    borderColor: 'border-amber-200'
  },
  {
    id: 'indomie',
    title: 'إندومي ومعكرونة',
    subtitle: 'نودلز، إندومي بجميع أطعمتها، وجبات سريعة',
    icon: UtensilsCrossed,
    color: 'text-red-600',
    bgColor: 'bg-red-50 hover:bg-red-100',
    borderColor: 'border-red-200'
  },
  {
    id: 'paper_tissues',
    title: 'المناديل والورقيات',
    subtitle: 'مناديل سحب، جيب، مطبخ، وحفاضات',
    icon: Scroll,
    color: 'text-sky-600',
    bgColor: 'bg-sky-50 hover:bg-sky-100',
    borderColor: 'border-sky-200'
  },
  {
    id: 'cleaners',
    title: 'المنظفات والعناية',
    subtitle: 'مساحيق غسيل، مطهرات، صابون، وأدوات نظافة',
    icon: Sparkles,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50 hover:bg-indigo-100',
    borderColor: 'border-indigo-200'
  },
  {
    id: 'grocery',
    title: 'البقالة والمعلبات',
    subtitle: 'أرز، سكر، زيت، تونة، صلصة، وبقوليات',
    icon: ShoppingBag,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50 hover:bg-emerald-100',
    borderColor: 'border-emerald-200'
  },
  {
    id: 'spices_nuts',
    title: 'العطارة والتسالي',
    subtitle: 'توابل، بن وشاي، مكسرات ولب',
    icon: Coffee,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50 hover:bg-orange-100',
    borderColor: 'border-orange-200'
  },
  {
    id: 'needed',
    title: 'المطلوب والنواقص',
    subtitle: 'دفتر الملاحظات وطلبيات التوريد الفورية',
    icon: ClipboardList,
    color: 'text-rose-600',
    bgColor: 'bg-rose-50 hover:bg-rose-100',
    borderColor: 'border-rose-200'
  },
  {
    id: 'all',
    title: 'الكتالوج الشامل',
    subtitle: 'عرض وجرد كامل منتجات السوبر ماركت',
    icon: Package,
    color: 'text-gray-700',
    bgColor: 'bg-gray-50 hover:bg-gray-100',
    borderColor: 'border-gray-200'
  }
];

interface PageNavigationProps {
  currentPage: PageCategory | 'all';
  onSelectPage: (page: PageCategory | 'all') => void;
  productCounts: Record<string, number>;
  remindersCount: number;
}

export const PageNavigation: React.FC<PageNavigationProps> = ({
  currentPage,
  onSelectPage,
  productCounts,
  remindersCount
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activePage = PAGES_CONFIG.find(p => p.id === currentPage) || PAGES_CONFIG[0];
  const ActiveIcon = activePage.icon;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getBadgeCount = (pageId: string) => {
    if (pageId === 'needed') {
      return remindersCount;
    }
    return productCounts[pageId] || 0;
  };

  return (
    <div className="relative" ref={dropdownRef} id="page-navigation-system">
      {/* Top Main Page Switcher Button */}
      <button
        type="button"
        id="pages-menu-btn"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl shadow-sm hover:shadow-md hover:from-blue-700 hover:to-indigo-700 transition-all text-xs sm:text-sm font-semibold active:scale-95"
        title="قائمة الصفحات والأقسام"
      >
        <div className="p-1 bg-white/20 rounded-lg shrink-0">
          <Layers className="w-4 h-4 text-white" />
        </div>
        <div className="flex items-center gap-1.5 text-right">
          <span className="hidden sm:inline text-blue-100 text-xs">الصفحة:</span>
          <span className="font-bold whitespace-nowrap">{activePage.title}</span>
        </div>
        <ChevronDown className={`w-4 h-4 text-white/80 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu Modal */}
      {isOpen && (
        <div 
          id="pages-dropdown-menu"
          className="absolute left-0 sm:left-auto sm:right-0 mt-2 w-72 sm:w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
        >
          <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">صفحات وأقسام المتجر</span>
            <span className="text-[11px] bg-blue-50 text-blue-700 font-semibold px-2 py-0.5 rounded-full">
              {PAGES_CONFIG.length} صفحات
            </span>
          </div>

          <div className="p-2 space-y-1 max-h-[70vh] overflow-y-auto">
            {PAGES_CONFIG.map((page) => {
              const Icon = page.icon;
              const isSelected = currentPage === page.id;
              const count = getBadgeCount(page.id);

              return (
                <button
                  key={page.id}
                  id={`page-nav-item-${page.id}`}
                  type="button"
                  onClick={() => {
                    onSelectPage(page.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl text-right transition-all ${
                    isSelected 
                      ? 'bg-blue-50 border-2 border-blue-500 shadow-xs' 
                      : 'hover:bg-gray-50 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${page.bgColor} ${page.color} shrink-0`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col text-right">
                      <span className={`text-sm font-bold ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                        {page.title}
                      </span>
                      <span className="text-[11px] text-gray-500 truncate max-w-[150px] sm:max-w-[170px]">
                        {page.subtitle}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      page.id === 'needed'
                        ? count > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-500'
                        : isSelected ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {count}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
