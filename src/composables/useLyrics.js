import { ref, computed } from 'vue'

export function useLyrics() {
  const lyricsList = ref([])
  const currentLyricIndex = ref(-1)
  const showLyricsPanel = ref(false)

  function parseLyrics(lyricsString) {
    if (!lyricsString) {
      lyricsList.value = []
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
      return -1
    }

    let index = -1
    for (let i = 0; i < lyrics.length; i++) {
      if (currentTime >= lyrics[i].time) {
        index = i
      }
    }

    currentLyricIndex.value = index
    return index
  }

  const currentLyric = computed(() => {
    if (currentLyricIndex.value >= 0 && currentLyricIndex.value < lyricsList.value.length) {
      return lyricsList.value[currentLyricIndex.value]
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
  }

  return {
    lyricsList,
    currentLyricIndex,
    currentLyric,
    showLyricsPanel,
    parseLyrics,
    findCurrentLyricIndex,
    toggleLyricsPanel,
    setLyricsPanelVisible,
    clearLyrics
  }
}
