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
  Filter,
  Table,
  FileText,
  Send,
  TrendingUp,
  SlidersHorizontal,
  Scroll,
  ShoppingBag,
  Coffee,
  Store,
  ChevronDown
} from 'lucide-react';
import { auth, db, signInWithGoogle, signInAsGuest, logOut } from './firebase';
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
import { CommunityView } from './components/CommunityView';
import { ProfileView } from './components/ProfileView';
import { SupermarketStatsSummary } from './components/SupermarketStatsSummary';
import { QuickInventoryTable } from './components/QuickInventoryTable';
import { SupplierOrderModal } from './components/SupplierOrderModal';
import { AIImageGeneratorWidget } from './components/AIImageGeneratorWidget';
import { formatOutOfStockItemText } from './utils';

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
  
  // Navigation & View Mode State
  const [currentPage, setCurrentPage] = useState<PageCategory | 'all'>('refrigerator');
  const [activeTab, setActiveTab] = useState<'catalog' | 'community' | 'profile' | 'outOfStock' | 'quickTable'>('catalog');
  const [catalogViewMode, setCatalogViewMode] = useState<'grid' | 'table'>('grid');
  
  // Filters
  const [priceFilter, setPriceFilter] = useState<'all' | '5' | '10' | 'other'>('all');
  const [stockStatusFilter, setStockStatusFilter] = useState<'all' | 'in_stock' | 'out_of_stock'>('all');
  const [showStatsOverview, setShowStatsOverview] = useState(true);
  const [isSupplierOrderOpen, setIsSupplierOrderOpen] = useState(false);
  
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
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

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
    // Safety fallback timeout to prevent hanging on slow iframe auth initializations
    const timer = setTimeout(() => {
      setIsAuthReady(true);
    }, 1200);

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      clearTimeout(timer);
      setUser(currentUser);
      setIsAuthReady(true);
      
      // If not logged in, auto-attempt guest entry for immediate interactive preview
      if (!currentUser) {
        signInAsGuest().catch(() => {
          // It's okay if guest login is not enabled, user will see the login page
        });
      }
    });
    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
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
        const shouldBeAdmin = user.email === 'kblox05@gmail.com';
        if (!userSnap.exists()) {
          const newProfile = {
            uid: user.uid,
            displayName: user.displayName || 'Anonymous User',
            photoUrl: user.photoURL || 'https://www.gravatar.com/avatar/?d=mp',
            email: user.email || '',
            role: shouldBeAdmin ? 'admin' : 'user',
            updatedAt: serverTimestamp()
          };
          await setDoc(userRef, newProfile);
        } else if (shouldBeAdmin && userSnap.data()?.role !== 'admin') {
          await updateDoc(userRef, { role: 'admin', updatedAt: serverTimestamp() });
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
    stands: products.filter(p => p.category === 'stands' || (!p.category && p.category !== 'refrigerator' && p.category !== 'indomie' && p.category !== 'cleaners' && p.category !== 'paper_tissues' && p.category !== 'grocery' && p.category !== 'spices_nuts')).length,
    indomie: products.filter(p => p.category === 'indomie').length,
    paper_tissues: products.filter(p => p.category === 'paper_tissues').length,
    cleaners: products.filter(p => p.category === 'cleaners').length,
    grocery: products.filter(p => p.category === 'grocery').length,
    spices_nuts: products.filter(p => p.category === 'spices_nuts').length,
  };

  // Filter products by active page, search query, price group, and stock status
  const displayedProducts = products.filter(product => {
    // Search filter
    if (searchQuery.trim()) {
      const matchName = product.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchVar = product.variations.some(v => v.name.toLowerCase().includes(searchQuery.toLowerCase()) || (v.barcode && v.barcode.includes(searchQuery.trim())));
      if (!matchName && !matchVar) return false;
    }

    // Category filter
    if (currentPage !== 'all') {
      if (currentPage === 'stands') {
        const isStands = product.category === 'stands' || (!product.category && product.category !== 'refrigerator' && product.category !== 'indomie' && product.category !== 'cleaners' && product.category !== 'paper_tissues' && product.category !== 'grocery' && product.category !== 'spices_nuts');
        if (!isStands) return false;
      } else if (product.category !== currentPage) {
        return false;
      }
    }

    // Stock Status filter
    if (stockStatusFilter === 'in_stock') {
      const hasInStock = product.variations.length === 0 || product.variations.some(v => !v.isOutOfStock);
      if (!hasInStock) return false;
    } else if (stockStatusFilter === 'out_of_stock') {
      const hasOutOfStock = product.variations.some(v => v.isOutOfStock);
      if (!hasOutOfStock) return false;
    }

    // Price Group filter
    if (priceFilter !== 'all') {
      if (priceFilter === '5') {
        const matches5 = product.variations.some(v => v.price === 5 || v.name.includes('5') || v.name.includes('٥'));
        if (!matches5) return false;
      } else if (priceFilter === '10') {
        const matches10 = product.variations.some(v => v.price === 10 || v.name.includes('10') || v.name.includes('١٠'));
        if (!matches10) return false;
      } else if (priceFilter === 'other') {
        const matchesOther = product.variations.some(v => (v.price && v.price !== 5 && v.price !== 10) || (!v.price && !v.name.includes('5') && !v.name.includes('10')));
        if (!matchesOther) return false;
      }
    }

    return true;
  });

  // Out of stock calculations with price / group details
  const outOfStockItems = products.flatMap(p => 
    p.variations.filter(v => v.isOutOfStock).map(v => formatOutOfStockItemText(p.name, v))
  );

  const activePageOutOfStockItems = displayedProducts.flatMap(p =>
    p.variations.filter(v => v.isOutOfStock).map(v => formatOutOfStockItemText(p.name, v))
  );

  const handleCopy = () => {
    const textToCopy = outOfStockItems.map((item, i) => `${i + 1}. ${item}`).join('\n');
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
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white font-sans p-4" dir="rtl">
        <div className="w-16 h-16 rounded-3xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center mb-4 text-blue-400 animate-pulse shadow-lg">
          <Store className="w-8 h-8" />
        </div>
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-bold text-slate-200">جاري فتح سوبر ماركت الهدى...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    const handleGoogleLogin = async () => {
      setIsLoggingIn(true);
      setAuthError(null);
      try {
        await signInWithGoogle();
      } catch (err: any) {
        console.error("Google sign in failed:", err);
        setAuthError(err?.message || 'تعذر تسجيل الدخول عبر Google. يمكنك الدخول المباشر بالزر أدناه.');
      } finally {
        setIsLoggingIn(false);
      }
    };

    const handleGuestLogin = async () => {
      setIsLoggingIn(true);
      setAuthError(null);
      try {
        await signInAsGuest();
      } catch (err: any) {
        console.error("Guest sign in failed:", err);
        setAuthError('حدث خطأ أثناء الدخول المباشر. يرجى المحاولة مرة أخرى.');
      } finally {
        setIsLoggingIn(false);
      }
    };

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 via-gray-50 to-blue-50/40 font-sans p-4" dir="rtl">
        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-lg border border-gray-200 text-center max-w-md w-full space-y-6">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-2xl flex items-center justify-center mx-auto shadow-md">
            <Store className="w-8 h-8" />
          </div>
          
          <div>
            <div className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-800 text-xs font-black px-2.5 py-1 rounded-full mb-2 border border-blue-100">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
              <span>المركز الإداري للسوبر ماركت</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 mb-1">سوبر ماركت الهدى</h1>
            <p className="text-gray-500 text-xs sm:text-sm">
              إدارة الأقسام، جرد المخزون، متابعة النواقص، وطلبيات التوريد الفورية.
            </p>
          </div>

          {authError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs text-right font-medium">
              {authError}
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={handleGoogleLogin}
              disabled={isLoggingIn}
              className="w-full flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-3.5 rounded-2xl font-bold transition-all shadow-md active:scale-95 cursor-pointer text-sm"
            >
              <LogIn className="w-5 h-5" />
              <span>{isLoggingIn ? 'جاري التحقق...' : 'تسجيل الدخول بحساب Google (المشرف)'}</span>
            </button>

            <button
              onClick={handleGuestLogin}
              disabled={isLoggingIn}
              className="w-full flex items-center justify-center gap-3 bg-gray-900 hover:bg-gray-800 disabled:opacity-50 text-white px-6 py-3.5 rounded-2xl font-bold transition-all shadow-sm active:scale-95 cursor-pointer text-sm"
            >
              <Store className="w-5 h-5 text-emerald-400" />
              <span>الدخول المباشر إلى السوبر ماركت</span>
            </button>
          </div>

          <div className="pt-2 border-t border-gray-100">
            <p className="text-[11px] text-gray-400 leading-relaxed">
              يمكنك فتح ومتابعة السوبر ماركت وتحديث النواقص والأسعار فوراً من أي جهاز أو هاتف.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const activePageConfig = PAGES_CONFIG.find(p => p.id === currentPage) || PAGES_CONFIG[0];
  const ActivePageIcon = activePageConfig.icon;

  const isAdmin = profile?.role === 'admin' || user.email === 'kblox05@gmail.com';
  const isSupervisor = isAdmin || profile?.role === 'supervisor';

  return (
    <div className="min-h-screen bg-gray-50/70 text-gray-900 font-sans flex flex-col" dir="rtl">
      
      {/* Top Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-2xs">
        <div className="max-w-[2000px] mx-auto px-3 sm:px-6 lg:px-8 xl:px-12 h-16 sm:h-18 flex items-center justify-between gap-2 sm:gap-4">
          
          {/* Logo & Supermarket Administrative Title */}
          <div 
            onClick={() => {
              setCurrentPage('all');
              setActiveTab('catalog');
            }}
            className="flex items-center gap-2.5 sm:gap-3 shrink-0 cursor-pointer"
          >
            <div className="w-9 h-9 sm:w-11 sm:h-11 bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-xl sm:rounded-2xl flex items-center justify-center shadow-xs">
              <Store className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <h1 className="text-base sm:text-xl font-black text-gray-900 leading-tight">سوبر ماركت الهدى</h1>
                <span className="bg-blue-100 text-blue-800 text-[10px] sm:text-xs font-black px-2 py-0.2 rounded-md">المركز الإداري</span>
              </div>
              <span className="text-[10px] sm:text-xs text-gray-400 hidden sm:block">إدارة المخزون، الأقسام، النواقص وطلبيات التوريد</span>
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
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            {/* Quick Supplier Order Button */}
            <button
              id="header-supplier-order-btn"
              onClick={() => setIsSupplierOrderOpen(true)}
              className="flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl text-xs sm:text-sm font-bold transition-all border border-emerald-200 shrink-0 min-h-[38px] cursor-pointer shadow-2xs"
              title="كشف طلبيات التوريد للموزعين"
            >
              <Send className="w-4 h-4" />
              <span className="hidden lg:inline">طلبيات التوريد</span>
            </button>

            {/* Quick Table View Mode Button */}
            <button
              id="header-quick-table-btn"
              onClick={() => {
                setActiveTab('catalog');
                setCatalogViewMode(catalogViewMode === 'grid' ? 'table' : 'grid');
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl text-xs sm:text-sm font-bold transition-all border shrink-0 min-h-[38px] cursor-pointer ${
                catalogViewMode === 'table' && activeTab === 'catalog'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                  : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200'
              }`}
              title={catalogViewMode === 'table' ? 'التبديل إلى عرض البطاقات' : 'التبديل إلى جدول الجرد السريع'}
            >
              {catalogViewMode === 'table' ? <LayoutGrid className="w-4 h-4" /> : <Table className="w-4 h-4" />}
              <span className="hidden sm:inline">{catalogViewMode === 'table' ? 'عرض البطاقات' : 'جدول الجرد'}</span>
            </button>

            {deferredPrompt && (
              <button
                onClick={handleInstallClick}
                className="flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl text-xs sm:text-sm font-bold transition-all border border-blue-200 shrink-0 min-h-[38px] cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">تثبيت</span>
              </button>
            )}

            {/* Community / Registered Users Navigation Button next to profile */}
            <button 
              id="header-community-btn"
              onClick={() => setActiveTab('community')} 
              className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold transition-all min-h-[40px] cursor-pointer ${
                activeTab === 'community'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-gray-100 hover:bg-gray-200/80 text-gray-700 border border-gray-200/80'
              }`}
              title="دليل المستخدمين والمشرفين"
            >
              <Users className={`w-4 h-4 sm:w-4.5 sm:h-4.5 ${activeTab === 'community' ? 'text-white' : 'text-blue-600'}`} />
              <span className="hidden sm:inline">المستخدمين</span>
              {isSupervisor && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                  activeTab === 'community' ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-800'
                }`}>
                  {isAdmin ? '👑 مدير' : '🛡️ مشرف'}
                </span>
              )}
            </button>

            {/* Profile Button */}
            <button 
              id="header-profile-btn"
              onClick={() => setActiveTab('profile')} 
              className={`flex items-center gap-2 p-1.5 sm:p-2 rounded-xl transition-colors min-h-[40px] cursor-pointer ${
                activeTab === 'profile' ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-100'
              }`}
              title="الملف الشخصي"
            >
              <img 
                src={profile?.photoUrl || user.photoURL || 'https://www.gravatar.com/avatar/?d=mp'} 
                alt="Profile" 
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover border border-gray-200" 
              />
              <span className="hidden md:inline text-xs sm:text-sm font-bold text-gray-700 max-w-[120px] truncate">{profile?.displayName || user.displayName}</span>
            </button>

            <button
              id="header-logout-btn"
              onClick={logOut}
              className="text-xs sm:text-sm font-bold text-gray-500 hover:text-red-600 hover:bg-red-50 p-2 sm:p-2.5 rounded-xl transition-colors min-h-[40px] cursor-pointer"
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
      <main className="flex-1 max-w-[2000px] mx-auto w-full px-3 sm:px-6 lg:px-8 xl:px-12 py-4 sm:py-6 pb-28 md:pb-12 space-y-6">
        
        {/* VIEW 1: NEEDED & REQUIRED NOTEBOOK PAGE (المطلوب والنواقص وإعادة الطلب) */}
        {currentPage === 'needed' && activeTab === 'catalog' && (
          <NeededAndRequiredView 
            user={user} 
            products={products}
            onToggleStock={toggleOutOfStock}
          />
        )}

        {/* VIEW 2: PRODUCT CATALOG PAGES (المركز الإداري / الثلاجة / الستاندات / إندومي / المناديل / المنظفات / البقالة / العطارة) */}
        {currentPage !== 'needed' && (activeTab === 'catalog' || activeTab === 'outOfStock') && (
          <div className="space-y-6">
            
            {/* Top Supermarket KPIs & Executive Stats Overview Banner */}
            {showStatsOverview && (
              <SupermarketStatsSummary 
                products={products}
                remindersCount={remindersCount}
                onOpenSupplierOrders={() => setIsSupplierOrderOpen(true)}
                onSelectDepartment={(cat) => {
                  setCurrentPage(cat);
                  setActiveTab('catalog');
                }}
                onSelectCategory={(cat) => {
                  setCurrentPage(cat);
                  setActiveTab('catalog');
                }}
                onFilterOutOfStock={() => {
                  setStockStatusFilter('out_of_stock');
                  setActiveTab('catalog');
                }}
                onOpenNeeded={() => {
                  setCurrentPage('needed');
                  setActiveTab('catalog');
                }}
              />
            )}

            <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
              
              {/* Left Column: Product Sections & Add Form */}
              <div className={`flex-1 w-full space-y-6 ${activeTab === 'catalog' ? 'block' : 'hidden lg:block'}`}>
                
                {/* Active Page Header, Search & Filters */}
                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200/90 shadow-2xs space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 sm:p-3 rounded-xl ${activePageConfig.bgColor} ${activePageConfig.color} shrink-0`}>
                        <ActivePageIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-base sm:text-xl font-black text-gray-900">{activePageConfig.title}</h2>
                          <span className="text-xs bg-gray-100 text-gray-700 font-bold px-2.5 py-0.5 rounded-full">
                            {displayedProducts.length} منتج
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{activePageConfig.subtitle}</p>
                      </div>
                    </div>

                    {/* Quick Search */}
                    <div className="relative w-full sm:w-72">
                      <input
                        type="text"
                        placeholder="بحث في الأصناف والباركود..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-8 pr-9 py-2 text-xs sm:text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      />
                      <Search className="w-4 h-4 text-gray-400 absolute right-3 top-2.5" />
                      {searchQuery && (
                        <button 
                          onClick={() => setSearchQuery('')}
                          className="absolute left-2 top-2 text-gray-400 hover:text-gray-600 p-1"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Filter Toolbar */}
                  <div className="pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2.5 text-xs">
                    
                    {/* Status Filter */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        onClick={() => setStockStatusFilter('all')}
                        className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                          stockStatusFilter === 'all' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        الكل ({products.filter(p => currentPage === 'all' || p.category === currentPage).length})
                      </button>
                      <button
                        onClick={() => setStockStatusFilter('in_stock')}
                        className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                          stockStatusFilter === 'in_stock' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        }`}
                      >
                        المتوفر فقط
                      </button>
                      <button
                        onClick={() => setStockStatusFilter('out_of_stock')}
                        className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                          stockStatusFilter === 'out_of_stock' ? 'bg-red-600 text-white' : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                        }`}
                      >
                        الناقص فقط
                      </button>
                    </div>

                    {/* View Controls & Restock Button */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setIsSupplierOrderOpen(true)}
                        className="flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold px-3 py-1.5 rounded-lg border border-emerald-200 transition-colors cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>طلبية الموزع</span>
                      </button>

                      <div className="bg-gray-100 p-0.5 rounded-lg flex items-center gap-0.5 border border-gray-200">
                        <button
                          onClick={() => setCatalogViewMode('grid')}
                          className={`px-2.5 py-1 rounded-md font-bold transition-all flex items-center gap-1 cursor-pointer ${
                            catalogViewMode === 'grid' ? 'bg-white text-blue-600 shadow-2xs' : 'text-gray-500 hover:text-gray-900'
                          }`}
                          title="عرض البطاقات"
                        >
                          <LayoutGrid className="w-3.5 h-3.5" />
                          <span>بطاقات</span>
                        </button>
                        <button
                          onClick={() => setCatalogViewMode('table')}
                          className={`px-2.5 py-1 rounded-md font-bold transition-all flex items-center gap-1 cursor-pointer ${
                            catalogViewMode === 'table' ? 'bg-white text-blue-600 shadow-2xs' : 'text-gray-500 hover:text-gray-900'
                          }`}
                          title="عرض جدول الجرد"
                        >
                          <Table className="w-3.5 h-3.5" />
                          <span>جدول الجرد</span>
                        </button>
                      </div>
                    </div>

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
                          {isAddProductOpen ? 'اضغط لغلق نافذة الإضافة' : 'اضغط لفتح نموذج إضافة منتج وتصنيفه بالسوبرماركت'}
                        </p>
                      </div>
                    </div>
                    <span className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all ${
                      isAddProductOpen 
                        ? 'bg-red-50 text-red-600 border-red-200' 
                        : 'bg-blue-50 text-blue-700 border-blue-200'
                    }`}>
                      {isAddProductOpen ? 'إغلاق' : '+ إضافة صنف جديد'}
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
                            <label className="block text-[11px] font-bold text-gray-600 mb-1">اسم الصنف أو المنتج الرئيسي:</label>
                            <input
                              type="text"
                              placeholder="مثال: كشكول سلك، أقلام جاف، شيبسي، بيبسي، إندومي..."
                              value={newProductName}
                              onChange={(e) => setNewProductName(e.target.value)}
                              className="w-full px-3.5 py-2.5 sm:py-3 bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-xs sm:text-sm font-medium min-w-0"
                              required
                            />
                          </div>

                          {/* Category Selector */}
                          <div className="md:col-span-3">
                            <label className="block text-[11px] font-bold text-gray-600 mb-1">القسم أو الجناح:</label>
                            <select
                              value={newProductCategory}
                              onChange={(e) => setNewProductCategory(e.target.value)}
                              className="w-full px-3 py-2.5 sm:py-3 bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-xs sm:text-sm font-bold text-gray-700 cursor-pointer"
                            >
                              <option value="refrigerator">❄️ الثلاجات والمشروبات</option>
                              <option value="stands">🏷️ الستاندات والشبسي</option>
                              <option value="indomie">🍜 إندومي ومعكرونة</option>
                              <option value="paper_tissues">📚 المكتبة والدراسة</option>
                              <option value="cleaners">🧼 المنظفات والعناية</option>
                              <option value="grocery">🥫 البقالة والمعلبات</option>
                              <option value="spices_nuts">🥜 العطارة والتسالي</option>
                            </select>
                          </div>

                          {/* Image Upload Input */}
                          <div className="md:col-span-4 relative flex flex-col justify-end min-w-0">
                            <label className="block text-[11px] font-bold text-gray-600 mb-1">صورة المنتج (اختياري):</label>
                            {newProductImage.startsWith('data:') ? (
                              <div className="w-full flex items-center justify-between px-3 py-2.5 border border-indigo-300 bg-indigo-50/70 rounded-xl min-w-0">
                                <div className="flex items-center gap-2 truncate">
                                  <img 
                                    src={newProductImage} 
                                    alt="معاينة" 
                                    className="w-7 h-7 rounded-lg object-cover border border-indigo-200 shrink-0" 
                                    referrerPolicy="no-referrer"
                                  />
                                  <span className="text-xs text-indigo-800 font-bold truncate">تم اختيار الصورة ✓</span>
                                </div>
                                <button 
                                  type="button" 
                                  onClick={() => {
                                    setNewProductImage('');
                                    if (fileInputRef.current) fileInputRef.current.value = '';
                                  }} 
                                  className="text-indigo-500 hover:text-indigo-800 p-1 shrink-0 cursor-pointer"
                                  title="إزالة الصورة"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <div className="relative">
                                <input
                                  type="url"
                                  placeholder="رابط صورة أو ارفع ملف أو ولدها بالـ AI..."
                                  value={newProductImage}
                                  onChange={(e) => setNewProductImage(e.target.value)}
                                  className="w-full pl-10 pr-3 py-2.5 sm:py-3 bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-xs sm:text-sm min-w-0"
                                />
                                <button 
                                  type="button" 
                                  onClick={() => fileInputRef.current?.click()}
                                  className="absolute left-1.5 top-1.5 p-2 text-gray-500 hover:text-blue-600 cursor-pointer bg-white border border-gray-200 rounded-lg transition-colors shrink-0 shadow-2xs min-h-[34px] min-w-[34px] flex items-center justify-center" 
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
                              </div>
                            )}
                          </div>
                        </div>

                        {/* AI Image Generation Option with Prompt */}
                        <div className="pt-1">
                          <AIImageGeneratorWidget
                            productName={newProductName}
                            category={newProductCategory}
                            currentImage={newProductImage}
                            onImageGenerated={(generatedImgUrl) => {
                              setNewProductImage(generatedImgUrl);
                            }}
                          />
                        </div>

                        <button
                          type="submit"
                          className="w-full sm:w-auto self-end bg-blue-600 hover:bg-blue-700 text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-sm active:scale-95 min-h-[44px] cursor-pointer"
                        >
                          حفظ الصنف في السوبر ماركت
                        </button>
                      </form>
                    </div>
                  )}
                </section>

                {/* VIEW MODE A: Fast Table Inventory Management */}
                {catalogViewMode === 'table' ? (
                  <QuickInventoryTable 
                    products={displayedProducts}
                    currentUserId={user?.uid || ''}
                    isSupervisor={isSupervisor}
                    onToggleStock={toggleOutOfStock}
                    onAddVariation={handleAddVariation}
                    onDeleteVariation={handleDeleteVariation}
                    onDeleteProduct={handleDeleteProduct}
                    onUpdateProduct={handleUpdateProductDetails}
                  />
                ) : (
                  <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 min-[2000px]:grid-cols-5 min-[2500px]:grid-cols-6 gap-3 sm:gap-4 lg:gap-6">
                    {displayedProducts.map(product => (
                      <ProductCard 
                        key={product.id} 
                        product={product} 
                        isOwner={product.ownerId === user.uid}
                        isSupervisor={isSupervisor}
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
                        <h4 className="text-base sm:text-lg font-bold text-gray-700">لا توجد منتجات مطابقة في صفحة "{activePageConfig.title}"</h4>
                        <p className="text-xs sm:text-sm text-gray-400 mt-1 max-w-sm mx-auto">
                          أضف صنفك الأول من النموذج أعلاه أو غيّر الفلاتر والبحث في الأعلى.
                        </p>
                      </div>
                    )}
                  </section>
                )}
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
                          {/* Supplier Restock Modal Trigger */}
                          <button
                            type="button"
                            onClick={() => setIsSupplierOrderOpen(true)}
                            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-4 py-3 rounded-xl font-bold text-xs sm:text-sm transition-all active:scale-95 shadow-xs min-h-[44px] cursor-pointer"
                          >
                            <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                            تجهيز مسودة طلبية الموزعين
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setCurrentPage('needed');
                              setActiveTab('catalog');
                            }}
                            className="w-full flex items-center justify-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all border border-blue-200 min-h-[42px] cursor-pointer"
                          >
                            <ClipboardList className="w-4 h-4" />
                            دفتر المطلوب والنواقص
                          </button>

                          <button
                            onClick={handleCopy}
                            className="w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-4 py-3 rounded-xl font-bold text-xs sm:text-sm transition-all active:scale-95 shadow-xs min-h-[44px] cursor-pointer"
                          >
                            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                            {copied ? 'تم نسخ النواقص للحافظة!' : 'نسخ قائمة النواقص'}
                          </button>
                          
                          <button
                            onClick={handleClearOutOfStock}
                            disabled={isClearing}
                            className="w-full flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-700 disabled:opacity-50 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-colors border border-red-200 min-h-[42px] cursor-pointer"
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
                        <p className="text-sm sm:text-base font-bold text-gray-700">جميع الأصناف متوفرة بالسوبرماركت</p>
                        <p className="text-xs sm:text-sm text-gray-400 mt-1">عند تحويل أي صنف إلى "ناقص" سيظهر هنا فوراً.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 3: COMMUNITY & STAFF DIRECTORY */}
        {activeTab === 'community' && (
          <CommunityView 
            currentUserId={user.uid} 
            currentUserProfile={profile} 
            products={products} 
            isAdmin={isAdmin}
          />
        )}
        
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

      {/* Supplier Order Generator Modal */}
      <SupplierOrderModal 
        isOpen={isSupplierOrderOpen}
        onClose={() => setIsSupplierOrderOpen(false)}
        products={products}
      />

      {/* Mobile Bottom Nav (Phones & Small Devices with Safe-Area support) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-gray-200/90 flex items-center justify-around px-1 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom,0.5rem))] z-50 shadow-lg">
        <button 
          onClick={() => setActiveTab('catalog')} 
          className={`flex flex-col items-center justify-center p-1.5 min-w-[50px] min-h-[48px] rounded-xl transition-all cursor-pointer ${
            activeTab === 'catalog' && currentPage !== 'needed' ? 'text-blue-600 font-black' : 'text-gray-400 font-medium hover:text-gray-600'
          }`}
        >
          <Store className="w-5 h-5" />
          <span className="text-[10px] mt-0.5 font-bold">الأقسام</span>
        </button>

        <button 
          onClick={() => setActiveTab('outOfStock')} 
          className={`flex flex-col items-center justify-center p-1.5 min-w-[50px] min-h-[48px] rounded-xl transition-all cursor-pointer ${
            activeTab === 'outOfStock' ? 'text-red-600 font-black' : 'text-gray-400 font-medium hover:text-gray-600'
          } relative`}
        >
          <div className="relative">
            <AlertCircle className="w-5 h-5" />
            {outOfStockItems.length > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-red-600 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-xs animate-pulse">
                {outOfStockItems.length}
              </span>
            )}
          </div>
          <span className="text-[10px] mt-0.5 font-bold">النواقص</span>
        </button>

        {/* المطلوب والنواقص */}
        <button 
          onClick={() => {
            setCurrentPage('needed');
            setActiveTab('catalog');
          }} 
          className={`flex flex-col items-center justify-center p-1.5 min-w-[50px] min-h-[48px] rounded-xl transition-all cursor-pointer ${
            currentPage === 'needed' && activeTab === 'catalog' ? 'text-emerald-600 font-black' : 'text-gray-400 font-medium hover:text-gray-600'
          }`}
        >
          <div className="relative">
            <ClipboardList className="w-5 h-5" />
            {remindersCount > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-emerald-600 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                {remindersCount}
              </span>
            )}
          </div>
          <span className="text-[10px] mt-0.5 font-bold">المطلوب</span>
        </button>

        <button 
          onClick={() => setIsSupplierOrderOpen(true)} 
          className="flex flex-col items-center justify-center p-1.5 min-w-[50px] min-h-[48px] rounded-xl text-teal-600 font-bold hover:text-teal-700 transition-all cursor-pointer"
        >
          <Send className="w-5 h-5" />
          <span className="text-[10px] mt-0.5 font-bold">الطلبيات</span>
        </button>

        <button 
          onClick={() => setActiveTab('community')} 
          className={`flex flex-col items-center justify-center p-1.5 min-w-[50px] min-h-[48px] rounded-xl transition-all cursor-pointer ${
            activeTab === 'community' ? 'text-indigo-600 font-black' : 'text-gray-400 font-medium hover:text-gray-600'
          }`}
        >
          <Users className="w-5 h-5" />
          <span className="text-[10px] mt-0.5 font-bold">المشرفين</span>
        </button>

        <button 
          onClick={() => setActiveTab('profile')} 
          className={`flex flex-col items-center justify-center p-1.5 min-w-[50px] min-h-[48px] rounded-xl transition-all cursor-pointer ${
            activeTab === 'profile' ? 'text-blue-600 font-black' : 'text-gray-400 font-medium hover:text-gray-600'
          }`}
        >
          <Settings className="w-5 h-5" />
          <span className="text-[10px] mt-0.5 font-bold">حسابي</span>
        </button>
      </nav>
    </div>
  );
}
