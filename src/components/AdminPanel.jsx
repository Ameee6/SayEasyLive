import { useState } from 'react';
import { db } from '../firebase-config';
import { doc, updateDoc, collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { TIERS } from '../tierManager';

export default function AdminPanel({ userProfile, onClose }) {
  const [searchEmail, setSearchEmail] = useState('');
  const [foundUser, setFoundUser] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [recentUsers, setRecentUsers] = useState([]);

  // Check if current user is admin (you)
  const isAdmin = userProfile?.email === 'amyerdt6@gmail.com' || userProfile?.tier === 'admin';

  if (!isAdmin) {
    return null;
  }

  async function searchUser() {
    if (!searchEmail) return;
    setLoading(true);
    setMessage('');
    setFoundUser(null);

    try {
      // In a real app, you'd need a backend search function
      // For now, we'll show a message about manual search
      setMessage('Email search requires backend implementation. Use Firebase console to find users by email.');
    } catch (error) {
      setMessage('Error searching for user: ' + error.message);
    } finally {
      setLoading(false);
    }
  }

  async function updateUserTier(userId, newTier) {
    if (!userId || !newTier) return;
    setLoading(true);
    setMessage('');

    try {
      await updateDoc(doc(db, 'users', userId), {
        tier: newTier,
        grantedByAdmin: newTier === TIERS.FOUNDING
      });
      setMessage(`User tier updated to ${newTier}`);
      
      // Refresh found user data
      if (foundUser && foundUser.id === userId) {
        setFoundUser({
          ...foundUser,
          tier: newTier,
          grantedByAdmin: newTier === TIERS.FOUNDING
        });
      }
      
      // Update users list if this user is in it
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId 
            ? { ...user, tier: newTier, grantedByAdmin: newTier === TIERS.FOUNDING }
            : user
        )
      );
    } catch (error) {
      setMessage('Error updating user: ' + error.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadRecentUsers() {
    setLoading(true);
    try {
      const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(10));
      const querySnapshot = await getDocs(q);
      const users = [];
      querySnapshot.forEach((doc) => {
        users.push({ id: doc.id, ...doc.data() });
      });
      setRecentUsers(users);
    } catch (error) {
      setMessage('Error loading users: ' + error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-purple-100 bg-opacity-80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-2xl border border-gray-700 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">Admin Panel</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        {/* User Search */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-white mb-3">Find User by Email</h3>
          <div className="flex gap-2">
            <input
              type="email"
              placeholder="Enter user email..."
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              className="flex-1 p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            />
            <button
              onClick={searchUser}
              disabled={loading || !searchEmail}
              className="px-4 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 rounded-lg text-white font-semibold transition-colors"
            >
              Search
            </button>
          </div>
        </div>

        {/* Found User */}
        {foundUser && (
          <div className="mb-6 p-4 bg-gray-700 rounded-lg">
            <h4 className="font-semibold text-white mb-2">User Found:</h4>
            <div className="text-gray-300 space-y-1">
              <div><strong>Name:</strong> {foundUser.fullName}</div>
              <div><strong>Email:</strong> {foundUser.email}</div>
              <div><strong>Current Tier:</strong> {foundUser.tier}</div>
              <div><strong>Admin Granted:</strong> {foundUser.grantedByAdmin ? 'Yes' : 'No'}</div>
            </div>
            
            <div className="mt-4">
              <button
                onClick={() => updateUserTier(foundUser.id, foundUser.tier === TIERS.FOUNDING ? TIERS.FREE : TIERS.FOUNDING)}
                disabled={loading}
                className={`px-4 py-2 rounded text-sm font-medium transition-all ${
                  foundUser.tier === TIERS.FOUNDING
                    ? 'bg-yellow-500 text-white border-2 border-yellow-400 shadow-lg' // Founder ON
                    : 'bg-gray-100 text-gray-700 border-2 border-gray-300 hover:bg-yellow-50 hover:border-yellow-300' // Founder OFF
                }`}
              >
                {foundUser.tier === TIERS.FOUNDING ? '⭐ Founder Status: ON' : '⭐ Grant Founder Status'}
              </button>
            </div>
          </div>
        )}

        {/* Recent Users */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold text-white">Recent Users</h3>
            <button
              onClick={loadRecentUsers}
              disabled={loading}
              className="px-3 py-1 bg-gray-600 hover:bg-gray-500 disabled:bg-gray-600 rounded text-white text-sm"
            >
              Refresh
            </button>
          </div>
          
          {recentUsers.length > 0 ? (
            <div className="space-y-2">
              {recentUsers.map((user) => (
                <div key={user.id} className="p-3 bg-gray-700 rounded-lg flex justify-between items-center">
                  <div className="text-gray-300">
                    <div className="font-medium">{user.fullName}</div>
                    <div className="text-sm">{user.email}</div>
                    <div className="text-xs text-gray-400">
                      {user.tier} {user.grantedByAdmin ? '(Admin Granted)' : ''}
                    </div>
                  </div>
                  <div>
                    <button
                      onClick={() => updateUserTier(user.id, user.tier === TIERS.FOUNDING ? TIERS.FREE : TIERS.FOUNDING)}
                      disabled={loading}
                      className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                        user.tier === TIERS.FOUNDING
                          ? 'bg-yellow-500 text-white border border-yellow-400' // Founder ON
                          : 'bg-gray-100 text-gray-600 border border-gray-300 hover:bg-yellow-50' // Founder OFF
                      }`}
                    >
                      {user.tier === TIERS.FOUNDING ? '⭐ Founder' : '⭐ Make Founder'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-400 text-center py-4">
              Click "Refresh" to load recent users
            </div>
          )}
        </div>

        {/* Admin Info */}
        <div className="mb-4 p-4 bg-blue-900 rounded-lg">
          <h4 className="font-semibold text-blue-200 mb-2">Admin Quick Reference:</h4>
          <div className="text-blue-100 text-sm space-y-1">
            <div><strong>Founding Members:</strong> Full access forever (10 custom buttons)</div>
            <div><strong>Free Users:</strong> 2 custom buttons + all preset buttons</div>
            <div><strong>Premium Users:</strong> 10 custom buttons (future paid tier)</div>
          </div>
        </div>

        {message && (
          <div className={`p-3 rounded-lg text-center ${
            message.includes('updated') || message.includes('Success') 
              ? 'bg-green-900 text-green-200' 
              : 'bg-yellow-900 text-yellow-200'
          }`}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
}