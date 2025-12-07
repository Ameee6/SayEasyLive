import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { loadDashboardSettings, saveDashboardSettings, loadRemovedCards, saveRemovedCards } from '../utils/storage';
import { saveSettings, loadSettings } from '../settingsStorage';
import { saveImage, loadAllImages, fileToDataUrl, resizeImage } from '../utils/imageStorage';
import { presetCards } from '../data/defaultCards';
import { canAddCustomScrollCard } from '../tierManager';
import TrialSignupModal from './TrialSignupModal';
import SaveSettingsModal from './SaveSettingsModal';

/*
 * FUTURE ENHANCEMENT (Next Phase):
 * - Backend image upload: Store images on server instead of IndexedDB for cross-device access
 * - Multi-device login: Allow users to sync settings and cards across devices
 * Note: These features are planned for a future release and are not implemented in this version.
 */

// Color palette for scroll cards (matching MainView)
const CARD_COLORS = [
  '#8B5CF6',  // Bright Purple
  '#EC4899',  // Hot Pink
  '#3B82F6',  // Electric Blue
  '#FACC15',  // Sunny Yellow
  '#F97316',  // Vibrant Orange
  '#22C55E',  // Fresh Green
  '#EF4444',  // Cherry Red
];

const YES_BUTTON_COLOR = '#00E676';
const NO_BUTTON_COLOR = '#FF6D00';

// Maximum number of removed custom cards to store
const MAX_REMOVED_CARDS = 10;

// Animation constants for portrait mode landscape recommendation icon
const PORTRAIT_ANIMATION = {
  ROTATION_ANGLES: [0, 360, 360, 720, 720, 1080], // 3 full rotations
  DURATION_SECONDS: 6,
  TIMING_KEYFRAMES: [0, 0.167, 0.5, 0.667, 0.833, 1], // Spin, pause, spin, pause, spin
};

// ID prefix constants for card type identification
const CARD_ID_PREFIX = 'card-';
const PRESET_ID_PREFIX = 'preset-';
const MAIN_BUTTON_IDS = ['main-top', 'main-bottom'];

// Helper function to check if a card ID belongs to a card (custom or preset)
const isCardId = (id) => id.startsWith(CARD_ID_PREFIX) || id.startsWith(PRESET_ID_PREFIX);

