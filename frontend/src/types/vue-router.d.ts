declare module 'vue-router' {
  export * from 'vue-router/dist/vue-router';
  
  // Add missing exports
  export const RouterView: any;
  export const useRouter: any;
  export const createRouter: any;
  export const createWebHistory: any;
} 