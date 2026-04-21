<script setup>
import { ref, onMounted, computed, watch, nextTick, onUnmounted } from 'vue'
import { 
  useAudioPlayer, 
  PlayMode, 
  EQPresets, 
  eqPresetNames, 
  eqPresetValues, 
  eqBandLabels,
  resetAllToDefault
} from '../composables/useAudioPlayer.js'
import { useLyrics } from '../composables/useLyrics.js'
import { useTheme, THEME_MODES } from '../composables/useTheme.js'
import { localSongs } from '../data/songs.js'

const {
  isPlaying,
  progress,
  formattedCurrentTime,
  formattedDuration,
  volume,
  isMuted,
  currentSong,
  currentIndex,
  currentTime,
  displayTime,
  duration,
  isLoading,
  error,
  playMode,
  isSeeking,
  isDragging,
  seekTargetTime,
  hasNext,
  hasPrevious,
  playModeLabel,
  sleepTimerEnabled,
  sleepTimerDuration,
  sleepTimerRemaining,
  sleepTimerRemainingFormatted,
  eqEnabled,
  currentEQPreset,
  currentEQPresetName,
  eqBandGains,
  playlist,
  isShuffled,
  setPlaylist,
  loadSong,
  togglePlay,
  nextSong,
  previousSong,
  seek,
  seekToTime,
  startDragging,
  updateDragTime,
  finishDragging,
  setVolume,
  toggleMute,
  togglePlayMode,
  setSleepTimer,
  cancelSleepTimer,
  updateEQBand,
  applyEQPreset,
  resetEQToDefault,
  toggleEQEnabled,
  reorderPlaylist,
  moveToTop,
  removeFromPlaylist,
  clearPlaylist,
  restorePlaylistOrder,
  toggleShuffle,
  formatTime
} = useAudioPlayer()

const {
  lyricsList,
  currentLyricIndex,
  currentLyric,
  showLyricsPanel,
  parseLyrics,
  findCurrentLyricIndex,
  seekToLyric,
  toggleLyricsPanel,
  clearLyrics
} = useLyrics()

const progressBarRef = ref(null)
const lyricsContainerRef = ref(null)
const lyricItemRefs = ref([])
const isDraggingProgress = ref(false)
const lastScrollTime = ref(0)
const SCROLL_THRESHOLD = 50

const songs = ref(localSongs)

const playModeIcon = computed(() => {
  switch (playMode.value) {
    case PlayMode.LIST_LOOP:
      return 'M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z'
    case PlayMode.SINGLE_LOOP:
      return 'M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4zm-4-2V9h-1l-2 1v1h1.5v4H13z'
    case PlayMode.SHUFFLE:
      return 'M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z'
    default:
      return 'M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z'
  }
})

const playModeColor = computed(() => {
  return playMode.value !== PlayMode.LIST_LOOP ? 'active' : ''
})

const lyricsButtonIcon = computed(() => {
  return showLyricsPanel.value 
    ? 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11H7v-2h10v2z'
    : 'M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z'
})

const lyricsButtonColor = computed(() => {
  return showLyricsPanel.value ? 'active' : ''
})

const showSleepTimerPanel = ref(false)

const sleepTimerOptions = ref([
  { minutes: 15, label: '15分钟' },
  { minutes: 30, label: '30分钟' },
  { minutes: 45, label: '45分钟' },
  { minutes: 60, label: '60分钟' },
  { minutes: 90, label: '90分钟' },
  { minutes: 0, label: '取消定时' }
])

const sleepTimerButtonColor = computed(() => {
  return sleepTimerEnabled.value ? 'active' : ''
})

const sleepTimerButtonIcon = computed(() => {
  if (sleepTimerEnabled.value) {
    return 'M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm4.2 14.2L11 13V7h1.5v5.2l4.5 2.7-.8 1.3z'
  }
  return 'M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm4.2 14.2L11 13V7h1.5v5.2l4.5 2.7-.8 1.3z'
})

function toggleSleepTimerPanel() {
  showSleepTimerPanel.value = !showSleepTimerPanel.value
}

function selectSleepTimer(minutes) {
  if (minutes === 0) {
    cancelSleepTimer()
  } else {
    setSleepTimer(minutes)
  }
  showSleepTimerPanel.value = false
}

const showEQPanel = ref(false)

const eqPresetList = ref([
  { value: EQPresets.NORMAL, label: '默认' },
  { value: EQPresets.BASS_BOOST, label: '重低音' },
  { value: EQPresets.POP, label: '流行' },
  { value: EQPresets.CLASSICAL, label: '古典' },
  { value: EQPresets.VOCAL, label: '人声增强' }
])

function toggleEQPanel() {
  showEQPanel.value = !showEQPanel.value
}

function selectEQPreset(preset) {
  applyEQPreset(preset)
}

function handleEQBandChange(index, gain) {
  updateEQBand(index, gain)
}

