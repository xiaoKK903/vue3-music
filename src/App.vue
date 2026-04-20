<script setup>
import { ref } from 'vue'
import MusicPlayer from './components/MusicPlayer.vue'

const title = ref('Vue3 音乐播放器')
</script>

<template>
  <div class="app">
    <header class="header">
      <h1>{{ title }}</h1>
    </header>

    <main class="main">
      <MusicPlayer />
    </main>
  </div>
</template>

<style scoped>
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.header {
  padding: 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  text-align: center;
}

.header h1 {
  margin: 0;
  font-size: 1.875rem;
  font-weight: 600;
}

.main {
  flex: 1;
  padding: 2rem;
  display: flex;
  justify-content: center;
  align-items: flex-start;
}
</style>
