<script setup>
import { ref, onMounted, computed } from 'vue'
import { useAudioPlayer, PlayMode } from '../composables/useAudioPlayer.js'

const {
  isPlaying,
  progress,
  formattedCurrentTime,
  formattedDuration,
  volume,
  isMuted,
  currentSong,
  currentIndex,
  isLoading,
  error,
  playMode,
  hasNext,
  hasPrevious,
  playModeLabel,
  setPlaylist,
  loadSong,
  togglePlay,
  nextSong,
  previousSong,
  seek,
  setVolume,
  toggleMute,
  togglePlayMode
} = useAudioPlayer()

const progressBarRef = ref(null)

const sampleSongs = ref([
  {
    id: 1,
    title: '示例音乐 1',
    artist: 'SoundHelix',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=music%20album%20cover%20dark%20purple%20neon%20style&image_size=square'
  },
  {
    id: 2,
    title: '示例音乐 2',
    artist: 'SoundHelix',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=music%20album%20cover%20blue%20cyberpunk%20style&image_size=square'
  },
  {
    id: 3,
    title: '示例音乐 3',
    artist: 'SoundHelix',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=music%20album%20cover%20pink%20synthwave%20style&image_size=square'
  }
])

const playModeIcon = computed(() => {
  switch (playMode.value) {
    case PlayMode.LIST_LOOP:
      return 'M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4zm-4-2V9h-1l-2 1v1h1.5v4H13z'
    case PlayMode.SINGLE_LOOP:
      return 'M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z'
    case PlayMode.SHUFFLE:
      return 'M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z'
    default:
      return 'M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4zm-4-2V9h-1l-2 1v1h1.5v4H13z'
  }
})

const playModeColor = computed(() => {
  return playMode.value !== PlayMode.LIST_LOOP ? 'active' : ''
})

function handleProgressClick(event) {
  if (progressBarRef.value) {
    const rect = progressBarRef.value.getBoundingClientRect()
    const percent = ((event.clientX - rect.left) / rect.width) * 100
    seek(percent)
  }
}

function selectSong(song) {
  loadSong(song, true, true)
}

function handlePrevious() {
  if (sampleSongs.value.length > 0) {
    previousSong()
  }
}

function handleNext() {
  if (sampleSongs.value.length > 0) {
    nextSong()
  }
}

onMounted(() => {
  setPlaylist(sampleSongs.value, false)
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

      <div class="progress-section">
        <div class="progress-bar-container" 
             ref="progressBarRef"
             @click="handleProgressClick">
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
                :disabled="sampleSongs.length <= 1">
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
                :disabled="sampleSongs.length <= 1">
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
      <h4 class="playlist-title">播放列表 ({{ sampleSongs.length }})</h4>
      <div class="song-list">
        <div v-for="(song, index) in sampleSongs" 
             :key="song.id" 
             class="song-item"
             :class="{ 
               'active': currentSong?.id === song.id,
               'current': currentIndex === index
             }"
             @click="selectSong(song)">
          <div class="song-number">
            <span v-if="currentSong?.id === song.id && isPlaying" class="playing-indicator">
              <span class="bar"></span>
              <span class="bar"></span>
              <span class="bar"></span>
            </span>
            <span v-else class="number">{{ index + 1 }}</span>
          </div>
          <img :src="song.cover" :alt="song.title" class="song-cover" />
          <div class="song-info-mini">
            <span class="song-title-mini">{{ song.title }}</span>
            <span class="song-artist-mini">{{ song.artist }}</span>
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

.progress-section {
  margin-bottom: 1.5rem;
}

.progress-bar-container {
  position: relative;
  height: 8px;
  cursor: pointer;
  margin-bottom: 0.5rem;
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
  transition: width 0.05s linear;
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
  transition: left 0.05s linear;
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
  gap: 1rem;
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
</style>
