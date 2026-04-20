import { ref, computed, onUnmounted } from 'vue'

export function useAudioPlayer() {
  const audio = ref(null)
  const isPlaying = ref(false)
  const currentTime = ref(0)
  const duration = ref(0)
  const volume = ref(1)
  const isMuted = ref(false)
  const currentSong = ref(null)

  const progress = computed(() => {
    if (duration.value === 0) return 0
    return (currentTime.value / duration.value) * 100
  })

  const formattedCurrentTime = computed(() => {
    return formatTime(currentTime.value)
  })

  const formattedDuration = computed(() => {
    return formatTime(duration.value)
  })

  function formatTime(seconds) {
    if (isNaN(seconds) || !isFinite(seconds)) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  function initAudio() {
    if (audio.value) {
      cleanupAudio()
    }
    audio.value = new Audio()
    
    audio.value.addEventListener('timeupdate', handleTimeUpdate)
    audio.value.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.value.addEventListener('ended', handleEnded)
    audio.value.addEventListener('play', handlePlay)
    audio.value.addEventListener('pause', handlePause)
  }

  function cleanupAudio() {
    if (audio.value) {
      audio.value.removeEventListener('timeupdate', handleTimeUpdate)
      audio.value.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.value.removeEventListener('ended', handleEnded)
      audio.value.removeEventListener('play', handlePlay)
      audio.value.removeEventListener('pause', handlePause)
      audio.value.pause()
      audio.value = null
    }
  }

  function handleTimeUpdate(e) {
    currentTime.value = e.target.currentTime
  }

  function handleLoadedMetadata(e) {
    duration.value = e.target.duration
  }

  function handleEnded() {
    isPlaying.value = false
    currentTime.value = 0
  }

  function handlePlay() {
    isPlaying.value = true
  }

  function handlePause() {
    isPlaying.value = false
  }

  function loadSong(song) {
    if (!audio.value) {
      initAudio()
    }
    
    currentSong.value = song
    audio.value.src = song.url
    audio.value.load()
  }

  function play() {
    if (audio.value) {
      audio.value.play()
    }
  }

  function pause() {
    if (audio.value) {
      audio.value.pause()
    }
  }

  function togglePlay() {
    if (isPlaying.value) {
      pause()
    } else {
      play()
    }
  }

  function seek(progressPercent) {
    if (audio.value && duration.value > 0) {
      const newTime = (progressPercent / 100) * duration.value
      audio.value.currentTime = newTime
      currentTime.value = newTime
    }
  }

  function setVolume(value) {
    if (audio.value) {
      volume.value = value
      audio.value.volume = value
      isMuted.value = value === 0
    }
  }

  function toggleMute() {
    if (audio.value) {
      isMuted.value = !isMuted.value
      audio.value.muted = isMuted.value
    }
  }

  initAudio()

  onUnmounted(() => {
    cleanupAudio()
  })

  return {
    audio,
    isPlaying,
    currentTime,
    duration,
    progress,
    volume,
    isMuted,
    currentSong,
    formattedCurrentTime,
    formattedDuration,
    loadSong,
    play,
    pause,
    togglePlay,
    seek,
    setVolume,
    toggleMute
  }
}
