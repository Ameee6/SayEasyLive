/**
 * Fullscreen API utility functions
 * Provides cross-browser support for entering/exiting fullscreen mode
 */

/**
 * Request fullscreen mode for the document element
 * Returns true if the API is supported (request initiated), false if not supported
 * Note: The actual fullscreen may still fail due to browser security restrictions (requires user gesture)
 */
export function enterFullscreen() {
  const elem = document.documentElement;
  
  if (elem.requestFullscreen) {
    elem.requestFullscreen().catch(() => {
      // Fullscreen request failed - likely needs user gesture
      // This is expected on some platforms
    });
    return true;
  } else if (elem.webkitRequestFullscreen) {
    // Safari/older WebKit
    elem.webkitRequestFullscreen();
    return true;
  } else if (elem.mozRequestFullScreen) {
    // Firefox
    elem.mozRequestFullScreen();
    return true;
  } else if (elem.msRequestFullscreen) {
    // IE/Edge
    elem.msRequestFullscreen();
    return true;
  }
  
  return false;
}

/**
 * Exit fullscreen mode
 * Browser handles the case when not in fullscreen internally
 */
export function exitFullscreen() {
  if (document.exitFullscreen) {
    document.exitFullscreen().catch(() => {
      // Exit failed or not in fullscreen - browser handles this internally
    });
  } else if (document.webkitExitFullscreen) {
    // Safari/older WebKit
    document.webkitExitFullscreen();
  } else if (document.mozCancelFullScreen) {
    // Firefox
    document.mozCancelFullScreen();
  } else if (document.msExitFullscreen) {
    // IE/Edge
    document.msExitFullscreen();
  }
}

/**
 * Check if currently in fullscreen mode
 */
export function isFullscreen() {
  return !!(
    document.fullscreenElement ||
    document.webkitFullscreenElement ||
    document.mozFullScreenElement ||
    document.msFullscreenElement
  );
}

/**
 * Check if fullscreen is supported
 */
export function isFullscreenSupported() {
  return !!(
    document.documentElement.requestFullscreen ||
    document.documentElement.webkitRequestFullscreen ||
    document.documentElement.mozRequestFullScreen ||
    document.documentElement.msRequestFullscreen
  );
}
