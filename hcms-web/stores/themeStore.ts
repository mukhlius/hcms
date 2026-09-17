import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeMode = 'light' | 'dark' | 'system';
export type ColorTheme = 'sapphire' | 'emerald' | 'amber' | 'amethyst' | 'crimson' | 'slate';
export type FontFamily = 'inter' | 'jakarta' | 'outfit' | 'roboto' | 'system';
export type ButtonShape = 'sharp' | 'default' | 'smooth' | 'pill';
export type ContentDensity = 'compact' | 'standard' | 'spacious';

interface ThemeStore {
  themeMode: ThemeMode;
  colorTheme: ColorTheme;
  fontFamily: FontFamily;
  buttonShape: ButtonShape;
  contentDensity: ContentDensity;
  appIcon: string | null;
  appName: string;
  companyName: string;
  setThemeMode: (mode: ThemeMode) => void;
  toggleThemeMode: () => void;
  setColorTheme: (theme: ColorTheme) => void;
  setFontFamily: (font: FontFamily) => void;
  setButtonShape: (shape: ButtonShape) => void;
  setContentDensity: (density: ContentDensity) => void;
  setAppIcon: (icon: string | null) => void;
  setAppName: (name: string) => void;
  setCompanyName: (name: string) => void;
  resetTheme: () => void;
  applyTheme: () => void;
}

const themeTokens = {
  sapphire: {
    primary: '#2563eb', // Blue 600
    hover: '#1d4ed8',   // Blue 700
    active: '#1e40af',  // Blue 800
    ring: '#3b82f6',    // Blue 500
    light: '#eff6ff',   // Blue 50
    border: '#bfdbfe',  // Blue 200
  },
  emerald: {
    primary: '#059669', // Emerald 600
    hover: '#047857',   // Emerald 700
    active: '#065f46',  // Emerald 800
    ring: '#10b981',    // Emerald 500
    light: '#ecfdf5',   // Emerald 50
    border: '#a7f3d0',  // Emerald 200
  },
  amber: {
    primary: '#d97706', // Amber 600 (Mining Gold)
    hover: '#b45309',   // Amber 700
    active: '#92400e',  // Amber 800
    ring: '#f59e0b',    // Amber 500
    light: '#fffbeb',   // Amber 50
    border: '#fde68a',  // Amber 200
  },
  amethyst: {
    primary: '#7c3aed', // Violet 600
    hover: '#6d28d9',   // Violet 700
    active: '#5b21b6',  // Violet 800
    ring: '#8b5cf6',    // Violet 500
    light: '#f5f3ff',   // Violet 50
    border: '#ddd6fe',  // Violet 200
  },
  crimson: {
    primary: '#e11d48', // Rose 600 (Obsidian Ruby)
    hover: '#be123c',   // Rose 700
    active: '#9f1239',  // Rose 800
    ring: '#f43f5e',    // Rose 500
    light: '#fff1f2',   // Rose 50
    border: '#fecdd3',  // Rose 200
  },
  slate: {
    primary: '#334155', // Slate 700
    hover: '#1e293b',   // Slate 800
    active: '#0f172a',  // Slate 900
    ring: '#64748b',    // Slate 500
    light: '#f8fafc',   // Slate 50
    border: '#cbd5e1',  // Slate 300
  },
};

const radiusTokens = {
  sharp: '2px',
  default: '8px',
  smooth: '14px',
  pill: '9999px',
};

const fontTokens = {
  inter: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  jakarta: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif",
  outfit: "'Outfit', -apple-system, BlinkMacSystemFont, sans-serif",
  roboto: "'Roboto', -apple-system, BlinkMacSystemFont, sans-serif",
  system: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
};

export const updateFavicon = (iconUrl: string | null, primaryColor = '#2563eb') => {
  if (typeof document === 'undefined') return;

  let finalHref = '';
  let finalType = 'image/png';

  if (iconUrl) {
    const separator = iconUrl.includes('?') ? '&' : '?';
    finalHref = `${iconUrl}${separator}v=${Date.now()}`;
    finalType = iconUrl.toLowerCase().endsWith('.svg') ? 'image/svg+xml' : 'image/png';
  } else {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32"><rect width="32" height="32" rx="8" fill="${primaryColor}"/><g transform="translate(4, 4)" stroke="#ffffff" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M2 18a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v2z" fill="#ffffff" fill-opacity="0.25"/><path d="M10 10V5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v5"/><path d="M4 15v-3a8 8 0 0 1 16 0v3"/></g></svg>`;
    finalHref = `data:image/svg+xml,${encodeURIComponent(svg)}`;
    finalType = 'image/svg+xml';
  }

  // Update elemen link favicon yang sudah ada tanpa menghapusnya (el.remove)
  // Menghapus elemen dari DOM menyebabkan error React reconciler:
  // "Uncaught TypeError: Cannot read properties of null (reading 'removeChild')"
  const existingIcons = document.querySelectorAll<HTMLLinkElement>("link[rel*='icon'], link[rel='apple-touch-icon']");
  if (existingIcons.length > 0) {
    existingIcons.forEach((el) => {
      if (el.getAttribute('href') !== finalHref) {
        el.type = finalType;
        el.href = finalHref;
      }
    });
  } else {
    const link = document.createElement('link');
    link.rel = 'icon';
    link.type = finalType;
    link.href = finalHref;
    document.head.appendChild(link);
  }
};

export const updateBrowserTitle = (name: string | null | undefined) => {
  if (typeof document === 'undefined') return;
  if (name && name.trim()) {
    document.title = name.trim();
  }
};

let systemMediaListenerAttached = false;