function getEQBandColor(bandIndex) {
  if (bandIndex < 3) return '#ff6b6b'
  if (bandIndex < 6) return '#ffd93d'
  return '#6bcb77'
}

const {
  currentTheme,
  isDark,
  initTheme,
  setTheme,
  toggleTheme
} = useTheme()

const showSettingsPanel = ref(false)

const dragOverIndex = ref(-1)
const draggingIndex = ref(-1)
const isDraggingSong = ref(false)

function handleDragStart(index) {
  draggingIndex.value = index
  isDraggingSong.value = true
}

function handleDragOver(event, index) {
  event.preventDefault()
  if (index !== draggingIndex.value) {
    dragOverIndex.value = index
  }
}

function handleDragLeave() {
  dragOverIndex.value = -1
}

function handleDrop(event, index) {
  event.preventDefault()
  if (draggingIndex.value !== -1 && index !== draggingIndex.value) {
    reorderPlaylist(draggingIndex.value, index)
  }
  draggingIndex.value = -1
  dragOverIndex.value = -1
  isDraggingSong.value = false
}

function handleDragEnd() {
  draggingIndex.value = -1
  dragOverIndex.value = -1
  isDraggingSong.value = false
}

function handleMoveToTop(index) {
  moveToTop(index)
}

function handleRemoveSong(index) {
  removeFromPlaylist(index)
}

function handleClearPlaylist() {
  if (confirm('确定要清空播放列表吗？')) {
    clearPlaylist()
  }
}

function handleToggleShuffle() {
  toggleShuffle()
}

function handleToggleTheme() {
  toggleTheme()
}

function handleResetAll() {
  if (confirm('确定要重置所有设置为默认状态吗？此操作不可撤销。')) {
    resetAllToDefault()
    window.location.reload()
  }
}

function toggleSettingsPanel() {
  showSettingsPanel.value = !showSettingsPanel.value
}

function saveLyricsConfig() {
  try {
    localStorage.setItem('music_player_lyrics_show', JSON.stringify(showLyricsPanel.value))
  } catch (err) {
    console.warn('Failed to save lyrics config:', err)
  }
}

function loadLyricsConfig() {
  try {
    const stored = localStorage.getItem('music_player_lyrics_show')
    if (stored !== null) {
      const saved = JSON.parse(stored)
      if (typeof saved === 'boolean') {
        showLyricsPanel.value = saved
      }
    }
  } catch (err) {
    console.warn('Failed to load lyrics config:', err)
  }
}

watch(showLyricsPanel, () => {
  saveLyricsConfig()
})

function getEventPosition(event) {
  if (event.touches && event.touches.length > 0) {
    return {
      clientX: event.touches[0].clientX,
      clientY: event.touches[0].clientY
    }
  }
  if (event.changedTouches && event.changedTouches.length > 0) {
    return {
      clientX: event.changedTouches[0].clientX,
      clientY: event.changedTouches[0].clientY
    }
  }
  return {
    clientX: event.clientX,
    clientY: event.clientY
  }
}

function handleProgressClick(event) {
  if (isDraggingProgress.value) return
  
  if (progressBarRef.value) {
    const rect = progressBarRef.value.getBoundingClientRect()
    const pos = getEventPosition(event)
    const percent = ((pos.clientX - rect.left) / rect.width) * 100
    seek(percent)
  }
}

function handleProgressMouseDown(event) {
  event.preventDefault()
  isDraggingProgress.value = true
  startDragging()
  handleProgressMove(event)
  
  window.addEventListener('mousemove', handleProgressMove)
  window.addEventListener('mouseup', handleProgressMouseUp)
}

function handleProgressTouchStart(event) {
  event.preventDefault()
  isDraggingProgress.value = true
  startDragging()
  handleProgressMove(event)
}

function handleProgressTouchMove(event) {
  if (isDraggingProgress.value) {
    handleProgressMove(event)
  }
}

function handleProgressTouchEnd(event) {
  if (isDraggingProgress.value) {
    handleProgressMouseUp(event)
  }
}

function handleProgressMove(event) {
  if (!isDraggingProgress.value || !progressBarRef.value) return
  
  const rect = progressBarRef.value.getBoundingClientRect()
  const pos = getEventPosition(event)
  let percent = ((pos.clientX - rect.left) / rect.width) * 100
  
  percent = Math.max(0, Math.min(100, percent))
  updateDragTime(percent)
}

function handleProgressMouseUp(event) {
  isDraggingProgress.value = false
  
  if (progressBarRef.value) {
    const rect = progressBarRef.value.getBoundingClientRect()
    const pos = getEventPosition(event)
    let percent = ((pos.clientX - rect.left) / rect.width) * 100
    percent = Math.max(0, Math.min(100, percent))
    
    finishDragging(percent)
  }
  
  window.removeEventListener('mousemove', handleProgressMove)
  window.removeEventListener('mouseup', handleProgressMouseUp)
}

