<script setup>
import { ref, onMounted, computed, watch, nextTick, onUnmounted } from 'vue'
import { 
  useAudioPlayer, 
  PlayMode, 
  EQPresets, 
  eqPresetNames, 
  eqPresetValues, 
  eqBandLabels,
  playbackRates,
  playbackRateLabels,
  resetAllToDefault,
  defaultLyricsSettings
} from '../composables/useAudioPlayer.js'
import { useLyrics } from '../composables/useLyrics.js'
import { useTheme, THEME_MODES } from '../composables/useTheme.js'
import { usePlaylists } from '../composables/usePlaylists.js'
import { localSongs, getSongById } from '../data/songs.js'
import FullscreenLyrics from './FullscreenLyrics.vue'

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
  playbackRate,
  lyricsSettings,
  fadeEnabled,
  fadeDuration,
  coverRotation,
  lastPlayback,
  
  statistics,
  totalListenTimeFormatted,
  todayPlayCount,
  top10Songs,
  activeDays,
  resetStatistics,
  getWeeklyStats,
  getSongPlayCount,
  getSongPlayTime,
  
  spatialConfig,
  currentSpatialPresetName,
  currentReverbPresetName,
  SpatialPresets,
  ReverbPresets,
  availableSpatialPresets,
  availableReverbPresets,
  toggleSpatialEnabled,
  toggleReverbEnabled,
  setSpatialPreset,
  setReverbPreset,
  setReverbWet,
  setReverbDry,
  setSpatialWidth,
  setSpatialDepth,
  setPanning,
  togglePanningEnabled,
  resetSpatialConfig,
  
  clearAll,
  
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
  setPlaybackRate,
  setLyricsSettings,
  toggleFade,
  setFadeDuration,
  tryResumePlayback,
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

const {
  playlists,
  currentPlaylistId,
  currentPlaylist,
  favoritesPlaylist,
  playlistCount,
  initPlaylists,
  createPlaylist,
  deletePlaylist,
  updatePlaylist,
  selectPlaylist,
  addSongToPlaylist,
  removeSongFromPlaylist,
  moveSongInPlaylist,
  isSongInPlaylist,
  isSongInFavorites,
  toggleFavorite,
  getPlaylistById,
  clearPlaylistSongs,
  resetAllPlaylists
} = usePlaylists()

const showPlaylistManager = ref(false)
const showNewPlaylistDialog = ref(false)
const showAddToPlaylistDialog = ref(false)
const selectedSongForPlaylist = ref(null)
const newPlaylistName = ref('')
const creatingPlaylist = ref(false)

const showStatisticsPanel = ref(false)
const showSpatialPanel = ref(false)
const showSettingsPanel = ref(false)
const showErrorToast = ref(false)
const errorToastMessage = ref('')

const weeklyStats = computed(() => {
  return getWeeklyStats()
})

const topSongsWithDetails = computed(() => {
  return top10Songs.value.map(item => {
    const song = getSongById(item.id)
    return {
      ...item,
      song
    }
  }).filter(item => item.song !== undefined)
})

function toggleStatisticsPanel() {
  showStatisticsPanel.value = !showStatisticsPanel.value
  if (showStatisticsPanel.value) {
    showSpatialPanel.value = false
    showSettingsPanel.value = false
  }
}

function toggleSpatialPanel() {
  showSpatialPanel.value = !showSpatialPanel.value
  if (showSpatialPanel.value) {
    showStatisticsPanel.value = false
    showSettingsPanel.value = false
  }
}

function toggleSettingsPanel() {
  showSettingsPanel.value = !showSettingsPanel.value
  if (showSettingsPanel.value) {
    showStatisticsPanel.value = false
    showSpatialPanel.value = false
  }
}

function handleClearAllData() {
  if (confirm('确定要清除所有数据吗？此操作将清除所有播放记录、歌单数据和设置。')) {
    clearAll()
    resetAllPlaylists()
    resetStatistics()
    resetSpatialConfig()
    resetAllToDefault()
    window.location.reload()
  }
}

function handleClearCache() {
  if (confirm('确定要清除播放统计数据吗？')) {
    resetStatistics()
    showToast('播放统计已清除')
  }
}

function showToast(message) {
  errorToastMessage.value = message
  showErrorToast.value = true
  setTimeout(() => {
    showErrorToast.value = false
  }, 3000)
}

function handleResetSpatial() {
  resetSpatialConfig()
  showToast('空间音效已重置为默认')
}

function handleResetPlaylists() {
  if (confirm('确定要重置所有歌单吗？')) {
    resetAllPlaylists()
    showToast('歌单已重置')
  }
}

const currentPlaylistSongs = computed(() => {
  if (!currentPlaylist.value || !currentPlaylist.value.songIds) return []
  return currentPlaylist.value.songIds
    .map(id => getSongById(id))
    .filter(song => song !== undefined)
})

function togglePlaylistManager() {
  showPlaylistManager.value = !showPlaylistManager.value
}

function handleCreatePlaylist() {
  if (!newPlaylistName.value.trim()) return
  
  creatingPlaylist.value = true
  const playlist = createPlaylist(newPlaylistName.value.trim())
  
  if (playlist) {
    if (selectedSongForPlaylist.value) {
      addSongToPlaylist(playlist.id, selectedSongForPlaylist.value.id)
      selectedSongForPlaylist.value = null
      showToast(`歌单"${playlist.name}"创建成功，并已添加当前歌曲`)
    } else {
      showToast(`歌单"${playlist.name}"创建成功`)
    }
    newPlaylistName.value = ''
    showNewPlaylistDialog.value = false
  }
  
  creatingPlaylist.value = false
}

function handleDeletePlaylist(playlistId) {
  const playlist = getPlaylistById(playlistId)
  if (!playlist) return
  
  if (confirm(`确定要删除歌单"${playlist.name}"吗？此操作不可撤销。`)) {
    const success = deletePlaylist(playlistId)
    if (success) {
      showToast(`歌单"${playlist.name}"已删除`)
    }
  }
}

function handleSelectPlaylist(playlistId) {
  selectPlaylist(playlistId)
  const songs = currentPlaylistSongs.value
  if (songs.length > 0) {
    setPlaylist(songs, false)
  }
  showPlaylistManager.value = false
}

function handlePlayPlaylist(playlistId) {
  const playlist = getPlaylistById(playlistId)
  if (!playlist || !playlist.songIds || playlist.songIds.length === 0) return
  
  const songs = playlist.songIds
    .map(id => getSongById(id))
    .filter(song => song !== undefined)
  
  if (songs.length > 0) {
    setPlaylist(songs, true)
  }
  showPlaylistManager.value = false
}

function openAddToPlaylistDialog(song) {
  selectedSongForPlaylist.value = song
  showAddToPlaylistDialog.value = true
}

function handleAddSongToPlaylist(playlistId) {
  if (!selectedSongForPlaylist.value) return
  
  const playlist = getPlaylistById(playlistId)
  const song = selectedSongForPlaylist.value
  
  if (!playlist) return
  
  const alreadyInPlaylist = isSongInPlaylist(playlistId, song.id)
  
  addSongToPlaylist(playlistId, song.id)
  showAddToPlaylistDialog.value = false
  selectedSongForPlaylist.value = null
  
  if (alreadyInPlaylist) {
    showToast(`歌曲"${song.title}"已在"${playlist.name}"中`)
  } else {
    showToast(`已将"${song.title}"添加到"${playlist.name}"`)
  }
}

function handleRemoveSongFromPlaylist(playlistId, songId) {
  const playlist = getPlaylistById(playlistId)
  const song = getSongById(songId)
  
  removeSongFromPlaylist(playlistId, songId)
  
  if (playlist && song) {
    showToast(`已将"${song.title}"从"${playlist.name}"中移除`)
  }
}

