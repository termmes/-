import React, { useState } from 'react';
import { UserProfile, Product, ReminderItem } from '../types';
import { ProfileHeaderDisplay } from './ProfileHeaderDisplay';
import { 
  X, 
  Package, 
  ClipboardList, 
  Edit3,
  ExternalLink
} from 'lucide-react';

interface UserProfileModalProps {
  profileUser: UserProfile;
  currentUserId: string;
  isOwner: boolean;
  userProducts: Product[];
  userReminders: ReminderItem[];
  isOpen: boolean;
  onClose: () => void;
  onOpenEditProfile: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  profileUser,
  isOwner,
  userProducts,
  userReminders,
  isOpen,
  onClose,
  onOpenEditProfile
}) => {
  const [activeTab, setActiveTab] = useState<'products' | 'reminders'>('products');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl border border-gray-100 flex flex-col max-h-[92vh]">
        
        {/* Profile Header Banner with Full Customization Renderer */}
        <div className="relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 left-4 z-20 p-2 bg-black/40 hover:bg-black/60 text-white rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <ProfileHeaderDisplay
            displayName={profileUser.displayName}
            photoUrl={profileUser.photoUrl}
            bio={profileUser.bio}
            customization={profileUser.customization}
            size="normal"
            extraAction={
              <div className="flex items-center justify-center sm:justify-start gap-3 pt-1">
                <div className="text-center bg-black/30 backdrop-blur-md px-3 py-1 rounded-xl border border-white/10">
                  <div className="text-sm font-black text-white">{userProducts.length}</div>
                  <div className="text-[10px] text-white/80">الأصناف المسجلة</div>
                </div>
                <div className="text-center bg-black/30 backdrop-blur-md px-3 py-1 rounded-xl border border-white/10">
                  <div className="text-sm font-black text-white">{userReminders.length}</div>
                  <div className="text-[10px] text-white/80">النواقص والملاحظات</div>
                </div>
              </div>
            }
          />
        </div>

        {/* Content Navigation Tabs */}
        <div className="flex border-b border-gray-200 bg-white">
          <button
            type="button"
            onClick={() => setActiveTab('products')}
            className={`flex-1 py-3 text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'products' 
                ? 'border-blue-600 text-blue-600 bg-blue-50/40' 
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>الأصناف المسجلة ({userProducts.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('reminders')}
            className={`flex-1 py-3 text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'reminders' 
                ? 'border-blue-600 text-blue-600 bg-blue-50/40' 
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            <span>النواقص والملاحظات ({userReminders.length})</span>
          </button>
        </div>

        {/* Tab Content Areas */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1">
          {/* TAB 1: PRODUCTS */}
          {activeTab === 'products' && (
            <div>
              {userProducts.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {userProducts.map((prod) => (
                    <div key={prod.id} className="bg-white rounded-2xl p-3 border border-gray-200 shadow-2xs space-y-2">
                      <div className="aspect-square rounded-xl bg-gray-100 overflow-hidden">
                        <img 
                          src={prod.imageUrl || 'https://placehold.co/150'} 
                          alt={prod.name} 
                          className="w-full h-full object-cover" 
                          loading="lazy"
                        />
                      </div>
                      <h4 className="text-xs font-bold text-gray-900 truncate">{prod.name}</h4>
                      <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md font-medium">
                        {prod.variations?.length || 0} أنواع/أحجام
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-gray-400">
                  <Package className="w-8 h-8 mx-auto text-gray-300 mb-1" />
                  <p className="text-xs font-bold text-gray-600">لم يقم العضو بإضافة أصناف بعد</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: REMINDERS / NOTES */}
          {activeTab === 'reminders' && (
            <div>
              {userReminders.length > 0 ? (
                <div className="space-y-2">
                  {userReminders.map((rem) => (
                    <div key={rem.id} className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between text-xs">
                      <span className="font-medium text-gray-800">{rem.text}</span>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${rem.completed ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {rem.completed ? 'تم التوفير ✓' : 'قيد الانتظار'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-gray-400">
                  <ClipboardList className="w-8 h-8 mx-auto text-gray-300 mb-1" />
                  <p className="text-xs font-bold text-gray-600">لا توجد ملاحظات أو نواقص مسجلة</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          {isOwner ? (
            <button
              type="button"
              onClick={() => { onClose(); onOpenEditProfile(); }}
              className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" /> تخصيص وتعديل المظهر والملف الشخصي
            </button>
          ) : (
            <span className="text-[11px] text-gray-400">ملف تعريف مستخدم مكتبه الهدى</span>
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            إغلاق
          </button>
        </div>

      </div>
    </div>
  );
};
