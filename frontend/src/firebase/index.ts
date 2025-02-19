import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDf6WG9a48u2qDoeAfIbqwt3Z0QxH7SzFY",
  authDomain: "bunker-m.firebaseapp.com",
  projectId: "bunker-m",
  storageBucket: "bunker-m.firebasestorage.app",
  messagingSenderId: "1017702751216",
  appId: "1:1017702751216:web:cd9bfbf736c1505a025b35"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);