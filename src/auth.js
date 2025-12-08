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
