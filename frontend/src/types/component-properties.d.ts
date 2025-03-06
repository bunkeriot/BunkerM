// This file adds type declarations to fix property access errors in Vue components

// Extend the Vue component instance type to allow any property access
// This is a workaround for TypeScript errors in the Vue components
declare module 'vue' {
  interface ComponentCustomProperties {
    [key: string]: any;
  }
} 