# SayEasy Setup Guide - Firebase Auth + Tiers

This guide will walk you through setting up Firebase authentication with the tier system (Founding, Free, Premium).

## ✅ Step 1: Firebase Console Setup

### 1.1 Enable Authentication
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your **sayeasy-cf237** project
3. Click **Authentication** in the left menu
4. Click **Get Started** (if you haven't already)
5. Go to **Sign-in method** tab
6. Enable these providers:
   - ✅ **Email/Password** - Click "Enable" toggle and Save
   - ✅ **Google** - Click "Enable", add your support email, and Save

### 1.2 Create Firestore Database
1. Click **Firestore Database** in the left menu
2. Click **Create database**
3. Choose **Start in production mode**
4. Select location: **us-central** (or closest to you)
5. Click **Enable**

### 1.3 Deploy Security Rules
1. Once Firestore is created, click the **Rules** tab
2. Copy the entire contents of `firestore.rules` from your project
3. Paste it into the Firebase Console rules editor
4. Click **Publish**

**OR** use Firebase CLI:
```bash
npm install -g firebase-tools
firebase login
firebase deploy --only firestore:rules
```

## ✅ Step 2: Test the Setup

### 2.1 Run the Development Server
```bash
npm run dev
```

### 2.2 Test Authentication
1. Open your browser to the dev server URL (usually http://localhost:5173)
2. You can import the example components to test:

```jsx
// In your App.jsx temporarily
import SignInExample from './examples/SignInExample';
import AccountExample from './examples/AccountExample';

// Add to your render:
<SignInExample />
<AccountExample />
```

3. Try signing up with email/password
4. Try signing in with Google
5. Check that you see your account info with "Free" tier

## ✅ Step 3: Grant Founding Member Access

Your client's family and beta testers should get **Founding Member** status (free forever, all features).

### Method 1: Browser Console (Easiest)

1. Have the user sign up first
2. Go to Firebase Console → Authentication → Users
3. Copy their **User UID** (the long string)
4. Open your app in the browser
5. Open browser console (F12 or right-click → Inspect → Console)
6. Run these commands:

```javascript
// Import admin tools
import * as admin from './src/adminTools.js';

// Grant founding tier to one user
admin.grantFoundingTier('USER_UID_HERE', 'Family member');

// Or grant to multiple users at once
admin.grantFoundingTierBulk([
  'uid-of-family-member-1',
  'uid-of-family-member-2',
  'uid-of-beta-tester-1',
], 'Beta testers and family');

// Check a user's profile
admin.getUserProfile('USER_UID_HERE');
```

### Method 2: Firestore Console (Manual)

1. Go to Firebase Console → Firestore Database
2. Find the `users` collection
3. Click on the user's document (their UID)
4. Click **Edit field**
5. Change `tier` from `"free"` to `"founding"`
6. Change `grantedByAdmin` from `false` to `true`
7. Save

## ✅ Step 4: How the Tier System Works

### Tier Limits

| Tier | Custom Buttons | Price | Notes |
|------|----------------|-------|-------|
| **Founding** 🌟 | 10 / 10 | Free forever | Your client's family + early testers |
| **Free** | 2 / 10 | Free | Everyone gets this by default |
| **Premium** | 10 / 10 | $12.99/year | Paying subscribers |

### What Happens When Users Hit Limits

- Free users can customize 2 buttons
- If they try to save more than 2, they get an error: "You can only have 2 custom buttons on your current plan"
- The Firestore rules **enforce** these limits server-side
- The client code **validates** before saving (better UX)

## ✅ Step 5: Integrate with Your App

### Using the Settings Storage

Replace your current localStorage code with the new tier-aware version:

```jsx
import { saveSettings, loadSettings, checkCanAddCustomCard } from './settingsStorage';

// Save settings (automatically enforces tier limits)
const result = await saveSettings({
  customCards: [...],
  voicePreference: 'neutral',
  mode: 'custom'
});

if (!result.success) {
  if (result.needsUpgrade) {
    alert(`${result.error}\n\nUpgrade to Premium to customize all 10 buttons!`);
  } else {
    alert(result.error);
  }
}

// Load settings (tries Firestore first, falls back to localStorage)
const settings = await loadSettings();

// Check if user can add another custom card
const limit = await checkCanAddCustomCard();
if (limit.canAdd) {
  // Show "Add Card" button
} else {
  // Show upgrade prompt
  alert(`You're using ${limit.currentCount}/${limit.maxAllowed} custom buttons. Upgrade to add more!`);
}
```

### Checking User Tier

```jsx
import { getProfile } from './auth';
import { getUserTier, hasPremiumFeatures } from './tierManager';

const profile = await getProfile(auth.currentUser.uid);
const tierInfo = getUserTier(profile);

console.log(tierInfo.tier); // 'free', 'founding', or 'premium'
console.log(tierInfo.customButtonLimit); // 2 or 10

if (hasPremiumFeatures(profile)) {
  // Show premium features
}
```

## 🎯 Next Steps

1. ✅ Set up Firebase (Steps 1-2)
2. ✅ Test authentication
3. ✅ Grant founding tier to your client's family (Step 3)
4. 🔄 Integrate tier checks into your Settings component
5. 🔄 Add upgrade flow for free users
6. 🔄 Set up Stripe for premium subscriptions (see README_FIREBASE_AUTH.md)

## 🆘 Troubleshooting

**Problem:** "Firebase: Error (auth/popup-blocked)"
- **Solution:** Allow popups in your browser for Google sign-in

**Problem:** "Missing or insufficient permissions"
- **Solution:** Make sure you deployed the Firestore rules (Step 1.3)

**Problem:** User can't save more than 2 custom cards
- **Solution:** That's working as intended! Grant them founding tier or they need to upgrade

**Problem:** Admin tools not working in console
- **Solution:** Make sure you're using ES6 imports. If that doesn't work, you can manually edit the user's tier in Firestore Console (Method 2)

## 📝 Files Created

- `src/tierManager.js` - Tier logic and limits
- `src/adminTools.js` - Functions to grant founding tier
- `src/settingsStorage.js` - Firestore-based settings with tier validation
- `src/auth.js` - Updated to set default tier on signup
- `firestore.rules` - Updated with tier limit enforcement
- `src/examples/AccountExample.jsx` - Updated to show tier info

---

Questions? Check the detailed docs in `README_FIREBASE_AUTH.md`
