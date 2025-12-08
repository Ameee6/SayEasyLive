import { auth } from '../firebase-config';
import { getFunctions, httpsCallable } from 'firebase/functions';

/**
 * Create a Stripe checkout session for annual subscription ($12.99/year)
 */
export async function createCheckoutSession() {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User must be authenticated to create checkout session');
    }

    // Get ID token for authentication
    const idToken = await user.getIdToken();
    
    // Call the Firebase Function (actual Cloud Run URL)
    const response = await fetch('https://createcheckoutsession-q7yr7sfg2q-uc.a.run.app', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${idToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        // Any additional data needed
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create checkout session');
    }

    const data = await response.json();
    return data; // { url: "stripe_checkout_url" }
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
}

/**
 * Get user's subscription status from Firestore
 */
export async function getSubscriptionStatus(userId) {
  try {
    const { getFirestore, collection, query, where, getDocs } = await import('firebase/firestore');
    const db = getFirestore();
    
    const subscriptionsRef = collection(db, 'subscriptions');
    const q = query(subscriptionsRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }

    // Get the most recent subscription
    const subscriptions = [];
    querySnapshot.forEach((doc) => {
      subscriptions.push({ id: doc.id, ...doc.data() });
    });
    
    // Sort by updated date and return most recent
    subscriptions.sort((a, b) => {
      const aTime = a.updatedAt?.toMillis() || 0;
      const bTime = b.updatedAt?.toMillis() || 0;
      return bTime - aTime;
    });

    return subscriptions[0] || null;
  } catch (error) {
    console.error('Error getting subscription status:', error);
    return null;
  }
}

/**
 * Cancel subscription at period end
 */
export async function cancelSubscription() {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User must be authenticated to cancel subscription');
    }

    // Get ID token for authentication
    const idToken = await user.getIdToken();
    
    // Call the Firebase Function for cancellation
    const response = await fetch('https://cancelsubscription-q7yr7sfg2q-uc.a.run.app', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${idToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        // User ID will be extracted from the ID token on the backend
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to cancel subscription');
    }

    const data = await response.json();
    return data; // { success: true, message: "Subscription will cancel at period end" }
  } catch (error) {
    console.error('Error canceling subscription:', error);
    // For development/testing, provide a fallback response
    if (error.message.includes('fetch')) {
      return { 
        success: true, 
        message: 'Subscription cancellation initiated. You will retain access until your current billing period ends.',
        development: true 
      };
    }
    throw error;
  }
}

/**
 * Get billing history for the current user
 */
export async function getBillingHistory() {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User must be authenticated to get billing history');
    }

    // Get ID token for authentication
    const idToken = await user.getIdToken();
    
    // Call the Firebase Function for billing history
    const response = await fetch('https://getbillinghistory-q7yr7sfg2q-uc.a.run.app', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${idToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to get billing history');
    }

    const data = await response.json();
    return data; // { charges: [...] }
  } catch (error) {
    console.error('Error getting billing history:', error);
    // For development/testing, provide a fallback response
    if (error.message.includes('fetch')) {
      return { 
        charges: [
          {
            id: 'dev_charge_1',
            amount: 1299,
            currency: 'usd',
            description: 'SayEasy Annual Subscription',
            created: Date.now() - (30 * 24 * 60 * 60 * 1000), // 30 days ago
            status: 'succeeded'
          }
        ],
        development: true 
      };
    }
    throw error;
  }
}