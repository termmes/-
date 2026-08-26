import React, { useState, useEffect } from 'react';
import { UserProfile, Product, ReminderItem } from '../types';
import { db } from '../firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { UserProfileModal } from './UserProfileModal';
import { AVATAR_FRAMES, AVATAR_SHAPES, BANNER_THEMES } from '../profileThemes';
import { 
  Users, 
  Search, 
  CheckCircle2, 
  Package, 
  ClipboardList, 
  ExternalLink,
  Sparkles
} from 'lucide-react';

interface CommunityViewProps {
  currentUserId: string;
  currentUserProfile: UserProfile | null;
  products: Product[];
}

export const CommunityView: React.FC<CommunityViewProps> = ({
  currentUserId,
  currentUserProfile,
  products
}) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [reminders, setReminders] = useState<ReminderItem[]>([]);
  const [selectedProfileUser, setSelectedProfileUser] = useState<UserProfile | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

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

  // Filter users by search query
  const filteredUsers = users.filter(u => 
    u.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.bio?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.customization?.badgeTitle?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      {/* Header & Search Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl shadow-xs border border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-gray-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" /> أعضاء ومستخدمي مكتبه الهدى
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            استعرض الملفات الشخصية للأعضاء والشارات والسمات والأصناف المسجلة.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Search Input */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="بحث بالاسم أو اللقب..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-3 pr-9 py-2 bg-gray-50 hover:bg-gray-100/80 focus:bg-white border border-gray-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>

          <span className="text-xs bg-blue-50 text-blue-700 px-3 py-1.5 rounded-xl font-black shrink-0">
            {filteredUsers.length} عضو
          </span>
        </div>
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredUsers.map((u) => {
          const userProducts = products.filter(p => p.ownerId === u.uid);
          const userReminders = reminders.filter(r => r.createdBy === u.uid);
          const isCurrentUser = u.uid === currentUserId;

          // Customization settings
          const custom = u.customization;
          const frameOption = AVATAR_FRAMES.find(f => f.id === custom?.avatarFrame) || AVATAR_FRAMES[AVATAR_FRAMES.length - 2];
          const shapeId = custom?.avatarShape || 'circle';
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

          return (
            <div
              key={u.uid}
              onClick={() => setSelectedProfileUser(u)}
              className="bg-white p-4 rounded-3xl shadow-2xs border border-gray-200/80 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer flex flex-col justify-between group relative overflow-hidden"
            >
              <div>
                {/* Top Section: Avatar & Info */}
                <div className="flex items-start gap-3">
                  
                  {/* Custom Avatar with Frame */}
                  <div className={`p-1 shrink-0 ${frameOption.frameClass} ${getCardShapeClass()} flex items-center justify-center`}>
                    <div className={`w-12 h-12 overflow-hidden bg-gray-100 ${getCardShapeClass()} flex items-center justify-center`}>
                      <img
                        src={u.photoUrl || 'https://www.gravatar.com/avatar/?d=mp'}
                        alt={u.displayName}
                        className={`w-full h-full object-cover group-hover:scale-105 transition-transform ${shapeId === 'diamond' ? '-rotate-45 scale-125' : ''}`}
                        loading="lazy"
                        onError={(e) => { (e.target as HTMLImageElement).src = 'https://www.gravatar.com/avatar/?d=mp'; }}
                      />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="font-black text-sm text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                        {u.displayName}
                      </h3>
                      {isCurrentUser && (
                        <span className="text-[10px] bg-blue-100 text-blue-700 font-bold px-1.5 py-0.2 rounded-md shrink-0">
                          أنت
                        </span>
                      )}
                    </div>
                    
                    {/* Badge Pill */}
                    <div className="mt-1 flex items-center gap-1">
                      <span className="text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                        <span>{badgeIcon}</span>
                        <span className="truncate max-w-[120px]">{badgeTitle}</span>
                      </span>
                    </div>

                    <p className="text-xs text-gray-500 line-clamp-2 mt-1.5 leading-relaxed">
                      {u.bio || 'عضو في نظام مكتبه الهدى'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Bottom Meta Stats */}
              <div className="mt-3.5 pt-2.5 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <Package className="w-3 h-3 text-gray-500" />
                    <strong className="text-gray-700">{userProducts.length}</strong> أصناف
                  </span>
                  <span className="flex items-center gap-1">
                    <ClipboardList className="w-3 h-3 text-gray-500" />
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
          <div className="col-span-full py-12 text-center text-gray-400 bg-white rounded-3xl border border-dashed border-gray-200">
            <Users className="w-8 h-8 mx-auto text-gray-300 mb-2" />
            <p className="text-xs font-bold text-gray-600">لا يوجد أعضاء مطابقين للبحث</p>
          </div>
        )}
      </div>

      {/* User Profile Modal */}
      {selectedProfileUser && (
        <UserProfileModal
          profileUser={selectedProfileUser}
          currentUserId={currentUserId}
          isOwner={selectedProfileUser.uid === currentUserId}
          userProducts={products.filter(p => p.ownerId === selectedProfileUser.uid)}
          userReminders={reminders.filter(r => r.createdBy === selectedProfileUser.uid)}
          isOpen={Boolean(selectedProfileUser)}
          onClose={() => setSelectedProfileUser(null)}
          onOpenEditProfile={() => setSelectedProfileUser(null)}
        />
      )}

    </div>
  );
};