const executeApplyTheme = (
  themeMode: ThemeMode,
  colorTheme: ColorTheme,
  fontFamily: FontFamily,
  buttonShape: ButtonShape,
  contentDensity: ContentDensity,
  appIcon?: string | null,
  appName?: string
) => {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  const colors = themeTokens[colorTheme] || themeTokens.sapphire;
  const radius = radiusTokens[buttonShape] || radiusTokens.default;
  const font = fontTokens[fontFamily] || fontTokens.inter;

  // Deteksi Dark Mode
  const isSystemDark = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark = themeMode === 'dark' || (themeMode === 'system' && isSystemDark);

  if (isDark) {
    root.classList.add('dark');
    root.setAttribute('data-theme-mode', 'dark');
    root.style.colorScheme = 'dark';
  } else {
    root.classList.remove('dark');
    root.setAttribute('data-theme-mode', 'light');
    root.style.colorScheme = 'light';
  }
  root.setAttribute('data-theme-setting', themeMode);

  // Pasang listener jika mode adalah 'system' agar reaktif terhadap perubahan OS
  if (typeof window !== 'undefined' && window.matchMedia && !systemMediaListenerAttached) {
    try {
      const media = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = () => {
        const currentMode = useThemeStore.getState().themeMode;
        if (currentMode === 'system') {
          useThemeStore.getState().applyTheme();
        }
      };
      if (media.addEventListener) {
        media.addEventListener('change', listener);
      } else if ((media as any).addListener) {
        (media as any).addListener(listener);
      }
      systemMediaListenerAttached = true;
    } catch {
      // Abaikan jika browser tidak mendukung
    }
  }

  // Set CSS Variables
  root.style.setProperty('--primary-color', colors.primary);
  root.style.setProperty('--primary-hover', colors.hover);
  root.style.setProperty('--primary-active', colors.active);
  root.style.setProperty('--primary-ring', colors.ring);
  root.style.setProperty('--primary-light', colors.light);
  root.style.setProperty('--primary-border', colors.border);

  root.style.setProperty('--btn-radius', radius);
  root.style.setProperty('--app-font-family', font);

  // Set Data Attributes for advanced CSS selectors
  root.setAttribute('data-color-theme', colorTheme);
  root.setAttribute('data-font-family', fontFamily);
  root.setAttribute('data-btn-shape', buttonShape);
  root.setAttribute('data-density', contentDensity);

  // Dynamic Browser Tab Title & Favicon
  updateBrowserTitle(appName);
  updateFavicon(appIcon ?? null, colors.primary);
};

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      themeMode: 'light',
      colorTheme: 'sapphire',
      fontFamily: 'inter',
      buttonShape: 'default',
      contentDensity: 'standard',
      appIcon: null,
      appName: 'HCMS ENTERPRISE',
      companyName: 'PT Coal Mining Nusantara',

      setThemeMode: (themeMode: ThemeMode) => {
        set({ themeMode });
        const { colorTheme, fontFamily, buttonShape, contentDensity, appIcon, appName } = get();
        executeApplyTheme(themeMode, colorTheme, fontFamily, buttonShape, contentDensity, appIcon, appName);
      },

      toggleThemeMode: () => {
        const { themeMode } = get();
        const isSystemDark = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        const currentIsDark = themeMode === 'dark' || (themeMode === 'system' && isSystemDark);
        const nextMode: ThemeMode = currentIsDark ? 'light' : 'dark';
        get().setThemeMode(nextMode);
      },

      setAppName: (appName) => {
        set({ appName });
        updateBrowserTitle(appName);
      },
      setCompanyName: (companyName) => set({ companyName }),

      setAppIcon: (appIcon) => {
        set({ appIcon });
        const { themeMode, colorTheme, fontFamily, buttonShape, contentDensity, appName } = get();
        executeApplyTheme(themeMode, colorTheme, fontFamily, buttonShape, contentDensity, appIcon, appName);
      },

      setColorTheme: (colorTheme) => {
        set({ colorTheme });
        const { themeMode, fontFamily, buttonShape, contentDensity, appIcon, appName } = get();
        executeApplyTheme(themeMode, colorTheme, fontFamily, buttonShape, contentDensity, appIcon, appName);
      },

      setFontFamily: (fontFamily) => {
        set({ fontFamily });
        const { themeMode, colorTheme, buttonShape, contentDensity, appIcon, appName } = get();
        executeApplyTheme(themeMode, colorTheme, fontFamily, buttonShape, contentDensity, appIcon, appName);
      },

      setButtonShape: (buttonShape) => {
        set({ buttonShape });
        const { themeMode, colorTheme, fontFamily, contentDensity, appIcon, appName } = get();
        executeApplyTheme(themeMode, colorTheme, fontFamily, buttonShape, contentDensity, appIcon, appName);
      },

      setContentDensity: (contentDensity) => {
        set({ contentDensity });
        const { themeMode, colorTheme, fontFamily, buttonShape, appIcon, appName } = get();
        executeApplyTheme(themeMode, colorTheme, fontFamily, buttonShape, contentDensity, appIcon, appName);
      },

      resetTheme: () => {
        set({
          themeMode: 'light',
          colorTheme: 'sapphire',
          fontFamily: 'inter',
          buttonShape: 'default',
          contentDensity: 'standard',
        });
        const { appIcon, appName } = get();
        executeApplyTheme('light', 'sapphire', 'inter', 'default', 'standard', appIcon, appName);
      },

      applyTheme: () => {
        const { themeMode, colorTheme, fontFamily, buttonShape, contentDensity, appIcon, appName } = get();
        executeApplyTheme(themeMode, colorTheme, fontFamily, buttonShape, contentDensity, appIcon, appName);
      },
    }),
    {
      name: 'hcms_theme_preferences',
    }
  )
);
