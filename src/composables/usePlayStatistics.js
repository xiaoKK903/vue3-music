import { ref, computed } from 'vue'
import { useStorage } from './useStorage'

const { STORAGE_KEYS, getItem, setItem, deepClone } = useStorage()

export const defaultPlayStatistics = {
  totalPlayTime: 0,
  totalPlayCount: 0,
  songPlayCounts: {},
  songPlayTimes: {},
  firstPlayDate: null,
  lastPlayDate: null,
  dailyStats: {},
  weeklyStats: {},
  favoriteGenres: {}
}

export function usePlayStatistics() {
  const statistics = ref(deepClone(defaultPlayStatistics))
  const isLoading = ref(false)
  const error = ref(null)

  const mostPlayedSongs = computed(() => {
    const songs = Object.entries(statistics.value.songPlayCounts)
      .map(([id, count]) => ({ id: parseInt(id), count }))
      .sort((a, b) => b.count - a.count)
    return songs
  })

  const top10Songs = computed(() => {
    return mostPlayedSongs.value.slice(0, 10)
  })

  const totalListenTimeFormatted = computed(() => {
    const seconds = Math.floor(statistics.value.totalPlayTime / 1000)
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    
    if (hours > 0) {
      return `${hours}小时${minutes}分钟`
    }
    return `${minutes}分钟`
  })

  const activeDays = computed(() => {
    return Object.keys(statistics.value.dailyStats).length
  })

  const todayPlayCount = computed(() => {
    const today = new Date().toISOString().split('T')[0]
    return statistics.value.dailyStats[today] || 0
  })

  const todayPlayTime = computed(() => {
    const today = new Date().toISOString().split('T')[0]
    return statistics.value.dailyStats[`${today}_time`] || 0
  })

  function initStatistics() {
    try {
      isLoading.value = true
      const stored = getItem(STORAGE_KEYS.PLAY_STATISTICS, null)
      
      if (stored) {
        statistics.value = {
          ...deepClone(defaultPlayStatistics),
          ...stored
        }
      } else {
        statistics.value = deepClone(defaultPlayStatistics)
      }
      
      error.value = null
    } catch (err) {
      console.error('初始化播放统计失败:', err)
      error.value = '初始化播放统计失败'
      statistics.value = deepClone(defaultPlayStatistics)
    } finally {
      isLoading.value = false
    }
  }

  function saveStatistics() {
    try {
      return setItem(STORAGE_KEYS.PLAY_STATISTICS, statistics.value)
    } catch (err) {
      console.error('保存播放统计失败:', err)
      return false
    }
  }

  function recordSongPlay(songId, duration) {
    try {
      if (!songId) return
      
      const songKey = String(songId)
      const now = Date.now()
      const today = new Date().toISOString().split('T')[0]
      
      statistics.value.totalPlayCount++
      
      if (!statistics.value.firstPlayDate) {
        statistics.value.firstPlayDate = now
      }
      statistics.value.lastPlayDate = now
      
      if (!statistics.value.songPlayCounts[songKey]) {
        statistics.value.songPlayCounts[songKey] = 0
      }
      statistics.value.songPlayCounts[songKey]++
      
      if (!statistics.value.songPlayTimes[songKey]) {
        statistics.value.songPlayTimes[songKey] = 0
      }
      if (duration && duration > 0) {
        statistics.value.songPlayTimes[songKey] += duration
        statistics.value.totalPlayTime += duration
      }
      
      if (!statistics.value.dailyStats[today]) {
        statistics.value.dailyStats[today] = 0
      }
      statistics.value.dailyStats[today]++
      
      if (!statistics.value.dailyStats[`${today}_time`]) {
        statistics.value.dailyStats[`${today}_time`] = 0
      }
      if (duration && duration > 0) {
        statistics.value.dailyStats[`${today}_time`] += duration
      }
      
      saveStatistics()
    } catch (err) {
      console.error('记录播放统计失败:', err)
    }
  }

  function recordPlayTime(duration) {
    try {
      if (!duration || duration <= 0) return
      
      statistics.value.totalPlayTime += duration
      
      const today = new Date().toISOString().split('T')[0]
      if (!statistics.value.dailyStats[`${today}_time`]) {
        statistics.value.dailyStats[`${today}_time`] = 0
      }
      statistics.value.dailyStats[`${today}_time`] += duration
      
      saveStatistics()
    } catch (err) {
      console.error('记录播放时长失败:', err)
    }
  }

  function getSongPlayCount(songId) {
    if (!songId) return 0
    const songKey = String(songId)
    return statistics.value.songPlayCounts[songKey] || 0
  }

  function getSongPlayTime(songId) {
    if (!songId) return 0
    const songKey = String(songId)
    return statistics.value.songPlayTimes[songKey] || 0
  }

  function getWeeklyStats() {
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    
    const stats = {
      playCount: 0,
      playTime: 0,
      daily: []
    }
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      
      const dayStat = {
        date: dateStr,
        count: statistics.value.dailyStats[dateStr] || 0,
        time: statistics.value.dailyStats[`${dateStr}_time`] || 0
      }
      
      stats.daily.push(dayStat)
      stats.playCount += dayStat.count
      stats.playTime += dayStat.time
    }
    
    return stats
  }

  function resetStatistics() {
    statistics.value = deepClone(defaultPlayStatistics)
    saveStatistics()
  }

  function formatPlayTime(ms) {
    const seconds = Math.floor(ms / 1000)
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hours > 0) {
      return `${hours}时${minutes}分${secs}秒`
    } else if (minutes > 0) {
      return `${minutes}分${secs}秒`
    }
    return `${secs}秒`
  }

  return {
    statistics,
    isLoading,
    error,
    mostPlayedSongs,
    top10Songs,
    totalListenTimeFormatted,
    activeDays,
    todayPlayCount,
    todayPlayTime,
    
    initStatistics,
    saveStatistics,
    recordSongPlay,
    recordPlayTime,
    getSongPlayCount,
    getSongPlayTime,
    getWeeklyStats,
    resetStatistics,
    formatPlayTime
  }
}
