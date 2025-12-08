import { useState } from 'react';

export default function SupportWidget({ user }) {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.displayName || '',
    email: user?.email || '',
    subject: '',
    message: '',
    category: 'general'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const categories = [
    { value: 'general', label: '💬 General Question' },
    { value: 'technical', label: '🔧 Technical Issue' },
    { value: 'billing', label: '💳 Billing & Subscription' },
    { value: 'feedback', label: '💡 Feedback & Suggestions' },
    { value: 'bug', label: '🐛 Bug Report' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // In a real implementation, you'd send to your support system
      // For now, we'll simulate sending an email
      const supportData = {
        ...formData,
        userId: user?.uid || 'anonymous',
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      };

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('Support ticket:', supportData);
      
      setIsSubmitted(true);
      
      // Reset form after 3 seconds
      setTimeout(() => {
        setIsSubmitted(false);
        setIsOpen(false);
        setFormData({
          name: user?.displayName || '',
          email: user?.email || '',
          subject: '',
          message: '',
          category: 'general'
        });
      }, 3000);
      
    } catch (error) {
      console.error('Error submitting support request:', error);
      alert('Failed to send message. Please try again or email us directly at support@sayeasy.org');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (isSubmitted) {
    return (
      <div className="fixed bottom-6 right-6 bg-green-600 text-white rounded-lg shadow-lg p-4 max-w-sm">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
          <div>
            <div className="font-semibold">Message Sent!</div>
            <div className="text-sm opacity-90">We'll get back to you within 24 hours.</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Support Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 bg-orange-600 hover:bg-orange-500 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-105 z-40"
        aria-label="Contact Support"
      >
        {isOpen ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        )}
      </button>

      {/* Support Panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 bg-white rounded-lg shadow-xl border border-gray-200 w-96 max-h-[500px] z-50">
          <div className="bg-orange-600 text-white p-4 rounded-t-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">SayEasy Support</h3>
                <p className="text-sm opacity-90">How can we help you today?</p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-4 space-y-4 max-h-96 overflow-y-auto">
            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What can we help with?
              </label>
              <select
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
              >
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                required
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                required
              />
            </div>

            {/* Subject */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => handleInputChange('subject', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                required
              />
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
              <textarea
                value={formData.message}
                onChange={(e) => handleInputChange('message', e.target.value)}
                rows={4}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500 resize-none"
                placeholder="Please describe your question or issue..."
                required
              />
            </div>

            {/* Submit */}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-orange-600 hover:bg-orange-500 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                {isSubmitting ? 'Sending...' : 'Send Message'}
              </button>
            </div>
          </form>

          {/* Footer */}
          <div className="px-4 pb-4">
            <div className="text-xs text-gray-500 text-center">
              Or email us directly at{' '}
              <a href="mailto:support@sayeasy.org" className="text-orange-600 hover:underline">
                support@sayeasy.org
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}