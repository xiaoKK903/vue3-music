import { ref, computed } from 'vue'
import { useStorage } from './useStorage'

const { STORAGE_KEYS, getItem, setItem, deepClone } = useStorage()

export const SpatialPresets = {
  NORMAL: 'normal',
  STEREO_WIDE: 'stereo_wide',
  VIRTUAL_SURROUND: 'virtual_surround',
  LIVE: 'live',
  THEATER: 'theater',
  CLUB: 'club',
  BATHROOM: 'bathroom',
  SMALL_ROOM: 'small_room',
  LARGE_HALL: 'large_hall'
}

export const ReverbPresets = {
  NONE: 'none',
  SMALL: 'small',
  MEDIUM: 'medium',
  LARGE: 'large',
  HALL: 'hall',
  PLATE: 'plate',
  SPRING: 'spring',
  AMBIENCE: 'ambience'
}

export const spatialPresetNames = {
  [SpatialPresets.NORMAL]: '正常',
  [SpatialPresets.STEREO_WIDE]: '宽立体声',
  [SpatialPresets.VIRTUAL_SURROUND]: '虚拟环绕',
  [SpatialPresets.LIVE]: '现场',
  [SpatialPresets.THEATER]: '影院',
  [SpatialPresets.CLUB]: '俱乐部',
  [SpatialPresets.BATHROOM]: '浴室',
  [SpatialPresets.SMALL_ROOM]: '小房间',
  [SpatialPresets.LARGE_HALL]: '大厅'
}

export const reverbPresetNames = {
  [ReverbPresets.NONE]: '无',
  [ReverbPresets.SMALL]: '小',
  [ReverbPresets.MEDIUM]: '中',
  [ReverbPresets.LARGE]: '大',
  [ReverbPresets.HALL]: '大厅',
  [ReverbPresets.PLATE]: '板式',
  [ReverbPresets.SPRING]: '弹簧',
  [ReverbPresets.AMBIENCE]: '氛围'
}

export const defaultSpatialConfig = {
  spatialEnabled: false,
  currentSpatialPreset: SpatialPresets.NORMAL,
  reverbEnabled: false,
  currentReverbPreset: ReverbPresets.NONE,
  reverbWet: 0.3,
  reverbDry: 0.7,
  spatialWidth: 0.5,
  spatialDepth: 0.5,
  panningEnabled: false,
  panning: 0
}

const reverbPresetParams = {
  [ReverbPresets.SMALL]: { decay: 1.2, preDelay: 0.02, density: 0.8 },
  [ReverbPresets.MEDIUM]: { decay: 2.0, preDelay: 0.03, density: 0.7 },
  [ReverbPresets.LARGE]: { decay: 3.5, preDelay: 0.05, density: 0.6 },
  [ReverbPresets.HALL]: { decay: 5.0, preDelay: 0.08, density: 0.5 },
  [ReverbPresets.PLATE]: { decay: 2.5, preDelay: 0.02, density: 0.9 },
  [ReverbPresets.SPRING]: { decay: 1.5, preDelay: 0.01, density: 0.95 },
  [ReverbPresets.AMBIENCE]: { decay: 8.0, preDelay: 0.1, density: 0.3 }
}