function handleToggleFavorite(song) {
  const wasFavorite = isSongInFavorites(song.id)
  toggleFavorite(song.id)
  
  if (wasFavorite) {
    showToast(`已将"${song.title}"取消喜欢`)
  } else {
    showToast(`已将"${song.title}"添加到我喜欢`)
  }
}

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

const showPlaybackRatePanel = ref(false)

function togglePlaybackRatePanel() {
  showPlaybackRatePanel.value = !showPlaybackRatePanel.value
}

function selectPlaybackRate(rate) {
  setPlaybackRate(rate)
  showPlaybackRatePanel.value = false
}

const playbackRateButtonColor = computed(() => {
  return playbackRate.value !== 1 ? 'active' : ''
})

const playbackRateDisplay = computed(() => {
  return playbackRateLabels[playbackRate.value] || '1x'
})

const showLyricsSettingsPanel = ref(false)

function toggleLyricsSettingsPanel() {
  showLyricsSettingsPanel.value = !showLyricsSettingsPanel.value
}

const fontSizeOptions = [12, 14, 16, 18, 20, 22, 24]
const lineHeightOptions = [1.4, 1.6, 1.8, 2.0, 2.2, 2.4]
const opacityOptions = [0.5, 0.6, 0.7, 0.8, 0.9, 1.0]

function handleFontSizeChange(size) {
  setLyricsSettings({ fontSize: size })
}

function handleLineHeightChange(height) {
  setLyricsSettings({ lineHeight: height })
}

function handleOpacityChange(opacity) {
  setLyricsSettings({ opacity: opacity })
}

function resetLyricsSettings() {
  setLyricsSettings({
    fontSize: defaultLyricsSettings.fontSize,
    lineHeight: defaultLyricsSettings.lineHeight,
    opacity: defaultLyricsSettings.opacity
  })
}

const lyricsStyle = computed(() => {
  return {
    fontSize: `${lyricsSettings.value.fontSize}px`,
    lineHeight: lyricsSettings.value.lineHeight,
    opacity: lyricsSettings.value.opacity
  }
})

const coverRotationStyle = computed(() => {
  return {
    transform: `rotate(${coverRotation.value}deg)`
  }
})

const showFullscreenLyrics = ref(false)

function toggleFullscreenLyrics() {
  showFullscreenLyrics.value = !showFullscreenLyrics.value
}

