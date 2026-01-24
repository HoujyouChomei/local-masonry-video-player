// src/shared/lib/use-hotkeys.ts

import { useEffect, useRef } from 'react';

export type KeyCombo = string;

export interface HotkeyOptions {
  enabled?: boolean;
  preventDefault?: boolean;
  enableOnFormTags?: string[];
  keyup?: boolean;
}

const isInputFocused = (enableOnFormTags: string[] = []) => {
  const target = document.activeElement;
  if (!target) return false;

  const tagName = target.tagName;
  const isContentEditable = (target as HTMLElement).isContentEditable;

  if (enableOnFormTags.includes(tagName)) return false;

  return tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT' || isContentEditable;
};

const parseKeyCombo = (combo: string) => {
  const parts = combo.toLowerCase().split('+');
  const key = parts.pop();
  const modifiers = {
    ctrl: parts.includes('ctrl'),
    meta: parts.includes('meta'),
    shift: parts.includes('shift'),
    alt: parts.includes('alt'),
    mod: parts.includes('mod'),
  };
  return { key, modifiers };
};

const matchesKey = (event: KeyboardEvent, combo: string) => {
  const { key, modifiers } = parseKeyCombo(combo);
  const eventKey = event.key.toLowerCase();
  const eventCode = event.code.toLowerCase();

  const isSpace = key === 'space' && (eventKey === ' ' || eventCode === 'space');
  const isMatch = isSpace || eventKey === key;

  if (!isMatch) return false;

  const ctrl = event.ctrlKey;
  const meta = event.metaKey;
  const shift = event.shiftKey;
  const alt = event.altKey;

  if (modifiers.mod) {
    if (!(ctrl || meta)) return false;
  } else {
    if (modifiers.ctrl !== ctrl) return false;
    if (modifiers.meta !== meta) return false;
  }

  if (modifiers.shift !== shift) return false;
  if (modifiers.alt !== alt) return false;

  return true;
};

export const useHotkeys = (
  keys: KeyCombo | KeyCombo[],
  callback: (event: KeyboardEvent) => void,
  options: HotkeyOptions = {}
) => {
  const { enabled = true, preventDefault = true, enableOnFormTags = [], keyup = false } = options;

  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const keysKey = Array.isArray(keys) ? keys.join(',') : keys;
  const formTagsKey = JSON.stringify(enableOnFormTags);

  useEffect(() => {
    if (!enabled) return;

    const handleKey = (event: KeyboardEvent) => {
      if (isInputFocused(enableOnFormTags)) {
        return;
      }

      const comboList = Array.isArray(keys) ? keys : [keys];
      const isMatch = comboList.some((combo) => matchesKey(event, combo));

      if (isMatch) {
        if (preventDefault) {
          event.preventDefault();
        }
        callbackRef.current(event);
      }
    };

    const eventName = keyup ? 'keyup' : 'keydown';
    window.addEventListener(eventName, handleKey);

    return () => {
      window.removeEventListener(eventName, handleKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keysKey, enabled, preventDefault, formTagsKey, keyup]);
};
