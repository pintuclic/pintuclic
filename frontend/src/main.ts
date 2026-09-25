import { createApp } from 'vue';
import { createPinia } from 'pinia';
<<<<<<< HEAD
import router from './core/routes';
import './style.css';
import App from './App.vue';

const app = createApp(App);
app.use(createPinia());
app.use(router);
=======
import './style.css';
import App from './App.vue';
import router from './core/routes';

const app = createApp(App);

app.use(createPinia());
app.use(router);

>>>>>>> 2ef493460a3531eb1ba1a145750138bfc779fc55
app.mount('#app');
