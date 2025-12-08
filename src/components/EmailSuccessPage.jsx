import { useState, useEffect } from 'react';

export default function EmailSuccessPage({ type, onNavigateHome }) {
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => prev - 1);
    }, 1000);

    const redirect = setTimeout(() => {
      onNavigateHome();
    }, 5000);

    return () => {
      clearInterval(timer);
      clearTimeout(redirect);
    };
  }, [onNavigateHome]);

  const getContent = () => {
    switch (type) {
      case 'verify':
        return {
          title: '✅ Email Verified!',
          message: 'Your email has been successfully verified. You can now access all features of your SayEasy account.',
          subtitle: 'Welcome to SayEasy! 🎉'
        };
      case 'reset':
        return {
          title: '🔒 Password Reset Complete!',
          message: 'Your password has been successfully updated. You can now sign in with your new password.',
          subtitle: 'Your account is secure! 🛡️'
        };
      default:
        return {
          title: '✨ Success!',
          message: 'Your action has been completed successfully.',
          subtitle: 'Thank you for using SayEasy!'
        };
    }
  };

  const content = getContent();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-purple-800 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
        {/* Success Icon */}
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        {/* SayEasy Branding */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-orange-600">SayEasy</h1>
          <p className="text-gray-500 text-sm">Simple, Stable Communication</p>
        </div>

        {/* Success Content */}
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          {content.title}
        </h2>
        
        <p className="text-gray-600 mb-6">
          {content.message}
        </p>

        <div className="bg-orange-50 rounded-lg p-4 mb-6">
          <p className="text-orange-800 font-semibold">
            {content.subtitle}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={onNavigateHome}
            className="w-full bg-orange-600 hover:bg-orange-500 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Continue to SayEasy
          </button>
          
          <p className="text-sm text-gray-500">
            Redirecting automatically in {countdown} seconds...
          </p>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-400">
            Thanks for choosing SayEasy for your communication needs!
          </p>
        </div>
      </div>
    </div>
  );
}