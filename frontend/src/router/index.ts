import { createRouter, createWebHistory } from 'vue-router';
import MainRoutes from './MainRoutes';
import AuthRoutes from './AuthRoutes';
import { useAuthStore } from '@/stores/auth';
import { useUIStore } from '@/stores/ui';

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/:pathMatch(.*)*',
      component: () => import('@/views/pages/maintenance/error/Error404Page.vue')
    },
    MainRoutes,
    AuthRoutes
  ]
});

router.beforeEach(async (to, from, next) => {
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
  const authStore = useAuthStore();

  // Wait for the auth store to initialize
  if (authStore.loading) {
    await authStore.init();
  }

  if (requiresAuth && !authStore.user) {
    next('/auth/login');
  } else if (to.path.includes('/auth') && authStore.user) {
    next('/dashboard'); // Redirect to dashboard if user is already logged in
  } else {
    next();
  }
});

router.beforeEach(() => {
  const uiStore = useUIStore();
  uiStore.isLoading = true;
});

router.afterEach(() => {
  const uiStore = useUIStore();
  uiStore.isLoading = false;
});
