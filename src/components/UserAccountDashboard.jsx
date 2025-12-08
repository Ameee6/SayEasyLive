import { useState, useEffect } from 'react';
import { signOut, deleteAccount, updateProfile } from '../auth';
import { startFreeTrial, getTrialStatus, formatTrialEndDate } from '../lib/trial';
import { createCheckoutSession } from '../lib/stripe';

export default function UserAccountDashboard({ user, userProfile, userTier, onRefreshUser, onNavigateHome }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedFullName, setEditedFullName] = useState('');

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  async function handleSignOut() {
    if (loading) return;
    setLoading(true);
    try {
      await signOut();
      onNavigateHome();
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteAccount() {
    if (loading) return;

    // First confirmation
    const firstConfirm = confirm(
      "⚠️ Are you sure you want to delete your account?\n\n" +
      "This will permanently delete:\n" +
      "• All your scroll cards and settings\n" +
      "• Your subscription and billing history\n" +
      "• All account data\n\n" +
      "This action cannot be undone."
    );

    if (!firstConfirm) return;

    // Second confirmation
    const secondConfirm = confirm(
      "🚨 FINAL CONFIRMATION\n\n" +
      "Are you absolutely certain you want to permanently delete your SayEasy account?\n\n" +
      "Type 'DELETE' in the next prompt to confirm."
    );

    if (!secondConfirm) return;

    // Third confirmation with text input
    const typeConfirm = prompt(
      "Type 'DELETE' (in all caps) to permanently delete your account:"
    );

    if (typeConfirm !== 'DELETE') {
      setMessage('Account deletion cancelled - confirmation text did not match.');
      return;
    }

    setLoading(true);
    setMessage('Deleting your account...');

    try {
      await deleteAccount();
      setMessage('✅ Account deleted successfully. You will be redirected to the home page.');
      
      // Wait a moment for user to see the message, then navigate home
      setTimeout(() => {
        onNavigateHome();
      }, 2000);
      
    } catch (error) {
      console.error('Delete account error:', error);
      setMessage('❌ Error deleting account: ' + error.message);
      setLoading(false);
    }
  }

  async function handleEditName() {
    setEditedFullName(userProfile?.fullName || user?.displayName || '');
    setIsEditingName(true);
  }

  async function handleSaveName() {
    if (loading) return;
    
    const trimmedName = editedFullName.trim();
    if (!trimmedName) {
      setMessage('❌ Full name cannot be empty.');
      return;
    }

    if (trimmedName === (userProfile?.fullName || user?.displayName || '')) {
      // No change, just cancel editing
      setIsEditingName(false);
      return;
    }

    setLoading(true);
    setMessage('Updating full name...');

    try {
      await updateProfile(user.uid, { fullName: trimmedName });
      setMessage('✅ Full name updated successfully!');
      setIsEditingName(false);
      
      // Refresh user data to show updated name
      if (onRefreshUser) {
        await onRefreshUser();
      }
      
      // Clear success message after 3 seconds
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Update name error:', error);
      setMessage('❌ Error updating full name: ' + error.message);
    }

    setLoading(false);
  }

  function handleCancelEditName() {
    setIsEditingName(false);
    setEditedFullName('');
  }

  async function handleStartTrial() {
    if (!user?.uid) return;
    
    setLoading(true);
    setMessage('Starting your free trial...');
    
    try {
      const result = await startFreeTrial(user.uid);
      
      if (result.success) {
        setMessage(`✨ Free trial started! You now have access to 10 custom scroll cards until ${formatTrialEndDate(result.trialEnds.toISOString())}.`);
        
        if (onRefreshUser) {
          await onRefreshUser();
        }
      } else {
        setMessage('Error starting trial: ' + result.error);
      }
    } catch (error) {
      setMessage('Error starting trial: ' + error.message);
    }
    
    setLoading(false);
  }

  async function handleSubscribe() {
    if (!user?.uid) return;
    
    setLoading(true);
    setMessage('Redirecting to secure payment...');
    
    try {
      const { url } = await createCheckoutSession();
      window.location.href = url;
    } catch (error) {
      setMessage('Error creating checkout session: ' + error.message);
      setLoading(false);
    }
  }


  function getSubscriptionStatus() {
    if (!userTier) return { status: 'Loading...', description: '' };

    const trialStatus = userTier.tier === 'trial' ? getTrialStatus(userProfile) : null;

    switch (userTier.tier) {
      case 'free':
        return {
          status: 'Free',
          description: '2 main buttons + 10 preset cards',
          action: 'Start Free Trial'
        };
      case 'trial':
        if (trialStatus?.expired) {
          return {
            status: 'Trial Expired',
            description: 'Trial has ended',
            action: 'Subscribe Now'
          };
        }
        return {
          status: 'Free Trial Active',
          description: 'Full access to all features',
          expires: `Trial ends in ${trialStatus?.daysLeft || 0} days`,
          expiryDate: userProfile?.trialEndDate ? formatTrialEndDate(userProfile.trialEndDate) : ''
        };
      case 'premium':
        return {
          status: 'Premium Active',
          description: 'Full access to all features',
          billing: 'Next billing: [Date]'
        };
      case 'founding':
        return {
          status: 'Founding Member ⭐',
          description: 'Full access forever - thank you!'
        };
      case 'admin':
        return {
          status: 'Admin',
          description: 'Administrator access'
        };
      default:
        return { status: 'Unknown', description: '' };
    }
  }

  const subscription = getSubscriptionStatus();

  return (
    <div className="h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white flex flex-col">
      {/* Header */}
      <header className="bg-gradient-to-r from-orange-600 via-orange-500 to-orange-600 py-6 px-6 shadow-lg flex-shrink-0">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onNavigateHome}
              className="text-orange-100 hover:text-white transition-colors"
            >
              ← Back to Home
            </button>
            <h1 className="text-3xl md:text-4xl font-bold text-white">
              Account Dashboard
            </h1>
          </div>
          <div className="text-orange-100 text-right">
            <div className="font-semibold">
              {userProfile?.fullName || user?.displayName || 'User'}
            </div>
            <div className="text-sm">
              {user?.email}
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-gray-800 border-b border-gray-700 flex-shrink-0">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: '📊' },
              { id: 'subscription', label: 'Subscription', icon: '💳' },
              { id: 'settings', label: 'Settings', icon: '⚙️' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-4 px-2 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-orange-500 text-orange-400'
                    : 'border-transparent text-gray-400 hover:text-gray-200'
                }`}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Messages */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.includes('✨') || message.includes('✅') 
              ? 'bg-green-900 text-green-200' 
              : message.includes('Error')
              ? 'bg-red-900 text-red-200'
              : 'bg-yellow-900 text-yellow-200'
          }`}>
            {message}
          </div>
        )}

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* User Info Card */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h2 className="text-xl font-semibold text-orange-400 mb-4">Profile Information</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 text-sm mb-1">Full Name</label>
                  {isEditingName ? (
                    <div className="flex gap-2 items-center">
                      <input
                        type="text"
                        value={editedFullName}
                        onChange={(e) => setEditedFullName(e.target.value)}
                        className="flex-1 p-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-500"
                        placeholder="Enter your full name"
                        disabled={loading}
                        autoFocus
                      />
                      <button
                        onClick={handleSaveName}
                        disabled={loading}
                        className="px-3 py-2 bg-orange-600 hover:bg-orange-500 disabled:bg-gray-600 rounded-lg text-white text-sm transition-colors"
                      >
                        ✓
                      </button>
                      <button
                        onClick={handleCancelEditName}
                        disabled={loading}
                        className="px-3 py-2 bg-gray-600 hover:bg-gray-500 disabled:bg-gray-700 rounded-lg text-white text-sm transition-colors"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-white">{userProfile?.fullName || user?.displayName || 'Not set'}</span>
                      <button
                        onClick={handleEditName}
                        disabled={loading}
                        className="text-orange-400 hover:text-orange-300 disabled:opacity-50 text-sm transition-colors"
                      >
                        Edit
                      </button>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-1">Email</label>
                  <div className="text-white">{user?.email}</div>
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-1">Account Type</label>
                  <div className="text-white">{subscription.status}</div>
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-1">Member Since</label>
                  <div className="text-white">
                    {userProfile?.createdAt ? new Date(userProfile.createdAt).toLocaleDateString() : 'Unknown'}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h2 className="text-xl font-semibold text-orange-400 mb-4">Quick Actions</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <button
                  onClick={() => setActiveTab('subscription')}
                  className="p-4 bg-orange-600 hover:bg-orange-500 rounded-lg transition-colors text-left"
                >
                  <div className="font-semibold">Manage Subscription</div>
                  <div className="text-sm text-orange-100">View billing and upgrade options</div>
                </button>
                <button
                  onClick={() => setActiveTab('settings')}
                  className="p-4 bg-gray-600 hover:bg-gray-500 rounded-lg transition-colors text-left"
                >
                  <div className="font-semibold">Account Settings</div>
                  <div className="text-sm text-gray-300">Data management and preferences</div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Subscription Tab */}
        {activeTab === 'subscription' && (
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h2 className="text-xl font-semibold text-orange-400 mb-4">Current Subscription</h2>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Status:</span>
                  <span className="text-white font-medium">{subscription.status}</span>
                </div>
                
                <div className="text-gray-400">
                  {subscription.description}
                </div>

                {subscription.expires && (
                  <div className="text-yellow-400">
                    {subscription.expires}
                  </div>
                )}

                {subscription.expiryDate && (
                  <div className="text-gray-400 text-sm">
                    Expires: {subscription.expiryDate}
                  </div>
                )}

                {subscription.billing && (
                  <div className="text-gray-400">
                    {subscription.billing}
                  </div>
                )}
              </div>

              {/* Feature List and Action Buttons - Side by Side */}
              <div className="mt-6 grid md:grid-cols-2 gap-6">
                {/* Feature List */}
                <div className="p-4 bg-gray-700 rounded-lg">
                  <h3 className="text-white font-semibold mb-3">Your Features</h3>
                  <div className="space-y-1">
                    {userTier?.features?.map((feature, index) => (
                      <div key={index} className="text-gray-300 text-sm flex items-center">
                        <span className="text-green-400 mr-2">✓</span>
                        {feature}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                {subscription.action === 'Start Free Trial' && (
                  <button
                    onClick={handleStartTrial}
                    disabled={loading}
                    className="w-full py-3 bg-orange-600 hover:bg-orange-500 disabled:bg-gray-600 rounded-lg text-white font-semibold transition-colors"
                  >
                    {loading ? 'Starting Trial...' : '✨ Start 2-Week Free Trial'}
                  </button>
                )}

                {userTier?.tier === 'trial' && (
                  <div className="text-center">
                    <div className="text-gray-400 text-sm mb-3">
                      Enjoying your trial?
                    </div>
                    <button
                      onClick={handleSubscribe}
                      disabled={loading}
                      className="py-3 px-6 bg-green-600 hover:bg-green-500 disabled:bg-gray-600 rounded-lg text-white font-semibold transition-colors"
                    >
                      {loading && message.includes('payment') ? 'Redirecting...' : 'Subscribe Now ($12.99/year)'}
                    </button>
                  </div>
                )}

                {userTier?.tier === 'premium' && (
                  <button
                    disabled={loading}
                    className="w-full py-2 text-red-400 hover:text-red-300 disabled:opacity-50 transition-colors"
                  >
                    Cancel Subscription
                  </button>
                )}
                </div>
              </div>
            </div>
          </div>
        )}


        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h2 className="text-xl font-semibold text-orange-400 mb-4">Account Settings</h2>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-gray-700">
                  <div>
                    <div className="text-white font-medium">Add Email/Gmail Account</div>
                    <div className="text-gray-400 text-sm">Link additional email or Google account for login</div>
                  </div>
                  <button 
                    disabled
                    className="text-gray-500 cursor-not-allowed"
                  >
                    Coming Soon
                  </button>
                </div>

                <div className="flex justify-between items-center py-3 border-b border-gray-700">
                  <div>
                    <div className="text-white font-medium">Manage Login Methods</div>
                    <div className="text-gray-400 text-sm">Set primary email and remove old accounts</div>
                  </div>
                  <button 
                    disabled
                    className="text-gray-500 cursor-not-allowed"
                  >
                    Coming Soon
                  </button>
                </div>

                <div className="flex justify-between items-center py-3 border-b border-gray-700">
                  <div>
                    <div className="text-white font-medium">Change Password</div>
                    <div className="text-gray-400 text-sm">Update password for email login accounts</div>
                  </div>
                  <button 
                    disabled
                    className="text-gray-500 cursor-not-allowed"
                  >
                    Coming Soon
                  </button>
                </div>

                <div className="flex justify-between items-center py-3">
                  <div>
                    <div className="text-white font-medium">Delete Account</div>
                    <div className="text-gray-400 text-sm">Permanently delete your account and data</div>
                  </div>
                  <button 
                    onClick={handleDeleteAccount}
                    disabled={loading}
                    className="text-red-400 hover:text-red-300 disabled:opacity-50 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>

            {/* Sign Out */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h2 className="text-xl font-semibold text-orange-400 mb-4">Session</h2>
              <button
                onClick={handleSignOut}
                disabled={loading}
                className="w-full py-3 bg-gray-600 hover:bg-gray-500 disabled:bg-gray-700 rounded-lg text-gray-300 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        )}
        </div>
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