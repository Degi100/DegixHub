// Track clipboard clear timeout
let clipboardClearTimeout: NodeJS.Timeout | null = null;

// Default auto-clear delay (30 seconds)
const CLIPBOARD_CLEAR_DELAY = 30 * 1000;

/**
 * Safely copy text to clipboard with fallback for non-HTTPS contexts
 * @param text - Text to copy
 * @param autoClear - Whether to automatically clear clipboard after delay (default: false)
 * @param clearDelay - Delay in ms before clearing (default: 30 seconds)
 */
export async function copyToClipboard(
  text: string,
  autoClear: boolean = false,
  clearDelay: number = CLIPBOARD_CLEAR_DELAY
): Promise<boolean> {
  // Clear any existing timeout
  if (clipboardClearTimeout) {
    clearTimeout(clipboardClearTimeout);
    clipboardClearTimeout = null;
  }

  let success = false;

  // Try modern clipboard API first (requires HTTPS)
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      success = true;
    } catch {
      // Fall through to fallback
    }
  }

  // Fallback for HTTP contexts using execCommand
  if (!success) {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-9999px';
      textArea.style.top = '-9999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      success = document.execCommand('copy');
      document.body.removeChild(textArea);
    } catch {
      return false;
    }
  }

  // Set up auto-clear if requested and copy was successful
  if (success && autoClear) {
    clipboardClearTimeout = setTimeout(() => {
      clearClipboard();
    }, clearDelay);
  }

  return success;
}

/**
 * Clear the clipboard
 */
export async function clearClipboard(): Promise<void> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText('');
    }
  } catch {
    // Ignore errors when clearing
  }
}

/**
 * Copy sensitive data (passwords, secrets) with auto-clear enabled
 */
export async function copySecureToClipboard(text: string): Promise<boolean> {
  return copyToClipboard(text, true, CLIPBOARD_CLEAR_DELAY);
}
