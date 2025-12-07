import { useState } from 'react';
import { signOut } from '../auth';
import { startFreeTrial, getTrialStatus, formatTrialEndDate } from '../lib/trial';
import { createCheckoutSession } from '../lib/stripe';

export default function UserDashboard({ user, userProfile, userTier, onClose, onStartTrial }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  async function handleSignOut() {
    if (loading) return;
    setLoading(true);
    try {
      await signOut();
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleStartTrial() {
    if (!user?.uid) return;
    
    setLoading(true);
    setMessage('Starting your free trial...');
    
    try {
      const result = await startFreeTrial(user.uid);
      
      if (result.success) {
        setMessage(`✨ Free trial started! You now have access to 10 custom scroll cards until ${formatTrialEndDate(result.trialEnds.toISOString())}.`);
        
        // Call the callback to refresh user data
        if (onStartTrial) {
          await onStartTrial();
        }
        
        // Let user manually close - no auto-close
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
      // Redirect to Stripe Checkout
      window.location.href = url;
    } catch (error) {
      setMessage('Error creating checkout session: ' + error.message);
      setLoading(false);
    }
  }

  function getSubscriptionStatus() {
    if (!userTier) return { status: 'Loading...', description: '' };

    // Get trial status for trial users
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
          billing: 'Next billing: [Date]' // TODO: Get actual billing date
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
    <div className="fixed inset-0 bg-purple-100 bg-opacity-80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-md border border-gray-700 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">My Account</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        {/* User Info */}
        <div className="mb-6 p-4 bg-gray-700 rounded-lg">
          <div className="text-white font-semibold mb-2">
            {userProfile?.fullName || user?.displayName || 'User'}
          </div>
          <div className="text-gray-300 text-sm">
            {user?.email}
          </div>
        </div>

        {/* Subscription Status */}
        <div className="mb-6 p-4 bg-gray-700 rounded-lg">
          <h3 className="text-white font-semibold mb-3">Subscription</h3>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Status:</span>
              <span className="text-white font-medium">{subscription.status}</span>
            </div>
            
            <div className="text-gray-400 text-sm">
              {subscription.description}
            </div>

            {subscription.expires && (
              <div className="text-yellow-400 text-sm">
                {subscription.expires}
              </div>
            )}

            {subscription.expiryDate && (
              <div className="text-gray-400 text-xs">
                Expires: {subscription.expiryDate}
              </div>
            )}

            {subscription.billing && (
              <div className="text-gray-400 text-sm">
                {subscription.billing}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="mt-4 space-y-2">
            {subscription.action === 'Start Free Trial' && (
              <button
                onClick={handleStartTrial}
                disabled={loading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 rounded-lg text-white font-semibold transition-colors"
              >
                {loading ? 'Starting Trial...' : '✨ Start 2-Week Free Trial'}
              </button>
            )}

            {userTier?.tier === 'trial' && (
              <div className="text-center">
                <div className="text-gray-400 text-sm mb-2">
                  Enjoying your trial?
                </div>
                <button
                  onClick={handleSubscribe}
                  disabled={loading}
                  className="py-2 px-4 bg-green-600 hover:bg-green-500 disabled:bg-gray-600 rounded-lg text-white font-semibold transition-colors"
                >
                  {loading && message.includes('payment') ? 'Redirecting...' : 'Subscribe Now ($12.99/year)'}
                </button>
              </div>
            )}

            {userTier?.tier === 'premium' && (
              <button
                disabled={loading}
                className="w-full py-2 text-red-400 hover:text-red-300 disabled:opacity-50 transition-colors text-sm"
              >
                Cancel Subscription
              </button>
            )}
          </div>
        </div>

        {/* Feature Summary */}
        <div className="mb-6 p-4 bg-gray-700 rounded-lg">
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

        {/* Messages */}
        {message && (
          <div className={`mb-4 p-3 rounded-lg text-center ${
            message.includes('✨') || message.includes('started') 
              ? 'bg-green-900 text-green-200' 
              : message.includes('Error')
              ? 'bg-red-900 text-red-200'
              : 'bg-yellow-900 text-yellow-200'
          }`}>
            {message}
          </div>
        )}

        {/* Sign Out */}
        <button
          onClick={handleSignOut}
          disabled={loading}
          className="w-full py-3 bg-gray-600 hover:bg-gray-500 disabled:bg-gray-700 rounded-lg text-gray-300 transition-colors"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}