function handleFullscreenSeek(time) {
  if (time >= 0) {
    seekToTime(time)
  }
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
  initPlaylists()
  loadLyricsConfig()
  setPlaylist(songs.value, false)
  
  const hasResumed = tryResumePlayback(songs.value)
  if (!hasResumed) {
    if (songs.value.length > 0 && songs.value[0].lyrics) {
      parseLyrics(songs.value[0].lyrics)
    }
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
               :class="{ 'loading': isLoading }"
               :style="coverRotationStyle" />
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
                 :style="lyricsStyle"
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

      <transition name="playback-rate-panel">
        <div v-if="showPlaybackRatePanel" class="playback-rate-section">
          <h5 class="section-title">播放速度</h5>
          <div class="rate-options">
            <button v-for="rate in playbackRates" 
                    :key="rate"
                    class="rate-option-btn"
                    :class="{ 'active': playbackRate === rate }"
                    @click="selectPlaybackRate(rate)">
              {{ playbackRateLabels[rate] }}
            </button>
          </div>
        </div>
      </transition>

      <transition name="lyrics-settings-panel">
        <div v-if="showLyricsSettingsPanel" class="lyrics-settings-section">
          <div class="settings-header">
            <h5 class="section-title">歌词设置</h5>
            <button class="reset-settings-btn" @click="resetLyricsSettings" title="恢复默认">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 12a9 9 0 109-9 9.75 9.75 0 00-6.74 2.74L3 8"/>
                <path d="M3 3v5h5"/>
              </svg>
            </button>
          </div>
          
          <div class="settings-grid">
            <div class="setting-item">
              <div class="setting-label-row">
                <span class="setting-icon">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="4 7 4 4 20 4 20 7"/>
                    <line x1="9" y1="20" x2="15" y2="20"/>
                    <line x1="12" y1="4" x2="12" y2="20"/>
                  </svg>
                </span>
                <span class="setting-name">字体大小</span>
                <span class="setting-value">{{ lyricsSettings.fontSize }}px</span>
              </div>
              <div class="setting-options-row">
                <button v-for="size in fontSizeOptions" 
                        :key="size"
                        class="option-pill"
                        :class="{ 'active': lyricsSettings.fontSize === size }"
                        @click="handleFontSizeChange(size)">
                  {{ size }}
                </button>
              </div>
            </div>

            <div class="setting-item">
              <div class="setting-label-row">
                <span class="setting-icon">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="8" y1="6" x2="21" y2="6"/>
                    <line x1="8" y1="12" x2="21" y2="12"/>
                    <line x1="8" y1="18" x2="21" y2="18"/>
                    <line x1="3" y1="6" x2="3.01" y2="6"/>
                    <line x1="3" y1="12" x2="3.01" y2="12"/>
                    <line x1="3" y1="18" x2="3.01" y2="18"/>
                  </svg>
                </span>
                <span class="setting-name">行间距</span>
                <span class="setting-value">{{ lyricsSettings.lineHeight }}</span>
              </div>
              <div class="setting-options-row">
                <button v-for="lh in lineHeightOptions" 
                        :key="lh"
                        class="option-pill"
                        :class="{ 'active': lyricsSettings.lineHeight === lh }"
                        @click="handleLineHeightChange(lh)">
                  {{ lh }}
                </button>
              </div>
            </div>

            <div class="setting-item">
              <div class="setting-label-row">
                <span class="setting-icon">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M8.5 8.5a3.5 3.5 0 0 1 7 0 0 0 0 7 3.5 3.5 0 0 1-7 0 0 0 0-7z"/>
                  </svg>
                </span>
                <span class="setting-name">透明度</span>
                <span class="setting-value">{{ Math.round(lyricsSettings.opacity * 100) }}%</span>
              </div>
              <div class="setting-options-row">
                <button v-for="op in opacityOptions" 
                        :key="op"
                        class="option-pill"
                        :class="{ 'active': lyricsSettings.opacity === op }"
                        @click="handleOpacityChange(op)">
                  {{ Math.round(op * 100) }}%
                </button>
              </div>
            </div>
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
        <div class="control-group system-controls">
          <button class="control-btn theme-btn"
                  @click="handleToggleTheme"
                  :class="{ 'active': !isDark }"
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
        </div>

        <div class="control-group feature-controls">
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

          <button class="control-btn playback-rate-btn"
                  @click="togglePlaybackRatePanel"
                  :class="playbackRateButtonColor"
                  :title="`播放速度: ${playbackRateDisplay}`">
            <span class="playback-rate-text">{{ playbackRateDisplay }}</span>
          </button>

          <button class="control-btn lyrics-settings-btn"
                  @click="toggleLyricsSettingsPanel"
                  title="歌词设置">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>

          <button class="control-btn fullscreen-lyrics-btn"
                  @click="toggleFullscreenLyrics"
                  :class="{ 'active': showFullscreenLyrics }"
                  title="全屏歌词">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3"/>
            </svg>
          </button>

          <button class="control-btn playlist-manager-btn"
                  @click="togglePlaylistManager"
                  :class="{ 'active': showPlaylistManager }"
                  :title="`歌单管理 - ${currentPlaylist?.name || '默认歌单'}`">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
              <path d="M16 11H6M16 15H6M10 7H6"/>
            </svg>
          </button>

          <button class="control-btn statistics-btn"
                  @click="toggleStatisticsPanel"
                  :class="{ 'active': showStatisticsPanel }"
                  :title="`播放统计 - 累计 ${totalListenTimeFormatted}`">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
          </button>

          <button class="control-btn spatial-btn"
                  @click="toggleSpatialPanel"
                  :class="{ 'active': spatialConfig.enabled }"
                  :title="`空间音效: ${currentSpatialPresetName}`">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 12h.01M7 12h.01M11 12h.01M15 12h.01M19 12h.01"/>
              <path d="M12 3v18"/>
              <circle cx="12" cy="12" r="10"/>
            </svg>
          </button>

          <button class="control-btn settings-btn"
                  @click="toggleSettingsPanel"
                  :class="{ 'active': showSettingsPanel }"
                  title="设置">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="3"/>
              <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
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
        </div>

        <div class="control-group playback-controls">
          <button class="control-btn skip-btn prev-btn"
                  @click="handlePrevious"
                  :disabled="playlist.length <= 1">
            <svg viewBox="0 0 24 24" width="26" height="26">
              <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
            </svg>
          </button>
        
          <button class="control-btn play-btn" 
                  @click="togglePlay"
                  :disabled="!currentSong">
            <svg v-if="!isPlaying" viewBox="0 0 24 24" width="36" height="36">
              <path d="M8 5v14l11-7z"/>
            </svg>
            <svg v-else viewBox="0 0 24 24" width="36" height="36">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
            </svg>
          </button>
        
          <button class="control-btn skip-btn next-btn"
                  @click="handleNext"
                  :disabled="playlist.length <= 1">
            <svg viewBox="0 0 24 24" width="26" height="26">
              <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
            </svg>
          </button>
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
            <button class="action-btn mini favorite-btn"
                    :class="{ 'active': isSongInFavorites(song.id) }"
                    @click.stop="handleToggleFavorite(song)"
                    :title="isSongInFavorites(song.id) ? '取消喜欢' : '添加到喜欢'">
              <svg v-if="isSongInFavorites(song.id)" viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
              <svg v-else viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            </button>
            <button class="action-btn mini" @click.stop="openAddToPlaylistDialog(song)" :title="添加到歌单">
              <svg class="icon" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 5v14M5 12h14"/>
              </svg>
            </button>
            <button class="action-btn mini" @click.stop="handleMoveToTop(index)" :disabled="index === 0" :title="置顶">
              <svg class="icon" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 19V5M5 12l7-7 7 7"/>
              </svg>
            </button>
            <button class="action-btn mini danger" @click.stop="handleRemoveSong(index)" :title="从播放列表移除">
              <svg class="icon" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <Transition name="playlist-manager">
      <div v-if="showPlaylistManager" class="playlist-manager-overlay" @click.self="togglePlaylistManager">
        <div class="playlist-manager-panel">
          <div class="panel-header">
            <h4 class="panel-title">歌单管理</h4>
            <button class="close-panel-btn" @click="togglePlaylistManager">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <div class="panel-content">
            <div class="playlists-section">
              <div class="section-header">
                <span class="section-label">我的歌单</span>
                <button class="create-playlist-btn" @click="showNewPlaylistDialog = true">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 5v14M5 12h14"/>
                  </svg>
                  <span>新建歌单</span>
                </button>
              </div>

              <div class="playlists-list">
                <div v-for="playlist in playlists" :key="playlist.id"
                     class="playlist-item"
                     :class="{
                       'active': currentPlaylistId === playlist.id,
                       'has-songs': playlist.songIds && playlist.songIds.length > 0
                     }">
                  <div class="playlist-icon">{{ playlist.icon }}</div>
                  <div class="playlist-info" @click="handleSelectPlaylist(playlist.id)">
                    <div class="playlist-name">{{ playlist.name }}</div>
                    <div class="playlist-count">{{ playlist.songIds?.length || 0 }} 首歌曲</div>
                  </div>
                  <div class="playlist-actions">
                    <button class="action-btn mini play-playlist-btn" 
                            @click.stop="handlePlayPlaylist(playlist.id)"
                            :disabled="!playlist.songIds || playlist.songIds.length === 0"
                            title="播放歌单">
                      <svg viewBox="0 0 24 24" width="14" height="14">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    </button>
                    <button v-if="playlist.id !== 'default' && playlist.id !== 'favorites'" 
                            class="action-btn mini danger" 
                            @click.stop="handleDeletePlaylist(playlist.id)"
                            title="删除歌单">
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div class="current-playlist-songs" v-if="currentPlaylist">
              <div class="section-header">
                <span class="section-label">{{ currentPlaylist.name }} - 歌曲列表</span>
              </div>

              <div class="songs-list" v-if="currentPlaylistSongs.length > 0">
                <div v-for="(song, index) in currentPlaylistSongs" :key="song.id"
                     class="playlist-song-item"
                     :class="{ 'playing': currentSong?.id === song.id }">
                  <div class="song-number">{{ index + 1 }}</div>
                  <img :src="song.cover" :alt="song.title" class="song-cover-small" />
                  <div class="song-info-small" @click="selectSong(song)">
                    <div class="song-title-small">{{ song.title }}</div>
                    <div class="song-artist-small">{{ song.artist }}</div>
                  </div>
                  <div class="song-actions">
                    <button class="action-btn mini favorite-btn"
                            :class="{ 'active': isSongInFavorites(song.id) }"
                            @click.stop="handleToggleFavorite(song)"
                            :title="isSongInFavorites(song.id) ? '取消喜欢' : '添加到喜欢'">
                      <svg v-if="isSongInFavorites(song.id)" viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                      </svg>
                      <svg v-else viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                      </svg>
                    </button>
                    <button v-if="currentPlaylistId !== 'default'" 
                            class="action-btn mini danger"
                            @click.stop="handleRemoveSongFromPlaylist(currentPlaylistId, song.id)"
                            title="从歌单移除">
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M18 6L6 18M6 6l12 12"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              <div v-else class="empty-playlist-songs">
                <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.3">
                  <path d="M9 18V5l12-2v13"/>
                  <circle cx="6" cy="18" r="3"/>
                  <circle cx="18" cy="16" r="3"/>
                </svg>
                <p>歌单为空</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <Transition name="dialog">
      <div v-if="showNewPlaylistDialog" class="dialog-overlay" @click.self="showNewPlaylistDialog = false">
        <div class="dialog-panel">
          <div class="dialog-header">
            <h4 class="dialog-title">新建歌单</h4>
          </div>
          <div class="dialog-content">
            <input type="text" 
                   class="playlist-name-input"
                   v-model="newPlaylistName"
                   placeholder="请输入歌单名称"
                   @keyup.enter="handleCreatePlaylist"
                   autofocus />
          </div>
          <div class="dialog-footer">
            <button class="dialog-btn cancel" @click="showNewPlaylistDialog = false">取消</button>
            <button class="dialog-btn primary" 
                    @click="handleCreatePlaylist"
                    :disabled="!newPlaylistName.trim() || creatingPlaylist">
              {{ creatingPlaylist ? '创建中...' : '创建' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <Transition name="dialog">
      <div v-if="showAddToPlaylistDialog" class="dialog-overlay" @click.self="showAddToPlaylistDialog = false">
        <div class="dialog-panel">
          <div class="dialog-header">
            <h4 class="dialog-title">添加到歌单</h4>
          </div>
          <div class="dialog-content">
            <div v-if="selectedSongForPlaylist" class="selected-song-preview">
              <img :src="selectedSongForPlaylist.cover" :alt="selectedSongForPlaylist.title" class="preview-cover" />
              <div class="preview-info">
                <div class="preview-title">{{ selectedSongForPlaylist.title }}</div>
                <div class="preview-artist">{{ selectedSongForPlaylist.artist }}</div>
              </div>
            </div>
            
            <div class="playlist-options">
              <div v-for="playlist in playlists" :key="playlist.id"
                   class="playlist-option"
                   :class="{ 
                     'active': isSongInPlaylist(playlist.id, selectedSongForPlaylist?.id),
                     'disabled': isSongInPlaylist(playlist.id, selectedSongForPlaylist?.id)
                   }"
                   @click="!isSongInPlaylist(playlist.id, selectedSongForPlaylist?.id) && handleAddSongToPlaylist(playlist.id)">
                <span class="playlist-option-icon">{{ playlist.icon }}</span>
                <span class="playlist-option-name">{{ playlist.name }}</span>
                <span v-if="isSongInPlaylist(playlist.id, selectedSongForPlaylist?.id)" class="playlist-option-status">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                  </svg>
                </span>
              </div>
            </div>
          </div>
          <div class="dialog-footer">
            <button class="dialog-btn cancel" @click="showAddToPlaylistDialog = false">取消</button>
          </div>
        </div>
      </div>
    </Transition>

    <Transition name="panel">
      <div v-if="showStatisticsPanel" class="panel-overlay" @click.self="toggleStatisticsPanel">
        <div class="side-panel statistics-panel">
          <div class="panel-header">
            <h4 class="panel-title">播放统计</h4>
            <button class="close-panel-btn" @click="toggleStatisticsPanel">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <div class="panel-content statistics-content">
            <div class="stats-overview">
              <div class="stat-card">
                <div class="stat-value">{{ statistics?.totalPlayCount || 0 }}</div>
                <div class="stat-label">累计播放</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">{{ totalListenTimeFormatted }}</div>
                <div class="stat-label">累计时长</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">{{ activeDays || 0 }}</div>
                <div class="stat-label">活跃天数</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">{{ todayPlayCount || 0 }}</div>
                <div class="stat-label">今日播放</div>
              </div>
            </div>

            <div class="stats-section">
              <div class="section-header">
                <span class="section-label">本周听歌趋势</span>
              </div>
              <div class="weekly-chart">
                <div v-for="(day, index) in weeklyStats" :key="index" class="chart-bar-container">
                  <div class="chart-bar" :style="{ height: (day.percentage || 0) + '%' }"></div>
                  <div class="chart-label">{{ day.label }}</div>
                </div>
              </div>
            </div>

            <div class="stats-section">
              <div class="section-header">
                <span class="section-label">最常听歌曲 TOP 10</span>
              </div>
              <div class="top-songs-list" v-if="topSongsWithDetails.length > 0">
                <div v-for="(item, index) in topSongsWithDetails.slice(0, 10)" :key="item.id"
                     class="top-song-item">
                  <div class="song-rank">{{ index + 1 }}</div>
                  <img :src="item.song.cover" :alt="item.song.title" class="song-cover-tiny" />
                  <div class="song-info-tiny">
                    <div class="song-title-tiny">{{ item.song.title }}</div>
                    <div class="song-artist-tiny">{{ item.song.artist }}</div>
                  </div>
                  <div class="song-stats">
                    <span class="play-count">{{ item.playCount }}次</span>
                  </div>
                </div>
              </div>
              <div v-else class="empty-stats">
                <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" opacity="0.3">
                  <path d="M9 18V5l12-2v13"/>
                  <circle cx="6" cy="18" r="3"/>
                  <circle cx="18" cy="16" r="3"/>
                </svg>
                <p>暂无统计数据</p>
              </div>
            </div>

            <div class="stats-actions">
              <button class="action-btn" @click="handleClearCache">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                </svg>
                <span>清除统计</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <Transition name="panel">
      <div v-if="showSpatialPanel" class="panel-overlay" @click.self="toggleSpatialPanel">
        <div class="side-panel spatial-panel">
          <div class="panel-header">
            <h4 class="panel-title">空间音效</h4>
            <button class="close-panel-btn" @click="toggleSpatialPanel">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <div class="panel-content spatial-content">
            <div class="spatial-toggle">
              <div class="toggle-row">
                <span class="toggle-label">启用空间音效</span>
                <button class="toggle-switch" 
                        :class="{ 'on': spatialConfig?.enabled }"
                        @click="toggleSpatialEnabled">
                  <div class="toggle-thumb"></div>
                </button>
              </div>
            </div>

            <div class="spatial-section">
              <div class="section-header">
                <span class="section-label">声场预设</span>
              </div>
              <div class="preset-grid">
                <button v-for="preset in availableSpatialPresets" :key="preset.value"
                        class="preset-btn"
                        :class="{ 'active': spatialConfig?.preset === preset.value }"
                        @click="setSpatialPreset(preset.value)">
                  {{ preset.label }}
                </button>
              </div>
            </div>

            <div class="spatial-section" v-if="spatialConfig?.enabled">
              <div class="section-header">
                <span class="section-label">声场宽度</span>
                <span class="section-value">{{ Math.round((spatialConfig?.width || 0) * 100) }}%</span>
              </div>
              <input type="range" class="spatial-slider" 
                     min="0" max="1" step="0.01"
                     :value="spatialConfig?.width || 0"
                     @input="setSpatialWidth(parseFloat($event.target.value))" />
            </div>

            <div class="spatial-section" v-if="spatialConfig?.enabled">
              <div class="section-header">
                <span class="section-label">空间深度</span>
                <span class="section-value">{{ Math.round((spatialConfig?.depth || 0) * 100) }}%</span>
              </div>
              <input type="range" class="spatial-slider" 
                     min="0" max="1" step="0.01"
                     :value="spatialConfig?.depth || 0"
                     @input="setSpatialDepth(parseFloat($event.target.value))" />
            </div>

            <div class="spatial-toggle">
              <div class="toggle-row">
                <span class="toggle-label">启用混响</span>
                <button class="toggle-switch" 
                        :class="{ 'on': spatialConfig?.reverb?.enabled }"
                        @click="toggleReverbEnabled">
                  <div class="toggle-thumb"></div>
                </button>
              </div>
            </div>

            <div class="spatial-section" v-if="spatialConfig?.reverb?.enabled">
              <div class="section-header">
                <span class="section-label">混响预设</span>
              </div>
              <div class="preset-grid">
                <button v-for="preset in availableReverbPresets" :key="preset.value"
                        class="preset-btn"
                        :class="{ 'active': spatialConfig?.reverb?.preset === preset.value }"
                        @click="setReverbPreset(preset.value)">
                  {{ preset.label }}
                </button>
              </div>
            </div>

            <div class="spatial-section" v-if="spatialConfig?.reverb?.enabled">
              <div class="section-header">
                <span class="section-label">混响强度</span>
                <span class="section-value">{{ Math.round((spatialConfig?.reverb?.wet || 0) * 100) }}%</span>
              </div>
              <input type="range" class="spatial-slider" 
                     min="0" max="1" step="0.01"
                     :value="spatialConfig?.reverb?.wet || 0"
                     @input="setReverbWet(parseFloat($event.target.value))" />
            </div>

            <div class="spatial-toggle">
              <div class="toggle-row">
                <span class="toggle-label">启用声像控制</span>
                <button class="toggle-switch" 
                        :class="{ 'on': spatialConfig?.panning?.enabled }"
                        @click="togglePanningEnabled">
                  <div class="toggle-thumb"></div>
                </button>
              </div>
            </div>

            <div class="spatial-section" v-if="spatialConfig?.panning?.enabled">
              <div class="section-header">
                <span class="section-label">声像位置</span>
                <span class="section-value">
                  {{ (spatialConfig?.panning?.pan || 0) > 0 ? '右 ' + Math.round((spatialConfig?.panning?.pan || 0) * 100) + '%' : 
                     (spatialConfig?.panning?.pan || 0) < 0 ? '左 ' + Math.round(Math.abs(spatialConfig?.panning?.pan || 0) * 100) + '%' : '居中' }}
                </span>
              </div>
              <input type="range" class="spatial-slider" 
                     min="-1" max="1" step="0.01"
                     :value="spatialConfig?.panning?.pan || 0"
                     @input="setPanning(parseFloat($event.target.value))" />
            </div>

            <div class="spatial-actions">
              <button class="action-btn" @click="handleResetSpatial">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M3 12a9 9 0 109-9 9.75 9.75 0 00-6.74 2.74L3 8"/>
                  <path d="M3 3v5h5"/>
                </svg>
                <span>重置</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <Transition name="panel">
      <div v-if="showSettingsPanel" class="panel-overlay" @click.self="toggleSettingsPanel">
        <div class="side-panel settings-panel">
          <div class="panel-header">
            <h4 class="panel-title">设置</h4>
            <button class="close-panel-btn" @click="toggleSettingsPanel">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <div class="panel-content settings-content">
            <div class="settings-section">
              <div class="section-header">
                <span class="section-label">主题设置</span>
              </div>
              <div class="theme-options">
                <button class="theme-option" 
                        :class="{ 'active': !isDark }"
                        @click="setTheme(THEME_MODES.LIGHT)">
                  <div class="theme-preview light"></div>
                  <span>浅色</span>
                </button>
                <button class="theme-option" 
                        :class="{ 'active': isDark }"
                        @click="setTheme(THEME_MODES.DARK)">
                  <div class="theme-preview dark"></div>
                  <span>深色</span>
                </button>
                <button class="theme-option" 
                        :class="{ 'active': currentMode === THEME_MODES.SYSTEM }"
                        @click="setTheme(THEME_MODES.SYSTEM)">
                  <div class="theme-preview auto"></div>
                  <span>跟随系统</span>
                </button>
              </div>
            </div>

            <div class="settings-section">
              <div class="section-header">
                <span class="section-label">数据管理</span>
              </div>
              <div class="settings-actions">
                <button class="action-btn danger" @click="handleClearCache">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                  </svg>
                  <span>清除播放统计</span>
                </button>
                <button class="action-btn danger" @click="handleResetPlaylists">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                  </svg>
                  <span>重置歌单</span>
                </button>
                <button class="action-btn danger" @click="handleResetSpatial">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M3 12a9 9 0 109-9 9.75 9.75 0 00-6.74 2.74L3 8"/>
                    <path d="M3 3v5h5"/>
                  </svg>
                  <span>重置音效</span>
                </button>
              </div>
            </div>

            <div class="settings-section">
              <div class="section-header">
                <span class="section-label">危险操作</span>
              </div>
              <div class="settings-actions">
                <button class="action-btn danger-full" @click="handleResetAll">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  <span>重置所有设置为默认</span>
                </button>
                <button class="action-btn danger-full" @click="handleClearAllData">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                  </svg>
                  <span>清除所有数据</span>
                </button>
              </div>
            </div>

            <div class="app-info">
              <div class="info-item">
                <span class="info-label">版本</span>
                <span class="info-value">1.0.0</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <Transition name="toast">
      <div v-if="showErrorToast" class="error-toast">
        <div class="toast-content">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <span>{{ errorToastMessage }}</span>
        </div>
      </div>
    </Transition>

    <FullscreenLyrics 
      :show="showFullscreenLyrics"
      :lyrics-list="lyricsList"
      :current-lyric-index="currentLyricIndex"
      :current-time="displayTime"
      :is-playing="isPlaying"
      :current-song="currentSong"
      @close="toggleFullscreenLyrics"
      @seek-to-time="handleFullscreenSeek" />
  </div>
</template>

<style scoped>
.music-player {
  background: var(--bg-secondary);
  border-radius: 16px;
  box-shadow: var(--shadow-lg);
  overflow: hidden;
  max-width: 400px;
  width: 100%;
}

.error-message {
  background: var(--danger-bg);
  color: var(--accent-danger);
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  text-align: center;
}

.player-container {
  padding: 2rem;
  background: var(--bg-secondary);
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
  box-shadow: var(--shadow-lg);
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
  background: var(--bg-overlay);
}

.spinner {
  width: 30px;
  height: 30px;
  border: 3px solid var(--border-primary);
  border-top-color: var(--text-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.song-details {
  margin-left: 1.5rem;
  color: var(--text-primary);
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
  background: var(--panel-bg);
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
  color: var(--lyric-inactive);
  font-size: 0.9rem;
  line-height: 1.6;
  transition: all 0.3s ease;
  cursor: pointer;
  border-radius: 4px;
  position: relative;
}

.lyric-line:hover:not(.active) {
  background: var(--song-item-hover);
  color: var(--text-secondary);
}

.lyric-line.nearby:not(.active) {
  color: var(--text-secondary);
  opacity: 0.9;
}

.lyric-line.active {
  color: var(--text-primary);
  font-size: 1.15rem;
  font-weight: 600;
  text-shadow: 0 0 15px rgba(255, 255, 255, 0.3);
  background: var(--song-item-active);
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
  color: var(--text-secondary);
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
  background: var(--progress-bg);
  border-radius: 4px;
}

.progress-fill {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: var(--progress-thumb);
  border-radius: 4px;
}

.progress-thumb {
  position: absolute;
  top: 50%;
  width: 16px;
  height: 16px;
  background: var(--progress-thumb);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  box-shadow: var(--shadow-sm);
  transition: transform 0.1s ease;
}

.progress-thumb:hover,
.progress-bar-container:active .progress-thumb {
  transform: translate(-50%, -50%) scale(1.2);
}

.time-display {
  display: flex;
  justify-content: space-between;
  color: var(--text-primary);
  font-size: 0.85rem;
  opacity: 0.9;
}

.controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
  padding: 0 0.5rem;
}

.control-group {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.control-group.system-controls {
  gap: 0.3rem;
}

.control-group.feature-controls {
  gap: 0.25rem;
}

.control-group.playback-controls {
  gap: 0.6rem;
}

.control-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.4rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  width: 36px;
  height: 36px;
  border-radius: 50%;
}

.control-btn:hover:not(:disabled) {
  background: var(--btn-hover);
  transform: none;
}

.control-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.control-btn svg {
  fill: var(--text-primary);
}

.control-btn.active {
  background: var(--btn-active);
}

.control-btn.active svg {
  fill: var(--accent-primary);
}

.lyrics-btn,
.play-mode-btn,
.sleep-timer-btn,
.eq-btn,
.lyrics-settings-btn,
.theme-btn,
.reset-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  transition: background-color 0.2s ease;
}

.lyrics-btn:hover,
.play-mode-btn:hover,
.sleep-timer-btn:hover,
.eq-btn:hover,
.lyrics-settings-btn:hover,
.theme-btn:hover,
.reset-btn:hover {
  background: var(--btn-hover);
}

.lyrics-btn.active svg,
.play-mode-btn.active svg,
.sleep-timer-btn.active svg {
  fill: var(--accent-primary);
}

.play-btn {
  width: 60px;
  height: 60px;
  background: var(--accent-gradient) !important;
  border-radius: 50%;
  box-shadow: var(--shadow-lg), var(--shadow-glow);
  transition: all 0.3s ease;
  min-width: 60px;
}

.play-btn:hover:not(:disabled) {
  transform: scale(1.05);
  box-shadow: var(--shadow-xl), var(--shadow-glow);
}

.play-btn svg {
  fill: var(--text-on-accent) !important;
}

.play-btn:disabled {
  opacity: 0.5;
}

.skip-btn {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  transition: background-color 0.2s ease;
}

.skip-btn:hover {
  background: var(--btn-hover);
}

.play-mode-indicator {
  display: none;
}

.volume-control {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 0.75rem;
}

.volume-btn {
  padding: 0.25rem;
}

.volume-slider {
  width: 100px;
  height: 4px;
  -webkit-appearance: none;
  background: var(--slider-track);
  border-radius: 2px;
  outline: none;
  cursor: pointer;
}

.volume-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 12px;
  height: 12px;
  background: var(--slider-thumb);
  border-radius: 50%;
  cursor: pointer;
  box-shadow: var(--shadow-sm);
}

.volume-slider::-moz-range-thumb {
  width: 12px;
  height: 12px;
  background: var(--slider-thumb);
  border-radius: 50%;
  cursor: pointer;
  border: none;
  box-shadow: var(--shadow-sm);
}

.playlist {
  padding: 1rem;
  background: var(--bg-primary);
}

.playlist-title {
  margin: 0 0 1rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
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
  background: var(--song-item-hover);
}

.song-item.active,
.song-item.current {
  background: var(--song-item-active);
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
  color: var(--text-secondary);
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
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.song-artist-mini {
  font-size: 0.75rem;
  color: var(--text-secondary);
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
  background: var(--accent-primary);
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
  background: var(--scrollbar-track);
}

.song-list::-webkit-scrollbar-thumb {
  background: var(--scrollbar-thumb);
  border-radius: 2px;
}

.song-list::-webkit-scrollbar-thumb:hover {
  background: var(--scrollbar-thumb-hover);
}

.lyrics-container::-webkit-scrollbar {
  width: 4px;
}

.lyrics-container::-webkit-scrollbar-track {
  background: var(--scrollbar-track);
}

.lyrics-container::-webkit-scrollbar-thumb {
  background: var(--scrollbar-thumb);
  border-radius: 2px;
}

.lyrics-container::-webkit-scrollbar-thumb:hover {
  background: var(--scrollbar-thumb-hover);
}

.sleep-timer-section {
  margin-bottom: 1rem;
  background: var(--panel-bg);
  border-radius: 8px;
  padding: 1rem;
}

.timer-title {
  margin: 0 0 0.75rem 0;
  color: var(--text-primary);
  font-size: 0.95rem;
  font-weight: 600;
}

.timer-status {
  text-align: center;
  margin-bottom: 0.75rem;
  padding: 0.5rem;
  background: var(--btn-bg);
  border-radius: 6px;
}

.remaining-time {
  display: block;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--accent-gold);
}

.timer-label {
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.timer-options {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: center;
}

.timer-option-btn {
  padding: 0.5rem 1rem;
  border: 1px solid var(--border-primary);
  background: var(--btn-bg);
  color: var(--text-primary);
  border-radius: 20px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.timer-option-btn:hover {
  background: var(--btn-hover);
  border-color: var(--border-secondary);
}

.timer-option-btn.active {
  background: var(--gold-bg);
  border-color: var(--gold-border);
  color: var(--gold-text);
}

.timer-option-btn.cancel {
  background: var(--danger-bg);
  border-color: var(--danger-border);
}

.timer-option-btn.cancel:hover {
  background: var(--song-item-remove);
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
  background: var(--btn-hover);
}

.sleep-timer-btn.active {
  background: var(--btn-active);
}

.sleep-timer-btn.active svg {
  fill: var(--accent-gold);
}

.eq-section {
  margin-bottom: 1rem;
  background: var(--panel-bg);
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
  color: var(--text-primary);
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
  color: var(--text-secondary);
}

.eq-toggle-btn {
  width: 40px;
  height: 22px;
  border-radius: 11px;
  border: none;
  background: var(--toggle-off);
  position: relative;
  cursor: pointer;
  transition: background 0.2s ease;
  padding: 0;
}

.eq-toggle-btn.active {
  background: var(--toggle-on);
}

.eq-toggle-thumb {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--toggle-thumb);
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
  border: 1px solid var(--border-primary);
  background: var(--btn-bg);
  color: var(--text-primary);
  border-radius: 16px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.eq-preset-btn:hover {
  background: var(--btn-hover);
  border-color: var(--border-secondary);
}

.eq-preset-btn.active {
  background: var(--song-item-active);
  border-color: var(--accent-primary);
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
  color: var(--text-secondary);
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
  background: var(--accent-gradient);
  cursor: pointer;
  border: 2px solid var(--slider-thumb);
  box-shadow: var(--shadow-sm);
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
  background: var(--accent-gradient);
  cursor: pointer;
  border: 2px solid var(--slider-thumb);
  box-shadow: var(--shadow-sm);
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
  background: var(--btn-disabled);
  border-color: var(--border-primary);
}

.eq-band-value {
  font-size: 0.7rem;
  font-weight: 600;
  text-align: center;
  color: var(--text-secondary);
}

.eq-footer {
  display: flex;
  justify-content: center;
  margin-top: 1rem;
}

.eq-reset-btn {
  padding: 0.5rem 1.5rem;
  border: 1px solid var(--danger-border);
  background: var(--danger-bg);
  color: var(--danger-text);
  border-radius: 20px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.eq-reset-btn:hover {
  background: var(--song-item-remove);
  border-color: var(--danger-border);
}

.eq-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  transition: background-color 0.2s ease;
}

.eq-btn:hover {
  background: var(--btn-hover);
}

.eq-btn.active {
  background: var(--btn-active);
}

.eq-btn.active svg {
  fill: var(--accent-primary);
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
  background: var(--accent-gradient);
  color: var(--text-primary);
  border-radius: 10px;
  margin-left: 0.5rem;
  font-weight: 500;
}

.empty-playlist {
  text-align: center;
  padding: 2rem;
  color: var(--text-muted);
  font-size: 0.9rem;
}

.drag-handle {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.25rem;
  cursor: grab;
  color: var(--text-muted);
  opacity: 0.6;
  transition: opacity 0.2s ease, color 0.2s ease;
}

.drag-handle:hover {
  opacity: 1;
  color: var(--text-secondary);
}

.song-item.dragging {
  opacity: 0.5;
}

.song-item.drag-over {
  border-top: 2px solid var(--accent-primary);
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
  background: var(--btn-bg);
  border: none;
  border-radius: 6px;
  padding: 0.4rem;
  cursor: pointer;
  transition: all 0.2s ease;
  color: var(--accent-primary);
}

.action-btn:hover:not(:disabled) {
  background: var(--btn-hover);
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
  background: var(--danger-bg);
  color: var(--accent-danger);
}

.action-btn.danger:hover:not(:disabled) {
  background: var(--song-item-remove);
}

.action-btn.active {
  background: var(--song-item-active);
}

.playback-rate-btn {
  width: 46px;
  height: 36px;
  border-radius: 18px;
  transition: all 0.2s ease;
  padding: 0;
  border: 1px solid transparent;
}

.playback-rate-btn:hover {
  background: var(--btn-hover);
}

.playback-rate-btn.active {
  background: var(--btn-active);
  border-color: var(--accent-primary);
}

.playback-rate-btn.active .playback-rate-text {
  color: var(--accent-primary);
  font-weight: 600;
}

.playback-rate-text {
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--text-primary);
  transition: all 0.2s ease;
}

.fullscreen-lyrics-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.fullscreen-lyrics-btn:hover {
  background: var(--btn-hover);
}

.fullscreen-lyrics-btn.active {
  background: var(--btn-active);
}

.fullscreen-lyrics-btn.active svg {
  stroke: var(--accent-primary);
}

.fullscreen-lyrics-btn svg {
  stroke: var(--text-primary);
}

.playback-rate-section {
  margin-bottom: 1rem;
  background: var(--panel-bg);
  border-radius: 12px;
  padding: 1rem 1.25rem;
  border: 1px solid var(--border-primary);
}

.playback-rate-section .section-title {
  margin: 0 0 1rem 0;
  color: var(--text-primary);
  font-size: 0.95rem;
  font-weight: 600;
}

.rate-options {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: flex-start;
}

.rate-option-btn {
  padding: 0.5rem 0.9rem;
  border: 1px solid var(--border-primary);
  background: var(--btn-bg);
  color: var(--text-primary);
  border-radius: 8px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 55px;
  font-weight: 500;
}

.rate-option-btn:hover {
  background: var(--btn-hover);
  border-color: var(--border-secondary);
}

.rate-option-btn.active {
  background: var(--song-item-active);
  border-color: var(--accent-primary);
  color: var(--accent-primary);
  font-weight: 600;
}

.lyrics-settings-section {
  margin-bottom: 1rem;
  background: var(--panel-bg);
  border-radius: 12px;
  padding: 1rem 1.25rem;
  border: 1px solid var(--border-primary);
}

.settings-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.settings-header .section-title {
  margin: 0;
  color: var(--text-primary);
  font-size: 0.95rem;
  font-weight: 600;
}

.reset-settings-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  background: var(--btn-bg);
  border: 1px solid var(--border-primary);
  cursor: pointer;
  transition: all 0.2s ease;
  padding: 0;
}

.reset-settings-btn:hover {
  background: var(--btn-hover);
  border-color: var(--accent-danger);
}

.reset-settings-btn:hover svg {
  stroke: var(--accent-danger);
}

.reset-settings-btn svg {
  stroke: var(--text-secondary);
  transition: stroke 0.2s ease;
}

.settings-grid {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.setting-item {
  background: var(--bg-secondary);
  border-radius: 8px;
  padding: 0.75rem 1rem;
}

.setting-label-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.setting-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  color: var(--text-secondary);
}

.setting-icon svg {
  stroke: currentColor;
}

.setting-name {
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--text-primary);
}

