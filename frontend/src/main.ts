import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import { router } from './router';
import vuetify from './plugins/vuetify';
import '@/scss/style.scss';
import { PerfectScrollbarPlugin } from 'vue3-perfect-scrollbar';
import VueTablerIcons from 'vue-tabler-icons';
import VueApexCharts from 'vue3-apexcharts';
import Antd from 'ant-design-vue';
import 'ant-design-vue/dist/reset.css';

// Import the auth store
import { useAuthStore } from '@/stores/auth';

// google-fonts
import '@fontsource/public-sans/400.css';
import '@fontsource/public-sans/500.css';
import '@fontsource/public-sans/600.css';
import '@fontsource/public-sans/700.css';

//Mock Api data
import { fakeBackend } from '@/utils/helpers/fake-backend';

//i18
import { createI18n } from 'vue-i18n';
import messages from '@/utils/locales/messages';

const i18n = createI18n({
  locale: 'en',
  messages: messages,
  silentTranslationWarn: true,
  silentFallbackWarn: true
});

const app = createApp(App);
const pinia = createPinia();

fakeBackend();
app.use(router);
app.use(PerfectScrollbarPlugin);
app.use(pinia); // Initialize Pinia first
app.use(VueTablerIcons);
app.use(Antd);
app.use(i18n);
app.use(VueApexCharts);
app.use(vuetify);

// Initialize auth store after Pinia is installed but before mounting
const authStore = useAuthStore();
authStore.init();

// Mount the app last
app.mount('#app');