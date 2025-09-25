/**
 * Utility functions for sharing content
 */

/**
 * Share content using the Web Share API if available, or fallback to copy to clipboard
 * @param title Title to share
 * @param text Text content to share
 * @param url URL to share
 * @returns Promise that resolves when sharing is complete
 */
export const shareContent = async (title: string, text: string, url: string): Promise<void> => {
  // Check if Web Share API is available
  if (navigator.share) {
    try {
      await navigator.share({
        title,
        text,
        url
      });
    } catch (error) {
      // Handle sharing errors (user may have canceled)
      if ((error as Error).name !== 'AbortError') {
        // Fall back to clipboard
        await copyToClipboard(url);
      }
    }
  } else {
    // Web Share API not available, use clipboard fallback
    await copyToClipboard(url);
  }
};

/**
 * Copy text to clipboard and show feedback
 * @param text Text to copy to clipboard
 */
const copyToClipboard = async (text: string): Promise<void> => {
  try {
    await navigator.clipboard.writeText(text);
    // Could show a toast notification here
  } catch (err) {
    // Silently fail
  }
}; 