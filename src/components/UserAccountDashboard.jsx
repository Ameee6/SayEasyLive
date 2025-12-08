import { useState, useEffect } from 'react';
import { signOut, deleteAccount, updateProfile, updatePassword, sendVerificationEmail, reloadUser, linkGoogleAccount, linkEmailPassword, getLinkedProviders } from '../auth';
import { startFreeTrial, getTrialStatus, formatTrialEndDate } from '../lib/trial';
import { createCheckoutSession, cancelSubscription, getBillingHistory } from '../lib/stripe';

export default function UserAccountDashboard({ user, userProfile, userTier, onRefreshUser, onNavigateHome }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedFullName, setEditedFullName] = useState('');
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [emailVerified, setEmailVerified] = useState(user?.emailVerified || false);
  const [linkingLoading, setLinkingLoading] = useState(false);
  const [showLinkEmailForm, setShowLinkEmailForm] = useState(false);
  const [linkEmailData, setLinkEmailData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [linkedProviders, setLinkedProviders] = useState([]);
  const [billingHistory, setBillingHistory] = useState([]);
  const [billingLoading, setBillingLoading] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  // Scroll to top when component mounts and load linked providers
  useEffect(() => {
    window.scrollTo(0, 0);
    setLinkedProviders(getLinkedProviders());
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

  async function handleChangePassword(e) {
    e.preventDefault();
    if (loading) return;

    // Validation
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setMessage('❌ Please fill in all password fields.');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage('❌ New passwords do not match.');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setMessage('❌ New password must be at least 6 characters long.');
      return;
    }

    if (passwordData.newPassword === passwordData.currentPassword) {
      setMessage('❌ New password must be different from current password.');
      return;
    }

    setLoading(true);
    setMessage('Updating password...');

    try {
      await updatePassword(passwordData.currentPassword, passwordData.newPassword);
      setMessage('✅ Password updated successfully!');
      
      // Clear form
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });

      // Clear success message after 3 seconds
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Change password error:', error);
      setMessage('❌ ' + error.message);
    }

    setLoading(false);
  }

  async function handleSendVerification() {
    if (verificationLoading) return;
    setVerificationLoading(true);
    setMessage('');

    try {
      await sendVerificationEmail();
      setMessage('✅ Verification email sent! Check your inbox and click the verification link.');
    } catch (error) {
      console.error('Send verification error:', error);
      setMessage('❌ ' + error.message);
    }

    setVerificationLoading(false);
  }

  async function handleCheckVerification() {
    if (verificationLoading) return;
    setVerificationLoading(true);
    setMessage('');

    try {
      const result = await reloadUser();
      setEmailVerified(result.emailVerified);
      
      if (result.emailVerified) {
        setMessage('✅ Email successfully verified!');
        // Refresh user data in parent component
        if (onRefreshUser) {
          onRefreshUser();
        }
      } else {
        setMessage('❌ Email not yet verified. Please check your inbox and click the verification link.');
      }
    } catch (error) {
      console.error('Check verification error:', error);
      setMessage('❌ ' + error.message);
    }

    setVerificationLoading(false);
  }

  async function handleLinkGoogle() {
    if (linkingLoading) return;
    setLinkingLoading(true);
    setMessage('');

    try {
      await linkGoogleAccount();
      setMessage('✅ Google account linked successfully!');
      setLinkedProviders(getLinkedProviders());
      
      // Refresh user data in parent component
      if (onRefreshUser) {
        onRefreshUser();
      }
    } catch (error) {
      console.error('Link Google error:', error);
      setMessage('❌ ' + error.message);
    }

    setLinkingLoading(false);
  }

  async function handleLinkEmail(e) {
    e.preventDefault();
    if (linkingLoading) return;

    // Validation
    if (!linkEmailData.email || !linkEmailData.password || !linkEmailData.confirmPassword) {
      setMessage('❌ Please fill in all fields.');
      return;
    }

    if (linkEmailData.password !== linkEmailData.confirmPassword) {
      setMessage('❌ Passwords do not match.');
      return;
    }

    if (linkEmailData.password.length < 6) {
      setMessage('❌ Password must be at least 6 characters long.');
      return;
    }

    setLinkingLoading(true);
    setMessage('');

    try {
      await linkEmailPassword(linkEmailData.email, linkEmailData.password);
      setMessage('✅ Email/password authentication linked successfully! Verification email sent.');
      setLinkedProviders(getLinkedProviders());
      
      // Clear and hide form
      setLinkEmailData({
        email: '',
        password: '',
        confirmPassword: ''
      });
      setShowLinkEmailForm(false);
      
      // Refresh user data in parent component
      if (onRefreshUser) {
        onRefreshUser();
      }
    } catch (error) {
      console.error('Link email error:', error);
      setMessage('❌ ' + error.message);
    }

    setLinkingLoading(false);
  }

  async function loadBillingHistory() {
    setBillingLoading(true);
    try {
      const history = await getBillingHistory();
      setBillingHistory(history.charges || []);
    } catch (error) {
      console.error('Load billing history error:', error);
      setMessage('❌ Failed to load billing history: ' + error.message);
    }
    setBillingLoading(false);
  }

  async function handleCancelSubscription() {
    if (loading) return;
    setLoading(true);
    setMessage('');

    try {
      const result = await cancelSubscription();
      setMessage('✅ ' + result.message);
      setShowCancelConfirm(false);
      
      // Refresh user data to reflect subscription changes
      if (onRefreshUser) {
        onRefreshUser();
      }
    } catch (error) {
      console.error('Cancel subscription error:', error);
      setMessage('❌ ' + error.message);
    }

    setLoading(false);
  }

  function isEmailPasswordUser() {
    // Check if user signed up with email/password (not OAuth)
    return user?.providerData?.some(provider => provider.providerId === 'password');
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
                  <div className="flex items-center gap-2">
                    <span className="text-white">{user?.email}</span>
                    {isEmailPasswordUser() && (
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        user?.emailVerified || emailVerified
                          ? 'bg-green-900 text-green-200' 
                          : 'bg-red-900 text-red-200'
                      }`}>
                        {user?.emailVerified || emailVerified ? '✓ Verified' : '⚠ Unverified'}
                      </span>
                    )}
                  </div>
                  {isEmailPasswordUser() && !(user?.emailVerified || emailVerified) && (
                    <div className="mt-2 flex gap-2">
                      <button
                        onClick={handleSendVerification}
                        disabled={verificationLoading}
                        className="text-orange-400 hover:text-orange-300 disabled:opacity-50 text-sm transition-colors"
                      >
                        {verificationLoading ? 'Sending...' : 'Send Verification Email'}
                      </button>
                      <button
                        onClick={handleCheckVerification}
                        disabled={verificationLoading}
                        className="text-blue-400 hover:text-blue-300 disabled:opacity-50 text-sm transition-colors"
                      >
                        {verificationLoading ? 'Checking...' : 'Check Status'}
                      </button>
                    </div>
                  )}
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
                  <div>
                    {!showCancelConfirm ? (
                      <button
                        onClick={() => setShowCancelConfirm(true)}
                        disabled={loading}
                        className="w-full py-2 text-red-400 hover:text-red-300 disabled:opacity-50 transition-colors"
                      >
                        Cancel Subscription
                      </button>
                    ) : (
                      <div className="p-4 bg-red-900/30 border border-red-500 rounded-lg">
                        <div className="text-white font-medium mb-2">Cancel Subscription?</div>
                        <div className="text-gray-300 text-sm mb-3">
                          Your subscription will remain active until the end of your current billing period.
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={handleCancelSubscription}
                            disabled={loading}
                            className="flex-1 py-2 bg-red-600 hover:bg-red-500 disabled:bg-gray-500 rounded-lg text-white font-semibold transition-colors"
                          >
                            {loading ? 'Cancelling...' : 'Yes, Cancel'}
                          </button>
                          <button
                            onClick={() => setShowCancelConfirm(false)}
                            disabled={loading}
                            className="flex-1 py-2 bg-gray-600 hover:bg-gray-500 disabled:bg-gray-700 rounded-lg text-white transition-colors"
                          >
                            Keep Subscription
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                </div>
              </div>
            </div>

            {/* Billing History */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-orange-400">Billing History</h2>
                <button
                  onClick={loadBillingHistory}
                  disabled={billingLoading}
                  className="text-orange-400 hover:text-orange-300 disabled:opacity-50 text-sm transition-colors"
                >
                  {billingLoading ? 'Loading...' : 'Refresh'}
                </button>
              </div>

              {billingHistory.length > 0 ? (
                <div className="space-y-3">
                  {billingHistory.map((charge) => (
                    <div key={charge.id} className="flex justify-between items-center p-4 bg-gray-700 rounded-lg">
                      <div>
                        <div className="text-white font-medium">{charge.description}</div>
                        <div className="text-gray-400 text-sm">
                          {new Date(charge.created).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-white font-medium">
                          ${(charge.amount / 100).toFixed(2)} {charge.currency.toUpperCase()}
                        </div>
                        <div className={`text-xs px-2 py-1 rounded-full inline-block ${
                          charge.status === 'succeeded' 
                            ? 'bg-green-900 text-green-200' 
                            : 'bg-red-900 text-red-200'
                        }`}>
                          {charge.status}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  {billingLoading ? (
                    <div className="text-gray-400">Loading billing history...</div>
                  ) : (
                    <div className="text-gray-400">No billing history found</div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}


        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h2 className="text-xl font-semibold text-orange-400 mb-4">Account Settings</h2>
              
              <div className="space-y-4">
                {/* Linked Accounts Section */}
                <div className="py-3 border-b border-gray-700">
                  <div className="text-white font-medium mb-3">Linked Accounts</div>
                  <div className="space-y-2 mb-4">
                    {linkedProviders.map((provider, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                        <div className="flex items-center gap-3">
                          {provider.providerId === 'google.com' && (
                            <div className="w-6 h-6">
                              <svg viewBox="0 0 24 24" className="w-full h-full">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                <path fill="#FBBC04" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                              </svg>
                            </div>
                          )}
                          {provider.providerId === 'password' && (
                            <div className="w-6 h-6 text-orange-400">
                              📧
                            </div>
                          )}
                          <div>
                            <div className="text-white text-sm font-medium">
                              {provider.providerId === 'google.com' ? 'Google' : 'Email/Password'}
                            </div>
                            <div className="text-gray-400 text-xs">{provider.email}</div>
                          </div>
                        </div>
                        <div className="text-green-400 text-sm">✓ Linked</div>
                      </div>
                    ))}
                  </div>

                  {/* Add Account Buttons */}
                  <div className="space-y-3">
                    {!linkedProviders.some(p => p.providerId === 'google.com') && (
                      <button
                        onClick={handleLinkGoogle}
                        disabled={linkingLoading}
                        className="w-full p-3 bg-white hover:bg-gray-100 disabled:bg-gray-600 rounded-lg text-gray-900 font-semibold transition-colors flex items-center justify-center gap-2"
                      >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#FBBC04" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        {linkingLoading ? 'Linking...' : 'Link Google Account'}
                      </button>
                    )}

                    {!linkedProviders.some(p => p.providerId === 'password') && (
                      <div>
                        {!showLinkEmailForm ? (
                          <button
                            onClick={() => setShowLinkEmailForm(true)}
                            disabled={linkingLoading}
                            className="w-full p-3 bg-orange-600 hover:bg-orange-500 disabled:bg-gray-600 rounded-lg text-white font-semibold transition-colors"
                          >
                            Link Email/Password Account
                          </button>
                        ) : (
                          <form onSubmit={handleLinkEmail} className="space-y-3 p-4 bg-gray-700 rounded-lg">
                            <div className="text-white font-medium mb-3">Add Email/Password Authentication</div>
                            <input
                              type="email"
                              placeholder="Email Address"
                              value={linkEmailData.email}
                              onChange={(e) => setLinkEmailData(prev => ({ ...prev, email: e.target.value }))}
                              className="w-full p-3 bg-gray-600 border border-gray-500 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-500"
                              required
                            />
                            <input
                              type="password"
                              placeholder="Password (min 6 characters)"
                              value={linkEmailData.password}
                              onChange={(e) => setLinkEmailData(prev => ({ ...prev, password: e.target.value }))}
                              className="w-full p-3 bg-gray-600 border border-gray-500 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-500"
                              required
                              minLength={6}
                            />
                            <input
                              type="password"
                              placeholder="Confirm Password"
                              value={linkEmailData.confirmPassword}
                              onChange={(e) => setLinkEmailData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                              className="w-full p-3 bg-gray-600 border border-gray-500 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-500"
                              required
                            />
                            <div className="flex gap-2">
                              <button
                                type="submit"
                                disabled={linkingLoading}
                                className="flex-1 p-3 bg-orange-600 hover:bg-orange-500 disabled:bg-gray-500 rounded-lg text-white font-semibold transition-colors"
                              >
                                {linkingLoading ? 'Linking...' : 'Link Account'}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setShowLinkEmailForm(false);
                                  setLinkEmailData({ email: '', password: '', confirmPassword: '' });
                                }}
                                disabled={linkingLoading}
                                className="px-4 py-3 bg-gray-600 hover:bg-gray-500 disabled:bg-gray-700 rounded-lg text-white transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </form>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {isEmailPasswordUser() ? (
                  <div className="py-3 border-b border-gray-700">
                    <div className="text-white font-medium mb-4">Change Password</div>
                    <form onSubmit={handleChangePassword} className="space-y-4">
                      <input
                        type="password"
                        placeholder="Current Password"
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                        className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-500"
                        required
                        disabled={loading}
                      />
                      <input
                        type="password"
                        placeholder="New Password"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                        className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-500"
                        required
                        minLength={6}
                        disabled={loading}
                      />
                      <input
                        type="password"
                        placeholder="Confirm New Password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-500"
                        required
                        disabled={loading}
                      />
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-orange-600 hover:bg-orange-500 disabled:bg-gray-600 rounded-lg text-white font-semibold transition-colors"
                      >
                        {loading ? 'Updating...' : 'Update Password'}
                      </button>
                    </form>
                  </div>
                ) : (
                  <div className="flex justify-between items-center py-3 border-b border-gray-700">
                    <div>
                      <div className="text-white font-medium">Change Password</div>
                      <div className="text-gray-400 text-sm">
                        {user?.providerData?.find(p => p.providerId === 'google.com') 
                          ? 'Password managed by Google. Change it in your Google account.'
                          : 'Password managed by your OAuth provider.'
                        }
                      </div>
                    </div>
                    <div className="text-gray-500 text-sm">
                      OAuth User
                    </div>
                  </div>
                )}

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