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
export async function cancelSubscription(subscriptionId) {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User must be authenticated to cancel subscription');
    }

    // This would need another Firebase Function to handle cancellation
    // For now, we'll just update the local data
    console.log('Cancellation requested for subscription:', subscriptionId);
    
    // TODO: Implement cancel subscription Firebase Function
    throw new Error('Subscription cancellation not yet implemented');
  } catch (error) {
    console.error('Error canceling subscription:', error);
    throw error;
  }
}