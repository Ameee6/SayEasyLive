/**
 * Fullscreen API utility functions
 * Provides cross-browser support for entering/exiting fullscreen mode
 */

/**
 * Request fullscreen mode for the document element
 * Returns true if request was initiated, false if not supported
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
 * Returns true if exit was initiated, false if not in fullscreen or not supported
 */
export function exitFullscreen() {
  if (!isFullscreen()) {
    return false;
  }
  
  if (document.exitFullscreen) {
    document.exitFullscreen().catch(() => {
      // Exit failed - this shouldn't normally happen
    });
    return true;
  } else if (document.webkitExitFullscreen) {
    // Safari/older WebKit
    document.webkitExitFullscreen();
    return true;
  } else if (document.mozCancelFullScreen) {
    // Firefox
    document.mozCancelFullScreen();
    return true;
  } else if (document.msExitFullscreen) {
    // IE/Edge
    document.msExitFullscreen();
    return true;
  }
  
  return false;
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
