import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useStorage } from './useStorage.js'

const { getItem, setItem, validateEnum } = useStorage()

export const THEME_MODES = {
  LIGHT: 'light',
  DARK: 'dark'
}

export const themeNames = {
  light: '浅色',
  dark: '深色'
}

export const themeColors = {
  dark: {
    '--bg-primary': '#0a0f1a',
    '--bg-secondary': '#111827',
    '--bg-tertiary': '#1f2937',
    '--bg-quaternary': '#374151',
    '--bg-card': '#111827',
    '--bg-card-hover': '#1f2937',
    '--bg-overlay': 'rgba(0, 0, 0, 0.6)',
    
    '--text-primary': '#f9fafb',
    '--text-secondary': '#d1d5db',
    '--text-muted': '#9ca3af',
    '--text-disabled': '#6b7280',
    '--text-on-accent': '#ffffff',
    
    '--border-primary': 'rgba(75, 85, 99, 0.5)',
    '--border-secondary': 'rgba(55, 65, 81, 0.3)',
    '--border-subtle': 'rgba(55, 65, 81, 0.15)',
    
    '--accent-primary': '#818cf8',
    '--accent-secondary': '#6366f1',
    '--accent-tertiary': '#4f46e5',
    '--accent-gradient': 'linear-gradient(135deg, #818cf8 0%, #6366f1 50%, #4f46e5 100%)',
    '--accent-soft': 'rgba(129, 140, 248, 0.1)',
    '--accent-medium': 'rgba(129, 140, 248, 0.2)',
    '--accent-strong': 'rgba(129, 140, 248, 0.3)',
    
    '--accent-gold': '#fbbf24',
    '--accent-gold-soft': 'rgba(251, 191, 36, 0.1)',
    '--accent-gold-medium': 'rgba(251, 191, 36, 0.2)',
    '--accent-danger': '#f87171',
    '--accent-danger-soft': 'rgba(248, 113, 113, 0.1)',
    '--accent-danger-medium': 'rgba(248, 113, 113, 0.2)',
    '--accent-success': '#4ade80',
    '--accent-success-soft': 'rgba(74, 222, 128, 0.1)',
    
    '--progress-bg': 'rgba(75, 85, 99, 0.4)',
    '--progress-fill': '#818cf8',
    '--progress-thumb': '#ffffff',
    
    '--btn-bg': 'rgba(129, 140, 248, 0.06)',
    '--btn-hover': 'rgba(129, 140, 248, 0.12)',
    '--btn-active': 'rgba(129, 140, 248, 0.2)',
    '--btn-disabled': 'rgba(75, 85, 99, 0.2)',
    '--btn-ghost-bg': 'transparent',
    '--btn-ghost-hover': 'rgba(249, 250, 251, 0.08)',
    '--btn-ghost-active': 'rgba(249, 250, 251, 0.12)',
    
    '--slider-track': 'rgba(75, 85, 99, 0.5)',
    '--slider-track-active': 'rgba(129, 140, 248, 0.4)',
    '--slider-fill': '#818cf8',
    '--slider-thumb': '#ffffff',
    '--slider-thumb-border': '#818cf8',
    
    '--eq-band-low': '#f87171',
    '--eq-band-mid': '#fbbf24',
    '--eq-band-high': '#4ade80',
    '--eq-bg': 'rgba(17, 24, 39, 0.6)',
    '--eq-track': 'rgba(75, 85, 99, 0.4)',
    
    '--lyric-active': '#f9fafb',
    '--lyric-inactive': 'rgba(209, 213, 219, 0.6)',
    '--lyric-nearby': 'rgba(209, 213, 219, 0.8)',
    '--lyric-bg': 'rgba(0, 0, 0, 0.2)',
    '--lyric-active-bg': 'rgba(129, 140, 248, 0.15)',
    
    '--scrollbar-track': 'transparent',
    '--scrollbar-thumb': 'rgba(107, 114, 128, 0.4)',
    '--scrollbar-thumb-hover': 'rgba(107, 114, 128, 0.6)',
    
    '--shadow-xs': '0 1px 2px rgba(0, 0, 0, 0.3)',
    '--shadow-sm': '0 1px 3px rgba(0, 0, 0, 0.4)',
    '--shadow-md': '0 4px 6px rgba(0, 0, 0, 0.5)',
    '--shadow-lg': '0 10px 15px rgba(0, 0, 0, 0.6)',
    '--shadow-xl': '0 20px 25px rgba(0, 0, 0, 0.7)',
    '--shadow-glow': '0 0 20px rgba(129, 140, 248, 0.3)',
    
    '--glass-bg': 'rgba(17, 24, 39, 0.8)',
    '--glass-border': 'rgba(75, 85, 99, 0.4)',
    '--glass-bg-soft': 'rgba(17, 24, 39, 0.6)',
    
    '--song-item-bg': 'transparent',
    '--song-item-hover': 'rgba(129, 140, 248, 0.06)',
    '--song-item-active': 'rgba(129, 140, 248, 0.15)',
    '--song-item-remove': 'rgba(248, 113, 113, 0.15)',
    
    '--panel-bg': 'rgba(17, 24, 39, 0.7)',
    '--panel-border': 'rgba(75, 85, 99, 0.3)',
    '--panel-bg-soft': 'rgba(0, 0, 0, 0.15)',
    
    '--toggle-off': 'rgba(75, 85, 99, 0.5)',
    '--toggle-off-bg': 'rgba(75, 85, 99, 0.3)',
    '--toggle-on': 'linear-gradient(135deg, #818cf8 0%, #6366f1 100%)',
    '--toggle-thumb': '#ffffff',
    
    '--danger-bg': 'rgba(248, 113, 113, 0.1)',
    '--danger-border': 'rgba(248, 113, 113, 0.4)',
    '--danger-text': '#f87171',
    
    '--gold-bg': 'rgba(251, 191, 36, 0.15)',
    '--gold-border': 'rgba(251, 191, 36, 0.5)',
    '--gold-text': '#fbbf24'
  },
  
  light: {
    '--bg-primary': '#f8fafc',
    '--bg-secondary': '#ffffff',
    '--bg-tertiary': '#f1f5f9',
    '--bg-quaternary': '#e2e8f0',
    '--bg-card': '#ffffff',
    '--bg-card-hover': '#f8fafc',
    '--bg-overlay': 'rgba(0, 0, 0, 0.4)',
    
    '--text-primary': '#0f172a',
    '--text-secondary': '#475569',
    '--text-muted': '#64748b',
    '--text-disabled': '#94a3b8',
    '--text-on-accent': '#ffffff',
    
    '--border-primary': 'rgba(148, 163, 184, 0.5)',
    '--border-secondary': 'rgba(226, 232, 240, 0.8)',
    '--border-subtle': 'rgba(226, 232, 240, 0.6)',
    
    '--accent-primary': '#6366f1',
    '--accent-secondary': '#4f46e5',
    '--accent-tertiary': '#4338ca',
    '--accent-gradient': 'linear-gradient(135deg, #6366f1 0%, #4f46e5 50%, #4338ca 100%)',
    '--accent-soft': 'rgba(99, 102, 241, 0.06)',
    '--accent-medium': 'rgba(99, 102, 241, 0.12)',
    '--accent-strong': 'rgba(99, 102, 241, 0.2)',
    
    '--accent-gold': '#f59e0b',
    '--accent-gold-soft': 'rgba(245, 158, 11, 0.1)',
    '--accent-gold-medium': 'rgba(245, 158, 11, 0.2)',
    '--accent-danger': '#ef4444',
    '--accent-danger-soft': 'rgba(239, 68, 68, 0.08)',
    '--accent-danger-medium': 'rgba(239, 68, 68, 0.15)',
    '--accent-success': '#22c55e',
    '--accent-success-soft': 'rgba(34, 197, 94, 0.08)',
    
    '--progress-bg': 'rgba(148, 163, 184, 0.3)',
    '--progress-fill': '#6366f1',
    '--progress-thumb': '#ffffff',
    
    '--btn-bg': 'rgba(99, 102, 241, 0.05)',
    '--btn-hover': 'rgba(99, 102, 241, 0.1)',
    '--btn-active': 'rgba(99, 102, 241, 0.18)',
    '--btn-disabled': 'rgba(148, 163, 184, 0.2)',
    '--btn-ghost-bg': 'transparent',
    '--btn-ghost-hover': 'rgba(15, 23, 42, 0.05)',
    '--btn-ghost-active': 'rgba(15, 23, 42, 0.08)',
    
    '--slider-track': 'rgba(148, 163, 184, 0.4)',
    '--slider-track-active': 'rgba(99, 102, 241, 0.3)',
    '--slider-fill': '#6366f1',
    '--slider-thumb': '#ffffff',
    '--slider-thumb-border': '#6366f1',
    
    '--eq-band-low': '#ef4444',
    '--eq-band-mid': '#f59e0b',
    '--eq-band-high': '#22c55e',
    '--eq-bg': 'rgba(248, 250, 252, 0.8)',
    '--eq-track': 'rgba(148, 163, 184, 0.3)',
    
    '--lyric-active': '#0f172a',
    '--lyric-inactive': 'rgba(71, 85, 105, 0.5)',
    '--lyric-nearby': 'rgba(71, 85, 105, 0.7)',
    '--lyric-bg': 'rgba(248, 250, 252, 0.6)',
    '--lyric-active-bg': 'rgba(99, 102, 241, 0.1)',
    
    '--scrollbar-track': 'transparent',
    '--scrollbar-thumb': 'rgba(148, 163, 184, 0.3)',
    '--scrollbar-thumb-hover': 'rgba(148, 163, 184, 0.5)',
    
    '--shadow-xs': '0 1px 2px rgba(15, 23, 42, 0.03)',
    '--shadow-sm': '0 1px 3px rgba(15, 23, 42, 0.05)',
    '--shadow-md': '0 4px 6px rgba(15, 23, 42, 0.07)',
    '--shadow-lg': '0 10px 15px rgba(15, 23, 42, 0.1)',
    '--shadow-xl': '0 20px 25px rgba(15, 23, 42, 0.12)',
    '--shadow-glow': '0 0 20px rgba(99, 102, 241, 0.2)',
    
    '--glass-bg': 'rgba(255, 255, 255, 0.9)',
    '--glass-border': 'rgba(226, 232, 240, 0.8)',
    '--glass-bg-soft': 'rgba(255, 255, 255, 0.7)',
    
    '--song-item-bg': 'transparent',
    '--song-item-hover': 'rgba(99, 102, 241, 0.05)',
    '--song-item-active': 'rgba(99, 102, 241, 0.12)',
    '--song-item-remove': 'rgba(239, 68, 68, 0.1)',
    
    '--panel-bg': 'rgba(248, 250, 252, 0.9)',
    '--panel-border': 'rgba(226, 232, 240, 0.6)',
    '--panel-bg-soft': 'rgba(241, 245, 249, 0.8)',
    
    '--toggle-off': 'rgba(148, 163, 184, 0.4)',
    '--toggle-off-bg': 'rgba(226, 232, 240, 0.6)',
    '--toggle-on': 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
    '--toggle-thumb': '#ffffff',
    
    '--danger-bg': 'rgba(239, 68, 68, 0.08)',
    '--danger-border': 'rgba(239, 68, 68, 0.4)',
    '--danger-text': '#ef4444',
    
    '--gold-bg': 'rgba(245, 158, 11, 0.12)',
    '--gold-border': 'rgba(245, 158, 11, 0.4)',
    '--gold-text': '#f59e0b'
  }
}

