import { useState, useEffect } from 'react';
import { signUp, signInWithPassword, signInWithGoogle, signOut } from '../auth';

export default function AuthButton({ user, userProfile, userTier, onRefreshUser, forceShowSignup, onModalClose }) {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('signin'); // 'signin' or 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const isAdmin = userProfile?.email === 'amyerdt6@gmail.com' || userProfile?.tier === 'admin';

  // Handle force show signup modal
  useEffect(() => {
    if (forceShowSignup) {
      setAuthMode('signup');
      setShowAuthModal(true);
    }
  }, [forceShowSignup]);

  async function handleSignUp(e) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setMessage('');
    
    try {
      await signUp(email, password, fullName);
      setMessage('Account created! Welcome to SayEasy!');
      setTimeout(() => setShowAuthModal(false), 1500);
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSignIn(e) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setMessage('');
    
    try {
      await signInWithPassword(email, password);
      setMessage('Welcome back!');
      setTimeout(() => setShowAuthModal(false), 1500);
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    if (loading) return;
    setLoading(true);
    setMessage('');
    
    try {
      await signInWithGoogle();
      setMessage('Welcome!');
      setTimeout(() => setShowAuthModal(false), 1500);
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSignOut() {
    if (loading) return;
    setLoading(true);
    try {
      await signOut();
      setMessage('');
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setEmail('');
    setPassword('');
    setFullName('');
    setMessage('');
    setLoading(false);
  }

  function openModal(mode) {
    setAuthMode(mode);
    setShowAuthModal(true);
    resetForm();
  }

  function closeModal() {
    setShowAuthModal(false);
    resetForm();
    // Notify parent that modal was closed (for force signup flow)
    if (onModalClose) {
      onModalClose();
    }
  }

  // If user is signed in, show account info
  if (user) {
    return (
      <>
        <div className="flex flex-col items-end gap-2">
          <div className="text-right">
            <div className="text-white text-sm font-semibold">
              {userProfile?.fullName || user.displayName || 'User'}
              {isAdmin && ' (Admin)'}
            </div>
            {userTier && (
              <div className="text-xs text-gray-300">
                {userTier.displayName}
                {userTier.tier === 'founding' && ' ⭐'}
              </div>
            )}
          </div>
          <div className="flex gap-3 text-sm">
            <button
              onClick={handleSignOut}
              disabled={loading}
              className="text-gray-400 hover:text-white transition-colors disabled:opacity-50"
            >
              Sign Out
            </button>
          </div>
        </div>


      </>
    );
  }

  // If user is not signed in, show sign-in options
  return (
    <>
      <div className="flex gap-4 text-gray-400 text-sm">
        <button
          onClick={() => openModal('signin')}
          className="hover:text-white transition-colors"
        >
          Sign In
        </button>
        <button
          onClick={() => openModal('signup')}
          className="hover:text-white transition-colors"
        >
          Create Account
        </button>
      </div>

      {/* Authentication Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-purple-100 bg-opacity-80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-md border border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">
                {authMode === 'signin' ? 'Sign In' : 'Create Account'}
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>

            <form onSubmit={authMode === 'signin' ? handleSignIn : handleSignUp} className="space-y-4">
              {authMode === 'signup' && (
                <input
                  type="text"
                  placeholder="Full Name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                />
              )}
              
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              />
              
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              />

              <button
                type="submit"
                disabled={loading}
                className="w-full p-3 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 rounded-lg text-white font-semibold transition-colors"
              >
                {loading ? 'Processing...' : (authMode === 'signin' ? 'Sign In' : 'Create Account')}
              </button>
            </form>

            <div className="my-4 text-center text-gray-400">or</div>

            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full p-3 bg-white hover:bg-gray-100 disabled:bg-gray-600 rounded-lg text-gray-900 font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC04" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>

            <div className="mt-4 text-center">
              <button
                onClick={() => setAuthMode(authMode === 'signin' ? 'signup' : 'signin')}
                className="text-blue-400 hover:text-blue-300 text-sm transition-colors"
              >
                {authMode === 'signin' ? "Don't have an account? Create one" : "Already have an account? Sign in"}
              </button>
            </div>

            {message && (
              <div className={`mt-4 p-3 rounded-lg text-center ${
                message.includes('Welcome') || message.includes('created') 
                  ? 'bg-green-900 text-green-200' 
                  : 'bg-red-900 text-red-200'
              }`}>
                {message}
              </div>
            )}

            <div className="mt-6 text-xs text-gray-400 text-center">
              <div className="mb-2 font-semibold text-gray-300">Account Benefits:</div>
              <div className="space-y-1">
                <div>• Save your settings across devices</div>
                <div>• Access from any tablet or computer</div>
                <div>• Free tier includes 2 custom buttons</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}