import { ref, computed } from 'vue'

export function useCounterStore() {
  const count = ref(0)
  const history = ref([])

  const doubleCount = computed(() => count.value * 2)

  const increment = () => {
    count.value++
    history.value.push({ type: 'increment', value: count.value, time: Date.now() })
  }

  const decrement = () => {
    count.value--
    history.value.push({ type: 'decrement', value: count.value, time: Date.now() })
  }

  const reset = (value = 0) => {
    count.value = value
    history.value.push({ type: 'reset', value: count.value, time: Date.now() })
  }

  const clearHistory = () => {
    history.value = []
  }

  return {
    count,
    doubleCount,
    history,
    increment,
    decrement,
    reset,
    clearHistory
  }
}
