// src/auth.js

import { auth, db } from "./firebase-config";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";

const provider = new GoogleAuthProvider();

export async function signUp(email, password, fullName = "") {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  const user = cred.user;
  // create profile doc
  await setDoc(doc(db, "users", user.uid), {
    fullName,
    email: user.email,
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
