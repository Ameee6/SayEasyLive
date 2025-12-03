// functions/create-checkout-session/index.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const Stripe = require('stripe');

admin.initializeApp();
const db = admin.firestore();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2022-11-15' });

// HTTP function
exports.createCheckoutSession = functions.https.onRequest(async (req, res) => {
  try {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    const authHeader = req.get('Authorization') || '';
    const idToken = authHeader.replace('Bearer ', '');
    if (!idToken) return res.status(401).json({ error: 'Unauthorized' });

    const decoded = await admin.auth().verifyIdToken(idToken);
    const uid = decoded.uid;

    const userRef = db.collection('users').doc(uid);
    const userSnap = await userRef.get();
    if (!userSnap.exists) {
      await userRef.set({ createdAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
    }
    const userDoc = (await userRef.get()).data();

    let stripeCustomerId = userDoc?.stripeCustomerId;
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: decoded.email,
        metadata: { firebaseUid: uid },
      });
      stripeCustomerId = customer.id;
      await userRef.set({ stripeCustomerId }, { merge: true });
    }

    const priceId = process.env.STRIPE_PRICE_ID;
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer: stripeCustomerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.BASE_URL}/account?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.BASE_URL}/account?canceled=true`,
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('createCheckoutSession error:', err);
    res.status(500).json({ error: err.message });
  }
});