function SettingsDashboard({ onSave, onBack, onShowSignup, userProfile, userTier }) {
  const [settings, setSettings] = useState(loadDashboardSettings());
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [images, setImages] = useState({});
  const [removedCards, setRemovedCards] = useState(loadRemovedCards());
  const [editingItem, setEditingItem] = useState(null); // { type: 'main-top'|'main-bottom'|'card', index?: number }
  const [tempLabel, setTempLabel] = useState('');
  const [showRemovedCards, setShowRemovedCards] = useState(false);
  const [showPresetCards, setShowPresetCards] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPortrait, setIsPortrait] = useState(false);
  const [showTrialModal, setShowTrialModal] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState(null);
  
  const fileInputRef = useRef(null);
  const currentUploadTarget = useRef(null);

  // Detect portrait mode on mount and orientation change
  useEffect(() => {
    const checkPortrait = () => {
      setIsPortrait(window.innerHeight > window.innerWidth);
    };
    checkPortrait();
    window.addEventListener('resize', checkPortrait);
    return () => window.removeEventListener('resize', checkPortrait);
  }, []);

  // Load settings from Firestore if user is logged in
  useEffect(() => {
    const loadUserSettings = async () => {
      if (userProfile && !settingsLoaded) {
        try {
          console.log('🔍 Loading Firestore settings for user:', userProfile.email);
          const firestoreSettings = await loadSettings();
          console.log('📥 Firestore settings loaded:', firestoreSettings);
          
          if (firestoreSettings && firestoreSettings.scrollCards) {
            console.log('✅ Using Firestore settings');
            setSettings(firestoreSettings);
          } else {
            console.log('⚠️ No Firestore settings found, using localStorage');
          }
        } catch (error) {
          console.error('❌ Error loading Firestore settings:', error);
          // Fall back to localStorage settings (already loaded)
        } finally {
          setSettingsLoaded(true);
        }
      } else if (!userProfile) {
        // Not logged in, use localStorage settings (already loaded)
        console.log('👤 Not logged in, using localStorage settings');
        setSettingsLoaded(true);
      }
    };
    
    loadUserSettings();
  }, [userProfile, settingsLoaded]);

  // Load all images on mount
  useEffect(() => {
    const loadImages = async () => {
      const allImages = await loadAllImages();
      setImages(allImages);
    };
    loadImages();
  }, []);

  // Get preset cards that are not currently in the scroll cards list
  const getAvailablePresetCards = () => {
    const currentPresetIds = settings.scrollCards
      .filter(card => card.isPreset)
      .map(card => card.id);
    return presetCards.filter(card => !currentPresetIds.includes(card.id));
  };

  // Get only custom cards from removed cards (preset cards don't go to Previously Removed)
  const getRemovedCustomCards = () => {
    return removedCards.filter(card => !card.isPreset);
  };

  // Get color for a card by index
  const getCardColor = (index) => CARD_COLORS[index % CARD_COLORS.length];

  // Handle image upload trigger (only for main buttons and custom cards)
  const handleImageUpload = (targetId) => {
    // Prevent image upload for preset cards
    if (targetId.startsWith(PRESET_ID_PREFIX)) {
      return;
    }
    currentUploadTarget.current = targetId;
    fileInputRef.current?.click();
  };

  // Handle file selection
  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !currentUploadTarget.current) return;

    try {
      const dataUrl = await fileToDataUrl(file);
      const resizedDataUrl = await resizeImage(dataUrl);
      const targetId = currentUploadTarget.current;
      
      await saveImage(targetId, resizedDataUrl);
      setImages(prev => ({ ...prev, [targetId]: resizedDataUrl }));

      // Update settings with imageId reference
      if (MAIN_BUTTON_IDS.includes(targetId)) {
        const buttonKey = targetId === 'main-top' ? 'top' : 'bottom';
        setSettings(prev => ({
          ...prev,
          mainButtons: {
            ...prev.mainButtons,
            [buttonKey]: {
              ...prev.mainButtons[buttonKey],
              imageId: targetId
            }
          }
        }));
      } else if (isCardId(targetId)) {
        const cardIndex = settings.scrollCards.findIndex(c => c.id === targetId);
        if (cardIndex !== -1) {
          const newCards = [...settings.scrollCards];
          newCards[cardIndex] = { ...newCards[cardIndex], imageId: targetId };
          setSettings(prev => ({ ...prev, scrollCards: newCards }));
        }
      }
    } catch (error) {
      console.error('Error uploading image:', error);
    }

    // Reset file input
    e.target.value = '';
    currentUploadTarget.current = null;
  };

  // Maximum character limit for label/voice text
  const MAX_LABEL_LENGTH = 25;

  // Start editing a button/card label (only for main buttons and custom cards)
  const startEditing = (type, index = null) => {
    // Prevent editing preset cards
    if (type === 'card' && index !== null) {
      const card = settings.scrollCards[index];
      if (card.isPreset) {
        return; // Don't allow editing preset cards
      }
    }
    
    let item;
    if (type === 'main-top') {
      item = settings.mainButtons.top;
    } else if (type === 'main-bottom') {
      item = settings.mainButtons.bottom;
    } else if (type === 'card' && index !== null) {
      item = settings.scrollCards[index];
    }
    
    if (item) {
      setEditingItem({ type, index });
      setTempLabel(item.label);
    }
  };

  // Save edited label - label and speakText are always the same
  const saveEditing = () => {
    if (!editingItem) return;

    const { type, index } = editingItem;
    
    if (type === 'main-top' || type === 'main-bottom') {
      const buttonKey = type === 'main-top' ? 'top' : 'bottom';
      setSettings(prev => ({
        ...prev,
        mainButtons: {
          ...prev.mainButtons,
          [buttonKey]: {
            ...prev.mainButtons[buttonKey],
            label: tempLabel,
            speakText: tempLabel
          }
        }
      }));
    } else if (type === 'card' && index !== null) {
      const newCards = [...settings.scrollCards];
      newCards[index] = {
        ...newCards[index],
        label: tempLabel,
        speakText: tempLabel
      };
      setSettings(prev => ({ ...prev, scrollCards: newCards }));
    }

    setEditingItem(null);
    setTempLabel('');
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingItem(null);
    setTempLabel('');
  };

  // Generate unique ID using crypto.randomUUID if available, fallback to timestamp+random
  const generateUniqueId = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return `${CARD_ID_PREFIX}${crypto.randomUUID()}`;
    }
    return `${CARD_ID_PREFIX}${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  };

  // Add new custom card (paid feature)
  const addCard = () => {
    if (settings.scrollCards.length >= 10) return;
    
    // Check tier limits for custom scroll cards
    const currentCustomScrollCards = settings.scrollCards.filter(card => !card.isPreset);
    if (!canAddCustomScrollCard(userProfile, currentCustomScrollCards.length)) {
      // Show upgrade prompt for free users
      const tierName = userTier?.displayName || 'Free';
      const maxAllowed = userTier?.customScrollCardLimit || 0;
      
      if (maxAllowed === 0) {
        setShowTrialModal(true);
      } else {
        alert(`${tierName} tier allows ${maxAllowed} custom scroll cards. You're currently using ${currentCustomScrollCards.length}/${maxAllowed}.`);
      }
      return;
    }
    
    const newId = generateUniqueId();
    const newCard = {
      id: newId,
      label: 'Card',
      emoji: '😊',
      speakText: 'Card',
      isPreset: false, // Custom card, not preset
      imageId: null
    };
    
    setSettings(prev => ({
      ...prev,
      scrollCards: [...prev.scrollCards, newCard]
    }));
  };

  // Add a preset card to the main screen
  const addPresetCard = (presetCard) => {
    if (settings.scrollCards.length >= 10) return;
    
    // Create a copy of the preset card to add
    const cardToAdd = { ...presetCard };
    
    setSettings(prev => ({
      ...prev,
      scrollCards: [...prev.scrollCards, cardToAdd]
    }));
  };

  // Remove card
  // Preset cards: return to the preset cards dropdown (not saved to removed cards)
  // Custom cards: save to removed cards list for later re-adding (up to MAX_REMOVED_CARDS)
  const removeCard = async (index) => {
    if (settings.scrollCards.length <= 1) return;
    
    const cardToRemove = settings.scrollCards[index];
    
    // Only save custom cards to removed cards list (preset cards return to dropdown)
    if (!cardToRemove.isPreset) {
      // Add to removed cards, keeping only the most recent MAX_REMOVED_CARDS
      const updatedRemovedCards = [...removedCards, cardToRemove].slice(-MAX_REMOVED_CARDS);
      setRemovedCards(updatedRemovedCards);
      saveRemovedCards(updatedRemovedCards);
    }
    
    // Remove from current cards
    const newCards = settings.scrollCards.filter((_, i) => i !== index);
    setSettings(prev => ({ ...prev, scrollCards: newCards }));
  };

  // Reorder cards by drag and drop
  const reorderCards = (fromIndex, toIndex) => {
    if (fromIndex === toIndex) return;
    
    const newCards = [...settings.scrollCards];
    const [movedCard] = newCards.splice(fromIndex, 1);
    newCards.splice(toIndex, 0, movedCard);
    setSettings(prev => ({ ...prev, scrollCards: newCards }));
  };

  // Handle drag start
  const handleDragStart = (index) => {
    setDraggedIndex(index);
  };

  // Handle drag over - preventDefault is required to enable dropping
  // Visual feedback is provided by the opacity change on the dragged card
  const handleDragOver = (e) => {
    e.preventDefault();
  };

  // Handle drop
  const handleDrop = (e, toIndex) => {
    e.preventDefault();
    if (draggedIndex === null) return;
    reorderCards(draggedIndex, toIndex);
    setDraggedIndex(null);
  };

  // Handle drag end
  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  // Permanently delete a card from the removed cards list by card ID
  const permanentlyDeleteRemovedCard = (cardId) => {
    const updatedRemovedCards = removedCards.filter(c => c.id !== cardId);
    setRemovedCards(updatedRemovedCards);
    saveRemovedCards(updatedRemovedCards);
  };

  // Re-add a previously removed custom card by card ID
  const reAddCard = (cardId) => {
    if (settings.scrollCards.length >= 10) return;
    
    const cardToReAdd = removedCards.find(c => c.id === cardId);
    if (!cardToReAdd) return;
    
    // Add back to scroll cards
    setSettings(prev => ({
      ...prev,
      scrollCards: [...prev.scrollCards, cardToReAdd]
    }));
    
    // Remove from removed cards list by card ID
    const updatedRemovedCards = removedCards.filter(c => c.id !== cardId);
    setRemovedCards(updatedRemovedCards);
    saveRemovedCards(updatedRemovedCards);
  };

  // Set number of cards
  const setCardCount = (count) => {
    if (count < 1 || count > 10) return;
    
    const currentCount = settings.scrollCards.length;
    
    if (count > currentCount) {
      // Add new custom cards
      const newCards = [...settings.scrollCards];
      for (let i = currentCount; i < count; i++) {
        newCards.push({
          id: generateUniqueId(),
          label: 'Card',
          emoji: '😊',
          speakText: 'Card',
          isPreset: false,
          imageId: null
        });
      }
      setSettings(prev => ({ ...prev, scrollCards: newCards }));
    } else if (count < currentCount) {
      // Remove cards - only save custom cards to removed list
      const removingCards = settings.scrollCards.slice(count);
      const customCardsToRemove = removingCards.filter(card => !card.isPreset);
      if (customCardsToRemove.length > 0) {
        const updatedRemovedCards = [...removedCards, ...customCardsToRemove].slice(-MAX_REMOVED_CARDS);
        setRemovedCards(updatedRemovedCards);
        saveRemovedCards(updatedRemovedCards);
      }
      
      const newCards = settings.scrollCards.slice(0, count);
      setSettings(prev => ({ ...prev, scrollCards: newCards }));
    }
  };

  // Handle save
  const handleSave = async () => {
    if (!userProfile) {
      // User is not logged in - show save options modal
      setShowSaveModal(true);
      return;
    }

    // User is logged in - proceed with normal save
    setIsSaving(true);
    try {
      // Transform data format for settingsStorage (expects customCards, not scrollCards)
      const firestoreSettings = {
        ...settings,
        customCards: settings.scrollCards?.filter(card => !card.isPreset) || [],
        scrollCards: settings.scrollCards // Keep original for compatibility
      };
      
      console.log('💾 Saving settings to Firestore:', firestoreSettings);
      const result = await saveSettings(firestoreSettings);
      if (!result.success) {
        console.error('❌ Error saving to Firestore:', result.error);
        // Fall back to localStorage
        saveDashboardSettings(settings);
      } else {
        console.log('✅ Successfully saved to Firestore');
      }
      onSave(settings);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle saving to account (from save modal)
  const handleSaveToAccount = () => {
    setShowSaveModal(false);
    // Save temporarily to localStorage so settings persist during auth flow
    saveDashboardSettings(settings);
    // Show signup modal directly
    if (onShowSignup) {
      onShowSignup();
    } else {
      // Fallback: navigate to homepage
      onBack();
    }
  };

  // Handle staying local (from save modal)
  const handleStayLocal = async () => {
    setShowSaveModal(false);
    setIsSaving(true);
    try {
      // Save to localStorage only
      saveDashboardSettings(settings);
      onSave(settings);
    } finally {
      setIsSaving(false);
    }
  };

  // Render button with image or emoji
  const renderButtonContent = (item, imageId, size = 'large') => {
    const imageUrl = images[imageId];
    const sizeClasses = size === 'large' ? 'w-24 h-24' : 'w-12 h-12';
    const fontSize = size === 'large' ? 'text-5xl' : 'text-2xl';
    
    if (imageUrl) {
      return (
        <img 
          src={imageUrl} 
          alt={item.label}
          className={`${sizeClasses} object-cover rounded-full`}
        />
      );
    }
    return <span className={fontSize}>{item.emoji}</span>;
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col scrollable-page">
      {/* Hidden file input - no capture attribute to allow both gallery and camera on mobile */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Device Info Banner */}
      <div className="bg-blue-900/80 border-b border-blue-700 px-4 py-3 text-center flex-shrink-0">
        <p className="text-sm md:text-base text-blue-100">
          <span className="font-semibold">📱 SayEasy</span> is designed for tablets and large touch screens. Card/button editing works on mobile, but main user experience is best on larger screens.
        </p>
      </div>

      {/* Mobile Landscape Recommendation */}
      <div className="md:hidden bg-yellow-900/60 border-b border-yellow-700 px-4 py-2 text-center flex-shrink-0">
        <p className="text-sm text-yellow-100 flex items-center justify-center gap-1">
          <motion.span
            className="inline-block font-semibold"
            animate={isPortrait ? {
              rotate: PORTRAIT_ANIMATION.ROTATION_ANGLES,
            } : {}}
            transition={isPortrait ? {
              duration: PORTRAIT_ANIMATION.DURATION_SECONDS,
              times: PORTRAIT_ANIMATION.TIMING_KEYFRAMES,
              ease: "easeInOut",
            } : {}}
          >
            📐
          </motion.span>
          <span className="font-semibold">Recommended:</span> Use landscape mode (turn your phone sideways) or a tablet for best editing experience.
        </p>
      </div>

      {/* Header with action buttons */}
      <div className="p-4 bg-gray-800 border-b border-gray-700 flex-shrink-0">
        {/* Desktop layout: Back on left, title centered, Cancel/Save on right */}
        <div className="hidden md:flex justify-between items-center">
          <button
            onClick={onBack}
            className="px-4 py-2 bg-gray-600 rounded-lg hover:bg-gray-500 text-lg"
          >
            ← Back
          </button>
          <h1 className="text-2xl font-bold">SayEasy Dashboard</h1>
          <div className="flex gap-3">
            <button
              onClick={onBack}
              className="px-4 py-2 bg-gray-600 rounded-lg hover:bg-gray-500 text-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-6 py-2 bg-green-600 rounded-lg hover:bg-green-500 text-lg font-semibold disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : '✓ Save & Apply'}
            </button>
          </div>
        </div>
        {/* Mobile layout: title and back on first row, Cancel/Save below */}
        <div className="md:hidden">
          <div className="flex justify-between items-center mb-3">
            <h1 className="text-xl font-bold">SayEasy Dashboard</h1>
            <button
              onClick={onBack}
              className="px-3 py-2 bg-gray-600 rounded-lg hover:bg-gray-500 text-base"
            >
              ← Back
            </button>
          </div>
          <div className="flex gap-3">
            <button
              onClick={onBack}
              className="flex-1 px-4 py-2 bg-gray-600 rounded-lg hover:bg-gray-500 text-base"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 px-4 py-2 bg-green-600 rounded-lg hover:bg-green-500 text-base font-semibold disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : '✓ Save & Apply'}
            </button>
          </div>
        </div>
      </div>

      {/* Main content area - split into preview and sidebar on larger screens, stacked on mobile */}
      <div className="flex flex-col md:flex-row flex-1 md:overflow-hidden">
        {/* Left: Live Preview Panel - Hidden on mobile to prioritize editing */}
        <div className="hidden md:flex flex-1 flex-col p-4 overflow-auto">
          <h2 className="text-xl font-semibold mb-4 text-center">Live Preview</h2>
          
          {/* Preview layout mimicking main app */}
          <div className="flex flex-1 bg-gray-800 rounded-lg overflow-hidden border-2 border-gray-600">
            {/* Left side - Main buttons */}
            <div className="w-1/3 flex flex-col items-center justify-around p-4 bg-gray-900 border-r-2 border-gray-600">
              {/* Top main button (Yes/More) */}
              <EditableButton
                item={settings.mainButtons.top}
                imageId={settings.mainButtons.top.imageId}
                color={YES_BUTTON_COLOR}
                onUpload={() => handleImageUpload('main-top')}
                onEditLabel={() => startEditing('main-top')}
                isEditing={editingItem?.type === 'main-top'}
                renderContent={renderButtonContent}
              />
              
              {/* Instructional text between buttons */}
              <p className="text-xs text-gray-400 text-center px-2 py-2 max-w-[140px]">
                Edit text/images by clicking on the text or images.
              </p>
              
              {/* Bottom main button (No/All Done) */}
              <EditableButton
                item={settings.mainButtons.bottom}
                imageId={settings.mainButtons.bottom.imageId}
                color={NO_BUTTON_COLOR}
                onUpload={() => handleImageUpload('main-bottom')}
                onEditLabel={() => startEditing('main-bottom')}
                isEditing={editingItem?.type === 'main-bottom'}
                renderContent={renderButtonContent}
              />
            </div>

            {/* Right side - Scroll cards preview */}
            <div className="w-2/3 flex">
              {/* Card area */}
              <div 
                className="flex-1 flex items-center justify-center p-4"
                style={{ backgroundColor: getCardColor(0) }}
              >
                {settings.scrollCards.length > 0 && (
                  <div className="text-center">
                    <div className="w-32 h-32 rounded-full bg-white/90 flex items-center justify-center mx-auto mb-4 shadow-lg">
                      {renderButtonContent(settings.scrollCards[0], settings.scrollCards[0].imageId, 'large')}
                    </div>
                    <div className="text-3xl font-bold text-white drop-shadow-lg">
                      {settings.scrollCards[0].label}
                    </div>
                    <div className="text-sm text-white/70 mt-2">
                      (First card preview)
                    </div>
                  </div>
                )}
              </div>

              {/* Thumbnail sidebar */}
              <div className="w-20 bg-gray-100 flex flex-col items-center py-2 gap-2 overflow-y-auto">
                {settings.scrollCards.map((card, idx) => (
                  <div
                    key={card.id}
                    className="w-14 h-14 rounded-lg flex items-center justify-center text-lg shadow"
                    style={{ 
                      backgroundColor: getCardColor(idx),
                      border: idx === 0 ? '3px solid white' : '1px solid rgba(0,0,0,0.2)'
                    }}
                  >
                    {images[card.imageId] ? (
                      <img 
                        src={images[card.imageId]} 
                        alt={card.label}
                        className="w-10 h-10 object-cover rounded"
                      />
                    ) : (
                      <span>{card.emoji}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Edit Panel - Full width on mobile, sidebar on larger screens */}
        <div className="w-full md:w-96 bg-gray-800 md:border-l border-gray-600 flex flex-col">
          {/* Main Buttons Section - Mobile only */}
          <div className="md:hidden p-4 border-b border-gray-600">
            <h3 className="text-lg font-semibold mb-3">Main Buttons</h3>
            <div className="flex justify-around items-center">
              <EditableButton
                item={settings.mainButtons.top}
                imageId={settings.mainButtons.top.imageId}
                color={YES_BUTTON_COLOR}
                onUpload={() => handleImageUpload('main-top')}
                onEditLabel={() => startEditing('main-top')}
                isEditing={editingItem?.type === 'main-top'}
                renderContent={renderButtonContent}
              />
              <EditableButton
                item={settings.mainButtons.bottom}
                imageId={settings.mainButtons.bottom.imageId}
                color={NO_BUTTON_COLOR}
                onUpload={() => handleImageUpload('main-bottom')}
                onEditLabel={() => startEditing('main-bottom')}
                isEditing={editingItem?.type === 'main-bottom'}
                renderContent={renderButtonContent}
              />
            </div>
          </div>

          {/* Scroll cards editor */}
          <div className="flex-1 p-4 md:overflow-y-auto">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-semibold">Edit Scroll Cards</h3>
              {settings.scrollCards.length < 10 && (
                <button
                  onClick={addCard}
                  className="px-3 py-1 bg-green-600 rounded hover:bg-green-500 text-sm"
                >
                  {userTier?.tier === 'free' 
                    ? `+ Add Custom Scroll Card (${settings.scrollCards.filter(c => !c.isPreset).length}/${userTier.customScrollCardLimit || 0} allowed)` 
                    : `+ Add Custom Scroll Card (${settings.scrollCards.filter(c => !c.isPreset).length}/10)`
                  }
                </button>
              )}
            </div>

            {/* Guidelines for users */}
            <p className="text-sm text-gray-400 mb-2">
              Add up to 10 scroll cards.
            </p>
            <p className="text-sm text-gray-400 mb-4">
              📷 Tap any card image to upload. You can use a photo from your gallery or take a new picture.
            </p>

            {/* Preset Cards Dropdown */}
            {getAvailablePresetCards().length > 0 && settings.scrollCards.length < 10 && (
              <div className="mb-4">
                <button
                  onClick={() => setShowPresetCards(!showPresetCards)}
                  className="flex items-center gap-2 text-blue-400 hover:text-blue-300 mb-2 font-medium"
                >
                  <span>{showPresetCards ? '▼' : '▶'}</span>
                  <span>Preset Cards ({getAvailablePresetCards().length} available)</span>
                </button>
                
                {showPresetCards && (
                  <div className="space-y-2 ml-4 bg-gray-700/50 rounded-lg p-3">
                    {getAvailablePresetCards().map((card) => (
                      <div 
                        key={card.id}
                        className="flex items-center justify-between p-2 bg-gray-700 rounded hover:bg-gray-600 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{card.emoji}</span>
                          <span className="text-gray-200">{card.label}</span>
                          {card.isInteractive && (
                            <span className="text-xs bg-purple-600 text-white px-2 py-0.5 rounded-full">
                              (Interactive!)
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => addPresetCard(card)}
                          disabled={settings.scrollCards.length >= 10}
                          className="px-3 py-1 bg-blue-600 rounded text-sm hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          + Add
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="space-y-3">
              {settings.scrollCards.map((card, idx) => (
                <CardEditor
                  key={card.id}
                  card={card}
                  index={idx}
                  color={getCardColor(idx)}
                  imageUrl={images[card.imageId]}
                  isEditing={editingItem?.type === 'card' && editingItem?.index === idx}
                  onUpload={() => handleImageUpload(card.id)}
                  onEditLabel={() => startEditing('card', idx)}
                  onRemove={() => removeCard(idx)}
                  canRemove={settings.scrollCards.length > 1}
                  isDragging={draggedIndex === idx}
                  onDragStart={() => handleDragStart(idx)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, idx)}
                  onDragEnd={handleDragEnd}
                />
              ))}
            </div>

            {/* Re-add removed custom cards section (only for custom cards, not presets) */}
            {getRemovedCustomCards().length > 0 && (
              <div className="mt-6">
                <button
                  onClick={() => setShowRemovedCards(!showRemovedCards)}
                  className="flex items-center gap-2 text-gray-400 hover:text-white mb-2"
                >
                  <span>{showRemovedCards ? '▼' : '▶'}</span>
                  <span>Previously Removed ({getRemovedCustomCards().length})</span>
                </button>
                
                {showRemovedCards && (
                  <div className="space-y-2 ml-4">
                    {getRemovedCustomCards().map((card) => (
                      <div 
                        key={`removed-${card.id}`}
                        className="flex items-center justify-between p-2 bg-gray-700 rounded"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{card.emoji}</span>
                          <span className="text-gray-300">{card.label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {settings.scrollCards.length < 10 && (
                            <button
                              onClick={() => reAddCard(card.id)}
                              className="px-2 py-1 bg-blue-600 rounded text-sm hover:bg-blue-500"
                            >
                              Re-add
                            </button>
                          )}
                          <button
                            onClick={() => permanentlyDeleteRemovedCard(card.id)}
                            className="w-6 h-6 rounded-full bg-red-600/50 hover:bg-red-600 flex items-center justify-center text-sm"
                            title="Permanently delete"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Label editing modal */}
      {editingItem && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Edit Button</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Label (shown on button) / Voice Text (what to say)</label>
                <input
                  type="text"
                  value={tempLabel}
                  onChange={(e) => setTempLabel(e.target.value)}
                  maxLength={MAX_LABEL_LENGTH}
                  className="w-full px-4 py-3 bg-gray-700 rounded-lg text-white text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter label..."
                  autoFocus
                />
                <p className="text-xs text-gray-500 mt-1">{tempLabel.length}/{MAX_LABEL_LENGTH} characters</p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={cancelEditing}
                className="flex-1 px-4 py-3 bg-gray-600 rounded-lg hover:bg-gray-500 text-lg"
              >
                Cancel
              </button>
              <button
                onClick={saveEditing}
                className="flex-1 px-4 py-3 bg-blue-600 rounded-lg hover:bg-blue-500 text-lg font-semibold"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Trial Signup Modal */}
      {showTrialModal && (
        <TrialSignupModal 
          onClose={() => setShowTrialModal(false)}
          onSignIn={() => {
            setShowTrialModal(false);
            onBack();
          }}
          onSignUp={() => {
            setShowTrialModal(false);
            if (onShowSignup) onShowSignup(); else onBack();
          }}
          onStartTrial={() => {
            setShowTrialModal(false);
            // TODO: Start trial logic here
            alert('Starting trial...');
          }}
          userProfile={userProfile}
        />
      )}

      {/* Save Settings Modal */}
      {showSaveModal && (
        <SaveSettingsModal 
          onClose={() => setShowSaveModal(false)}
          onSaveToAccount={handleSaveToAccount}
          onStayLocal={handleStayLocal}
        />
      )}
    </div>
  );
}

// Editable main button component
function EditableButton({ item, imageId, color, onUpload, onEditLabel, isEditing, renderContent }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={onUpload}
        className="w-28 h-28 rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-transform border-4 border-white/30"
        style={{ backgroundColor: color }}
        title="Tap to change image"
      >
        {renderContent(item, imageId, 'large')}
      </button>
      <button
        onClick={onEditLabel}
        className={`px-3 py-1 rounded text-sm hover:bg-gray-700 ${isEditing ? 'bg-blue-600' : 'bg-gray-800'}`}
        title="Tap to edit label"
      >
        {item.label}
      </button>
    </div>
  );
}

// Card editor row component
function CardEditor({ card, index, color, imageUrl, isEditing, onUpload, onEditLabel, onRemove, canRemove, isDragging, onDragStart, onDragOver, onDrop, onDragEnd }) {
  const isPreset = card.isPreset;
  
  const baseClasses = "flex items-center gap-3 p-3 rounded-lg cursor-grab active:cursor-grabbing transition-opacity";
  const opacityClass = isDragging ? 'opacity-50' : 'opacity-100';
  
  return (
    <div 
      className={`${baseClasses} ${opacityClass}`}
      style={{ backgroundColor: `${color}33`, borderLeft: `4px solid ${color}` }}
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
    >
      {/* Drag handle */}
      <div className="w-6 text-gray-400 font-bold flex flex-col items-center" title="Drag to reorder">
        <span className="text-xs leading-none">⋮⋮</span>
        <span className="text-sm">#{index + 1}</span>
      </div>
      
      {/* Image/emoji display - clickable for custom cards, static for preset */}
      {isPreset ? (
        <div
          className="w-14 h-14 rounded-lg flex items-center justify-center bg-white/20 cursor-not-allowed opacity-70"
          title="Preset card image cannot be changed"
        >
          {imageUrl ? (
            <img src={imageUrl} alt={card.label} className="w-12 h-12 object-cover rounded" />
          ) : (
            <span className="text-2xl">{card.emoji}</span>
          )}
        </div>
      ) : (
        <button
          onClick={onUpload}
          className="w-14 h-14 rounded-lg flex items-center justify-center bg-white/20 hover:bg-white/30 transition-colors"
          title="Tap to upload image"
        >
          {imageUrl ? (
            <img src={imageUrl} alt={card.label} className="w-12 h-12 object-cover rounded" />
          ) : (
            <span className="text-2xl">{card.emoji}</span>
          )}
        </button>
      )}
      
      {/* Label display - clickable for custom cards, static for preset */}
      {isPreset ? (
        <div
          className="flex-1 px-3 py-2 rounded text-left cursor-not-allowed opacity-70"
          title="Preset card label cannot be changed"
        >
          <div className="font-medium flex items-center gap-2">
            {card.label}
            {card.isInteractive && (
              <span className="text-xs bg-purple-600 text-white px-2 py-0.5 rounded-full">
                (Interactive!)
              </span>
            )}
            <span className="text-xs bg-gray-600 text-gray-300 px-2 py-0.5 rounded-full">
              Preset
            </span>
          </div>
          <div className="text-xs text-gray-400">{card.speakText}</div>
        </div>
      ) : (
        <button
          onClick={onEditLabel}
          className={`flex-1 px-3 py-2 rounded text-left hover:bg-white/10 ${isEditing ? 'bg-blue-600/50' : ''}`}
          title="Tap to edit label"
        >
          <div className="font-medium flex items-center gap-2">
            {card.label}
            {card.isInteractive && (
              <span className="text-xs bg-purple-600 text-white px-2 py-0.5 rounded-full">
                (Interactive!)
              </span>
            )}
          </div>
          <div className="text-xs text-gray-400">{card.speakText}</div>
        </button>
      )}
      
      {/* Remove button */}
      {canRemove && (
        <button
          onClick={onRemove}
          className="w-8 h-8 rounded-full bg-red-600/50 hover:bg-red-600 flex items-center justify-center"
          title="Remove card"
        >
          ✕
        </button>
      )}
    </div>
  );
}

export default SettingsDashboard;
