export const STORAGE_KEYS = {
  PLAYER_CONFIG: 'music_player_config',
  PLAYLIST: 'music_player_playlist',
  PLAYLIST_ORDER: 'music_player_playlist_order',
  CURRENT_INDEX: 'music_player_current_index',
  THEME: 'music_player_theme',
  VOLUME: 'music_player_volume',
  PLAY_MODE: 'music_player_play_mode',
  EQ_CONFIG: 'music_player_eq_config',
  SLEEP_TIMER: 'music_player_sleep_timer',
  LYRICS_CONFIG: 'music_player_lyrics_config',
  LAYOUT_CONFIG: 'music_player_layout_config',
  PLAYLISTS: 'music_player_playlists',
  CURRENT_PLAYLIST: 'music_player_current_playlist',
  PLAY_STATISTICS: 'music_player_play_statistics',
  SPATIAL_CONFIG: 'music_player_spatial_config'
}

export const DEFAULT_CONFIG = {
  theme: 'dark',
  volume: 1,
  playMode: 'listLoop',
  eq: {
    enabled: true,
    preset: 'normal',
    gains: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
  },
  sleepTimer: {
    enabled: false,
    duration: 0,
    remaining: 0
  },
  lyrics: {
    showPanel: false,
    autoScroll: true,
    scrollDelay: 100
  },
  layout: {
    showPlaylist: true,
    lyricsFontSize: 14,
    eqExpanded: false,
    sleepTimerExpanded: false
  }
}

export function useStorage() {
  function getItem(key, defaultValue = null) {
    try {
      const stored = localStorage.getItem(key)
      if (stored === null || stored === undefined || stored === 'undefined') {
        return defaultValue
      }
      try {
        return JSON.parse(stored)
      } catch (parseErr) {
        console.warn(`Failed to parse localStorage key "${key}":`, parseErr)
        return defaultValue
      }
    } catch (err) {
      console.warn(`Failed to get localStorage key "${key}":`, err)
      return defaultValue
    }
  }

  function setItem(key, value) {
    try {
      if (value === undefined || value === null) {
        localStorage.removeItem(key)
      } else {
        localStorage.setItem(key, JSON.stringify(value))
      }
      return true
    } catch (err) {
      console.warn(`Failed to set localStorage key "${key}":`, err)
      return false
    }
  }

  function removeItem(key) {
    try {
      localStorage.removeItem(key)
      return true
    } catch (err) {
      console.warn(`Failed to remove localStorage key "${key}":`, err)
      return false
    }
  }

  function clearAll() {
    try {
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key)
      })
      return true
    } catch (err) {
      console.warn('Failed to clear localStorage:', err)
      return false
    }
  }

  function getFullConfig() {
    try {
      const stored = getItem(STORAGE_KEYS.PLAYER_CONFIG, {})
      return {
        ...DEFAULT_CONFIG,
        ...stored,
        eq: {
          ...DEFAULT_CONFIG.eq,
          ...(stored.eq || {})
        },
        sleepTimer: {
          ...DEFAULT_CONFIG.sleepTimer,
          ...(stored.sleepTimer || {})
        },
        lyrics: {
          ...DEFAULT_CONFIG.lyrics,
          ...(stored.lyrics || {})
        },
        layout: {
          ...DEFAULT_CONFIG.layout,
          ...(stored.layout || {})
        }
      }
    } catch (err) {
      console.warn('Failed to get full config:', err)
      return { ...DEFAULT_CONFIG }
    }
  }

  function saveFullConfig(config) {
    try {
      const configToSave = {
        ...DEFAULT_CONFIG,
        ...config
      }
      return setItem(STORAGE_KEYS.PLAYER_CONFIG, configToSave)
    } catch (err) {
      console.warn('Failed to save full config:', err)
      return false
    }
  }

  function updateConfigPartial(partialConfig) {
    try {
      const current = getFullConfig()
      const updated = {
        ...current,
        ...partialConfig
      }
      return saveFullConfig(updated)
    } catch (err) {
      console.warn('Failed to update config partial:', err)
      return false
    }
  }

  function savePlaylistOrder(playlist, currentIndex = 0) {
    try {
      if (!playlist || !Array.isArray(playlist)) {
        return false
      }
      const orderData = {
        ids: playlist.map(song => song.id),
        currentIndex: Math.max(0, Math.min(currentIndex, playlist.length - 1)),
        timestamp: Date.now()
      }
      return setItem(STORAGE_KEYS.PLAYLIST_ORDER, orderData)
    } catch (err) {
      console.warn('Failed to save playlist order:', err)
      return false
    }
  }

  function getPlaylistOrder() {
    try {
      const stored = getItem(STORAGE_KEYS.PLAYLIST_ORDER, null)
      if (!stored || !stored.ids || !Array.isArray(stored.ids)) {
        return null
      }
      return {
        ids: stored.ids,
        currentIndex: stored.currentIndex || 0,
        timestamp: stored.timestamp || 0
      }
    } catch (err) {
      console.warn('Failed to get playlist order:', err)
      return null
    }
  }

  function validateNumber(value, min, max, defaultValue) {
    if (typeof value !== 'number' || isNaN(value) || !isFinite(value)) {
      return defaultValue
    }
    return Math.max(min, Math.min(max, value))
  }

  function validateArray(value, minLength, maxLength, defaultValue) {
    if (!Array.isArray(value)) {
      return defaultValue
    }
    if (value.length < minLength || value.length > maxLength) {
      return defaultValue
    }
    return value
  }

  function validateEnum(value, validValues, defaultValue) {
    if (validValues.includes(value)) {
      return value
    }
    return defaultValue
  }

  function deepClone(obj) {
    try {
      return JSON.parse(JSON.stringify(obj))
    } catch (err) {
      console.warn('Deep clone failed:', err)
      return obj
    }
  }

  function isEqual(a, b) {
    try {
      return JSON.stringify(a) === JSON.stringify(b)
    } catch (err) {
      return false
    }
  }

  function getStorageInfo() {
    try {
      const keys = Object.values(STORAGE_KEYS)
      const info = {}
      
      keys.forEach(key => {
        const value = getItem(key, null)
        if (value !== null) {
          info[key] = {
            exists: true,
            size: JSON.stringify(value).length,
            type: typeof value
          }
        } else {
          info[key] = { exists: false }
        }
      })
      
      return info
    } catch (err) {
      console.warn('Failed to get storage info:', err)
      return {}
    }
  }

  return {
    STORAGE_KEYS,
    DEFAULT_CONFIG,
    getItem,
    setItem,
    removeItem,
    clearAll,
    getFullConfig,
    saveFullConfig,
    updateConfigPartial,
    savePlaylistOrder,
    getPlaylistOrder,
    validateNumber,
    validateArray,
    validateEnum,
    deepClone,
    isEqual,
    getStorageInfo
  }
}