export function useSpatialAudio() {
  const config = ref(deepClone(defaultSpatialConfig))
  const isLoading = ref(false)
  const error = ref(null)
  
  let pannerNode = null
  let delayNode = null
  let gainNodeDry = null
  let gainNodeWet = null
  let convolverNode = null
  let isInitialized = false

  const availableSpatialPresets = computed(() => {
    return Object.entries(spatialPresetNames).map(([key, value]) => ({
      id: key,
      name: value
    }))
  })

  const availableReverbPresets = computed(() => {
    return Object.entries(reverbPresetNames).map(([key, value]) => ({
      id: key,
      name: value
    }))
  })

  const currentSpatialPresetName = computed(() => {
    return spatialPresetNames[config.value.currentSpatialPreset] || '正常'
  })

  const currentReverbPresetName = computed(() => {
    return reverbPresetNames[config.value.currentReverbPreset] || '无'
  })

  function initSpatialConfig() {
    try {
      isLoading.value = true
      const stored = getItem(STORAGE_KEYS.SPATIAL_CONFIG, null)
      
      if (stored) {
        config.value = {
          ...deepClone(defaultSpatialConfig),
          ...stored
        }
      }
      
      error.value = null
    } catch (err) {
      console.error('初始化空间音效配置失败:', err)
      error.value = '初始化空间音效配置失败'
      config.value = deepClone(defaultSpatialConfig)
    } finally {
      isLoading.value = false
    }
  }

  function saveSpatialConfig() {
    try {
      return setItem(STORAGE_KEYS.SPATIAL_CONFIG, config.value)
    } catch (err) {
      console.error('保存空间音效配置失败:', err)
      return false
    }
  }

  function initSpatialNodes(audioContext, sourceNode, destination) {
    if (!audioContext || !sourceNode) {
      return { outputNode: sourceNode }
    }
    
    try {
      isInitialized = true
      
      gainNodeDry = audioContext.createGain()
      gainNodeWet = audioContext.createGain()
      convolverNode = audioContext.createConvolver()
      pannerNode = audioContext.createStereoPanner()
      delayNode = audioContext.createDelay()
      
      updateGainValues()
      
      return {
        dry: gainNodeDry,
        wet: gainNodeWet,
        convolver: convolverNode,
        panner: pannerNode,
        delay: delayNode
      }
    } catch (err) {
      console.error('初始化空间音效节点失败:', err)
      isInitialized = false
      return { outputNode: sourceNode }
    }
  }

  function connectSpatialChain(sourceNode, dryGain, wetGain, convolver, panner, delay, destination) {
    if (!isInitialized || !config.value.reverbEnabled && !config.value.spatialEnabled && !config.value.panningEnabled) {
      return sourceNode
    }
    
    try {
      let currentNode = sourceNode
      
      if (config.value.panningEnabled && panner) {
        panner.pan.value = config.value.panning
        currentNode.connect(panner)
        currentNode = panner
      }
      
      if (config.value.spatialEnabled && config.value.currentSpatialPreset !== SpatialPresets.NORMAL) {
        currentNode = applySpatialPreset(currentNode, destination)
      }
      
      if (config.value.reverbEnabled && config.value.currentReverbPreset !== ReverbPresets.NONE) {
        currentNode.connect(dryGain)
        dryGain.connect(destination)
        
        currentNode.connect(delay)
        delay.connect(convolver)
        convolver.connect(wetGain)
        wetGain.connect(destination)
        
        applyReverbPreset()
      } else {
        currentNode.connect(destination)
      }
      
      return currentNode
    } catch (err) {
      console.error('连接空间音效链失败:', err)
      return sourceNode
    }
  }

  function applySpatialPreset(sourceNode, destination) {
    if (!sourceNode) return sourceNode
    
    const preset = config.value.currentSpatialPreset
    const audioContext = sourceNode.context
    
    if (!audioContext) return sourceNode
    
    try {
      switch (preset) {
        case SpatialPresets.STEREO_WIDE: {
          const delayLeft = audioContext.createDelay()
          const delayRight = audioContext.createDelay()
          const gainLeft = audioContext.createGain()
          const gainRight = audioContext.createGain()
          const merger = audioContext.createChannelMerger(2)
          
          delayLeft.delayTime.value = 0.01
          delayRight.delayTime.value = 0
          gainLeft.gain.value = config.value.spatialWidth
          gainRight.gain.value = config.value.spatialWidth
          
          sourceNode.connect(delayLeft)
          sourceNode.connect(delayRight)
          delayLeft.connect(gainLeft)
          delayRight.connect(gainRight)
          gainLeft.connect(merger, 0, 0)
          gainRight.connect(merger, 0, 1)
          
          return merger
        }
        
        case SpatialPresets.VIRTUAL_SURROUND: {
          const delay = audioContext.createDelay()
          const gain = audioContext.createGain()
          const filter = audioContext.createBiquadFilter()
          
          delay.delayTime.value = 0.02 * config.value.spatialDepth
          gain.gain.value = 0.3 + config.value.spatialDepth * 0.4
          filter.type = 'lowpass'
          filter.frequency.value = 8000
          
          sourceNode.connect(delay)
          delay.connect(filter)
          filter.connect(gain)
          gain.connect(sourceNode.context.destination)
          
          return sourceNode
        }
        
        default:
          return sourceNode
      }
    } catch (err) {
      console.error('应用空间预设失败:', err)
      return sourceNode
    }
  }

  function applyReverbPreset() {
    if (!config.value.reverbEnabled || !convolverNode) return
    
    const preset = config.value.currentReverbPreset
    if (preset === ReverbPresets.NONE) return
    
    const params = reverbPresetParams[preset]
    if (!params || !delayNode) return
    
    delayNode.delayTime.value = params.preDelay
    createReverbImpulse(params)
  }

  function createReverbImpulse(params) {
    if (!convolverNode || !convolverNode.context) return
    
    try {
      const audioContext = convolverNode.context
      const rate = audioContext.sampleRate
      const length = rate * params.decay
      const impulse = audioContext.createBuffer(2, length, rate)
      
      const leftChannel = impulse.getChannelData(0)
      const rightChannel = impulse.getChannelData(1)
      
      for (let i = 0; i < length; i++) {
        const decay = Math.exp(-i / (rate * params.decay * 0.1))
        const randomL = (Math.random() * 2 - 1) * decay
        const randomR = (Math.random() * 2 - 1) * decay
        
        leftChannel[i] = randomL * params.density
        rightChannel[i] = randomR * params.density
        
        if (i > rate * 0.01 && i < rate * 0.5) {
          const earlyReflection = Math.exp(-(i - rate * 0.01) / (rate * 0.1))
          leftChannel[i] += (Math.random() * 2 - 1) * earlyReflection * 0.3
          rightChannel[i] += (Math.random() * 2 - 1) * earlyReflection * 0.3
        }
      }
      
      convolverNode.buffer = impulse
    } catch (err) {
      console.error('创建混响脉冲响应失败:', err)
    }
  }

  function updateGainValues() {
    if (gainNodeDry && gainNodeWet) {
      const dry = config.value.reverbDry
      const wet = config.value.reverbWet
      const total = dry + wet
      
      gainNodeDry.gain.value = dry / total
      gainNodeWet.gain.value = wet / total
    }
  }

  function setSpatialPreset(preset) {
    if (!spatialPresetNames[preset]) return
    
    config.value.currentSpatialPreset = preset
    if (preset !== SpatialPresets.NORMAL) {
      config.value.spatialEnabled = true
    }
    saveSpatialConfig()
  }

  function setReverbPreset(preset) {
    if (!reverbPresetNames[preset]) return
    
    config.value.currentReverbPreset = preset
    if (preset !== ReverbPresets.NONE) {
      config.value.reverbEnabled = true
    }
    applyReverbPreset()
    saveSpatialConfig()
  }

  function toggleSpatialEnabled() {
    config.value.spatialEnabled = !config.value.spatialEnabled
    if (!config.value.spatialEnabled) {
      config.value.currentSpatialPreset = SpatialPresets.NORMAL
    }
    saveSpatialConfig()
  }

  function toggleReverbEnabled() {
    config.value.reverbEnabled = !config.value.reverbEnabled
    if (!config.value.reverbEnabled) {
      config.value.currentReverbPreset = ReverbPresets.NONE
    }
    saveSpatialConfig()
  }

  function setReverbWet(value) {
    config.value.reverbWet = Math.max(0, Math.min(1, value))
    updateGainValues()
    saveSpatialConfig()
  }

  function setReverbDry(value) {
    config.value.reverbDry = Math.max(0, Math.min(1, value))
    updateGainValues()
    saveSpatialConfig()
  }

  function setSpatialWidth(value) {
    config.value.spatialWidth = Math.max(0, Math.min(1, value))
    saveSpatialConfig()
  }

  function setSpatialDepth(value) {
    config.value.spatialDepth = Math.max(0, Math.min(1, value))
    saveSpatialConfig()
  }

  function setPanning(value) {
    config.value.panning = Math.max(-1, Math.min(1, value))
    if (pannerNode) {
      pannerNode.pan.value = config.value.panning
    }
    saveSpatialConfig()
  }

  function togglePanningEnabled() {
    config.value.panningEnabled = !config.value.panningEnabled
    saveSpatialConfig()
  }

  function resetSpatialConfig() {
    config.value = deepClone(defaultSpatialConfig)
    saveSpatialConfig()
  }

  return {
    config,
    isLoading,
    error,
    isInitialized,
    availableSpatialPresets,
    availableReverbPresets,
    currentSpatialPresetName,
    currentReverbPresetName,
    SpatialPresets,
    ReverbPresets,
    
    initSpatialConfig,
    saveSpatialConfig,
    initSpatialNodes,
    connectSpatialChain,
    setSpatialPreset,
    setReverbPreset,
    toggleSpatialEnabled,
    toggleReverbEnabled,
    setReverbWet,
    setReverbDry,
    setSpatialWidth,
    setSpatialDepth,
    setPanning,
    togglePanningEnabled,
    resetSpatialConfig,
    createReverbImpulse
  }
}
