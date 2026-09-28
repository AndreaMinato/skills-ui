import { createApp } from 'vue'
import App from './App.vue'
import './style.css'

createApp(App).mount('#app')

if (import.meta.env.DEV && import.meta.env.VITE_DEV_DRIVER)
  import('./devDriver').then(m => m.startDevDriver(import.meta.env.VITE_DEV_DRIVER))