.setting-value {
  margin-left: auto;
  font-size: 0.8rem;
  color: var(--accent-primary);
  font-weight: 600;
}

.setting-options-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin-left: 29px;
}

.option-pill {
  padding: 0.35rem 0.7rem;
  border: 1px solid var(--border-primary);
  background: var(--btn-bg);
  color: var(--text-secondary);
  border-radius: 6px;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 40px;
  font-weight: 500;
}

.option-pill:hover {
  background: var(--btn-hover);
  border-color: var(--border-secondary);
  color: var(--text-primary);
}

.option-pill.active {
  background: var(--song-item-active);
  border-color: var(--accent-primary);
  color: var(--accent-primary);
  font-weight: 600;
}

.playback-rate-panel-enter-active,
.playback-rate-panel-leave-active,
.lyrics-settings-panel-enter-active,
.lyrics-settings-panel-leave-active {
  transition: all 0.3s ease;
}

.playback-rate-panel-enter-from,
.playback-rate-panel-leave-to,
.lyrics-settings-panel-enter-from,
.lyrics-settings-panel-leave-to {
  opacity: 0;
  max-height: 0;
  transform: translateY(-10px);
  margin-bottom: 0;
  padding-top: 0;
  padding-bottom: 0;
}

.cover-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.1s linear;
}

