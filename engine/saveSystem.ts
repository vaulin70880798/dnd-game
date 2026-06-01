import type { GameState } from "@/types/game";

const SAVE_KEY = "gamebook_save_v1";
const SETTINGS_KEY = "gamebook_settings_v1";

export interface PlayerSettings {
  showParagraphId: boolean;
}

const DEFAULT_SETTINGS: PlayerSettings = {
  showParagraphId: false,
};

function hasStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function saveGameState(state: GameState): void {
  if (!hasStorage()) return;
  window.localStorage.setItem(SAVE_KEY, JSON.stringify(state));
}

export function loadGameState(): GameState | null {
  if (!hasStorage()) return null;
  const raw = window.localStorage.getItem(SAVE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as GameState;
  } catch {
    return null;
  }
}

export function clearGameState(): void {
  if (!hasStorage()) return;
  window.localStorage.removeItem(SAVE_KEY);
}

export function hasSavedGame(): boolean {
  if (!hasStorage()) return false;
  return Boolean(window.localStorage.getItem(SAVE_KEY));
}

export function saveSettings(settings: PlayerSettings): void {
  if (!hasStorage()) return;
  window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function loadSettings(): PlayerSettings {
  if (!hasStorage()) return DEFAULT_SETTINGS;
  const raw = window.localStorage.getItem(SETTINGS_KEY);
  if (!raw) return DEFAULT_SETTINGS;

  try {
    return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as PlayerSettings) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}
