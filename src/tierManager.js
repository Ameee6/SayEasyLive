// src/tierManager.js
// Manage user tiers and feature limits

export const TIERS = {
  FOUNDING: 'founding',
  FREE: 'free',
  PREMIUM: 'premium',
};

export const TIER_LIMITS = {
  [TIERS.FOUNDING]: {
    customButtonLimit: 10,
    displayName: 'Founding Member',
    description: 'Full access forever - thank you for being here from the start!',
    features: [
      'All 10 buttons customizable',
      'All future features included',
      'Priority support',
    ],
  },
  [TIERS.FREE]: {
    customButtonLimit: 2,
    displayName: 'Free',
    description: 'Perfect for getting started',
    features: [
      '10 preset buttons',
      '2 customizable buttons',
      'All core features',
    ],
  },
  [TIERS.PREMIUM]: {
    customButtonLimit: 10,
    displayName: 'Premium',
    description: 'Unlock full customization',
    features: [
      'All 10 buttons customizable',
      'Future features included',
      'Support development',
    ],
  },
};

/**
 * Get the tier info for a user
 * @param {Object} profile - User profile from Firestore
 * @returns {Object} Tier information including limits
 */
export function getUserTier(profile) {
  const tier = profile?.tier || TIERS.FREE;
  return {
    tier,
    ...TIER_LIMITS[tier],
  };
}

/**
 * Check if user can add more custom cards
 * @param {Object} profile - User profile from Firestore
 * @param {number} currentCardCount - Current number of custom cards
 * @returns {boolean}
 */
export function canAddCustomCard(profile, currentCardCount) {
  const { customButtonLimit } = getUserTier(profile);
  return currentCardCount < customButtonLimit;
}

/**
 * Validate custom cards array against user's tier limit
 * @param {Object} profile - User profile from Firestore
 * @param {Array} customCards - Array of custom cards
 * @returns {Object} { valid: boolean, error: string|null, maxAllowed: number }
 */
export function validateCustomCards(profile, customCards) {
  const { customButtonLimit } = getUserTier(profile);
  const count = customCards?.length || 0;

  if (count > customButtonLimit) {
    return {
      valid: false,
      error: `You can only have ${customButtonLimit} custom buttons on your current plan.`,
      maxAllowed: customButtonLimit,
    };
  }

  return {
    valid: true,
    error: null,
    maxAllowed: customButtonLimit,
  };
}

/**
 * Check if user has premium features (founding or premium tier)
 * @param {Object} profile - User profile from Firestore
 * @returns {boolean}
 */
export function hasPremiumFeatures(profile) {
  const tier = profile?.tier || TIERS.FREE;
  return tier === TIERS.FOUNDING || tier === TIERS.PREMIUM;
}
