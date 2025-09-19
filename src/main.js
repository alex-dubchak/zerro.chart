import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import pinia from './store';
import './chart-register.js';

function runApp() {
  console.log('App is starting...');
  createApp(App).use(pinia).mount('#app')
}

runApp()

export { runApp }

