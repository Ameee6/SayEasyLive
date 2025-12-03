// src/adminTools.js
// Admin functions for managing user tiers
// IMPORTANT: In production, these should be protected by Firebase Admin SDK
// For now, you can use these from browser console or a protected admin page

import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "./firebase-config";
import { TIERS } from "./tierManager";

/**
 * Grant founding member status to a user by email
 * NOTE: You'll need to look up their UID first or use this after they've signed up
 * @param {string} userId - Firebase user ID (UID)
 * @param {string} reason - Optional reason for granting (for your records)
 */
export async function grantFoundingTier(userId, reason = "Founding member") {
  try {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      throw new Error(`User ${userId} not found`);
    }

    await updateDoc(userRef, {
      tier: TIERS.FOUNDING,
      grantedByAdmin: true,
      grantReason: reason,
      grantedAt: new Date().toISOString(),
    });

    console.log(`✅ Granted founding tier to user ${userId}`);
    return { success: true, userId };
  } catch (error) {
    console.error("Error granting founding tier:", error);
    throw error;
  }
}

/**
 * Grant founding tier to multiple users at once
 * @param {Array<string>} userIds - Array of Firebase user IDs
 * @param {string} reason - Reason for granting
 */
export async function grantFoundingTierBulk(userIds, reason = "Founding member") {
  const results = [];

  for (const userId of userIds) {
    try {
      await grantFoundingTier(userId, reason);
      results.push({ userId, success: true });
    } catch (error) {
      results.push({ userId, success: false, error: error.message });
    }
  }

  console.log("Bulk grant results:", results);
  return results;
}

/**
 * Update a user's tier
 * @param {string} userId - Firebase user ID
 * @param {string} newTier - One of: 'free', 'founding', 'premium'
 */
export async function updateUserTier(userId, newTier) {
  if (!Object.values(TIERS).includes(newTier)) {
    throw new Error(`Invalid tier: ${newTier}. Must be one of: ${Object.values(TIERS).join(', ')}`);
  }

  try {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      tier: newTier,
      tierUpdatedAt: new Date().toISOString(),
    });

    console.log(`✅ Updated user ${userId} to ${newTier} tier`);
    return { success: true, userId, tier: newTier };
  } catch (error) {
    console.error("Error updating tier:", error);
    throw error;
  }
}

/**
 * Get user profile by UID (helper for admin)
 * @param {string} userId - Firebase user ID
 */
export async function getUserProfile(userId) {
  try {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      throw new Error(`User ${userId} not found`);
    }

    return userSnap.data();
  } catch (error) {
    console.error("Error getting user profile:", error);
    throw error;
  }
}

// Instructions for using these functions:
//
// 1. Open your app in the browser and sign in as yourself
// 2. Open browser console (F12)
// 3. Import these functions:
//    import * as admin from './adminTools.js'
//
// 4. To grant founding tier to your client's family:
//    First, have them sign up, then get their UID from Firebase Console → Authentication
//    Then run: admin.grantFoundingTier('their-uid', 'Family member')
//
// 5. To grant to multiple users:
//    admin.grantFoundingTierBulk(['uid1', 'uid2', 'uid3'], 'Beta testers')
//
// 6. To check a user's profile:
//    admin.getUserProfile('their-uid')
