declare module 'vee-validate' {
  import { DefineComponent } from 'vue';
  
  export const Form: DefineComponent<{}, {}, any>;
  export const Field: DefineComponent<{}, {}, any>;
  export const ErrorMessage: DefineComponent<{}, {}, any>;
  export const useForm: any;
  export const useField: any;
} 