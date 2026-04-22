<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'

const props = defineProps({
  lyricsList: {
    type: Array,
    default: () => []
  },
  currentLyricIndex: {
    type: Number,
    default: -1
  },
  currentTime: {
    type: Number,
    default: 0
  },
  isPlaying: {
    type: Boolean,
    default: false
  },
  currentSong: {
    type: Object,
    default: null
  },
  show: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close', 'seekToTime'])

const lyricsContainerRef = ref(null)
const lyricItemRefs = ref([])
const isAnimating = ref(false)
const scrollInterval = ref(null)
const lastScrollTime = ref(0)
const SCROLL_THRESHOLD = 100

const coverRotation = ref(0)
const coverRotationInterval = ref(null)
const coverGlowIntensity = ref(0.5)

const currentLyric = computed(() => {
  if (props.currentLyricIndex >= 0 && props.currentLyricIndex < props.lyricsList.length) {
    return props.lyricsList[props.currentLyricIndex]
  }
  return null
})

const prevLyric = computed(() => {
  if (props.currentLyricIndex > 0) {
    return props.lyricsList[props.currentLyricIndex - 1]
  }
  return null
})

const nextLyric = computed(() => {
  if (props.currentLyricIndex < props.lyricsList.length - 1) {
    return props.lyricsList[props.currentLyricIndex + 1]
  }
  return null
})

const nextNextLyric = computed(() => {
  if (props.currentLyricIndex < props.lyricsList.length - 2) {
    return props.lyricsList[props.currentLyricIndex + 2]
  }
  return null
})

const backgroundStyle = computed(() => {
  const coverUrl = props.currentSong?.cover
  if (coverUrl) {
    return {
      backgroundImage: `url(${coverUrl})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center'
    }
  }
  return {}
})

const coverRotationStyle = computed(() => {
  return {
    transform: `rotate(${coverRotation.value}deg)`
  }
})

function setLyricRef(el, index) {
  if (el) {
    lyricItemRefs.value[index] = el
  }
}

function scrollToCurrentLyric(smooth = true) {
  if (!lyricsContainerRef.value) return
  if (props.currentLyricIndex < 0 || props.currentLyricIndex >= props.lyricsList.length) return
  
  const now = Date.now()
  if (now - lastScrollTime.value < SCROLL_THRESHOLD) return
  lastScrollTime.value = now
  
  const lyricEl = lyricItemRefs.value[props.currentLyricIndex]
  if (!lyricEl) return
  
  const container = lyricsContainerRef.value
  const lyricTop = lyricEl.offsetTop
  const containerHeight = container.clientHeight
  const lyricHeight = lyricEl.clientHeight
  
  const targetScrollTop = lyricTop - (containerHeight / 2) + (lyricHeight / 2)
  
  container.scrollTo({
    top: Math.max(0, targetScrollTop),
    behavior: smooth ? 'smooth' : 'auto'
  })
}

function handleLyricClick(index) {
  const lyric = props.lyricsList[index]
  if (lyric && lyric.time >= 0) {
    emit('seekToTime', lyric.time)
  }
}

function handleClose() {
  emit('close')
}

function handleKeydown(event) {
  if (event.key === 'Escape') {
    handleClose()
  }
}

function startCoverAnimation() {
  if (coverRotationInterval.value) {
    clearInterval(coverRotationInterval.value)
  }
  
  coverRotationInterval.value = setInterval(() => {
    coverRotation.value += 0.5
    if (coverRotation.value >= 360) {
      coverRotation.value = coverRotation.value % 360
    }
  }, 50)
}

function stopCoverAnimation() {
  if (coverRotationInterval.value) {
    clearInterval(coverRotationInterval.value)
    coverRotationInterval.value = null
  }
}

function startGlowAnimation() {
  if (scrollInterval.value) {
    clearInterval(scrollInterval.value)
  }
  
  let direction = 1
  scrollInterval.value = setInterval(() => {
    coverGlowIntensity.value += direction * 0.01
    if (coverGlowIntensity.value >= 1 || coverGlowIntensity.value <= 0.3) {
      direction = -direction
    }
  }, 100)
}

function stopGlowAnimation() {
  if (scrollInterval.value) {
    clearInterval(scrollInterval.value)
    scrollInterval.value = null
  }
}

watch(() => props.show, (newVal) => {
  if (newVal) {
    document.addEventListener('keydown', handleKeydown)
    if (props.isPlaying) {
      startCoverAnimation()
      startGlowAnimation()
    }
    nextTick(() => {
      scrollToCurrentLyric(false)
    })
  } else {
    document.removeEventListener('keydown', handleKeydown)
    stopCoverAnimation()
    stopGlowAnimation()
  }
}, { immediate: true })

watch(() => props.isPlaying, (newVal) => {
  if (props.show) {
    if (newVal) {
      startCoverAnimation()
      startGlowAnimation()
    } else {
      stopCoverAnimation()
      stopGlowAnimation()
    }
  }
})

watch(() => props.currentLyricIndex, () => {
  if (props.show) {
    nextTick(() => {
      scrollToCurrentLyric(true)
    })
  }
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  stopCoverAnimation()
  stopGlowAnimation()
})
</script>

<template>
  <Transition name="fullscreen-lyrics">
    <div v-if="show" class="fullscreen-lyrics-container" @click.self="handleClose">
      <div class="lyrics-background" :style="backgroundStyle"></div>
      <div class="lyrics-overlay"></div>
      
      <div class="close-btn" @click="handleClose">
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 6L6 18M6 6l12 12"/>
        </svg>
      </div>
      
      <div class="song-info-bar">
        <div class="mini-cover" :style="coverRotationStyle">
          <img v-if="currentSong?.cover" :src="currentSong.cover" :alt="currentSong.title" />
          <div v-else class="cover-placeholder">
            <span>♪</span>
          </div>
        </div>
        <div class="song-text">
          <h3 class="song-title">{{ currentSong?.title || '无歌曲' }}</h3>
          <p class="song-artist">{{ currentSong?.artist || '未知艺术家' }}</p>
        </div>
      </div>
      
      <div class="lyrics-main-area">
        <div v-if="lyricsList.length === 0" class="no-lyrics">
          <svg viewBox="0 0 24 24" width="64" height="64" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6z"/>
            <path d="M14 3v5h5M16 13H8M16 17H8M10 9H8"/>
          </svg>
          <p>当前歌曲暂无歌词</p>
        </div>
        
        <div v-else class="lyrics-scroll-container" ref="lyricsContainerRef">
          <div class="lyrics-padding-top"></div>
          
          <div v-for="(lyric, index) in lyricsList"
               :key="index"
               ref="(el) => setLyricRef(el, index)"
               class="lyric-line-full"
               :class="{
                 'active': currentLyricIndex === index,
                 'next': currentLyricIndex + 1 === index,
                 'next-next': currentLyricIndex + 2 === index,
                 'prev': currentLyricIndex - 1 === index
               }"
               @click="handleLyricClick(index)">
            <div class="lyric-text-wrapper">
              <span class="lyric-text">{{ lyric.text }}</span>
            </div>
          </div>
          
          <div class="lyrics-padding-bottom"></div>
        </div>
      </div>
      
      <div class="progress-indicator">
        <div class="progress-bar-full">
          <div class="progress-fill" :style="{ width: (currentTime / (currentSong?.duration || 180)) * 100 + '%' }"></div>
        </div>
        <div class="time-display">
          <span>{{ formatTime(currentTime) }}</span>
          <span class="separator">/</span>
          <span>{{ formatTime(currentSong?.duration || 0) }}</span>
        </div>
      </div>
      
      <div class="hint-text">
        <span>按 ESC 或点击空白处关闭</span>
        <span class="separator">|</span>
        <span>点击歌词跳转到对应时间</span>
      </div>
    </div>
  </Transition>
</template>

<script>
function formatTime(seconds) {
  if (!seconds || isNaN(seconds) || seconds < 0) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}
</script>

<style scoped>
.fullscreen-lyrics-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  color: white;
}

.lyrics-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-size: cover;
  background-position: center;
  filter: blur(40px) brightness(0.3);
  transform: scale(1.2);
}

.lyrics-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    180deg,
    rgba(0, 0, 0, 0.4) 0%,
    rgba(0, 0, 0, 0.2) 20%,
    rgba(0, 0, 0, 0.1) 50%,
    rgba(0, 0, 0, 0.3) 80%,
    rgba(0, 0, 0, 0.6) 100%
  );
}

.close-btn {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  z-index: 10;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: scale(1.1);
}

.song-info-bar {
  position: relative;
  z-index: 10;
  display: flex;
  align-items: center;
  padding: 20px 30px;
  margin-top: 20px;
}

.mini-cover {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  border: 3px solid rgba(255, 255, 255, 0.2);
}

.mini-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cover-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  font-size: 32px;
}

.song-text {
  margin-left: 20px;
}

.song-text .song-title {
  font-size: 28px;
  font-weight: 700;
  margin: 0 0 8px 0;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
}

.song-text .song-artist {
  font-size: 16px;
  margin: 0;
  opacity: 0.7;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
}

.lyrics-main-area {
  position: relative;
  z-index: 10;
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.no-lyrics {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  opacity: 0.5;
}

.no-lyrics p {
  margin-top: 20px;
  font-size: 18px;
}

.lyrics-scroll-container {
  flex: 1;
  overflow-y: auto;
  padding: 0 40px;
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
}

.lyrics-scroll-container::-webkit-scrollbar {
  width: 4px;
}

.lyrics-scroll-container::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
}

.lyrics-scroll-container::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
}

.lyrics-padding-top,
.lyrics-padding-bottom {
  height: 40vh;
}

.lyric-line-full {
  padding: 20px 0;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.lyric-text-wrapper {
  display: inline-block;
  position: relative;
}

.lyric-text {
  font-size: 32px;
  font-weight: 500;
  line-height: 1.6;
  letter-spacing: 1px;
  transition: all 0.3s ease;
  color: rgba(255, 255, 255, 0.4);
}

.lyric-line-full.prev .lyric-text {
  color: rgba(255, 255, 255, 0.5);
  font-size: 26px;
}

.lyric-line-full.next .lyric-text {
  color: rgba(255, 255, 255, 0.6);
  font-size: 28px;
}

.lyric-line-full.next-next .lyric-text {
  color: rgba(255, 255, 255, 0.5);
  font-size: 24px;
}

.lyric-line-full.active .lyric-text {
  color: white;
  font-size: 42px;
  font-weight: 700;
  text-shadow: 
    0 0 20px rgba(255, 255, 255, 0.5),
    0 4px 20px rgba(0, 0, 0, 0.3);
}

.lyric-line-full:hover:not(.active) {
  background: rgba(255, 255, 255, 0.05);
}

.lyric-line-full:hover:not(.active) .lyric-text {
  color: rgba(255, 255, 255, 0.7);
}

.progress-indicator {
  position: relative;
  z-index: 10;
  padding: 20px 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.progress-bar-full {
  width: 100%;
  max-width: 400px;
  height: 4px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  border-radius: 2px;
  transition: width 0.1s ease;
}

.time-display {
  margin-top: 12px;
  font-size: 14px;
  opacity: 0.7;
}

.time-display .separator {
  margin: 0 8px;
  opacity: 0.5;
}

.hint-text {
  position: relative;
  z-index: 10;
  text-align: center;
  padding: 10px 20px 30px;
  font-size: 13px;
  opacity: 0.5;
}

.hint-text .separator {
  margin: 0 10px;
  opacity: 0.3;
}

.fullscreen-lyrics-enter-active,
.fullscreen-lyrics-leave-active {
  transition: all 0.3s ease;
}

.fullscreen-lyrics-enter-from,
.fullscreen-lyrics-leave-to {
  opacity: 0;
}

@media (max-width: 768px) {
  .song-info-bar {
    padding: 15px 20px;
  }
  
  .mini-cover {
    width: 60px;
    height: 60px;
  }
  
  .song-text .song-title {
    font-size: 22px;
  }
  
  .song-text .song-artist {
    font-size: 14px;
  }
  
  .lyrics-scroll-container {
    padding: 0 20px;
  }
  
  .lyric-text {
    font-size: 24px;
  }
  
  .lyric-line-full.active .lyric-text {
    font-size: 32px;
  }
  
  .progress-indicator {
    padding: 15px 20px;
  }
}
</style>
