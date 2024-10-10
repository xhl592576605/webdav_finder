import 'normalize.css'
import './assets/main.scss'
import 'ant-design-vue/dist/reset.css'

import { createApp } from 'vue'
import Antd from 'ant-design-vue'

import App from './App.vue'

createApp(App).use(Antd).mount('#app')