.cover-image.loading {
  opacity: 0.5;
}

.playlist-manager-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.playlist-manager-btn:hover {
  background: var(--btn-hover);
}

.playlist-manager-btn.active {
  background: var(--btn-active);
}

.playlist-manager-btn.active svg {
  stroke: var(--accent-primary);
}

.playlist-manager-btn svg {
  stroke: var(--text-primary);
}

.playlist-manager-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.playlist-manager-panel {
  background: var(--bg-secondary);
  border-radius: 16px;
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--border-primary);
}

.panel-title {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-primary);
}

.close-panel-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: none;
  border: none;
  cursor: pointer;
  transition: background 0.2s ease;
  color: var(--text-secondary);
}

.close-panel-btn:hover {
  background: var(--btn-hover);
  color: var(--text-primary);
}

.panel-content {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  gap: 1rem;
}

@media (max-width: 600px) {
  .panel-content {
    flex-direction: column;
  }
}

.playlists-section {
  flex: 1;
  min-width: 0;
}

.current-playlist-songs {
  flex: 1;
  min-width: 0;
  border-left: 1px solid var(--border-primary);
  padding-left: 1rem;
}

@media (max-width: 600px) {
  .current-playlist-songs {
    border-left: none;
    border-top: 1px solid var(--border-primary);
    padding-left: 0;
    padding-top: 1rem;
  }
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
}

