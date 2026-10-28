/**
 * Safe clipboard copy utility that works reliably inside iframes,
 * mobile webviews, and across browsers without throwing unhandled
 * NotAllowedError or Document-not-focused exceptions.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (!text) return false;

  // Try window focus first to reduce iframe focus errors
  try {
    if (typeof window !== 'undefined' && window.focus) {
      window.focus();
    }
  } catch {
    // Ignore focus error in restricted sandbox
  }

  // 1. Try modern async Clipboard API if available and document has focus
  if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Modern clipboard failed (e.g. NotAllowedError: Document is not focused in iframe).
      // Fall through to fallback execCommand.
    }
  }

  // 2. Fallback: document.execCommand('copy') using an off-screen textarea
  try {
    if (typeof document === 'undefined') return false;

    const textArea = document.createElement('textarea');
    textArea.value = text;

    // Prevent scrolling to bottom of page in mobile
    textArea.style.position = 'fixed';
    textArea.style.top = '0';
    textArea.style.left = '0';
    textArea.style.width = '2em';
    textArea.style.height = '2em';
    textArea.style.padding = '0';
    textArea.style.border = 'none';
    textArea.style.outline = 'none';
    textArea.style.boxShadow = 'none';
    textArea.style.background = 'transparent';
    textArea.style.opacity = '0.01';
    textArea.style.fontSize = '16px'; // Prevents iOS auto-zoom

    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    textArea.setSelectionRange(0, text.length);

    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.warn('Fallback copy command failed:', err);
    return false;
  }
}