const currentTheme = ref(THEME_MODES.DARK)
const isDark = ref(true)
const themeInitialized = ref(false)

function applyTheme(theme) {
  const colors = themeColors[theme] || themeColors.dark
  const root = document.documentElement
  
  Object.entries(colors).forEach(([key, value]) => {
    root.style.setProperty(key, value)
  })
  
  if (theme === THEME_MODES.DARK) {
    document.body.classList.add('theme-dark')
    document.body.classList.remove('theme-light')
  } else {
    document.body.classList.add('theme-light')
    document.body.classList.remove('theme-dark')
  }
}

function initTheme() {
  if (themeInitialized.value) return
  
  try {
    const storedTheme = getItem('music_player_theme', null)
    
    if (storedTheme && Object.values(THEME_MODES).includes(storedTheme)) {
      currentTheme.value = storedTheme
    } else {
      const prefersDark = window.matchMedia && 
        window.matchMedia('(prefers-color-scheme: dark)').matches
      currentTheme.value = prefersDark ? THEME_MODES.DARK : THEME_MODES.LIGHT
    }
    
    isDark.value = currentTheme.value === THEME_MODES.DARK
    applyTheme(currentTheme.value)
    themeInitialized.value = true
  } catch (err) {
    console.warn('Failed to initialize theme:', err)
    currentTheme.value = THEME_MODES.DARK
    isDark.value = true
    applyTheme(THEME_MODES.DARK)
    themeInitialized.value = true
  }
}

function setTheme(theme) {
  if (!Object.values(THEME_MODES).includes(theme)) {
    console.warn(`Invalid theme: ${theme}`)
    return
  }
  
  currentTheme.value = theme
  isDark.value = theme === THEME_MODES.DARK
  applyTheme(theme)
  
  try {
    setItem('music_player_theme', theme)
  } catch (err) {
    console.warn('Failed to save theme:', err)
  }
}

function toggleTheme() {
  const newTheme = currentTheme.value === THEME_MODES.DARK 
    ? THEME_MODES.LIGHT 
    : THEME_MODES.DARK
  setTheme(newTheme)
}

function resetTheme() {
  setTheme(THEME_MODES.DARK)
}

export function useTheme() {
  watch(currentTheme, (newTheme) => {
    if (themeInitialized.value) {
      setTheme(newTheme)
    }
  })
  
  return {
    currentTheme,
    isDark,
    themeInitialized,
    THEME_MODES,
    themeNames,
    themeColors,
    initTheme,
    setTheme,
    toggleTheme,
    resetTheme,
    applyTheme
  }
}