.section-label {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.create-playlist-btn {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.4rem 0.75rem;
  border-radius: 8px;
  border: 1px solid var(--border-primary);
  background: var(--btn-bg);
  color: var(--accent-primary);
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.8rem;
  font-weight: 500;
}

.create-playlist-btn:hover {
  background: var(--song-item-active);
  border-color: var(--accent-primary);
}

.playlists-list {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.playlist-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.playlist-item:hover {
  background: var(--song-item-hover);
}

.playlist-item.active {
  background: var(--song-item-active);
}

.playlist-icon {
  font-size: 1.5rem;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-secondary);
  border-radius: 8px;
}

.playlist-info {
  flex: 1;
  min-width: 0;
}

.playlist-name {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 0.25rem;
}

.playlist-count {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.playlist-actions {
  display: flex;
  gap: 0.25rem;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.playlist-item:hover .playlist-actions,
.playlist-item.active .playlist-actions {
  opacity: 1;
}

.play-playlist-btn {
  background: var(--accent-primary) !important;
  color: white !important;
}

.play-playlist-btn:hover:not(:disabled) {
  background: var(--accent-hover) !important;
}

.play-playlist-btn:disabled {
  opacity: 0.4;
}

.songs-list {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  max-height: 300px;
  overflow-y: auto;
}

.playlist-song-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.playlist-song-item:hover {
  background: var(--song-item-hover);
}

.playlist-song-item.playing {
  background: var(--song-item-active);
}

.song-number {
  width: 20px;
  font-size: 0.75rem;
  color: var(--text-secondary);
  text-align: center;
}

.song-cover-small {
  width: 32px;
  height: 32px;
  border-radius: 4px;
  object-fit: cover;
}

.song-info-small {
  flex: 1;
  min-width: 0;
}

.song-title-small {
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.song-artist-small {
  font-size: 0.7rem;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.empty-playlist-songs {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  color: var(--text-muted);
}

.empty-playlist-songs p {
  margin-top: 1rem;
  font-size: 0.85rem;
}

.favorite-btn.active {
  color: var(--accent-danger) !important;
  background: var(--danger-bg) !important;
}

.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  backdrop-filter: blur(4px);
}

.dialog-panel {
  background: var(--bg-secondary);
  border-radius: 12px;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.dialog-header {
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--border-primary);
}

.dialog-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
}

.dialog-content {
  padding: 1rem 1.25rem;
}

.playlist-name-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid var(--border-primary);
  border-radius: 8px;
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: 0.9rem;
  outline: none;
  transition: border-color 0.2s ease;
}

.playlist-name-input:focus {
  border-color: var(--accent-primary);
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  padding: 1rem 1.25rem;
  border-top: 1px solid var(--border-primary);
}

.dialog-btn {
  padding: 0.5rem 1.25rem;
  border-radius: 8px;
  border: 1px solid transparent;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.dialog-btn.cancel {
  background: var(--btn-bg);
  border-color: var(--border-primary);
  color: var(--text-primary);
}

.dialog-btn.cancel:hover {
  background: var(--btn-hover);
}

.dialog-btn.primary {
  background: var(--accent-gradient);
  color: white;
}

.dialog-btn.primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.dialog-btn.primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.selected-song-preview {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: var(--bg-primary);
  border-radius: 8px;
  margin-bottom: 1rem;
}

.preview-cover {
  width: 40px;
  height: 40px;
  border-radius: 6px;
  object-fit: cover;
}

.preview-info {
  flex: 1;
  min-width: 0;
}

.preview-title {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.preview-artist {
  font-size: 0.75rem;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.playlist-options {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  max-height: 250px;
  overflow-y: auto;
}

.playlist-option {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.playlist-option:hover:not(.disabled) {
  background: var(--song-item-hover);
}

.playlist-option.active {
  background: var(--song-item-active);
}

.playlist-option.disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.playlist-option-icon {
  font-size: 1.25rem;
}

.playlist-option-name {
  flex: 1;
  font-size: 0.9rem;
  color: var(--text-primary);
}

.playlist-option-status {
  color: var(--accent-primary);
}

.playlist-manager-enter-active,
.playlist-manager-leave-active,
.dialog-enter-active,
.dialog-leave-active {
  transition: all 0.3s ease;
}

.playlist-manager-enter-from,
.playlist-manager-leave-to,
.dialog-enter-from,
.dialog-leave-to {
  opacity: 0;
}

.playlist-manager-enter-from .playlist-manager-panel,
.playlist-manager-leave-to .playlist-manager-panel,
.dialog-enter-from .dialog-panel,
.dialog-leave-to .dialog-panel {
  transform: scale(0.95);
  opacity: 0;
}

.statistics-btn.active svg {
  stroke: var(--accent-primary);
}

.statistics-btn svg {
  stroke: var(--text-primary);
}

.spatial-btn.active svg circle,
.spatial-btn.active svg path {
  stroke: var(--accent-primary);
}

.spatial-btn svg circle,
.spatial-btn svg path {
  stroke: var(--text-primary);
}

.settings-btn.active svg circle,
.settings-btn.active svg path {
  stroke: var(--accent-primary);
}

.settings-btn svg circle,
.settings-btn svg path {
  stroke: var(--text-primary);
}

.panel-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.side-panel {
  background: var(--bg-secondary);
  border-radius: 16px;
  width: 90%;
  max-width: 420px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.statistics-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.25rem;
}

.stats-overview {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
}

.stat-card {
  background: var(--panel-bg);
  border-radius: 12px;
  padding: 1rem;
  text-align: center;
}

.stat-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 0.25rem;
}

.stat-label {
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.stats-section {
  background: var(--panel-bg);
  border-radius: 12px;
  padding: 1rem;
}

.weekly-chart {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 0.5rem;
  height: 120px;
  padding: 0.5rem;
}

.chart-bar-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
}

.chart-bar {
  width: 100%;
  min-height: 4px;
  background: var(--accent-primary);
  border-radius: 4px 4px 2px 2px;
  transition: height 0.3s ease;
}

.chart-label {
  font-size: 0.7rem;
  color: var(--text-secondary);
  margin-top: 0.5rem;
}

.top-songs-list {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  max-height: 200px;
  overflow-y: auto;
}

.top-song-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem;
  border-radius: 8px;
  transition: background 0.2s ease;
}

.top-song-item:hover {
  background: var(--song-item-hover);
}

.song-rank {
  width: 24px;
  text-align: center;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--accent-primary);
}

.song-cover-tiny {
  width: 28px;
  height: 28px;
  border-radius: 4px;
  object-fit: cover;
}

.song-info-tiny {
  flex: 1;
  min-width: 0;
}

.song-title-tiny {
  font-size: 0.85rem;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.song-artist-tiny {
  font-size: 0.7rem;
  color: var(--text-secondary);
}

.song-stats {
  text-align: right;
}

.play-count {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.empty-stats {
  text-align: center;
  padding: 1.5rem;
  color: var(--text-secondary);
}

.empty-stats p {
  margin: 0.75rem 0 0 0;
  font-size: 0.85rem;
}

.stats-actions {
  display: flex;
  gap: 0.75rem;
  padding-top: 0.5rem;
}

.spatial-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.25rem;
}

.spatial-toggle {
  background: var(--panel-bg);
  border-radius: 12px;
  padding: 1rem;
}

.toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.toggle-label {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text-primary);
}

.toggle-switch {
  position: relative;
  width: 44px;
  height: 24px;
  background: var(--bg-secondary);
  border-radius: 12px;
  border: none;
  cursor: pointer;
  transition: background 0.3s ease;
  padding: 0;
}

.toggle-switch.on {
  background: var(--accent-primary);
}

.toggle-thumb {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  background: white;
  border-radius: 50%;
  transition: transform 0.3s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.toggle-switch.on .toggle-thumb {
  transform: translateX(20px);
}

.spatial-section {
  background: var(--panel-bg);
  border-radius: 12px;
  padding: 1rem;
}

.section-value {
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.spatial-slider {
  width: 100%;
  height: 6px;
  border-radius: 3px;
  -webkit-appearance: none;
  appearance: none;
  background: var(--bg-secondary);
  outline: none;
  cursor: pointer;
  margin-top: 0.75rem;
}

.spatial-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--accent-primary);
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

.spatial-slider::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--accent-primary);
  cursor: pointer;
  border: none;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

.preset-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.preset-btn {
  padding: 0.6rem 0.8rem;
  border-radius: 8px;
  border: 1px solid var(--border-primary);
  background: var(--btn-bg);
  color: var(--text-primary);
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.preset-btn:hover {
  background: var(--song-item-hover);
  border-color: var(--accent-primary);
}

.preset-btn.active {
  background: var(--accent-primary);
  color: white;
  border-color: var(--accent-primary);
}

.spatial-actions {
  display: flex;
  gap: 0.75rem;
  padding-top: 0.5rem;
}

.settings-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.25rem;
}

.settings-section {
  background: var(--panel-bg);
  border-radius: 12px;
  padding: 1rem;
}

.theme-options {
  display: flex;
  gap: 0.75rem;
  margin-top: 0.75rem;
}

.theme-option {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 0.5rem;
  border-radius: 8px;
  border: 2px solid transparent;
  background: var(--btn-bg);
  cursor: pointer;
  transition: all 0.2s ease;
}

.theme-option:hover {
  background: var(--song-item-hover);
}

.theme-option.active {
  border-color: var(--accent-primary);
  background: var(--song-item-active);
}

.theme-preview {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 2px solid var(--border-primary);
}

.theme-preview.light {
  background: linear-gradient(135deg, #f8f9fa 50%, #ffffff 50%);
}

.theme-preview.dark {
  background: linear-gradient(135deg, #1a1a2e 50%, #16213e 50%);
}

.theme-preview.auto {
  background: linear-gradient(135deg, #f8f9fa 30%, #1a1a2e 70%);
}

.theme-option span {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.settings-actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  border: 1px solid var(--border-primary);
  background: var(--btn-bg);
  color: var(--text-primary);
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-btn:hover {
  background: var(--song-item-hover);
  border-color: var(--accent-primary);
}

.action-btn.danger {
  color: var(--accent-danger);
  border-color: var(--accent-danger);
  background: rgba(239, 68, 68, 0.1);
}

.action-btn.danger:hover {
  background: rgba(239, 68, 68, 0.15);
}

.action-btn.danger-full {
  background: var(--accent-danger);
  color: white;
  border-color: var(--accent-danger);
}

.action-btn.danger-full:hover {
  background: var(--accent-hover);
}

.app-info {
  margin-top: auto;
  padding-top: 0.5rem;
}

.info-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 0;
  border-top: 1px solid var(--border-primary);
}

.info-label {
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.info-value {
  font-size: 0.8rem;
  color: var(--text-primary);
}

.error-toast {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 2000;
}

.toast-content {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  background: var(--bg-secondary);
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
  color: var(--text-primary);
  font-size: 0.9rem;
  border: 1px solid var(--border-primary);
}

.toast-content svg {
  color: var(--accent-primary);
}

.panel-enter-active,
.panel-leave-active,
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.panel-enter-from,
.panel-leave-to {
  opacity: 0;
}

.panel-enter-from .side-panel,
.panel-leave-to .side-panel {
  transform: translateY(10px);
  opacity: 0;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-10px);
}

@media (max-width: 600px) {
  .stats-overview {
    grid-template-columns: 1fr;
  }
  
  .preset-grid {
    grid-template-columns: 1fr;
  }
}
</style>
