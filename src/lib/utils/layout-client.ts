export function canUseDocument() {
  return typeof document !== 'undefined';
}

export function applyDocumentTheme(theme: 'light' | 'dark', doc: Document = document) {
  doc.documentElement.setAttribute('data-theme', theme);
}

export function markAppHydrated(doc: Document = document) {
  doc.documentElement.setAttribute('data-app-hydrated', 'true');
}

export function shouldToggleCommandPaletteShortcut(event: {
  metaKey: boolean;
  ctrlKey: boolean;
  shiftKey: boolean;
  key: string;
}) {
  const isModifierPressed = event.metaKey || event.ctrlKey;
  const key = event.key.toLowerCase();

  return isModifierPressed && (key === 'k' || (event.shiftKey && key === 'p'));
}