import { ref, computed, watch, onUnmounted, onMounted } from 'vue'

export const PlayMode = {
  LIST_LOOP: 'listLoop',
  SINGLE_LOOP: 'singleLoop',
  SHUFFLE: 'shuffle'
}

export const EQPresets = {
  NORMAL: 'normal',
  BASS_BOOST: 'bassBoost',
  POP: 'pop',
  CLASSICAL: 'classical',
  VOCAL: 'vocal',
  CUSTOM: 'custom'
}

export const eqPresetNames = {
  normal: '默认',
  bassBoost: '重低音',
  pop: '流行',
  classical: '古典',
  vocal: '人声增强',
  custom: '自定义'
}

export const eqBandFrequencies = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000]
export const eqBandLabels = ['32Hz', '64Hz', '125Hz', '250Hz', '500Hz', '1kHz', '2kHz', '4kHz', '8kHz', '16kHz']

export const eqPresetValues = {
  normal: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  bassBoost: [6, 6, 5, 3, 0, 0, 0, 0, 0, 0],
  pop: [-1, 2, 4, 4, 2, 0, -1, -1, 0, 2],
  classical: [4, 3, 2, 0, -1, -1, 0, 2, 3, 4],
  vocal: [-2, -1, 0, 2, 4, 4, 3, 2, 1, 0],
  custom: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
}

const STORAGE_KEYS = {
  VOLUME: 'music_player_volume',
  PLAY_MODE: 'music_player_play_mode',
  EQ_ENABLED: 'music_player_eq_enabled',
  EQ_PRESET: 'music_player_eq_preset',
  EQ_GAINS: 'music_player_eq_gains',
  SLEEP_TIMER: 'music_player_sleep_timer',
  PLAYLIST_ORDER: 'music_player_playlist_order'
}

function safeStorageGet(key, defaultValue) {
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

function safeStorageSet(key, value) {
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

function safeStorageRemove(key) {
  try {
    localStorage.removeItem(key)
    return true
  } catch (err) {
    console.warn(`Failed to remove localStorage key "${key}":`, err)
    return false
  }
}

function deepClone(obj) {
  try {
    return JSON.parse(JSON.stringify(obj))
  } catch (err) {
    console.warn('Deep clone failed:', err)
    return obj
  }
}

export function resetAllToDefault() {
  try {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key)
    })
    localStorage.removeItem('music_player_theme')
    localStorage.removeItem('music_player_lyrics_show')
    localStorage.removeItem('music_player_lyrics_font')
    localStorage.removeItem('music_player_config')
    localStorage.removeItem('music_player_playlist_order')
    return true
  } catch (err) {
    console.warn('Failed to reset all storage:', err)
    return false
  }
}