function selectSong(song) {
  loadSong(song, true, true)
}

function handlePrevious() {
  if (playlist.value.length > 0) {
    previousSong()
  }
}

function handleNext() {
  if (playlist.value.length > 0) {
    nextSong()
  }
}

function setLyricsRef(el, index) {
  if (el) {
    lyricItemRefs.value[index] = el
  }
}

function scrollToCurrentLyric(smooth = true) {
  if (!showLyricsPanel.value) return
  
  if (currentLyricIndex.value >= 0 && lyricItemRefs.value[currentLyricIndex.value]) {
    const lyricEl = lyricItemRefs.value[currentLyricIndex.value]
    if (lyricEl && lyricsContainerRef.value) {
      const container = lyricsContainerRef.value
      const lyricTop = lyricEl.offsetTop
      const containerHeight = container.clientHeight
      const lyricHeight = lyricEl.clientHeight
      
      const targetScrollTop = lyricTop - (containerHeight / 2) + (lyricHeight / 2)
      
      container.scrollTo({
        top: Math.max(0, targetScrollTop),
        behavior: smooth ? 'smooth' : 'auto'
      })
      
      lastScrollTime.value = Date.now()
    }
  }
}

function handleLyricClick(index) {
  const time = seekToLyric(index)
  if (time !== null) {
    seekToTime(time)
  }
}

watch(displayTime, (newTime) => {
  if (lyricsList.value.length > 0) {
    const prevIndex = currentLyricIndex.value
    findCurrentLyricIndex(newTime)
    
    if (currentLyricIndex.value !== prevIndex) {
      nextTick(() => {
        if (isDragging.value || seekTargetTime.value !== null) {
          scrollToCurrentLyric(false)
        } else {
          scrollToCurrentLyric(true)
        }
      })
    }
  }
}, { immediate: true })

watch(currentSong, (newSong) => {
  if (newSong && newSong.lyrics) {
    parseLyrics(newSong.lyrics)
    findCurrentLyricIndex(displayTime.value)
    nextTick(() => {
      scrollToCurrentLyric(false)
    })
  } else {
    clearLyrics()
  }
})

onMounted(() => {
  initTheme()
  loadLyricsConfig()
  setPlaylist(songs.value, false)
  if (songs.value.length > 0 && songs.value[0].lyrics) {
    parseLyrics(songs.value[0].lyrics)
  }
})

onUnmounted(() => {
  window.removeEventListener('mousemove', handleProgressMove)
  window.removeEventListener('mouseup', handleProgressMouseUp)
})
</script>

