import { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, query, orderBy, where } from 'firebase/firestore';
import { db } from '../firebase-config';
import { TIERS } from '../tierManager';
import AnalyticsDashboard from './AnalyticsDashboard';

function AdminDashboard({ onBack, userProfile }) {
  const [stats, setStats] = useState({
    totalUsers: 0,
    freeUsers: 0,
    trialUsers: 0,
    founderUsers: 0,
    premiumUsers: 0,
    totalCustomCards: 0,
    activeSessions: 0
  });
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [selectedTab, setSelectedTab] = useState('overview');

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    setLoading(true);
    try {
      // Load all users
      const usersQuery = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
      const usersSnapshot = await getDocs(usersQuery);
      const allUsers = [];
      
      let stats = {
        totalUsers: 0,
        freeUsers: 0,
        trialUsers: 0,
        founderUsers: 0,
        premiumUsers: 0,
        totalCustomCards: 0,
        activeSessions: 0
      };

      usersSnapshot.forEach((doc) => {
        const userData = { id: doc.id, ...doc.data() };
        allUsers.push(userData);
        
        // Count by tier
        stats.totalUsers++;
        switch(userData.tier) {
          case TIERS.FREE:
            stats.freeUsers++;
            break;
          case TIERS.TRIAL:
            stats.trialUsers++;
            break;
          case TIERS.FOUNDING:
            stats.founderUsers++;
            break;
          case TIERS.PREMIUM:
            stats.premiumUsers++;
            break;
          default:
            stats.freeUsers++;
        }

        // Count custom cards (rough estimate)
        if (userData.tier === TIERS.FOUNDING || userData.tier === TIERS.TRIAL || userData.tier === TIERS.PREMIUM) {
          stats.totalCustomCards += 5; // Estimate average usage
        }
      });

      setUsers(allUsers);
      setStats(stats);
    } catch (error) {
      setMessage('Error loading dashboard data: ' + error.message);
    } finally {
      setLoading(false);
    }
  }

  async function updateUserTier(userId, newTier) {
    if (!userId || !newTier) return;
    
    const userToUpdate = users.find(u => u.id === userId);
    if (!userToUpdate) return;

    // Show confirmation if removing founder status and user might have custom cards
    if (userToUpdate.tier === TIERS.FOUNDING && newTier === TIERS.FREE) {
      const confirmMsg = "Remove founder status? This will limit the user to 0 custom cards on the free tier.";
      if (!confirm(confirmMsg)) return;
    }

    setLoading(true);
    setMessage('');

    try {
      await updateDoc(doc(db, 'users', userId), {
        tier: newTier,
        grantedByAdmin: newTier === TIERS.FOUNDING,
        adminModifiedAt: new Date().toISOString()
      });
      
      setMessage(`User tier updated to ${newTier}`);
      
      // Update local state
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId 
            ? { ...user, tier: newTier, grantedByAdmin: newTier === TIERS.FOUNDING }
            : user
        )
      );

      // Recalculate stats
      await loadDashboardData();
      
    } catch (error) {
      setMessage('Error updating user: ' + error.message);
    } finally {
      setLoading(false);
    }
  }

  const filteredUsers = users.filter(user => 
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.id.includes(searchTerm)
  );

  const estimatedMonthlyCost = (stats.founderUsers + stats.trialUsers + stats.premiumUsers) * 0.10; // Rough estimate

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white">SayEasy Admin Dashboard</h1>
              <p className="text-gray-400">Manage users and monitor platform health</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-400">Logged in as Admin</div>
            <div className="text-sm text-gray-300">{userProfile?.email}</div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-6">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', name: 'Overview', icon: '📊' },
              { id: 'users', name: 'User Management', icon: '👥' },
              { id: 'analytics', name: 'Analytics', icon: '📈' },
              { id: 'realtime', name: 'Real-time Analytics', icon: '⚡' },
              { id: 'costs', name: 'Cost Management', icon: '💰' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id)}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  selectedTab === tab.id
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {message && (
          <div className={`mb-6 p-4 rounded-xl ${
            message.includes('Error') 
              ? 'bg-red-900/50 text-red-200 border border-red-800' 
              : 'bg-green-900/50 text-green-200 border border-green-800'
          }`}>
            {message}
          </div>
        )}

        {/* Overview Tab */}
        {selectedTab === 'overview' && (
          <div className="space-y-8">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Total Users</p>
                    <p className="text-3xl font-bold text-white">{stats.totalUsers}</p>
                  </div>
                  <div className="text-blue-400 text-2xl">👥</div>
                </div>
              </div>

              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Founder Users</p>
                    <p className="text-3xl font-bold text-yellow-400">{stats.founderUsers}</p>
                  </div>
                  <div className="text-yellow-400 text-2xl">⭐</div>
                </div>
              </div>

              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Trial Users</p>
                    <p className="text-3xl font-bold text-purple-400">{stats.trialUsers}</p>
                  </div>
                  <div className="text-purple-400 text-2xl">🎯</div>
                </div>
              </div>

              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Est. Monthly Cost</p>
                    <p className="text-3xl font-bold text-red-400">${estimatedMonthlyCost.toFixed(2)}</p>
                  </div>
                  <div className="text-red-400 text-2xl">💰</div>
                </div>
              </div>
            </div>

            {/* User Breakdown */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h3 className="text-xl font-bold text-white mb-6">User Distribution</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-400">{stats.freeUsers}</div>
                  <div className="text-sm text-gray-500">Free Users</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-400">{stats.trialUsers}</div>
                  <div className="text-sm text-gray-500">Trial Users</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-400">{stats.founderUsers}</div>
                  <div className="text-sm text-gray-500">Founders</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">{stats.premiumUsers}</div>
                  <div className="text-sm text-gray-500">Premium</div>
                </div>
              </div>
            </div>

            {/* Business Health */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <h3 className="text-xl font-bold text-white mb-4">Revenue Impact</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Founder Slots Used:</span>
                    <span className="text-yellow-400 font-medium">{stats.founderUsers}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Potential Monthly Value:</span>
                    <span className="text-green-400 font-medium">${(stats.founderUsers * 15).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Platform Costs:</span>
                    <span className="text-red-400 font-medium">${estimatedMonthlyCost.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <h3 className="text-xl font-bold text-white mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <button 
                    onClick={() => setSelectedTab('users')}
                    className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-500 rounded-lg text-white text-sm transition-colors"
                  >
                    Manage Users
                  </button>
                  <button 
                    onClick={() => loadDashboardData()}
                    className="w-full py-2 px-4 bg-gray-600 hover:bg-gray-500 rounded-lg text-white text-sm transition-colors"
                    disabled={loading}
                  >
                    {loading ? 'Refreshing...' : 'Refresh Data'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {selectedTab === 'users' && (
          <div className="space-y-3">
            {/* Compact Header with Search */}
            <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
              <div className="flex items-center gap-4">
                <h3 className="text-lg font-bold text-white whitespace-nowrap">User Management</h3>
                <div className="flex-1">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search users..."
                    className="w-full px-3 py-1.5 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                  />
                </div>
                <div className="text-gray-400 text-sm whitespace-nowrap">
                  {filteredUsers.length} users
                </div>
              </div>
            </div>

            {/* User List */}
            <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
              
              {loading ? (
                <div className="p-8 text-center text-gray-400">Loading users...</div>
              ) : filteredUsers.length === 0 ? (
                <div className="p-8 text-center text-gray-400">No users found</div>
              ) : (
                <div className="divide-y divide-gray-700 max-h-[calc(100vh-280px)] overflow-y-auto">
                  {filteredUsers.map((user, index) => (
                    <div key={user.id} className={`p-4 hover:bg-gray-750 transition-colors ${
                      index === filteredUsers.length - 1 ? 'mb-8' : ''
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-white truncate">
                            {user.displayName || user.email || 'Unknown User'}
                          </div>
                          <div className="text-sm text-gray-400 truncate">
                            {user.email} • {user.tier || 'free'} {user.grantedByAdmin ? '(Admin Granted)' : ''}
                          </div>
                          <div className="text-xs text-gray-500">
                            ID: {user.id} • Created: {user.createdAt ? new Date(user.createdAt.toDate()).toLocaleDateString() : 'Unknown'}
                          </div>
                        </div>
                        <div className="ml-4">
                          <button
                            onClick={() => updateUserTier(user.id, user.tier === TIERS.FOUNDING ? TIERS.FREE : TIERS.FOUNDING)}
                            disabled={loading}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                              user.tier === TIERS.FOUNDING
                                ? 'bg-yellow-600 hover:bg-yellow-500 text-white'
                                : 'bg-gray-600 hover:bg-yellow-600 text-gray-200'
                            }`}
                          >
                            {user.tier === TIERS.FOUNDING ? '⭐ Remove Founder' : '⭐ Make Founder'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {selectedTab === 'analytics' && (
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h3 className="text-xl font-bold text-white mb-4">Platform Analytics</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-400">{stats.totalCustomCards}</div>
                  <div className="text-sm text-gray-400">Est. Custom Cards</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-400">{((stats.founderUsers / stats.totalUsers) * 100).toFixed(1)}%</div>
                  <div className="text-sm text-gray-400">Founder Conversion</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-400">{stats.trialUsers}</div>
                  <div className="text-sm text-gray-400">Active Trials</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Real-time Analytics Tab */}
        {selectedTab === 'realtime' && (
          <div className="space-y-6">
            <AnalyticsDashboard />
          </div>
        )}

        {/* Costs Tab */}
        {selectedTab === 'costs' && (
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h3 className="text-xl font-bold text-white mb-6">Cost Management</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-lg font-semibold text-white mb-4">Monthly Estimates</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Firebase Usage:</span>
                      <span className="text-red-400">${estimatedMonthlyCost.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Development Tools:</span>
                      <span className="text-red-400">$30.00</span>
                    </div>
                    <div className="flex justify-between border-t border-gray-600 pt-3">
                      <span className="text-white font-medium">Total Monthly Cost:</span>
                      <span className="text-red-400 font-bold">${(estimatedMonthlyCost + 30).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-white mb-4">Cost Per User Type</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Free Users:</span>
                      <span className="text-green-400">$0.00/month</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Founder Users:</span>
                      <span className="text-yellow-400">~$0.10/month</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Trial Users:</span>
                      <span className="text-purple-400">~$0.10/month</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-red-900/50 rounded-xl border border-red-800">
                <h4 className="text-lg font-semibold text-red-200 mb-2">⚠️ Cost Monitoring</h4>
                <p className="text-red-300 text-sm">
                  Monitor your Firebase usage in the Firebase Console. Set up billing alerts to avoid unexpected charges. 
                  Consider limiting founder status if costs exceed your budget.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 border-t border-gray-700 py-4 px-6 flex-shrink-0">
        <div className="max-w-6xl mx-auto text-center">
          <span 
            className="font-bold text-white"
            style={{ fontFamily: "'Quicksand', sans-serif" }}
          >
            SayEasy
          </span>
          <span className="text-gray-400 mx-2">•</span>
          <span className="text-gray-400">Simple, Stable Communication</span>
        </div>
      </footer>
    </div>
  );
}

export default AdminDashboard;