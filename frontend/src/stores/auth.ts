import { defineStore } from 'pinia';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  type User
} from 'firebase/auth';
import { auth } from '@/firebase';


export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as User | null,
    loading: true,
    error: null as string | null,
  }),

  actions: {

    async init() {
      return new Promise((resolve) => {
        onAuthStateChanged(auth, (user) => {
          this.user = user;
          this.loading = false;
          resolve(user);
        });
      });
    },
    async login(email: string, password: string) {
      try {
        this.loading = true;
        this.error = null;
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        this.user = userCredential.user;
        return userCredential;
      } catch (error: any) {
        this.error = error.message;
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async loginWithGoogle() {
      try {
        this.loading = true;
        this.error = null;
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        this.user = result.user;
        return result;
      } catch (error: any) {
        this.error = error.message;
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async register(email: string, password: string, firstName: string, lastName: string) {
      try {
        this.loading = true;
        this.error = null;
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        this.user = userCredential.user;

        // Here you can store additional user data in Firestore if needed
        // await setDoc(doc(db, 'users', userCredential.user.uid), {
        //   firstName,
        //   lastName,
        //   email,
        //   createdAt: new Date()
        // });

        return userCredential;
      } catch (error: any) {
        this.error = error.message;
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async logout() {
      try {
        await signOut(auth);
        this.user = null;
      } catch (error: any) {
        this.error = error.message;
        throw error;
      }
    },

  },
});