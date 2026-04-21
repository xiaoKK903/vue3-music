<script setup>
import { ref, onMounted, computed, watch, nextTick, onUnmounted } from 'vue'
import { useAudioPlayer, PlayMode } from '../composables/useAudioPlayer.js'
import { useLyrics } from '../composables/useLyrics.js'

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

const sampleLyrics = ref([
  `[00:00.00]前奏
[00:10.50]第一句歌词开始
[00:15.30]这是第二句歌词
[00:20.80]第三句正在播放中
[00:25.20]第四句跟着节奏
[00:30.00]第五句继续演唱
[00:35.50]第六句旋律响起
[00:40.30]第七句慢慢流淌
[00:45.00]第八句深情演绎
[00:50.00]间奏部分
[01:00.00]第十句重新开始
[01:05.00]第十一句继续
[01:10.00]第十二句歌词
[01:15.00]第十三句表演
[01:20.00]第十四句高潮
[01:25.00]第十五句副歌
[01:30.00]第十六句过渡
[01:35.00]第十七句主歌
[01:40.00]第十八句结尾
[01:45.00]歌曲即将结束
[01:50.00]完美落幕`,
  
  `[00:00.00]音乐开始
[00:08.00]这首歌曲的第一行
[00:12.50]第二行正在演唱
[00:17.00]第三行歌词出现
[00:22.00]第四行继续
[00:27.00]第五行紧随其后
[00:32.00]第六行流淌
[00:37.00]第七行旋律
[00:42.00]第八行情感
[00:47.00]间奏
[00:55.00]第十行重新出发
[01:00.00]第十一行
[01:05.00]第十二行
[01:10.00]第十三行
[01:15.00]第十四行
[01:20.00]第十五行
[01:25.00]第十六行
[01:30.00]第十七行
[01:35.00]第十八行
[01:40.00]第十九行
[01:45.00]第二十行结束`,
  
  `[00:00.00]序曲
[00:05.00]开始第一句
[00:10.00]第二句歌词
[00:15.00]第三句旋律
[00:20.00]第四句节奏
[00:25.00]第五句音符
[00:30.00]第六句节拍
[00:35.00]第七句和弦
[00:40.00]第八句音调
[00:45.00]过渡
[00:55.00]第十句副歌
[01:00.00]第十一句
[01:05.00]第十二句
[01:10.00]第十三句
[01:15.00]第十四句
[01:20.00]第十五句
[01:25.00]第十六句
[01:30.00]第十七句
[01:35.00]第十八句
[01:40.00]第十九句
[01:45.00]终曲`
])

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

const displayLyricIndex = computed(() => {
  return currentLyricIndex.value
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
  if (sampleSongs.value.length > 0) {
    previousSong()
  }
}

function handleNext() {
  if (sampleSongs.value.length > 0) {
    nextSong()
  }
}

function setLyricsRef(el, index) {
  if (el) {
    lyricItemRefs.value[index] = el
  }
}

function scrollToCurrentLyric() {
  if (!showLyricsPanel.value) return
  
  const now = Date.now()
  if (now - lastScrollTime.value < SCROLL_THRESHOLD) return
  
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
        behavior: 'smooth'
      })
      
      lastScrollTime.value = now
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
  if (lyricsList.value.length > 0 && !isDraggingProgress.value) {
    const prevIndex = currentLyricIndex.value
    findCurrentLyricIndex(newTime)
    
    if (currentLyricIndex.value !== prevIndex) {
      nextTick(() => {
        scrollToCurrentLyric()
      })
    }
  }
})

watch(currentSong, (newSong) => {
  if (newSong) {
    const songIndex = sampleSongs.value.findIndex(s => s.id === newSong.id)
    if (songIndex !== -1 && sampleLyrics.value[songIndex]) {
      parseLyrics(sampleLyrics.value[songIndex])
      findCurrentLyricIndex(displayTime.value)
    } else {
      clearLyrics()
    }
  } else {
    clearLyrics()
  }
})

onMounted(() => {
  setPlaylist(sampleSongs.value, false)
  if (sampleLyrics.value[0]) {
    parseLyrics(sampleLyrics.value[0])
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
        <button class="control-btn lyrics-btn"
                @click="toggleLyricsPanel"
                :class="lyricsButtonColor"
                :title="showLyricsPanel ? '关闭歌词' : '显示歌词'">
          <svg viewBox="0 0 24 24" width="22" height="22">
            <path :d="lyricsButtonIcon" />
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
</style>
