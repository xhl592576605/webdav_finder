import 'normalize.css'
import './assets/main.scss'
import 'ant-design-vue/dist/reset.css'
import '@imengyu/vue3-context-menu/lib/vue3-context-menu.css'

import { createApp } from 'vue'
import Antd from 'ant-design-vue'
import ContextMenu from '@imengyu/vue3-context-menu'

import App from './App.vue'

createApp(App).use(Antd).use(ContextMenu).mount('#app')