<template>
  <div class="music-player">
    <div class="player-container">
      <div v-if="error" class="error-message">
        {{ error }}
      </div>
      
      <div class="song-info">
        <div class="album-cover">
          <img :src="currentSong?.cover || 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22200%22%3E%3Crect fill=%22%23667eea%22 width=%22200%22 height=%22200%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 font-size=%2240%22 text-anchor=%22middle%22 fill=%22white%22 dy=%22.3em%22%3E♪%3C/text%3E%3C/svg%3E'" 
               :alt="currentSong?.title" 
               class="cover-image"
               :class="{ 'playing': isPlaying, 'loading': isLoading }" />
          <div v-if="isLoading" class="loading-overlay">
            <div class="spinner"></div>
          </div>
        </div>
        <div class="song-details">
          <h3 class="song-title">{{ currentSong?.title || '选择一首歌曲' }}</h3>
          <p class="song-artist">{{ currentSong?.artist || '未知艺术家' }}</p>
          <p v-if="isLoading" class="loading-text">加载中...</p>
        </div>
      </div>

      <transition name="lyrics-panel">
        <div v-if="showLyricsPanel && lyricsList.length > 0" class="lyrics-section">
          <div class="lyrics-container" ref="lyricsContainerRef">
            <div v-for="(lyric, index) in lyricsList" 
                 :key="index"
                 ref="(el) => setLyricsRef(el, index)"
                 class="lyric-line"
                 :class="{ 
                   'active': currentLyricIndex === index,
                   'nearby': Math.abs(currentLyricIndex - index) <= 2
                 }"
                 @click="handleLyricClick(index)">
              <span class="lyric-text">{{ lyric.text }}</span>
              <span v-if="currentLyricIndex === index" class="lyric-time">
                {{ formatTime(lyric.time) }}
              </span>
            </div>
            <div class="lyrics-bottom-padding"></div>
          </div>
        </div>
      </transition>

      <div v-if="showLyricsPanel && lyricsList.length === 0" class="no-lyrics">
        <p>当前歌曲暂无歌词</p>
      </div>

      <transition name="sleep-timer-panel">
        <div v-if="showSleepTimerPanel" class="sleep-timer-section">
          <h5 class="timer-title">睡眠定时</h5>
          <div v-if="sleepTimerEnabled" class="timer-status">
            <span class="remaining-time">{{ sleepTimerRemainingFormatted }}</span>
            <span class="timer-label">后暂停播放</span>
          </div>
          <div class="timer-options">
            <button v-for="option in sleepTimerOptions" 
                    :key="option.minutes"
                    class="timer-option-btn"
                    :class="{ 
                      'active': sleepTimerDuration === option.minutes && option.minutes !== 0,
                      'cancel': option.minutes === 0
                    }"
                    @click="selectSleepTimer(option.minutes)">
              {{ option.label }}
            </button>
          </div>
        </div>
      </transition>

      <transition name="eq-panel">
        <div v-if="showEQPanel" class="eq-section">
          <div class="eq-header">
            <h5 class="eq-title">音效均衡器</h5>
            <div class="eq-toggle">
              <span class="eq-toggle-label">{{ eqEnabled ? '开启' : '关闭' }}</span>
              <button class="eq-toggle-btn" @click="toggleEQEnabled"
                      :class="{ 'active': eqEnabled }">
                <span class="eq-toggle-thumb"></span>
              </button>
            </div>
          </div>
          
          <div class="eq-preset-selector">
            <button v-for="preset in eqPresetList" 
                    :key="preset.value"
                    class="eq-preset-btn"
                    :class="{ 'active': currentEQPreset === preset.value }"
                    @click="selectEQPreset(preset.value)">
              {{ preset.label }}
            </button>
          </div>

          <div class="eq-band-controls" :class="{ 'disabled': !eqEnabled }">
            <div class="eq-band" v-for="(gain, index) in eqBandGains" :key="index">
              <div class="eq-band-label">{{ eqBandLabels[index] }}</div>
              <div class="eq-band-slider-wrapper">
                <div class="eq-band-track" :style="{ backgroundColor: getEQBandColor(index) + '20' }">
                  <div class="eq-band-fill" 
                       :style="{ 
                         height: Math.abs(gain) * 5 + '%',
                         bottom: gain >= 0 ? '50%' : 'auto',
                         top: gain < 0 ? '50%' : 'auto',
                         backgroundColor: getEQBandColor(index)
                       }">
                  </div>
                </div>
                <input type="range" 
                       class="eq-band-slider"
                       min="-12" 
                       max="12" 
                       step="1"
                       :value="gain"
                       :disabled="!eqEnabled"
                       @input="handleEQBandChange(index, parseFloat($event.target.value))" />
              </div>
              <div class="eq-band-value" :style="{ color: getEQBandColor(index) }">
                {{ gain > 0 ? '+' + gain : gain }}dB
              </div>
            </div>
          </div>

          <div class="eq-footer">
            <button class="eq-reset-btn" @click="resetEQToDefault">
              重置
            </button>
          </div>
        </div>
      </transition>

      <div class="progress-section">
        <div class="progress-bar-container" 
             ref="progressBarRef"
             @click="handleProgressClick"
             @mousedown="handleProgressMouseDown"
             @touchstart="handleProgressTouchStart"
             @touchmove="handleProgressTouchMove"
             @touchend="handleProgressTouchEnd">
          <div class="progress-background"></div>
          <div class="progress-fill" :style="{ width: progress + '%' }"></div>
          <div class="progress-thumb" :style="{ left: progress + '%' }"></div>
        </div>
        <div class="time-display">
          <span class="current-time">{{ formattedCurrentTime }}</span>
          <span class="total-time">{{ formattedDuration }}</span>
        </div>
      </div>

      <div class="controls">
        <button class="control-btn theme-btn"
                @click="handleToggleTheme"
                :title="isDark ? '切换为浅色主题' : '切换为深色主题'">
          <svg v-if="isDark" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/>
          </svg>
          <svg v-else viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/>
          </svg>
        </button>

        <button class="control-btn reset-btn"
                @click="handleResetAll"
                title="重置所有设置为默认">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 12a9 9 0 109-9 9.75 9.75 0 00-6.74 2.74L3 8"/>
            <path d="M3 3v5h5"/>
          </svg>
        </button>

        <button class="control-btn lyrics-btn"
                @click="toggleLyricsPanel"
                :class="lyricsButtonColor"
                :title="showLyricsPanel ? '关闭歌词' : '显示歌词'">
          <svg viewBox="0 0 24 24" width="22" height="22">
            <path :d="lyricsButtonIcon" />
          </svg>
        </button>

        <button class="control-btn sleep-timer-btn"
                @click="toggleSleepTimerPanel"
                :class="sleepTimerButtonColor"
                :title="sleepTimerEnabled ? `定时中: ${sleepTimerRemainingFormatted}` : '睡眠定时'">
          <svg viewBox="0 0 24 24" width="22" height="22">
            <path :d="sleepTimerButtonIcon" />
          </svg>
        </button>

        <button class="control-btn eq-btn"
                @click="toggleEQPanel"
                :class="{ 'active': currentEQPreset !== EQPresets.NORMAL }"
                :title="`音效: ${currentEQPresetName}`">
          <svg viewBox="0 0 24 24" width="22" height="22">
            <path d="M3 17v2h6v-2H3zM3 5v2h10V5H3zm10 16v-2h8v-2h-8v-2h-2v6h2zM7 9v2H3v2h4v2h2V9H7zm14 4v-2H11v2h10zm-6-4h2V7h4V5h-4V3h-2v6z"/>
          </svg>
        </button>

        <button class="control-btn play-mode-btn" 
                @click="togglePlayMode"
                :class="playModeColor"
                :title="playModeLabel">
          <svg viewBox="0 0 24 24" width="22" height="22">
            <path :d="playModeIcon" />
          </svg>
        </button>

        <button class="control-btn skip-btn" 
                @click="handlePrevious"
                :disabled="playlist.length <= 1">
          <svg viewBox="0 0 24 24" width="24" height="24">
            <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
          </svg>
        </button>
        
        <button class="control-btn play-btn" 
                @click="togglePlay"
                :disabled="!currentSong">
          <svg v-if="!isPlaying" viewBox="0 0 24 24" width="32" height="32">
            <path d="M8 5v14l11-7z"/>
          </svg>
          <svg v-else viewBox="0 0 24 24" width="32" height="32">
            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
          </svg>
        </button>
        
        <button class="control-btn skip-btn" 
                @click="handleNext"
                :disabled="playlist.length <= 1">
          <svg viewBox="0 0 24 24" width="24" height="24">
            <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
          </svg>
        </button>

        <div class="play-mode-indicator">
          <span class="mode-label">{{ playModeLabel }}</span>
        </div>
      </div>

      <div class="volume-control">
        <button class="control-btn volume-btn" @click="toggleMute">
          <svg v-if="isMuted || volume === 0" viewBox="0 0 24 24" width="20" height="20">
            <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
          </svg>
          <svg v-else viewBox="0 0 24 24" width="20" height="20">
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
          </svg>
        </button>
        <input type="range" 
               class="volume-slider" 
               min="0" 
               max="1" 
               step="0.01" 
               :value="isMuted ? 0 : volume" 
               @input="setVolume(parseFloat($event.target.value))" />
      </div>
    </div>

    <div class="playlist">
      <div class="playlist-header">
        <h4 class="playlist-title">
          播放列表 ({{ playlist.length }})
          <span v-if="isShuffled" class="shuffle-badge">乱序</span>
        </h4>
        <div class="playlist-actions">
          <button class="action-btn mini" @click="handleToggleShuffle" :class="{ 'active': isShuffled }">
            <svg class="icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/>
            </svg>
          </button>
          <button class="action-btn mini danger" @click="handleClearPlaylist">
            <svg class="icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
            </svg>
          </button>
        </div>
      </div>
      <div class="song-list">
        <div v-if="playlist.length === 0" class="empty-playlist">
          <span>播放列表为空</span>
        </div>
        <div v-for="(song, index) in playlist" 
             :key="song.id + '-' + index" 
             class="song-item"
             :class="{ 
               'active': currentSong?.id === song.id,
               'current': currentIndex === index,
               'drag-over': dragOverIndex === index,
               'dragging': draggingIndex === index
             }"
             draggable="true"
             @dragstart="handleDragStart(index)"
             @dragover="handleDragOver($event, index)"
             @dragleave="handleDragLeave"
             @drop="handleDrop($event, index)"
             @dragend="handleDragEnd">
          <div class="drag-handle" draggable="true">
            <svg class="icon" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
              <path d="M8 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm0 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm0 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm8-16a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm0 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm0 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/>
            </svg>
          </div>
          <div class="song-number">
            <span v-if="currentSong?.id === song.id && isPlaying" class="playing-indicator">
              <span class="bar"></span>
              <span class="bar"></span>
              <span class="bar"></span>
            </span>
            <span v-else class="number">{{ index + 1 }}</span>
          </div>
          <img :src="song.cover" :alt="song.title" class="song-cover" @click.stop="selectSong(song)" />
          <div class="song-info-mini" @click.stop="selectSong(song)">
            <span class="song-title-mini">{{ song.title }}</span>
            <span class="song-artist-mini">{{ song.artist }}</span>
          </div>
          <div class="song-actions">
            <button class="action-btn mini" @click.stop="handleMoveToTop(index)" :disabled="index === 0">
              <svg class="icon" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 19V5M5 12l7-7 7 7"/>
              </svg>
            </button>
            <button class="action-btn mini danger" @click.stop="handleRemoveSong(index)">
              <svg class="icon" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.music-player {
  background: white;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  max-width: 400px;
  width: 100%;
}

