// src/auth.js

import { auth, db } from "./firebase-config";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  deleteUser,
  updatePassword as firebaseUpdatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  sendPasswordResetEmail,
  sendEmailVerification,
  linkWithCredential,
  linkWithPopup,
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { TIERS } from "./tierManager";

const provider = new GoogleAuthProvider();

export async function signUp(email, password, fullName = "") {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  const user = cred.user;
  
  // Send email verification automatically
  try {
    await sendEmailVerification(user, {
      url: `${window.location.origin}/verify-success`,
      handleCodeInApp: false
    });
  } catch (verificationError) {
    console.error('Error sending verification email during signup:', verificationError);
    // Don't throw here - account creation should still succeed
  }
  
  // create profile doc with default free tier
  await setDoc(doc(db, "users", user.uid), {
    fullName,
    email: user.email,
    tier: TIERS.FREE,
    grantedByAdmin: false,
    createdAt: serverTimestamp(),
  });
  
  return user;
}

export async function signInWithPassword(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function signInWithGoogle() {
  const result = await signInWithPopup(auth, provider);
  const user = result.user;
  // ensure profile exists
  const ref = doc(db, "users", user.uid);
  const snapshot = await getDoc(ref);
  if (!snapshot.exists()) {
    await setDoc(ref, {
      fullName: user.displayName || "",
      email: user.email,
      avatarUrl: user.photoURL || "",
      tier: TIERS.FREE,
      grantedByAdmin: false,
      createdAt: serverTimestamp(),
    });
  }
  return user;
}

export async function signOut() {
  return await firebaseSignOut(auth);
}

export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback);
}

export async function getProfile(uid) {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? snap.data() : null;
}

export async function updateProfile(uid, updates) {
  const userRef = doc(db, "users", uid);
  await setDoc(userRef, updates, { merge: true });
  return { success: true };
}

export async function updatePassword(currentPassword, newPassword) {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('No user is currently signed in');
  }

  if (!user.email) {
    throw new Error('Cannot change password for OAuth users. Please use your OAuth provider to change your password.');
  }

  try {
    // Reauthenticate user with current password
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);
    
    // Update to new password
    await firebaseUpdatePassword(user, newPassword);
    
    return { success: true };
  } catch (error) {
    console.error('Error updating password:', error);
    if (error.code === 'auth/wrong-password') {
      throw new Error('Current password is incorrect.');
    } else if (error.code === 'auth/weak-password') {
      throw new Error('New password is too weak. Please choose a stronger password.');
    } else if (error.code === 'auth/requires-recent-login') {
      throw new Error('Please sign out and sign back in before changing your password.');
    }
    throw error;
  }
}

export async function resetPassword(email) {
  try {
    await sendPasswordResetEmail(auth, email, {
      url: `${window.location.origin}/reset-success`, // Custom success page
      handleCodeInApp: false
    });
    return { success: true };
  } catch (error) {
    console.error('Error sending password reset email:', error);
    if (error.code === 'auth/user-not-found') {
      throw new Error('No account found with this email address.');
    } else if (error.code === 'auth/invalid-email') {
      throw new Error('Please enter a valid email address.');
    } else if (error.code === 'auth/too-many-requests') {
      throw new Error('Too many password reset requests. Please wait before trying again.');
    }
    throw error;
  }
}

export async function sendVerificationEmail() {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('No user is currently signed in');
  }

  if (user.emailVerified) {
    throw new Error('Email is already verified');
  }

  if (!user.email) {
    throw new Error('Cannot send verification email for OAuth users');
  }

  try {
    await sendEmailVerification(user, {
      url: `${window.location.origin}/verify-success`, // Custom success page
      handleCodeInApp: false
    });
    return { success: true };
  } catch (error) {
    console.error('Error sending verification email:', error);
    if (error.code === 'auth/too-many-requests') {
      throw new Error('Too many verification emails sent. Please wait before requesting another.');
    }
    throw error;
  }
}

export async function reloadUser() {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('No user is currently signed in');
  }
  
  try {
    await user.reload();
    return { success: true, emailVerified: user.emailVerified };
  } catch (error) {
    console.error('Error reloading user:', error);
    throw error;
  }
}

export async function linkGoogleAccount() {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('No user is currently signed in');
  }

  // Check if Google is already linked
  const isGoogleLinked = user.providerData.some(provider => provider.providerId === 'google.com');
  if (isGoogleLinked) {
    throw new Error('Google account is already linked to this account');
  }

  try {
    const result = await linkWithPopup(user, provider);
    return { success: true, user: result.user };
  } catch (error) {
    console.error('Error linking Google account:', error);
    if (error.code === 'auth/account-exists-with-different-credential') {
      throw new Error('This Google account is already linked to a different SayEasy account. Please sign in with that account instead.');
    } else if (error.code === 'auth/credential-already-in-use') {
      throw new Error('This Google account is already in use by another account.');
    } else if (error.code === 'auth/email-already-in-use') {
      throw new Error('The email address is already associated with another account.');
    }
    throw error;
  }
}

export async function linkEmailPassword(email, password) {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('No user is currently signed in');
  }

  // Check if email/password is already linked
  const isEmailLinked = user.providerData.some(provider => provider.providerId === 'password');
  if (isEmailLinked) {
    throw new Error('Email/password authentication is already linked to this account');
  }

  try {
    const credential = EmailAuthProvider.credential(email, password);
    const result = await linkWithCredential(user, credential);
    
    // Send verification email for the newly linked email
    try {
      await sendEmailVerification(result.user, {
        url: window.location.origin,
        handleCodeInApp: false
      });
    } catch (verificationError) {
      console.error('Error sending verification email after linking:', verificationError);
      // Don't throw here - linking was successful
    }
    
    return { success: true, user: result.user };
  } catch (error) {
    console.error('Error linking email/password:', error);
    if (error.code === 'auth/email-already-in-use') {
      throw new Error('This email address is already in use by another account.');
    } else if (error.code === 'auth/invalid-email') {
      throw new Error('Please enter a valid email address.');
    } else if (error.code === 'auth/weak-password') {
      throw new Error('Password should be at least 6 characters long.');
    }
    throw error;
  }
}

export function getLinkedProviders() {
  const user = auth.currentUser;
  if (!user) {
    return [];
  }
  
  return user.providerData.map(provider => ({
    providerId: provider.providerId,
    email: provider.email,
    displayName: provider.displayName
  }));
}

export async function deleteAccount() {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('No user is currently signed in');
  }

  try {
    // Delete user profile from Firestore
    await deleteDoc(doc(db, "users", user.uid));
    
    // Delete the Firebase Auth user account
    await deleteUser(user);
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting account:', error);
    throw error;
  }
}
