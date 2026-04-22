import { ref, computed } from 'vue'
import { useStorage } from './useStorage'
import { localSongs } from '../data/songs.js'

const { STORAGE_KEYS, getItem, setItem, removeItem, deepClone } = useStorage()

const allSongIds = localSongs.map(song => song.id)

export const defaultPlaylists = [
  {
    id: 'default',
    name: '默认歌单',
    icon: '📁',
    cover: null,
    songIds: [...allSongIds],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    description: '系统默认歌单'
  },
  {
    id: 'favorites',
    name: '我喜欢',
    icon: '❤️',
    cover: null,
    songIds: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    description: '收藏的歌曲'
  }
]

export function usePlaylists() {
  const playlists = ref([])
  const currentPlaylistId = ref('default')
  const isLoading = ref(false)
  const error = ref(null)

  const currentPlaylist = computed(() => {
    return playlists.value.find(p => p.id === currentPlaylistId.value) || null
  })

  const defaultPlaylist = computed(() => {
    return playlists.value.find(p => p.id === 'default') || null
  })

  const favoritesPlaylist = computed(() => {
    return playlists.value.find(p => p.id === 'favorites') || null
  })

  const playlistCount = computed(() => {
    return playlists.value.length
  })

  function initPlaylists() {
    try {
      isLoading.value = true
      const stored = getItem(STORAGE_KEYS.PLAYLISTS, null)
      const storedCurrentId = getItem(STORAGE_KEYS.CURRENT_PLAYLIST, 'default')
      
      let initializedPlaylists = []
      
      if (stored && Array.isArray(stored) && stored.length > 0) {
        initializedPlaylists = deepClone(stored)
        
        const defaultPlaylist = initializedPlaylists.find(p => p.id === 'default')
        if (!defaultPlaylist) {
          const newDefaultPlaylist = {
            id: 'default',
            name: '默认歌单',
            icon: '📁',
            cover: null,
            songIds: [...allSongIds],
            createdAt: Date.now(),
            updatedAt: Date.now(),
            description: '系统默认歌单'
          }
          initializedPlaylists.unshift(newDefaultPlaylist)
        } else {
          const existingSongIds = defaultPlaylist.songIds || []
          const missingSongIds = allSongIds.filter(id => !existingSongIds.includes(id))
          
          if (missingSongIds.length > 0) {
            defaultPlaylist.songIds = [...existingSongIds, ...missingSongIds]
            defaultPlaylist.updatedAt = Date.now()
          }
        }
        
        const favoritesPlaylist = initializedPlaylists.find(p => p.id === 'favorites')
        if (!favoritesPlaylist) {
          const newFavoritesPlaylist = {
            id: 'favorites',
            name: '我喜欢',
            icon: '❤️',
            cover: null,
            songIds: [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
            description: '收藏的歌曲'
          }
          const defaultIndex = initializedPlaylists.findIndex(p => p.id === 'default')
          if (defaultIndex !== -1) {
            initializedPlaylists.splice(defaultIndex + 1, 0, newFavoritesPlaylist)
          } else {
            initializedPlaylists.unshift(newFavoritesPlaylist)
          }
        }
        
        savePlaylists()
      } else {
        initializedPlaylists = deepClone(defaultPlaylists)
        savePlaylists()
      }
      
      playlists.value = initializedPlaylists
      
      const exists = playlists.value.find(p => p.id === storedCurrentId)
      if (exists) {
        currentPlaylistId.value = storedCurrentId
      } else {
        currentPlaylistId.value = 'default'
      }
      
      error.value = null
    } catch (err) {
      console.error('初始化歌单失败:', err)
      error.value = '初始化歌单失败'
      playlists.value = deepClone(defaultPlaylists)
      currentPlaylistId.value = 'default'
    } finally {
      isLoading.value = false
    }
  }

  function savePlaylists() {
    try {
      return setItem(STORAGE_KEYS.PLAYLISTS, playlists.value)
    } catch (err) {
      console.error('保存歌单失败:', err)
      return false
    }
  }

  function saveCurrentPlaylistId() {
    try {
      return setItem(STORAGE_KEYS.CURRENT_PLAYLIST, currentPlaylistId.value)
    } catch (err) {
      console.error('保存当前歌单失败:', err)
      return false
    }
  }

  function createPlaylist(name, options = {}) {
    try {
      const id = `playlist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const playlist = {
        id,
        name: name || '新歌单',
        icon: options.icon || '🎵',
        cover: options.cover || null,
        songIds: options.songIds || [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        description: options.description || ''
      }
      
      playlists.value.push(playlist)
      savePlaylists()
      
      return playlist
    } catch (err) {
      console.error('创建歌单失败:', err)
      error.value = '创建歌单失败'
      return null
    }
  }

  function deletePlaylist(id) {
    if (id === 'default' || id === 'favorites') {
      error.value = '系统歌单不可删除'
      return false
    }
    
    try {
      const index = playlists.value.findIndex(p => p.id === id)
      if (index === -1) {
        error.value = '歌单不存在'
        return false
      }
      
      if (currentPlaylistId.value === id) {
        currentPlaylistId.value = 'default'
        saveCurrentPlaylistId()
      }
      
      playlists.value.splice(index, 1)
      savePlaylists()
      
      return true
    } catch (err) {
      console.error('删除歌单失败:', err)
      error.value = '删除歌单失败'
      return false
    }
  }

  function updatePlaylist(id, updates) {
    try {
      const playlist = playlists.value.find(p => p.id === id)
      if (!playlist) {
        error.value = '歌单不存在'
        return false
      }
      
      Object.assign(playlist, {
        ...updates,
        updatedAt: Date.now()
      })
      
      savePlaylists()
      return true
    } catch (err) {
      console.error('更新歌单失败:', err)
      error.value = '更新歌单失败'
      return false
    }
  }

  function selectPlaylist(id) {
    const playlist = playlists.value.find(p => p.id === id)
    if (!playlist) {
      error.value = '歌单不存在'
      return false
    }
    
    currentPlaylistId.value = id
    saveCurrentPlaylistId()
    return true
  }

  function addSongToPlaylist(playlistId, songId) {
    try {
      const playlist = playlists.value.find(p => p.id === playlistId)
      if (!playlist) {
        error.value = '歌单不存在'
        return false
      }
      
      if (!playlist.songIds) {
        playlist.songIds = []
      }
      
      if (playlist.songIds.includes(songId)) {
        return true
      }
      
      playlist.songIds.push(songId)
      playlist.updatedAt = Date.now()
      savePlaylists()
      
      return true
    } catch (err) {
      console.error('添加歌曲到歌单失败:', err)
      error.value = '添加歌曲失败'
      return false
    }
  }

  function removeSongFromPlaylist(playlistId, songId) {
    try {
      const playlist = playlists.value.find(p => p.id === playlistId)
      if (!playlist) {
        error.value = '歌单不存在'
        return false
      }
      
      const index = playlist.songIds.indexOf(songId)
      if (index === -1) {
        return true
      }
      
      playlist.songIds.splice(index, 1)
      playlist.updatedAt = Date.now()
      savePlaylists()
      
      return true
    } catch (err) {
      console.error('从歌单移除歌曲失败:', err)
      error.value = '移除歌曲失败'
      return false
    }
  }

  function moveSongInPlaylist(playlistId, fromIndex, toIndex) {
    try {
      const playlist = playlists.value.find(p => p.id === playlistId)
      if (!playlist) {
        error.value = '歌单不存在'
        return false
      }
      
      if (fromIndex < 0 || fromIndex >= playlist.songIds.length ||
          toIndex < 0 || toIndex >= playlist.songIds.length) {
        return false
      }
      
      const [songId] = playlist.songIds.splice(fromIndex, 1)
      playlist.songIds.splice(toIndex, 0, songId)
      playlist.updatedAt = Date.now()
      savePlaylists()
      
      return true
    } catch (err) {
      console.error('移动歌曲位置失败:', err)
      error.value = '移动歌曲失败'
      return false
    }
  }

  function isSongInPlaylist(playlistId, songId) {
    const playlist = playlists.value.find(p => p.id === playlistId)
    if (!playlist) return false
    return playlist.songIds.includes(songId)
  }

  function isSongInFavorites(songId) {
    return isSongInPlaylist('favorites', songId)
  }

  function toggleFavorite(songId) {
    if (isSongInFavorites(songId)) {
      return removeSongFromPlaylist('favorites', songId)
    } else {
      return addSongToPlaylist('favorites', songId)
    }
  }

  function getPlaylistById(id) {
    return playlists.value.find(p => p.id === id) || null
  }

  function clearPlaylistSongs(playlistId) {
    if (playlistId === 'default') {
      error.value = '默认歌单不可清空'
      return false
    }
    
    try {
      const playlist = playlists.value.find(p => p.id === playlistId)
      if (!playlist) {
        error.value = '歌单不存在'
        return false
      }
      
      playlist.songIds = []
      playlist.updatedAt = Date.now()
      savePlaylists()
      
      return true
    } catch (err) {
      console.error('清空歌单失败:', err)
      error.value = '清空歌单失败'
      return false
    }
  }

  function resetAllPlaylists() {
    playlists.value = deepClone(defaultPlaylists)
    currentPlaylistId.value = 'default'
    savePlaylists()
    saveCurrentPlaylistId()
  }

  return {
    playlists,
    currentPlaylistId,
    currentPlaylist,
    defaultPlaylist,
    favoritesPlaylist,
    playlistCount,
    isLoading,
    error,
    
    initPlaylists,
    createPlaylist,
    deletePlaylist,
    updatePlaylist,
    selectPlaylist,
    addSongToPlaylist,
    removeSongFromPlaylist,
    moveSongInPlaylist,
    isSongInPlaylist,
    isSongInFavorites,
    toggleFavorite,
    getPlaylistById,
    clearPlaylistSongs,
    resetAllPlaylists,
    savePlaylists,
    saveCurrentPlaylistId
  }
}
