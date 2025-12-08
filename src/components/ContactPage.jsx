import { useState, useEffect } from 'react';

function ContactPage({ onBack }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Call Firebase function to send email
      const response = await fetch('https://us-central1-sayeasy-cf237.cloudfunctions.net/sendContactEmail', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        setSubmitMessage('Thank you for your message! We\'ll get back to you soon.');
        setFormData({ name: '', email: '', subject: '', message: '' });
      } else {
        throw new Error(result.error || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error sending contact form:', error);
      setSubmitMessage('Sorry, there was an error sending your message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white flex flex-col scrollable-page">
      {/* Header with Back Button */}
      <header className="bg-gradient-to-r from-purple-700 via-blue-600 to-purple-700 py-6 px-6 shadow-lg">
        <div className="max-w-6xl mx-auto flex items-center">
          <button
            onClick={onBack}
            className="mr-6 p-2 text-white hover:text-yellow-300 transition-colors"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 
            className="text-4xl md:text-5xl font-bold tracking-tight"
            style={{ fontFamily: "'Quicksand', sans-serif" }}
          >
            <span className="text-white">Contact </span>
            <span className="text-yellow-300">SayEasy</span>
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 md:px-8 py-8">
        <div className="max-w-4xl mx-auto">
          
          {/* About Section */}
          <section className="bg-gray-800 rounded-2xl p-6 md:p-8 shadow-xl border border-gray-700 mb-8">
            <div className="flex items-center mb-6">
              <span className="text-4xl mr-4">🏙️</span>
              <h2 
                className="text-2xl md:text-3xl font-bold text-blue-300"
                style={{ fontFamily: "'Quicksand', sans-serif" }}
              >
                About SayEasy
              </h2>
            </div>
            <div className="text-gray-300 space-y-4">
              <p className="text-lg">
                SayEasy is a Portland, Oregon-based communication platform designed to provide 
                stable, accessible communication tools for users with diverse needs.
              </p>
              <p>
                Our mission is to create technology that empowers communication while maintaining 
                simplicity and reliability. We believe that everyone deserves access to tools that 
                help them express themselves clearly and confidently.
              </p>
              <p>
                Whether you're a caregiver setting up communication tools or someone looking for 
                an accessible way to communicate, SayEasy is here to help bridge that gap with 
                thoughtful design and user-centered features.
              </p>
            </div>
          </section>

          <div className="grid gap-8 md:grid-cols-2">
            
            {/* Contact Form */}
            <section className="bg-gray-800 rounded-2xl p-6 md:p-8 shadow-xl border border-gray-700">
              <div className="flex items-center mb-6">
                <span className="text-4xl mr-4">📝</span>
                <h2 
                  className="text-2xl md:text-3xl font-bold text-purple-300"
                  style={{ fontFamily: "'Quicksand', sans-serif" }}
                >
                  Send us a Message
                </h2>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                    Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Your full name"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="your@email.com"
                  />
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-300 mb-2">
                    Subject *
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    required
                    value={formData.subject}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="What's this about?"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-300 mb-2">
                    Message *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    required
                    rows={6}
                    value={formData.message}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                    placeholder="Tell us about your feedback, question, or how we can help..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-500 hover:to-blue-400 disabled:from-gray-600 disabled:to-gray-500 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-105 disabled:scale-100 shadow-lg"
                >
                  {isSubmitting ? 'Sending...' : 'Send Message'}
                </button>

                {submitMessage && (
                  <div className={`p-4 rounded-xl ${submitMessage.includes('error') 
                    ? 'bg-red-900/50 text-red-200 border border-red-800' 
                    : 'bg-green-900/50 text-green-200 border border-green-800'
                  }`}>
                    {submitMessage}
                  </div>
                )}
              </form>
            </section>

            {/* Contact Info */}
            <section className="bg-gray-800 rounded-2xl p-6 md:p-8 shadow-xl border border-gray-700">
              <div className="flex items-center mb-6">
                <span className="text-4xl mr-4">💬</span>
                <h2 
                  className="text-2xl md:text-3xl font-bold text-green-300"
                  style={{ fontFamily: "'Quicksand', sans-serif" }}
                >
                  Get in Touch
                </h2>
              </div>
              
              <div className="space-y-6 text-gray-300">
                <div>
                  <h3 className="font-semibold text-white mb-2">We'd Love to Hear From You</h3>
                  <p>
                    Whether you have feedback, questions about features, or need support 
                    setting up SayEasy for your needs, we're here to help.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-white mb-2">What to Include</h3>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <span className="text-green-400 mr-2">•</span>
                      <span>Feature requests or suggestions</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-400 mr-2">•</span>
                      <span>Technical issues or bugs</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-400 mr-2">•</span>
                      <span>Setup questions</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-400 mr-2">•</span>
                      <span>General feedback about your experience</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-white mb-2">Response Time</h3>
                  <p>
                    We typically respond within 1-2 business days. For urgent technical 
                    issues, please include "URGENT" in your subject line.
                  </p>
                </div>

                <div className="pt-6 border-t border-gray-600">
                  <p className="text-sm text-gray-400">
                    <span className="font-semibold text-white">SayEasy Team</span><br />
                    Portland, Oregon<br />
                    sayeasyteam@gmail.com
                  </p>
                </div>
              </div>
            </section>

          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 border-t border-gray-700 py-4 px-6">
        <div className="max-w-5xl mx-auto text-center">
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

export default ContactPage;