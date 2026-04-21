import { ref, computed } from 'vue'

export function useLyrics() {
  const lyricsList = ref([])
  const currentLyricIndex = ref(-1)
  const showLyricsPanel = ref(false)
  const lastFoundTime = ref(-1)
  const lastFoundIndex = ref(-1)

  function parseLyrics(lyricsString) {
    if (!lyricsString) {
      lyricsList.value = []
      currentLyricIndex.value = -1
      lastFoundTime.value = -1
      lastFoundIndex.value = -1
      return []
    }

    const lines = lyricsString.split('\n')
    const lyrics = []

    const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/g
    const cleanTextRegex = /\[[^\]]*\]/g

    lines.forEach(line => {
      if (!line.trim()) return

      const timeMatches = [...line.matchAll(timeRegex)]

      if (timeMatches.length > 0) {
        let text = line.replace(cleanTextRegex, '').trim()

        if (text) {
          timeMatches.forEach(match => {
            const minutes = parseInt(match[1])
            const seconds = parseInt(match[2])
            const milliseconds = match[3].length === 3
              ? parseInt(match[3])
              : parseInt(match[3]) * 10

            const time = minutes * 60 + seconds + milliseconds / 1000

            lyrics.push({
              time,
              text: text,
              original: line
            })
          })
        }
      } else if (line.trim()) {
        const cleanLine = line.replace(cleanTextRegex, '').trim()
        if (cleanLine) {
          lyrics.push({
            time: lyrics.length > 0 ? lyrics[lyrics.length - 1].time + 5 : 0,
            text: cleanLine,
            original: line
          })
        }
      }
    })

    lyrics.sort((a, b) => a.time - b.time)

    lyricsList.value = lyrics
    currentLyricIndex.value = -1
    lastFoundTime.value = -1
    lastFoundIndex.value = -1
    return lyrics
  }

  function findCurrentLyricIndex(currentTime) {
    const lyrics = lyricsList.value

    if (lyrics.length === 0) {
      currentLyricIndex.value = -1
      return -1
    }

    if (currentTime < lyrics[0].time) {
      currentLyricIndex.value = -1
      lastFoundTime.value = currentTime
      lastFoundIndex.value = -1
      return -1
    }

    if (lastFoundIndex.value >= 0 && 
        lastFoundIndex.value < lyrics.length - 1 &&
        currentTime >= lastFoundTime.value &&
        currentTime < lyrics[lastFoundIndex.value + 1].time) {
      return lastFoundIndex.value
    }

    let low = 0
    let high = lyrics.length - 1
    let result = -1

    while (low <= high) {
      const mid = Math.floor((low + high) / 2)
      
      if (lyrics[mid].time <= currentTime) {
        result = mid
        low = mid + 1
      } else {
        high = mid - 1
      }
    }

    currentLyricIndex.value = result
    lastFoundTime.value = currentTime
    lastFoundIndex.value = result
    return result
  }

  function getLyricForTime(time) {
    const lyrics = lyricsList.value
    if (lyrics.length === 0) return null
    
    let low = 0
    let high = lyrics.length - 1
    let result = null

    while (low <= high) {
      const mid = Math.floor((low + high) / 2)
      
      if (lyrics[mid].time <= time) {
        result = lyrics[mid]
        low = mid + 1
      } else {
        high = mid - 1
      }
    }

    return result
  }

  function seekToLyric(index) {
    const lyrics = lyricsList.value
    if (index >= 0 && index < lyrics.length) {
      currentLyricIndex.value = index
      return lyrics[index].time
    }
    return null
  }

  const currentLyric = computed(() => {
    if (currentLyricIndex.value >= 0 && currentLyricIndex.value < lyricsList.value.length) {
      return lyricsList.value[currentLyricIndex.value]
    }
    return null
  })

  const prevLyric = computed(() => {
    if (currentLyricIndex.value > 0 && currentLyricIndex.value <= lyricsList.value.length) {
      return lyricsList.value[currentLyricIndex.value - 1]
    }
    return null
  })

  const nextLyric = computed(() => {
    if (currentLyricIndex.value >= -1 && currentLyricIndex.value < lyricsList.value.length - 1) {
      return lyricsList.value[currentLyricIndex.value + 1]
    }
    return null
  })

  function toggleLyricsPanel() {
    showLyricsPanel.value = !showLyricsPanel.value
  }

  function setLyricsPanelVisible(visible) {
    showLyricsPanel.value = visible
  }

  function clearLyrics() {
    lyricsList.value = []
    currentLyricIndex.value = -1
    lastFoundTime.value = -1
    lastFoundIndex.value = -1
  }

  return {
    lyricsList,
    currentLyricIndex,
    currentLyric,
    prevLyric,
    nextLyric,
    showLyricsPanel,
    parseLyrics,
    findCurrentLyricIndex,
    getLyricForTime,
    seekToLyric,
    toggleLyricsPanel,
    setLyricsPanelVisible,
    clearLyrics
  }
}
