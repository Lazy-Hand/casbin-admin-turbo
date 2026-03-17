import './styles/tailwind.css'
import './styles/styles.scss'
import './styles/index.scss'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { registerPermissionDirective } from '@/directives/permission'
import DynamicIcon from '@/components/Icon/DynamicIcon.vue'
const app = createApp(App)

import App from './App.vue'
import router from './router'
import { createRouterGuard } from './router/guard'
import i18n from '@/i18n'

const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(i18n)
app.component('AppIcon', DynamicIcon)
registerPermissionDirective(app, pinia)

createRouterGuard(router)
app.mount('#app')
