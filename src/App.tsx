import React, { useState, useRef, useEffect } from 'react';
import { Product, Variation, UserProfile, PageCategory } from './types';
import { 
  Plus, 
  Copy, 
  Check, 
  Library, 
  AlertCircle, 
  ImagePlus, 
  X, 
  LogOut, 
  LogIn, 
  Users, 
  Settings, 
  Save, 
  ListX, 
  Download,
  Snowflake,
  LayoutGrid,
  ClipboardList,
  UtensilsCrossed,
  Sparkles,
  Package,
  Layers,
  Search,
  Filter
} from 'lucide-react';
import { auth, db, signInWithGoogle, logOut } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { 
  collection, 
  doc, 
  onSnapshot, 
  setDoc, 
  deleteDoc, 
  updateDoc, 
  serverTimestamp, 
  query, 
  getDoc 
} from 'firebase/firestore';
import { PageNavigation, PAGES_CONFIG } from './components/PageNavigation';
import { NeededAndRequiredView } from './components/NeededAndRequiredView';
import { ProductCard } from './components/ProductCard';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: any;
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
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

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [remindersCount, setRemindersCount] = useState<number>(0);
  
  // Navigation State
  const [currentPage, setCurrentPage] = useState<PageCategory | 'all'>('refrigerator');
  const [activeTab, setActiveTab] = useState<'catalog' | 'community' | 'profile' | 'outOfStock'>('catalog');
  
  // Product creation form state
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  const [newProductImage, setNewProductImage] = useState('');
  const [newProductCategory, setNewProductCategory] = useState<string>('refrigerator');
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  const [copied, setCopied] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  // Sync category when switching pages
  useEffect(() => {
    if (currentPage !== 'all' && currentPage !== 'needed') {
      setNewProductCategory(currentPage);
    }
  }, [currentPage]);

  useEffect(() => {
    if (!user) return;

    const initProfile = async () => {
      try {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
          const newProfile = {
            uid: user.uid,
            displayName: user.displayName || 'Anonymous User',
            photoUrl: user.photoURL || 'https://www.gravatar.com/avatar/?d=mp',
            updatedAt: serverTimestamp()
          };
          await setDoc(userRef, newProfile);
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, `users/${user.uid}`);
      }
    };
    initProfile();

    const unsubscribeProfile = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
      if (docSnap.exists()) {
        setProfile(docSnap.data() as UserProfile);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
    });

    return () => unsubscribeProfile();
  }, [user]);

  // Fetch products
  useEffect(() => {
    if (!isAuthReady || !user) {
      setProducts([]);
      return;
    }

    const q = query(collection(db, 'products'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loadedProducts: Product[] = [];
      snapshot.forEach((docSnap) => {
        loadedProducts.push({ id: docSnap.id, ...docSnap.data() } as Product);
      });
      setProducts(loadedProducts);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'products');
    });

    return () => unsubscribe();
  }, [user, isAuthReady]);

  // Fetch reminders count for badges
  useEffect(() => {
    if (!isAuthReady || !user) {
      setRemindersCount(0);
      return;
    }

    const q = query(collection(db, 'reminders'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let pending = 0;
      snapshot.forEach((docSnap) => {
        if (!docSnap.data().completed) {
          pending++;
        }
      });
      setRemindersCount(pending);
    }, (error) => {
      console.error('Error fetching reminders count:', error);
    });

    return () => unsubscribe();
  }, [user, isAuthReady]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressedBase64 = await compressImage(file, 800, 800, 0.7);
        setNewProductImage(compressedBase64);
      } catch (error) {
        console.error("Error compressing image:", error);
        alert("Failed to process image. Please try a smaller file.");
      }
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductName.trim() || !user) return;
    
    const newId = Date.now().toString();
    const assignedCategory = newProductCategory || (currentPage !== 'all' && currentPage !== 'needed' ? currentPage : 'refrigerator');

    const newProduct: Omit<Product, 'id'> = {
      name: newProductName.trim(),
      imageUrl: newProductImage || 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&q=80&w=300&h=300',
      category: assignedCategory,
      variations: [],
      ownerId: user.uid,
      createdAt: serverTimestamp()
    };
    
    try {
      await setDoc(doc(db, 'products', newId), newProduct);
      setNewProductName('');
      setNewProductImage('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `products/${newId}`);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا المنتج؟')) return;
    try {
      await deleteDoc(doc(db, 'products', productId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `products/${productId}`);
    }
  };

  const handleAddVariation = async (productId: string, variationName: string, group: '5' | '10' | 'other') => {
    if (!variationName.trim()) return;
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const newVariation: Variation = {
      id: Date.now().toString(),
      name: variationName.trim(),
      isOutOfStock: false,
      group
    };

    try {
      await updateDoc(doc(db, 'products', productId), {
        variations: [...product.variations, newVariation]
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `products/${productId}`);
    }
  };

  const handleDeleteVariation = async (productId: string, variationId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    try {
      await updateDoc(doc(db, 'products', productId), {
        variations: product.variations.filter(v => v.id !== variationId)
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `products/${productId}`);
    }
  };

  const handleUpdateProductImage = async (productId: string, newImageUrl: string) => {
    try {
      await updateDoc(doc(db, 'products', productId), {
        imageUrl: newImageUrl
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `products/${productId}`);
    }
  };

  const handleRenameProduct = async (productId: string, newName: string) => {
    if (!newName.trim()) return;
    try {
      await updateDoc(doc(db, 'products', productId), {
        name: newName.trim()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `products/${productId}`);
    }
  };

  const handleUpdateProductDetails = async (
    productId: string, 
    updates: { name: string; category: string; imageUrl: string; variations: Variation[] }
  ) => {
    try {
      await updateDoc(doc(db, 'products', productId), {
        name: updates.name.trim(),
        category: updates.category,
        imageUrl: updates.imageUrl,
        variations: updates.variations
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `products/${productId}`);
    }
  };

  const handleChangeProductCategory = async (productId: string, newCategory: string) => {
    try {
      await updateDoc(doc(db, 'products', productId), {
        category: newCategory
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `products/${productId}`);
    }
  };

  const toggleOutOfStock = async (productId: string, variationId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    try {
      await updateDoc(doc(db, 'products', productId), {
        variations: product.variations.map(v => 
          v.id === variationId ? { ...v, isOutOfStock: !v.isOutOfStock } : v
        )
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `products/${productId}`);
    }
  };

  // Product counts per category
  const productCounts: Record<string, number> = {
    all: products.length,
    refrigerator: products.filter(p => p.category === 'refrigerator').length,
    stands: products.filter(p => p.category === 'stands' || (!p.category && p.category !== 'refrigerator' && p.category !== 'indomie' && p.category !== 'cleaners')).length,
    indomie: products.filter(p => p.category === 'indomie').length,
    cleaners: products.filter(p => p.category === 'cleaners').length
  };

  // Filter products by active page & search query
  const displayedProducts = products.filter(product => {
    // Search filter
    if (searchQuery.trim()) {
      const matchName = product.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchVar = product.variations.some(v => v.name.toLowerCase().includes(searchQuery.toLowerCase()));
      if (!matchName && !matchVar) return false;
    }

    if (currentPage === 'all') return true;
    if (currentPage === 'refrigerator') return product.category === 'refrigerator';
    if (currentPage === 'indomie') return product.category === 'indomie';
    if (currentPage === 'cleaners') return product.category === 'cleaners';
    if (currentPage === 'stands') {
      return product.category === 'stands' || (!product.category);
    }
    return true;
  });

  // Out of stock calculations
  const outOfStockItems = products.flatMap(p => 
    p.variations.filter(v => v.isOutOfStock).map(v => `${p.name} - ${v.name}`)
  );

  const activePageOutOfStockItems = displayedProducts.flatMap(p =>
    p.variations.filter(v => v.isOutOfStock).map(v => `${p.name} - ${v.name}`)
  );

  const handleCopy = () => {
    const textToCopy = outOfStockItems.join('\n');
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClearOutOfStock = async () => {
    if (!window.confirm('هل تريد إرجاع جميع الأصناف الناقصة إلى "متوفر"؟')) return;
    setIsClearing(true);
    try {
      const updatePromises = products.map(product => {
        const hasOutOfStock = product.variations.some(v => v.isOutOfStock);
        if (!hasOutOfStock) return null;

        const updatedVariations = product.variations.map(v => ({
          ...v,
          isOutOfStock: false
        }));

        return updateDoc(doc(db, 'products', product.id), {
          variations: updatedVariations
        });
      }).filter(Boolean);

      await Promise.all(updatePromises);
    } catch (error) {
      console.error("Error clearing out of stock items:", error);
    } finally {
      setIsClearing(false);
    }
  };

  if (!isAuthReady) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500 font-sans">جاري التحميل...</div>;
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 font-sans p-4" dir="rtl">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-200 text-center max-w-md w-full">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Library className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-gray-900 mb-2">مكتبه الهدى</h1>
          <p className="text-gray-500 text-sm mb-8">سجل الدخول لإدارة أقسام المتجر، الأصناف، النواقص، ودفتر المطلوب.</p>
          <button
            onClick={signInWithGoogle}
            className="w-full flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3.5 rounded-2xl font-bold transition-all shadow-md active:scale-95"
          >
            <LogIn className="w-5 h-5" />
            تسجيل الدخول عبر Google
          </button>
        </div>
      </div>
    );
  }

  const activePageConfig = PAGES_CONFIG.find(p => p.id === currentPage) || PAGES_CONFIG[0];
  const ActivePageIcon = activePageConfig.icon;

  return (
    <div className="min-h-screen bg-gray-50/70 text-gray-900 font-sans flex flex-col" dir="rtl">
      
      {/* Top Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-2xs">
        <div className="max-w-[2000px] mx-auto px-3 sm:px-6 lg:px-8 xl:px-12 h-16 sm:h-18 flex items-center justify-between gap-2 sm:gap-4">
          
          {/* Logo & Main Title */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            <div className="w-9 h-9 sm:w-11 sm:h-11 bg-blue-600 text-white rounded-xl sm:rounded-2xl flex items-center justify-center shadow-xs">
              <Library className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-base sm:text-xl font-black text-gray-900 leading-tight">مكتبه الهدى</h1>
              <span className="text-[10px] sm:text-xs text-gray-400 hidden sm:block">إدارة الأقسام والنواقص والطلبيات</span>
            </div>
          </div>

          {/* Center/Prominent Page Switcher Menu (Click to open list on PC & Phone & TV) */}
          <div className="flex items-center gap-2">
            <PageNavigation 
              currentPage={currentPage} 
              onSelectPage={(page) => {
                setCurrentPage(page);
                setActiveTab('catalog');
              }}
              productCounts={productCounts}
              remindersCount={remindersCount}
            />
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-1.5 sm:gap-3">
            {deferredPrompt && (
              <button
                onClick={handleInstallClick}
                className="flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl text-xs sm:text-sm font-bold transition-all border border-blue-200 shrink-0 min-h-[38px]"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">تثبيت التطبيق</span>
              </button>
            )}

            <button 
              onClick={() => setActiveTab('profile')} 
              className="hidden md:flex items-center gap-2 hover:bg-gray-100 p-1.5 sm:p-2 rounded-xl transition-colors min-h-[40px]"
              title="الملف الشخصي"
            >
              <img 
                src={profile?.photoUrl || user.photoURL || 'https://www.gravatar.com/avatar/?d=mp'} 
                alt="Profile" 
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover border border-gray-200" 
              />
              <span className="text-xs sm:text-sm font-bold text-gray-700 max-w-[120px] truncate">{profile?.displayName || user.displayName}</span>
            </button>

            <button
              onClick={logOut}
              className="hidden md:flex items-center gap-1.5 text-xs sm:text-sm font-bold text-gray-500 hover:text-red-600 hover:bg-red-50 p-2 sm:p-2.5 rounded-xl transition-colors min-h-[40px]"
              title="تسجيل الخروج"
            >
              <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Horizontal Quick-Scroll Pages Bar (Available on Desktop, Phone & TV for 1-click access) */}
        <div className="bg-gray-50/90 border-t border-gray-100 px-3 sm:px-6 lg:px-8 xl:px-12 py-2 overflow-x-auto no-scrollbar flex items-center gap-2">
          {PAGES_CONFIG.map((page) => {
            const Icon = page.icon;
            const isSelected = currentPage === page.id && activeTab === 'catalog';
            const count = page.id === 'needed' ? remindersCount : (productCounts[page.id] || 0);

            return (
              <button
                key={page.id}
                id={`quick-page-${page.id}`}
                onClick={() => {
                  setCurrentPage(page.id);
                  setActiveTab('catalog');
                }}
                className={`flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all shrink-0 min-h-[38px] ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-xs scale-102 ring-2 ring-blue-400/30'
                    : 'bg-white text-gray-700 border border-gray-200/90 hover:bg-gray-100'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isSelected ? 'text-white' : page.color}`} />
                <span>{page.title}</span>
                <span className={`text-[10px] sm:text-xs px-1.5 py-0.2 rounded-full font-extrabold ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Container - Fully Fluid & Ultra-Wide TV Ready */}
      <main className="flex-1 max-w-[2000px] mx-auto w-full px-3 sm:px-6 lg:px-8 xl:px-12 py-4 sm:py-6 pb-28 md:pb-12">
        
        {/* VIEW 1: NEEDED & REQUIRED NOTEBOOK PAGE (المطلوب والنواقص وإعادة الطلب) */}
        {currentPage === 'needed' && activeTab === 'catalog' && (
          <NeededAndRequiredView 
            user={user} 
            products={products}
            onToggleStock={toggleOutOfStock}
          />
        )}

        {/* VIEW 2: PRODUCT CATALOG PAGES (الثلاجة / الستاندات / إندومي / المنظفات / الكل) */}
        {currentPage !== 'needed' && (activeTab === 'catalog' || activeTab === 'outOfStock') && (
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
            
            {/* Left Column: Product Sections & Add Form */}
            <div className={`flex-1 w-full space-y-6 ${activeTab === 'catalog' ? 'block' : 'hidden lg:block'}`}>
              
              {/* Active Page Header Banner & Search */}
              <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className={`p-3 sm:p-3.5 rounded-2xl ${activePageConfig.bgColor} ${activePageConfig.color} shrink-0`}>
                    <ActivePageIcon className="w-6 h-6 sm:w-8 sm:h-8" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg sm:text-2xl font-black text-gray-900">{activePageConfig.title}</h2>
                      <span className="text-xs sm:text-sm bg-gray-100 text-gray-700 font-bold px-2.5 py-0.5 rounded-full">
                        {displayedProducts.length} منتج
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-500 mt-0.5">{activePageConfig.subtitle}</p>
                  </div>
                </div>

                {/* Quick Search */}
                <div className="relative w-full sm:w-72 lg:w-80">
                  <input
                    type="text"
                    placeholder="بحث في المنتجات والأطعمة..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-10 py-2.5 text-xs sm:text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  />
                  <Search className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 absolute right-3 top-3" />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="absolute left-2.5 top-2.5 text-gray-400 hover:text-gray-600 p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Add Product Collapsible Section */}
              <section className="bg-white rounded-2xl shadow-sm border border-blue-100 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setIsAddProductOpen(!isAddProductOpen)}
                  className="w-full p-4 sm:p-5 flex items-center justify-between hover:bg-blue-50/50 transition-colors text-right"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                      <Plus className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-200 ${isAddProductOpen ? 'rotate-45 text-red-500' : ''}`} />
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-gray-900 flex items-center gap-2">
                        <span>إضافة منتج جديد لقسم: <strong className="text-blue-600">{activePageConfig.title}</strong></span>
                      </h3>
                      <p className="text-[11px] sm:text-xs text-gray-400 mt-0.5">
                        {isAddProductOpen ? 'اضغط لغلق نافذة الإضافة' : 'اضغط لفتح نموذج إضافة منتج جديد'}
                      </p>
                    </div>
                  </div>
                  <span className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all ${
                    isAddProductOpen 
                      ? 'bg-red-50 text-red-600 border-red-200' 
                      : 'bg-blue-50 text-blue-700 border-blue-200'
                  }`}>
                    {isAddProductOpen ? 'إغلاق' : '+ إضافة منتج'}
                  </span>
                </button>
                
                {isAddProductOpen && (
                  <div className="p-4 sm:p-6 pt-0 border-t border-blue-50">
                    <form onSubmit={async (e) => {
                      await handleAddProduct(e);
                    }} className="flex flex-col gap-3 mt-4">
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                        
                        {/* Product Name Input */}
                        <div className="md:col-span-5">
                          <input
                            type="text"
                            placeholder="اسم المنتج (مثال: بيبسي، شيبسي فلفل، إندومي فراخ)..."
                            value={newProductName}
                            onChange={(e) => setNewProductName(e.target.value)}
                            className="w-full px-3.5 py-2.5 sm:py-3 bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-xs sm:text-sm font-medium min-w-0"
                            required
                          />
                        </div>

                        {/* Category Selector */}
                        <div className="md:col-span-3">
                          <select
                            value={newProductCategory}
                            onChange={(e) => setNewProductCategory(e.target.value)}
                            className="w-full px-3 py-2.5 sm:py-3 bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-xs sm:text-sm font-bold text-gray-700 cursor-pointer"
                          >
                            <option value="refrigerator">❄️ الثلاجة</option>
                            <option value="stands">🏷️ الستاندات</option>
                            <option value="indomie">🍜 إندومي</option>
                            <option value="cleaners">🧼 المناديل والمنظفات</option>
                          </select>
                        </div>

                        {/* Image Upload Input */}
                        <div className="md:col-span-4 relative flex items-center min-w-0">
                          {newProductImage.startsWith('data:') ? (
                            <div className="w-full flex items-center justify-between px-3 py-2.5 border border-blue-300 bg-blue-50 rounded-xl min-w-0">
                              <span className="text-xs text-blue-700 font-bold truncate">تم اختيار الصورة ✓</span>
                              <button 
                                type="button" 
                                onClick={() => {
                                  setNewProductImage('');
                                  if (fileInputRef.current) fileInputRef.current.value = '';
                                }} 
                                className="text-blue-500 hover:text-blue-700 p-1 shrink-0"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <>
                              <input
                                type="url"
                                placeholder="رابط صورة (اختياري)"
                                value={newProductImage}
                                onChange={(e) => setNewProductImage(e.target.value)}
                                className="w-full pl-10 pr-3 py-2.5 sm:py-3 bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-xs sm:text-sm min-w-0"
                              />
                              <button 
                                type="button" 
                                onClick={() => fileInputRef.current?.click()}
                                className="absolute left-1.5 p-2 text-gray-500 hover:text-blue-600 cursor-pointer bg-white border border-gray-200 rounded-lg transition-colors shrink-0 shadow-2xs min-h-[34px] min-w-[34px] flex items-center justify-center" 
                                title="رفع صورة من الجهاز"
                              >
                                <ImagePlus className="w-4 h-4" />
                              </button>
                              <input 
                                type="file" 
                                accept="image/*" 
                                className="hidden" 
                                ref={fileInputRef}
                                onChange={handleImageUpload} 
                              />
                            </>
                          )}
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full sm:w-auto self-end bg-blue-600 hover:bg-blue-700 text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-sm active:scale-95 min-h-[44px]"
                      >
                        حفظ وإضافة المنتج
                      </button>
                    </form>
                  </div>
                )}
              </section>

              {/* Product Grid - Responsive on Mobile, Tablets, Desktops and 4K TVs */}
              <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-6">
                {displayedProducts.map(product => (
                  <ProductCard 
                    key={product.id} 
                    product={product} 
                    isOwner={product.ownerId === user.uid}
                    onAddVariation={handleAddVariation}
                    onToggleStock={toggleOutOfStock}
                    onDeleteProduct={handleDeleteProduct}
                    onDeleteVariation={handleDeleteVariation}
                    onUpdateImage={handleUpdateProductImage}
                    onChangeCategory={handleChangeProductCategory}
                    onUpdateProduct={handleUpdateProductDetails}
                    onRenameProduct={handleRenameProduct}
                  />
                ))}
                
                {displayedProducts.length === 0 && (
                  <div className="col-span-full py-16 text-center text-gray-500 bg-white rounded-2xl border border-dashed border-gray-300 p-6">
                    <ActivePageIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <h4 className="text-base sm:text-lg font-bold text-gray-700">لا توجد منتجات في صفحة "{activePageConfig.title}"</h4>
                    <p className="text-xs sm:text-sm text-gray-400 mt-1 max-w-sm mx-auto">
                      أضف منتجك الأول من النموذج أعلاه أو اختر قسماً آخر من القائمة في الأعلى.
                    </p>
                  </div>
                )}
              </section>
            </div>

            {/* Right Column: Out of Stock List / Shortages */}
            <div className={`w-full lg:w-80 xl:w-96 2xl:w-[420px] shrink-0 ${activeTab === 'outOfStock' ? 'block' : 'hidden lg:block'}`}>
              <div className="bg-white rounded-2xl shadow-sm border border-red-100 overflow-hidden sticky top-24">
                <div className="bg-gradient-to-r from-red-600 to-rose-600 p-4 sm:p-5 text-white flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                    <h3 className="text-sm sm:text-base lg:text-lg font-extrabold">قائمة النواقص (Out of Stock)</h3>
                  </div>
                  <span className="bg-white/20 text-white text-xs sm:text-sm font-black px-2.5 py-0.5 rounded-full">
                    {outOfStockItems.length} صنف
                  </span>
                </div>
                
                <div className="p-4 sm:p-5 space-y-4">
                  {outOfStockItems.length > 0 ? (
                    <>
                      <textarea
                        readOnly
                        value={outOfStockItems.map((item, i) => `${i + 1}. ${item}`).join('\n')}
                        className="w-full h-64 sm:h-80 p-3.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-800 font-medium leading-relaxed resize-none focus:outline-none"
                      />
                      
                      <div className="flex flex-col gap-2.5">
                        <button
                          type="button"
                          onClick={() => {
                            setCurrentPage('needed');
                            setActiveTab('catalog');
                          }}
                          className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-3 rounded-xl font-bold text-xs sm:text-sm transition-all active:scale-95 shadow-xs min-h-[44px]"
                        >
                          <ClipboardList className="w-4 h-4 sm:w-5 sm:h-5" />
                          فتح صفحة النواقص وإعادة الطلب
                        </button>

                        <button
                          onClick={handleCopy}
                          className="w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-4 py-3 rounded-xl font-bold text-xs sm:text-sm transition-all active:scale-95 shadow-xs min-h-[44px]"
                        >
                          {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                          {copied ? 'تم نسخ النواقص للحافظة!' : 'نسخ قائمة النواقص'}
                        </button>
                        
                        <button
                          onClick={handleClearOutOfStock}
                          disabled={isClearing}
                          className="w-full flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-700 disabled:opacity-50 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-colors border border-red-200 min-h-[42px]"
                        >
                          <ListX className="w-4 h-4" />
                          {isClearing ? 'جاري التصفير...' : 'تصفير كل النواقص (متوفر للجميع)'}
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2.5">
                        <Check className="w-6 h-6 sm:w-7 sm:h-7" />
                      </div>
                      <p className="text-sm sm:text-base font-bold text-gray-700">جميع الأصناف متوفرة بالمحل</p>
                      <p className="text-xs sm:text-sm text-gray-400 mt-1">عند تحويل أي صنف إلى "ناقص" سيظهر هنا فوراً.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 3: COMMUNITY */}
        {activeTab === 'community' && <CommunityView />}
        
        {/* VIEW 4: PROFILE */}
        {activeTab === 'profile' && (
          <ProfileView 
            user={user} 
            profile={profile} 
            onInstallClick={handleInstallClick} 
            canInstall={!!deferredPrompt} 
          />
        )}

      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200 flex items-center justify-around pb-[env(safe-area-inset-bottom,0.5rem)] z-50 shadow-lg">
        <button 
          onClick={() => setActiveTab('catalog')} 
          className={`flex flex-col items-center p-2.5 ${activeTab === 'catalog' && currentPage !== 'needed' ? 'text-blue-600 font-bold' : 'text-gray-400 font-medium'}`}
        >
          <Library className="w-5 h-5" />
          <span className="text-[10px] mt-1">الأقسام</span>
        </button>

        <button 
          onClick={() => setActiveTab('outOfStock')} 
          className={`flex flex-col items-center p-2.5 ${activeTab === 'outOfStock' ? 'text-red-600 font-bold' : 'text-gray-400 font-medium'} relative`}
        >
          <div className="relative">
            <AlertCircle className="w-5 h-5" />
            {outOfStockItems.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {outOfStockItems.length}
              </span>
            )}
          </div>
          <span className="text-[10px] mt-1">النواقص</span>
        </button>

        <button 
          onClick={() => setActiveTab('community')} 
          className={`flex flex-col items-center p-2.5 ${activeTab === 'community' ? 'text-blue-600 font-bold' : 'text-gray-400 font-medium'}`}
        >
          <Users className="w-5 h-5" />
          <span className="text-[10px] mt-1">المستخدمين</span>
        </button>

        {/* المطلوب والنواقص - القائمة التي قبل الأخيرة */}
        <button 
          onClick={() => {
            setCurrentPage('needed');
            setActiveTab('catalog');
          }} 
          className={`flex flex-col items-center p-2.5 relative ${currentPage === 'needed' && activeTab === 'catalog' ? 'text-emerald-600 font-bold' : 'text-gray-400 font-medium'}`}
        >
          <div className="relative">
            <ClipboardList className="w-5 h-5" />
            {remindersCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-emerald-600 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {remindersCount}
              </span>
            )}
          </div>
          <span className="text-[10px] mt-1">المطلوب</span>
        </button>

        <button 
          onClick={() => setActiveTab('profile')} 
          className={`flex flex-col items-center p-2.5 ${activeTab === 'profile' ? 'text-blue-600 font-bold' : 'text-gray-400 font-medium'}`}
        >
          <Settings className="w-5 h-5" />
          <span className="text-[10px] mt-1">حسابي</span>
        </button>
      </nav>
    </div>
  );
}

function CommunityView() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
      setUsers(snapshot.docs.map(d => d.data() as UserProfile));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'users');
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2 text-gray-900">
          <Users className="w-6 h-6 text-blue-600" /> أعضاء ومستخدمي النظام
        </h2>
        <span className="text-xs bg-blue-50 text-blue-700 px-3 py-1 rounded-full font-bold">
          {users.length} مستخدم
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
        {users.map(u => (
          <div key={u.uid} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center gap-3 hover:shadow-md transition-shadow">
            <img 
              src={u.photoUrl || 'https://www.gravatar.com/avatar/?d=mp'} 
              alt={u.displayName} 
              className="w-20 h-20 rounded-full object-cover border-3 border-blue-50 shadow-xs" 
              onError={(e) => { (e.target as HTMLImageElement).src = 'https://www.gravatar.com/avatar/?d=mp'; }} 
            />
            <div>
              <h3 className="font-bold text-base text-gray-900">{u.displayName}</h3>
              <span className="text-[11px] text-gray-400">عضو نشط</span>
            </div>
          </div>
        ))}
        {users.length === 0 && (
          <div className="col-span-full py-12 text-center text-gray-500 bg-white rounded-2xl border border-dashed border-gray-300">
            لا يوجد أعضاء حالياً.
          </div>
        )}
      </div>
    </div>
  );
}

function ProfileView({ user, profile, onInstallClick, canInstall }: { user: User, profile: UserProfile | null, onInstallClick: () => void, canInstall: boolean }) {
  const [displayName, setDisplayName] = useState(profile?.displayName || user.displayName || '');
  const [photoUrl, setPhotoUrl] = useState(profile?.photoUrl || user.photoURL || '');
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName);
      setPhotoUrl(profile.photoUrl);
    }
  }, [profile]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressedBase64 = await compressImage(file, 400, 400, 0.7);
        setPhotoUrl(compressedBase64);
      } catch (error) {
        console.error("Error compressing image:", error);
        alert("Failed to process image. Please try a smaller file.");
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        displayName,
        photoUrl,
        updatedAt: serverTimestamp()
      });
      alert('تم تحديث الملف الشخصي بنجاح!');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {canInstall && (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
          <div>
            <h3 className="font-extrabold text-base sm:text-lg">تثبيت تطبيق مكتبه الهدى</h3>
            <p className="text-blue-100 text-xs mt-0.5">ثبّت التطبيق على هاتفك للوصول السريع والعمل حتى بدون إنترنت.</p>
          </div>
          <button
            onClick={onInstallClick}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white text-blue-700 hover:bg-blue-50 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap shadow-sm active:scale-95"
          >
            <Download className="w-4 h-4" />
            تثبيت التطبيق
          </button>
        </div>
      )}

      <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-200/80">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-gray-900">
          <Settings className="w-5 h-5 text-blue-600" /> تعديل الملف الشخصي
        </h2>
        <form onSubmit={handleSave} className="space-y-6">
          <div className="flex flex-col items-center gap-4 mb-6">
            <img 
              src={photoUrl || 'https://www.gravatar.com/avatar/?d=mp'} 
              alt="Profile" 
              className="w-28 h-28 rounded-full object-cover border-4 border-gray-100 shadow-sm" 
              onError={(e) => { (e.target as HTMLImageElement).src = 'https://www.gravatar.com/avatar/?d=mp'; }}
            />
            <button 
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-2"
            >
              <ImagePlus className="w-4 h-4" /> تغيير الصورة الشخصية
            </button>
            <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageUpload} />
          </div>
          
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">الاسم المعروض</label>
            <input 
              type="text" 
              value={displayName} 
              onChange={e => setDisplayName(e.target.value)} 
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium" 
              required 
              maxLength={100}
            />
          </div>

          <button 
            type="submit" 
            disabled={isSaving} 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm active:scale-95"
          >
            <Save className="w-4 h-4" /> {isSaving ? 'جاري الحفظ...' : 'حفظ التعديلات'}
          </button>
        </form>
      </div>
    </div>
  );
}