.error-message {
  background: #fee2e2;
  color: #dc2626;
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  text-align: center;
}

.player-container {
  padding: 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.song-info {
  display: flex;
  align-items: center;
  margin-bottom: 1.5rem;
}

.album-cover {
  position: relative;
  width: 100px;
  height: 100px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
}

.cover-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.cover-image.playing {
  animation: rotate 10s linear infinite;
}

.cover-image.loading {
  opacity: 0.5;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.3);
}

.spinner {
  width: 30px;
  height: 30px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.song-details {
  margin-left: 1.5rem;
  color: white;
  flex: 1;
}

.song-title {
  margin: 0 0 0.5rem 0;
  font-size: 1.25rem;
  font-weight: 600;
}

.song-artist {
  margin: 0 0 0.25rem 0;
  font-size: 0.9rem;
  opacity: 0.8;
}

.loading-text {
  margin: 0;
  font-size: 0.8rem;
  opacity: 0.7;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 0.7; }
  50% { opacity: 1; }
}

.lyrics-section {
  margin-bottom: 1rem;
  background: rgba(0, 0, 0, 0.15);
  border-radius: 8px;
  padding: 1rem;
}

.lyrics-container {
  max-height: 180px;
  overflow-y: auto;
}

.lyric-line {
  text-align: center;
  padding: 0.75rem 0.5rem;
  color: rgba(255, 255, 255, 0.4);
  font-size: 0.9rem;
  line-height: 1.6;
  transition: all 0.3s ease;
  cursor: pointer;
  border-radius: 4px;
  position: relative;
}

