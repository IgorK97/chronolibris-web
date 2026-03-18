// ============================================================
// useReaderSettings.ts — хук настроек читалки с персистентностью
// Компонент не знает о способе хранения — только использует хук.
// ============================================================

import { useState, useEffect } from 'react';

const STORAGE_KEY = 'reader_settings';

export interface ReaderSettings {
  fontSize: number;
  fontFamily: string;
  textColor: string;
  pageColor: string;
  bgColor: string;
}

interface UseReaderSettingsOptions {
  defaults: ReaderSettings;
}

interface UseReaderSettingsReturn {
  settings: ReaderSettings;
  setFontSize: (v: number) => void;
  setFontFamily: (v: string) => void;
  setTextColor: (v: string) => void;
  setPageColor: (v: string) => void;
  setBgColor: (v: string) => void;
}

function loadSettings(defaults: ReaderSettings): ReaderSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw) as Partial<ReaderSettings>;
    return {
      fontSize:
        typeof parsed.fontSize === 'number'
          ? parsed.fontSize
          : defaults.fontSize,
      fontFamily:
        typeof parsed.fontFamily === 'string'
          ? parsed.fontFamily
          : defaults.fontFamily,
      textColor:
        typeof parsed.textColor === 'string'
          ? parsed.textColor
          : defaults.textColor,
      pageColor:
        typeof parsed.pageColor === 'string'
          ? parsed.pageColor
          : defaults.pageColor,
      bgColor:
        typeof parsed.bgColor === 'string' ? parsed.bgColor : defaults.bgColor,
    };
  } catch {
    return defaults;
  }
}

function saveSettings(settings: ReaderSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // localStorage недоступен — молча игнорируем
  }
}

export function useReaderSettings({
  defaults,
}: UseReaderSettingsOptions): UseReaderSettingsReturn {
  const [settings, setSettings] = useState<ReaderSettings>(() => {
    const loaded = loadSettings(defaults);
    // Если в хранилище ничего не было — сразу сохраняем дефолты
    saveSettings(loaded);
    return loaded;
  });

  // Сохраняем при каждом изменении
  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  const make =
    <K extends keyof ReaderSettings>(key: K) =>
    (value: ReaderSettings[K]) =>
      setSettings((prev) => ({ ...prev, [key]: value }));

  return {
    settings,
    setFontSize: make('fontSize'),
    setFontFamily: make('fontFamily'),
    setTextColor: make('textColor'),
    setPageColor: make('pageColor'),
    setBgColor: make('bgColor'),
  };
}
