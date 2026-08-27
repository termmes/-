import React, { useState } from 'react';
import { UserProfile, Product, ReminderItem, UserRole } from '../types';
import { ProfileHeaderDisplay } from './ProfileHeaderDisplay';
import { 
  X, 
  Package, 
  ClipboardList, 
  Edit3,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Crown,
  UserCheck,
  Check
} from 'lucide-react';

interface UserProfileModalProps {
  profileUser: UserProfile;
  currentUserId: string;
  isOwner: boolean;
  isAdmin?: boolean;
  userProducts: Product[];
  userReminders: ReminderItem[];
  isOpen: boolean;
  onClose: () => void;
  onOpenEditProfile: () => void;
  onUpdateRole?: (userId: string, newRole: UserRole) => Promise<void>;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  profileUser,
  currentUserId,
  isOwner,
  isAdmin = false,
  userProducts,
  userReminders,
  isOpen,
  onClose,
  onOpenEditProfile,
  onUpdateRole
}) => {
  const [activeTab, setActiveTab] = useState<'products' | 'reminders' | 'admin'>('products');
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);
  const [roleSuccessMsg, setRoleSuccessMsg] = useState('');

  if (!isOpen) return null;

  const currentRole: UserRole = profileUser.role || 'user';

  const handleRoleChange = async (newRole: UserRole) => {
    if (!onUpdateRole) return;
    setIsUpdatingRole(true);
    setRoleSuccessMsg('');
    try {
      await onUpdateRole(profileUser.uid, newRole);
      setRoleSuccessMsg('تم تحديث الصلاحية بنجاح!');
      setTimeout(() => setRoleSuccessMsg(''), 3000);
    } catch (error) {
      console.error('Error changing role:', error);
      alert('حدث خطأ أثناء تغيير الصلاحية');
    } finally {
      setIsUpdatingRole(false);
    }
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return {
          title: 'مشرف عام / مدير',
          color: 'bg-amber-500/20 text-amber-300 border-amber-400/40',
          icon: Crown
        };
      case 'supervisor':
        return {
          title: 'مشرف كامل الصلاحيات',
          color: 'bg-blue-500/20 text-blue-300 border-blue-400/40',
          icon: ShieldCheck
        };
      default:
        return {
          title: 'عضو مسجل',
          color: 'bg-gray-500/20 text-gray-300 border-gray-400/30',
          icon: UserCheck
        };
    }
  };

  const roleInfo = getRoleBadge(currentRole);
  const RoleIcon = roleInfo.icon;

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
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 pt-1">
                {/* Role Pill */}
                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black border backdrop-blur-md ${roleInfo.color}`}>
                  <RoleIcon className="w-3.5 h-3.5" />
                  <span>{roleInfo.title}</span>
                </div>

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

          {isAdmin && (
            <button
              type="button"
              onClick={() => setActiveTab('admin')}
              className={`flex-1 py-3 text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
                activeTab === 'admin' 
                  ? 'border-amber-600 text-amber-700 bg-amber-50/50' 
                  : 'border-transparent text-gray-500 hover:text-amber-700'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>إدارة الرتبة والصلاحيات</span>
            </button>
          )}
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

          {/* TAB 3: ADMIN ROLE MANAGEMENT */}
          {activeTab === 'admin' && isAdmin && (
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                <div className="flex items-center gap-2 text-amber-800 font-extrabold text-sm mb-1">
                  <ShieldCheck className="w-5 h-5 text-amber-600" />
                  <span>لوحة تحكم المشرفين ورتب الأعضاء</span>
                </div>
                <p className="text-xs text-amber-700 leading-relaxed">
                  بصفتك مديراً للنظام، يمكنك تعيين المشرفين وتحديد صلاحياتهم للتحكم في المنتجات، الأقسام، النواقص والطلبيات.
                </p>
              </div>

              {roleSuccessMsg && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold p-3 rounded-xl flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>{roleSuccessMsg}</span>
                </div>
              )}

              <div className="space-y-3">
                {/* Option 1: Supervisor (مشرف) */}
                <div 
                  onClick={() => !isUpdatingRole && handleRoleChange('supervisor')}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-start justify-between gap-3 ${
                    currentRole === 'supervisor' 
                      ? 'border-blue-600 bg-blue-50/70 shadow-xs' 
                      : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 bg-blue-100 text-blue-700 rounded-xl mt-0.5">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-black text-gray-900">مشرف (Supervisor)</h4>
                        {currentRole === 'supervisor' && (
                          <span className="text-[10px] bg-blue-600 text-white font-bold px-2 py-0.5 rounded-full">الرتبة الحالية</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        يقدر يعمل أي حاجة في الموقع: إضافة وتعديل وحذف أي منتج، تعديل الصور والأسماء، تصفير النواقص وإدارة الدفتر بالكامل.
                      </p>
                    </div>
                  </div>
                  <button 
                    disabled={isUpdatingRole}
                    className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                      currentRole === 'supervisor'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-gray-100 text-gray-700 hover:bg-blue-600 hover:text-white'
                    }`}
                  >
                    {currentRole === 'supervisor' ? 'محدد حالياً ✓' : 'تعيين كمشرف'}
                  </button>
                </div>

                {/* Option 2: Admin (مشرف عام / مدير) */}
                <div 
                  onClick={() => !isUpdatingRole && handleRoleChange('admin')}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-start justify-between gap-3 ${
                    currentRole === 'admin' 
                      ? 'border-amber-500 bg-amber-50/70 shadow-xs' 
                      : 'border-gray-200 hover:border-amber-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 bg-amber-100 text-amber-700 rounded-xl mt-0.5">
                      <Crown className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-black text-gray-900">مشرف عام / مدير النظام (Admin)</h4>
                        {currentRole === 'admin' && (
                          <span className="text-[10px] bg-amber-600 text-white font-bold px-2 py-0.5 rounded-full">الرتبة الحالية</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        أعلى صلاحية في الموقع: إدارة كاملة لكل المنتجات والأقسام، بالإضافة إلى تعيين وتعديل صلاحيات باقي المشرفين والأعضاء.
                      </p>
                    </div>
                  </div>
                  <button 
                    disabled={isUpdatingRole}
                    className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                      currentRole === 'admin'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-gray-100 text-gray-700 hover:bg-amber-600 hover:text-white'
                    }`}
                  >
                    {currentRole === 'admin' ? 'محدد حالياً ✓' : 'تعيين كمدير عام'}
                  </button>
                </div>

                {/* Option 3: Regular User (مستخدم عادي) */}
                <div 
                  onClick={() => !isUpdatingRole && handleRoleChange('user')}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-start justify-between gap-3 ${
                    currentRole === 'user' || currentRole === 'member'
                      ? 'border-emerald-600 bg-emerald-50/70 shadow-xs' 
                      : 'border-gray-200 hover:border-emerald-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl mt-0.5">
                      <UserCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-black text-gray-900">مستخدم عادي / عضو (Member)</h4>
                        {(currentRole === 'user' || currentRole === 'member') && (
                          <span className="text-[10px] bg-emerald-600 text-white font-bold px-2 py-0.5 rounded-full">الرتبة الحالية</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        مستخدم مسجل: يمكنه استعراض المنتجات وتحديد النواقص والملاحظات، دون صلاحيات حذف منتجات المشرفين.
                      </p>
                    </div>
                  </div>
                  <button 
                    disabled={isUpdatingRole}
                    className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                      currentRole === 'user' || currentRole === 'member'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-gray-100 text-gray-700 hover:bg-emerald-600 hover:text-white'
                    }`}
                  >
                    {(currentRole === 'user' || currentRole === 'member') ? 'محدد حالياً ✓' : 'تحويل لعضو'}
                  </button>
                </div>
              </div>
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

