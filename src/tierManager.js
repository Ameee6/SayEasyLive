// src/tierManager.js
// Manage user tiers and feature limits

export const TIERS = {
  FOUNDING: 'founding',
  FREE: 'free',
  TRIAL: 'trial',
  PREMIUM: 'premium',
  ADMIN: 'admin',
};

export const TIER_LIMITS = {
  [TIERS.ADMIN]: {
    customScrollCardLimit: 10,
    displayName: 'Admin',
    description: 'Administrator access',
    features: [
      'All features',
      'User management',
      'Analytics',
      'Admin dashboard',
    ],
  },
  [TIERS.FOUNDING]: {
    customScrollCardLimit: 10,
    displayName: 'Founding Member',
    description: 'Full access forever - thank you for being here from the start!',
    features: [
      '2 main buttons (always customizable)',
      '10 preset cards',
      '10 custom scroll cards',
      'All future features included',
      'Priority support',
    ],
  },
  [TIERS.FREE]: {
    customScrollCardLimit: 0,
    displayName: 'Free',
    description: 'Perfect for getting started',
    features: [
      '2 main buttons (always customizable)',
      '10 preset cards',
      'All core features',
    ],
  },
  [TIERS.TRIAL]: {
    customScrollCardLimit: 10,
    displayName: 'Free Trial',
    description: 'Full access for 2 weeks',
    features: [
      '2 main buttons (always customizable)',
      '10 preset cards',
      '10 custom scroll cards',
      'All future features included',
      'No payment info required',
    ],
  },
  [TIERS.PREMIUM]: {
    customScrollCardLimit: 10,
    displayName: 'Premium',
    description: 'Unlock full customization',
    features: [
      '2 main buttons (always customizable)',
      '10 preset cards', 
      '10 custom scroll cards',
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
 * Check if user can add more custom scroll cards
 * @param {Object} profile - User profile from Firestore
 * @param {number} currentScrollCardCount - Current number of custom scroll cards
 * @returns {boolean}
 */
export function canAddCustomScrollCard(profile, currentScrollCardCount) {
  const { customScrollCardLimit } = getUserTier(profile);
  return currentScrollCardCount < customScrollCardLimit;
}

/**
 * Validate custom scroll cards array against user's tier limit
 * @param {Object} profile - User profile from Firestore
 * @param {Array} customScrollCards - Array of custom scroll cards
 * @returns {Object} { valid: boolean, error: string|null, maxAllowed: number }
 */
export function validateCustomScrollCards(profile, customScrollCards) {
  const { customScrollCardLimit } = getUserTier(profile);
  const count = customScrollCards?.length || 0;

  if (count > customScrollCardLimit) {
    return {
      valid: false,
      error: `You can only have ${customScrollCardLimit} custom scroll cards on your current plan.`,
      maxAllowed: customScrollCardLimit,
    };
  }

  return {
    valid: true,
    error: null,
    maxAllowed: customScrollCardLimit,
  };
}

// Legacy function for backward compatibility
export function canAddCustomCard(profile, currentCardCount) {
  return canAddCustomScrollCard(profile, currentCardCount);
}

// Legacy function for backward compatibility  
export function validateCustomCards(profile, customCards) {
  return validateCustomScrollCards(profile, customCards);
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

/**
 * Check if user is an admin
 * @param {Object} profile - User profile from Firestore
 * @returns {boolean}
 */
export function isAdmin(profile) {
  return profile?.tier === TIERS.ADMIN || profile?.email === 'amyerdt6@gmail.com';
}

/**
 * Check if user has admin or premium features
 * @param {Object} profile - User profile from Firestore
 * @returns {boolean}
 */
export function hasAdminOrPremiumFeatures(profile) {
  const tier = profile?.tier || TIERS.FREE;
  return tier === TIERS.ADMIN || tier === TIERS.FOUNDING || tier === TIERS.PREMIUM;
}
