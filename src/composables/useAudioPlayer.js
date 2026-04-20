import { ref, computed, watch, onUnmounted } from 'vue'

export const PlayMode = {
  LIST_LOOP: 'listLoop',
  SINGLE_LOOP: 'singleLoop',
  SHUFFLE: 'shuffle'
}

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
  const playMode = ref(PlayMode.LIST_LOOP)
  const historyStack = ref([])
  const shuffleHistory = ref([])
  const shuffleIndex = ref(-1)
  const isUserAction = ref(false)
  const isSeeking = ref(false)

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
    return playlist.value.length > 0
  })

  const hasPrevious = computed(() => {
    return playlist.value.length > 0 && historyStack.value.length > 0
  })

  const playModeLabel = computed(() => {
    switch (playMode.value) {
      case PlayMode.LIST_LOOP:
        return '列表循环'
      case PlayMode.SINGLE_LOOP:
        return '单曲循环'
      case PlayMode.SHUFFLE:
        return '随机播放'
      default:
        return '列表循环'
    }
  })

  function formatTime(seconds) {
    if (isNaN(seconds) || !isFinite(seconds) || seconds < 0) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  function setPlaylist(songs, autoPlayFirst = false) {
    playlist.value = songs
    historyStack.value = []
    shuffleHistory.value = []
    shuffleIndex.value = -1
    
    if (songs.length > 0) {
      loadSong(songs[0], autoPlayFirst, false)
    }
  }

  function setPlayMode(mode) {
    if (Object.values(PlayMode).includes(mode)) {
      playMode.value = mode
      
      if (mode === PlayMode.SHUFFLE) {
        generateShuffleOrder()
      }
    }
  }

  function togglePlayMode() {
    const modes = [PlayMode.LIST_LOOP, PlayMode.SINGLE_LOOP, PlayMode.SHUFFLE]
    const currentModeIndex = modes.indexOf(playMode.value)
    const nextModeIndex = (currentModeIndex + 1) % modes.length
    setPlayMode(modes[nextModeIndex])
  }

  function generateShuffleOrder() {
    shuffleHistory.value = []
    shuffleIndex.value = -1
    
    if (playlist.value.length === 0) return
    
    const indices = playlist.value.map((_, index) => index)
    
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]]
    }
    
    if (currentIndex.value !== -1) {
      const currentPos = indices.indexOf(currentIndex.value)
      if (currentPos !== -1) {
        indices.splice(currentPos, 1)
        indices.unshift(currentIndex.value)
      }
    }
    
    shuffleHistory.value = indices
    shuffleIndex.value = 0
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
    audio.value.addEventListener('seeked', handleSeeked)
    audio.value.addEventListener('seeking', handleSeeking)
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
      audio.value.removeEventListener('seeked', handleSeeked)
      audio.value.removeEventListener('seeking', handleSeeking)
      audio.value.pause()
      audio.value = null
    }
  }

  function handleTimeUpdate(e) {
    if (!isSeeking.value) {
      currentTime.value = e.target.currentTime
    }
  }

  function handleLoadedMetadata(e) {
    duration.value = e.target.duration
    isLoading.value = false
  }

  function handleEnded() {
    isPlaying.value = false
    
    if (playMode.value === PlayMode.SINGLE_LOOP) {
      if (audio.value) {
        audio.value.currentTime = 0
        currentTime.value = 0
        audio.value.play().catch(err => {
          console.error('单曲循环播放失败:', err)
        })
      }
      return
    }
    
    if (hasNext.value) {
      nextSong()
    } else if (playMode.value === PlayMode.LIST_LOOP && playlist.value.length > 0) {
      loadSong(playlist.value[0], true, false)
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

  function handleSeeked() {
    isSeeking.value = false
  }

  function handleSeeking() {
    isSeeking.value = true
  }

  function handleError(e) {
    console.error('音频加载失败:', e)
    error.value = '音频加载失败，请检查网络连接或音频URL'
    isLoading.value = false
    isPlaying.value = false
  }

  function loadSong(song, autoPlay = true, recordHistory = true) {
    if (!song) return
    
    if (!audio.value) {
      initAudio()
    }
    
    if (recordHistory && currentSong.value && currentSong.value.id !== song.id) {
      if (historyStack.value.length === 0 || 
          historyStack.value[historyStack.value.length - 1].id !== currentSong.value.id) {
        historyStack.value.push({
          id: currentSong.value.id,
          song: currentSong.value,
          index: currentIndex.value,
          time: currentTime.value
        })
        
        if (historyStack.value.length > 50) {
          historyStack.value.shift()
        }
      }
    }
    
    error.value = null
    currentSong.value = song
    
    const index = playlist.value.findIndex(s => s.id === song.id)
    if (index !== -1) {
      currentIndex.value = index
      
      if (playMode.value === PlayMode.SHUFFLE) {
        const shufflePos = shuffleHistory.value.indexOf(index)
        if (shufflePos !== -1) {
          shuffleIndex.value = shufflePos
        }
      }
    }
    
    if (audio.value.src !== song.url) {
      audio.value.src = song.url
      audio.value.load()
    } else {
      if (currentTime.value === 0 && duration.value > 0) {
        audio.value.currentTime = 0
      }
    }
    
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

  function getNextIndex() {
    const len = playlist.value.length
    if (len === 0) return -1
    
    switch (playMode.value) {
      case PlayMode.SINGLE_LOOP:
        return currentIndex.value
      
      case PlayMode.SHUFFLE:
        if (shuffleHistory.value.length === 0) {
          generateShuffleOrder()
        }
        
        if (shuffleIndex.value < shuffleHistory.value.length - 1) {
          shuffleIndex.value++
          return shuffleHistory.value[shuffleIndex.value]
        } else {
          generateShuffleOrder()
          shuffleIndex.value = 0
          if (shuffleHistory.value.length > 0 && 
              shuffleHistory.value[0] === currentIndex.value && len > 1) {
            shuffleIndex.value = 1
            return shuffleHistory.value[1]
          }
          return shuffleHistory.value[0]
        }
      
      case PlayMode.LIST_LOOP:
      default:
        if (currentIndex.value < len - 1) {
          return currentIndex.value + 1
        } else {
          return 0
        }
    }
  }

  function getPreviousIndex() {
    const len = playlist.value.length
    if (len === 0) return -1
    
    if (historyStack.value.length > 0 && playMode.value === PlayMode.SHUFFLE) {
      const lastHistory = historyStack.value[historyStack.value.length - 1]
      const index = playlist.value.findIndex(s => s.id === lastHistory.id)
      if (index !== -1) {
        return index
      }
    }
    
    switch (playMode.value) {
      case PlayMode.SINGLE_LOOP:
        return currentIndex.value
      
      case PlayMode.SHUFFLE:
        if (shuffleIndex.value > 0) {
          shuffleIndex.value--
          return shuffleHistory.value[shuffleIndex.value]
        } else {
          return len - 1
        }
      
      case PlayMode.LIST_LOOP:
      default:
        if (currentIndex.value > 0) {
          return currentIndex.value - 1
        } else {
          return len - 1
        }
    }
  }

  function nextSong() {
    const len = playlist.value.length
    if (len === 0) return
    
    const nextIndex = getNextIndex()
    if (nextIndex !== -1 && nextIndex < len) {
      isUserAction.value = true
      loadSong(playlist.value[nextIndex], true, true)
      isUserAction.value = false
    }
  }

  function previousSong() {
    const len = playlist.value.length
    if (len === 0) return
    
    if (audio.value && audio.value.currentTime > 3) {
      audio.value.currentTime = 0
      currentTime.value = 0
      return
    }
    
    const prevIndex = getPreviousIndex()
    if (prevIndex !== -1 && prevIndex < len) {
      isUserAction.value = true
      
      if (historyStack.value.length > 0 && playMode.value === PlayMode.SHUFFLE) {
        const lastHistory = historyStack.value.pop()
        loadSong(lastHistory.song, true, false)
      } else {
        loadSong(playlist.value[prevIndex], true, false)
      }
      
      isUserAction.value = false
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
    playMode,
    hasNext,
    hasPrevious,
    playModeLabel,
    PlayMode,
    setPlaylist,
    setPlayMode,
    togglePlayMode,
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
