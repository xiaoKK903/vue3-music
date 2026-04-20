import { ref } from 'vue'

export function useCounter(initialValue = 0) {
  const count = ref(initialValue)

  const increment = () => {
    count.value++
  }

  const decrement = () => {
    count.value--
  }

  const reset = (value = initialValue) => {
    count.value = value
  }

  return {
    count,
    increment,
    decrement,
    reset
  }
}
