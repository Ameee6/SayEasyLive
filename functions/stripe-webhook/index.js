// functions/stripe-webhook/index.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2022-11-15' });

admin.initializeApp();
const db = admin.firestore();

exports.stripeWebhook = functions.https.onRequest(async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const stripeCustomerId = session.customer;
      const subscriptionId = session.subscription;
      const users = await db.collection('users').where('stripeCustomerId', '==', stripeCustomerId).limit(1).get();
      if (!users.empty) {
        const uid = users.docs[0].id;
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        await db.collection('subscriptions').doc(subscription.id).set({
          userId: uid,
          stripeCustomerId,
          stripeSubscriptionId: subscription.id,
          priceId: subscription.items.data[0].price.id,
          status: subscription.status,
          currentPeriodStart: admin.firestore.Timestamp.fromMillis(subscription.current_period_start * 1000),
          currentPeriodEnd: admin.firestore.Timestamp.fromMillis(subscription.current_period_end * 1000),
          cancelAtPeriodEnd: subscription.cancel_at_period_end || false,
          rawEvent: event,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
      }
    }

    if (event.type.startsWith('invoice.') || event.type.startsWith('customer.subscription.')) {
      const subObj = event.data.object;
      const stripeSubId = subObj.id || subObj.subscription;
      const subscription = await stripe.subscriptions.retrieve(stripeSubId);
      const users = await db.collection('users').where('stripeCustomerId', '==', subscription.customer).limit(1).get();
      if (!users.empty) {
        const uid = users.docs[0].id;
        await db.collection('subscriptions').doc(subscription.id).set({
          userId: uid,
          stripeCustomerId: subscription.customer,
          stripeSubscriptionId: subscription.id,
          priceId: subscription.items.data[0].price.id,
          status: subscription.status,
          currentPeriodStart: admin.firestore.Timestamp.fromMillis(subscription.current_period_start * 1000),
          currentPeriodEnd: admin.firestore.Timestamp.fromMillis(subscription.current_period_end * 1000),
          cancelAtPeriodEnd: subscription.cancel_at_period_end || false,
          rawEvent: event,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
      }
    }

    res.json({ received: true });
  } catch (err) {
    console.error('Webhook processing error', err);
    res.status(500).send();
  }
});
