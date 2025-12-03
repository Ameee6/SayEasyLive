# Firebase Auth + Stripe Checkout (SayEasy)

## Overview
- Email/password + Google sign-in
- Firestore collections: users, user_settings, subscriptions
- Firebase Cloud Functions: createCheckoutSession, stripeWebhook

## Setup Instructions

### 1. Create a Feature Branch

From your local repo root:

```bash
git checkout -b feature/firebase-auth
git add .
git commit -m "feat: add firebase auth + stripe checkout integration (email+Google)"
git push --set-upstream origin feature/firebase-auth
```

### 2. Open a Pull Request

Open a PR on GitHub from `feature/firebase-auth` → `main` (or your default branch).

**PR Checklist** (copy into PR description):

- [ ] Sign up/sign in (email) creates users/{uid}
- [ ] Google sign-in creates users/{uid}
- [ ] createCheckoutSession function returns a Checkout URL for authenticated users
- [ ] Stripe webhook upserts subscriptions document in Firestore on successful checkout

### 3. Deploy Firebase Functions

Install Firebase CLI and login:
```bash
npm i -g firebase-tools
firebase login
```

Initialize functions (if not already):
```bash
firebase init functions
# Choose Node 18
```

Set secrets (locally or via CLI):
```bash
firebase functions:config:set \
  stripe.secret="sk_test_..." \
  stripe.webhook_secret="whsec_..." \
  stripe.price_id="price_..." \
  app.base_url="https://your-app-domain.com"
```

Deploy:
```bash
firebase deploy --only functions
```

### 4. Configure Stripe

1. Create a yearly price ($12.99) in your Stripe dashboard
2. Configure webhook endpoint: `https://us-central1-<your-project>.cloudfunctions.net/stripeWebhook` (or the URL from your deployed function)
3. Set the signing secret in Firebase config

For local testing, use the Stripe CLI:
```bash
stripe listen --forward-to localhost:5001/<proj>/us-central1/stripeWebhook
```

## Environment Variables

Copy `.env.example` to `.env.local` and fill in your Firebase and Stripe credentials:

```bash
cp .env.example .env.local
```

**Note:** Never commit `.env.local` to version control!

## Using the Auth System

### Sign In Example

Import and use the authentication functions in your components:

```jsx
import { signUp, signInWithPassword, signInWithGoogle } from './auth';
```

See `src/examples/SignInExample.jsx` for a complete implementation.

### Account Management

See `src/examples/AccountExample.jsx` for how to:
- Check authentication state
- Display user profile information
- Sign out

## Firestore Security Rules

Deploy the security rules to Firebase:

```bash
firebase deploy --only firestore:rules
```

The rules ensure:
- Users can only read/write their own data
- Subscriptions are read-only for users (written by Cloud Functions)