.lyric-line:hover:not(.active) {
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.6);
}

.lyric-line.nearby:not(.active) {
  color: rgba(255, 255, 255, 0.55);
}

.lyric-line.active {
  color: white;
  font-size: 1.15rem;
  font-weight: 600;
  text-shadow: 0 0 15px rgba(255, 255, 255, 0.6);
  background: rgba(255, 255, 255, 0.1);
  padding: 1rem 0.5rem;
}

.lyric-text {
  display: block;
}

.lyric-time {
  font-size: 0.7rem;
  opacity: 0.6;
  font-weight: normal;
  margin-top: 0.25rem;
  display: block;
}

.lyrics-bottom-padding {
  height: 100px;
}

.no-lyrics {
  text-align: center;
  padding: 1.5rem;
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.9rem;
}

.lyrics-panel-enter-active,
.lyrics-panel-leave-active {
  transition: all 0.3s ease;
}

.lyrics-panel-enter-from,
.lyrics-panel-leave-to {
  opacity: 0;
  max-height: 0;
  transform: translateY(-10px);
  margin-bottom: 0;
  padding-top: 0;
  padding-bottom: 0;
}

.progress-section {
  margin-bottom: 1.5rem;
}

.progress-bar-container {
  position: relative;
  height: 8px;
  cursor: pointer;
  margin-bottom: 0.5rem;
  touch-action: none;
}

.progress-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 4px;
}

.progress-fill {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: white;
  border-radius: 4px;
}

.progress-thumb {
  position: absolute;
  top: 50%;
  width: 16px;
  height: 16px;
  background: white;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  transition: transform 0.1s ease;
}

.progress-thumb:hover,
.progress-bar-container:active .progress-thumb {
  transform: translate(-50%, -50%) scale(1.2);
}

.time-display {
  display: flex;
  justify-content: space-between;
  color: white;
  font-size: 0.85rem;
  opacity: 0.9;
}

.controls {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.control-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.control-btn:hover:not(:disabled) {
  transform: scale(1.1);
}

.control-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.control-btn svg {
  fill: white;
}

.lyrics-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  transition: background-color 0.2s ease;
}

.lyrics-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.lyrics-btn.active {
  background: rgba(255, 255, 255, 0.2);
}

.lyrics-btn.active svg {
  fill: #ffd700;
}

.play-mode-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  transition: background-color 0.2s ease;
}

.play-mode-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.play-mode-btn.active {
  background: rgba(255, 255, 255, 0.2);
}

.play-mode-btn.active svg {
  fill: #ffd700;
}

.play-btn {
  width: 64px;
  height: 64px;
  background: white !important;
  border-radius: 50%;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
}

.play-btn svg {
  fill: #667eea !important;
}

.play-btn:disabled {
  opacity: 0.5;
}

.play-mode-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
}

.mode-label {
  font-size: 0.65rem;
  color: white;
  opacity: 0.7;
  white-space: nowrap;
  display: none;
}

