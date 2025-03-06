declare module 'vue' {
  export * from 'vue/dist/vue';
  
  // Add missing exports
  export const ref: any;
  export const shallowRef: any;
  export const computed: any;
  export const onMounted: any;
  export const onUnmounted: any;
  export const createApp: any;
} 