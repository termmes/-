import React, { useState, useRef, useEffect } from 'react';
import { Product, Variation, UserProfile } from './types';
import { Plus, Copy, Check, Trash2, Library, AlertCircle, ImagePlus, X, LogOut, LogIn, Users, Settings, Save, ChevronDown, ChevronRight, ListX, Download } from 'lucide-react';
import { auth, db, signInWithGoogle, logOut } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, doc, onSnapshot, setDoc, deleteDoc, updateDoc, serverTimestamp, query, where, getDoc } from 'firebase/firestore';

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
  const [newProductName, setNewProductName] = useState('');
  const [newProductImage, setNewProductImage] = useState('');
  const [copied, setCopied] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<'catalog' | 'community' | 'profile' | 'outOfStock'>('catalog');
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

  useEffect(() => {
    if (!isAuthReady || !user) {
      setProducts([]);
      return;
    }

    const q = query(collection(db, 'products'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loadedProducts: Product[] = [];
      snapshot.forEach((doc) => {
        loadedProducts.push({ id: doc.id, ...doc.data() } as Product);
      });
      setProducts(loadedProducts);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'products');
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
    const newProduct: Omit<Product, 'id'> = {
      name: newProductName,
      imageUrl: newProductImage || 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&q=80&w=300&h=300',
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
      name: variationName,
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

  const outOfStockItems = products.flatMap(p => 
    p.variations.filter(v => v.isOutOfStock).map(v => `${p.name} - ${v.name}`)
  );

  const handleCopy = () => {
    const textToCopy = outOfStockItems.join('\n');
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClearOutOfStock = async () => {
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
    return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500">Loading...</div>;
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 font-sans">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 text-center max-w-md w-full mx-4">
          <Library className="w-12 h-12 text-blue-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">مكتبه الهدى</h1>
          <p className="text-gray-500 mb-8">Sign in to manage your supermarket catalog and track out-of-stock items.</p>
          <button
            onClick={signInWithGoogle}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-colors"
          >
            <LogIn className="w-5 h-5" />
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Library className="w-6 h-6 text-blue-600" />
              <h1 className="text-xl font-bold text-gray-900">مكتبه الهدى</h1>
            </div>
            <nav className="hidden md:flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
              <button 
                onClick={() => setActiveTab('catalog')} 
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${activeTab === 'catalog' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600 hover:text-gray-900'}`}
              >
                Catalog
              </button>
              <button 
                onClick={() => setActiveTab('community')} 
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${activeTab === 'community' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600 hover:text-gray-900'}`}
              >
                Community
              </button>
            </nav>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            {deferredPrompt && (
              <button
                onClick={handleInstallClick}
                className="flex items-center gap-1 sm:gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 px-2 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors border border-blue-200"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Install App</span>
                <span className="sm:hidden">Install</span>
              </button>
            )}
            <button onClick={() => setActiveTab('profile')} className="hidden md:flex items-center gap-2 hover:bg-gray-50 p-1.5 rounded-lg transition-colors">
              <img src={profile?.photoUrl || user.photoURL || 'https://www.gravatar.com/avatar/?d=mp'} alt="Profile" className="w-8 h-8 rounded-full object-cover border border-gray-200" />
              <span className="text-sm font-medium text-gray-700 hidden sm:block">{profile?.displayName || user.displayName}</span>
            </button>
            <div className="hidden md:block w-px h-6 bg-gray-200"></div>
            <button
              onClick={logOut}
              className="hidden md:flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-red-600 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex items-center justify-around pb-safe z-50">
        <button onClick={() => setActiveTab('catalog')} className={`flex flex-col items-center p-3 ${activeTab === 'catalog' ? 'text-blue-600' : 'text-gray-500'}`}>
          <Library className="w-6 h-6" />
          <span className="text-[10px] font-medium mt-1">Catalog</span>
        </button>
        <button onClick={() => setActiveTab('outOfStock')} className={`flex flex-col items-center p-3 ${activeTab === 'outOfStock' ? 'text-blue-600' : 'text-gray-500'} relative`}>
          <div className="relative">
            <AlertCircle className="w-6 h-6" />
            {outOfStockItems.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {outOfStockItems.length}
              </span>
            )}
          </div>
          <span className="text-[10px] font-medium mt-1">Shortages</span>
        </button>
        <button onClick={() => setActiveTab('community')} className={`flex flex-col items-center p-3 ${activeTab === 'community' ? 'text-blue-600' : 'text-gray-500'}`}>
          <Users className="w-6 h-6" />
          <span className="text-[10px] font-medium mt-1">Community</span>
        </button>
        <button onClick={() => setActiveTab('profile')} className={`flex flex-col items-center p-3 ${activeTab === 'profile' ? 'text-blue-600' : 'text-gray-500'}`}>
          <Settings className="w-6 h-6" />
          <span className="text-[10px] font-medium mt-1">Profile</span>
        </button>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-8">
        
        {(activeTab === 'catalog' || activeTab === 'outOfStock') && (
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left Column: Products */}
            <div className={`flex-1 space-y-8 ${activeTab === 'catalog' ? 'block' : 'hidden lg:block'}`}>
              {/* Add Product Form */}
              <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Plus className="w-5 h-5" /> Add New Product
                </h2>
                <form onSubmit={handleAddProduct} className="flex flex-col sm:flex-row gap-4">
                  <input
                    type="text"
                    placeholder="Product Name (e.g., Coca Cola)"
                    value={newProductName}
                    onChange={(e) => setNewProductName(e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    required
                  />
                  <div className="flex-1 relative flex items-center">
                    {newProductImage.startsWith('data:') ? (
                      <div className="flex-1 flex items-center justify-between px-4 py-2 border border-blue-300 bg-blue-50 rounded-lg">
                        <span className="text-sm text-blue-700 font-medium truncate">Image uploaded</span>
                        <button 
                          type="button" 
                          onClick={() => {
                            setNewProductImage('');
                            if (fileInputRef.current) fileInputRef.current.value = '';
                          }} 
                          className="text-blue-500 hover:text-blue-700 p-1"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <input
                          type="url"
                          placeholder="Image URL (optional)"
                          value={newProductImage}
                          onChange={(e) => setNewProductImage(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all pr-12"
                        />
                        <label className="absolute right-2 p-1.5 text-gray-400 hover:text-gray-600 cursor-pointer bg-white rounded-md transition-colors" title="Upload Image">
                          <ImagePlus className="w-5 h-5" />
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            ref={fileInputRef}
                            onChange={handleImageUpload} 
                          />
                        </label>
                      </>
                    )}
                  </div>
                  <button
                    type="submit"
                    className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors whitespace-nowrap"
                  >
                    Add Product
                  </button>
                </form>
              </section>

              {/* Product Grid */}
              <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {products.map(product => (
                  <ProductCard 
                    key={product.id} 
                    product={product} 
                    isOwner={product.ownerId === user.uid}
                    onAddVariation={handleAddVariation}
                    onToggleStock={toggleOutOfStock}
                    onDeleteProduct={handleDeleteProduct}
                    onDeleteVariation={handleDeleteVariation}
                    onUpdateImage={handleUpdateProductImage}
                  />
                ))}
                {products.length === 0 && (
                  <div className="col-span-full py-12 text-center text-gray-500 bg-white rounded-xl border border-dashed border-gray-300">
                    No products added yet. Add your first product above!
                  </div>
                )}
              </section>
            </div>

            {/* Right Column: Out of Stock List */}
            <div className={`w-full lg:w-96 shrink-0 ${activeTab === 'outOfStock' ? 'block' : 'hidden lg:block'}`}>
              <div className="bg-white rounded-xl shadow-sm border border-red-100 overflow-hidden sticky top-24">
                <div className="bg-red-50 p-4 border-b border-red-100 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-red-800 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" /> Out of Stock
                  </h2>
                  <span className="bg-red-100 text-red-800 text-xs font-bold px-2.5 py-1 rounded-full">
                    {outOfStockItems.length} items
                  </span>
                </div>
                
                <div className="p-4">
                  {outOfStockItems.length > 0 ? (
                    <>
                      <textarea
                        readOnly
                        value={outOfStockItems.join('\n')}
                        className="w-full h-64 p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 font-mono resize-none focus:outline-none mb-4"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleCopy}
                          className="flex-1 flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-4 py-2.5 rounded-lg font-medium transition-colors"
                        >
                          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          {copied ? 'Copied!' : 'Copy to Clipboard'}
                        </button>
                        <button
                          onClick={handleClearOutOfStock}
                          disabled={isClearing}
                          className="flex-1 flex items-center justify-center gap-2 bg-red-100 hover:bg-red-200 text-red-700 disabled:opacity-50 px-4 py-2.5 rounded-lg font-medium transition-colors"
                        >
                          <ListX className="w-4 h-4" />
                          {isClearing ? 'Clearing...' : 'Clear All'}
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8 text-gray-500 text-sm">
                      All items are currently in stock.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'community' && <CommunityView />}
        
        {activeTab === 'profile' && <ProfileView user={user} profile={profile} onInstallClick={handleInstallClick} canInstall={!!deferredPrompt} />}

      </main>
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
      <h2 className="text-2xl font-bold flex items-center gap-2 text-gray-900"><Users className="w-6 h-6 text-blue-600" /> Community Members</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {users.map(u => (
          <div key={u.uid} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center text-center gap-4 hover:shadow-md transition-shadow">
            <img 
              src={u.photoUrl || 'https://www.gravatar.com/avatar/?d=mp'} 
              alt={u.displayName} 
              className="w-24 h-24 rounded-full object-cover border-4 border-gray-50 shadow-sm" 
              onError={(e) => { (e.target as HTMLImageElement).src = 'https://www.gravatar.com/avatar/?d=mp'; }} 
            />
            <div>
              <h3 className="font-bold text-lg text-gray-900">{u.displayName}</h3>
            </div>
          </div>
        ))}
        {users.length === 0 && (
          <div className="col-span-full py-12 text-center text-gray-500 bg-white rounded-xl border border-dashed border-gray-300">
            No community members found.
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
      alert('Profile updated successfully!');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {canInstall && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-blue-900 font-bold text-lg">Download Android App</h3>
            <p className="text-blue-700 text-sm mt-1">Install مكتبه الهدى on your device for a better experience.</p>
          </div>
          <button
            onClick={onInstallClick}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors whitespace-nowrap"
          >
            <Download className="w-5 h-5" />
            Download App
          </button>
        </div>
      )}

      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-gray-900"><Settings className="w-6 h-6 text-blue-600" /> Edit Profile</h2>
        <form onSubmit={handleSave} className="space-y-6">
        <div className="flex flex-col items-center gap-4 mb-6">
          <img 
            src={photoUrl || 'https://www.gravatar.com/avatar/?d=mp'} 
            alt="Profile" 
            className="w-32 h-32 rounded-full object-cover border-4 border-gray-50 shadow-sm" 
            onError={(e) => { (e.target as HTMLImageElement).src = 'https://www.gravatar.com/avatar/?d=mp'; }}
          />
          <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
            <ImagePlus className="w-4 h-4" /> Change Picture
            <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageUpload} />
          </label>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
          <input 
            type="text" 
            value={displayName} 
            onChange={e => setDisplayName(e.target.value)} 
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
            required 
            maxLength={100}
          />
        </div>

        <button 
          type="submit" 
          disabled={isSaving} 
          className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Save className="w-5 h-5" /> {isSaving ? 'Saving...' : 'Save Profile'}
        </button>
      </form>
      </div>
    </div>
  );
}

function ProductCard({ 
  product, 
  onAddVariation, 
  onToggleStock,
  onDeleteProduct,
  onDeleteVariation,
  onUpdateImage,
  isOwner
}: { 
  product: Product; 
  onAddVariation: (productId: string, name: string, group: '5' | '10' | 'other') => void;
  onToggleStock: (productId: string, variationId: string) => void;
  onDeleteProduct: (productId: string) => void;
  onDeleteVariation: (productId: string, variationId: string) => void;
  onUpdateImage: (productId: string, newImageUrl: string) => void;
  isOwner: boolean;
}) {
  const [newVarNames, setNewVarNames] = useState<{ '5': string, '10': string, 'other': string }>({ '5': '', '10': '', 'other': '' });
  const [expandedGroups, setExpandedGroups] = useState<{ '5': boolean, '10': boolean, 'other': boolean }>({ '5': false, '10': false, 'other': false });
  const [isUpdatingImage, setIsUpdatingImage] = useState(false);

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

  const handleAdd = (e: React.FormEvent, group: '5' | '10' | 'other') => {
    e.preventDefault();
    onAddVariation(product.id, newVarNames[group], group);
    setNewVarNames(prev => ({ ...prev, [group]: '' }));
  };

  const renderGroup = (groupId: '5' | '10' | 'other', title: string) => {
    const groupVars = product.variations.filter(v => 
      v.group === groupId || (!v.group && groupId === 'other')
    );
    const isExpanded = expandedGroups[groupId];

    return (
      <div className="mb-4 last:mb-0 bg-gray-50/50 rounded-lg border border-gray-100 overflow-hidden">
        <button 
          onClick={() => setExpandedGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }))}
          className="w-full p-3 flex items-center justify-between hover:bg-gray-100/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />}
            <h4 className="text-sm font-bold text-gray-800 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              {title}
            </h4>
          </div>
          <span className="text-xs font-normal text-gray-500 bg-white px-2 py-0.5 rounded-full border border-gray-200">
            {groupVars.length}
          </span>
        </button>
        
        {isExpanded && (
          <div className="p-3 pt-0 border-t border-gray-100/50 mt-1">
            <div className="space-y-2 mb-3 mt-2">
              {groupVars.map(variation => (
                <div 
                  key={variation.id} 
                  className={`flex items-center justify-between p-2 rounded-md border ${
                    variation.isOutOfStock ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200 shadow-sm'
                  }`}
                >
                  <span className={`text-sm ${variation.isOutOfStock ? 'text-red-700 font-medium' : 'text-gray-700'}`}>
                    {variation.name}
                  </span>
                  <div className="flex items-center gap-2">
                    {isOwner && (
                      <>
                        <button
                          onClick={() => onToggleStock(product.id, variation.id)}
                          className={`text-xs px-3 py-2 sm:px-2 sm:py-1 rounded font-medium transition-colors ${
                            variation.isOutOfStock 
                              ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                              : 'bg-gray-100 border border-gray-200 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {variation.isOutOfStock ? 'Out of Stock' : 'In Stock'}
                        </button>
                        <button
                          onClick={() => onDeleteVariation(product.id, variation.id)}
                          className="text-gray-400 hover:text-red-500 transition-colors p-2 sm:p-1"
                        >
                          <Trash2 className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                        </button>
                      </>
                    )}
                    {!isOwner && variation.isOutOfStock && (
                      <span className="text-xs px-3 py-2 sm:px-2 sm:py-1 rounded font-medium bg-red-100 text-red-700">
                        Out of Stock
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {groupVars.length === 0 && (
                <p className="text-xs text-gray-400 italic text-center py-2 bg-white rounded-md border border-dashed border-gray-200">No items</p>
              )}
            </div>
            {isOwner && (
              <form onSubmit={(e) => handleAdd(e, groupId)} className="flex gap-2">
                <input
                  type="text"
                  placeholder={`Add to ${title}...`}
                  value={newVarNames[groupId]}
                  onChange={(e) => setNewVarNames(prev => ({ ...prev, [groupId]: e.target.value }))}
                  className="flex-1 px-3 py-2 sm:py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                />
                <button
                  type="submit"
                  disabled={!newVarNames[groupId].trim()}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white px-4 sm:px-3 py-2 sm:py-1.5 rounded-md text-sm font-medium transition-colors shadow-sm"
                >
                  Add
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col transition-shadow hover:shadow-md">
      <div className="relative h-48 bg-gray-100 group">
        <img 
          src={product.imageUrl} 
          alt={product.name} 
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&q=80&w=300&h=300';
          }}
        />
        {isUpdatingImage && (
          <div className="absolute inset-0 bg-white/60 flex items-center justify-center backdrop-blur-sm">
            <span className="text-sm font-medium text-gray-800 bg-white px-3 py-1 rounded-full shadow-sm">Updating...</span>
          </div>
        )}
        {isOwner && (
          <div className="absolute top-2 right-2 flex gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all">
            <label className="p-2 sm:p-1.5 bg-white/90 hover:bg-blue-100 text-gray-600 hover:text-blue-600 rounded-md cursor-pointer shadow-sm" title="Change Image">
              <ImagePlus className="w-5 h-5 sm:w-4 sm:h-4" />
              <input type="file" accept="image/*" className="hidden" onChange={handleImageEdit} disabled={isUpdatingImage} />
            </label>
            <button 
              onClick={() => onDeleteProduct(product.id)}
              className="p-2 sm:p-1.5 bg-white/90 hover:bg-red-100 text-gray-600 hover:text-red-600 rounded-md shadow-sm"
              title="Delete Product"
              disabled={isUpdatingImage}
            >
              <Trash2 className="w-5 h-5 sm:w-4 sm:h-4" />
            </button>
          </div>
        )}
      </div>
      
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="text-lg font-bold text-gray-900 mb-3">{product.name}</h3>
        
        <div className="flex-1 flex flex-col gap-2">
          {renderGroup('5', 'Price: 5')}
          {renderGroup('10', 'Price: 10')}
          {renderGroup('other', 'Other Prices')}
        </div>
      </div>
    </div>
  );
}
