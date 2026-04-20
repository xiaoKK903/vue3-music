import { ref, computed, watch, onUnmounted } from 'vue'

export function useAudioPlayer() {
  const audio = ref(null)
  const isPlaying = ref(false)
  const currentTime = ref(0)
  const duration = ref(0)
  const volume = ref(1)
  const isMuted = ref(false)
  const currentSong = ref(null)
  const currentIndex = ref(-1)
  const playlist = ref([])
  const isLoading = ref(false)
  const error = ref(null)

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

  const hasNext = computed(() => {
    return playlist.value.length > 0 && currentIndex.value < playlist.value.length - 1
  })

  const hasPrevious = computed(() => {
    return currentIndex.value > 0
  })

  function formatTime(seconds) {
    if (isNaN(seconds) || !isFinite(seconds) || seconds < 0) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  function setPlaylist(songs, autoPlayFirst = false) {
    playlist.value = songs
    if (songs.length > 0) {
      loadSong(songs[0], autoPlayFirst)
    }
  }

  function initAudio() {
    if (audio.value) {
      cleanupAudio()
    }
    
    audio.value = new Audio()
    audio.value.volume = volume.value
    audio.value.muted = isMuted.value
    
    audio.value.addEventListener('timeupdate', handleTimeUpdate)
    audio.value.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.value.addEventListener('ended', handleEnded)
    audio.value.addEventListener('play', handlePlay)
    audio.value.addEventListener('pause', handlePause)
    audio.value.addEventListener('waiting', handleWaiting)
    audio.value.addEventListener('canplay', handleCanPlay)
    audio.value.addEventListener('error', handleError)
    audio.value.addEventListener('loadstart', handleLoadStart)
    audio.value.addEventListener('loadeddata', handleLoadedData)
    audio.value.addEventListener('playing', handlePlaying)
  }

  function cleanupAudio() {
    if (audio.value) {
      audio.value.removeEventListener('timeupdate', handleTimeUpdate)
      audio.value.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.value.removeEventListener('ended', handleEnded)
      audio.value.removeEventListener('play', handlePlay)
      audio.value.removeEventListener('pause', handlePause)
      audio.value.removeEventListener('waiting', handleWaiting)
      audio.value.removeEventListener('canplay', handleCanPlay)
      audio.value.removeEventListener('error', handleError)
      audio.value.removeEventListener('loadstart', handleLoadStart)
      audio.value.removeEventListener('loadeddata', handleLoadedData)
      audio.value.removeEventListener('playing', handlePlaying)
      audio.value.pause()
      audio.value = null
    }
  }

  function handleTimeUpdate(e) {
    currentTime.value = e.target.currentTime
  }

  function handleLoadedMetadata(e) {
    duration.value = e.target.duration
    isLoading.value = false
  }

  function handleEnded() {
    isPlaying.value = false
    if (hasNext.value) {
      nextSong()
    } else {
      currentTime.value = 0
    }
  }

  function handlePlay() {
    isPlaying.value = true
  }

  function handlePause() {
    isPlaying.value = false
  }

  function handleWaiting() {
    isLoading.value = true
  }

  function handleCanPlay() {
    isLoading.value = false
  }

  function handleLoadStart() {
    isLoading.value = true
  }

  function handleLoadedData() {
    isLoading.value = false
  }

  function handlePlaying() {
    isLoading.value = false
  }

  function handleError(e) {
    console.error('音频加载失败:', e)
    error.value = '音频加载失败，请检查网络连接或音频URL'
    isLoading.value = false
    isPlaying.value = false
  }

  function loadSong(song, autoPlay = true) {
    if (!audio.value) {
      initAudio()
    }
    
    error.value = null
    currentSong.value = song
    
    const index = playlist.value.findIndex(s => s.id === song.id)
    if (index !== -1) {
      currentIndex.value = index
    }
    
    audio.value.src = song.url
    audio.value.load()
    
    if (autoPlay) {
      audio.value.play().catch(err => {
        console.error('自动播放失败:', err)
        error.value = '自动播放被浏览器阻止，请点击播放按钮'
      })
    }
  }

  function play() {
    if (audio.value && currentSong.value) {
      audio.value.play().catch(err => {
        console.error('播放失败:', err)
        error.value = '播放失败'
      })
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

  function nextSong() {
    if (hasNext.value) {
      loadSong(playlist.value[currentIndex.value + 1], true)
    }
  }

  function previousSong() {
    if (hasPrevious.value) {
      loadSong(playlist.value[currentIndex.value - 1], true)
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
    volume.value = value
    if (audio.value) {
      audio.value.volume = value
    }
    isMuted.value = value === 0
  }

  function toggleMute() {
    isMuted.value = !isMuted.value
    if (audio.value) {
      audio.value.muted = isMuted.value
    }
  }

  watch(volume, (newVolume) => {
    if (audio.value) {
      audio.value.volume = newVolume
    }
  })

  watch(isMuted, (newMuted) => {
    if (audio.value) {
      audio.value.muted = newMuted
    }
  })

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
    currentIndex,
    playlist,
    isLoading,
    error,
    hasNext,
    hasPrevious,
    formattedCurrentTime,
    formattedDuration,
    setPlaylist,
    loadSong,
    play,
    pause,
    togglePlay,
    nextSong,
    previousSong,
    seek,
    setVolume,
    toggleMute
  }
}