.volume-control {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.volume-btn {
  padding: 0.25rem;
}

.volume-slider {
  width: 100px;
  height: 4px;
  -webkit-appearance: none;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
  outline: none;
  cursor: pointer;
}

.volume-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 12px;
  height: 12px;
  background: white;
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.volume-slider::-moz-range-thumb {
  width: 12px;
  height: 12px;
  background: white;
  border-radius: 50%;
  cursor: pointer;
  border: none;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.playlist {
  padding: 1rem;
  background: #f8f9fa;
}

.playlist-title {
  margin: 0 0 1rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: #333;
}

.song-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: 300px;
  overflow-y: auto;
}

.song-item {
  display: flex;
  align-items: center;
  padding: 0.75rem;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.song-item:hover {
  background: rgba(102, 126, 234, 0.1);
}

.song-item.active,
.song-item.current {
  background: rgba(102, 126, 234, 0.2);
}

.song-number {
  width: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 0.5rem;
}

.number {
  font-size: 0.85rem;
  color: #666;
  font-weight: 500;
}

.song-cover {
  width: 48px;
  height: 48px;
  border-radius: 6px;
  object-fit: cover;
}

.song-info-mini {
  display: flex;
  flex-direction: column;
  margin-left: 1rem;
  flex: 1;
  min-width: 0;
}

.song-title-mini {
  font-size: 0.9rem;
  font-weight: 500;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.song-artist-mini {
  font-size: 0.75rem;
  color: #666;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.playing-indicator {
  display: flex;
  align-items: flex-end;
  gap: 2px;
  height: 16px;
}

.playing-indicator .bar {
  width: 3px;
  background: #667eea;
  animation: bar 0.5s ease-in-out infinite alternate;
}

.playing-indicator .bar:nth-child(1) { animation-delay: 0s; height: 4px; }
.playing-indicator .bar:nth-child(2) { animation-delay: 0.2s; height: 8px; }
.playing-indicator .bar:nth-child(3) { animation-delay: 0.4s; height: 6px; }

@keyframes bar {
  from { height: 4px; }
  to { height: 12px; }
}

.song-list::-webkit-scrollbar {
  width: 4px;
}

.song-list::-webkit-scrollbar-track {
  background: transparent;
}

.song-list::-webkit-scrollbar-thumb {
  background: rgba(102, 126, 234, 0.3);
  border-radius: 2px;
}

.song-list::-webkit-scrollbar-thumb:hover {
  background: rgba(102, 126, 234, 0.5);
}

.lyrics-container::-webkit-scrollbar {
  width: 4px;
}

.lyrics-container::-webkit-scrollbar-track {
  background: transparent;
}

.lyrics-container::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
}

.lyrics-container::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.4);
}

.sleep-timer-section {
  margin-bottom: 1rem;
  background: rgba(0, 0, 0, 0.15);
  border-radius: 8px;
  padding: 1rem;
}

.timer-title {
  margin: 0 0 0.75rem 0;
  color: white;
  font-size: 0.95rem;
  font-weight: 600;
}

.timer-status {
  text-align: center;
  margin-bottom: 0.75rem;
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 6px;
}

.remaining-time {
  display: block;
  font-size: 1.5rem;
  font-weight: 700;
  color: #ffd700;
}

.timer-label {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.7);
}

.timer-options {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: center;
}

.timer-option-btn {
  padding: 0.5rem 1rem;
  border: 1px solid rgba(255, 255, 255, 0.3);
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border-radius: 20px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.timer-option-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.4);
}

.timer-option-btn.active {
  background: rgba(255, 215, 0, 0.3);
  border-color: #ffd700;
  color: #ffd700;
}

.timer-option-btn.cancel {
  background: rgba(255, 100, 100, 0.2);
  border-color: rgba(255, 100, 100, 0.5);
}

.timer-option-btn.cancel:hover {
  background: rgba(255, 100, 100, 0.3);
}

.sleep-timer-panel-enter-active,
.sleep-timer-panel-leave-active {
  transition: all 0.3s ease;
}

.sleep-timer-panel-enter-from,
.sleep-timer-panel-leave-to {
  opacity: 0;
  max-height: 0;
  transform: translateY(-10px);
  margin-bottom: 0;
  padding-top: 0;
  padding-bottom: 0;
}

.sleep-timer-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  transition: background-color 0.2s ease;
}

.sleep-timer-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.sleep-timer-btn.active {
  background: rgba(255, 255, 255, 0.2);
}

.sleep-timer-btn.active svg {
  fill: #ffd700;
}

.eq-section {
  margin-bottom: 1rem;
  background: rgba(0, 0, 0, 0.15);
  border-radius: 8px;
  padding: 1rem;
}

.eq-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.eq-title {
  margin: 0;
  color: white;
  font-size: 0.95rem;
  font-weight: 600;
}

.eq-toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.eq-toggle-label {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.7);
}

.eq-toggle-btn {
  width: 40px;
  height: 22px;
  border-radius: 11px;
  border: none;
  background: rgba(255, 255, 255, 0.2);
  position: relative;
  cursor: pointer;
  transition: background 0.2s ease;
  padding: 0;
}

.eq-toggle-btn.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.eq-toggle-thumb {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: white;
  transition: transform 0.2s ease;
}

.eq-toggle-btn.active .eq-toggle-thumb {
  transform: translateX(18px);
}

.eq-preset-selector {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: center;
  margin-bottom: 1rem;
}

.eq-preset-btn {
  padding: 0.4rem 0.8rem;
  border: 1px solid rgba(255, 255, 255, 0.3);
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border-radius: 16px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.eq-preset-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.4);
}

