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
    '--bg-primary': '#0f172a',
    '--bg-secondary': '#1e293b',
    '--bg-tertiary': '#334155',
    '--bg-card': 'rgba(30, 41, 59, 0.9)',
    '--bg-overlay': 'rgba(0, 0, 0, 0.5)',
    
    '--text-primary': '#ffffff',
    '--text-secondary': '#94a3b8',
    '--text-muted': '#64748b',
    '--text-disabled': '#475569',
    
    '--border-primary': 'rgba(255, 255, 255, 0.1)',
    '--border-secondary': 'rgba(255, 255, 255, 0.05)',
    
    '--accent-primary': '#667eea',
    '--accent-secondary': '#764ba2',
    '--accent-gradient': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    '--accent-gold': '#ffd700',
    '--accent-danger': '#ff6b6b',
    '--accent-success': '#6bcb77',
    
    '--progress-bg': 'rgba(255, 255, 255, 0.1)',
    '--progress-fill': '#667eea',
    '--progress-thumb': '#ffffff',
    
    '--btn-bg': 'rgba(255, 255, 255, 0.1)',
    '--btn-hover': 'rgba(255, 255, 255, 0.15)',
    '--btn-active': 'rgba(255, 255, 255, 0.2)',
    '--btn-disabled': 'rgba(255, 255, 255, 0.05)',
    
    '--slider-track': 'rgba(255, 255, 255, 0.2)',
    '--slider-fill': '#667eea',
    '--slider-thumb': '#ffffff',
    
    '--eq-band-low': '#ff6b6b',
    '--eq-band-mid': '#ffd93d',
    '--eq-band-high': '#6bcb77',
    
    '--lyric-active': '#667eea',
    '--lyric-inactive': 'rgba(255, 255, 255, 0.6)',
    '--lyric-bg': 'rgba(0, 0, 0, 0.15)',
    
    '--scrollbar-track': 'transparent',
    '--scrollbar-thumb': 'rgba(255, 255, 255, 0.2)',
    '--scrollbar-thumb-hover': 'rgba(255, 255, 255, 0.4)',
    
    '--shadow-sm': '0 1px 2px rgba(0, 0, 0, 0.3)',
    '--shadow-md': '0 4px 6px rgba(0, 0, 0, 0.4)',
    '--shadow-lg': '0 10px 15px rgba(0, 0, 0, 0.5)',
    
    '--glass-bg': 'rgba(30, 41, 59, 0.8)',
    '--glass-border': 'rgba(255, 255, 255, 0.1)',
    
    '--song-item-hover': 'rgba(255, 255, 255, 0.05)',
    '--song-item-active': 'rgba(102, 126, 234, 0.2)',
    '--song-item-remove': 'rgba(255, 107, 107, 0.2)',
    
    '--panel-bg': 'rgba(0, 0, 0, 0.15)',
    '--panel-border': 'rgba(255, 255, 255, 0.05)',
    
    '--toggle-off': 'rgba(255, 255, 255, 0.2)',
    '--toggle-on': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    '--toggle-thumb': '#ffffff',
    
    '--danger-bg': 'rgba(255, 107, 107, 0.15)',
    '--danger-border': 'rgba(255, 107, 107, 0.5)',
    '--danger-text': 'rgba(255, 107, 107, 0.9)',
    
    '--gold-bg': 'rgba(255, 215, 0, 0.3)',
    '--gold-border': '#ffd700',
    '--gold-text': '#ffd700'
  },
  
  light: {
    '--bg-primary': '#f8fafc',
    '--bg-secondary': '#ffffff',
    '--bg-tertiary': '#e2e8f0',
    '--bg-card': 'rgba(255, 255, 255, 0.95)',
    '--bg-overlay': 'rgba(0, 0, 0, 0.3)',
    
    '--text-primary': '#1e293b',
    '--text-secondary': '#475569',
    '--text-muted': '#64748b',
    '--text-disabled': '#94a3b8',
    
    '--border-primary': 'rgba(0, 0, 0, 0.1)',
    '--border-secondary': 'rgba(0, 0, 0, 0.05)',
    
    '--accent-primary': '#667eea',
    '--accent-secondary': '#764ba2',
    '--accent-gradient': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    '--accent-gold': '#f59e0b',
    '--accent-danger': '#ef4444',
    '--accent-success': '#22c55e',
    
    '--progress-bg': 'rgba(0, 0, 0, 0.1)',
    '--progress-fill': '#667eea',
    '--progress-thumb': '#ffffff',
    
    '--btn-bg': 'rgba(102, 126, 234, 0.05)',
    '--btn-hover': 'rgba(102, 126, 234, 0.1)',
    '--btn-active': 'rgba(102, 126, 234, 0.15)',
    '--btn-disabled': 'rgba(0, 0, 0, 0.03)',
    
    '--slider-track': 'rgba(0, 0, 0, 0.1)',
    '--slider-fill': '#667eea',
    '--slider-thumb': '#ffffff',
    
    '--eq-band-low': '#ef4444',
    '--eq-band-mid': '#f59e0b',
    '--eq-band-high': '#22c55e',
    
    '--lyric-active': '#667eea',
    '--lyric-inactive': 'rgba(0, 0, 0, 0.5)',
    '--lyric-bg': 'rgba(0, 0, 0, 0.05)',
    
    '--scrollbar-track': 'transparent',
    '--scrollbar-thumb': 'rgba(0, 0, 0, 0.15)',
    '--scrollbar-thumb-hover': 'rgba(0, 0, 0, 0.25)',
    
    '--shadow-sm': '0 1px 2px rgba(0, 0, 0, 0.05)',
    '--shadow-md': '0 4px 6px rgba(0, 0, 0, 0.07)',
    '--shadow-lg': '0 10px 15px rgba(0, 0, 0, 0.1)',
    
    '--glass-bg': 'rgba(255, 255, 255, 0.9)',
    '--glass-border': 'rgba(0, 0, 0, 0.05)',
    
    '--song-item-hover': 'rgba(102, 126, 234, 0.05)',
    '--song-item-active': 'rgba(102, 126, 234, 0.15)',
    '--song-item-remove': 'rgba(239, 68, 68, 0.15)',
    
    '--panel-bg': 'rgba(0, 0, 0, 0.03)',
    '--panel-border': 'rgba(0, 0, 0, 0.05)',
    
    '--toggle-off': 'rgba(0, 0, 0, 0.1)',
    '--toggle-on': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    '--toggle-thumb': '#ffffff',
    
    '--danger-bg': 'rgba(239, 68, 68, 0.1)',
    '--danger-border': 'rgba(239, 68, 68, 0.5)',
    '--danger-text': 'rgba(239, 68, 68, 0.9)',
    
    '--gold-bg': 'rgba(245, 158, 11, 0.2)',
    '--gold-border': '#f59e0b',
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
