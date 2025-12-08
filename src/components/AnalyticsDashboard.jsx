import { useState, useEffect } from 'react';

export default function AnalyticsDashboard() {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [timeRange, setTimeRange] = useState('7d');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      // For now, load from localStorage (in production, this would be from your analytics service)
      const events = JSON.parse(localStorage.getItem('sayeasy_analytics_events') || '[]');
      
      // Filter by time range
      const now = Date.now();
      const timeFilter = {
        '1d': now - (24 * 60 * 60 * 1000),
        '7d': now - (7 * 24 * 60 * 60 * 1000),
        '30d': now - (30 * 24 * 60 * 60 * 1000)
      };
      
      const filteredEvents = events.filter(event => 
        event.timestamp >= timeFilter[timeRange]
      );

      // Process analytics
      const analytics = processEvents(filteredEvents);
      setAnalyticsData(analytics);
    } catch (error) {
      console.error('Error loading analytics:', error);
      setAnalyticsData(null);
    }
    setLoading(false);
  };

  const processEvents = (events) => {
    // Basic metrics
    const totalEvents = events.length;
    const uniqueSessions = new Set(events.map(e => e.sessionId)).size;
    const uniqueUsers = new Set(events.map(e => e.userId).filter(Boolean)).size;

    // Page views
    const pageViews = events.filter(e => e.event === 'page_view');
    const pageStats = pageViews.reduce((acc, event) => {
      acc[event.page] = (acc[event.page] || 0) + 1;
      return acc;
    }, {});

    // User actions
    const actions = events.filter(e => e.event === 'user_action');
    const actionStats = actions.reduce((acc, event) => {
      acc[event.action] = (acc[event.action] || 0) + 1;
      return acc;
    }, {});

    // Features used
    const features = events.filter(e => e.event === 'feature_used');
    const featureStats = features.reduce((acc, event) => {
      acc[event.feature] = (acc[event.feature] || 0) + 1;
      return acc;
    }, {});

    // Errors
    const errors = events.filter(e => e.event === 'error');

    // Session durations
    const sessions = events.filter(e => e.event === 'session_end');
    const avgSessionDuration = sessions.length > 0 
      ? sessions.reduce((sum, s) => sum + (s.duration || 0), 0) / sessions.length 
      : 0;

    return {
      overview: {
        totalEvents,
        uniqueSessions,
        uniqueUsers,
        avgSessionDuration
      },
      pageViews: pageStats,
      actions: actionStats,
      features: featureStats,
      errors: errors.length,
      errorDetails: errors.slice(-10) // Last 10 errors
    };
  };

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="text-gray-400">Loading analytics...</div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="p-6 text-center">
        <div className="text-gray-400">No analytics data available</div>
      </div>
    );
  }

  const { overview, pageViews, actions, features, errors, errorDetails } = analyticsData;

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-white">Analytics Dashboard</h3>
        <div className="flex gap-2">
          {[
            { value: '1d', label: '24h' },
            { value: '7d', label: '7 days' },
            { value: '30d', label: '30 days' }
          ].map(range => (
            <button
              key={range.value}
              onClick={() => setTimeRange(range.value)}
              className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                timeRange === range.value
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="text-2xl font-bold text-orange-400">{overview.uniqueUsers}</div>
          <div className="text-sm text-gray-400">Active Users</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="text-2xl font-bold text-blue-400">{overview.uniqueSessions}</div>
          <div className="text-sm text-gray-400">Sessions</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="text-2xl font-bold text-green-400">
            {Math.round(overview.avgSessionDuration / 1000 / 60)}m
          </div>
          <div className="text-sm text-gray-400">Avg Session</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="text-2xl font-bold text-purple-400">{overview.totalEvents}</div>
          <div className="text-sm text-gray-400">Total Events</div>
        </div>
      </div>

      {/* Page Views */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h4 className="text-lg font-semibold text-white mb-4">📄 Popular Pages</h4>
        <div className="space-y-2">
          {Object.entries(pageViews)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .map(([page, count]) => (
              <div key={page} className="flex justify-between items-center">
                <span className="text-gray-300 capitalize">{page}</span>
                <span className="text-orange-400 font-medium">{count} views</span>
              </div>
            ))}
        </div>
      </div>

      {/* User Actions */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h4 className="text-lg font-semibold text-white mb-4">🎯 User Actions</h4>
        <div className="space-y-2">
          {Object.entries(actions)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .map(([action, count]) => (
              <div key={action} className="flex justify-between items-center">
                <span className="text-gray-300">{action.replace(/_/g, ' ')}</span>
                <span className="text-blue-400 font-medium">{count}</span>
              </div>
            ))}
        </div>
      </div>

      {/* Feature Usage */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h4 className="text-lg font-semibold text-white mb-4">⚡ Feature Usage</h4>
        <div className="space-y-2">
          {Object.entries(features)
            .sort(([,a], [,b]) => b - a)
            .map(([feature, count]) => (
              <div key={feature} className="flex justify-between items-center">
                <span className="text-gray-300">{feature.replace(/_/g, ' ')}</span>
                <span className="text-green-400 font-medium">{count}</span>
              </div>
            ))}
        </div>
      </div>

      {/* Errors */}
      {errors > 0 && (
        <div className="bg-red-900/20 border border-red-800 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-red-300 mb-4">
            ⚠️ Recent Errors ({errors})
          </h4>
          <div className="space-y-2">
            {errorDetails.map((error, index) => (
              <div key={index} className="text-sm">
                <div className="text-red-400 font-medium">{error.error}</div>
                <div className="text-gray-500 text-xs">
                  {new Date(error.timestamp).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Privacy Notice */}
      <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
        <div className="text-sm text-gray-400">
          <strong className="text-gray-300">🔒 Privacy:</strong> All analytics data is anonymized. 
          No personal information is collected or stored. Users can opt out at any time.
        </div>
      </div>
    </div>
  );
}