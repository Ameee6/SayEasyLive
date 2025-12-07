// src/lib/trial.js
// Trial management functions

import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase-config';
import { TIERS } from '../tierManager';

/**
 * Start a free trial for a user
 * @param {string} userId - User ID
 * @returns {Promise<Object>} { success: boolean, error?: string, trialEnds?: Date }
 */
export async function startFreeTrial(userId) {
  try {
    // Calculate trial end date (2 weeks from now)
    const trialStartDate = new Date();
    const trialEndDate = new Date();
    trialEndDate.setDate(trialStartDate.getDate() + 14);

    // Update user profile in Firestore
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      tier: TIERS.TRIAL,
      trialStartDate: trialStartDate.toISOString(),
      trialEndDate: trialEndDate.toISOString(),
      trialActive: true,
      grantedByAdmin: false,
      updatedAt: serverTimestamp()
    });

    return {
      success: true,
      trialEnds: trialEndDate
    };
  } catch (error) {
    console.error('Error starting trial:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Check if a user's trial has expired
 * @param {Object} userProfile - User profile from Firestore
 * @returns {boolean} true if trial has expired
 */
export function isTrialExpired(userProfile) {
  if (!userProfile?.trialEndDate || userProfile.tier !== TIERS.TRIAL) {
    return false;
  }

  const now = new Date();
  const trialEnd = new Date(userProfile.trialEndDate);
  return now > trialEnd;
}

/**
 * Get trial status for a user
 * @param {Object} userProfile - User profile from Firestore
 * @returns {Object} { isInTrial: boolean, daysLeft?: number, expired?: boolean }
 */
export function getTrialStatus(userProfile) {
  if (!userProfile || userProfile.tier !== TIERS.TRIAL) {
    return { isInTrial: false };
  }

  const now = new Date();
  const trialEnd = new Date(userProfile.trialEndDate);
  const timeDiff = trialEnd.getTime() - now.getTime();
  const daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24));

  if (daysLeft <= 0) {
    return { isInTrial: true, expired: true, daysLeft: 0 };
  }

  return { isInTrial: true, daysLeft };
}

/**
 * Convert expired trial users back to free tier
 * @param {string} userId - User ID
 * @returns {Promise<Object>} { success: boolean, error?: string }
 */
export async function expireTrial(userId) {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      tier: TIERS.FREE,
      trialActive: false,
      trialExpiredDate: new Date().toISOString(),
      updatedAt: serverTimestamp()
    });

    return { success: true };
  } catch (error) {
    console.error('Error expiring trial:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Format trial end date for display
 * @param {string} trialEndDate - ISO date string
 * @returns {string} Formatted date
 */
export function formatTrialEndDate(trialEndDate) {
  const date = new Date(trialEndDate);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}