.eq-preset-btn.active {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.4) 0%, rgba(118, 75, 162, 0.4) 100%);
  border-color: #667eea;
}

.eq-band-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  gap: 0.3rem;
}

.eq-band-controls.disabled {
  opacity: 0.5;
  pointer-events: none;
}

.eq-band {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
  flex: 1;
  min-width: 0;
}

.eq-band-label {
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.6);
  text-align: center;
}

.eq-band-slider-wrapper {
  position: relative;
  width: 100%;
  height: 120px;
  display: flex;
  justify-content: center;
}

.eq-band-track {
  position: absolute;
  width: 4px;
  height: 100%;
  border-radius: 2px;
  z-index: 1;
}

.eq-band-fill {
  position: absolute;
  width: 100%;
  border-radius: 2px;
  z-index: 2;
  transition: height 0.1s ease;
}

.eq-band-slider {
  position: absolute;
  width: 120px;
  height: 20px;
  transform: rotate(-90deg);
  transform-origin: center;
  top: 50%;
  left: 50%;
  margin-left: -60px;
  margin-top: -10px;
  -webkit-appearance: none;
  appearance: none;
  background: transparent;
  cursor: pointer;
  z-index: 3;
}

.eq-band-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  cursor: pointer;
  border: 2px solid white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.eq-band-slider::-webkit-slider-runnable-track {
  width: 100%;
  height: 4px;
  background: transparent;
  border-radius: 2px;
}

.eq-band-slider::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  cursor: pointer;
  border: 2px solid white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.eq-band-slider::-moz-range-track {
  width: 100%;
  height: 4px;
  background: transparent;
  border-radius: 2px;
}

.eq-band-slider:disabled {
  cursor: not-allowed;
}

.eq-band-slider:disabled::-webkit-slider-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.5);
}

.eq-band-value {
  font-size: 0.7rem;
  font-weight: 600;
  text-align: center;
}

.eq-footer {
  display: flex;
  justify-content: center;
  margin-top: 1rem;
}

.eq-reset-btn {
  padding: 0.5rem 1.5rem;
  border: 1px solid rgba(255, 100, 100, 0.5);
  background: rgba(255, 100, 100, 0.15);
  color: rgba(255, 100, 100, 0.9);
  border-radius: 20px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.eq-reset-btn:hover {
  background: rgba(255, 100, 100, 0.3);
  border-color: rgba(255, 100, 100, 0.7);
}

.eq-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  transition: background-color 0.2s ease;
}

.eq-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.eq-btn.active {
  background: rgba(255, 255, 255, 0.2);
}

.eq-btn.active svg {
  fill: #667eea;
}

.eq-panel-enter-active,
.eq-panel-leave-active {
  transition: all 0.3s ease;
}

.eq-panel-enter-from,
.eq-panel-leave-to {
  opacity: 0;
  max-height: 0;
  transform: translateY(-10px);
  margin-bottom: 0;
  padding-top: 0;
  padding-bottom: 0;
}

.playlist-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.playlist-actions {
  display: flex;
  gap: 0.5rem;
}

.shuffle-badge {
  font-size: 0.7rem;
  padding: 0.2rem 0.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 10px;
  margin-left: 0.5rem;
  font-weight: 500;
}

.empty-playlist {
  text-align: center;
  padding: 2rem;
  color: #999;
  font-size: 0.9rem;
}

.drag-handle {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.25rem;
  cursor: grab;
  color: #aaa;
  opacity: 0.6;
  transition: opacity 0.2s ease, color 0.2s ease;
}

.drag-handle:hover {
  opacity: 1;
  color: #666;
}

.song-item.dragging {
  opacity: 0.5;
}

.song-item.drag-over {
  border-top: 2px solid #667eea;
}

.song-actions {
  display: flex;
  gap: 0.25rem;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.song-item:hover .song-actions {
  opacity: 1;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(102, 126, 234, 0.1);
  border: none;
  border-radius: 6px;
  padding: 0.4rem;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #667eea;
}

.action-btn:hover:not(:disabled) {
  background: rgba(102, 126, 234, 0.2);
}

.action-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.action-btn.mini {
  padding: 0.3rem;
  width: 24px;
  height: 24px;
}

.action-btn.mini svg {
  width: 14px;
  height: 14px;
}

.action-btn.danger {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.action-btn.danger:hover:not(:disabled) {
  background: rgba(239, 68, 68, 0.2);
}

.action-btn.active {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.3) 0%, rgba(118, 75, 162, 0.3) 100%);
}

.theme-btn,
.reset-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  transition: background-color 0.2s ease;
}

.theme-btn:hover,
.reset-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.reset-btn {
  opacity: 0.8;
}

.reset-btn:hover {
  opacity: 1;
}

.theme-btn svg,
.reset-btn svg {
  stroke-width: 2;
}
</style>
