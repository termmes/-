import React, { useState, useEffect } from 'react';
import { UserProfile, Product, ReminderItem, UserRole } from '../types';
import { db } from '../firebase';
import { collection, onSnapshot, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { UserProfileModal } from './UserProfileModal';
import { 
  AVATAR_FRAMES, 
  AVATAR_SHAPES, 
  AVATAR_ROTATE_ANIMATIONS, 
  AVATAR_FILTERS 
} from '../profileThemes';
import { 
  Users, 
  Search, 
  CheckCircle2, 
  Package, 
  ClipboardList, 
  ExternalLink,
  Sparkles,
  Shield,
  ShieldCheck,
  Crown,
  UserCheck,
  X,
  UserPlus,
  SlidersHorizontal,
  ChevronDown
} from 'lucide-react';

interface CommunityViewProps {
  currentUserId: string;
  currentUserProfile: UserProfile | null;
  products: Product[];
  isAdmin?: boolean;
}

export const CommunityView: React.FC<CommunityViewProps> = ({
  currentUserId,
  currentUserProfile,
  products,
  isAdmin = false
}) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [reminders, setReminders] = useState<ReminderItem[]>([]);
  const [selectedProfileUser, setSelectedProfileUser] = useState<UserProfile | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'supervisors' | 'members'>('all');
  const [activeRoleMenuUserId, setActiveRoleMenuUserId] = useState<string | null>(null);

  // Fetch Users
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
      setUsers(snapshot.docs.map(d => ({ uid: d.id, ...d.data() } as UserProfile)));
    }, (error) => {
      console.error('Error fetching users:', error);
    });
    return () => unsubscribe();
  }, []);

  // Fetch Reminders
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'reminders'), (snapshot) => {
      setReminders(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ReminderItem)));
    }, (error) => {
      console.error('Error fetching reminders:', error);
    });
    return () => unsubscribe();
  }, []);

  const handleUpdateUserRole = async (userId: string, newRole: UserRole) => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        role: newRole,
        updatedAt: serverTimestamp()
      });
      setActiveRoleMenuUserId(null);
      // Update local selected modal user if open
      if (selectedProfileUser && selectedProfileUser.uid === userId) {
        setSelectedProfileUser(prev => prev ? { ...prev, role: newRole } : null);
      }
    } catch (error) {
      console.error('Error updating user role:', error);
      alert('حدث خطأ أثناء تعديل رتبة المشرف');
    }
  };

  // Filter users by search query and role filter
  const filteredUsers = users.filter(u => {
    const matchesSearch = 
      (u.displayName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.bio || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.customization?.badgeTitle || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.role === 'admin' && 'مدير مشرف عام admin'.includes(searchQuery.toLowerCase())) ||
      (u.role === 'supervisor' && 'مشرف مشرفين supervisor'.includes(searchQuery.toLowerCase())) ||
      ((u.role === 'user' || !u.role) && 'عضو مستخدم member user'.includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (roleFilter === 'supervisors') {
      return u.role === 'admin' || u.role === 'supervisor';
    }
    if (roleFilter === 'members') {
      return u.role === 'user' || u.role === 'member' || !u.role;
    }
    return true;
  });

  const supervisorsCount = users.filter(u => u.role === 'admin' || u.role === 'supervisor').length;
  const membersCount = users.filter(u => u.role === 'user' || u.role === 'member' || !u.role).length;

  const getRoleBadge = (role?: UserRole) => {
    switch (role) {
      case 'admin':
        return {
          title: 'مشرف عام / مدير',
          color: 'bg-amber-100 text-amber-800 border-amber-300',
          icon: Crown
        };
      case 'supervisor':
        return {
          title: 'مشرف كامل الصلاحية',
          color: 'bg-blue-100 text-blue-800 border-blue-300',
          icon: ShieldCheck
        };
      default:
        return {
          title: 'عضو مسجل',
          color: 'bg-gray-100 text-gray-700 border-gray-200',
          icon: UserCheck
        };
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* Header, Search & Filter Bar */}
      <div className="bg-white p-4 sm:p-6 rounded-3xl shadow-xs border border-gray-200 flex flex-col gap-4">
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-black text-gray-900 flex items-center gap-2">
                  دليل مستخدمي وأعضاء مكتبه الهدى
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  استعرض حسابات المشرفين والأعضاء، الشارات، الأصناف المسجلة وإدارة الصلاحيات
                </p>
              </div>
            </div>
          </div>

          {isAdmin && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 px-3.5 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 self-stretch sm:self-auto justify-center">
              <Crown className="w-4 h-4 text-amber-600" />
              <span>أنت مدير النظام (يمكنك تعيين وتعديل المشرفين)</span>
            </div>
          )}
        </div>

        {/* Search & Quick Filters */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-2 border-t border-gray-100">
          
          {/* Quick Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar bg-gray-50 p-1.5 rounded-2xl border border-gray-200 shrink-0">
            <button
              type="button"
              onClick={() => setRoleFilter('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all whitespace-nowrap cursor-pointer ${
                roleFilter === 'all' 
                  ? 'bg-blue-600 text-white shadow-xs' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              الكل ({users.length})
            </button>

            <button
              type="button"
              onClick={() => setRoleFilter('supervisors')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                roleFilter === 'supervisors' 
                  ? 'bg-amber-500 text-white shadow-xs' 
                  : 'text-amber-800 hover:bg-amber-50'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>المشرفين والمدراء ({supervisorsCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setRoleFilter('members')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                roleFilter === 'members' 
                  ? 'bg-emerald-600 text-white shadow-xs' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>الأعضاء ({membersCount})</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ابحث بالاسم، اللقب، الرتبة (مشرف/عضو)، أو الشارة..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-10 py-2.5 bg-gray-50 hover:bg-gray-100/80 focus:bg-white border border-gray-200 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

        </div>
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {filteredUsers.map((u) => {
          const userProducts = products.filter(p => p.ownerId === u.uid);
          const userReminders = reminders.filter(r => r.createdBy === u.uid);
          const isCurrentUser = u.uid === currentUserId;

          // Customization settings
          const custom = u.customization;
          const frameOption = AVATAR_FRAMES.find(f => f.id === custom?.avatarFrame) || AVATAR_FRAMES[AVATAR_FRAMES.length - 2];
          const shapeId = custom?.avatarShape || 'circle';
          const rotateOption = AVATAR_ROTATE_ANIMATIONS.find(r => r.id === custom?.avatarRotateAnimation) || AVATAR_ROTATE_ANIMATIONS[0];
          const filterOption = AVATAR_FILTERS.find(f => f.id === custom?.avatarFilter) || AVATAR_FILTERS[0];
          const badgeTitle = custom?.badgeTitle || 'عضو معتمد';
          const badgeIcon = custom?.badgeIcon || '🛡️';

          const getCardShapeClass = () => {
            switch (shapeId) {
              case 'squircle': return 'rounded-2xl';
              case 'hexagon': return 'clip-hexagon';
              case 'diamond': return 'rounded-xl rotate-45';
              case 'shield': return 'clip-shield';
              default: return 'rounded-full';
            }
          };

          const roleInfo = getRoleBadge(u.role);
          const RoleIcon = roleInfo.icon;
          const isMenuOpen = activeRoleMenuUserId === u.uid;

          return (
            <div
              key={u.uid}
              className="bg-white p-4 sm:p-5 rounded-3xl shadow-2xs border border-gray-200 hover:shadow-md hover:border-blue-300 transition-all flex flex-col justify-between group relative overflow-visible"
            >
              <div>
                {/* Top Section: Avatar & Info */}
                <div className="flex items-start gap-3.5">
                  
                  {/* Custom Avatar with Frame and Rotation */}
                  <div 
                    onClick={() => setSelectedProfileUser(u)}
                    className={`p-1 shrink-0 ${frameOption.frameClass} ${getCardShapeClass()} ${rotateOption.animationClass} flex items-center justify-center cursor-pointer`}
                  >
                    <div className={`w-14 h-14 overflow-hidden bg-gray-100 ${getCardShapeClass()} flex items-center justify-center`}>
                      <img
                        src={u.photoUrl || 'https://www.gravatar.com/avatar/?d=mp'}
                        alt={u.displayName}
                        className={`w-full h-full object-cover group-hover:scale-105 transition-transform ${filterOption.filterClass} ${shapeId === 'diamond' ? '-rotate-45 scale-125' : ''}`}
                        loading="lazy"
                        onError={(e) => { (e.target as HTMLImageElement).src = 'https://www.gravatar.com/avatar/?d=mp'; }}
                      />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 
                        onClick={() => setSelectedProfileUser(u)}
                        className="font-black text-sm sm:text-base text-gray-900 truncate group-hover:text-blue-600 transition-colors cursor-pointer"
                      >
                        {u.displayName}
                      </h3>
                      {isCurrentUser && (
                        <span className="text-[10px] bg-blue-100 text-blue-700 font-bold px-1.5 py-0.2 rounded-md shrink-0">
                          أنت
                        </span>
                      )}
                    </div>
                    
                    {/* Role & Badge Pills */}
                    <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                      {/* Role Pill */}
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg border flex items-center gap-1 ${roleInfo.color}`}>
                        <RoleIcon className="w-3 h-3" />
                        <span>{roleInfo.title}</span>
                      </span>

                      {/* Custom Badge */}
                      <span className="text-[10px] font-bold bg-gray-50 text-gray-700 border border-gray-200 px-2 py-0.5 rounded-lg flex items-center gap-1">
                        <span>{badgeIcon}</span>
                        <span className="truncate max-w-[100px]">{badgeTitle}</span>
                      </span>
                    </div>

                    <p className="text-xs text-gray-500 line-clamp-2 mt-2 leading-relaxed">
                      {u.bio || 'عضو في نظام مكتبه الهدى'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Admin Role Quick Management Bar */}
              {isAdmin && (
                <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between relative">
                  <span className="text-[11px] font-bold text-gray-500">صلاحية المستخدم:</span>
                  
                  <div className="relative">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveRoleMenuUserId(isMenuOpen ? null : u.uid);
                      }}
                      className="text-xs font-bold px-2.5 py-1 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Shield className="w-3.5 h-3.5 text-amber-600" />
                      <span>تعديل الرتبة</span>
                      <ChevronDown className="w-3 h-3 text-amber-600" />
                    </button>

                    {/* Role Dropdown Menu */}
                    {isMenuOpen && (
                      <div className="absolute left-0 bottom-full mb-1.5 w-56 bg-white border border-gray-200 rounded-2xl shadow-xl p-1.5 z-30 space-y-1">
                        <button
                          type="button"
                          onClick={() => handleUpdateUserRole(u.uid, 'supervisor')}
                          className={`w-full text-right px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer ${
                            u.role === 'supervisor' ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-100 text-gray-700'
                          }`}
                        >
                          <ShieldCheck className="w-4 h-4 text-blue-600" />
                          <div>
                            <div>مشرف (Supervisor)</div>
                            <div className="text-[10px] text-gray-400 font-normal">صلاحية كاملة للمنتجات والنواقص</div>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleUpdateUserRole(u.uid, 'admin')}
                          className={`w-full text-right px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer ${
                            u.role === 'admin' ? 'bg-amber-50 text-amber-700' : 'hover:bg-gray-100 text-gray-700'
                          }`}
                        >
                          <Crown className="w-4 h-4 text-amber-600" />
                          <div>
                            <div>مشرف عام / مدير (Admin)</div>
                            <div className="text-[10px] text-gray-400 font-normal">إدارة المشرفين وكافة الموقع</div>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleUpdateUserRole(u.uid, 'user')}
                          className={`w-full text-right px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer ${
                            u.role === 'user' || !u.role ? 'bg-emerald-50 text-emerald-700' : 'hover:bg-gray-100 text-gray-700'
                          }`}
                        >
                          <UserCheck className="w-4 h-4 text-emerald-600" />
                          <div>
                            <div>عضو عادي (Member)</div>
                            <div className="text-[10px] text-gray-400 font-normal">استعراض وتحديد النواقص</div>
                          </div>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Bottom Meta Stats */}
              <div 
                onClick={() => setSelectedProfileUser(u)}
                className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <Package className="w-3.5 h-3.5 text-gray-500" />
                    <strong className="text-gray-700">{userProducts.length}</strong> أصناف
                  </span>
                  <span className="flex items-center gap-1">
                    <ClipboardList className="w-3.5 h-3.5 text-gray-500" />
                    <strong className="text-gray-700">{userReminders.length}</strong> نواقص
                  </span>
                </div>

                <span className="text-blue-600 font-bold flex items-center gap-0.5 group-hover:underline">
                  عرض البروفايل <ExternalLink className="w-3 h-3" />
                </span>
              </div>
            </div>
          );
        })}

        {filteredUsers.length === 0 && (
          <div className="col-span-full py-16 text-center text-gray-400 bg-white rounded-3xl border border-dashed border-gray-300 p-6">
            <Users className="w-10 h-10 mx-auto text-gray-300 mb-2" />
            <h4 className="text-sm font-bold text-gray-700">لا يوجد أعضاء مطابقين لمعايير البحث</h4>
            <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
              جرب تغيير كلمة البحث أو الضغط على "الكل" لعرض جميع الأعضاء المسجلين.
            </p>
          </div>
        )}
      </div>

      {/* User Profile Modal */}
      {selectedProfileUser && (
        <UserProfileModal
          profileUser={selectedProfileUser}
          currentUserId={currentUserId}
          isOwner={selectedProfileUser.uid === currentUserId}
          isAdmin={isAdmin}
          userProducts={products.filter(p => p.ownerId === selectedProfileUser.uid)}
          userReminders={reminders.filter(r => r.createdBy === selectedProfileUser.uid)}
          isOpen={Boolean(selectedProfileUser)}
          onClose={() => setSelectedProfileUser(null)}
          onOpenEditProfile={() => setSelectedProfileUser(null)}
          onUpdateRole={handleUpdateUserRole}
        />
      )}

    </div>
  );
};