export function useAudioPlayer() {
  const audio = ref(null)
  const isPlaying = ref(false)
  
  const currentTime = ref(0)
  const duration = ref(0)
  
  const seekTargetTime = ref(null)
  const isSeeking = ref(false)
  const isDragging = ref(false)
  const dragTime = ref(0)
  
  const volume = ref(safeStorageGet(STORAGE_KEYS.VOLUME, 1))
  const isMuted = ref(false)
  const currentSong = ref(null)
  const currentIndex = ref(-1)
  const playlist = ref([])
  const originalPlaylist = ref([])
  const isLoading = ref(false)
  const error = ref(null)
  const playMode = ref(safeStorageGet(STORAGE_KEYS.PLAY_MODE, PlayMode.LIST_LOOP))
  const historyStack = ref([])
  const shuffleHistory = ref([])
  const shuffleIndex = ref(-1)
  const isUserAction = ref(false)

  const sleepTimerEnabled = ref(false)
  const sleepTimerDuration = ref(0)
  const sleepTimerRemaining = ref(0)
  const sleepTimerInterval = ref(null)

  const audioContext = ref(null)
  const sourceNode = ref(null)
  const masterGain = ref(null)
  const eqFilters = ref([])
  const eqEnabled = ref(safeStorageGet(STORAGE_KEYS.EQ_ENABLED, true))
  const currentEQPreset = ref(safeStorageGet(STORAGE_KEYS.EQ_PRESET, EQPresets.NORMAL))
  const eqBandGains = ref(safeStorageGet(STORAGE_KEYS.EQ_GAINS, [...eqPresetValues.normal]))
  const isAudioContextInitialized = ref(false)

  const playlistLoaded = ref(false)
  const isShuffled = ref(playMode.value === PlayMode.SHUFFLE)

  const displayTime = computed(() => {
    if (isDragging.value) {
      return dragTime.value
    }
    if (seekTargetTime.value !== null) {
      return seekTargetTime.value
    }
    return currentTime.value
  })

  const progress = computed(() => {
    if (duration.value === 0) return 0
    return (displayTime.value / duration.value) * 100
  })

  const formattedCurrentTime = computed(() => {
    return formatTime(displayTime.value)
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

  const sleepTimerRemainingFormatted = computed(() => {
    const seconds = sleepTimerRemaining.value
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  })

  const currentEQPresetName = computed(() => {
    return eqPresetNames[currentEQPreset.value] || '默认'
  })

  function formatTime(seconds) {
    if (isNaN(seconds) || !isFinite(seconds) || seconds < 0) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  function initAudioContext() {
    if (isAudioContextInitialized.value) return
    
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext
      audioContext.value = new AudioContextClass()
      
      masterGain.value = audioContext.value.createGain()
      masterGain.value.gain.value = volume.value
      
      eqFilters.value = eqBandFrequencies.map((freq, index) => {
        const filter = audioContext.value.createBiquadFilter()
        filter.type = 'peaking'
        filter.frequency.value = freq
        filter.Q.value = 1
        filter.gain.value = eqBandGains.value[index]
        return filter
      })
      
      let prevNode = masterGain.value
      for (let i = 0; i < eqFilters.value.length; i++) {
        prevNode.connect(eqFilters.value[i])
        prevNode = eqFilters.value[i]
      }
      
      prevNode.connect(audioContext.value.destination)
      
      isAudioContextInitialized.value = true
    } catch (err) {
      console.warn('Web Audio API 不支持，跳过均衡器初始化:', err)
      isAudioContextInitialized.value = false
    }
  }

  function connectAudioToEQ() {
    if (!audio.value || !isAudioContextInitialized.value) return
    
    if (sourceNode.value) {
      try {
        sourceNode.value.disconnect()
      } catch (err) {
        console.log('断开原音频连接失败，可能已断开')
      }
    }
    
    try {
      sourceNode.value = audioContext.value.createMediaElementSource(audio.value)
      
      if (eqEnabled.value) {
        sourceNode.value.connect(masterGain.value)
      } else {
        sourceNode.value.connect(audioContext.value.destination)
      }
    } catch (err) {
      console.warn('连接音频到均衡器失败:', err)
    }
  }

  function ensureAudioContextRunning() {
    if (audioContext.value && audioContext.value.state === 'suspended') {
      audioContext.value.resume().catch(err => {
        console.warn('无法恢复音频上下文:', err)
      })
    }
  }

  function updateEQBand(index, gain) {
    if (index < 0 || index >= eqBandGains.value.length) return
    
    const clampedGain = Math.max(-12, Math.min(12, gain))
    eqBandGains.value[index] = clampedGain
    
    if (eqFilters.value[index]) {
      eqFilters.value[index].gain.value = clampedGain
    }
    
    currentEQPreset.value = EQPresets.CUSTOM
    saveEQConfig()
  }

  function applyEQPreset(preset) {
    if (!eqPresetValues[preset]) return
    
    const values = eqPresetValues[preset]
    
    values.forEach((gain, index) => {
      eqBandGains.value[index] = gain
      if (eqFilters.value[index]) {
        eqFilters.value[index].gain.value = gain
      }
    })
    
    currentEQPreset.value = preset
    saveEQConfig()
  }

  function resetEQToDefault() {
    applyEQPreset(EQPresets.NORMAL)
  }

  function toggleEQEnabled() {
    eqEnabled.value = !eqEnabled.value
    saveEQConfig()
    
    if (!isAudioContextInitialized.value || !sourceNode.value) return
    
    try {
      sourceNode.value.disconnect()
      
      if (eqEnabled.value) {
        sourceNode.value.connect(masterGain.value)
      } else {
        sourceNode.value.connect(audioContext.value.destination)
      }
    } catch (err) {
      console.warn('切换均衡器状态失败:', err)
    }
  }

  function saveEQConfig() {
    safeStorageSet(STORAGE_KEYS.EQ_ENABLED, eqEnabled.value)
    safeStorageSet(STORAGE_KEYS.EQ_PRESET, currentEQPreset.value)
    safeStorageSet(STORAGE_KEYS.EQ_GAINS, [...eqBandGains.value])
  }

  function reorderPlaylist(fromIndex, toIndex) {
    if (fromIndex < 0 || fromIndex >= playlist.value.length) return
    if (toIndex < 0 || toIndex >= playlist.value.length) return
    if (fromIndex === toIndex) return

    const items = playlist.value.splice(fromIndex, 1)
    playlist.value.splice(toIndex, 0, ...items)

    if (currentIndex.value === fromIndex) {
      currentIndex.value = toIndex
    } else if (fromIndex < currentIndex.value && toIndex >= currentIndex.value) {
      currentIndex.value--
    } else if (fromIndex > currentIndex.value && toIndex <= currentIndex.value) {
      currentIndex.value++
    }

    savePlaylistOrder()
  }

  function moveToTop(index) {
    if (index <= 0 || index >= playlist.value.length) return

    const item = playlist.value.splice(index, 1)[0]
    playlist.value.unshift(item)

    if (currentIndex.value === index) {
      currentIndex.value = 0
    } else if (index > currentIndex.value) {
      currentIndex.value++
    } else if (index < currentIndex.value) {
      currentIndex.value--
    }

    savePlaylistOrder()
  }

  function removeFromPlaylist(index) {
    if (index < 0 || index >= playlist.value.length) return

    const removedSong = playlist.value[index]
    playlist.value.splice(index, 1)

    if (playlist.value.length === 0) {
      currentIndex.value = -1
      currentSong.value = null
      pause()
      audio.value.src = ''
      return
    }

    if (index === currentIndex.value) {
      if (index >= playlist.value.length) {
        currentIndex.value = playlist.value.length - 1
      }
      if (playlist.value.length > 0 && currentIndex.value >= 0) {
        loadSong(playlist.value[currentIndex.value], isPlaying.value, false)
      }
    } else if (index < currentIndex.value) {
      currentIndex.value--
    }

    savePlaylistOrder()
  }

  function clearPlaylist() {
    playlist.value = []
    originalPlaylist.value = []
    currentIndex.value = -1
    currentSong.value = null
    pause()
    if (audio.value) {
      audio.value.src = ''
    }
    safeStorageRemove(STORAGE_KEYS.PLAYLIST_ORDER)
  }

  function shufflePlaylist() {
    if (playlist.value.length <= 1) return

    const currentSongId = currentSong.value ? currentSong.value.id : null
    
    const indices = playlist.value.map((_, index) => index)
    
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]]
    }
    
    const newPlaylist = indices.map(index => playlist.value[index])
    
    if (currentSongId) {
      const currentPos = newPlaylist.findIndex(s => s.id === currentSongId)
      if (currentPos > 0) {
        const [song] = newPlaylist.splice(currentPos, 1)
        newPlaylist.unshift(song)
      }
    }
    
    playlist.value = newPlaylist
    
    if (currentSongId) {
      const newIndex = playlist.value.findIndex(s => s.id === currentSongId)
      if (newIndex !== -1) {
        currentIndex.value = newIndex
      }
    }

    isShuffled.value = true
    savePlaylistOrder()
  }

  function restorePlaylistOrder() {
    if (originalPlaylist.value.length === 0) return
    
    const currentSongId = currentSong.value ? currentSong.value.id : null
    
    playlist.value = deepClone(originalPlaylist.value)
    
    if (currentSongId) {
      const newIndex = playlist.value.findIndex(s => s.id === currentSongId)
      if (newIndex !== -1) {
        currentIndex.value = newIndex
      }
    }

    isShuffled.value = false
    savePlaylistOrder()
  }

  function toggleShuffle() {
    if (isShuffled.value) {
      restorePlaylistOrder()
      if (playMode.value === PlayMode.SHUFFLE) {
        setPlayMode(PlayMode.LIST_LOOP)
      }
    } else {
      if (originalPlaylist.value.length === 0) {
        originalPlaylist.value = deepClone(playlist.value)
      }
      shufflePlaylist()
      if (playMode.value !== PlayMode.SHUFFLE) {
        setPlayMode(PlayMode.SHUFFLE)
      }
    }
  }

  function savePlaylistOrder() {
    try {
      if (!playlist.value || !Array.isArray(playlist.value)) return
      
      const orderData = {
        ids: playlist.value.map(song => song.id),
        currentIndex: Math.max(0, Math.min(currentIndex.value, Math.max(0, playlist.value.length - 1))),
        isShuffled: isShuffled.value,
        timestamp: Date.now()
      }
      safeStorageSet(STORAGE_KEYS.PLAYLIST_ORDER, orderData)
    } catch (err) {
      console.warn('Failed to save playlist order:', err)
    }
  }

  function loadPlaylistOrder(songs) {
    try {
      const stored = safeStorageGet(STORAGE_KEYS.PLAYLIST_ORDER, null)
      
      if (!stored || !stored.ids || !Array.isArray(stored.ids)) {
        return null
      }

      const idToSong = new Map()
      songs.forEach(song => {
        if (song && song.id) {
          idToSong.set(song.id, song)
        }
      })

      const orderedSongs = []
      const usedIds = new Set()
      
      stored.ids.forEach(id => {
        if (idToSong.has(id) && !usedIds.has(id)) {
          orderedSongs.push(idToSong.get(id))
          usedIds.add(id)
        }
      })

      songs.forEach(song => {
        if (song && song.id && !usedIds.has(song.id)) {
          orderedSongs.push(song)
          usedIds.add(song.id)
        }
      })

      if (orderedSongs.length === 0) {
        return null
      }

      return {
        songs: orderedSongs,
        currentIndex: stored.currentIndex || 0,
        isShuffled: stored.isShuffled || false
      }
    } catch (err) {
      console.warn('Failed to load playlist order:', err)
      return null
    }
  }

  function setPlaylist(songs, autoPlayFirst = false) {
    if (!songs || !Array.isArray(songs) || songs.length === 0) {
      return
    }

    const validSongs = songs.filter(s => s && s.id && s.url)
    if (validSongs.length === 0) {
      return
    }

    originalPlaylist.value = deepClone(validSongs)
    
    const savedOrder = loadPlaylistOrder(validSongs)
    if (savedOrder) {
      playlist.value = savedOrder.songs
      isShuffled.value = savedOrder.isShuffled
    } else {
      playlist.value = deepClone(validSongs)
      isShuffled.value = false
    }
    
    historyStack.value = []
    shuffleHistory.value = []
    shuffleIndex.value = -1
    
    if (savedOrder && savedOrder.currentIndex >= 0 && savedOrder.currentIndex < playlist.value.length) {
      loadSong(playlist.value[savedOrder.currentIndex], autoPlayFirst, false)
    } else if (playlist.value.length > 0) {
      loadSong(playlist.value[0], autoPlayFirst, false)
    }

    playlistLoaded.value = true
  }

  function setPlayMode(mode) {
    if (Object.values(PlayMode).includes(mode)) {
      playMode.value = mode
      safeStorageSet(STORAGE_KEYS.PLAY_MODE, mode)
      
      if (mode === PlayMode.SHUFFLE) {
        if (!isShuffled.value) {
          if (originalPlaylist.value.length === 0) {
            originalPlaylist.value = deepClone(playlist.value)
          }
          shufflePlaylist()
        }
      } else {
        if (isShuffled.value && originalPlaylist.value.length > 0) {
          restorePlaylistOrder()
        }
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
    
    initAudioContext()
    
    audio.value = new Audio()
    audio.value.volume = volume.value
    audio.value.muted = isMuted.value
    audio.value.crossOrigin = 'anonymous'
    
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
    if (isDragging.value) {
      return
    }
    
    if (seekTargetTime.value !== null) {
      return
    }
    
    if (isSeeking.value) {
      return
    }
    
    currentTime.value = e.target.currentTime
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
        seekTargetTime.value = null
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
      seekTargetTime.value = null
    }
  }

  function handlePlay() {
    isPlaying.value = true
    ensureAudioContextRunning()
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
    
    if (audio.value) {
      const actualTime = audio.value.currentTime
      currentTime.value = actualTime
      seekTargetTime.value = null
    }
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
    
    currentTime.value = 0
    seekTargetTime.value = null
    isDragging.value = false
    dragTime.value = 0
    
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
    
    savePlaylistOrder()
    
    if (audio.value.src !== song.url) {
      audio.value.src = song.url
      audio.value.load()
      
      setTimeout(() => {
        if (isAudioContextInitialized.value) {
          connectAudioToEQ()
        }
      }, 100)
    } else {
      if (currentTime.value === 0 && duration.value > 0) {
        audio.value.currentTime = 0
      }
    }
    
    if (autoPlay) {
      audio.value.play().then(() => {
        ensureAudioContextRunning()
      }).catch(err => {
        console.error('自动播放失败:', err)
        error.value = '自动播放被浏览器阻止，请点击播放按钮'
      })
    }
  }

  function play() {
    if (audio.value && currentSong.value) {
      ensureAudioContextRunning()
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
      seekToTime(0)
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
      seekToTime(newTime)
    }
  }

  function seekToTime(time) {
    if (audio.value && duration.value > 0) {
      const clampedTime = Math.max(0, Math.min(time, duration.value))
      
      seekTargetTime.value = clampedTime
      currentTime.value = clampedTime
      
      audio.value.currentTime = clampedTime
    }
  }

  function startDragging() {
    isDragging.value = true
    dragTime.value = currentTime.value
  }

  function updateDragTime(progressPercent) {
    if (duration.value > 0) {
      dragTime.value = (progressPercent / 100) * duration.value
    }
  }

  function finishDragging(progressPercent) {
    isDragging.value = false
    seek(progressPercent)
  }

  function setVolume(value) {
    const clampedValue = Math.max(0, Math.min(1, value))
    volume.value = clampedValue
    
    if (audio.value) {
      audio.value.volume = clampedValue
    }
    if (masterGain.value) {
      masterGain.value.gain.value = clampedValue
    }
    
    isMuted.value = clampedValue === 0
    safeStorageSet(STORAGE_KEYS.VOLUME, clampedValue)
  }

  function toggleMute() {
    isMuted.value = !isMuted.value
    if (audio.value) {
      audio.value.muted = isMuted.value
    }
  }

  function startSleepTimer() {
    if (sleepTimerInterval.value) {
      clearInterval(sleepTimerInterval.value)
    }
    
    sleepTimerInterval.value = setInterval(() => {
      if (sleepTimerRemaining.value > 0) {
        sleepTimerRemaining.value--
        saveSleepTimerConfig()
      } else {
        stopSleepTimer()
        pause()
        saveSleepTimerConfig()
      }
    }, 1000)
  }

  function stopSleepTimer() {
    if (sleepTimerInterval.value) {
      clearInterval(sleepTimerInterval.value)
      sleepTimerInterval.value = null
    }
  }

  function saveSleepTimerConfig() {
    safeStorageSet(STORAGE_KEYS.SLEEP_TIMER, {
      enabled: sleepTimerEnabled.value,
      duration: sleepTimerDuration.value,
      remaining: sleepTimerRemaining.value
    })
  }

  function setSleepTimer(minutes) {
    if (minutes <= 0) {
      cancelSleepTimer()
      return
    }
    
    sleepTimerDuration.value = minutes
    sleepTimerRemaining.value = minutes * 60
    sleepTimerEnabled.value = true
    
    saveSleepTimerConfig()
    
    if (isPlaying.value) {
      startSleepTimer()
    }
  }

  function cancelSleepTimer() {
    stopSleepTimer()
    sleepTimerEnabled.value = false
    sleepTimerDuration.value = 0
    sleepTimerRemaining.value = 0
    saveSleepTimerConfig()
  }

  function adjustSleepTimer(minutes) {
    if (!sleepTimerEnabled.value) {
      return
    }
    
    const newRemaining = Math.max(0, sleepTimerRemaining.value + minutes * 60)
    sleepTimerRemaining.value = newRemaining
    sleepTimerDuration.value = Math.ceil(newRemaining / 60)
    
    if (newRemaining <= 0) {
      cancelSleepTimer()
    } else {
      saveSleepTimerConfig()
    }
  }

  function loadSleepTimerConfig() {
    const config = safeStorageGet(STORAGE_KEYS.SLEEP_TIMER, null)
    if (config) {
      if (config.enabled && config.remaining > 0) {
        sleepTimerEnabled.value = config.enabled
        sleepTimerDuration.value = config.duration || 0
        sleepTimerRemaining.value = config.remaining || 0
      }
    }
  }

  watch(volume, (newVolume) => {
    if (audio.value) {
      audio.value.volume = newVolume
    }
    if (masterGain.value) {
      masterGain.value.gain.value = newVolume
    }
  })

  watch(isMuted, (newMuted) => {
    if (audio.value) {
      audio.value.muted = newMuted
    }
  })

  watch(isPlaying, (nowPlaying) => {
    if (sleepTimerEnabled.value) {
      if (nowPlaying) {
        startSleepTimer()
      } else {
        stopSleepTimer()
      }
    }
  })

  onMounted(() => {
    if (!audio.value) {
      initAudio()
    }
    loadSleepTimerConfig()
  })

  onUnmounted(() => {
    cleanupAudio()
    stopSleepTimer()
    
    if (audioContext.value) {
      audioContext.value.close().catch(err => {
        console.log('关闭音频上下文失败:', err)
      })
    }
  })

  return {
    audio,
    isPlaying,
    currentTime,
    displayTime,
    duration,
    progress,
    volume,
    isMuted,
    currentSong,
    currentIndex,
    playlist,
    originalPlaylist,
    isLoading,
    error,
    playMode,
    isSeeking,
    isDragging,
    seekTargetTime,
    hasNext,
    hasPrevious,
    playModeLabel,
    PlayMode,
    sleepTimerEnabled,
    sleepTimerDuration,
    sleepTimerRemaining,
    sleepTimerRemainingFormatted,
    eqEnabled,
    currentEQPreset,
    currentEQPresetName,
    eqBandGains,
    eqBandFrequencies,
    eqBandLabels,
    EQPresets,
    eqPresetNames,
    eqPresetValues,
    isShuffled,
    playlistLoaded,
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
    seekToTime,
    startDragging,
    updateDragTime,
    finishDragging,
    setVolume,
    toggleMute,
    setSleepTimer,
    cancelSleepTimer,
    adjustSleepTimer,
    updateEQBand,
    applyEQPreset,
    resetEQToDefault,
    toggleEQEnabled,
    reorderPlaylist,
    moveToTop,
    removeFromPlaylist,
    clearPlaylist,
    shufflePlaylist,
    restorePlaylistOrder,
    toggleShuffle,
    savePlaylistOrder,
    formatTime
  }
}
