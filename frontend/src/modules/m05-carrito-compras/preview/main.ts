import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import CartPreview from './CartPreview.vue'
import CartPreviewView from './CartPreviewView.vue'
import CartView from '../views/CartView.vue'
import '../../../style.css'

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    {
      path: '/',
      component: () => import('@/core/layouts/LayoutHome.vue'),
      children: [{ path: '', component: CartPreviewView }],
    },
    { path: '/api-cart', component: CartView },
  ],
})

const app = createApp(CartPreview)
app.use(createPinia())
app.use(router)

const isApiCartPreview = window.location.pathname === '/api-cart'
  || new URLSearchParams(window.location.search).get('route') === 'api-cart'
const initialRoute = isApiCartPreview ? '/api-cart' : '/'

void router.push(initialRoute).then(() => router.isReady()).then(() => {
  app.mount('#app')
})
