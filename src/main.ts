import { createApp } from 'vue'
import 'jui-ui-vue/style.css'
import './style.css'
import './styles/index.less'
import App from './App.vue'
import { router } from './router'

createApp(App).use(router).mount('#app')
