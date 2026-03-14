import { useEffect } from 'react';

type KeyboardShortcutOptions = {
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  alt?: boolean;
  ignoreInputs?: boolean;
};

/**
 * useKeyboardShortcut Hook
 *
 * Binds a shortcut combination to a callback.
 * Automatically handles OS-specific modifiers (Cmd on Mac, Ctrl on Windows).
 */
export function useKeyboardShortcut(
  key: string,
  callback: (e: KeyboardEvent) => void,
  options: KeyboardShortcutOptions = { ignoreInputs: true }
) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore if user is typing in an input and ignoreInputs is true
      if (options.ignoreInputs) {
        const activeElement = document.activeElement;
        const isInput =
          activeElement instanceof HTMLInputElement ||
          activeElement instanceof HTMLTextAreaElement ||
          (activeElement as HTMLElement)?.isContentEditable;

        if (isInput) return;
      }

      const matchKey = event.key.toLowerCase() === key.toLowerCase();

      // If any modifier is required, check if at least one mod key is pressed
      const isModRequired = options.ctrl || options.meta;
      const modPressed = event.metaKey || event.ctrlKey;

      if (matchKey && (!isModRequired || modPressed)) {
        // Additional checks for specific modifiers if they were explicitly requested as true
        if (options.shift && !event.shiftKey) return;
        if (options.alt && !event.altKey) return;

        event.preventDefault();
        callback(event);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [key, callback, options]);
}
